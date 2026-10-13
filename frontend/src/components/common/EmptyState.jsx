import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button.jsx';

export default function EmptyState({
  icon = <Inbox size={36} className="text-slate-400" />,
  title = 'No items found',
  description = 'There are no records matching your request at this moment.',
  actionLabel = null,
  onAction = null,
  action = null,
  className = '',
}) {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || typeof icon === 'object') {
      const IconComp = icon;
      return <IconComp size={32} className="text-slate-400" />;
    }
    return null;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 my-4 ${className}`.trim()}
    >
      <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mb-3 text-slate-400">
        {renderIcon()}
      </div>
      <h4 className="text-sm font-bold text-slate-800 m-0">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-normal">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {action && !actionLabel && action}
    </div>
  );
}
