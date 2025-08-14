# PRD: Cloudinary Setup

## 1. Overview

This PRD defines the Cloudinary cloud storage integration for the Elite Trading Coach AI application, providing secure, scalable image and file upload capabilities with automatic optimization and delivery.

## 2. Feature Requirements

### 2.1 Functional Requirements
- **FR-1**: Configure Cloudinary account and API credentials
- **FR-2**: Set up secure upload presets for different file types
- **FR-3**: Implement automatic image optimization and transformation
- **FR-4**: Configure CDN delivery for fast global access
- **FR-5**: Establish folder structure for organized file management

### 2.2 Non-Functional Requirements
- **NFR-1**: Support for 10MB file uploads
- **NFR-2**: Global CDN delivery with < 200ms load times
- **NFR-3**: 99.9% upload success rate
- **NFR-4**: Secure upload with signed URLs

## 3. User Stories

### 3.1 Primary User Stories
- **US-1**: As a developer, I want Cloudinary configured so users can upload images to the chat
- **US-2**: As a user, I want fast image loading so my trading charts display quickly
- **US-3**: As a system administrator, I want secure uploads so only authorized users can upload files

### 3.2 Edge Cases
- **EC-1**: Handling large file uploads that approach size limits
- **EC-2**: Managing upload failures and retry mechanisms
- **EC-3**: Dealing with unsupported file formats

## 4. Technical Specifications

### 4.1 Cloudinary Configuration
```javascript
// src/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Server-side configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Upload presets configuration
export const uploadPresets = {
  chat_images: {
    preset_name: 'elite_chat_images',
    folder: 'elite-trading-coach/chat/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    max_file_size: 10000000, // 10MB
    max_image_width: 2048,
    max_image_height: 2048,
    quality: 'auto:good',
    fetch_format: 'auto'
  },
  trading_charts: {
    preset_name: 'elite_trading_charts',
    folder: 'elite-trading-coach/charts',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    max_file_size: 15000000, // 15MB
    max_image_width: 4096,
    max_image_height: 4096,
    quality: 'auto:best',
    fetch_format: 'auto'
  },
  documents: {
    preset_name: 'elite_documents',
    folder: 'elite-trading-coach/documents',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
    max_file_size: 25000000 // 25MB
  }
};

export default cloudinary;
```

### 4.2 Upload Service Implementation
```typescript
// src/services/uploadService.ts
import { uploadPresets } from '@config/cloudinary';

export interface UploadOptions {
  preset: keyof typeof uploadPresets;
  folder?: string;
  public_id?: string;
  tags?: string[];
}

export interface UploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  created_at: string;
}

class UploadService {
  private cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`;

  async uploadFile(file: File, options: UploadOptions): Promise<UploadResult> {
    const preset = uploadPresets[options.preset];
    if (!preset) {
      throw new Error(`Invalid upload preset: ${options.preset}`);
    }

    // Validate file
    this.validateFile(file, preset);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', preset.preset_name);
    
    if (options.folder) {
      formData.append('folder', options.folder);
    }
    
    if (options.public_id) {
      formData.append('public_id', options.public_id);
    }
    
    if (options.tags) {
      formData.append('tags', options.tags.join(','));
    }

    try {
      const response = await fetch(this.cloudinaryUploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return this.transformResult(result);
      
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload file. Please try again.');
    }
  }

  async uploadMultipleFiles(
    files: File[], 
    options: UploadOptions
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  private validateFile(file: File, preset: any): void {
    // Check file size
    if (file.size > preset.max_file_size) {
      throw new Error(`File size exceeds limit of ${preset.max_file_size / 1000000}MB`);
    }

    // Check file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (preset.allowed_formats && !preset.allowed_formats.includes(fileExtension)) {
      throw new Error(`File format '${fileExtension}' is not allowed`);
    }
  }

  private transformResult(result: any): UploadResult {
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      created_at: result.created_at
    };
  }

  // Generate optimized image URLs
  generateImageUrl(
    publicId: string, 
    transformations?: string
  ): string {
    const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    if (transformations) {
      return `${baseUrl}/${transformations}/${publicId}`;
    }
    
    // Default optimizations
    return `${baseUrl}/q_auto,f_auto,w_auto,dpr_auto/${publicId}`;
  }

  // Generate thumbnail URLs
  generateThumbnail(
    publicId: string, 
    width: number = 150, 
    height: number = 150
  ): string {
    return this.generateImageUrl(
      publicId, 
      `w_${width},h_${height},c_fill,q_auto,f_auto`
    );
  }
}

