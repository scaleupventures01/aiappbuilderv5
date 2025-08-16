import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Eye, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@utils/cn';
import type { ImagePreviewProps, UploadFile } from '../../types/upload';
import { createImagePreview, formatFileSize, isImageFile } from '../../utils/fileValidation';
import { getUploadService } from '../../services/uploadService';

/**
 * ImagePreview Component
 * Displays image preview with upload status and controls
 */
export const ImagePreview: React.FC<ImagePreviewProps> = ({
  file,
  onRemove,
  onRetry,
  size = 'md',
  className
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const { file: fileObj, id, uploadStatus, uploadProgress, error, cloudinaryResult } = file;
  const isImage = isImageFile(fileObj);

  // Load image preview
  useEffect(() => {
    if (isImage && !imagePreview) {
      createImagePreview(fileObj)
        .then(setImagePreview)
        .catch(() => setLoadError(true));
    }
  }, [fileObj, isImage, imagePreview]);

  // Size classes
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };

  // Status overlay component
  const StatusOverlay = () => {
    if (uploadStatus === 'pending') return null;

    return (
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
        {uploadStatus === 'uploading' && (
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2" />
            <p className="text-xs">{uploadProgress || 0}%</p>
          </div>
        )}
        
        {uploadStatus === 'success' && (
          <div className="text-center text-white">
            <CheckCircle size={32} className="mx-auto mb-2" />
            <p className="text-xs">Complete</p>
          </div>
        )}
        
        {uploadStatus === 'error' && (
          <div className="text-center text-white">
            <AlertCircle size={32} className="mx-auto mb-2" />
            <p className="text-xs">Failed</p>
          </div>
        )}
      </div>
    );
  };

  // Action buttons
  const ActionButtons = () => (
    <div className="absolute top-2 right-2 flex space-x-1">
      {cloudinaryResult?.secure_url && (
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-opacity"
          title="View full size"
        >
          <Eye size={12} />
        </button>
      )}
      
      {cloudinaryResult?.secure_url && (
        <a
          href={cloudinaryResult.secure_url}
          download={fileObj.name}
          className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-opacity"
          title="Download"
        >
          <Download size={12} />
        </a>
      )}
      
      {uploadStatus === 'error' && onRetry && (
        <button
          type="button"
          onClick={() => onRetry(id)}
          className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-opacity"
          title="Retry upload"
        >
          <RotateCcw size={12} />
        </button>
      )}
      
      {onRemove && uploadStatus !== 'uploading' && (
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-opacity"
          title="Remove"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );

  // Progress bar
  const ProgressBar = () => {
    if (uploadStatus !== 'uploading' || !uploadProgress) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 rounded-b-lg">
        <div className="w-full bg-gray-600 rounded-full h-1">
          <div
            className="h-1 bg-blue-400 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
    );
  };

  // Fullscreen modal
  const FullscreenModal = () => {
    if (!isFullscreen || !cloudinaryResult?.secure_url) return null;

    const optimizedUrl = getUploadService().getOptimizedImageUrl(
      cloudinaryResult.public_id,
      { width: 1200, quality: 'auto' }
    );

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
        <div className="relative max-w-4xl max-h-full">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity z-10"
          >
            <X size={20} />
          </button>
          
          <img
            src={optimizedUrl}
            alt={fileObj.name}
            className="max-w-full max-h-full rounded-lg"
            onError={() => setLoadError(true)}
          />
          
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg">
            <p className="font-medium">{fileObj.name}</p>
            <p className="text-sm text-gray-300">
              {formatFileSize(fileObj.size)}
              {cloudinaryResult.width && cloudinaryResult.height && (
                <span className="ml-2">
                  {cloudinaryResult.width} × {cloudinaryResult.height}px
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (!isImage) {
    // Non-image file preview
    return (
      <div className={cn('relative border rounded-lg p-4 bg-gray-50', sizeClasses[size], className)}>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-gray-400 mb-2">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-xs font-medium text-gray-600 truncate w-full">
            {fileObj.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(fileObj.size)}
          </p>
        </div>
        
        <StatusOverlay />
        <ActionButtons />
      </div>
    );
  }

  // Image preview
  return (
    <>
      <div className={cn(
        'relative border rounded-lg overflow-hidden bg-gray-100',
        sizeClasses[size],
        {
          'border-green-300': uploadStatus === 'success',
          'border-red-300': uploadStatus === 'error',
          'border-blue-300': uploadStatus === 'uploading',
        },
        className
      )}>
        {imagePreview && !loadError ? (
          <img
            src={cloudinaryResult?.secure_url || imagePreview}
            alt={fileObj.name}
            className="w-full h-full object-cover"
            onError={() => setLoadError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            {loadError ? (
              <div className="text-center text-gray-500">
                <AlertCircle size={24} className="mx-auto mb-1" />
                <p className="text-xs">Preview error</p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent mx-auto mb-1" />
                <p className="text-xs">Loading...</p>
              </div>
            )}
          </div>
        )}

        <StatusOverlay />
        <ActionButtons />
        <ProgressBar />

        {/* File info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
          <p className="text-xs text-white font-medium truncate">
            {fileObj.name}
          </p>
          <p className="text-xs text-gray-300">
            {formatFileSize(fileObj.size)}
          </p>
        </div>

        {/* Error indicator */}
        {error && uploadStatus === 'error' && (
          <div className="absolute top-2 left-2">
            <div className="bg-red-500 text-white p-1 rounded text-xs" title={error}>
              <AlertCircle size={12} />
            </div>
          </div>
        )}
      </div>

      <FullscreenModal />
    </>
  );
};

/**
 * Image Gallery Component
 * Displays multiple image previews in a grid
 */
interface ImageGalleryProps {
  files: UploadFile[];
  // eslint-disable-next-line no-unused-vars
  onRemove?: (fileId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onRetry?: (fileId: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  files,
  onRemove,
  onRetry,
  size = 'md',
  className
}) => {
  const imageFiles = files.filter(f => isImageFile(f.file));
  
  if (imageFiles.length === 0) {
    return null;
  }

  return (
    <div className={cn('grid gap-4', {
      'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6': size === 'sm',
      'grid-cols-2 sm:grid-cols-3 md:grid-cols-4': size === 'md',
      'grid-cols-1 sm:grid-cols-2 md:grid-cols-3': size === 'lg'
    }, className)}>
      {imageFiles.map((file) => (
        <ImagePreview
          key={file.id}
          file={file}
          onRemove={onRemove}
          onRetry={onRetry}
          size={size}
        />
      ))}
    </div>
  );
};

export default ImagePreview;