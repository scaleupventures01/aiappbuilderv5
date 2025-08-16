/**
 * Simple Chat Server for Demo
 * Minimal Express server with Socket.IO for chat functionality
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRoutes from './api/routes/upload.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Socket.IO setup with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5175",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5175",
  credentials: true
}));

app.use(express.json());

// Upload routes
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Chat server is running',
    timestamp: new Date().toISOString(),
    websocket: {
      status: 'active',
      connectedClients: io.sockets.sockets.size
    }
  });
});

// Upload health check
app.get('/health/upload', async (req, res) => {
  try {
    // Import upload service to check configuration
    const { uploadService } = await import('./services/uploadService.js');
    
    const healthCheck = {
      success: true,
      message: 'Upload system health check',
      data: {
        timestamp: new Date().toISOString(),
        components: {
          uploadService: {
            status: uploadService.isConfigured ? 'healthy' : 'error',
            message: uploadService.isConfigured ? 'Cloudinary service configured' : 'Cloudinary not configured',
            configured: uploadService.isConfigured
          }
        }
      }
    };

    // Set appropriate status code
    const statusCode = uploadService.isConfigured ? 200 : 503;
    
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    console.error('Upload health check error:', error);
    res.status(503).json({
      success: false,
      message: 'Upload health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Chat messages API endpoint
app.get('/api/messages', (req, res) => {
  // Return mock messages for demo
  res.json({
    success: true,
    data: {
      messages: [
        {
          id: '1',
          content: 'Welcome to Elite Trading Coach AI! How can I help you with your trading today?',
          type: 'ai',
          createdAt: new Date().toISOString(),
          metadata: {
            confidence: 0.95,
            category: 'greeting'
          }
        }
      ],
      conversation: {
        id: 'demo-conversation',
        title: 'Trading Discussion',
        created_at: new Date().toISOString()
      }
    }
  });
});

// Send message endpoint
app.post('/api/messages', (req, res) => {
  const { content, conversationId } = req.body;
  
  const userMessage = {
    id: `msg_${Date.now()}_user`,
    content,
    type: 'user',
    createdAt: new Date().toISOString(),
    user_id: 'demo-user'
  };

  // Broadcast the user message
  io.emit('message', userMessage);

  // Simulate AI response after a delay
  setTimeout(() => {
    const aiMessage = {
      id: `msg_${Date.now()}_ai`,
      content: generateAIResponse(content),
      type: 'ai',
      createdAt: new Date().toISOString(),
      metadata: {
        confidence: 0.85,
        category: 'trading_advice'
      }
    };
    
    io.emit('message', aiMessage);
  }, 1000);

  res.json({
    success: true,
    data: { message: userMessage }
  });
});

// Simple AI response generator for demo
function generateAIResponse(userInput) {
  const responses = [
    "That's an interesting question about trading. Let me help you analyze this from a risk management perspective.",
    "Based on current market conditions, I'd recommend considering your position size and stop-loss levels.",
    "Great point! Technical analysis shows some key support and resistance levels we should discuss.",
    "From a trading psychology standpoint, it's important to manage emotions and stick to your strategy.",
    "Let's review the fundamentals here. What's your current risk tolerance for this trade?"
  ];
  
  // Simple keyword-based responses
  if (userInput.toLowerCase().includes('buy') || userInput.toLowerCase().includes('purchase')) {
    return "Before making any purchase decisions, let's analyze the market trends and your risk appetite. What's your investment timeline?";
  }
  
  if (userInput.toLowerCase().includes('sell') || userInput.toLowerCase().includes('exit')) {
    return "For exit strategies, consider your profit targets and stop-loss levels. Are you looking at technical indicators or fundamental changes?";
  }
  
  if (userInput.toLowerCase().includes('risk')) {
    return "Risk management is crucial in trading. Consider position sizing, diversification, and never risk more than you can afford to lose.";
  }
  
  // Default response
  return responses[Math.floor(Math.random() * responses.length)];
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a default room for the demo
  socket.join('demo-conversation');

  // Handle new messages
  socket.on('send_message', (data) => {
    console.log('Message received:', data);
    
    const message = {
      id: `msg_${Date.now()}_${socket.id}`,
      content: data.content,
      type: 'user',
      createdAt: new Date().toISOString(),
      user_id: socket.id
    };

    // Broadcast to all clients in the room
    io.to('demo-conversation').emit('message', message);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: `msg_${Date.now()}_ai`,
        content: generateAIResponse(data.content),
        type: 'ai',
        createdAt: new Date().toISOString(),
        metadata: {
          confidence: Math.random() * 0.3 + 0.7, // 0.7 - 1.0
          category: 'trading_advice'
        }
      };
      
      io.to('demo-conversation').emit('message', aiResponse);
    }, 1500);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to('demo-conversation').emit('typing', {
      userId: socket.id,
      isTyping: data.isTyping
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Chat server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5175"}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});