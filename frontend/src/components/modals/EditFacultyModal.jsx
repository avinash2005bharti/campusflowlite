import React, { useState } from 'react';
import { X, Edit3, AlertCircle, Loader2 } from 'lucide-react';
import { masterDataApi } from '../../api';
import { useERP } from '../../context/ERPContext.jsx';

export default function EditFacultyModal({ teacher, onClose, onSuccess }) {
  const { addToast } = useERP();

  const [name, setName] = useState(teacher?.user?.name || '');
  const [employeeId, setEmployeeId] = useState(teacher?.employeeId || '');
  const [status, setStatus] = useState(teacher?.user?.isActive === false ? 'INACTIVE' : 'ACTIVE');
  const [email, setEmail] = useState(teacher?.user?.email || '');
  const [phone, setPhone] = useState(teacher?.user?.phone || '');
  const [designation, setDesignation] = useState(teacher?.designation || 'Assistant Professor');
  const [specialization, setSpecialization] = useState(
    teacher?.specialization || 'Computer Science & Engineering'
  );
  const [isTG, setIsTG] = useState(Boolean(teacher?.isTG));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Official Email is required.');
      return;
    }

    setSubmitting(true);
    try {
      await masterDataApi.updateTeacher(teacher._id, {
        name: name.trim(),
        employeeId: employeeId.trim(),
        status,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        designation: designation.trim(),
        specialization: specialization.trim(),
        isTG,
      });

      addToast('Profile Updated', `Faculty record for ${name} updated successfully.`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to update faculty profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container max-w-lg w-[95%] bg-white p-6 sm:p-7 rounded-3xl text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching Image 4 */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
              <Edit3 size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 m-0">
                Edit Faculty Profile
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Department Record Update for {employeeId || 'EMP-HOD-01'}
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

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. HOD CSE"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
            />
          </div>

          {/* Employee ID & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP-HOD-01"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          {/* Official Email & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g. test_hod@mail.in"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Designation & Specialization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Professor & Head (HOD)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Specialization
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Computer Science & Engineer"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Designated Tutor Guardian Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isTG}
                onChange={(e) => setIsTG(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Designated Tutor Guardian (TG) for Department
              </span>
            </label>
            <p className="text-[11px] text-slate-400 ml-6.5 mt-0.5">
              Enables student section allocation and first-tier approval governance.
            </p>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                backgroundColor: '#ffffff',
                color: '#334155',
                borderColor: '#CBD5E1',
              }}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 border cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                backgroundColor: '#1D4ED8',
                color: '#ffffff',
                borderColor: '#1D4ED8',
              }}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60 border hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin text-white" />
                  <span className="text-white">Saving...</span>
                </>
              ) : (
                <span className="text-white">Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
