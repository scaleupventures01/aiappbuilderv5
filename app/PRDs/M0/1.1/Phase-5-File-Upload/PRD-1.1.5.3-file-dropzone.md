# PRD: File Dropzone Component

## 1. Overview

This PRD defines the file dropzone component for the Elite Trading Coach AI application, providing an intuitive drag-and-drop interface for users to upload images and documents to the chat system.

## 2. Feature Requirements

### 2.1 Functional Requirements
- **FR-1**: Drag-and-drop interface for file uploads
- **FR-2**: Click-to-browse file selection alternative
- **FR-3**: Real-time file validation and preview
- **FR-4**: Progress indicators for upload status
- **FR-5**: Support for multiple file selection and batch uploads

### 2.2 Non-Functional Requirements
- **NFR-1**: Responsive design for mobile and desktop
- **NFR-2**: Accessible interface with keyboard navigation
- **NFR-3**: Visual feedback within 100ms of user interactions
- **NFR-4**: Support for files up to 15MB each

## 3. User Stories

### 3.1 Primary User Stories
- **US-1**: As a user, I want to drag trading charts into the chat so I can quickly share them with the AI coach
- **US-2**: As a mobile user, I want to tap to select photos so I can upload screenshots from my phone
- **US-3**: As a user, I want to see upload progress so I know when my files are being processed

### 3.2 Edge Cases
- **EC-1**: Handling unsupported file types with clear error messages
- **EC-2**: Managing multiple large file uploads simultaneously
- **EC-3**: Dealing with network interruptions during upload

## 4. Technical Specifications

