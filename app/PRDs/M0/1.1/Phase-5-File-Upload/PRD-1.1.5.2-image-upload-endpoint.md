# PRD: Image Upload Endpoint

## 1. Overview

This PRD defines the backend API endpoint for handling image uploads in the Elite Trading Coach AI application, providing secure server-side processing and integration with Cloudinary storage service.

## 2. Feature Requirements

### 2.1 Functional Requirements
- **FR-1**: Create POST /api/upload/images endpoint for image uploads
- **FR-2**: Implement file validation and security checks
- **FR-3**: Process and upload images to Cloudinary storage
- **FR-4**: Generate optimized image URLs and thumbnails
- **FR-5**: Store upload metadata in database for tracking

### 2.2 Non-Functional Requirements
- **NFR-1**: Handle 10MB+ image uploads efficiently
- **NFR-2**: Process uploads within 10 seconds
- **NFR-3**: Support concurrent uploads from multiple users
- **NFR-4**: Maintain 99.9% upload success rate

## 3. User Stories

### 3.1 Primary User Stories
- **US-1**: As a user, I want to upload trading charts so the AI can analyze my technical setups
- **US-2**: As a developer, I want secure upload handling so malicious files cannot compromise the system
- **US-3**: As a system administrator, I want upload tracking so I can monitor storage usage

### 3.2 Edge Cases
- **EC-1**: Handling corrupted or malformed image files
- **EC-2**: Managing simultaneous uploads from the same user
- **EC-3**: Dealing with extremely large files that approach limits

## 4. Technical Specifications

### 4.1 Upload Endpoint Implementation
```javascript
// routes/upload.js
import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateToken } from '../middleware/auth.js';
import { validateUpload } from '../middleware/validation.js';
import { uploadService } from '../services/uploadService.js';
import { db } from '../lib/database.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
    files: 5 // Maximum 5 files per request
  },
  fileFilter: (req, file, cb) => {
    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// POST /api/upload/images
router.post('/images', 
  authenticateToken,
  upload.array('images', 5),
  validateUpload,
  async (req, res) => {
    try {
      const files = req.files;
      const userId = req.user.id;
      const { conversationId, context = 'chat' } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files provided'
        });
      }

      // Process each uploaded file
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          try {
            // Upload to Cloudinary
            const cloudinaryResult = await uploadService.uploadBuffer(
              file.buffer,
              {
                folder: `elite-trading-coach/${context}/${userId}`,
                public_id: `${Date.now()}_${file.originalname.split('.')[0]}`,
                resource_type: 'image',
                transformation: [
                  { quality: 'auto:good' },
                  { fetch_format: 'auto' }
                ],
                tags: [context, `user_${userId}`, 'upload']
              }
            );

            // Store upload record in database
            const uploadRecord = await db.query(`
              INSERT INTO uploads (
                id, user_id, conversation_id, cloudinary_public_id, 
                original_filename, file_type, file_size, secure_url, 
                thumbnail_url, context, created_at
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
              ) RETURNING *
            `, [
              userId,
              conversationId || null,
              cloudinaryResult.public_id,
              file.originalname,
              file.mimetype,
              file.size,
              cloudinaryResult.secure_url,
              uploadService.generateThumbnail(cloudinaryResult.public_id, 300, 300),
              context
            ]);

            return {
              id: uploadRecord.rows[0].id,
              publicId: cloudinaryResult.public_id,
              originalName: file.originalname,
              secureUrl: cloudinaryResult.secure_url,
              thumbnailUrl: uploadRecord.rows[0].thumbnail_url,
              width: cloudinaryResult.width,
              height: cloudinaryResult.height,
              format: cloudinaryResult.format,
              bytes: cloudinaryResult.bytes,
              createdAt: uploadRecord.rows[0].created_at
            };

          } catch (uploadError) {
            console.error('Individual file upload error:', uploadError);
            throw new Error(`Failed to upload ${file.originalname}: ${uploadError.message}`);
          }
        })
      );

      // Return success response
      res.status(201).json({
        success: true,
        data: {
          uploads: uploadResults,
          totalUploaded: uploadResults.length
        }
      });

    } catch (error) {
      console.error('Upload endpoint error:', error);
      
      res.status(500).json({
        success: false,
        error: error.message || 'Upload failed. Please try again.'
      });
    }
  }
);

// GET /api/upload/images/:id - Get upload details
router.get('/images/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await db.query(`
        SELECT 
          id, cloudinary_public_id, original_filename, file_type, 
          file_size, secure_url, thumbnail_url, context, created_at
        FROM uploads 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Upload not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Get upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve upload details'
      });
    }
  }
);

