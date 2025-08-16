#!/usr/bin/env node

/**
 * Create simple test images for browser upload testing
 * Uses canvas-like functionality in Node.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createTestFile(filename, sizeKB, content = 'test') {
    /**
     * Create a test file with specified size
     */
    const targetSize = sizeKB * 1024;
    let fileContent = content;
    
    // Pad content to reach target size
    while (Buffer.byteLength(fileContent, 'utf8') < targetSize) {
        fileContent += content.repeat(100);
    }
    
    // Trim to exact size
    fileContent = fileContent.substring(0, targetSize);
    
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, fileContent);
    
    const actualSize = fs.statSync(filepath).size;
    console.log(`Created ${filename}: ${(actualSize / 1024).toFixed(2)}KB`);
    return filepath;
}

function createImageFile(filename, widthHeight = '800x600', sizeMB = 1) {
    /**
     * Create a mock image file with proper JPEG headers
     */
    const targetSize = sizeMB * 1024 * 1024;
    
    // Basic JPEG header (simplified)
    const jpegHeader = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0,  // JPEG SOI and APP0
        0x00, 0x10,              // APP0 length
        0x4A, 0x46, 0x49, 0x46, 0x00,  // "JFIF\0"
        0x01, 0x01,              // JFIF version
        0x01,                    // Aspect ratio units
        0x00, 0x48, 0x00, 0x48,  // X and Y density
        0x00, 0x00               // Thumbnail dimensions
    ]);
    
    // Create metadata comment
    const comment = `Test image ${filename} ${widthHeight} ${sizeMB}MB for upload testing`;
    const commentBuffer = Buffer.from(comment, 'utf8');
    
    // Fill remaining space with pseudo-image data
    const remainingSize = targetSize - jpegHeader.length - commentBuffer.length - 2; // -2 for JPEG EOI
    const imageData = Buffer.alloc(remainingSize, 0x88); // Fill with pattern
    
    // JPEG End of Image marker
    const jpegEOI = Buffer.from([0xFF, 0xD9]);
    
    // Combine all parts
    const fullImage = Buffer.concat([jpegHeader, commentBuffer, imageData, jpegEOI]);
    
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, fullImage);
    
    const actualSize = fs.statSync(filepath).size / (1024 * 1024);
    console.log(`Created ${filename}: ${actualSize.toFixed(2)}MB`);
    return filepath;
}

function createInvalidFile(filename, sizeMB = 1) {
    /**
     * Create an invalid file type for testing error handling
     */
    const targetSize = sizeMB * 1024 * 1024;
    const content = 'This is not a valid image file'.repeat(Math.ceil(targetSize / 34));
    
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, content.substring(0, targetSize));
    
    const actualSize = fs.statSync(filepath).size / (1024 * 1024);
    console.log(`Created ${filename}: ${actualSize.toFixed(2)}MB`);
    return filepath;
}

function main() {
    console.log('Creating test files for browser upload testing...\n');
    
    try {
        // Valid image files
        createImageFile('test-small.jpg', '400x300', 0.5);
        createImageFile('test-medium.jpg', '800x600', 2.0);
        createImageFile('test-large.jpg', '1920x1080', 10.0);
        createImageFile('test-oversized.jpg', '4000x3000', 20.0); // Should fail size limit
        
        // Multiple small images for batch testing
        for (let i = 1; i <= 5; i++) {
            createImageFile(`test-batch-${i}.jpg`, '300x200', 0.2);
        }
        
        // Create various file types for testing
        createImageFile('test-png.png', '800x600', 1.5);
        createImageFile('test-gif.gif', '400x400', 0.8);
        createImageFile('test-webp.webp', '600x400', 1.2);
        
        // Invalid file types (should be rejected)
        createInvalidFile('test-invalid.exe', 1.0);
        createInvalidFile('test-invalid.pdf', 0.5);
        createTestFile('test-text.txt', 100, 'This is a text file for testing\n');
        
        console.log('\n✅ Test files created successfully!');
        console.log('\nFiles available for testing:');
        
        const files = fs.readdirSync(__dirname).filter(file => file.startsWith('test-'));
        files.forEach(file => {
            const filepath = path.join(__dirname, file);
            const stats = fs.statSync(filepath);
            const size = stats.size > 1024 * 1024 
                ? `${(stats.size / (1024 * 1024)).toFixed(2)}MB`
                : `${(stats.size / 1024).toFixed(2)}KB`;
            console.log(`  📄 ${file}: ${size}`);
        });
        
        console.log('\n📋 Test Instructions:');
        console.log('1. Open browser-upload-test.html in your browser');
        console.log('2. Use the created test files to verify upload functionality');
        console.log('3. Test scenarios:');
        console.log('   - Single file upload (test-small.jpg)');
        console.log('   - Multiple file upload (test-batch-*.jpg)');
        console.log('   - Large file handling (test-large.jpg)');
        console.log('   - Oversized file rejection (test-oversized.jpg)');
        console.log('   - Invalid file type rejection (test-invalid.exe)');
        console.log('   - Different image formats (PNG, GIF, WebP)');
        
    } catch (error) {
        console.error('❌ Error creating test files:', error.message);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { createImageFile, createTestFile, createInvalidFile };