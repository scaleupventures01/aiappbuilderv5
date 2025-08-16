/**
 * WebSocket Chat Handler - Elite Trading Coach AI
 * Handles real-time chat and messaging functionality
 * Created: 2025-08-14
 */

import { 
  socketRateLimit, 
  requireTier, 
  validateSocketConnection,
  handleSocketDisconnect 
} from '../middleware/socket-auth.js';
import {
  joinConversationRoom,
  leaveConversationRoom,
  broadcastMessage,
  broadcastSystemEvent,
  broadcastTyping,
  cleanupUserRooms
} from './broadcast-manager.js';

/**
 * Active connections and room management
 */
const activeConnections = new Map();
const userRooms = new Map();

/**
 * Initialize chat handlers for a socket
 */
export const initializeChatHandlers = (socket, io) => {
  console.log(`Initializing chat handlers for user ${socket.userId}`);
  
  // Add to active connections
  activeConnections.set(socket.userId, {
    socket,
    connectedAt: new Date(),
    lastActivity: new Date()
  });
  
  // Join user to their personal room
  const userRoom = `user_${socket.userId}`;
  socket.join(userRoom);
  userRooms.set(socket.userId, userRoom);
  
  // Set up event handlers
  setupMessageHandlers(socket, io);
  setupConversationHandlers(socket, io);
  setupPresenceHandlers(socket, io);
  setupTypingHandlers(socket, io);
  
  // Handle disconnect
  socket.on('disconnect', (reason) => {
    handleChatDisconnect(socket, reason, io);
  });
  
  // Emit user online status
  socket.broadcast.emit('user_online', {
    userId: socket.userId,
    timestamp: new Date().toISOString()
  });
};

/**
 * Message handling events
 */
const setupMessageHandlers = (socket, io) => {
  // Rate limit for messaging
  const messageRateLimit = socketRateLimit({
    windowMs: 60000, // 1 minute
    maxEvents: 10,
    keyGenerator: (socket) => `messages_${socket.userId}`
  });
  
  // Send new message
  socket.on('send_message', messageRateLimit, async (data, callback) => {
    try {
      updateLastActivity(socket.userId);
      
      const validation = validateMessageData(data);
      if (!validation.valid) {
        return callback({ 
          success: false, 
          error: validation.error 
        });
      }
      
      // Import message operations (avoid circular imports)
      const { createMessage } = await import('../../db/queries/messages.js');
      
      // Create message in database
      const messageData = {
        conversation_id: data.conversationId,
        user_id: socket.userId,
        content: data.content,
        message_type: data.type || 'text',
        metadata: data.metadata || {},
        parent_message_id: data.parentMessageId || null
      };
      
      const newMessage = await createMessage(messageData);
      
      // Broadcast to conversation participants
      const conversationRoom = `conversation_${data.conversationId}`;
      io.to(conversationRoom).emit('new_message', {
        message: newMessage,
        sender: {
          id: socket.userId,
          email: socket.userEmail
        },
        timestamp: new Date().toISOString()
      });
      
      // Send confirmation to sender
      if (callback) {
        callback({ 
          success: true, 
          message: newMessage 
        });
      }
      
      console.log(`Message sent: User ${socket.userId} in conversation ${data.conversationId}`);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (callback) {
        callback({ 
          success: false, 
          error: 'Failed to send message' 
        });
      }
    }
  });
  
  // Edit message
  socket.on('edit_message', messageRateLimit, async (data, callback) => {
    try {
      updateLastActivity(socket.userId);
      
      const { updateMessage, getMessageById } = await import('../../db/queries/messages.js');
      
      // Check if user owns the message
      const existingMessage = await getMessageById(data.messageId);
      if (!existingMessage || existingMessage.user_id !== socket.userId) {
        return callback({ 
          success: false, 
          error: 'Message not found or unauthorized' 
        });
      }
      
      // Update message
      const updatedMessage = await updateMessage(data.messageId, {
        content: data.content,
        edited_at: new Date()
      });
      
      // Broadcast update
      const conversationRoom = `conversation_${existingMessage.conversation_id}`;
      io.to(conversationRoom).emit('message_updated', {
        message: updatedMessage,
        editedBy: socket.userId,
        timestamp: new Date().toISOString()
      });
      
      if (callback) {
        callback({ 
          success: true, 
          message: updatedMessage 
        });
      }
      
    } catch (error) {
      console.error('Error editing message:', error);
      
      if (callback) {
        callback({ 
          success: false, 
          error: 'Failed to edit message' 
        });
      }
    }
  });
  
  // Delete message
  socket.on('delete_message', async (data, callback) => {
    try {
      updateLastActivity(socket.userId);
      
      const { getMessageById, deleteMessage } = await import('../../db/queries/messages.js');
      
      // Check if user owns the message
      const existingMessage = await getMessageById(data.messageId);
      if (!existingMessage || existingMessage.user_id !== socket.userId) {
        return callback({ 
          success: false, 
          error: 'Message not found or unauthorized' 
        });
      }
      
      // Delete message
      await deleteMessage(data.messageId);
      
      // Broadcast deletion
      const conversationRoom = `conversation_${existingMessage.conversation_id}`;
      io.to(conversationRoom).emit('message_deleted', {
        messageId: data.messageId,
        deletedBy: socket.userId,
        timestamp: new Date().toISOString()
      });
      
      if (callback) {
        callback({ success: true });
      }
      
    } catch (error) {
      console.error('Error deleting message:', error);
      
      if (callback) {
        callback({ 
          success: false, 
          error: 'Failed to delete message' 
        });
      }
    }
  });
};

