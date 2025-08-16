import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔍 TOKEN DEBUG - Environment Check');
console.log('=====================================');

// Check JWT secret
const jwtSecret = process.env.JWT_SECRET;
console.log('JWT_SECRET exists:', !!jwtSecret);
console.log('JWT_SECRET length:', jwtSecret ? jwtSecret.length : 0);

// Generate a test token
const testPayload = {
  sub: '896a9378-15ff-43ac-825a-0c1e84ba5c6b',
  email: 'test@example.com',
  username: 'testuser',
  type: 'access',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
  aud: 'elite-trading-coach-users',
  iss: 'elite-trading-coach-ai'
};

console.log('\n🔑 TOKEN GENERATION');
console.log('===================');
console.log('Payload:', JSON.stringify(testPayload, null, 2));

try {
  const token = jwt.sign(testPayload, jwtSecret);
  console.log('Generated token:', token);
  
  // Verify the token
  console.log('\n✅ TOKEN VERIFICATION');
  console.log('=====================');
  const decoded = jwt.verify(token, jwtSecret);
  console.log('Decoded token:', JSON.stringify(decoded, null, 2));
  
  // Test with curl
  console.log('\n🧪 CURL TEST COMMAND');
  console.log('====================');
  console.log(`curl -X POST \\
  -H "Authorization: Bearer ${token}" \\
  -F "images=@test-image.png" \\
  http://localhost:3001/api/upload/images`);
  
} catch (error) {
  console.error('Token error:', error.message);
}
