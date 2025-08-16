import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, AlertCircle } from 'lucide-react';
import { cn } from '@utils/cn';
import type { DragDropUploadProps } from '../../types/upload';
import { validateFiles, formatFileSize } from '@utils/fileValidation';
import { uploadMultipleFiles } from '@/services/uploadService';

/**
 * DragDropUpload Component
 * Provides a drag-and-drop interface for file uploads with validation
 */
interface ExtendedDragDropUploadProps extends DragDropUploadProps {
  conversationId?: string;
  context?: string;
  autoUpload?: boolean;
  // eslint-disable-next-line no-unused-vars
  onUploadComplete?: (results: any) => void;
  // eslint-disable-next-line no-unused-vars
  onUploadError?: (error: string) => void;
}

export const DragDropUpload: React.FC<ExtendedDragDropUploadProps> = ({
  onFilesAdded,
  // eslint-disable-next-line no-unused-vars
  onFilesRemoved: _onFilesRemoved,
  acceptedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  maxFileSize = 15 * 1024 * 1024, // 15MB default for images
  maxFiles = 5, // Backend supports max 5 files
  disabled = false,
  className,
  children,
  conversationId,
  context = 'chat',
  autoUpload = false,
  onUploadComplete,
  onUploadError
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    setValidationError(null);
    
    const validation = validateFiles(files, {
      maxSize: maxFileSize,
      allowedTypes: acceptedFileTypes,
      maxFiles
    });

    if (!validation.isValid) {
      setValidationError(validation.errors[0]);
      return;
    }

    // Call the callback to notify parent component
    onFilesAdded(files);

    // Auto-upload if enabled
    if (autoUpload) {
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        const result = await uploadMultipleFiles(files, {
          conversationId,
          context,
          onProgress: (progress) => {
            setUploadProgress(progress.percentage);
          }
        });

        if (result.success) {
          onUploadComplete?.(result.data);
        } else {
          onUploadError?.(result.error || 'Upload failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        onUploadError?.(errorMessage);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  }, [onFilesAdded, maxFileSize, acceptedFileTypes, maxFiles, autoUpload, conversationId, context, onUploadComplete, onUploadError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFiles(acceptedFiles);
  }, [handleFiles]);

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFileTypes ? 
      Object.fromEntries(acceptedFileTypes.map(type => [type, []])) :
      undefined,
    maxSize: maxFileSize,
    maxFiles,
    disabled: disabled || isUploading,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  });

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const clearError = () => {
    setValidationError(null);
  };

  // Determine styling based on state
  const containerClasses = cn(
    'relative border-2 border-dashed rounded-lg transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    {
      'border-blue-500 bg-blue-50': isDragAccept && !disabled,
      'border-red-500 bg-red-50': isDragReject && !disabled,
      'border-gray-300 hover:border-gray-400': !isDragActive && !disabled && !validationError,
      'border-red-300 bg-red-50': validationError && !disabled,
      'border-gray-200 bg-gray-50 cursor-not-allowed': disabled || isUploading,
      'cursor-pointer': !disabled
    },
    className
  );

  const contentClasses = cn(
    'flex flex-col items-center justify-center p-8 text-center',
    {
      'text-blue-600': isDragAccept && !disabled,
      'text-red-600': (isDragReject || validationError) && !disabled,
      'text-gray-400': disabled || isUploading,
      'text-gray-600': !isDragActive && !disabled && !validationError
    }
  );

  return (
    <div className="space-y-4">
      <div {...getRootProps()} className={containerClasses}>
        <input
          {...getInputProps()}
          ref={fileInputRef}
          onChange={handleFileInputChange}
          disabled={disabled}
        />
        
        <div className={contentClasses}>
          {children ? (
            children
          ) : (
            <>
              <Upload 
                size={48} 
                className={cn('mb-4', {
                  'text-blue-500': isDragAccept && !disabled && !isUploading,
                  'text-red-500': (isDragReject || validationError) && !disabled && !isUploading,
                  'text-gray-300': disabled || isUploading
                })} 
              />
              
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isUploading 
                    ? `Uploading... ${uploadProgress}%`
                    : isDragActive 
                      ? 'Drop files here...' 
                      : 'Drag & drop images here'
                  }
                </p>
                
                {isUploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                
                <p className="text-sm">
                  or{' '}
                  <button
                    type="button"
                    onClick={handleClick}
                    disabled={disabled || isUploading}
                    className={cn(
                      'font-medium underline',
                      {
                        'text-blue-600 hover:text-blue-500': !disabled && !isUploading,
                        'text-gray-400 cursor-not-allowed': disabled || isUploading
                      }
                    )}
                  >
                    browse files
                  </button>
                </p>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>Maximum file size: {formatFileSize(maxFileSize)}</p>
                  <p>Maximum files: {maxFiles}</p>
                  <p>
                    Accepted types: {acceptedFileTypes.join(', ')}
                  </p>
                  <p>Backend API: Images uploaded via secure endpoint</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Loading overlay */}
        {(disabled || isUploading) && (
          <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto mb-2"></div>
              <p className="text-sm">{isUploading ? `Uploading... ${uploadProgress}%` : 'Processing...'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {validationError && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle size={16} className="text-red-500 mr-2" />
            <span className="text-sm text-red-700">{validationError}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;