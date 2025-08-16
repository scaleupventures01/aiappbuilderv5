import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { 
  generateFileId, 
  createImagePreview, 
  isImageFile, 
  isDocumentFile,
  formatFileSize
} from '../../utils/fileValidation';
import { getUploadService, checkUploadServer, getAuthStatus, type RetryConfig, type ServerStatus, type AuthStatus } from '../../services/uploadService';
import type { UploadFile, UploadProgress } from '../../types/upload';

interface FileDropzoneProps {
  // eslint-disable-next-line no-unused-vars
  onFilesAdded: (files: UploadFile[]) => void;
  // eslint-disable-next-line no-unused-vars
  onFileRemoved: (fileId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onUploadStart?: (files: UploadFile[]) => void;
  // eslint-disable-next-line no-unused-vars
  onUploadProgress?: (fileId: string, progress: number) => void;
  // eslint-disable-next-line no-unused-vars
  onUploadComplete?: (fileId: string, result: any) => void;
  // eslint-disable-next-line no-unused-vars
  onUploadError?: (fileId: string, error: string) => void;
  // eslint-disable-next-line no-unused-vars
  onAbortUpload?: (fileId: string) => void;
  disabled?: boolean;
  className?: string;
  maxFiles?: number;
  maxFileSizeImages?: number;
  maxFileSizeDocuments?: number;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesAdded,
  onFileRemoved,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onAbortUpload,
  disabled = false,
  className,
  maxFiles = 5, // PRD specifies max 5 files at once
  maxFileSizeImages = 15 * 1024 * 1024, // 15MB for images
  maxFileSizeDocuments = 25 * 1024 * 1024, // 25MB for documents
}) => {
  const [selectedFiles, setSelectedFiles] = useState<UploadFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [connectionErrors, setConnectionErrors] = useState<string[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isCheckingServer, setIsCheckingServer] = useState(false);
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars  
  const [_retryAttempts, setRetryAttempts] = useState<Map<string, { attempt: number; maxAttempts: number }>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadService = useRef(getUploadService());
  const statusCheckIntervalRef = useRef<number | null>(null);

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file type
    const isImage = isImageFile(file);
    const isDocument = isDocumentFile(file) || file.type === 'text/plain';
    
    if (!isImage && !isDocument) {
      return {
        isValid: false,
        error: 'Only images (JPEG, PNG, GIF, WebP), PDFs, and text files are allowed'
      };
    }

    // Check file size based on type
    const maxSize = isImage ? maxFileSizeImages : maxFileSizeDocuments;
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      return {
        isValid: false,
        error: `File size must be less than ${maxSizeMB}MB for ${isImage ? 'images' : 'documents'}`
      };
    }

    return { isValid: true };
  }, [maxFileSizeImages, maxFileSizeDocuments]);

  const validateFiles = useCallback((files: File[]): { validFiles: File[]; errors: string[] } => {
    const errors: string[] = [];
    const validFiles: File[] = [];

    // Check total file count including existing files
    if (selectedFiles.length + files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed. You currently have ${selectedFiles.length} files.`);
      return { validFiles: [], errors };
    }

    // Validate each file
    for (const file of files) {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    return { validFiles, errors };
  }, [selectedFiles.length, maxFiles, validateFile]);

  const processFiles = useCallback(async (files: File[]) => {
    const { validFiles, errors } = validateFiles(files);
    
    setValidationErrors(errors);

    if (validFiles.length === 0) {
      return;
    }

    // Create UploadFile objects with previews for images
    const uploadFiles: UploadFile[] = [];
    
    for (const file of validFiles) {
      const uploadFile: UploadFile = {
        id: generateFileId(file),
        file,
        uploadStatus: 'pending',
        uploadProgress: 0,
        uploadStartTime: Date.now()
      };

      // Create preview for images
      if (isImageFile(file)) {
        try {
          uploadFile.preview = await createImagePreview(file);
        } catch (error) {
          console.warn('Failed to create preview for image:', error);
        }
      }

      uploadFiles.push(uploadFile);
    }

    // Update state
    setSelectedFiles(prev => [...prev, ...uploadFiles]);
    
    // Notify parent component
    onFilesAdded(uploadFiles);
    
    // Auto-start uploads if onUploadStart is provided
    if (onUploadStart) {
      onUploadStart(uploadFiles);
      // Start uploads for the newly added files with proper service integration
      for (const uploadFile of uploadFiles) {
        // Check if we should auto-start uploads
        if (serverStatus?.available !== false) {
          startSingleUpload(uploadFile);
        } else {
          // Queue the upload for when server becomes available
          console.log(`Queueing upload for ${uploadFile.file.name} - server unavailable`);
        }
      }
    }
  }, [onFilesAdded, validateFiles, onUploadStart]);

  const handleFileDrop = useCallback((acceptedFiles: File[]) => {
    processFiles(acceptedFiles);
  }, [processFiles]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
    // Clear the input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  }, [processFiles]);

  const removeFile = useCallback((fileId: string) => {
    // Clear retry attempts for this file
    setRetryAttempts(prev => {
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });
    
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    onFileRemoved(fileId);
  }, [onFileRemoved]);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  const clearConnectionErrors = useCallback(() => {
    setConnectionErrors([]);
  }, []);

  const checkServerStatus = useCallback(async () => {
    if (isCheckingServer) return;
    
    setIsCheckingServer(true);
    setConnectionErrors([]);
    
    try {
      // Check both server and auth status
      const [serverStat, authStat] = await Promise.all([
        checkUploadServer(),
        Promise.resolve(getAuthStatus())
      ]);
      
      setServerStatus(serverStat);
      setAuthStatus(authStat);
      
      const errors: string[] = [];
      
      if (!serverStat.available) {
        const errorMsg = serverStat.error 
          ? `Upload server unavailable: ${serverStat.error}`
          : 'Upload server is currently unavailable';
        errors.push(errorMsg);
      }
      
      if (authStat.hasToken && authStat.isExpired) {
        errors.push('Authentication token expired - uploads may fail');
      } else if (!authStat.hasToken) {
        errors.push('No authentication token - please log in to upload files');
      }
      
      setConnectionErrors(errors);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to check server status';
      setConnectionErrors([`Connection error: ${errorMsg}`]);
      setServerStatus({
        available: false,
        error: errorMsg,
        lastChecked: Date.now()
      });
    } finally {
      setIsCheckingServer(false);
    }
  }, [isCheckingServer]);

  // Monitor server status
  useEffect(() => {
    // Check status immediately
    checkServerStatus();
    
    // Set up periodic checks every 30 seconds
    statusCheckIntervalRef.current = window.setInterval(() => {
      checkServerStatus();
    }, 30000);

    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, [checkServerStatus]);

  // Upload management functions - removed unused startUploads function

  const startSingleUpload = useCallback(async (uploadFile: UploadFile, customRetryConfig?: Partial<RetryConfig>) => {
    const fileId = uploadFile.id;
    
    // Update file status to uploading with start time
    setSelectedFiles(prev => 
      prev.map(f => f.id === fileId ? { 
        ...f, 
        uploadStatus: 'uploading', 
        uploadProgress: 0, 
        error: undefined,
        uploadStartTime: Date.now()
      } : f)
    );

    // Clear any existing retry attempts for this file
    setRetryAttempts(prev => {
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });

    try {
      const result = await uploadService.current.uploadFile(uploadFile.file, {
        retryConfig: customRetryConfig,
        queueIfOffline: true, // Queue uploads if server is offline
        onProgress: (progress: UploadProgress) => {
          // Update progress in state
          setSelectedFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, uploadProgress: progress.percentage } : f)
          );
          
          // Notify parent component
          if (onUploadProgress) {
            onUploadProgress(fileId, progress.percentage);
          }
        },
        onRetryAttempt: (attempt: number, maxAttempts: number, delay: number) => {
          // Update retry attempts in state
          setRetryAttempts(prev => {
            const next = new Map(prev);
            next.set(fileId, { attempt, maxAttempts });
            return next;
          });
          
          // Update file status to show retry info
          setSelectedFiles(prev => 
            prev.map(f => f.id === fileId ? { 
              ...f, 
              uploadStatus: 'uploading',
              uploadProgress: 0,
              error: `Retrying... (${attempt}/${maxAttempts}) - waiting ${Math.round(delay/1000)}s`
            } : f)
          );
        }
      });

      if (result.success) {
        // Clear retry attempts
        setRetryAttempts(prev => {
          const next = new Map(prev);
          next.delete(fileId);
          return next;
        });
        
        // Update file status to success with upload result data
        setSelectedFiles(prev => 
          prev.map(f => f.id === fileId ? { 
            ...f, 
            uploadStatus: 'success', 
            uploadProgress: 100,
            error: undefined,
            cloudinaryResult: result.data && 'public_id' in result.data ? {
              public_id: result.data.public_id,
              secure_url: result.data.secure_url,
              width: result.data.width,
              height: result.data.height,
              format: result.data.format,
              resource_type: 'image',
              bytes: result.data.bytes,
              created_at: result.data.created_at
            } : undefined
          } : f)
        );
        
        // Notify parent component with full result data
        if (onUploadComplete) {
          onUploadComplete(fileId, result.data);
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      let errorMessage = 'Upload failed';
      let isConnectionError = false;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check if it's a connection/network error
        if (errorMessage.includes('fetch') || 
            errorMessage.includes('network') || 
            errorMessage.includes('connection') ||
            errorMessage.includes('unavailable') ||
            errorMessage.includes('404') ||
            errorMessage.includes('500') ||
            errorMessage.includes('502') ||
            errorMessage.includes('503')) {
          isConnectionError = true;
          setConnectionErrors(prev => {
            const newError = `Upload failed: ${errorMessage}`;
            if (!prev.includes(newError)) {
              return [...prev, newError];
            }
            return prev;
          });
        }
      }
      
      // Clear retry attempts
      setRetryAttempts(prev => {
        const next = new Map(prev);
        next.delete(fileId);
        return next;
      });
      
      // Update file status to error
      setSelectedFiles(prev => 
        prev.map(f => f.id === fileId ? { 
          ...f, 
          uploadStatus: 'error', 
          uploadProgress: 0,
          error: isConnectionError ? 'Connection error - will retry when server is available' : errorMessage
        } : f)
      );
      
      // If it's a connection error, check server status
      if (isConnectionError) {
        checkServerStatus();
      }
      
      // Notify parent component
      if (onUploadError) {
        onUploadError(fileId, errorMessage);
      }
    }
  }, [onUploadProgress, onUploadComplete, onUploadError]);

  const retryUpload = useCallback((fileId: string) => {
    const file = selectedFiles.find(f => f.id === fileId);
    if (file) {
      startSingleUpload(file);
    }
  }, [selectedFiles]);

  const retryAllFailedUploads = useCallback(() => {
    const failedFiles = selectedFiles.filter(f => f.uploadStatus === 'error');
    for (const file of failedFiles) {
      startSingleUpload(file);
    }
  }, [selectedFiles]);

  const startAllPendingUploads = useCallback(() => {
    const pendingFiles = selectedFiles.filter(f => f.uploadStatus === 'pending');
    for (const file of pendingFiles) {
      startSingleUpload(file);
    }
  }, [selectedFiles]);

  const abortUpload = useCallback((fileId: string) => {
    // Clear retry attempts
    setRetryAttempts(prev => {
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });
    
    // Update file status to pending
    setSelectedFiles(prev => 
      prev.map(f => f.id === fileId ? { 
        ...f, 
        uploadStatus: 'pending', 
        uploadProgress: 0,
        error: undefined 
      } : f)
    );
    
    // Notify parent component
    if (onAbortUpload) {
      onAbortUpload(fileId);
    }
  }, [onAbortUpload]);

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
    // Disable default validation to use our custom validation
    maxSize: undefined,
    validator: undefined,
    // Accessibility improvements
    noClick: false,
    noKeyboard: false
  });

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Determine styling based on drag state
  const dropzoneClasses = cn(
    'relative border-2 border-dashed rounded-lg transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    'cursor-pointer hover:bg-gray-50 touch-manipulation',
    // Mobile-friendly sizing
    'min-h-[160px] sm:min-h-[200px]',
    {
      'border-blue-500 bg-blue-50': isDragAccept && !disabled,
      'border-red-500 bg-red-50': isDragReject && !disabled,
      'border-gray-300 hover:border-gray-400': !isDragActive && !disabled && validationErrors.length === 0,
      'border-red-300 bg-red-50': validationErrors.length > 0 && !disabled,
      'border-gray-200 bg-gray-50 cursor-not-allowed': disabled
    },
    className
  );

  const contentClasses = cn(
    'flex flex-col items-center justify-center text-center',
    // Mobile-responsive padding
    'p-4 sm:p-6 lg:p-8',
    {
      'text-blue-600': isDragAccept && !disabled,
      'text-red-600': (isDragReject || validationErrors.length > 0) && !disabled,
      'text-gray-400': disabled,
      'text-gray-600': !isDragActive && !disabled && validationErrors.length === 0
    }
  );

  return (
    <div className="space-y-4">
      {/* Dropzone Area */}
      <div 
        {...getRootProps()} 
        className={dropzoneClasses}
        role="button"
        aria-label={`File dropzone. ${selectedFiles.length} of ${maxFiles} files selected. Drag and drop files here or click to browse.`}
        aria-describedby="dropzone-instructions dropzone-file-limits"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            openFileDialog();
          }
        }}
      >
        <input
          {...getInputProps()}
          ref={fileInputRef}
          onChange={handleFileInputChange}
          disabled={disabled}
          aria-hidden="true"
        />
        
        <div className={contentClasses}>
          <Upload 
            size={48} 
            className={cn('mb-4', {
              'text-blue-500': isDragAccept && !disabled,
              'text-red-500': (isDragReject || validationErrors.length > 0) && !disabled,
              'text-gray-300': disabled
            })} 
          />
          
          <div className="space-y-2">
            <div id="dropzone-instructions">
              <p className="text-lg font-medium">
                {isDragActive 
                  ? 'Drop files here...' 
                  : selectedFiles.length === 0
                    ? 'Drag & drop files here'
                    : `${selectedFiles.length}/${maxFiles} files selected`
                }
              </p>
              
              <p className="text-sm">
                or{' '}
                <button
                  type="button"
                  onClick={openFileDialog}
                  disabled={disabled}
                  className={cn(
                    'font-medium underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded',
                    // Touch-friendly sizing on mobile
                    'py-1 px-1 touch-manipulation',
                    {
                      'text-blue-600 hover:text-blue-500': !disabled,
                      'text-gray-400 cursor-not-allowed': disabled
                    }
                  )}
                  aria-label="Browse and select files from your device"
                >
                  browse files
                </button>
              </p>
            </div>

            <div id="dropzone-file-limits" className="text-xs text-gray-500 space-y-1">
              <p>Images: up to {(maxFileSizeImages / (1024 * 1024)).toFixed(0)}MB each</p>
              <p>Documents: up to {(maxFileSizeDocuments / (1024 * 1024)).toFixed(0)}MB each</p>
              <p>Maximum {maxFiles} files total</p>
              <p>Supported formats: JPEG, PNG, GIF, WebP, PDF, TXT, DOC, DOCX</p>
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {disabled && (
          <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto mb-2"></div>
              <p className="text-sm">Processing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Connection Errors */}
      {connectionErrors.length > 0 && (
        <div className="space-y-2 mb-4">
          {connectionErrors.map((error, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle size={16} className="text-orange-500 mr-2" />
                <div className="flex-1">
                  <span className="text-sm text-orange-700">{error}</span>
                  {serverStatus && !serverStatus.available && (
                    <div className="text-xs text-orange-600 mt-1">
                      Last checked: {new Date(serverStatus.lastChecked).toLocaleTimeString()}
                      {serverStatus.responseTime && ` (${serverStatus.responseTime}ms)`}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={checkServerStatus}
                  disabled={isCheckingServer}
                  className="text-orange-600 hover:text-orange-800 transition-colors text-xs"
                  aria-label="Check server status"
                >
                  {isCheckingServer ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    'Retry'
                  )}
                </button>
                <button
                  type="button"
                  onClick={clearConnectionErrors}
                  className="text-orange-500 hover:text-orange-700 transition-colors"
                  aria-label="Clear connection errors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="space-y-2">
          {validationErrors.map((error, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <X size={16} className="text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
              <button
                type="button"
                onClick={clearValidationErrors}
                className="text-red-500 hover:text-red-700 transition-colors"
                aria-label="Clear validation errors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 
              className="text-sm font-medium text-gray-700"
              id="selected-files-heading"
              aria-live="polite"
            >
              Selected Files ({selectedFiles.length}/{maxFiles})
            </h3>
            
            {/* Bulk action buttons */}
            {selectedFiles.length > 0 && (
              <div className="flex items-center space-x-2">
                {selectedFiles.some(f => f.uploadStatus === 'pending') && (
                  <button
                    onClick={startAllPendingUploads}
                    disabled={!serverStatus?.available}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    Upload All
                  </button>
                )}
                {selectedFiles.some(f => f.uploadStatus === 'error') && (
                  <button
                    onClick={retryAllFailedUploads}
                    disabled={!serverStatus?.available}
                    className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
                  >
                    Retry Failed
                  </button>
                )}
              </div>
            )}
            {(serverStatus || authStatus) && (
              <div className="flex items-center space-x-3 text-xs">
                {/* Server Status */}
                {serverStatus && (
                  <div className="flex items-center space-x-2">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        serverStatus.available ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className={serverStatus.available ? 'text-green-600' : 'text-red-600'}>
                      {serverStatus.available ? 'Server Online' : 'Server Offline'}
                    </span>
                    {serverStatus.responseTime && (
                      <span className="text-gray-500">({serverStatus.responseTime}ms)</span>
                    )}
                  </div>
                )}
                
                {/* Auth Status */}
                {authStatus && (
                  <div className="flex items-center space-x-2">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        authStatus.hasToken && !authStatus.isExpired ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                    />
                    <span className={
                      authStatus.hasToken && !authStatus.isExpired ? 'text-blue-600' : 'text-yellow-600'
                    }>
                      {authStatus.hasToken 
                        ? authStatus.isExpired 
                          ? 'Token Expired' 
                          : 'Authenticated'
                        : 'Not Logged In'
                      }
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
            role="list"
            aria-labelledby="selected-files-heading"
          >
            {selectedFiles.map((uploadFile) => (
              <div key={uploadFile.id} role="listitem">
                <FilePreview
                  uploadFile={uploadFile}
                  onRemove={removeFile}
                  onRetry={retryUpload}
                  onAbortUpload={abortUpload}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// FilePreview sub-component
interface FilePreviewProps {
  uploadFile: UploadFile;
  // eslint-disable-next-line no-unused-vars
  onRemove: (fileId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onRetry?: (fileId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onAbortUpload?: (fileId: string) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  uploadFile,
  onRemove,
  onRetry,
  onAbortUpload
}) => {
  const { file, preview, uploadStatus = 'pending', uploadProgress = 0, error } = uploadFile;
  const isImage = isImageFile(file);

  const getFileIcon = () => {
    if (isImage) {
      return <Image size={24} className="text-blue-500" />;
    }
    if (file.type === 'application/pdf') {
      return <FileText size={24} className="text-red-500" />;
    }
    return <File size={24} className="text-gray-500" />;
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div 
      className={cn('relative border rounded-lg p-3 transition-all', getStatusColor())}
      role="article"
      aria-label={`File: ${file.name}, ${formatFileSize(file.size)}, ${uploadStatus}`}
    >
      {/* Remove button */}
      <button
        onClick={() => onRemove(uploadFile.id)}
        className={cn(
          'absolute top-2 right-2 p-1 rounded-full bg-white shadow-sm transition-colors',
          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1',
          // Touch-friendly sizing
          'touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center'
        )}
        aria-label={`Remove ${file.name}`}
        title={`Remove ${file.name}`}
      >
        <X size={14} className="text-gray-500" />
      </button>

      {/* File preview */}
      <div className="flex items-start space-x-3 pr-8">
        <div className="flex-shrink-0">
          {isImage && preview ? (
            <img
              src={preview}
              alt={`Preview of ${file.name}`}
              className="w-12 h-12 object-cover rounded border"
              loading="lazy"
            />
          ) : (
            <div 
              className="w-12 h-12 flex items-center justify-center border rounded bg-gray-50"
              aria-label={`${file.type.split('/')[1].toUpperCase()} file icon`}
            >
              {getFileIcon()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </p>
          
          {/* Upload status */}
          {uploadStatus === 'uploading' && (
            <div className="mt-2" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-blue-600 mb-1">
                <span>
                  {error && error.includes('Retrying') ? (
                    <span className="flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin" />
                      {error.split(' - ')[0]}
                    </span>
                  ) : uploadProgress === 0 ? (
                    'Preparing...'
                  ) : uploadProgress < 100 ? (
                    'Uploading...'
                  ) : (
                    'Processing...'
                  )}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div 
                className="w-full bg-blue-200 rounded-full h-1.5"
                role="progressbar"
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Upload progress: ${uploadProgress}%`}
              >
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 ease-out",
                    uploadProgress === 100 ? "bg-green-500" : "bg-blue-600"
                  )}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {/* Estimated time remaining for larger files */}
              {uploadProgress > 0 && uploadProgress < 100 && file.size > 1024 * 1024 && (
                <div className="text-xs text-gray-500 mt-1">
                  {(() => {
                    const startTime = uploadFile.uploadStartTime || Date.now();
                    const elapsed = Date.now() - startTime;
                    const rate = uploadProgress / elapsed;
                    const remaining = (100 - uploadProgress) / rate;
                    const seconds = Math.ceil(remaining / 1000);
                    return seconds > 0 && seconds < 300 ? `~${seconds}s remaining` : '';
                  })()} 
                </div>
              )}
              {error && error.includes('waiting') && (
                <div className="text-xs text-gray-500 mt-1">
                  {error.split(' - ')[1]}
                </div>
              )}
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="mt-2" role="status" aria-live="polite">
              <p className="text-xs text-green-600">Upload complete</p>
              {uploadFile.cloudinaryResult && (
                <div className="text-xs text-gray-500 mt-1 space-y-1">
                  <div>URL: <a href={uploadFile.cloudinaryResult.secure_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {uploadFile.cloudinaryResult.secure_url.split('/').pop()}
                  </a></div>
                  {uploadFile.cloudinaryResult.width && uploadFile.cloudinaryResult.height && (
                    <div>Dimensions: {uploadFile.cloudinaryResult.width}×{uploadFile.cloudinaryResult.height}</div>
                  )}
                  <div>Size: {formatFileSize(uploadFile.cloudinaryResult.bytes)}</div>
                  <div>Format: {uploadFile.cloudinaryResult.format.toUpperCase()}</div>
                </div>
              )}
            </div>
          )}
          
          {uploadStatus === 'error' && error && (
            <div className="mt-2" role="alert" aria-live="assertive">
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={12} />
                <span title={error}>
                  {error.length > 40 ? `${error.substring(0, 40)}...` : error}
                </span>
              </div>
              {error.includes('Connection error') && (
                <div className="text-xs text-gray-500 mt-1">
                  File will upload automatically when server reconnects
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload actions */}
      {uploadStatus === 'uploading' && onAbortUpload && (
        <button
          onClick={() => onAbortUpload(uploadFile.id)}
          className={cn(
            'absolute bottom-2 right-2 text-xs text-red-600 hover:text-red-800',
            'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded',
            'py-1 px-2 touch-manipulation'
          )}
          aria-label={`Cancel upload of ${file.name}`}
          title={`Cancel upload of ${file.name}`}
        >
          Cancel
        </button>
      )}
      
      {uploadStatus === 'error' && onRetry && (
        <button
          onClick={() => onRetry(uploadFile.id)}
          className={cn(
            'absolute bottom-2 right-2 text-xs text-blue-600 hover:text-blue-800',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded',
            'py-1 px-2 touch-manipulation flex items-center gap-1'
          )}
          aria-label={`Retry upload of ${file.name}`}
          title={`Retry upload of ${file.name}`}
        >
          <RefreshCw size={12} />
          {error && error.includes('Connection error') ? 'Queue' : 'Retry'}
        </button>
      )}
    </div>
  );
};

export default FileDropzone;