### 4.1 File Dropzone Component
```typescript
// src/components/chat/FileDropzone.tsx
import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, File, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { uploadService } from '@services/uploadService';
import { cn } from '@utils/cn';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onUploadComplete?: (results: UploadResult[]) => void;
  onClose: () => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  className?: string;
}

interface UploadResult {
  id: string;
  url: string;
  thumbnailUrl?: string;
  originalName: string;
  size: number;
}

interface FileWithPreview extends File {
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  uploadError?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  onUploadComplete,
  onClose,
  maxFiles = 5,
  maxSize = 15 * 1024 * 1024, // 15MB
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt']
  },
  className = ''
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          console.error(`Error with file ${file.name}: ${error.message}`);
          // Show error toast or notification
        });
      });
    }

    // Process accepted files
    const filesWithPreview = acceptedFiles.map(file => {
      const fileWithPreview = Object.assign(file, {
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        uploadStatus: 'pending' as const,
        uploadProgress: 0
      });

      return fileWithPreview;
    });

    setSelectedFiles(prev => [...prev, ...filesWithPreview]);
    
    // Notify parent component
    onFilesSelected([...selectedFiles, ...filesWithPreview]);
  }, [selectedFiles, onFilesSelected]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    multiple: true,
    disabled: isUploading
  });

  const removeFile = (fileToRemove: FileWithPreview) => {
    // Revoke object URL if it exists
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    // Cancel upload if in progress
    const controller = abortControllersRef.current.get(fileToRemove.name);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(fileToRemove.name);
    }

    setSelectedFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const uploadResults: UploadResult[] = [];

    try {
      // Upload files one by one to show individual progress
      for (const file of selectedFiles) {
        if (file.uploadStatus === 'completed') continue;

        try {
          // Create abort controller for this upload
          const controller = new AbortController();
          abortControllersRef.current.set(file.name, controller);

          // Update file status
          setSelectedFiles(prev => 
            prev.map(f => 
              f === file 
                ? { ...f, uploadStatus: 'uploading' as const, uploadProgress: 0 }
                : f
            )
          );

          // Simulate progress updates (in real implementation, this would come from upload service)
          const progressInterval = setInterval(() => {
            setSelectedFiles(prev => 
              prev.map(f => 
                f === file && f.uploadStatus === 'uploading'
                  ? { ...f, uploadProgress: Math.min((f.uploadProgress || 0) + 10, 90) }
                  : f
              )
            );
          }, 200);

          // Upload file
          const result = await uploadService.uploadFile(file, {
            preset: file.type.startsWith('image/') ? 'chat_images' : 'documents',
            folder: 'user_uploads'
          });

          clearInterval(progressInterval);

          // Update file status to completed
          setSelectedFiles(prev => 
            prev.map(f => 
              f === file 
                ? { ...f, uploadStatus: 'completed' as const, uploadProgress: 100 }
                : f
            )
          );

          uploadResults.push({
            id: result.public_id,
            url: result.secure_url,
            thumbnailUrl: result.thumbnailUrl,
            originalName: file.name,
            size: file.size
          });

          // Clean up abort controller
          abortControllersRef.current.delete(file.name);

        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          
          setSelectedFiles(prev => 
            prev.map(f => 
              f === file 
                ? { 
                    ...f, 
                    uploadStatus: 'error' as const, 
                    uploadError: error instanceof Error ? error.message : 'Upload failed'
                  }
                : f
            )
          );
        }
      }

      // Notify parent of successful uploads
      if (uploadResults.length > 0 && onUploadComplete) {
        onUploadComplete(uploadResults);
      }

    } finally {
      setIsUploading(false);
    }
  };

  const dropzoneClasses = cn(
    'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
    isDragAccept && 'border-green-500 bg-green-50 dark:bg-green-900/20',
    isDragReject && 'border-red-500 bg-red-50 dark:bg-red-900/20',
    isDragActive && !isDragAccept && !isDragReject && 'border-primary-500 bg-primary-50 dark:bg-primary-900/20',
    !isDragActive && 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
    isUploading && 'pointer-events-none opacity-50'
  );

  return (
    <div className={cn('fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50', className)}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Upload Files
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            disabled={isUploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Dropzone */}
        <div {...getRootProps()} className={dropzoneClasses}>
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          
          {isDragActive ? (
            isDragAccept ? (
              <p className="text-green-600 font-medium">Drop files here to upload</p>
            ) : (
              <p className="text-red-600 font-medium">Some files are not supported</p>
            )
          ) : (
            <div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supports images, PDFs, and text files up to {maxSize / (1024 * 1024)}MB each
              </p>
            </div>
          )}
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Selected Files ({selectedFiles.length})
            </h4>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <FilePreview
                  key={`${file.name}-${index}`}
                  file={file}
                  onRemove={() => removeFile(file)}
                  canRemove={!isUploading}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={uploadFiles}
            disabled={selectedFiles.length === 0 || isUploading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// File Preview Component
const FilePreview: React.FC<{
  file: FileWithPreview;
  onRemove: () => void;
  canRemove: boolean;
}> = ({ file, onRemove, canRemove }) => {
  const isImage = file.type.startsWith('image/');
  const statusIcon = {
    pending: null,
    uploading: <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />,
    completed: <CheckCircle className="w-4 h-4 text-green-600" />,
    error: <AlertCircle className="w-4 h-4 text-red-600" />
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      {/* File icon/preview */}
      <div className="flex-shrink-0">
        {isImage && file.preview ? (
          <img
            src={file.preview}
            alt={file.name}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
            <File className="w-6 h-6 text-gray-500" />
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {(file.size / (1024 * 1024)).toFixed(1)} MB
        </p>
        
        {/* Progress bar */}
        {file.uploadStatus === 'uploading' && (
          <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-primary-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${file.uploadProgress || 0}%` }}
            />
          </div>
        )}
        
        {/* Error message */}
        {file.uploadStatus === 'error' && (
          <p className="text-xs text-red-600 mt-1">{file.uploadError}</p>
        )}
      </div>

      {/* Status and remove button */}
      <div className="flex items-center space-x-2">
        {statusIcon[file.uploadStatus || 'pending']}
        
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
```

## 5. Acceptance Criteria

### 5.1 Definition of Done
- [ ] Drag-and-drop functionality working across browsers
- [ ] Click-to-browse file selection implemented
- [ ] File validation with clear error messages
- [ ] Upload progress indicators functional
- [ ] Multiple file selection and batch upload support
- [ ] Mobile-responsive design
- [ ] Accessibility features implemented
- [ ] Error handling for upload failures

### 5.2 Testing Requirements
- [ ] Drag-and-drop across different browsers
- [ ] File validation for various file types and sizes
- [ ] Upload progress tracking accuracy
- [ ] Mobile touch interactions
- [ ] Keyboard navigation accessibility
- [ ] Error scenarios (network failures, invalid files)

## 6. Dependencies

### 6.1 Technical Dependencies
- react-dropzone library for drag-and-drop functionality
- Upload service integration (PRD-1.1.5.2)
- File validation utilities
- Progress tracking system

### 6.2 Business Dependencies
- File upload requirements and limitations
- User interface design specifications
- Accessibility compliance standards

## 7. Risks and Mitigations

### 7.1 Technical Risks
- **Risk**: Poor performance with large files or multiple uploads
  - **Mitigation**: Implement chunked uploads and progress optimization
- **Risk**: Browser compatibility issues with drag-and-drop
  - **Mitigation**: Fallback to click-to-browse on unsupported browsers

### 7.2 Business Risks
- **Risk**: Complex interface confusing users
  - **Mitigation**: Simple, intuitive design with clear visual feedback

## 8. Success Metrics

### 8.1 Technical Metrics
- < 100ms response time for drag interactions
- Support for 5+ concurrent file uploads
- 99% upload success rate
- Smooth progress indicator updates

### 8.2 Business Metrics
- Intuitive file upload experience
- High user adoption of drag-and-drop feature
- Reduced support requests about file uploads

## 9. Implementation Timeline

### 9.1 Development Phases
- **Phase 1**: Basic dropzone structure and drag-and-drop (5 hours)
- **Phase 2**: File validation and preview (4 hours)
- **Phase 3**: Upload progress and status tracking (4 hours)
- **Phase 4**: Mobile optimization and accessibility (3 hours)

### 9.2 Milestones
- **M1**: Basic drag-and-drop working (Day 1)
- **M2**: File validation and preview implemented (Day 2)
- **M3**: Upload progress tracking functional (Day 2)
- **M4**: Mobile and accessibility completed (Day 3)

## 10. Appendices

### 10.1 Supported File Types
```typescript
// File type configuration
const acceptedFileTypes = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

const maxFileSizes = {
  image: 15 * 1024 * 1024, // 15MB
  document: 25 * 1024 * 1024, // 25MB
  default: 10 * 1024 * 1024 // 10MB
};
```

### 10.2 Accessibility Features
- ARIA labels for dropzone and file previews
- Keyboard navigation for file management
- Screen reader announcements for upload status
- Focus management for modal interactions
- High contrast mode support

### 10.3 Mobile Optimizations
- Touch-friendly drag-and-drop areas
- Camera access for direct photo capture
- Responsive layout for small screens
- Touch gestures for file removal
- Mobile-specific file picker integration