import React from 'react';

/**
 * Standard Design System Badge / Tag Primitive
 * Supports variants: primary | success | warning | danger | neutral | purple | cyan
 * Supports sizes: xs | sm | md
 */
export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  icon = null,
  className = '',
  ...props
}) {
  const variantClass = {
    primary: 'badge-indigo',
    success: 'badge-emerald',
    warning: 'badge-amber',
    danger: 'badge-rose',
    neutral: 'badge-slate',
    purple: 'badge-purple',
    cyan: 'badge-cyan',
  }[variant] || 'badge-slate';

  const sizeStyle =
    size === 'xs'
      ? { fontSize: '12px', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontWeight: 700 }
      : size === 'sm'
      ? { fontSize: '13px', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontWeight: 600 }
      : { fontSize: '13px', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 600 };

  const formatChildren = (content) => {
    if (typeof content !== 'string') return content;
    switch (content) {
      case 'APPROVED_BY_HOD':
        return 'Approved by HOD';
      case 'RECOMMENDED_BY_TG':
        return 'Recommended by TG';
      case 'PENDING':
        return 'Pending Review';
      case 'CANCELLED':
        return 'Cancelled';
      case 'REJECTED':
        return 'Rejected';
      case 'APPROVED':
        return 'Approved';
      default:
        if (content.includes('_')) {
          return content
            .toLowerCase()
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        }
        return content;
    }
  };

  return (
    <span
      className={`badge ${variantClass} ${className}`.trim()}
      style={sizeStyle}
      {...props}
    >
      {dot && (
        <span
          className={`badge-dot ${pulse ? 'agent-pulse' : ''}`}
          style={{
            width: size === 'sm' ? '5px' : '6px',
            height: size === 'sm' ? '5px' : '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {formatChildren(children)}
    </span>
  );
}
