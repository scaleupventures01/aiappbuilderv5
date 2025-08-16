# ORCH Authentication System

A production-ready OAuth 2.0 authentication system with Google, GitHub, and Microsoft providers. Built with Express.js, Sequelize, Redis, and comprehensive security features.

## Features

### Core Authentication
- **OAuth 2.0 Support**: Google, GitHub, and Microsoft providers
- **JWT Tokens**: Secure access and refresh token management
- **Session Management**: Redis-backed sessions with automatic cleanup
- **User Management**: Complete user profile and account management

### Security Features
- **CSRF Protection**: Cross-Site Request Forgery prevention
- **Rate Limiting**: Adaptive rate limiting with multiple tiers
- **Input Validation**: Comprehensive request validation
- **Security Headers**: Helmet.js security headers
- **Audit Logging**: Complete audit trail for security events

### Production Ready
- **Health Checks**: Comprehensive health monitoring
- **Error Handling**: Centralized error handling with sanitization
- **Logging**: Structured logging with Winston
- **Performance Monitoring**: Request timing and performance metrics
- **Database Management**: Automatic migrations and cleanup

## Quick Start

### 1. Installation

```bash
# Navigate to the auth directory
cd auth

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### 2. Environment Configuration

Edit `.env` file with your configuration:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/orch_auth
DB_NAME=orch_auth
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Session & JWT Secrets (generate with crypto.randomBytes(32).toString('hex'))
SESSION_SECRET=your_32_character_session_secret
JWT_ACCESS_SECRET=your_32_character_jwt_access_secret
JWT_REFRESH_SECRET=your_different_32_character_jwt_refresh_secret

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

### 3. OAuth Provider Setup

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)

#### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Create a new OAuth app
3. Set Authorization callback URL:
   - `http://localhost:3001/api/auth/github/callback` (development)
   - `https://yourdomain.com/api/auth/github/callback` (production)

#### Microsoft OAuth Setup
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory > App registrations
3. Create new registration
4. Add redirect URIs:
   - `http://localhost:3001/api/auth/microsoft/callback` (development)
   - `https://yourdomain.com/api/auth/microsoft/callback` (production)

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb orch_auth

# Start Redis server
redis-server

# The application will automatically create tables on first run
```

### 5. Start the Server

```bash
# Development
npm run start:auth

# The server will start on http://localhost:3001
```

## API Endpoints

### Authentication Endpoints

#### OAuth Initiation
- `GET /api/auth/google` - Start Google OAuth flow
- `GET /api/auth/github` - Start GitHub OAuth flow  
- `GET /api/auth/microsoft` - Start Microsoft OAuth flow

#### Session Management
- `GET /api/auth/status` - Get authentication status
- `GET /api/auth/profile` - Get authenticated user profile
- `POST /api/auth/refresh` - Refresh JWT tokens
- `POST /api/auth/logout` - Logout (current session)
- `POST /api/auth/logout-all` - Logout from all devices

### User Management Endpoints

#### Profile Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

#### Session Management
- `GET /api/users/sessions` - List active sessions
- `DELETE /api/users/sessions/:sessionId` - Revoke specific session
- `DELETE /api/users/sessions` - Revoke all other sessions

#### OAuth Provider Management
- `GET /api/users/providers` - List linked OAuth providers
- `DELETE /api/users/providers/:providerId` - Unlink OAuth provider

#### Account Management
- `GET /api/users/security` - Get security information
- `DELETE /api/users/account` - Delete user account

### System Endpoints

#### Health & Monitoring
- `GET /health` - Basic health check
- `GET /api/health` - Detailed health check
- `GET /api/docs` - API documentation

## Authentication Flow

### 1. OAuth Authentication
```javascript
// Frontend initiates OAuth
window.location.href = '/api/auth/google';

