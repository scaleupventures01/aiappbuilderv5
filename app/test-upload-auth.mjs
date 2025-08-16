/**
 * Upload Authentication Test Script
 * Tests upload endpoints with valid JWT authentication
 */

import { generateAccessToken } from './utils/jwt.js';

// Create a mock user for testing
const mockUser = {
  id: 'test-user-12345',
  email: 'qatest@elitetradingcoach.ai',
  username: 'qa_test_user'
};

// Generate a valid JWT token
const token = generateAccessToken(mockUser);

console.log('🔐 Generated test JWT token for upload testing');
console.log('Token preview:', token.substring(0, 50) + '...');

console.log('\n📤 Testing authenticated upload endpoints...');

// Test authenticated POST request
const testAuthenticatedPost = async () => {
  try {
    const response = await fetch('http://localhost:3002/api/upload/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('POST /api/upload/images with auth:', response.status);
    return response.status;
  } catch (error) {
    console.log('POST /api/upload/images error:', error.message);
    return 'ERROR';
  }
};

// Test authenticated GET request
const testAuthenticatedGet = async () => {
  try {
    const response = await fetch('http://localhost:3002/api/upload/images/test-id', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('GET /api/upload/images/:id with auth:', response.status);
    return response.status;
  } catch (error) {
    console.log('GET /api/upload/images/:id error:', error.message);
    return 'ERROR';
  }
};

// Run tests
(async () => {
  console.log('\n🧪 Running authenticated upload tests...');
  await testAuthenticatedPost();
  await testAuthenticatedGet();
  console.log('\n✅ Authentication test completed');
})();

export { token };