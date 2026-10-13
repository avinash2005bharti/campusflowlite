import React from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function NotificationToast() {
  const { toasts, removeToast } = useERP();

  if (!toasts || toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
    danger: <AlertCircle size={18} className="text-rose-500 shrink-0" />,
    warning: <AlertTriangle size={18} className="text-amber-500 shrink-0" />,
    info: <Info size={18} className="text-blue-500 shrink-0" />,
  };

  const borderMap = {
    success: 'border-emerald-200 bg-emerald-50/95',
    danger: 'border-rose-200 bg-rose-50/95',
    warning: 'border-amber-200 bg-amber-50/95',
    info: 'border-blue-200 bg-blue-50/95',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '360px',
        width: 'calc(100% - 2.5rem)',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 animate-slide-in ${
            borderMap[toast.type] || borderMap.info
          }`}
          role="alert"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            {iconMap[toast.type] || iconMap.info}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {toast.title}
              </div>
              <div className="text-xs text-slate-600 mt-0.5 leading-normal">
                {toast.message}
              </div>
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md shrink-0"
            aria-label="Close notification"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