// User is redirected to Google
// After authorization, user is redirected back with tokens
// Tokens are set as secure HTTP-only cookies
```

### 2. Using JWT Tokens
```javascript
// Tokens are automatically included in cookies
// Or use Authorization header
fetch('/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### 3. Token Refresh
```javascript
// Automatic refresh when access token expires
fetch('/api/auth/refresh', {
  method: 'POST'
});
```

## Security Features

### CSRF Protection
All state-changing requests require CSRF tokens:

```javascript
// Get CSRF token
const response = await fetch('/api/auth/csrf-token');
const { csrf } = await response.json();

// Include in requests
fetch('/api/auth/logout', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrf
  }
});
```

### Rate Limiting
Multiple rate limiting tiers:
- **Global**: 100 requests per 15 minutes
- **Authentication**: 10 attempts per 15 minutes
- **API**: 60 requests per minute
- **Strict**: 5 requests per hour (sensitive operations)

### Session Security
- Secure HTTP-only cookies
- Session rotation on login
- Automatic cleanup of expired sessions
- Session tracking and management

## Database Schema

### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  display_name VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_picture TEXT,
  locale VARCHAR(5),
  timezone VARCHAR,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### OAuth Providers Table
```sql
oauth_providers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR NOT NULL, -- 'google', 'github', 'microsoft'
  provider_id VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  display_name VARCHAR,
  profile_data JSONB,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  scope VARCHAR[],
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Sessions & Tokens
- `user_sessions` - Active user sessions
- `refresh_tokens` - JWT refresh tokens
- `security_events` - Security audit log

## Error Handling

### Error Response Format
```json
{
  "error": "Error Type",
  "message": "Human readable message",
  "statusCode": 400,
  "errorId": "err_1234567890_abcdef123",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "details": [] // Additional error details if applicable
}
```

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error (server issues)

## Monitoring & Logging

### Structured Logging
All events are logged with structured data:
- Request/response logging
- Authentication events
- Security events
- Performance metrics
- Error tracking

### Log Files
- `logs/app.log` - General application logs
- `logs/error.log` - Error logs
- `logs/security.log` - Security events
- `logs/auth-audit.log` - Authentication audit trail

### Health Monitoring
```bash
# Check health status
curl http://localhost:3001/health

# Detailed health check
curl http://localhost:3001/api/health
```

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test auth.test.mjs

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
The test suite covers:
- OAuth authentication flows
- JWT token management
- Session management
- User profile operations
- Security features
- Error handling
- Database operations

## Deployment

### Production Configuration
1. Set `NODE_ENV=production`
2. Use HTTPS URLs for all endpoints
3. Set strong secrets (32+ characters)
4. Enable database SSL
5. Configure Redis authentication
6. Set up log rotation
7. Configure monitoring

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:auth"]
```

### Environment Variables for Production
```bash
NODE_ENV=production
BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
DB_SSL=true
REDIS_PASSWORD=your_strong_redis_password
# ... other production settings
```

## Security Considerations

### Secrets Management
- Use environment variables for all secrets
- Rotate secrets regularly
- Use different secrets for different environments
- Never commit secrets to version control

### HTTPS Configuration
- Always use HTTPS in production
- Set secure cookie flags
- Configure HSTS headers
- Use proper SSL certificates

### Database Security
- Use strong database passwords
- Enable SSL connections
- Limit database access
- Regular security updates

### Monitoring & Alerting
- Monitor authentication failures
- Alert on unusual activity
- Track rate limit violations
- Monitor system health

## Support & Maintenance

### Regular Maintenance
- Monitor logs for errors
- Clean up expired sessions/tokens
- Update dependencies
- Review security events
- Performance monitoring

### Troubleshooting
Common issues and solutions:
- OAuth callback mismatches
- Database connection issues
- Redis connection problems
- Rate limiting false positives
- Session configuration issues

For detailed troubleshooting, check the application logs and health endpoints.

## License

This authentication system is part of the ORCH project and follows the project's licensing terms.