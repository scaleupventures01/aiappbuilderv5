import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/stores/chatStore';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';
  error: string | null;
  lastConnected: number | null;
  reconnectAttempts: number;
  latency: number;
}

interface SocketOptions {
  autoConnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export const useEnhancedSocket = (options: SocketOptions = {}) => {
  const {
    autoConnect = true,
    reconnectDelay = 1000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000
  } = options;

  const [state, setState] = useState<SocketState>({
    socket: null,
    isConnected: false,
    connectionStatus: 'disconnected',
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
    latency: 0
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const latencyCheckRef = useRef<{ start: number; timeout: NodeJS.Timeout } | null>(null);
  const connectionAttemptsRef = useRef(0);

  const { setConnectionState, handleReconnection } = useChatStore();

  // Measure connection latency
  const measureLatency = useCallback((socket: Socket) => {
    if (latencyCheckRef.current) {
      clearTimeout(latencyCheckRef.current.timeout);
    }

    const start = Date.now();
    latencyCheckRef.current = {
      start,
      timeout: setTimeout(() => {
        // Timeout after 5 seconds
        setState(prev => ({ ...prev, latency: 5000 }));
      }, 5000)
    };

    socket.emit('ping', start, (timestamp: number) => {
      if (latencyCheckRef.current) {
        clearTimeout(latencyCheckRef.current.timeout);
        const latency = Date.now() - timestamp;
        setState(prev => ({ ...prev, latency }));
        latencyCheckRef.current = null;
      }
    });
  }, []);

  // Setup heartbeat to detect connection issues
  const setupHeartbeat = useCallback((socket: Socket) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (socket.connected) {
        measureLatency(socket);
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, measureLatency]);

  // Cleanup timers
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }

    if (latencyCheckRef.current) {
      clearTimeout(latencyCheckRef.current.timeout);
      latencyCheckRef.current = null;
    }
  }, []);

  // Attempt reconnection with exponential backoff
  const attemptReconnection = useCallback((socket: Socket) => {
    if (connectionAttemptsRef.current >= maxReconnectAttempts) {
      setState(prev => ({
        ...prev,
        connectionStatus: 'failed',
        error: 'Maximum reconnection attempts reached'
      }));
      setConnectionState({ status: 'disconnected' });
      return;
    }

    const delay = Math.min(reconnectDelay * Math.pow(2, connectionAttemptsRef.current), 30000);
    connectionAttemptsRef.current++;

    setState(prev => ({
      ...prev,
      connectionStatus: 'reconnecting',
      reconnectAttempts: connectionAttemptsRef.current
    }));

    setConnectionState({
      status: 'reconnecting',
      reconnectAttempts: connectionAttemptsRef.current
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnection attempt ${connectionAttemptsRef.current}/${maxReconnectAttempts}`);
      socket.connect();
    }, delay);
  }, [maxReconnectAttempts, reconnectDelay, setConnectionState]);

  // Manual reconnection
  const reconnect = useCallback(() => {
    if (state.socket && state.connectionStatus !== 'connecting') {
      connectionAttemptsRef.current = 0;
      setState(prev => ({
        ...prev,
        connectionStatus: 'connecting',
        error: null,
        reconnectAttempts: 0
      }));
      state.socket.connect();
    }
  }, [state.socket, state.connectionStatus]);

  // Manual disconnect
  const disconnect = useCallback(() => {
    if (state.socket) {
      cleanup();
      connectionAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect
      state.socket.disconnect();
    }
  }, [state.socket, cleanup, maxReconnectAttempts]);

  // Send message with acknowledgment
  const emit = useCallback(<T = any>(
    event: string,
    data?: any,
    timeout: number = 5000
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!state.socket || !state.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      state.socket.emit(event, data, (response: T) => {
        clearTimeout(timeoutId);
        resolve(response);
      });
    });
  }, [state.socket, state.isConnected]);

  useEffect(() => {
    if (!autoConnect) return;

    // Get socket URL from environment or default
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                     (import.meta.env.PROD ? 'wss://api.elitetradingcoach.ai' : 'ws://localhost:3001');

    console.log('Initializing enhanced socket connection to:', socketUrl);

    // Initialize socket connection with advanced options
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 10000,
      forceNew: true,
      autoConnect: true,
      retries: 3,
      auth: {
        // Add authentication token if available
        token: localStorage.getItem('auth-token')
      }
    });

    const handleConnect = () => {
      console.log('Enhanced socket connected successfully');
      const now = Date.now();
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        connectionStatus: 'connected',
        error: null,
        lastConnected: now,
        reconnectAttempts: 0
      }));

      setConnectionState({
        status: 'connected',
        lastConnected: now,
        reconnectAttempts: 0
      });

      connectionAttemptsRef.current = 0;
      setupHeartbeat(socket);
      measureLatency(socket);

      // Handle reconnection logic
      handleReconnection();
    };

    const handleDisconnect = (reason: string) => {
      console.log('Enhanced socket disconnected:', reason);
      cleanup();
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionStatus: 'disconnected',
        error: `Disconnected: ${reason}`
      }));

      setConnectionState({ status: 'disconnected' });

      // Only attempt reconnection for certain disconnect reasons
      const shouldReconnect = [
        'io server disconnect',
        'ping timeout',
        'transport close',
        'transport error'
      ].includes(reason);

      if (shouldReconnect && connectionAttemptsRef.current < maxReconnectAttempts) {
        attemptReconnection(socket);
      }
    };

    const handleConnectError = (error: Error) => {
      console.error('Enhanced socket connection error:', error);
      
      setState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        error: error.message
      }));

      if (connectionAttemptsRef.current < maxReconnectAttempts) {
        attemptReconnection(socket);
      }
    };

    const handleReconnectAttempt = (attempt: number) => {
      console.log(`Enhanced socket reconnection attempt ${attempt}`);
      setState(prev => ({
        ...prev,
        connectionStatus: 'reconnecting',
        reconnectAttempts: attempt
      }));
    };

    const handleReconnect = () => {
      console.log('Enhanced socket reconnected');
      connectionAttemptsRef.current = 0;
    };

    const handleReconnectError = (error: Error) => {
      console.error('Enhanced socket reconnection error:', error);
    };

    const handleReconnectFailed = () => {
      console.error('Enhanced socket reconnection failed');
      setState(prev => ({
        ...prev,
        connectionStatus: 'failed',
        error: 'Failed to reconnect after maximum attempts'
      }));
      setConnectionState({ status: 'disconnected' });
    };

    // Register event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_error', handleReconnectError);
    socket.on('reconnect_failed', handleReconnectFailed);

    // Handle online/offline events
    const handleOnline = () => {
      console.log('Browser came online, attempting to reconnect enhanced socket');
      if (!socket.connected) {
        connectionAttemptsRef.current = 0;
        socket.connect();
      }
    };

    const handleOffline = () => {
      console.log('Browser went offline, enhanced socket disconnected');
      setState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        error: 'Browser offline'
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setState(prev => ({
      ...prev,
      socket,
      connectionStatus: 'connecting'
    }));

    // Cleanup function
    return () => {
      cleanup();
      
      // Remove event listeners
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_error', handleReconnectError);
      socket.off('reconnect_failed', handleReconnectFailed);

      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      socket.disconnect();
    };
  }, [
    autoConnect,
    maxReconnectAttempts,
    setupHeartbeat,
    measureLatency,
    cleanup,
    attemptReconnection,
    setConnectionState,
    handleReconnection
  ]);

  return {
    ...state,
    reconnect,
    disconnect,
    emit
  };
};