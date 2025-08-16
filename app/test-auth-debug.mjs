#!/usr/bin/env node

/**
 * Debug JWT authentication issues
 */

import { config } from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
config();
config({ path: '.env.development' });

const jwtSecret = process.env.JWT_SECRET;
console.log('JWT Secret:', jwtSecret ? `${jwtSecret.substring(0, 10)}...` : 'NOT SET');

// Test token generation and verification
const testUser = {
    id: "896a9378-15ff-43ac-825a-0c1e84ba5c6b",
    email: "test@example.com",
    username: "testuser",
    subscription_tier: "founder"
};

try {
    // Generate token
    const token = jwt.sign(
        {
            sub: testUser.id,
            email: testUser.email,
            username: testUser.username,
            type: 'access'
        },
        jwtSecret,
        {
            expiresIn: '15m',
            audience: 'elite-trading-coach-users',
            issuer: 'elite-trading-coach-ai'
        }
    );
    
    console.log('\n🔑 Generated Token:');
    console.log(token);
    
    // Verify token
    const decoded = jwt.verify(token, jwtSecret, {
        audience: 'elite-trading-coach-users',
        issuer: 'elite-trading-coach-ai'
    });
    
    console.log('\n✅ Token verification successful:');
    console.log(decoded);
    
    // Test the API directly
    console.log('\n🧪 Testing API with generated token...');
    
    const authResponse = await fetch('http://localhost:3001/api/auth/verify-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
    });
    
    if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('✅ API auth test successful:', authData);
    } else {
        const errorData = await authResponse.json();
        console.log('❌ API auth test failed:', errorData);
    }
    
} catch (error) {
    console.error('❌ Token test failed:', error.message);
}