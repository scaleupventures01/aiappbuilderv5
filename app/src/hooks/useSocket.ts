import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      const newSocket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 5000,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        // Auto-reconnect on unexpected disconnection
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't auto-reconnect
          setError('Server disconnected');
        } else {
          // Client or network disconnect, attempt to reconnect
          attemptReconnect();
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError('Connection failed');
        setIsConnected(false);
        attemptReconnect();
      });

      newSocket.on('error', (err) => {
        console.error('Socket error:', err);
        setError('Socket error occurred');
      });

      setSocket(newSocket);
    } catch (err) {
      console.error('Failed to create socket:', err);
      setError('Failed to initialize connection');
    }
  };

  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setError('Max reconnection attempts reached');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      console.log(`Attempting reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
      
      if (socket) {
        socket.connect();
      } else {
        connect();
      }
    }, 1000 * Math.pow(2, reconnectAttemptsRef.current)); // Exponential backoff
  };

  const reconnect = () => {
    setError(null);
    reconnectAttemptsRef.current = 0;
    
    if (socket) {
      socket.disconnect();
      socket.connect();
    } else {
      connect();
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    error,
    reconnect,
  };
};