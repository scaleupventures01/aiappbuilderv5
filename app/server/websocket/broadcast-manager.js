/**
 * Socket.IO Broadcast Manager - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.2.7-socket-broadcast.md
 * Handles room-based broadcasting, presence tracking, and delivery confirmation
 * Created: 2025-08-14
 */

import { getSocketIOInstance } from './socket-manager.js';

/**
 * Room management and tracking
 */
const roomUsers = new Map(); // Map<roomName, Set<userId>>
const userRooms = new Map(); // Map<userId, Set<roomName>>
const messageAcks = new Map(); // Map<messageId, AckTracking>

/**
 * Room naming convention
 */
const getRoomName = (conversationId) => `conversation_${conversationId}`;

/**
 * Join a conversation room
 * @param {Object} socket - Socket instance
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 */
export const joinConversationRoom = (socket, conversationId, userId) => {
  const roomName = getRoomName(conversationId);
  
  // Join the room
  socket.join(roomName);
  
  // Track room membership
  if (!roomUsers.has(roomName)) {
    roomUsers.set(roomName, new Set());
  }
  roomUsers.get(roomName).add(userId);
  
  // Track user's rooms
  if (!userRooms.has(userId)) {
    userRooms.set(userId, new Set());
  }
  userRooms.get(userId).add(roomName);
  
  // Broadcast user joined event
  broadcastSystemEvent(conversationId, 'user_joined', {
    userId,
    userCount: roomUsers.get(roomName).size
  }, socket.id);
  
  console.log(`User ${userId} joined room ${roomName}`);
  
  return {
    success: true,
    roomName,
    userCount: roomUsers.get(roomName).size
  };
};

/**
 * Leave a conversation room
 * @param {Object} socket - Socket instance
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 */
export const leaveConversationRoom = (socket, conversationId, userId) => {
  const roomName = getRoomName(conversationId);
  
  // Leave the room
  socket.leave(roomName);
  
  // Update room membership
  if (roomUsers.has(roomName)) {
    roomUsers.get(roomName).delete(userId);
    
    // Clean up empty rooms
    if (roomUsers.get(roomName).size === 0) {
      roomUsers.delete(roomName);
    }
  }
  
  // Update user's rooms
  if (userRooms.has(userId)) {
    userRooms.get(userId).delete(roomName);
    
    // Clean up if user has no rooms
    if (userRooms.get(userId).size === 0) {
      userRooms.delete(userId);
    }
  }
  
  // Broadcast user left event
  broadcastSystemEvent(conversationId, 'user_left', {
    userId,
    userCount: roomUsers.get(roomName)?.size || 0
  }, socket.id);
  
  console.log(`User ${userId} left room ${roomName}`);
  
  return {
    success: true,
    roomName,
    userCount: roomUsers.get(roomName)?.size || 0
  };
};

/**
 * Broadcast a message to a conversation room
 * @param {string} conversationId - Conversation ID
 * @param {Object} message - Message to broadcast
 * @param {string} excludeSocketId - Socket ID to exclude from broadcast
 */
export const broadcastMessage = (conversationId, message, excludeSocketId = null) => {
  const io = getSocketIOInstance();
  if (!io) {
    console.error('Socket.IO instance not available for broadcasting');
    return false;
  }
  
  const roomName = getRoomName(conversationId);
  
  // Add timestamp if not present
  if (!message.timestamp) {
    message.timestamp = new Date().toISOString();
  }
  
  // Broadcast to room
  if (excludeSocketId) {
    // Exclude specific socket (usually the sender)
    io.to(roomName).except(excludeSocketId).emit('new_message', message);
  } else {
    io.to(roomName).emit('new_message', message);
  }
  
  console.log(`Message broadcast to room ${roomName}:`, {
    messageId: message.id,
    userCount: roomUsers.get(roomName)?.size || 0,
    excluded: !!excludeSocketId
  });
  
  return true;
};

/**
 * Broadcast a system event to a conversation room
 * @param {string} conversationId - Conversation ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 * @param {string} excludeSocketId - Socket ID to exclude
 */
