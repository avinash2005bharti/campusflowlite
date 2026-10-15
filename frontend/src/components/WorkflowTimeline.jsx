import React from 'react';
import { Check, Clock, AlertTriangle, X, ShieldAlert } from 'lucide-react';

export default function WorkflowTimeline({ history = [], currentStatus = 'PENDING' }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-xs text-slate-400 p-2 italic">
        No workflow steps recorded yet.
      </div>
    );
  }

  const formatActorRole = (role) => {
    if (!role) return 'System';
    const map = {
      STUDENT: 'Student',
      TG: 'Tutor Guardian (TG)',
      HOD: 'Head of Department (HOD)',
      ADMIN: 'Administrator',
      SYSTEM: 'System',
    };
    return map[role.toUpperCase()] || role.replace(/_/g, ' ');
  };

  const formatStatus = (st) => {
    if (!st) return 'Pending Review';
    const map = {
      PENDING: 'Pending Review',
      RECOMMENDED_BY_TG: 'Recommended by TG',
      APPROVED_BY_HOD: 'Approved by HOD',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      REJECTED_BY_TG: 'Rejected by TG',
      REJECTED_BY_HOD: 'Rejected by HOD',
      CANCELLED: 'Cancelled',
    };
    return map[st.toUpperCase()] || st.replace(/_/g, ' ');
  };

  return (
    <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col gap-2">
      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
          Approval Timeline
        </span>
        <span className="text-[11px] text-slate-400 font-medium">
          Status History
        </span>
      </div>

      <div className="flex flex-col gap-2.5 mt-1">
        {history.map((item, index) => {
          const isApproved = item.status?.includes('APPROVED') || item.status === 'RECOMMENDED_BY_TG';
          const isRejected = item.status?.includes('REJECT');
          const isCancelled = item.status === 'CANCELLED';
          const isEscalation = item.via === 'ESCALATION';

          const icon = isApproved ? (
            <Check size={12} strokeWidth={3} />
          ) : isRejected || isCancelled ? (
            <X size={12} strokeWidth={3} />
          ) : isEscalation ? (
            <ShieldAlert size={12} />
          ) : (
            <Clock size={12} />
          );

          const bgColor = isApproved
            ? 'bg-emerald-600 text-white'
            : isRejected || isCancelled
            ? 'bg-rose-600 text-white'
            : isEscalation
            ? 'bg-amber-500 text-white'
            : 'bg-blue-600 text-white';

          const formattedDate = item.at
            ? new Date(item.at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <div key={index} className="flex items-start gap-2.5 text-xs">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${bgColor}`}
              >
                {icon}
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-800">
                    {formatStatus(item.status)}
                  </span>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {formattedDate}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500">
                  By {formatActorRole(item.actorRole)} {item.actor?.name ? `(${item.actor.name})` : ''}
                  {isEscalation && ' • 48-Hour Auto-Escalation'}
                </div>

                {item.remarks && (
                  <div className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-1 italic">
                    "{item.remarks}"
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
