import React, { useRef, useCallback, useState } from 'react';
import { Upload, Image, File, Plus } from 'lucide-react';
import { cn } from '@utils/cn';
import type { UploadButtonProps } from '../../types/upload';
import { validateFiles, formatFileSize } from '@utils/fileValidation';

/**
 * UploadButton Component
 * A button that triggers file selection with validation
 */
export const UploadButton: React.FC<UploadButtonProps> = ({
  onFilesSelected,
  acceptedFileTypes,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  multiple = true,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className,
  children
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 0) {
      const validation = validateFiles(files, {
        maxSize: maxFileSize,
        allowedTypes: acceptedFileTypes,
        maxFiles: multiple ? 10 : 1
      });

      if (validation.isValid) {
        onFilesSelected(files);
      } else {
        // In a real app, you might want to show these errors in a toast or alert
        console.warn('File validation failed:', validation.errors);
      }
    }

    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFilesSelected, maxFileSize, acceptedFileTypes, multiple]);

  // Variant styles
  const variantClasses = {
    primary: cn(
      'bg-blue-600 text-white border-blue-600',
      'hover:bg-blue-700 hover:border-blue-700',
      'focus:ring-blue-500',
      'disabled:bg-blue-300 disabled:border-blue-300'
    ),
    secondary: cn(
      'bg-gray-600 text-white border-gray-600',
      'hover:bg-gray-700 hover:border-gray-700',
      'focus:ring-gray-500',
      'disabled:bg-gray-300 disabled:border-gray-300'
    ),
    ghost: cn(
      'bg-transparent text-gray-700 border-gray-300',
      'hover:bg-gray-50 hover:border-gray-400',
      'focus:ring-gray-500',
      'disabled:text-gray-400 disabled:border-gray-200'
    )
  };

  // Size styles
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Icon size based on button size
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  // Default button content
  const DefaultContent = () => {
    const IconComponent = acceptedFileTypes?.every(type => type.startsWith('image/')) 
      ? Image 
      : File;

    return (
      <div className="flex items-center space-x-2">
        <IconComponent size={iconSizes[size]} />
        <span>
          {children || `Upload ${multiple ? 'Files' : 'File'}`}
        </span>
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'inline-flex items-center justify-center',
          'border rounded-lg font-medium',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
      >
        <DefaultContent />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={acceptedFileTypes?.join(',')}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        aria-hidden="true"
      />
    </>
  );
};

/**
 * FloatingUploadButton Component
 * A floating action button for uploads
 */
interface FloatingUploadButtonProps extends Omit<UploadButtonProps, 'variant' | 'size'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingUploadButton: React.FC<FloatingUploadButtonProps> = ({
  position = 'bottom-right',
  className,
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      <UploadButton
        {...props}
        variant="primary"
        size="lg"
        className={cn(
          'rounded-full shadow-lg hover:shadow-xl',
          'w-14 h-14 p-0',
          className
        )}
      >
        <Plus size={24} />
      </UploadButton>
    </div>
  );
};

/**
 * IconUploadButton Component
 * A minimalist icon-only upload button
 */
interface IconUploadButtonProps extends Omit<UploadButtonProps, 'children'> {
  icon?: 'upload' | 'image' | 'file' | 'plus';
  tooltip?: string;
}

export const IconUploadButton: React.FC<IconUploadButtonProps> = ({
  icon = 'upload',
  tooltip,
  size = 'md',
  className,
  ...props
}) => {
  const icons = {
    upload: Upload,
    image: Image,
    file: File,
    plus: Plus
  };

  const IconComponent = icons[icon];
  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  return (
    <UploadButton
      {...props}
      size={size}
      className={cn(
        'p-2 aspect-square',
        className
      )}
      title={tooltip}
    >
      <IconComponent size={iconSizes[size]} />
    </UploadButton>
  );
};

/**
 * CompactUploadButton Component
 * A compact button with file type and size info
 */
interface CompactUploadButtonProps extends UploadButtonProps {
  showFileInfo?: boolean;
}

export const CompactUploadButton: React.FC<CompactUploadButtonProps> = ({
  acceptedFileTypes,
  maxFileSize = 5 * 1024 * 1024,
  showFileInfo = true,
  className,
  children,
  ...props
}) => {
  const getFileTypeLabel = () => {
    if (!acceptedFileTypes) return 'Any file';
    
    const hasImages = acceptedFileTypes.some(type => type.startsWith('image/'));
    const hasDocuments = acceptedFileTypes.some(type => 
      type.startsWith('application/') || type.startsWith('text/')
    );
    
    if (hasImages && hasDocuments) return 'Images & Documents';
    if (hasImages) return 'Images';
    if (hasDocuments) return 'Documents';
    return 'Files';
  };

  return (
    <div className="space-y-2">
      <UploadButton
        {...props}
        acceptedFileTypes={acceptedFileTypes}
        maxFileSize={maxFileSize}
        className={cn('w-full', className)}
      >
        {children || (
          <div className="flex items-center space-x-2">
            <Upload size={16} />
            <span>Choose Files</span>
          </div>
        )}
      </UploadButton>
      
      {showFileInfo && (
        <div className="text-xs text-gray-500 text-center space-y-0.5">
          <p>Accepted: {getFileTypeLabel()}</p>
          <p>Max size: {formatFileSize(maxFileSize)}</p>
        </div>
      )}
    </div>
  );
};

export default UploadButton;