export const broadcastSystemEvent = (conversationId, event, data, excludeSocketId = null) => {
  const io = getSocketIOInstance();
  if (!io) {
    console.error('Socket.IO instance not available for system events');
    return false;
  }
  
  const roomName = getRoomName(conversationId);
  
  const eventData = {
    type: 'system',
    event,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  if (excludeSocketId) {
    io.to(roomName).except(excludeSocketId).emit(event, eventData);
  } else {
    io.to(roomName).emit(event, eventData);
  }
  
  console.log(`System event broadcast to room ${roomName}:`, {
    event,
    userCount: roomUsers.get(roomName)?.size || 0
  });
  
  return true;
};

/**
 * Broadcast typing indicator
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID who is typing
 * @param {boolean} isTyping - Typing state
 * @param {string} excludeSocketId - Socket ID to exclude
 */
export const broadcastTyping = (conversationId, userId, isTyping, excludeSocketId = null) => {
  const io = getSocketIOInstance();
  if (!io) {
    return false;
  }
  
  const roomName = getRoomName(conversationId);
  
  const typingData = {
    userId,
    isTyping,
    timestamp: new Date().toISOString()
  };
  
  if (excludeSocketId) {
    io.to(roomName).except(excludeSocketId).emit('typing_indicator', typingData);
  } else {
    io.to(roomName).emit('typing_indicator', typingData);
  }
  
  return true;
};

/**
 * Broadcast with acknowledgment tracking
 * @param {string} conversationId - Conversation ID
 * @param {Object} message - Message to broadcast
 * @param {Function} callback - Callback when all acks received
 */
export const broadcastWithAck = (conversationId, message, callback) => {
  const io = getSocketIOInstance();
  if (!io) {
    callback({ success: false, error: 'Socket.IO not available' });
    return;
  }
  
  const roomName = getRoomName(conversationId);
  const messageId = message.id || Date.now().toString();
  
  // Get sockets in room
  const socketsInRoom = io.sockets.adapter.rooms.get(roomName);
  if (!socketsInRoom || socketsInRoom.size === 0) {
    callback({ success: true, acknowledged: 0, expected: 0 });
    return;
  }
  
  const expectedAcks = socketsInRoom.size;
  
  // Track acknowledgments
  messageAcks.set(messageId, {
    expected: expectedAcks,
    received: 0,
    acknowledged: new Set(),
    callback,
    timeout: setTimeout(() => {
      // Timeout after 5 seconds
      const tracking = messageAcks.get(messageId);
      if (tracking) {
        messageAcks.delete(messageId);
        tracking.callback({
          success: false,
          error: 'Acknowledgment timeout',
          acknowledged: tracking.received,
          expected: tracking.expected
        });
      }
    }, 5000)
  });
  
  // Broadcast with ack request
  io.to(roomName).emit('message_with_ack', message, (socketId) => {
    handleMessageAck(messageId, socketId);
  });
  
  console.log(`Message broadcast with ack tracking:`, {
    messageId,
    roomName,
    expectedAcks
  });
};

/**
 * Handle message acknowledgment
 * @param {string} messageId - Message ID
 * @param {string} socketId - Acknowledging socket ID
 */
const handleMessageAck = (messageId, socketId) => {
  const tracking = messageAcks.get(messageId);
  if (!tracking) {
    return; // Already completed or timed out
  }
  
  // Prevent duplicate acks
  if (tracking.acknowledged.has(socketId)) {
    return;
  }
  
  tracking.acknowledged.add(socketId);
  tracking.received++;
  
  console.log(`Ack received for message ${messageId}: ${tracking.received}/${tracking.expected}`);
  
  // Check if all acks received
  if (tracking.received >= tracking.expected) {
    clearTimeout(tracking.timeout);
    messageAcks.delete(messageId);
    
    tracking.callback({
      success: true,
      acknowledged: tracking.received,
      expected: tracking.expected
    });
  }
};

/**
 * Get users in a conversation room
 * @param {string} conversationId - Conversation ID
 */
export const getRoomUsers = (conversationId) => {
  const roomName = getRoomName(conversationId);
  const users = roomUsers.get(roomName);
  return users ? Array.from(users) : [];
};

/**
 * Get rooms for a user
 * @param {string} userId - User ID
 */
export const getUserRooms = (userId) => {
  const rooms = userRooms.get(userId);
  return rooms ? Array.from(rooms) : [];
};

/**
 * Get room statistics
 * @param {string} conversationId - Conversation ID
 */
export const getRoomStats = (conversationId) => {
  const roomName = getRoomName(conversationId);
  const io = getSocketIOInstance();
  
  if (!io) {
    return null;
  }
  
  const socketsInRoom = io.sockets.adapter.rooms.get(roomName);
  const users = roomUsers.get(roomName);
  
  return {
    roomName,
    socketCount: socketsInRoom?.size || 0,
    userCount: users?.size || 0,
    users: users ? Array.from(users) : []
  };
};

/**
 * Cleanup user from all rooms (on disconnect)
 * @param {string} userId - User ID
 * @param {Object} socket - Socket instance
 */
export const cleanupUserRooms = (userId, socket) => {
  const rooms = userRooms.get(userId);
  
  if (rooms) {
    rooms.forEach(roomName => {
      // Extract conversation ID from room name
      const conversationId = roomName.replace('conversation_', '');
      
      // Leave the room
      socket.leave(roomName);
      
      // Update room users
      if (roomUsers.has(roomName)) {
        roomUsers.get(roomName).delete(userId);
        
        if (roomUsers.get(roomName).size === 0) {
          roomUsers.delete(roomName);
        }
      }
      
      // Broadcast user left
      broadcastSystemEvent(conversationId, 'user_disconnected', {
        userId,
        userCount: roomUsers.get(roomName)?.size || 0
      });
    });
    
    // Clean up user's room list
    userRooms.delete(userId);
  }
  
  console.log(`Cleaned up rooms for user ${userId}`);
};

/**
 * Get broadcast system statistics
 */
export const getBroadcastStats = () => {
  const io = getSocketIOInstance();
  
  return {
    totalRooms: roomUsers.size,
    totalUsers: userRooms.size,
    activeRooms: Array.from(roomUsers.keys()).map(roomName => ({
      room: roomName,
      users: roomUsers.get(roomName).size
    })),
    pendingAcks: messageAcks.size,
    socketConnections: io ? io.sockets.sockets.size : 0
  };
};

export default {
  joinConversationRoom,
  leaveConversationRoom,
  broadcastMessage,
  broadcastSystemEvent,
  broadcastTyping,
  broadcastWithAck,
  getRoomUsers,
  getUserRooms,
  getRoomStats,
  cleanupUserRooms,
  getBroadcastStats
};