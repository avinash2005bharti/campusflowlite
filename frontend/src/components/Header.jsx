import React, { useState, useRef, useEffect } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { Bell, ShieldCheck, User, Menu, LogOut, ArrowRight, CheckCheck, RefreshCw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { notificationApi } from '../api';
import { formatDateTimeIST } from '../utils/constants.js';

const roleEmojiMap = {
  student: '🎓',
  teacher: '👨‍🏫',
  tg: '🛡️',
  hod: '🏛️',
  admin: '👑',
};

const roleTitleMap = {
  student: 'Student Portal',
  teacher: 'Faculty Portal',
  tg: 'Mentor / TG Desk',
  hod: 'HOD Administration',
  admin: 'System Administrator',
};

export default function Header({ isSidebarOpen, onToggleSidebar }) {
  const {
    currentRole,
    currentUser,
    notifications,
    unreadNotifCount,
    refreshNotifications,
    logout,
    switchRole,
  } = useERP();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedNotifId, setExpandedNotifId] = useState(null);
  const notifRef = useRef(null);

  const isTeacherAndTG = Boolean(currentUser?.isTG || currentUser?.mentorGroupId);

  // Close notifications on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications]);

  const handleNotificationClick = async (notif) => {
    setExpandedNotifId(expandedNotifId === notif._id ? null : notif._id);
    if (!notif.isRead) {
      try {
        await notificationApi.markAsRead(notif._id);
        refreshNotifications();
      } catch {
        // ignore
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      refreshNotifications();
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 h-16 w-full">
        {/* Left: Menu Trigger & Branding */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            title={isSidebarOpen ? 'Close Menu' : 'Open Menu'}
            aria-label="Toggle Navigation Menu"
          >
            <Menu size={18} />
          </button>

          <Link
            to={`/${currentRole}`}
            className="flex items-center gap-2.5 no-underline cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-white p-0.5 flex items-center justify-center border border-slate-200 shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
              <img
                src="/iit.png"
                alt="IIT Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-base font-extrabold text-slate-900 leading-tight">
                OIST CSE
              </span>
              <span className="text-xs text-blue-700 font-bold leading-none">
                CampusFlow ERP
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Role Badge */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-full shadow-xs">
            <span className="text-sm shrink-0">{roleEmojiMap[currentRole] || '🎓'}</span>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {roleTitleMap[currentRole] || 'Academic Portal'}
              </span>
              <span className="text-xs text-slate-600 leading-none mt-0.5">
                {currentUser?.name || 'Verified User'}
              </span>
            </div>
            <span className="badge badge-indigo text-xs ml-1 py-0.5 px-2 font-bold">
              <ShieldCheck size={11} className="mr-0.5 inline" />
              Verified
            </span>
          </div>

          {/* Role Switcher if user is both Teacher and appointed TG */}
          {isTeacherAndTG && (
            <button
              onClick={() => {
                const nextRole = currentRole === 'tg' ? 'teacher' : 'tg';
                switchRole(nextRole);
                navigate(`/${nextRole}`);
              }}
              className="btn btn-outline btn-xs font-semibold"
              title="Switch portal view"
            >
              <span>Switch to {currentRole === 'tg' ? 'Faculty' : 'TG'} Portal</span>
              <ArrowRight size={12} className="ml-1" />
            </button>
          )}
        </div>

        {/* Right: Actions, Notification Bell & Profile */}
        <div className="flex items-center gap-2">
          {/* Teacher Dashboard link for TG Portal matching tg dashboard.png */}
          {(currentRole === 'tg' || isTeacherAndTG) && (
            <Link
              to="/teacher"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/70 rounded-xl border border-blue-200/80 transition-colors no-underline cursor-pointer mr-1"
            >
              <span>Teacher Dashboard</span>
              <ArrowRight size={13} />
            </Link>
          )}

          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell size={18} />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-scale-up"
                style={{ transformOrigin: 'top right' }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    {unreadNotifCount > 0 && (
                      <span className="badge badge-rose text-[10px] py-0 px-1.5 font-bold">
                        {unreadNotifCount}
                      </span>
                    )}
                  </div>
                  {unreadNotifCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck size={12} />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isExpanded = expandedNotifId === n._id;
                      return (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                            !n.isRead ? 'bg-blue-50/50' : 'text-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {!n.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                              )}
                              <span>{n.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                              {formatDateTimeIST(n.createdAt)}
                            </span>
                          </div>
                          <div
                            className={`text-[11px] text-slate-600 mt-1 leading-relaxed ${
                              isExpanded ? '' : 'line-clamp-2'
                            }`}
                          >
                            {n.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Name & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden sm:flex flex-col text-right max-w-[160px]">
              <span
                className="text-sm font-bold text-slate-900 leading-tight truncate"
                title={currentUser?.name || currentUser?.designation || 'User'}
              >
                {currentUser?.name || currentUser?.designation || 'User'}
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider truncate mt-0.5">
                {currentUser?.designation || currentUser?.role || currentRole}
              </span>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