/**
 * Conversation handling events
 */
const setupConversationHandlers = (socket, io) => {
  // Join conversation room
  socket.on('join_conversation', async (data, callback) => {
    try {
      updateLastActivity(socket.userId);
      
      const { getConversationById } = await import('../../db/queries/conversations.js');
      
      // Validate user has access to conversation
      const conversation = await getConversationById(data.conversationId);
      if (!conversation || conversation.user_id !== socket.userId) {
        return callback({ 
          success: false, 
          error: 'Conversation not found or unauthorized' 
        });
      }
      
      const conversationRoom = `conversation_${data.conversationId}`;
      socket.join(conversationRoom);
      
      // Notify others in conversation
      socket.to(conversationRoom).emit('user_joined_conversation', {
        userId: socket.userId,
        conversationId: data.conversationId,
        timestamp: new Date().toISOString()
      });
      
      if (callback) {
        callback({ success: true });
      }
      
      console.log(`User ${socket.userId} joined conversation ${data.conversationId}`);
      
    } catch (error) {
      console.error('Error joining conversation:', error);
      
      if (callback) {
        callback({ 
          success: false, 
          error: 'Failed to join conversation' 
        });
      }
    }
  });
  
  // Leave conversation room
  socket.on('leave_conversation', (data, callback) => {
    try {
      updateLastActivity(socket.userId);
      
      const conversationRoom = `conversation_${data.conversationId}`;
      socket.leave(conversationRoom);
      
      // Notify others in conversation
      socket.to(conversationRoom).emit('user_left_conversation', {
        userId: socket.userId,
        conversationId: data.conversationId,
        timestamp: new Date().toISOString()
      });
      
      if (callback) {
        callback({ success: true });
      }
      
      console.log(`User ${socket.userId} left conversation ${data.conversationId}`);
      
    } catch (error) {
      console.error('Error leaving conversation:', error);
      
      if (callback) {
        callback({ 
          success: false, 
          error: 'Failed to leave conversation' 
        });
      }
    }
  });
};

/**
 * Presence and status handling
 */
