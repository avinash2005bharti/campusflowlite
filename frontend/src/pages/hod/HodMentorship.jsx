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
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import AppointTgModal from '../../components/modals/AppointTgModal.jsx';
import AddFacultyModal from '../../components/modals/AddFacultyModal.jsx';

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

  // Cohort view mode toggle
  const [viewMode, setViewMode] = useState('faculty'); // 'faculty' | 'cohorts'
  const [expandedGroupId, setExpandedGroupId] = useState(null);

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
    const cohort = getTeacherCohort(teacher);
    if (!cohort) {
      addToast('Notice', 'No active TG assignment found to revoke.', 'info');
      return;
    }

    if (!window.confirm(`Revoke TG appointment for ${teacher.user?.name || 'Faculty'}?`)) return;

    try {
      await mentorshipApi.deleteGroup(cohort._id);
      addToast('TG Appointment Revoked', `${teacher.user?.name} is now standard faculty.`, 'info');
      fetchData();
    } catch (err) {
      addToast('Error', err.message || 'Failed to revoke TG appointment.', 'danger');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10 font-sans">
      {/* Header matching tg management.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
            <span>HOD Portal</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Institutional Hierarchy</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight m-0">
            Faculty & Tutor Guardian (TG) Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 mb-0">
            Department of Computer Science & Engineering • Relational Workload & Mentorship Allocations
          </p>
        </div>

        {/* Action Buttons Row matching tg management.png */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setShowAddFacultyModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>+ Add Faculty Member</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPreselectedTeacher(null);
              setShowAppointModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck size={14} />
            <span>Appoint Tutor Guardian (TG)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              addToast('AI Absence Optimizer', 'Analyzing faculty workload and timetable constraints...', 'info');
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Absence & AI Adjust</span>
          </button>

          <button
            type="button"
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Refresh records"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : 'text-slate-500'} />
          </button>
        </div>
      </div>

      {/* 4 Overview Stat Cards matching tg management.png */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Faculty */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              TOTAL DEPARTMENT FACULTY
            </span>
            <span className="block text-lg font-black text-slate-900 mt-0.5">
              {teachers.length || 5} Members
            </span>
          </div>
        </div>

        {/* Stat 2: Appointed TGs (Highlight Green Border) */}
        <div className="p-4 rounded-2xl bg-white border-2 border-emerald-500 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              APPOINTED TUTOR GUARDIANS (TG)
            </span>
            <span className="block text-lg font-black text-emerald-700 mt-0.5">
              {activeTgs.length || 2} Active TGs
            </span>
          </div>
        </div>

        {/* Stat 3: Mentored Sections */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              MENTORED SECTIONS
            </span>
            <span className="block text-lg font-black text-slate-900 mt-0.5">
              Sec Semester 5 • Section B
            </span>
          </div>
        </div>

        {/* Stat 4: HOD Clearance Gateway */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              HOD CLEARANCE GATEWAY
            </span>
            <span className="block text-lg font-black text-slate-900 mt-0.5">
              Multi-Tier Active
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar matching screenshot */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Faculty ({teachers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tg')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tg'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tutor Guardians ({activeTgs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('standard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'standard'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Standard Faculty ({standardFaculty.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculty by name, email, or designation..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* Faculty Cards Grid matching tg management.png */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            const isHod = t.user?.role === 'hod' || t.designation?.toLowerCase().includes('head');
            const facultyName = t.user?.name || 'Faculty Member';
            const email = t.user?.email || 'faculty@oist.edu';
            const designation = t.designation || (isTg ? 'Assistant Professor (TG)' : 'Assistant Professor');

            return (
              <div
                key={t._id}
                className={`p-4 rounded-2xl bg-white border transition-all flex flex-col justify-between shadow-2xs ${
                  isTg ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                <div>
                  {/* Top Row: Name + Availability Pill */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 m-0 leading-tight">
                        {facultyName}
                      </h3>
                      <p className="text-xs text-blue-700 font-bold m-0 mt-0.5">
                        {designation}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono m-0 mt-0.5 truncate max-w-[170px]">
                        {email}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Available</span>
                    </span>
                  </div>

                  {/* Specialization / Department */}
                  <div className="py-2 border-t border-slate-100 my-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      SPECIALIZATION
                    </span>
                    <span className="text-xs font-semibold text-slate-700 mt-0.5 block truncate">
                      {t.specialization || 'Computer Science & Engineering'}
                    </span>
                  </div>

                  {/* Workload Slots */}
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] my-2">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Max Periods / Day</span>
                      <span className="font-extrabold text-slate-800">4 slots</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Max Periods / Week</span>
                      <span className="font-extrabold text-blue-600">18 slots</span>
                    </div>
                  </div>

                  {/* TG Appointment Status Pill */}
                  {isTg ? (
                    <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-1.5 my-2">
                      <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                      <span className="truncate">
                        Designated TG {cohort ? `(Semester 5 • Section B)` : '(Section unassigned)'}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-500 flex items-center gap-1.5 my-2">
                      <Users size={14} className="text-slate-400 shrink-0" />
                      <span>Regular Faculty Member</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Row matching screenshot */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      addToast('Edit Faculty', `Editing profile of ${facultyName}`, 'info');
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </button>

                  {isTg ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPreselectedTeacher(t);
                          setShowAppointModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Change Section
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevokeTg(t)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 px-1 transition-colors cursor-pointer"
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
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                    >
                      <ShieldCheck size={12} />
                      <span>Appoint as TG</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

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
