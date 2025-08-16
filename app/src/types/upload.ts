// Upload Types for Cloudinary Integration
import React from 'react';
export interface UploadFile {
  file: File;
  id: string;
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  cloudinaryResult?: CloudinaryUploadResult;
  uploadStartTime?: number;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
}

export interface UploadResponse {
  success: boolean;
  data?: CloudinaryUploadResult | BackendUploadResult | ImageUploadData;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface DragDropUploadProps {
  // eslint-disable-next-line no-unused-vars
  onFilesAdded: (files: File[]) => void;
  // eslint-disable-next-line no-unused-vars
  onFilesRemoved?: (fileIds: string[]) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface UploadButtonProps {
  // eslint-disable-next-line no-unused-vars
  onFilesSelected: (files: File[]) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
  children?: React.ReactNode;
}

export interface UploadProgressProps {
  files: UploadFile[];
  // eslint-disable-next-line no-unused-vars
  onRetry?: (fileId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onRemove?: (fileId: string) => void;
  className?: string;
}

export interface ImagePreviewProps {
  file: UploadFile;
  // eslint-disable-next-line no-unused-vars
  onRemove?: (fileId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onRetry?: (fileId: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export type UploadPresetType = 'USER_AVATAR' | 'TRADE_SCREENSHOT' | 'DOCUMENT';

export interface UploadServiceConfig {
  cloudName?: string;
  uploadPreset?: UploadPresetType;
  apiKey?: string;
  apiBaseUrl?: string;
}

export interface SignedUploadParams {
  timestamp: number;
  signature: string;
  api_key: string;
  cloud_name: string;
  upload_preset?: string;
  public_id?: string;
  folder?: string;
}

// Backend API Response Types (based on PRD section 4.1)
export interface BackendUploadResult {
  id: string;
  public_id: string;
  secure_url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
  original_name: string;
  created_at: string;
}

export interface UploadItem {
  id: string;
  publicId: string;
  originalName: string;
  secureUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  createdAt: string;
}

export interface ImageUploadData {
  uploads: UploadItem[];
  totalUploaded: number;
}

export interface ImageUploadResponse {
  success: boolean;
  data: ImageUploadData;
  error?: string;
}