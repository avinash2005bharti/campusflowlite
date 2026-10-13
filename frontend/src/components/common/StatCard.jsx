import React from 'react';
import { Card } from './Card.jsx';

/**
 * Standard Design System KPI Stat Card
 * Supports both JSX element icons (<FileText size={20} />) and icon components (FileText)
 * Supports subtext, trend, and trendDirection
 */
export default function StatCard({
  title,
  value,
  subtext = null,
  trend = null,
  trendDirection = null, // 'up' | 'down' | 'neutral'
  icon = null,
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'slate' | 'default'
  badge = null,
  onClick = null,
  className = '',
}) {
  const iconBgMap = {
    primary: 'bg-blue-50 text-blue-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
    default: 'bg-slate-100 text-slate-600',
  };

  const iconStyle = iconBgMap[variant] || iconBgMap.primary;
  const displaySubtext = subtext || trend;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || typeof icon === 'object') {
      const IconComponent = icon;
      return <IconComponent size={20} />;
    }
    return null;
  };

  return (
    <Card
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={`relative overflow-hidden ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">
            {title}
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5 tabular-nums">
            {value}
          </div>
          {displaySubtext && (
            <div
              className={`text-xs mt-1 flex items-center gap-1.5 truncate font-medium ${
                trendDirection === 'down'
                  ? 'text-amber-600'
                  : trendDirection === 'up'
                  ? 'text-emerald-600'
                  : 'text-slate-500'
              }`}
            >
              {displaySubtext}
            </div>
          )}
        </div>

        {icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconStyle}`}
          >
            {renderIcon()}
          </div>
        )}
      </div>

      {badge && <div className="mt-3 pt-2.5 border-t border-slate-100">{badge}</div>}
    </Card>
  );
}
