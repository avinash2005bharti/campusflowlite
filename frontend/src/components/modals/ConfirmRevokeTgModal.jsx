import React, { useState } from 'react';
import { AlertTriangle, X, Loader2, UserX } from 'lucide-react';
import { mentorshipApi, masterDataApi } from '../../api';
import { useERP } from '../../context/ERPContext.jsx';

export default function ConfirmRevokeTgModal({
  teacher,
  cohort,
  onClose,
  onSuccess,
}) {
  const { addToast } = useERP();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const facultyName = teacher?.user?.name || teacher?.name || teacher?.designation || 'Faculty Member';
  const cohortId = cohort?._id || teacher?.mentorGroupId || teacher?.activeGroup?._id;

  const handleConfirmRevoke = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (cohortId) {
        await mentorshipApi.deleteGroup(cohortId);
      }
      if (teacher?._id) {
        await masterDataApi.updateTeacher(teacher._id, { isTG: false });
      }

      addToast(
        'TG Appointment Revoked',
        `${facultyName} has been returned to standard faculty status.`,
        'success'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to revoke TG appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container max-w-md w-[95%] bg-white p-6 sm:p-7 rounded-3xl text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
              <UserX size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 m-0">
                Revoke TG Appointment
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Departmental Faculty Governance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body Confirmation */}
        <div className="my-4 space-y-3">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed m-0">
            Are you sure you want to revoke the Tutor Guardian appointment for{' '}
            <strong className="text-slate-900 font-black">{facultyName}</strong>?
          </p>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              This faculty member will return to standard faculty status. Their mentored cohort section allocation will be unlinked.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              backgroundColor: '#ffffff',
              color: '#334155',
              borderColor: '#CBD5E1',
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 border cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmRevoke}
            disabled={submitting}
            style={{
              backgroundColor: '#BE123C',
              color: '#ffffff',
              borderColor: '#9F1239',
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-60 border hover:bg-rose-800"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin text-white" />
                <span className="text-white">Revoking...</span>
              </>
            ) : (
              <>
                <UserX size={14} className="text-white" />
                <span className="text-white">Yes, Revoke Appointment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