export const uploadService = new UploadService();
```

### 4.3 Environment Variables
```bash
# .env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend environment variables
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET_IMAGES=elite_chat_images
VITE_CLOUDINARY_UPLOAD_PRESET_CHARTS=elite_trading_charts
VITE_CLOUDINARY_UPLOAD_PRESET_DOCS=elite_documents
```

## 5. Acceptance Criteria

### 5.1 Definition of Done
- [ ] Cloudinary account configured with API credentials
- [ ] Upload presets created for different file types
- [ ] Upload service implemented with validation
- [ ] Image optimization and transformation working
- [ ] CDN delivery configured for fast loading
- [ ] Error handling for upload failures
- [ ] Environment variables properly set

### 5.2 Testing Requirements
- [ ] File upload functionality tested
- [ ] Image optimization verified
- [ ] Upload validation working correctly
- [ ] CDN delivery performance measured
- [ ] Error scenarios handled properly

## 6. Dependencies

### 6.1 Technical Dependencies
- Cloudinary account and API access
- Environment variable configuration
- Frontend file upload components
- Backend API integration

### 6.2 Business Dependencies
- File storage requirements
- Image optimization needs
- CDN performance expectations

## 7. Risks and Mitigations

### 7.1 Technical Risks
- **Risk**: Cloudinary service outages affecting uploads
  - **Mitigation**: Implement fallback storage options and retry logic
- **Risk**: API key exposure in frontend code
  - **Mitigation**: Use signed uploads and server-side proxy

### 7.2 Business Risks
- **Risk**: High storage costs with large file volumes
  - **Mitigation**: Implement file size limits and cleanup policies

## 8. Success Metrics

### 8.1 Technical Metrics
- 99.9% upload success rate
- < 200ms CDN delivery time globally
- Support for 10MB+ file uploads
- Automatic image optimization working

### 8.2 Business Metrics
- Seamless file sharing experience
- Fast image loading in chat
- Reliable file storage and delivery

## 9. Implementation Timeline

### 9.1 Development Phases
- **Phase 1**: Cloudinary account setup and configuration (2 hours)
- **Phase 2**: Upload presets and folder structure (2 hours)
- **Phase 3**: Upload service implementation (4 hours)
- **Phase 4**: Testing and optimization (3 hours)

### 9.2 Milestones
- **M1**: Cloudinary account configured (Day 1)
- **M2**: Upload service implemented (Day 1)
- **M3**: Image optimization working (Day 1)
- **M4**: Testing completed (Day 2)

## 10. Appendices

### 10.1 Cloudinary Upload Presets Configuration
```javascript
// Upload preset settings in Cloudinary dashboard
const chatImagesPreset = {
  preset_name: 'elite_chat_images',
  mode: 'unsigned', // For client-side uploads
  folder: 'elite-trading-coach/chat/images',
  allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  max_file_size: 10000000,
  max_image_width: 2048,
  max_image_height: 2048,
  quality: 'auto:good',
  fetch_format: 'auto',
  unique_filename: true,
  use_filename: true,
  invalidate: true,
  tags: ['chat', 'user_upload']
};
```

### 10.2 Image Transformation Examples
```typescript
// Common image transformations
const transformations = {
  thumbnail: 'w_150,h_150,c_fill,q_auto,f_auto',
  medium: 'w_500,h_500,c_limit,q_auto,f_auto',
  large: 'w_1200,h_1200,c_limit,q_auto,f_auto',
  chart_preview: 'w_800,h_600,c_fit,q_auto:best,f_auto',
  avatar: 'w_100,h_100,c_fill,g_face,q_auto,f_auto,r_max'
};
```

### 10.3 Security Considerations
- Use signed uploads for sensitive operations
- Implement server-side upload validation
- Configure upload presets with appropriate restrictions
- Monitor upload usage and implement rate limiting
- Regular cleanup of unused files to manage storage costs