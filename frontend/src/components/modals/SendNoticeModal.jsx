import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Megaphone,
  AlertCircle,
  FileText,
  Users,
  Paperclip,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { noticeApi, masterDataApi } from '../../api';
import { useERP } from '../../context/ERPContext.jsx';

export default function SendNoticeModal({ onClose, onSuccess }) {
  const { addToast } = useERP();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('CIRCULAR');
  const [priority, setPriority] = useState('NORMAL');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [targetSemester, setTargetSemester] = useState(5);
  const [targetSection, setTargetSection] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [sections, setSections] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await masterDataApi.getSections();
        const data = res?.data || [];
        setSections(data);
        if (data.length > 0) {
          setTargetSection(data[0]._id);
        }
      } catch (err) {
        console.warn('Could not fetch sections for notice modal:', err.message);
      }
    };
    fetchSections();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a notice title.');
      return;
    }
    if (!content.trim()) {
      setError('Please provide notice content/message.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        targetAudience,
        targetSemester: targetAudience === 'SEMESTER' ? Number(targetSemester) : null,
        targetSection: targetAudience === 'SECTION' ? targetSection : null,
        attachmentUrl: attachmentUrl.trim() || '',
      };

      const res = await noticeApi.createNotice(payload);
      addToast(
        'Notice Dispatched',
        `"${title.trim()}" published and notifications broadcasted.`,
        'success'
      );
      if (onSuccess) onSuccess(res?.data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to publish notice. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getRecipientSummary = () => {
    switch (targetAudience) {
      case 'ALL':
        return 'Broadcasts to All Students, Faculty & Staff in CSE';
      case 'STUDENTS':
        return 'Broadcasts to All Enrolled Students across all semesters';
      case 'FACULTY':
        return 'Broadcasts to All Department Faculty Members & TGs';
      case 'SEMESTER':
        return `Targeted exclusively to Semester ${targetSemester} Students`;
      case 'SECTION': {
        const matchedSec = sections.find((s) => s._id === targetSection);
        const secLabel = matchedSec ? matchedSec.name || matchedSec.code : 'Selected Section';
        return `Targeted exclusively to Students of ${secLabel}`;
      }
      default:
        return 'Department Circular';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container max-w-xl w-[95%] bg-white p-6 rounded-3xl text-slate-900 shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
              <Megaphone size={20} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-700 text-[10px] font-extrabold uppercase tracking-wide">
                <span>HOD Office</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 m-0 leading-snug">
                Send Department Notice
              </h3>
              <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
                Broadcast official circulars and push notifications to students and faculty
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
          {/* Notice Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notice Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Minor Exam-II Schedule & Attendance Cutoff"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
            />
          </div>

          {/* Row: Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
              >
                <option value="CIRCULAR">Official Circular</option>
                <option value="ACADEMIC">Academic / Syllabus</option>
                <option value="EXAM">Examination Notice</option>
                <option value="EVENT">Event / Hackathon</option>
                <option value="URGENT">Urgent Advisory</option>
                <option value="GENERAL">General Notice</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'NORMAL', label: 'Normal', color: 'text-slate-700 bg-slate-100 border-slate-200' },
                  { id: 'HIGH', label: 'High', color: 'text-amber-800 bg-amber-50 border-amber-200' },
                  { id: 'URGENT', label: 'Urgent', color: 'text-rose-800 bg-rose-50 border-rose-200' },
                ].map((p) => {
                  const isSelected = priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`px-2 py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        isSelected
                          ? `${p.color} ring-2 ring-blue-500 font-extrabold shadow-2xs`
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Target Audience
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'ALL', label: 'All CSE' },
                { id: 'STUDENTS', label: 'Students' },
                { id: 'FACULTY', label: 'Faculty' },
                { id: 'SEMESTER', label: 'Semester' },
                { id: 'SECTION', label: 'Section' },
              ].map((aud) => {
                const active = targetAudience === aud.id;
                return (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setTargetAudience(aud.id)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      active
                        ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {aud.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Target Controls: Semester or Section */}
          {targetAudience === 'SEMESTER' && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" />
                Select Target Semester:
              </span>
              <select
                value={targetSemester}
                onChange={(e) => setTargetSemester(Number(e.target.value))}
                className="px-3 py-1.5 bg-white border border-blue-300 rounded-xl text-xs font-bold text-blue-900 focus:outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetAudience === 'SECTION' && (
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Users size={14} className="text-purple-600" />
                Select Target Section:
              </span>
              <select
                value={targetSection}
                onChange={(e) => setTargetSection(e.target.value)}
                className="px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-900 focus:outline-none cursor-pointer"
              >
                {sections.length > 0 ? (
                  sections.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      {sec.name} ({sec.code}) - Sem {sec.semester}
                    </option>
                  ))
                ) : (
                  <option value="">No sections found</option>
                )}
              </select>
            </div>
          )}

          {/* Message / Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Notice Message / Content <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                {content.length} characters
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the detailed circular text, instructions, deadlines, or guidance for students and faculty..."
              rows={4}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-normal text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-y"
            />
          </div>

          {/* Attachment Link (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Paperclip size={13} className="text-slate-500" />
              <span>Reference Link / Document URL (Optional)</span>
            </label>
            <input
              type="url"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://drive.google.com/... or circular PDF link"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
            />
          </div>

          {/* Recipient summary helper */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-100/80 border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-700">{getRecipientSummary()}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send Notice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
