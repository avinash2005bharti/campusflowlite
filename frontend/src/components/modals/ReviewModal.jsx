import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext.jsx';
import { considerationApi, leaveApi } from '../../api';
import { X, CheckCircle2, AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button, FormField, Input, Textarea } from '../common';

export default function ReviewModal({
  type = 'CONSIDERATION', // 'CONSIDERATION' | 'LEAVE'
  role = 'TG',            // 'TG' | 'HOD' | 'ADMIN'
  item = {},
  onClose,
  onSuccess,
}) {
  const { addToast } = useERP();

  const [decision, setDecision] = useState(role === 'TG' ? 'RECOMMEND' : 'APPROVE');
  const [remarks, setRemarks] = useState('');
  const [approvedPeriods, setApprovedPeriods] = useState(item.requestedPeriods || 1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isReject = decision === 'REJECT';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isReject && (!remarks.trim() || remarks.trim().length < 5)) {
      setError('Please provide detailed rejection remarks (minimum 5 characters).');
      return;
    }

    setSubmitting(true);
    try {
      if (type === 'CONSIDERATION') {
        if (role === 'TG') {
          await considerationApi.tgReview(item._id, {
            decision,
            remarks: remarks.trim(),
          });
        } else {
          await considerationApi.hodReview(item._id, {
            decision,
            remarks: remarks.trim(),
            approvedPeriods: decision === 'APPROVE' ? Number(approvedPeriods) : undefined,
          });
        }
      } else {
        // LEAVE
        if (role === 'TG') {
          await leaveApi.tgReview(item._id, {
            decision,
            remarks: remarks.trim(),
          });
        } else {
          await leaveApi.finalReview(item._id, {
            decision,
            remarks: remarks.trim(),
          });
        }
      }

      addToast('Review Submitted', `Action ${decision.toLowerCase()} applied successfully.`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container max-w-md w-[95%]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              role === 'TG' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="modal-title">
                {role} {role === 'TG' ? 'Tier-1 Review' : 'Final Decision'}
              </h3>
              <p className="modal-subtitle">
                {item.eventTitle || `${item.leaveType} Leave (${item.totalDays} days)`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-2">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Decision Buttons */}
          <FormField label="Decision Action" required>
            <div className="grid grid-cols-2 gap-2.5">
              {role === 'TG' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setDecision('RECOMMEND')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      decision === 'RECOMMEND'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 size={15} />
                    <span>Approve and Forward to HOD</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REJECT')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      decision === 'REJECT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <AlertTriangle size={15} />
                    <span>Reject</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVE')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      decision === 'APPROVE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 size={15} />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REJECT')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      decision === 'REJECT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <AlertTriangle size={15} />
                    <span>Reject</span>
                  </button>
                </>
              )}
            </div>
          </FormField>

          {/* Approved Periods for HOD Consideration approval */}
          {type === 'CONSIDERATION' && role !== 'TG' && decision === 'APPROVE' && (
            <FormField label={`Periods to Credit (Requested: ${item.requestedPeriods})`} required>
              <Input
                type="number"
                min="1"
                max={item.requestedPeriods}
                value={approvedPeriods}
                onChange={(e) => setApprovedPeriods(e.target.value)}
                required
              />
            </FormField>
          )}

          <FormField label={isReject ? 'Rejection Remarks (Mandatory, min 5 chars)' : 'Review Remarks (Optional)'} required={isReject}>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={isReject ? 'State reason for rejection...' : 'Optional notes or guidance for student...'}
              rows={3}
              required={isReject}
            />
          </FormField>

          <div className="modal-footer mt-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isReject ? 'danger' : 'primary'}
              size="sm"
              loading={submitting}
            >
              Confirm {decision}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
