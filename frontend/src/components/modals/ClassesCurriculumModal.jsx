import React, { useState } from 'react';
import { X, Plus, Trash2, Building2, Layers, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../context/ERPContext.jsx';

export default function ClassesCurriculumModal({ onClose }) {
  const { addToast } = useERP();

  const [activeYear, setActiveYear] = useState('3rd Year');
  const [activeSemester, setActiveSemester] = useState('Semester 5');

  const [sections, setSections] = useState([
    { id: 1, name: 'Section A', sem: 5, year: '2026-27', capacity: 60, active: true },
    { id: 2, name: 'Section B', sem: 5, year: '2026-27', capacity: 60, active: true },
    { id: 3, name: 'Section C', sem: 5, year: '2026-27', capacity: 60, active: true },
    { id: 4, name: 'Section D', sem: 5, year: '2026-27', capacity: 60, active: true },
  ]);

  const [isProvisioning, setIsProvisioning] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const handleAddSection = (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    const newSec = {
      id: Date.now(),
      name: `Section ${newSectionName.trim().toUpperCase()}`,
      sem: 5,
      year: '2026-27',
      capacity: 60,
      active: true,
    };
    setSections([...sections, newSec]);
    setNewSectionName('');
    setIsProvisioning(false);
    addToast('Section Created', `${newSec.name} has been provisioned.`, 'success');
  };

  const handleDeleteSection = (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    setSections(sections.filter((s) => s.id !== id));
    addToast('Section Deleted', `${name} removed from registry.`, 'info');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container max-w-4xl w-[96%] max-h-[92vh] overflow-y-auto bg-white p-6 sm:p-8 rounded-3xl text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 m-0">
                Classes, Sections & Curriculum Management
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                CSE Department
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
              Master academic hierarchy across 4 undergraduate years (8 Semesters) with active section quotas
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsProvisioning(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Provision Section</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 ml-1"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Provision Form Drawer if open */}
        {isProvisioning && (
          <form
            onSubmit={handleAddSection}
            className="my-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center gap-3"
          >
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="e.g. E (for Section E)"
              required
              className="px-3 py-1.5 rounded-xl border border-blue-300 bg-white text-xs text-slate-800 font-bold focus:outline-none w-48 uppercase"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsProvisioning(false)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Year Tabs */}
        <div className="mt-4 flex items-center gap-2 border-b border-slate-200 pb-2">
          {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((yr) => (
            <button
              key={yr}
              onClick={() => setActiveYear(yr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeYear === yr
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>

        {/* Semester Tabs */}
        <div className="mt-3 flex items-center gap-2">
          {['Semester 5', 'Semester 6'].map((sem) => (
            <button
              key={sem}
              onClick={() => setActiveSemester(sem)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                activeSemester === sem
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {sem}
            </button>
          ))}
        </div>

        {/* Active Sections List */}
        <div className="mt-5">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
            Active Sections ({activeYear} - {activeSemester})
          </h3>

          <div className="space-y-2.5">
            {sections.map((sec) => (
              <div
                key={sec.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">{sec.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                      Sem {sec.sem}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
                    Academic Year: {sec.year} • Capacity: {sec.capacity}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    Roster Active
                  </span>
                  <button
                    onClick={() => handleDeleteSection(sec.id, sec.name)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Delete section"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
