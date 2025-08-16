import type { FileValidationOptions, ValidationResult } from '../types/upload';

/**
 * Default file size limits (in bytes)
 */
export const DEFAULT_FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  AVATAR: 2 * 1024 * 1024, // 2MB
} as const;

/**
 * Default allowed MIME types
 */
export const DEFAULT_ALLOWED_TYPES = {
  IMAGES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  ALL: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
} as const;

/**
 * Validate a single file
 */
export const validateFile = (
  file: File,
  options: FileValidationOptions = {}
): ValidationResult => {
  const {
    maxSize = DEFAULT_FILE_SIZE_LIMITS.IMAGE,
    allowedTypes = DEFAULT_ALLOWED_TYPES.ALL
  } = options;

  const errors: string[] = [];

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }

  // Check file type
  if (allowedTypes && !allowedTypes.includes(file.type as any)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Check if file is actually a file
  if (!file.name || file.name.trim() === '') {
    errors.push('File must have a valid name');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate multiple files
 */
export const validateFiles = (
  files: File[],
  options: FileValidationOptions = {}
): ValidationResult => {
  const {
    maxFiles = 10,
    ...fileOptions
  } = options;

  const errors: string[] = [];

  // Check file count
  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed`);
  }

  if (files.length === 0) {
    errors.push('At least one file is required');
  }

  // Validate each file
  files.forEach((file, index) => {
    const fileResult = validateFile(file, fileOptions);
    if (!fileResult.isValid) {
      fileResult.errors.forEach(error => {
        errors.push(`File ${index + 1}: ${error}`);
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return DEFAULT_ALLOWED_TYPES.IMAGES.includes(file.type as any);
};

/**
 * Check if file is a document
 */
export const isDocumentFile = (file: File): boolean => {
  return DEFAULT_ALLOWED_TYPES.DOCUMENTS.includes(file.type as any);
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Create a preview URL for image files
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Generate a unique file ID
 */
export const generateFileId = (file: File): string => {
  return `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`;
};

/**
 * Validate upload preset based on file type
 */
export const getRecommendedUploadPreset = (file: File): 'USER_AVATAR' | 'TRADE_SCREENSHOT' | 'DOCUMENT' => {
  if (isImageFile(file)) {
    // Determine if it's likely an avatar (small image) or trade screenshot
    if (file.size <= DEFAULT_FILE_SIZE_LIMITS.AVATAR) {
      return 'USER_AVATAR';
    }
    return 'TRADE_SCREENSHOT';
  }
  return 'DOCUMENT';
};

/**
 * Check if file type is supported by Cloudinary
 */
export const isCloudinarySupported = (file: File): boolean => {
  const supportedTypes = [
    ...DEFAULT_ALLOWED_TYPES.IMAGES,
    ...DEFAULT_ALLOWED_TYPES.DOCUMENTS
  ];
  return supportedTypes.includes(file.type as any);
};

/**
 * Sanitize filename for upload
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
};