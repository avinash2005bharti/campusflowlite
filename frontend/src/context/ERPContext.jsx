import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  authApi,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  notificationApi,
  uploadApi,
} from '../api';

const ERPContext = createContext(null);

export function ERPProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken());
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('campusflow_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('campusflow_role') || 'student';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAuthToken()));
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Notifications & Realtime state
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [socket, setSocket] = useState(null);

  // Global Modal & File Preview state
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState({});
  const [previewFile, setPreviewFile] = useState(null); // { url, name, loading }

  // Toast System
  const addToast = useCallback((title, message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast = { id, title, message, type, time: 'Just now' };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Modal Handlers
  const openModal = useCallback((name, data = {}) => {
    setActiveModal(name);
    setModalData(data);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData({});
  }, []);

  // File Preview Handler with signed URLs
  const viewAttachment = useCallback(async (fileId, fileName = 'Document') => {
    try {
      setPreviewFile({ name: fileName, url: '', loading: true });
      const res = await uploadApi.getSignedUrl(fileId);
      const signedUrl = res?.data?.url || res?.url;
      setPreviewFile({ name: fileName, url: signedUrl, loading: false });
    } catch (err) {
      addToast('Cannot Open Attachment', err.message || 'Permission denied or file unavailable', 'danger');
      setPreviewFile(null);
    }
  }, [addToast]);

  const closeFilePreview = useCallback(() => {
    setPreviewFile(null);
  }, []);

  // Sync / Verify current user session on mount
  const checkSession = useCallback(async () => {
    const storedToken = getAuthToken();
    if (!storedToken) {
      setLoadingAuth(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      const user = res?.data || res;
      setCurrentUser(user);
      setIsAuthenticated(true);

      const roleStr = user.role?.toLowerCase() || 'student';
      // If user is a teacher who is also TG, role can be tg or teacher
      const isTg = Boolean(user.isTG || user.mentorGroupId);
      const effectiveRole = isTg && localStorage.getItem('campusflow_role') === 'tg' ? 'tg' : roleStr;

      setCurrentRole(effectiveRole);
      localStorage.setItem('campusflow_user', JSON.stringify(user));
      localStorage.setItem('campusflow_role', effectiveRole);
    } catch (err) {
      console.warn('Session verification failed, logging out');
      clearAuthToken();
      setIsAuthenticated(false);
      setCurrentUser(null);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Fetch initial notifications
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationApi.getNotifications({ limit: 15 });
      const list = res?.data || [];
      setNotifications(list);
      setUnreadNotifCount(res?.meta?.unreadCount || list.filter((n) => !n.isRead).length);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
    }
  }, [isAuthenticated, refreshNotifications]);

  // Real-Time Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketInstance = io(window.location.origin, {
      auth: { token: getAuthToken() },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      // Live connected
    });

    socketInstance.on('new_notification', (data) => {
      addToast(data.title, data.message, data.type === 'ESCALATION' ? 'warning' : 'info');
      refreshNotifications();
    });

    socketInstance.on('request_updated', (data) => {
      addToast('Status Updated', `${data.kind} status changed to ${data.status.replace(/_/g, ' ')}`, 'info');
    });

    socketInstance.on('queue_changed', () => {
      window.dispatchEvent(new CustomEvent('campusflow_queue_changed'));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, addToast, refreshNotifications]);

  // Auth Actions
  const login = async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    const user = data.user;
    const role = (user.role || '').toLowerCase();
    const effectiveRole = user.isTG ? 'tg' : role;

    setToken(data.accessToken);
    setCurrentUser(user);
    setCurrentRole(effectiveRole);
    setIsAuthenticated(true);

    localStorage.setItem('campusflow_user', JSON.stringify(user));
    localStorage.setItem('campusflow_role', effectiveRole);

    addToast('Welcome Back', `Logged in as ${user.name}`, 'success');
    return user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearAuthToken();
      setToken(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
      setCurrentRole('student');
      if (socket) socket.disconnect();
      addToast('Logged Out', 'You have been safely signed out.', 'info');
    }
  };

  const switchRole = (newRole) => {
    setCurrentRole(newRole);
    localStorage.setItem('campusflow_role', newRole);
  };

  return (
    <ERPContext.Provider
      value={{
        token,
        currentUser,
        currentRole,
        isAuthenticated,
        loadingAuth,
        notifications,
        unreadNotifCount,
        refreshNotifications,
        toasts,
        addToast,
        removeToast,
        activeModal,
        modalData,
        openModal,
        closeModal,
        previewFile,
        viewAttachment,
        closeFilePreview,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
}

export default ERPContext;
