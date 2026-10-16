import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  authApi,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  notificationApi,
  uploadApi,
} from '../api';

// Singleton Context instance preserved across Vite HMR reloads to prevent provider desync
const ERPContext =
  typeof window !== 'undefined'
    ? (window.__CAMPUSFLOW_ERP_CONTEXT__ ||= createContext(null))
    : createContext(null);

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
  const viewAttachment = useCallback(async (target, fallbackName = 'Document') => {
    let fileId = target;
    let fileName = fallbackName;
    let directUrl = null;

    if (target && typeof target === 'object') {
      fileId = target.fileId || target.url || target._id;
      fileName = target.name || target.fileName || target.documentName || fallbackName;
      if (target.url && typeof target.url === 'string' && (target.url.startsWith('http') || target.url.startsWith('data:'))) {
        directUrl = target.url;
      }
    }

    if (typeof fileId === 'string' && (fileId.startsWith('http://') || fileId.startsWith('https://') || fileId.startsWith('data:'))) {
      directUrl = fileId;
    }

    if (directUrl) {
      setPreviewFile({ name: fileName, url: directUrl, loading: false });
      return;
    }

    if (!fileId) {
      addToast('Cannot Open Attachment', 'No attachment reference found for preview', 'warning');
      return;
    }

    try {
      setPreviewFile({ name: fileName, url: '', loading: true });
      const res = await uploadApi.getSignedUrl(fileId);
      const signedUrl = res?.data?.url || res?.url;
      if (!signedUrl) throw new Error('No preview URL generated');
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
      const isFaculty = user.role === 'TEACHER' || user.role === 'HOD';
      const isTg = isFaculty && Boolean(user.isTG);
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

      // If app is in background, show system notification
      if (document.hidden && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: data.title,
          body: data.message,
          url: data.link,
        });
      }
    });

    socketInstance.on('attendance_reminder', (data) => {
      addToast(data.title, data.message, 'warning');
      refreshNotifications();

      // Show system notification via Service Worker
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: data.title,
          body: data.message,
          url: data.link || '/tg/attendance',
          tag: `attendance-${data.slot || 'reminder'}`,
        });
      }
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

  // Service Worker & PWA Web Push state
  const [pwaPushEnabled, setPwaPushEnabled] = useState(false);
  const [pwaPushSupported, setPwaPushSupported] = useState(() => {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  });

  // Register service worker on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(async (reg) => {
          if ('PushManager' in window) {
            const existingSub = await reg.pushManager.getSubscription();
            if (existingSub) {
              setPwaPushEnabled(true);
            }
          }
        })
        .catch((err) => {
          console.warn('Service worker registration failed:', err.message);
        });
    }
  }, []);

  // Helper to convert VAPID public key
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Enable PWA push reminders for faculty / TG / HOD
  const enablePWAReminders = useCallback(async () => {
    if (!pwaPushSupported) {
      addToast('Not Supported', 'Web Push notifications are not supported in this browser.', 'warning');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        addToast('Permission Denied', 'Please allow notifications in browser settings to receive PWA reminders.', 'warning');
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidRes = await notificationApi.getVapidPublicKey();
      const vapidKey = vapidRes?.data?.publicKey || vapidRes?.publicKey;

      if (!vapidKey) {
        throw new Error('VAPID public key unavailable from server.');
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      const rawJson = sub.toJSON();
      await notificationApi.subscribePush({
        endpoint: sub.endpoint,
        keys: {
          p256dh: rawJson.keys?.p256dh,
          auth: rawJson.keys?.auth,
        },
      });

      setPwaPushEnabled(true);
      addToast(
        'PWA Reminders Active',
        'You will now receive automatic notifications at 12:30-1:30 PM & 4:00-4:30 PM to review considerations & update attendance.',
        'success'
      );
      return true;
    } catch (err) {
      console.warn('PWA push reminder subscription unavailable:', err.message);
      return false;
    }
  }, [pwaPushSupported, addToast]);

  // Trigger immediate test reminder (for faculty / TG / HOD testing)
  const sendTestReminder = useCallback(async (slot = 'MIDDAY') => {
    try {
      const res = await notificationApi.sendReminderNow(slot);
      addToast('Test Reminder Dispatched', `Sent ${slot} reminder to all TGs and HODs.`, 'success');
      return res;
    } catch (err) {
      addToast('Failed to Send Reminder', err.message || 'Cannot trigger test reminder.', 'danger');
    }
  }, [addToast]);

  // Auto-subscribe if user is TG or HOD and notification permission was previously granted
  useEffect(() => {
    if (isAuthenticated && currentUser && ['TEACHER', 'HOD', 'ADMIN'].includes(currentUser.role)) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        enablePWAReminders().catch(() => {});
      }
    }
  }, [isAuthenticated, currentUser, enablePWAReminders]);


  // Auth Actions
  const login = async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    const user = data.user;
    const role = (user.role || '').toLowerCase();
    const isFaculty = user.role === 'TEACHER' || user.role === 'HOD';
    const effectiveRole = isFaculty && user.isTG ? 'tg' : role;

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
    if (currentUser?.role === 'STUDENT') {
      return; // Students are not permitted to switch roles
    }
    setCurrentRole(newRole);
    localStorage.setItem('campusflow_role', newRole);
  };

  const updateCurrentUser = useCallback((newUserData) => {
    setCurrentUser((prev) => {
      const merged = { ...prev, ...newUserData };
      try {
        localStorage.setItem('campusflow_user', JSON.stringify(merged));
      } catch (e) {
        console.warn('Failed to persist user to localStorage', e);
      }
      return merged;
    });
  }, []);

  return (
    <ERPContext.Provider
      value={{
        token,
        currentUser,
        updateCurrentUser,
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
        pwaPushEnabled,
        pwaPushSupported,
        enablePWAReminders,
        sendTestReminder,
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

export { ERPContext };
export default ERPProvider;
