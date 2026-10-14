import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { mentorshipApi } from '../../api';
import { useERP } from '../../context/ERPContext.jsx';
import { DEFAULT_ACADEMIC_SESSION } from '../../utils/constants.js';

export default function AppointTgModal({
  teachers = [],
  preselectedTeacher = null,
  onClose,
  onSuccess,
}) {
  const { addToast } = useERP();

  const [selectedTeacherId, setSelectedTeacherId] = useState(
    preselectedTeacher?._id || teachers[0]?._id || ''
  );
  const [semester, setSemester] = useState('Semester 5');
  const [section, setSection] = useState('Section B');
  const [session, setSession] = useState(DEFAULT_ACADEMIC_SESSION);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const selectedTeacher =
    teachers.find((t) => t._id === selectedTeacherId) || preselectedTeacher || teachers[0];

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedTeacherId) {
      setError('Please select a faculty member.');
      return;
    }

    if (!session || !session.trim()) {
      setError('Please provide a valid academic session (e.g. 2025-26).');
      return;
    }

    const semNum = parseInt(semester.replace(/\D/g, ''), 10) || 5;
    const secLetter = section.replace('Section ', '').trim() || 'A';

    setSubmitting(true);
    try {
      await mentorshipApi.createGroup({
        department: selectedTeacher?.department?._id || selectedTeacher?.department,
        tgId: selectedTeacherId,
        academicYear: session.trim(),
        semester: semNum,
        sectionCode: secLetter,
        name: `TG Cohort - Sem ${semNum} CSE-${secLetter}`,
      });

      const facultyName =
        selectedTeacher?.user?.name || selectedTeacher?.designation || 'Faculty Member';

      addToast(
        'TG Appointed',
        `${facultyName} is now appointed as Tutor Guardian for ${semester}, ${section} (${session}).`,
        'success'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to appoint TG.');
    } finally {
      setSubmitting(false);
    }
  };

  const facultyDisplayName =
    selectedTeacher?.user?.name || selectedTeacher?.designation || 'Faculty Member';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container max-w-lg w-[95%] bg-white p-6 sm:p-7 rounded-3xl text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 m-0">
                Appoint Tutor Guardian (TG)
              </h3>
              <p className="text-xs text-slate-500 m-0">
                Departmental Mentorship & Academic Cohort Assignment
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
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-3.5 mt-3">
          {/* Selected Faculty Member Box */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <span className="block text-[10px] font-extrabold text-blue-800 uppercase tracking-wider">
              SELECTED FACULTY MEMBER
            </span>
            <span className="block text-sm font-black text-slate-900 mt-0.5">
              {facultyDisplayName}
            </span>
            <span className="block text-xs text-slate-600 mt-0.5">
              {selectedTeacher?.designation || 'Faculty'} • {selectedTeacher?.user?.email || 'authenticated'}
            </span>
          </div>

          {/* Faculty Member dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Faculty Member <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
            >
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.user?.name || t.designation || 'Faculty'} ({t.designation || 'Faculty'})
                </option>
              ))}
            </select>
          </div>

          {/* Semester & Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Semester <span className="text-rose-500">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={`Semester ${s}`}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Section <span className="text-rose-500">*</span>
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="Section A">Section A</option>
                <option value="Section B">Section B</option>
                <option value="Section C">Section C</option>
                <option value="Section D">Section D</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic m-0">
            All students in {semester}, {section} will report directly to this Tutor Guardian.
          </p>

          {/* Academic Session */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Academic Session <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              placeholder="e.g. 2025-26"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
            />
          </div>

          {/* TG Powers & Mentorship Scope Box */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <span className="block font-black text-emerald-800 text-[11px] uppercase tracking-wider mb-1">
              TG Powers & Mentorship Scope:
            </span>
            <div className="flex items-start gap-1.5 text-[11px] text-emerald-800">
              <span>•</span>
              <span>First-tier review & recommendation for student leave applications</span>
            </div>
            <div className="flex items-start gap-1.5 text-[11px] text-emerald-800">
              <span>•</span>
              <span>Verification of On-Duty (OD) and attendance consideration requests</span>
            </div>
            <div className="flex items-start gap-1.5 text-[11px] text-emerald-800">
              <span>•</span>
              <span>Monitoring mentee attendance and issuing 75% shortage advisories</span>
            </div>
          </div>

          {/* Footer buttons with Appoint TG clearly visible */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Appointing TG...</span>
                </>
              ) : (
                <>
                  <UserCheck size={14} />
                  <span>Appoint TG</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
