#!/usr/bin/env node

/**
 * Quick Upload Validation Test
 * Directly test the upload API with real files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testUpload() {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTZhOTM3OC0xNWZmLTQzYWMtODI1YS0wYzFlODRiYTVjNmIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc1NTMwNTMyMSwiZXhwIjoxNzU1MzA2MjIxLCJhdWQiOiJlbGl0ZS10cmFkaW5nLWNvYWNoLXVzZXJzIiwiaXNzIjoiZWxpdGUtdHJhZGluZy1jb2FjaC1haSJ9.3eqfEuMeEflAgyvnoJJbiL0q5g3Tm2C4c68cVhnaxHc';
    
    console.log('🧪 Testing upload API...');
    
    try {
        // Test authentication first
        console.log('1. Testing authentication...');
        const authResponse = await fetch('http://localhost:3001/api/auth/verify-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });
        
        if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log('✅ Authentication successful:', authData.data);
        } else {
            console.log('❌ Authentication failed:', authResponse.status);
            return;
        }
        
        // Test upload with small file
        console.log('2. Testing file upload...');
        const testFile = 'test-valid-image.png';
        
        if (!fs.existsSync(testFile)) {
            console.log('❌ Test file not found:', testFile);
            return;
        }
        
        const fileBuffer = fs.readFileSync(testFile);
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: 'image/png' });
        formData.append('images', blob, testFile);
        formData.append('context', 'validation-test');
        
        const uploadResponse = await fetch('http://localhost:3001/api/upload/images', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            console.log('✅ Upload successful!');
            console.log('   Files uploaded:', uploadData.results.length);
            console.log('   Cloudinary URL:', uploadData.results[0].secureUrl);
        } else {
            const errorData = await uploadResponse.json();
            console.log('❌ Upload failed:', errorData.error);
            console.log('   Details:', errorData.details);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testUpload();