const setupPresenceHandlers = (socket, io) => {
  // Update user status
  socket.on('update_status', (data, callback) => {
    try {
      updateLastActivity(socket.userId);
      
      const validStatuses = ['online', 'away', 'busy', 'offline'];
      if (!validStatuses.includes(data.status)) {
        return callback({ 
          success: false, 
          error: 'Invalid status' 
        });
      }
      
      // Update connection data
      const connection = activeConnections.get(socket.userId);
      if (connection) {
        connection.status = data.status;
        connection.lastActivity = new Date();
      }
      
      // Broadcast status update
      socket.broadcast.emit('user_status_changed', {
        userId: socket.userId,
        status: data.status,
        timestamp: new Date().toISOString()
      });
      
      if (callback) {
        callback({ success: true });
      }
      
    } catch (error) {
      console.error('Error updating status:', error);
      
      if (callback) {
        callback({ 
          success: false, 
          error: 'Failed to update status' 
        });
      }
    }
  });
  
  // Get online users
  socket.on('get_online_users', (callback) => {
    try {
      const onlineUsers = Array.from(activeConnections.entries()).map(([userId, data]) => ({
        userId,
        status: data.status || 'online',
        lastActivity: data.lastActivity
      }));
      
      if (callback) {
        callback({ 
          success: true, 
          users: onlineUsers 
        });
      }
      
    } catch (error) {
      console.error('Error getting online users:', error);
      
      if (callback) {
        callback({ 
          success: false, 
          error: 'Failed to get online users' 
        });
      }
    }
  });
};

/**
 * Typing indicators
 */
const setupTypingHandlers = (socket, io) => {
  const typingRateLimit = socketRateLimit({
    windowMs: 1000, // 1 second
    maxEvents: 5
  });
  
  // User started typing
  socket.on('typing_start', typingRateLimit, (data, callback) => {
    try {
      updateLastActivity(socket.userId);
      
      const conversationRoom = `conversation_${data.conversationId}`;
      socket.to(conversationRoom).emit('user_typing_start', {
        userId: socket.userId,
        conversationId: data.conversationId,
        timestamp: new Date().toISOString()
      });
      
      if (callback) {
        callback({ success: true });
      }
      
    } catch (error) {
      console.error('Error handling typing start:', error);
    }
  });
  
  // User stopped typing
  socket.on('typing_stop', typingRateLimit, (data, callback) => {
    try {
      updateLastActivity(socket.userId);
      
      const conversationRoom = `conversation_${data.conversationId}`;
      socket.to(conversationRoom).emit('user_typing_stop', {
        userId: socket.userId,
        conversationId: data.conversationId,
        timestamp: new Date().toISOString()
      });
      
      if (callback) {
        callback({ success: true });
      }
      
    } catch (error) {
      console.error('Error handling typing stop:', error);
    }
  });
};

/**
 * Handle chat disconnect
 */
const handleChatDisconnect = (socket, reason, io) => {
  console.log(`Chat disconnect: User ${socket.userId} - Reason: ${reason}`);
  
  // Remove from active connections
  activeConnections.delete(socket.userId);
  userRooms.delete(socket.userId);
  
  // Notify others of disconnect
  socket.broadcast.emit('user_offline', {
    userId: socket.userId,
    timestamp: new Date().toISOString(),
    reason
  });
  
  // Call the base disconnect handler
  handleSocketDisconnect(socket, reason);
};

/**
 * Utility functions
 */
const validateMessageData = (data) => {
  if (!data.conversationId) {
    return { valid: false, error: 'Conversation ID required' };
  }
  
  if (!data.content || data.content.trim().length === 0) {
    return { valid: false, error: 'Message content required' };
  }
  
  if (data.content.length > 5000) {
    return { valid: false, error: 'Message too long (max 5000 characters)' };
  }
  
  return { valid: true };
};

const updateLastActivity = (userId) => {
  const connection = activeConnections.get(userId);
  if (connection) {
    connection.lastActivity = new Date();
  }
};

/**
 * Get chat statistics
 */
export const getChatStats = () => {
  return {
    activeConnections: activeConnections.size,
    totalRooms: userRooms.size,
    users: Array.from(activeConnections.keys())
  };
};

/**
 * Broadcast system message to all users
 */
export const broadcastSystemMessage = (io, message) => {
  io.emit('system_message', {
    message,
    timestamp: new Date().toISOString(),
    type: 'system'
  });
};

export default initializeChatHandlers;