// DELETE /api/upload/images/:id - Delete uploaded image
router.delete('/images/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get upload details
      const uploadResult = await db.query(`
        SELECT cloudinary_public_id 
        FROM uploads 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (uploadResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Upload not found'
        });
      }

      const publicId = uploadResult.rows[0].cloudinary_public_id;

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(publicId);

      // Delete from database
      await db.query(`
        DELETE FROM uploads 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      res.json({
        success: true,
        message: 'Upload deleted successfully'
      });

    } catch (error) {
      console.error('Delete upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete upload'
      });
    }
  }
);

export default router;
```

### 4.2 Upload Service Implementation
```javascript
// services/uploadService.js
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

class UploadService {
  async uploadBuffer(buffer, options = {}) {
    try {
      // Validate and optimize image using Sharp
      const processedBuffer = await this.processImage(buffer);
      
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            ...options
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(processedBuffer);
      });
      
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async processImage(buffer) {
    try {
      // Get image metadata
      const metadata = await sharp(buffer).metadata();
      
      // Define max dimensions
      const maxWidth = 2048;
      const maxHeight = 2048;
      
      let processedBuffer = buffer;
      
      // Resize if image is too large
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        processedBuffer = await sharp(buffer)
          .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toBuffer();
      }
      
      return processedBuffer;
      
    } catch (error) {
      // If Sharp processing fails, return original buffer
      console.warn('Image processing failed, using original:', error.message);
      return buffer;
    }
  }

  generateThumbnail(publicId, width = 300, height = 300) {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto:good',
      fetch_format: 'auto'
    });
  }

  generateOptimizedUrl(publicId, transformations = {}) {
    return cloudinary.url(publicId, {
      quality: 'auto:good',
      fetch_format: 'auto',
      ...transformations
    });
  }
}

export const uploadService = new UploadService();
```

### 4.3 Database Schema for Uploads
```sql
-- Create uploads table
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL UNIQUE,
  original_filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  secure_url TEXT NOT NULL,
  thumbnail_url TEXT,
  context VARCHAR(50) DEFAULT 'chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_uploads_conversation_id ON uploads(conversation_id);
