import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Search, ExternalLink, Users, UserCheck } from 'lucide-react';
import { masterDataApi } from '../../api';

export default function SectionOverviewModal({
  initialSection = 'B',
  initialSemester = 5,
  onClose,
  onOpenClassesCentral,
}) {
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [currentSemester, setCurrentSemester] = useState(initialSemester);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await masterDataApi.getStudents();
      setStudents(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const sectionOptions = [
    { id: 'A', code: 'CSE-A', label: 'CSE-A' },
    { id: 'B', code: 'CSE-B', label: 'CSE-B' },
    { id: 'C', code: 'CSE-C', label: 'CSE-C' },
    { id: 'D', code: 'CSE-D', label: 'CSE-D' },
  ];

  // Count per section
  const getSectionCount = (secId) => {
    return students.filter((s) => {
      const secName = s.section?.name || s.section?.code || '';
      return secName.includes(secId);
    }).length;
  };

  const currentSectionStudents = students.filter((s) => {
    const secName = s.section?.name || s.section?.code || '';
    return secName.includes(selectedSection);
  });

  const filteredStudents = currentSectionStudents.filter((s) => {
    const name = (s.user?.name || '').toLowerCase();
    const roll = (s.rollNumber || '').toLowerCase();
    const email = (s.user?.email || '').toLowerCase();
    const q = search.toLowerCase().trim();
    return !q || name.includes(q) || roll.includes(q) || email.includes(q);
  });

  const assignedTgName =
    currentSectionStudents[0]?.mentorGroup?.tg?.user?.name ||
    'Prof. Test Teacher';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container max-w-4xl w-[96%] max-h-[92vh] overflow-y-auto bg-white p-6 sm:p-8 rounded-3xl text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-black text-slate-900 m-0">
              Section Overview (CSE Only)
            </h2>
            <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
              Select a section card below to view enrolled students and assigned Tutor Guardian (TG).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              Current: Sem {currentSemester}
            </span>
            <button
              onClick={() => setCurrentSemester(currentSemester === 5 ? 6 : 5)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Move to Next Semester (Sem {currentSemester === 5 ? 6 : 5})</span>
              <ArrowRight size={14} />
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

        {/* Section Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {sectionOptions.map((opt) => {
            const count = getSectionCount(opt.id);
            const isSelected = selectedSection === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedSection(opt.id)}
                className={`p-3.5 rounded-2xl text-center border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="block text-sm font-black text-slate-900">{opt.label}</span>
                <span className="block text-xs font-medium text-slate-500 mt-0.5">
                  {count} Students
                </span>
                {isSelected && (
                  <span className="inline-block mt-1 text-[10px] font-black text-blue-700 uppercase">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Student details Subheader */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              student details: CSE-{selectedSection} • {currentSectionStudents.length} Total
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5">
              <UserCheck size={14} />
              <span>TG : {assignedTgName}</span>
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, enrollment, or email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* Student Table matching image3.png */}
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">NAME</th>
                <th className="p-3">ENROLLMENT</th>
                <th className="p-3">PHONE NUMBER</th>
                <th className="p-3">EMAIL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    No students currently enrolled in CSE-{selectedSection}.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const name = st.user?.name || 'Avinash Bharti';
                  const roll = st.rollNumber || '0105CS241101';
                  const phone = st.user?.phone || '+916200072434';
                  const email = st.user?.email || 'avinashbharti3007@gmail.com';
                  const initial = name.charAt(0).toUpperCase();

                  return (
                    <tr key={st._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {initial}
                        </span>
                        <span className="font-extrabold text-slate-900">{name}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{roll}</td>
                      <td className="p-3 text-slate-600">{phone}</td>
                      <td className="p-3 text-blue-600 font-mono truncate max-w-xs">{email}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (onOpenClassesCentral) onOpenClassesCentral();
              onClose();
            }}
            className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Manage in Classes Central</span>
            <ExternalLink size={13} />
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
