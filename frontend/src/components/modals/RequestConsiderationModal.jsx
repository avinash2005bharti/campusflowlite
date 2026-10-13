import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext.jsx';
import { considerationApi } from '../../api';
import { X, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DocumentUploader } from '../common';

export default function RequestConsiderationModal({ onClose, onSuccess }) {
  const { addToast } = useERP();

  const [category, setCategory] = useState('Academic On-Duty (OD) / Workshop');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Default selected periods: Period 2, 3, 4 as shown in screenshot
  const [selectedPeriods, setSelectedPeriods] = useState(['P2', 'P3', 'P4']);
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const periodsList = [
    { id: 'P1', number: 1, time: '10:00 AM – 10:50 AM', session: 'morning' },
    { id: 'P2', number: 2, time: '10:50 AM – 11:40 AM', session: 'morning' },
    { id: 'P3', number: 3, time: '11:40 AM – 12:30 PM', session: 'morning' },
    { id: 'P4', number: 4, time: '12:30 PM – 01:20 PM', session: 'morning' },
    { id: 'P5', number: 5, time: '02:00 PM – 02:50 PM', session: 'afternoon' },
    { id: 'P6', number: 6, time: '02:50 PM – 03:40 PM', session: 'afternoon' },
    { id: 'P7', number: 7, time: '03:40 PM – 04:30 PM', session: 'afternoon' },
  ];

  const togglePeriod = (pId) => {
    setSelectedPeriods((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId].sort()
    );
  };

  const selectFilter = (type) => {
    if (type === 'all') setSelectedPeriods(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']);
    else if (type === 'morning') setSelectedPeriods(['P1', 'P2', 'P3', 'P4']);
    else if (type === 'afternoon') setSelectedPeriods(['P5', 'P6', 'P7']);
    else if (type === 'clear') setSelectedPeriods([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (selectedPeriods.length === 0) {
      setFormError('Please select at least one period required for attendance consideration.');
      return;
    }

    if (!description.trim()) {
      setFormError('Please provide an activity description and justification.');
      return;
    }

    if (!attachment) {
      setFormError('Please attach an official supporting certificate, OD pass, or proof.');
      return;
    }

    // Map UI category to eventType enum
    let eventType = 'HACKATHON';
    if (category.includes('Work') || category.includes('Academic')) eventType = 'COLLEGE_DUTY';
    else if (category.includes('Sports')) eventType = 'SPORTS';
    else if (category.includes('Cultural')) eventType = 'CULTURAL';
    else if (category.includes('Duty')) eventType = 'COLLEGE_DUTY';

    const periodString = selectedPeriods.join(', ');
    const timesSummary = selectedPeriods
      .map((pId) => {
        const found = periodsList.find((p) => p.id === pId);
        return `${pId} (${found?.time || ''})`;
      })
      .join(', ');

    setSubmitting(true);
    try {
      await considerationApi.create({
        eventTitle: category,
        eventType,
        startDate,
        endDate,
        requestedPeriods: selectedPeriods.length,
        selectedPeriods,
        periodTiming: timesSummary,
        description: `[${category}] ${description.trim()}`,
        attachments: [attachment],
      });

      addToast(
        'Consideration Request Submitted',
        `Submitted for ${selectedPeriods.length} period(s). Awaiting Tutor Guardian recommendation.`,
        'success'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to submit consideration request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container max-w-xl w-[95%] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header pb-3 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 m-0">
                Request Attendance Consideration (OD)
              </h3>
              <p className="text-xs text-slate-500 m-0">
                Autonomous credit request for missed classes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-3">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Consideration Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Consideration Category / Nature of Absence
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="Academic On-Duty (OD) / Workshop">
                Academic On-Duty (OD) / Workshop
              </option>
              <option value="Hackathon / Technical Competition">
                Hackathon / Technical Competition
              </option>
              <option value="Sports / Cultural Event">Sports / Cultural Event</option>
              <option value="Official College Duty / Assignment">
                Official College Duty / Assignment
              </option>
            </select>
          </div>

          {/* Absence Start & End Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Absence Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Absence End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Periods & Lecture Times */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Periods & Lecture Times Required</span>
                <span className="text-purple-600 font-bold">({selectedPeriods.length} selected)</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => selectFilter('all')}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                >
                  All 7
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('morning')}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Morning (P1-P4)
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('afternoon')}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Afternoon (P5-P7)
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('clear')}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Periods Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {periodsList.map((p) => {
                const isSelected = selectedPeriods.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePeriod(p.id)}
                    className={`p-2 rounded-xl text-left border transition-all flex items-start gap-2 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/70 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'bg-purple-600 text-white' : 'border border-slate-300 bg-white text-slate-500'
                      }`}
                    >
                      {isSelected ? '✓' : p.number}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800">
                        Period {p.number}
                      </span>
                      <span className="block text-[10px] text-slate-500 leading-tight">
                        {p.time}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Notice Banner */}
            <div className="mt-2 text-[11px] font-medium text-purple-700 flex items-center gap-1.5 bg-purple-50/70 border border-purple-100 rounded-lg px-3 py-1.5">
              <CheckCircle2 size={13} className="shrink-0 text-purple-600" />
              <span>
                {selectedPeriods.length} Lecture Period{selectedPeriods.length !== 1 ? 's' : ''} will be logged for autonomous attendance credit.
              </span>
            </div>
          </div>

          {/* Activity Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Activity Description & Justification
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Participated as Lead Developer in Smart India Hackathon..."
              rows={3}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Supporting Document */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Supporting Certificate / Invitation / Medical Slip
            </label>
            <DocumentUploader
              value={attachment}
              onChange={setAttachment}
              placeholder="Attach official OD pass, hackathon letter, or certificate (PDF/PNG/DOCX)"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <span>Submit Consideration Request ({selectedPeriods.length} Periods)</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