CREATE INDEX idx_uploads_created_at ON uploads(created_at);
CREATE INDEX idx_uploads_context ON uploads(context);
```

## 5. Acceptance Criteria

### 5.1 Definition of Done
- [ ] Upload endpoint handles multiple image files
- [ ] File validation and security checks implemented
- [ ] Cloudinary integration working properly
- [ ] Database storage for upload metadata
- [ ] Error handling for various failure scenarios
- [ ] Image optimization and thumbnail generation
- [ ] Authentication and authorization enforced
- [ ] API documentation updated

### 5.2 Testing Requirements
- [ ] Upload functionality with various image formats
- [ ] File size limit enforcement
- [ ] Concurrent upload handling
- [ ] Error scenarios (invalid files, network issues)
- [ ] Database integration tests
- [ ] Performance tests with large files

## 6. Dependencies

### 6.1 Technical Dependencies
- Cloudinary setup (PRD-1.1.5.1)
- Express.js server
- Multer for file handling
- Sharp for image processing
- PostgreSQL database
- JWT authentication middleware

### 6.2 Business Dependencies
- File storage requirements
- Image optimization needs
- User upload quotas and limits

## 7. Risks and Mitigations

### 7.1 Technical Risks
- **Risk**: Large file uploads causing memory issues
  - **Mitigation**: Use streaming uploads and memory limits
- **Risk**: Malicious file uploads compromising security
  - **Mitigation**: Strict validation and virus scanning

### 7.2 Business Risks
- **Risk**: High storage costs from large uploads
  - **Mitigation**: Implement file size limits and cleanup policies

### 7.3 QA Artifacts
- Test cases file: `QA/1.1.5.2-image-upload-endpoint/test-cases.md`
- Latest results: `QA/1.1.5.2-image-upload-endpoint/test-results-2025-08-14.md` (Overall Status: Pass required)


## 8. Success Metrics

### 8.1 Technical Metrics
- 99.9% upload success rate
- < 10 second processing time for 10MB files
- Support for 5 concurrent uploads per user
- Zero security incidents from file uploads

### 8.2 Business Metrics
- Seamless image sharing in chat
- Fast upload experience for users
- Reliable file storage and retrieval

## 9. Implementation Timeline

### 9.1 Development Phases
- **Phase 1**: Basic upload endpoint structure (4 hours)
- **Phase 2**: Cloudinary integration and processing (5 hours)
- **Phase 3**: Database integration and metadata storage (4 hours)
- **Phase 4**: Security, validation, and testing (5 hours)

### 9.2 Milestones
- **M1**: Basic upload endpoint working (Day 1)
- **M2**: Cloudinary integration complete (Day 2)
- **M3**: Database storage implemented (Day 2)
- **M4**: Security and testing completed (Day 3)

#### Execution Plan (Decomposed Tasks)

| Task ID | Owner (Role) | Description | Preconditions/Dependencies | Outputs (Files/PRD sections) | Risks/Issues | Status |
| --- | --- | --- | --- | --- | --- | --- |
| ORCH-TBD | Implementation Owner | Populate tasks per PRD | — | PRD §9.3 updated | — | Planned |


## 10. Appendices

### 10.1 Error Response Codes
```javascript
// API Error Responses
const errorCodes = {
  400: 'Bad Request - Invalid file or missing data',
  401: 'Unauthorized - Authentication required',
  413: 'Payload Too Large - File size exceeds limit',
  415: 'Unsupported Media Type - Invalid file format',
  422: 'Unprocessable Entity - File validation failed',
  500: 'Internal Server Error - Upload processing failed'
};
```

### 10.2 File Validation Rules
```javascript
// Upload validation configuration
const validationRules = {
  maxFileSize: 15 * 1024 * 1024, // 15MB
  maxFiles: 5,
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ],
  maxDimensions: {
    width: 4096,
    height: 4096
  }
};
```

### 10.3 Security Considerations
- Implement file type validation beyond MIME type checking
- Use virus scanning for uploaded files
- Rate limiting for upload endpoints
- Sanitize file names and metadata
- Monitor upload patterns for abuse detection

## 11. Agent-Generated Implementation Tasks

### Backend Implementation Tasks

**Task BE-1: Create Upload Route Handler with Multer Configuration**
- File: `/app/api/routes/upload.js`
- Action: Implement POST /api/upload/images endpoint with multer memory storage, 15MB file size limit, and file type validation for JPEG, PNG, GIF, WebP formats
- PRD Section: FR-1 (Create POST /api/upload/images endpoint)

**Task BE-2: Implement File Validation and Security Middleware**
- File: `/app/middleware/validation.js`
- Action: Create validateUpload middleware to check file types, validate MIME types, and enforce security rules for uploaded images
- PRD Section: FR-2 (Implement file validation and security checks)

**Task BE-3: Create Upload Service for Cloudinary Integration**
- File: `/app/services/uploadService.js`
- Action: Implement UploadService class with uploadBuffer method, processImage using Sharp for optimization, and Cloudinary stream upload handling
- PRD Section: FR-3 (Process and upload images to Cloudinary storage)

**Task BE-4: Implement Image Optimization and Thumbnail Generation**
- File: `/app/services/uploadService.js`
- Action: Add generateThumbnail and generateOptimizedUrl methods using Cloudinary transformations for 300x300 thumbnails and auto-optimized URLs
- PRD Section: FR-4 (Generate optimized image URLs and thumbnails)

**Task BE-5: Create Database Schema for Upload Metadata**
- File: `/app/db/schemas/uploads.sql`
- Action: Create uploads table with UUID id, user_id reference, cloudinary_public_id, file metadata fields, and performance indexes
- PRD Section: FR-5 (Store upload metadata in database for tracking)

**Task BE-6: Implement Database Storage for Upload Records**
- File: `/app/api/routes/upload.js`
- Action: Add database insertion logic to store upload metadata with user_id, conversation_id, file details, and Cloudinary URLs
- PRD Section: FR-5 (Store upload metadata in database for tracking)

**Task BE-7: Add GET Upload Details Endpoint**
- File: `/app/api/routes/upload.js`
- Action: Implement GET /api/upload/images/:id endpoint to retrieve upload metadata with user authorization checks
- PRD Section: Technical Implementation (GET upload details functionality)

**Task BE-8: Add DELETE Upload Endpoint**
- File: `/app/api/routes/upload.js`
- Action: Implement DELETE /api/upload/images/:id endpoint to remove uploads from both Cloudinary and database
- PRD Section: Technical Implementation (DELETE upload functionality)

**Task BE-9: Configure Concurrent Upload Processing**
- File: `/app/api/routes/upload.js`
- Action: Implement Promise.all parallel processing for multiple file uploads (up to 5 files) with individual error handling
- PRD Section: NFR-3 (Support concurrent uploads from multiple users)

**Task BE-10: Add Authentication Middleware Integration**
- File: `/app/api/routes/upload.js`
- Action: Integrate authenticateToken middleware to all upload endpoints and extract user ID for file organization
- PRD Section: Technical Implementation (Authentication enforcement)

**Task BE-11: Implement Error Handling and Response Formatting**
- File: `/app/api/routes/upload.js`
- Action: Add comprehensive error handling with specific HTTP status codes (400, 401, 413, 415, 422, 500) and structured JSON responses
- PRD Section: Technical Implementation (Error handling requirements)

**Task BE-12: Add Sharp Image Processing Pipeline**
- File: `/app/services/uploadService.js`
- Action: Implement processImage method using Sharp to resize images over 2048px dimensions and optimize JPEG quality to 85%
- PRD Section: NFR-1 (Handle 10MB+ image uploads efficiently)

### Frontend Integration Tasks

**Task FE-1: Update upload service to use backend API endpoint**
- File: `/app/src/services/uploadService.ts`
- Action: Modify uploadFile method to call POST /api/upload/images instead of direct Cloudinary upload
- PRD Section: §4.1 Upload Endpoint Implementation - connects frontend to backend endpoint

**Task FE-2: Create image upload API service function**
- File: `/app/src/services/chatAPI.ts`
- Action: Add uploadImages method to call POST /api/upload/images with multipart FormData
- PRD Section: §3.1 User Stories US-1 - enables trading chart uploads via backend

**Task FE-3: Update upload types for backend response format**
- File: `/app/src/types/upload.ts`
- Action: Add ImageUploadResponse type matching backend API response structure from §4.1
- PRD Section: §4.1 Upload Endpoint Implementation - type safety for API responses

**Task FE-4: Integrate chat message uploads with new endpoint**
- File: `/app/src/components/chat/MessageInput.tsx`
- Action: Update image upload handling to use new backend API and pass conversationId
- PRD Section: §4.1 Upload Endpoint Implementation - conversationId parameter integration

**Task FE-5: Update drag & drop component for backend integration**
- File: `/app/src/components/Upload/DragDropUpload.tsx`
- Action: Modify to use backend endpoint and handle multiple file uploads as specified in §4.1
- PRD Section: §4.1 Upload Endpoint Implementation - support for 5 concurrent uploads

### QA Validation Tasks

**Task QA-1: Upload functionality with various image formats**
- Test: Upload JPEG, PNG, GIF, and WebP image files to POST /api/upload/images endpoint
- Expected: All supported formats (JPEG, JPG, PNG, GIF, WebP) upload successfully and return 201 status with upload metadata
- PRD Section: 5.2 - Upload functionality with various image formats

**Task QA-2: File size limit enforcement**
- Test: Upload files at 15MB limit, below limit (5MB), and above limit (20MB)
- Expected: Files ≤15MB upload successfully, files >15MB rejected with 413 Payload Too Large error
- PRD Section: 5.2 - File size limit enforcement

**Task QA-3: Concurrent upload handling**
- Test: Simulate multiple users uploading files simultaneously and single user uploading multiple files concurrently
- Expected: System handles concurrent uploads without conflicts, maintains data integrity, supports up to 5 files per request
- PRD Section: 5.2 - Concurrent upload handling

**Task QA-4: Error scenarios with invalid files**
- Test: Upload non-image files, corrupted images, files with malicious extensions, and unsupported formats
- Expected: Invalid files rejected with appropriate error codes (400/415/422), proper error messages returned
- PRD Section: 5.2 - Error scenarios (invalid files, network issues)

**Task QA-5: Error scenarios with network issues**
- Test: Simulate network interruptions during upload, Cloudinary service unavailability, and connection timeouts
- Expected: Proper error handling with 500 status codes, graceful failure without data corruption
- PRD Section: 5.2 - Error scenarios (invalid files, network issues)

**Task QA-6: Database integration tests**
- Test: Verify upload metadata storage in uploads table, foreign key relationships with users/conversations tables
- Expected: Upload records correctly inserted with all required fields, proper UUID generation, timestamps accurate
- PRD Section: 5.2 - Database integration tests

**Task QA-7: Performance tests with large files**
- Test: Upload 10MB+ files and measure processing time, test system response under multiple large file uploads
- Expected: Files process within 10 seconds as specified in NFR-2, system maintains performance under load
- PRD Section: 5.2 - Performance tests with large files
## 8. Changelog
- - orch: scaffold + QA links updated on 2025-08-14. on 2025-08-14.
