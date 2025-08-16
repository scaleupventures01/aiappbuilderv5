#!/usr/bin/env node

/**
 * Simple test for upload endpoint
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import { Buffer } from 'buffer';

async function testUpload() {
  console.log('Testing upload endpoint...\n');
  
  // Create a simple test image (1x1 PNG)
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0x99, 0x63, 0xF8, 0x0F, 0x00, 0x00,
    0x01, 0x01, 0x00, 0x01, 0x2D, 0xD4, 0x3F, 0x68,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
    0xAE, 0x42, 0x60, 0x82 // IEND chunk
  ]);
  
  try {
    // First, let's check if the endpoint exists (without auth)
    console.log('1. Checking endpoint exists...');
    const checkResponse = await fetch('http://localhost:3001/api/upload/images', {
      method: 'POST'
    });
    console.log(`   Status: ${checkResponse.status} ${checkResponse.statusText}`);
    
    if (checkResponse.status === 401) {
      console.log('   ✓ Endpoint exists and requires authentication\n');
    } else if (checkResponse.status === 404) {
      console.log('   ✗ Endpoint not found\n');
      
      // Check available routes
      console.log('2. Checking server status...');
      const messagesResponse = await fetch('http://localhost:3001/api/messages', {
        method: 'GET'
      });
      console.log(`   Messages endpoint: ${messagesResponse.status}`);
      
      return;
    }
    
    // Now test with a mock JWT token (this will likely fail but shows the flow)
    console.log('2. Testing with mock authentication...');
    const formData = new FormData();
    formData.append('images', pngBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    formData.append('context', 'chat');
    
    const uploadResponse = await fetch('http://localhost:3001/api/upload/images', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log(`   Status: ${uploadResponse.status}`);
    
    const responseText = await uploadResponse.text();
    
    try {
      const result = JSON.parse(responseText);
      console.log('   Response:', JSON.stringify(result, null, 2));
    } catch {
      console.log('   Response (raw):', responseText.substring(0, 200));
    }
    
    if (uploadResponse.status === 401) {
      console.log('\n✓ Upload endpoint is working but needs valid JWT authentication');
      console.log('  To fully test uploads, you need:');
      console.log('  1. A valid JWT token from user authentication');
      console.log('  2. Cloudinary credentials configured in .env');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n✗ Server is not running on port 3001');
    }
  }
}

testUpload();