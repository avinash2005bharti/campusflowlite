import React, { useState } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { Bell, ShieldCheck, User, Menu, LogOut, ArrowRight, CheckCheck, RefreshCw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { notificationApi } from '../api';

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

  const isTeacherAndTG = Boolean(currentUser?.isTG || currentUser?.mentorGroupId);

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
                src="/oist.png"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-sm font-extrabold text-slate-900 leading-tight">
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full shadow-xs">
            <span className="text-sm shrink-0">{roleEmojiMap[currentRole] || '🎓'}</span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {roleTitleMap[currentRole] || 'Academic Portal'}
              </span>
              <span className="text-[10px] text-slate-500 leading-none">
                {currentUser?.name || 'Verified User'}
              </span>
            </div>
            <span className="badge badge-indigo text-[10px] ml-1 py-0.5 px-2">
              <ShieldCheck size={10} className="mr-0.5 inline" />
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

        {/* Right: Notification Bell & Profile */}
        <div className="flex items-center gap-2">
          {/* Notification Bell with Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              title="Notifications"
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
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-scale-up"
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
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <CheckCheck size={12} />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`p-3 text-xs transition-colors hover:bg-slate-50 ${
                          !n.isRead ? 'bg-blue-50/40 font-medium' : 'text-slate-600'
                        }`}
                      >
                        <div className="font-bold text-slate-900">{n.title}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{n.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Name & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {currentUser?.role || currentRole}
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
