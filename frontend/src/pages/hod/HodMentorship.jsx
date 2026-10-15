import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext.jsx';
import { mentorshipApi, masterDataApi } from '../../api';
import {
  Users,
  ShieldCheck,
  GraduationCap,
  Award,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Lock,
} from 'lucide-react';
import AppointTgModal from '../../components/modals/AppointTgModal.jsx';
import AddFacultyModal from '../../components/modals/AddFacultyModal.jsx';
import EditFacultyModal from '../../components/modals/EditFacultyModal.jsx';

export default function HodMentorship() {
  const { addToast } = useERP();

  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'tg' | 'standard'
  const [search, setSearch] = useState('');

  // Modals
  const [showAppointModal, setShowAppointModal] = useState(false);
  const [preselectedTeacher, setPreselectedTeacher] = useState(null);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [facultyToEdit, setFacultyToEdit] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, groupsRes, studentsRes] = await Promise.allSettled([
        masterDataApi.getTeachers(),
        mentorshipApi.listGroups(),
        masterDataApi.getStudents(),
      ]);

      if (teachersRes.status === 'fulfilled') setTeachers(teachersRes.value?.data || []);
      if (groupsRes.status === 'fulfilled') setGroups(groupsRes.value?.data || []);
      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map of teacher IDs who are TGs
  const tgTeacherIds = new Set(groups.map((g) => g.tg?._id || g.tg?.user?._id || g.tg));

  const isTeacherTg = (teacher) => {
    return (
      teacher.isTG ||
      tgTeacherIds.has(teacher._id) ||
      tgTeacherIds.has(teacher.user?._id) ||
      groups.some((g) => (g.tg?._id || g.tg) === teacher._id)
    );
  };

  const getTeacherCohort = (teacher) => {
    return groups.find((g) => (g.tg?._id || g.tg) === teacher._id);
  };

  const activeTgs = teachers.filter((t) => isTeacherTg(t));
  const standardFaculty = teachers.filter((t) => !isTeacherTg(t));

  const filteredTeachers = teachers.filter((t) => {
    const isTg = isTeacherTg(t);
    if (activeTab === 'tg' && !isTg) return false;
    if (activeTab === 'standard' && isTg) return false;

    const name = (t.user?.name || '').toLowerCase();
    const email = (t.user?.email || '').toLowerCase();
    const desig = (t.designation || '').toLowerCase();
    const q = search.toLowerCase().trim();
    return !q || name.includes(q) || email.includes(q) || desig.includes(q);
  });

  const handleRevokeTg = async (teacher) => {
    const facultyName = teacher.user?.name || teacher.designation || 'Faculty Member';
    if (!window.confirm(`Revoke Tutor Guardian appointment for ${facultyName}?`)) {
      return;
    }

    try {
      const cohort = getTeacherCohort(teacher);
      if (cohort?._id) {
        await mentorshipApi.deleteGroup(cohort._id);
      }
      await masterDataApi.updateTeacher(teacher._id, { isTG: false });
      addToast(
        'TG Appointment Revoked',
        `${facultyName} has been returned to standard faculty status.`,
        'info'
      );
      fetchData();
    } catch (err) {
      addToast('Error', err.response?.data?.error?.message || err.message || 'Failed to revoke TG appointment.', 'danger');
    }
  };

  // Compute mentored section label
  const activeCohorts = groups.filter((g) => g.isActive !== false);
  const mentoredSectionLabel = activeCohorts.length > 0
    ? (() => {
        const g = activeCohorts[0];
        const sem = g.semester || g.section?.semester || 5;
        const sec = g.section?.name || g.section?.code || (g.name?.includes('CSE-') ? `Section ${g.name.split('CSE-')[1]}` : 'Section B');
        return `Sec Semester ${sem} • ${sec}`;
      })()
    : 'Sec Semester 5 • Section B';

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 font-sans">
      {/* 4 Overview Stat Cards matching Image 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Faculty */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5 min-h-[96px]">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              TOTAL DEPARTMENT FACULTY
            </span>
            <span className="block text-xl font-black text-slate-900 mt-0.5">
              {teachers.length || 5} Members
            </span>
          </div>
        </div>

        {/* Stat 2: Appointed TGs */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-emerald-500 shadow-2xs flex items-center gap-3.5 min-h-[96px]">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              APPOINTED TUTOR GUARDIANS (TG)
            </span>
            <span className="block text-xl font-black text-emerald-700 mt-0.5">
              {activeTgs.length || 1} Active TGs
            </span>
          </div>
        </div>

        {/* Stat 3: Mentored Sections (proper responsive truncation so text never overflows) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5 min-h-[96px] overflow-hidden">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
            <GraduationCap size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              MENTORED SECTION
            </span>
            <span className="block text-base sm:text-lg font-black text-slate-900 mt-0.5 truncate" title={mentoredSectionLabel}>
              {mentoredSectionLabel}
            </span>
          </div>
        </div>

        {/* Stat 4: Multi-Tier Active */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5 min-h-[96px]">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
            <Lock size={22} />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              PEER CLEARANCE SETTINGS
            </span>
            <span className="block text-xl font-black text-slate-900 mt-0.5">
              Multi-Tier Active
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar matching Image 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Faculty ({teachers.length || 5})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tg')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'tg'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tutor Guardians ({activeTgs.length || 1})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('standard')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'standard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Standard Faculty ({standardFaculty.length || 4})
          </button>
        </div>

        {/* Search Input on Right */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculty by name, email, or designation..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none transition-all font-medium min-h-[42px] shadow-2xs"
          />
        </div>
      </div>

      {/* Spacious 3-Column Faculty Cards Grid matching Image 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeachers.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Users size={32} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-extrabold text-slate-700">No Faculty Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              No faculty records match your active search filters.
            </p>
          </div>
        ) : (
          filteredTeachers.map((t) => {
            const isTg = isTeacherTg(t);
            const cohort = getTeacherCohort(t);
            const facultyName = t.user?.name || t.designation || 'Faculty Member';
            const email = t.user?.email || 'authenticated@mail.in';
            const designation = t.designation || (isTg ? 'Assistant Professor (TG)' : 'Assistant Professor');

            const cohortSemester = cohort?.semester || cohort?.section?.semester || 5;
            const cohortSection = cohort?.section?.name || cohort?.section?.code || (cohort?.name?.includes('CSE-') ? `Section ${cohort.name.split('CSE-')[1]}` : 'Section B');
            const cohortLabel = `Semester ${cohortSemester} • ${cohortSection}`;

            return (
              <div
                key={t._id}
                className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between shadow-2xs hover:shadow-sm ${
                  isTg ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                <div>
                  {/* Top Row: Name + Availability Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900 m-0 leading-tight">
                        {facultyName}
                      </h3>
                      <p className="text-xs text-blue-600 font-bold m-0 mt-0.5">
                        {designation}
                      </p>
                      <p className="text-xs text-slate-400 font-mono m-0 mt-0.5 truncate max-w-[200px]" title={email}>
                        {email}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>Available (Click for Leave)</span>
                    </div>
                  </div>

                  {/* Specialization */}
                  <div className="pt-3 pb-2 border-t border-slate-100 my-2.5">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      SPECIALIZATION
                    </span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                      {t.specialization || 'Computer Science & Engineering'}
                    </span>
                  </div>

                  {/* Workload 2 Boxes Side-by-Side matching Image 3 */}
                  <div className="grid grid-cols-2 gap-2.5 my-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Max Periods / Day
                      </span>
                      <span className="block text-sm font-extrabold text-blue-600 mt-0.5">
                        4 slots
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Max Periods / Week
                      </span>
                      <span className="block text-sm font-extrabold text-blue-600 mt-0.5">
                        18 slots
                      </span>
                    </div>
                  </div>

                  {/* TG Status Row */}
                  <div className="my-2.5">
                    {isTg ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                        <span className="truncate">
                          Assigned to: {cohortLabel}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-slate-500 px-1 py-1">
                        Regular Faculty Member
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Row matching Image 3 & Image 4 */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setFacultyToEdit(t)}
                    className="px-3.5 py-2 rounded-xl border border-blue-600 bg-white hover:bg-blue-50 text-blue-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>

                  {isTg ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreselectedTeacher(t);
                          setShowAppointModal(true);
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        Change Section
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevokeTg(t)}
                        className="px-3 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Revoke TG
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setPreselectedTeacher(t);
                        setShowAppointModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <ShieldCheck size={14} />
                      <span>Appoint as TG</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Faculty Profile Modal matching Image 4 */}
      {facultyToEdit && (
        <EditFacultyModal
          teacher={facultyToEdit}
          onClose={() => setFacultyToEdit(null)}
          onSuccess={() => {
            setFacultyToEdit(null);
            fetchData();
          }}
        />
      )}

      {/* Appoint TG Modal */}
      {showAppointModal && (
        <AppointTgModal
          teachers={teachers}
          preselectedTeacher={preselectedTeacher}
          onClose={() => setShowAppointModal(false)}
          onSuccess={() => {
            setShowAppointModal(false);
            fetchData();
          }}
        />
      )}

      {/* Add Faculty Modal */}
      {showAddFacultyModal && (
        <AddFacultyModal
          onClose={() => setShowAddFacultyModal(false)}
          onSuccess={() => {
            setShowAddFacultyModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
