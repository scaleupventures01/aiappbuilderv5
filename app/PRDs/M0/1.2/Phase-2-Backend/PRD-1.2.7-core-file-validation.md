---
id: 1.2.7
title: Core File Validation Framework
status: Planned
owner: AI Product Manager
assigned_roles: [Backend Engineer]
created: 2025-08-15
updated: 2025-08-15
---

# Core File Validation Framework PRD

## Overview

### Sprint 1.2 Context
This PRD supports Sub-Milestone 2 (Days 4-6) of the Founder MVP Sprint Plan, which requires secure chart image uploads for GPT-5 trade analysis. The validation framework ensures only legitimate trading chart images reach the AI analysis pipeline.

### Purpose
Fix critical file size enforcement bug and implement comprehensive file validation including magic bytes verification to prevent file type spoofing attacks, enabling safe chart uploads for trade analysis.

### Scope
This PRD focuses on the technical validation foundation layer:
- Fix file size bypass vulnerability (files over 5MB for images can upload)
- Implement true binary header validation (magic bytes)
- Add file structure integrity checks
- Create performance-optimized validation pipeline

### Success Metrics
- 100% enforcement of file size limits (5MB images, 2MB avatars, 10MB documents)
- Zero files bypass magic bytes validation
- Validation completes within 100ms for 5MB files
- No false positives on legitimate files

## Current System Reality
- **File Limits**: 5MB for images (not 10MB as originally documented)
- **Storage**: Memory-based with Cloudinary integration
- **Existing**: Basic MIME type checking in `uploadValidation.js`
- **Gap**: No binary header validation, file size enforcement has bypass bug

## Functional Requirements

### File Size Enforcement Fix
- Double-validation: Check Content-Length header AND streaming size
- Abort uploads that exceed limits during streaming
- Return specific error codes for size violations
- Work with existing memory storage paradigm

### Magic Bytes Validation
- Validate PNG headers: [0x89, 0x50, 0x4E, 0x47]
- Validate JPEG/JPG headers: [0xFF, 0xD8, 0xFF]
- Support WebP and GIF formats
- Integrate seamlessly with existing multer middleware

## Technical Implementation

```javascript
// Enhanced validation service
export class CoreFileValidator {
  validateFileSize(headers, stream, limits) {
    // Pre-upload header check
    if (parseInt(headers['content-length']) > limits.fileSize) {
      throw new FileSizeError('FILE_TOO_LARGE_HEADER');
    }
    
    // Streaming validation
    let size = 0;
    stream.on('data', (chunk) => {
      size += chunk.length;
      if (size > limits.fileSize) {
        stream.destroy();
        throw new FileSizeError('FILE_TOO_LARGE_STREAM');
      }
    });
  }
  
  validateMagicBytes(buffer, mimeType) {
    const magicBytes = {
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/webp': [0x52, 0x49, 0x46, 0x46]
    };
    
    const expected = magicBytes[mimeType];
    if (!expected) return { valid: false, error: 'UNSUPPORTED_TYPE' };
    
    for (let i = 0; i < expected.length; i++) {
      if (buffer[i] !== expected[i]) {
        return { valid: false, error: 'INVALID_MAGIC_BYTES' };
      }
    }
    
    return { valid: true };
  }
}
```

## Testing Requirements

### Critical Test Scenarios
- Upload 5MB image → Success
- Upload 5MB + 1 byte → Rejection
- PNG file with JPEG header → Rejection
- Executable renamed to .png → Rejection
- Valid files of all types → Success

### Performance Requirements
- File size validation: < 10ms
- Magic bytes check: < 20ms
- Total validation: < 100ms
- Memory overhead: < 10MB

## Dependencies
- Existing `uploadValidation.js` middleware
- Multer configuration with memory storage
- File-type library for enhanced validation

## Implementation Timeline
- **Effort**: 5 hours
- **Priority**: CRITICAL (security vulnerability)
- **Dependencies**: None (foundation layer)

## Acceptance Criteria
- [ ] File size limits enforced without bypass
- [ ] Magic bytes validation blocks spoofed files
- [ ] Integration maintains existing functionality
- [ ] Performance targets met
- [ ] Zero false positives on legitimate files