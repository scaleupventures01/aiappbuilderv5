import React from 'react';
import { CheckCircle, AlertCircle, X, RotateCcw, File, Image } from 'lucide-react';
import { cn } from '@utils/cn';
import type { UploadProgressProps, UploadFile } from '../../types/upload';
import { formatFileSize, isImageFile } from '@utils/fileValidation';

/**
 * UploadProgress Component
 * Displays upload progress for multiple files with status indicators
 */
export const UploadProgress: React.FC<UploadProgressProps> = ({
  files,
  onRetry,
  onRemove,
  className
}) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-gray-700">
        Upload Progress ({files.length} file{files.length !== 1 ? 's' : ''})
      </h3>
      
      <div className="space-y-2">
        {files.map((file) => (
          <UploadFileItem
            key={file.id}
            file={file}
            onRetry={onRetry}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Individual File Upload Progress Item
 */
interface UploadFileItemProps {
  file: UploadFile;
  // eslint-disable-next-line no-unused-vars
  onRetry?: (fileId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onRemove?: (fileId: string) => void;
}

const UploadFileItem: React.FC<UploadFileItemProps> = ({
  file,
  onRetry,
  onRemove
}) => {
  const { file: fileObj, id, uploadProgress = 0, uploadStatus = 'pending', error } = file;
  
  const isImage = isImageFile(fileObj);
  
  // Status icon component
  const StatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'uploading':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
        );
      default:
        return (
          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
        );
    }
  };

  // Progress bar component
  const ProgressBar = () => {
    if (uploadStatus === 'pending') return null;

    const progressPercentage = uploadStatus === 'success' ? 100 : uploadProgress;
    const progressColor = uploadStatus === 'error' ? 'bg-red-500' : 'bg-blue-500';

    return (
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <div
          className={cn('h-1.5 rounded-full transition-all duration-300', progressColor)}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    );
  };

  // Action buttons
  const ActionButtons = () => (
    <div className="flex items-center space-x-1">
      {uploadStatus === 'error' && onRetry && (
        <button
          type="button"
          onClick={() => onRetry(id)}
          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
          title="Retry upload"
        >
          <RotateCcw size={14} />
        </button>
      )}
      
      {onRemove && uploadStatus !== 'uploading' && (
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Remove file"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );

  return (
    <div className={cn(
      'flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border',
      {
        'border-green-200 bg-green-50': uploadStatus === 'success',
        'border-red-200 bg-red-50': uploadStatus === 'error',
        'border-blue-200 bg-blue-50': uploadStatus === 'uploading'
      }
    )}>
      {/* File icon */}
      <div className="flex-shrink-0 mt-0.5">
        {isImage ? (
          <Image size={16} className="text-gray-500" />
        ) : (
          <File size={16} className="text-gray-500" />
        )}
      </div>

      {/* File info and progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <StatusIcon />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {fileObj.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(fileObj.size)}
                {uploadStatus === 'uploading' && (
                  <span className="ml-2">
                    {uploadProgress}% uploaded
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <ActionButtons />
        </div>

        {/* Progress bar */}
        <ProgressBar />

        {/* Error message */}
        {error && uploadStatus === 'error' && (
          <p className="text-xs text-red-600 mt-1 flex items-center">
            <AlertCircle size={12} className="mr-1 flex-shrink-0" />
            {error}
          </p>
        )}

        {/* Success message with URL */}
        {uploadStatus === 'success' && file.cloudinaryResult && (
          <div className="mt-2 text-xs text-green-600">
            <p className="flex items-center">
              <CheckCircle size={12} className="mr-1 flex-shrink-0" />
              Upload successful
            </p>
            {file.cloudinaryResult.secure_url && (
              <p className="mt-1 font-mono text-gray-500 truncate">
                {file.cloudinaryResult.secure_url}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Upload Summary Component
 * Shows overall upload statistics
 */
interface UploadSummaryProps {
  files: UploadFile[];
  className?: string;
}

export const UploadSummary: React.FC<UploadSummaryProps> = ({
  files,
  className
}) => {
  const total = files.length;
  const completed = files.filter(f => f.uploadStatus === 'success').length;
  const failed = files.filter(f => f.uploadStatus === 'error').length;
  const uploading = files.filter(f => f.uploadStatus === 'uploading').length;

  if (total === 0) return null;

  return (
    <div className={cn('p-3 bg-gray-50 rounded-lg border', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Upload Summary</span>
        <div className="flex items-center space-x-4 text-xs">
          {completed > 0 && (
            <span className="flex items-center text-green-600">
              <CheckCircle size={12} className="mr-1" />
              {completed} completed
            </span>
          )}
          {uploading > 0 && (
            <span className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent mr-1" />
              {uploading} uploading
            </span>
          )}
          {failed > 0 && (
            <span className="flex items-center text-red-600">
              <AlertCircle size={12} className="mr-1" />
              {failed} failed
            </span>
          )}
        </div>
      </div>
      
      {/* Overall progress bar */}
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {completed} of {total} files uploaded
        </p>
      </div>
    </div>
  );
};

export default UploadProgress;