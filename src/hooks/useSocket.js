'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket(options = {}) {
  const {
    userId,
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io({
      path: '/socket.io',
      auth: { userId },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      onConnect?.();
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      onDisconnect?.();
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      onError?.(error);
      console.error('Socket connection error:', error);
    });

    socket.onAny((event, data) => {
      setLastMessage({ event, data });
    });

    socketRef.current = socket;
  }, [userId, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }
    return () => disconnect();
  }, [autoConnect, userId, connect, disconnect]);

  useEffect(() => {
    if (socketRef.current && userId) {
      socketRef.current.emit('authenticate', userId);
    }
  }, [userId]);

  return {
    get socket() { return socketRef.current; },
    isConnected,
    lastMessage,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}

export function useApplicationSocket(userId) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const { isConnected, on, emit } = useSocket({ userId, autoConnect: true });

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeCreated = on('application:created', (app) => {
      setApplications((prev) => [app, ...prev]);
    });

    const unsubscribeUpdated = on('application:updated', (app) => {
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? app : a))
      );
    });

    const unsubscribeDeleted = on('application:deleted', (appId) => {
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    });

    emit('subscribe:applications', userId);

    fetch('/api/db/applications')
      .then((res) => res.json())
      .then((data) => {
        setApplications(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [isConnected, userId, on, emit]);

  return { applications, loading, isConnected, emit };
}

export function useNotificationSocket(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { isConnected, on } = useSocket({ userId, autoConnect: true });

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => unsubscribe();
  }, [isConnected, on]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, markAsRead, markAllAsRead, isConnected };
}