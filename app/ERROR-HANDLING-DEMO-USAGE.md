# Error Handling Demo - Usage Instructions

## Quick Start

1. **Start the server:**
   ```bash
   cd app
   PORT=9000 node server.js
   ```

2. **Open the demo page:**
   
   **Option A: Server-served (Recommended)**
   ```bash
   open http://localhost:9000/working-error-demo.html
   ```
   
   **Option B: Direct file access**
   ```bash
   open working-error-demo.html
   ```

## CORS Issue Resolution

### Problem
The demo page was experiencing "Failed to fetch" errors due to CORS (Cross-Origin Resource Sharing) restrictions when accessing the page directly via file:// protocol.

### Root Cause
When you open an HTML file directly in the browser using `file://` protocol, the browser sends an `Origin: file://` header with requests. The original CORS configuration only allowed specific HTTP origins like `http://localhost:3000`, `http://localhost:5173`, etc.

### Solution Implemented
1. **Updated CORS configuration** in `/app/server/middleware/cors-config.js` to allow `file://` origins in development mode
2. **Enabled static file serving** in the server so the demo can be served from `http://localhost:9000/working-error-demo.html`

### Current Status
✅ **Both methods now work:**
- **Server-served**: `http://localhost:9000/working-error-demo.html` (same-origin requests, no CORS issues)
- **Direct file**: `file:///.../working-error-demo.html` (CORS allowed for file:// in development)

## Demo Features

The error handling demo tests the following functionality:

### 1. Server Connection Test
- Tests basic server health endpoint
- Validates API connectivity
- Shows connection status in real-time

### 2. Error Response Format Testing
- Tests standardized error response structure
- Validates error codes and messages
- Tests different HTTP error scenarios (404, 405, auth)

### 3. File Upload Error Simulation
- Simulates various upload error scenarios
- Tests file size and format validation
- Shows error messaging and retry options

### 4. Retry Mechanism Demo
- Tests automatic retry functionality
- Demonstrates manual retry workflows
- Shows retry exhaustion behavior

### 5. Error Types Classification
- Displays all error types and their properties
- Shows retryable vs non-retryable errors
- Demonstrates auto-retry vs manual retry scenarios

### 6. Live Test Log
- Real-time logging of all test activities
- Export functionality for debugging
- Clear console for fresh testing

## Troubleshooting

### If the demo still shows "Failed to fetch" errors:

1. **Check server is running:**
   ```bash
   curl http://localhost:9000/health
   ```
   Should return JSON with `"success": true`

2. **Check CORS configuration:**
   ```bash
   curl http://localhost:9000/health/cors
   ```
   Should show allowed origins including localhost patterns

3. **Try server-served version:**
   Use `http://localhost:9000/working-error-demo.html` instead of opening the file directly

4. **Check browser console:**
   Open browser DevTools (F12) and check for specific error messages

### Common Issues

- **Server not running**: Start with `PORT=9000 node server.js`
- **Wrong port**: Demo expects server on port 9000
- **Browser cache**: Hard refresh with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

## Technical Details

### CORS Configuration Changes
Added support for `file://` protocol in development:
```javascript
const devPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/\[::1\]:\d+$/, // IPv6 localhost
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Local network
  /^file:\/\/.*$/ // Allow file:// protocol for local HTML files (development only)
];
```

### Static File Serving
Server configured to serve static files in development mode with security restrictions:
- Only serves specific file types (.html, .js, .css, .png, .jpg)
- Prevents directory traversal
- Sets appropriate security headers

## Security Notes

- The `file://` CORS allowance is **DEVELOPMENT ONLY**
- Production builds will not allow `file://` origins
- Static file serving is restricted to development environment
- All CORS violations are logged for monitoring