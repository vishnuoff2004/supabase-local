import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketManager from '../services/socketService';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { session, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [namespace, setNamespace] = useState('/');
  const token = session?.access_token || localStorage.getItem('supabase_token');

  useEffect(() => {
    if (!token) {
      socketManager.disconnectAll();
      setIsConnected(false);
      return;
    }

    socketManager.setToken(token);
    const socket = socketManager.connect(namespace);

    const onConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };
    const onDisconnect = () => setIsConnected(false);
    const onError = (err) => setConnectionError(err.message || 'Connection error');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);

    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
    };
  }, [token, namespace]);

  const changeNamespace = useCallback((ns) => {
    setNamespace(ns);
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, connectionError, namespace, changeNamespace }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocketContext must be used within SocketProvider');
  return ctx;
}
