# PRD-1.1.2.1: Express Server Initialization

**Status**: Not Started
**Owner**: Backend Engineer
**Estimated Hours**: 6
**Dependencies**: PRD-1.1.1.4-messages-table.md

## 1. Problem Statement
The Elite Trading Coach AI platform requires a robust backend server to handle HTTP requests, WebSocket connections for real-time chat, API endpoints for data operations, and integration with external services (OpenAI, Cloudinary). Without a properly configured Express server, the frontend cannot communicate with the database or AI services, making the chat-based trading coach functionality impossible.

## 2. User Story
As a trader using the platform, I want a fast, reliable backend service that enables real-time chat interactions, secure data storage, and seamless AI-powered trade analysis so that I can focus on trading without technical interruptions or delays.

## 3. Success Metrics
- KPI 1: Server startup time <3 seconds
- KPI 2: API response time <200ms for standard operations
- KPI 3: WebSocket connection stability >99% uptime

## 4. Functional Requirements
- [ ] Express server configured with TypeScript support
- [ ] WebSocket integration with Socket.io for real-time chat
- [ ] RESTful API endpoints for core functionality
- [ ] Database connection pooling and management
- [ ] Authentication middleware with JWT
- [ ] File upload handling for chart images
- [ ] Error handling and logging system
- [ ] Environment-based configuration
- [ ] Health check endpoint for monitoring

## 5. Non-Functional Requirements
- Performance: Handle 100+ concurrent WebSocket connections, API responses <200ms
- Security: HTTPS/WSS encryption, rate limiting, input validation
- Reliability: Graceful error handling, automatic reconnection for dropped connections

## 6. Technical Specifications

### Preconditions
- Database tables created (users, conversations, messages)
- Node.js 18+ environment configured
- Required environment variables set
- External service credentials configured (OpenAI, Cloudinary)

### Postconditions  
- Express server running and accepting HTTP/WebSocket connections
- All API endpoints functional and documented
- Database operations working through server
- Real-time chat functionality operational

### Implementation Details
**Server Architecture:**
```typescript
// server/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { setupDatabase } from './database/connection';
import { setupWebSocket } from './websocket/chat-handler';
import { authRoutes } from './routes/auth';
import { conversationRoutes } from './routes/conversations';
import { messageRoutes } from './routes/messages';
import { uploadRoutes } from './routes/uploads';
import { healthRoutes } from './routes/health';
import { errorHandler } from './middleware/error-handler';
import { logger } from './utils/logger';

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Server configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
```

**Middleware Stack:**
```typescript
// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "https://res.cloudinary.com"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});
```

**API Routes Structure:**
```typescript
// API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/health', healthRoutes);

// WebSocket setup
setupWebSocket(io);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});
```

**WebSocket Configuration:**
```typescript
// websocket/chat-handler.ts
import { Server } from 'socket.io';
import { authenticateSocket } from '../middleware/auth';
import { handleMessage } from '../services/message-service';
import { logger } from '../utils/logger';

export function setupWebSocket(io: Server) {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected`);
    
    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    
    // Handle new messages
    socket.on('send_message', async (data) => {
      try {
        const result = await handleMessage(socket.userId, data);
        socket.emit('message_sent', result);
        
        // Queue AI processing if needed
        if (data.content || data.imageUrl) {
          socket.emit('ai_thinking');
          // Process AI response asynchronously
        }
      } catch (error) {
        socket.emit('message_error', { error: error.message });
      }
    });

    // Handle conversation management
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected`);
    });
  });
}
```

**Environment Configuration:**
```typescript
// config/environment.ts
export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d'
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4-vision-preview'
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
  }
};
```

## 7. Testing Requirements

### 7.1 Unit Tests
- [ ] Test server initialization and configuration
- [ ] Test middleware stack functionality
- [ ] Test API route handlers
- [ ] Test WebSocket connection handling
- [ ] Test error handling middleware

### 7.2 Integration Tests
- [ ] Test complete HTTP request/response cycle
- [ ] Test WebSocket message flow
- [ ] Test database connection through server
- [ ] Test authentication middleware
- [ ] Test file upload endpoints

### 7.3 Acceptance Criteria
- [ ] Criteria 1: Server starts successfully and accepts connections on configured port
- [ ] Criteria 2: WebSocket connections establish and maintain stable communication
- [ ] Criteria 3: All API endpoints respond with proper status codes and data formats

## 8. Rollback Plan
1. Document current server configuration
2. Create server startup/shutdown scripts
3. Test rollback to previous server version
4. Document environment variable rollback
5. Verify database connections after rollback

## 9. Documentation Requirements
- [ ] Server architecture and middleware documentation
- [ ] API endpoint documentation with examples
- [ ] WebSocket event documentation
- [ ] Environment variable configuration guide
- [ ] Deployment and scaling guidelines

## 10. Sign-off
- [ ] Product Manager Review
- [ ] Technical Lead Review
- [ ] QA Review
- [ ] Implementation Complete