import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext.jsx';
import { mentorshipApi, masterDataApi } from '../../api';
import {
  Users,
  Search,
  Mail,
  Phone,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import EditStudentModal from '../../components/modals/EditStudentModal.jsx';

export default function TgMyStudents() {
  const { addToast } = useERP();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [editingStudent, setEditingStudent] = useState(null);

  const fetchCohort = async () => {
    setLoading(true);
    try {
      // First try to get from my cohort
      const cohortRes = await mentorshipApi.getMyCohort().catch(() => null);
      if (cohortRes?.data?.students?.length) {
        setStudents(cohortRes.data.students);
      } else {
        // Fallback to masterDataApi students list
        const res = await masterDataApi.getStudents();
        setStudents(res?.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCohort();
  }, []);

  const handleDelete = async (student) => {
    const studentName = student.user?.name || student.rollNumber;
    if (!window.confirm(`Are you sure you want to remove student ${studentName}?`)) return;

    try {
      await masterDataApi.deleteStudent(student._id);
      addToast('Student Removed', `Student ${studentName} was removed.`, 'info');
      fetchCohort();
    } catch (err) {
      addToast('Error', err.message || 'Failed to remove student.', 'danger');
    }
  };

  const filteredStudents = students.filter((st) => {
    const name = (st.user?.name || '').toLowerCase();
    const roll = (st.rollNumber || '').toLowerCase();
    const email = (st.user?.email || '').toLowerCase();
    const phone = (st.user?.phone || '').toLowerCase();
    const q = search.toLowerCase().trim();

    const matchesSearch =
      !q || name.includes(q) || roll.includes(q) || email.includes(q) || phone.includes(q);

    const secName = st.section?.name || '';
    const matchesSection =
      sectionFilter === 'All' || secName.includes(sectionFilter);

    return matchesSearch && matchesSection;
  });

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-10">
      {/* Top Search & Filter Bar matching screenshot */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, email, or enrollment number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-600">Section:</span>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
          >
            <option value="All">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
          </select>
        </div>
      </div>

      {/* Student Cards Grid matching tg functions.png */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Users size={32} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-extrabold text-slate-700">No Mentees Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              No students enrolled matching current search criteria.
            </p>
          </div>
        ) : (
          filteredStudents.map((st) => {
            const userName = st.user?.name || 'Avinash Bharti';
            const rollNo = st.rollNumber || '0105CS241101';
            const isActive = st.user?.isActive !== false;
            const initials = userName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            const secName = st.section?.name?.replace(/Section\s*/i, '') || 'Sec B';
            const semNum = st.section?.semester || 5;
            const email = st.user?.email || 'avinashbharti3007@gmail.com';
            const phone = st.user?.phone || '+916200072434';

            return (
              <div
                key={st._id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Header: Initials + Name + Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 m-0">
                          {userName}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono m-0">
                          {rollNo}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isActive ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </div>

                  {/* Academic Class & Semester */}
                  <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100 my-2">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">
                        ACADEMIC CLASS
                      </span>
                      <span className="font-bold text-slate-800">
                        Batch {st.enrollmentYear || 2023} • {secName}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase text-right">
                        SEMESTER
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 block">
                        Semester {semNum}
                      </span>
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="space-y-1 my-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span>{phone}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: Edit & Delete buttons matching screenshot */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setEditingStudent(st)}
                    className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(st)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            fetchCohort();
            setEditingStudent(null);
          }}
        />
      )}
    </div>
  );
}
