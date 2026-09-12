import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { ActivityLog, Task } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeOnlineCount: number;
  onlineUserIds: string[];
  latestActivity: ActivityLog | null;
  updatedTask: Task | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeOnlineCount, setActiveOnlineCount] = useState<number>(0);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [latestActivity, setLatestActivity] = useState<ActivityLog | null>(null);
  const [updatedTask, setUpdatedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!user || !accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to Socket.io backend with auth token
    const newSocket = io('http://localhost:5000', {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('presence:update', (data: { activeCount: number; onlineUserIds: string[] }) => {
      setActiveOnlineCount(data.activeCount);
      setOnlineUserIds(data.onlineUserIds);
    });

    newSocket.on('activity:new', (activity: ActivityLog) => {
      setLatestActivity(activity);
    });

    newSocket.on('task:updated', (task: Task) => {
      setUpdatedTask(task);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, accessToken]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeOnlineCount,
        onlineUserIds,
        latestActivity,
        updatedTask,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
