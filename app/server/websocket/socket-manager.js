/**
 * Socket.IO Manager - Elite Trading Coach AI
 * Singleton pattern for managing Socket.IO instance across the application
 * Created: 2025-08-14
 */

let ioInstance = null;

/**
 * Set the Socket.IO instance
 * @param {Object} io - Socket.IO server instance
 */
export const setSocketIOInstance = (io) => {
  if (!ioInstance) {
    ioInstance = io;
    console.log('Socket.IO instance registered with manager');
  }
};

/**
 * Get the Socket.IO instance
 * @returns {Object|null} Socket.IO server instance or null
 */
export const getSocketIOInstance = () => {
  if (!ioInstance) {
    console.warn('Socket.IO instance not yet initialized');
  }
  return ioInstance;
};

/**
 * Emit an event to a specific room
 * @param {string} room - Room name
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const emitToRoom = (room, event, data) => {
  if (!ioInstance) {
    console.error('Cannot emit: Socket.IO instance not initialized');
    return false;
  }
  
  ioInstance.to(room).emit(event, data);
  return true;
};

/**
 * Emit an event to a specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const emitToUser = (userId, event, data) => {
  const userRoom = `user_${userId}`;
  return emitToRoom(userRoom, event, data);
};

/**
 * Emit a broadcast event to all connected clients
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const broadcast = (event, data) => {
  if (!ioInstance) {
    console.error('Cannot broadcast: Socket.IO instance not initialized');
    return false;
  }
  
  ioInstance.emit(event, data);
  return true;
};

/**
 * Get connected clients count
 * @returns {number} Number of connected clients
 */
export const getConnectedClientsCount = () => {
  if (!ioInstance) {
    return 0;
  }
  return ioInstance.sockets.sockets.size;
};

export default {
  setSocketIOInstance,
  getSocketIOInstance,
  emitToRoom,
  emitToUser,
  broadcast,
  getConnectedClientsCount
};