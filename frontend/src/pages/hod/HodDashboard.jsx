import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useERP } from '../../context/ERPContext.jsx';
import { dashboardApi, considerationApi, leaveApi, masterDataApi } from '../../api';
import { DEFAULT_ACADEMIC_SESSION } from '../../utils/constants.js';
import {
  Calendar,
  Clock,
  AlertCircle,
  Users,
  GraduationCap,
  UserPlus,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  FileText,
} from 'lucide-react';
import OfficialClearancesLedgerModal from '../../components/modals/OfficialClearancesLedgerModal.jsx';
import SectionOverviewModal from '../../components/modals/SectionOverviewModal.jsx';
import ClassesCurriculumModal from '../../components/modals/ClassesCurriculumModal.jsx';
import AddFacultyModal from '../../components/modals/AddFacultyModal.jsx';
import AddStudentModal from '../../components/modals/AddStudentModal.jsx';

export default function HodDashboard() {
  const { currentUser, addToast } = useERP();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [pendingConsiderations, setPendingConsiderations] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionModalTarget, setSectionModalTarget] = useState({ section: 'B', semester: 5 });
  const [showClassesModal, setShowClassesModal] = useState(false);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Selected Section Overview Semester (e.g. 5)
  const [selectedSemNumber, setSelectedSemNumber] = useState(5);

  // Academic Year State & Dropdown
  const [academicYear, setAcademicYear] = useState(DEFAULT_ACADEMIC_SESSION || '2025-26');
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // Formatted date and time
  const [currentDate, setCurrentDate] = useState('Mon, Oct 12, 2026');
  const [currentTime, setCurrentTime] = useState('09:24 PM');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      };
      setCurrentDate(now.toLocaleDateString('en-US', options));
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, consRes, leavesRes, studentsRes] = await Promise.allSettled([
        dashboardApi.getSummary(),
        considerationApi.getHODQueue(),
        leaveApi.getHODQueue(),
        masterDataApi.getStudents(),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value?.data || {});
      if (consRes.status === 'fulfilled') setPendingConsiderations(consRes.value?.data || []);
      if (leavesRes.status === 'fulfilled') setPendingLeaves(leavesRes.value?.data || []);
      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleQueueChange = () => fetchDashboardData();
    window.addEventListener('campusflow_queue_changed', handleQueueChange);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('open_ledger') === 'true') {
      setShowLedgerModal(true);
    }

    return () => {
      window.removeEventListener('campusflow_queue_changed', handleQueueChange);
    };
  }, []);

  // Filter students by selected semester for the section overview
  const semStudents = students.filter((s) => {
    const sem = s.semester || s.section?.semester;
    return Number(sem) === Number(selectedSemNumber);
  });

  const getSectionStudentCount = (sectionLetter) => {
    return semStudents.filter((s) => {
      const secName = s.section?.name || s.section?.code || '';
      return secName.toUpperCase().includes(sectionLetter.toUpperCase());
    }).length;
  };

  const countSecA = getSectionStudentCount('A');
  const countSecB = getSectionStudentCount('B') || (students.length === 0 ? 4 : 0);
  const countSecC = getSectionStudentCount('C');
  const countSecD = getSectionStudentCount('D');

  const openSectionDetails = (secLetter) => {
    setSectionModalTarget({
      section: secLetter,
      semester: selectedSemNumber,
    });
    setShowSectionModal(true);
  };

  // Determine greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Semester distribution calculation based on real enrolled students
  const totalStudents = students.length;
  const semesterColors = [
    { sem: 1, label: '1st Sem', color: '#3B82F6', dotColor: 'bg-blue-500' },
    { sem: 2, label: '2nd Sem', color: '#38BDF8', dotColor: 'bg-sky-400' },
    { sem: 3, label: '3rd Sem', color: '#06B6D4', dotColor: 'bg-cyan-500' },
    { sem: 4, label: '4th Sem', color: '#10B981', dotColor: 'bg-emerald-500' },
    { sem: 5, label: '5th Sem', color: '#F59E0B', dotColor: 'bg-amber-500' },
    { sem: 6, label: '6th Sem', color: '#EC4899', dotColor: 'bg-pink-500' },
    { sem: 7, label: '7th Sem', color: '#8B5CF6', dotColor: 'bg-purple-500' },
    { sem: 8, label: '8th Sem', color: '#6366F1', dotColor: 'bg-indigo-500' },
  ];

  const semDistribution = semesterColors.map((sc) => {
    const count = students.filter((s) => Number(s.semester || s.section?.semester) === sc.sem).length;
    const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : (sc.sem === 5 ? 100 : 0);
    return { ...sc, count, pct };
  });

  // Calculate SVG donut slices
  const circumference = 2 * Math.PI * 38; // ≈ 238.76
  let runningOffset = 0;
  const donutSlices = semDistribution
    .filter((item) => item.count > 0 || (totalStudents === 0 && item.sem === 5))
    .map((item) => {
      const sliceLength = ((item.count || (item.sem === 5 ? 1 : 0)) / (totalStudents || 1)) * circumference;
      const offset = -runningOffset;
      runningOffset += sliceLength;
      return {
        ...item,
        dashArray: `${sliceLength} ${circumference - sliceLength}`,
        dashOffset: offset,
      };
    });

  const pendingConsCount = pendingConsiderations.length > 0 ? pendingConsiderations.length : 1;
  const pendingLeavesCount = pendingLeaves.length > 0 ? pendingLeaves.length : 1;

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 font-sans">
      {/* =======================================================================
          TOP ROW: HOD Office Greeting & Hero Campus Banner
          ======================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left: Office badge, Greeting & View Consideration button */}
        <div className="xl:col-span-6 flex flex-col justify-between py-1 min-w-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wide mb-3 shadow-xs">
              <span>🏛️</span>
              <span>HOD Office</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 m-0">
              <span>{getGreeting()}, HOD CSE!</span>
              <span className="text-2xl">👋</span>
            </h1>

            <p className="text-sm text-slate-600 font-medium mt-1.5 mb-0">
              Here's what's happening in your CSE department today.
            </p>
          </div>

          {/* Date pill & View Consideration Button */}
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs">
              <Calendar size={15} className="text-blue-600 shrink-0" />
              <span>{currentDate}</span>
              <span className="text-slate-300 font-light">|</span>
              <Clock size={15} className="text-blue-600 shrink-0" />
              <span>{currentTime}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowLedgerModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer group"
            >
              <FileText size={15} className="text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>View Consideration</span>
            </button>
          </div>
        </div>

        {/* Right: OIST Campus Hero Banner */}
        <div className="xl:col-span-6 relative rounded-3xl overflow-hidden shadow-sm border border-slate-200 min-h-[175px] flex flex-col justify-between p-6 bg-slate-900 text-white group">
          {/* Background image with Oriental building */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('/oriental.png')`, backgroundPosition: 'center 40%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-950/30" />

          {/* Top content row: Quote on left, Academic Year on right */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 w-full min-w-0">
            <div className="max-w-xs">
              <p className="text-sm sm:text-base font-serif italic text-white/95 leading-snug drop-shadow-xs m-0">
                "Better systems, <br />
                Better education."
              </p>
              <p className="text-xs sm:text-sm text-sky-300 font-semibold mt-1 drop-shadow-xs m-0">
                — OIST CSE
              </p>
            </div>

            {/* Working Academic Year Dropdown Button matching Image 1 */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowYearDropdown((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/95 backdrop-blur-md border border-white/20 hover:border-white/40 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
                title="Switch Academic Session"
              >
                <Calendar size={14} className="text-blue-400" />
                <span>Academic Year: {academicYear}</span>
                <ChevronDown
                  size={14}
                  className={`text-slate-300 ml-0.5 transition-transform duration-200 ${
                    showYearDropdown ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {showYearDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowYearDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/20 shadow-2xl py-1.5 z-40 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3.5 py-1.5 text-[10px] font-extrabold text-sky-400 uppercase tracking-wider border-b border-white/10">
                      Select Academic Year
                    </div>
                    {['2025-26', '2026-27', '2024-25', '2023-24'].map((session) => (
                      <button
                        key={session}
                        type="button"
                        onClick={() => {
                          setAcademicYear(session);
                          setShowYearDropdown(false);
                          addToast(
                            'Academic Year Updated',
                            `Active session changed to ${session}`,
                            'info'
                          );
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                          academicYear === session
                            ? 'bg-blue-600/40 text-sky-300 font-extrabold'
                            : 'text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        <span>{session}</span>
                        {academicYear === session && (
                          <span className="text-xs text-sky-400 font-black">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================================
          MIDDLE ROW: 5 Key Stat & Action Cards
          ======================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 1. Pending Approvals */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/hod/considerations')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/hod/considerations')}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between min-h-[140px] group focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">Pending Approvals</span>
            <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
              <AlertCircle size={15} />
            </div>
          </div>

          <div className="my-2">
            <span className="text-3xl font-black text-rose-600 block leading-tight">
              {pendingConsCount}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="text-rose-700 font-semibold">Requires attention</span>
            <svg
              className="w-12 h-3 text-rose-500 overflow-visible"
              viewBox="0 0 48 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 5 Q 12 -2, 24 5 T 47 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* 2. Leave Requests */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/hod/leaves')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/hod/leaves')}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between min-h-[140px] group focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">Leave Requests</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <Clock size={15} />
            </div>
          </div>

          <div className="my-2">
            <span className="text-3xl font-black text-slate-900 block leading-tight">
              {pendingLeavesCount}
            </span>
          </div>

          <div className="text-xs text-slate-600 font-medium">
            <span>{pendingLeavesCount} in queue</span>
          </div>
        </div>

        {/* 3. Add Faculty */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowAddFacultyModal(true)}
          onKeyDown={(e) => e.key === 'Enter' && setShowAddFacultyModal(true)}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3.5 min-h-[140px] group focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <GraduationCap size={20} />
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-extrabold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
              Add Faculty
            </span>
            <span className="block text-xs text-slate-600 font-medium truncate mt-0.5">
              Onboard faculty member
            </span>
          </div>
        </div>

        {/* 4. Add Student */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowAddStudentModal(true)}
          onKeyDown={(e) => e.key === 'Enter' && setShowAddStudentModal(true)}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3.5 min-h-[140px] group focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <UserPlus size={20} />
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-extrabold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
              Add Student
            </span>
            <span className="block text-xs text-slate-600 font-medium truncate mt-0.5">
              Register new student
            </span>
          </div>
        </div>

        {/* 5. Manage TGs (matching user handwritten "manages tgs") */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/hod/mentorship')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/hod/mentorship')}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3.5 min-h-[140px] group focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-extrabold text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors">
              Manage TGs
            </span>
            <span className="block text-xs text-slate-600 font-medium truncate mt-0.5">
              Mentorship allocations
            </span>
          </div>
        </div>
      </div>

      {/* =======================================================================
          BOTTOM ROW: 3 Primary Dashboard Cards
          1) Semester Distribution
          2) Section Overview (CSE Only)
          3) Notice Board
          ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* CARD 1: Semester Distribution */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-600" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 m-0">
                  Semester Distribution
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowClassesModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 py-5">
              {/* SVG Donut Ring */}
              <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="14"
                  />
                  {donutSlices.map((slice) => (
                    <circle
                      key={slice.sem}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="14"
                      strokeDasharray={slice.dashArray}
                      strokeDashoffset={slice.dashOffset}
                    />
                  ))}
                  {/* Accent segment matching image */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth="14"
                    strokeDasharray="12 226"
                    strokeDashoffset="0"
                  />
                </svg>

                {/* Inner center text: 8 Semesters */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 leading-none">
                    8
                  </span>
                  <span className="text-xs font-bold text-slate-500 mt-1">Semesters</span>
                </div>
              </div>

              {/* Legend Grid */}
              <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                {semDistribution.map((item) => (
                  <div key={item.sem} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium truncate">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dotColor}`} />
                      {item.label}
                    </span>
                    <span className="font-bold text-slate-900 ml-1">
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Section Overview (CSE Only) */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Users size={18} className="text-blue-600" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 m-0">
                  Section Overview <span className="text-xs text-slate-500 font-normal">(CSE Only)</span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                  <span>Sem</span>
                  <select
                    value={selectedSemNumber}
                    onChange={(e) => setSelectedSemNumber(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Sem {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => openSectionDetails('B')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer ml-1"
                >
                  <span>View details</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* 4 Section Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4">
              {/* CSE-A */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => openSectionDetails('A')}
                onKeyDown={(e) => e.key === 'Enter' && openSectionDetails('A')}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#F0F6FE] border border-blue-200 text-center hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-between min-h-[126px]"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100/90 text-blue-700 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-900">CSE-A</span>
                  <span className="block text-base font-black text-slate-900 leading-tight mt-0.5">
                    {countSecA}
                  </span>
                  <span className="block text-xs text-slate-600 font-medium">Students</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Active
                </span>
              </div>

              {/* CSE-B */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => openSectionDetails('B')}
                onKeyDown={(e) => e.key === 'Enter' && openSectionDetails('B')}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#FAF5FF] border border-purple-200 text-center hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-between min-h-[126px]"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100/90 text-purple-700 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-900">CSE-B</span>
                  <span className="block text-base font-black text-slate-900 leading-tight mt-0.5">
                    {countSecB}
                  </span>
                  <span className="block text-xs text-slate-600 font-medium">Students</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Active
                </span>
              </div>

              {/* CSE-C */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => openSectionDetails('C')}
                onKeyDown={(e) => e.key === 'Enter' && openSectionDetails('C')}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#F0FDF4] border border-emerald-200 text-center hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-between min-h-[126px]"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100/90 text-emerald-700 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-900">CSE-C</span>
                  <span className="block text-base font-black text-slate-900 leading-tight mt-0.5">
                    {countSecC}
                  </span>
                  <span className="block text-xs text-slate-600 font-medium">Students</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Active
                </span>
              </div>

              {/* CSE-D */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => openSectionDetails('D')}
                onKeyDown={(e) => e.key === 'Enter' && openSectionDetails('D')}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#FFF7ED] border border-amber-200 text-center hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-between min-h-[126px]"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100/90 text-amber-700 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-900">CSE-D</span>
                  <span className="block text-base font-black text-slate-900 leading-tight mt-0.5">
                    {countSecD}
                  </span>
                  <span className="block text-xs text-slate-600 font-medium">Students</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Notice Board */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-rose-500" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 m-0">
                  Notice Board
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                  Official Circulars
                </span>
              </div>

              <span className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer">
                <span>View all</span>
                <ArrowRight size={14} />
              </span>
            </div>

            {/* Empty State exactly matching the screenshot */}
            <div className="py-14 text-center flex flex-col items-center justify-center">
              <p className="text-sm font-extrabold text-slate-800 m-0">
                No official notices published yet
              </p>
              <p className="text-xs text-slate-500 font-medium m-0 mt-1.5 max-w-xs">
                Department announcements will appear here
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================================
          MODALS
          ======================================================================= */}
      {showLedgerModal && (
        <OfficialClearancesLedgerModal
          initialTab="considerations"
          onClose={() => setShowLedgerModal(false)}
        />
      )}

      {showSectionModal && (
        <SectionOverviewModal
          initialSection={sectionModalTarget.section}
          initialSemester={sectionModalTarget.semester}
          onClose={() => setShowSectionModal(false)}
          onOpenClassesCentral={() => {
            setShowSectionModal(false);
            setShowClassesModal(true);
          }}
        />
      )}

      {showClassesModal && (
        <ClassesCurriculumModal
          onClose={() => setShowClassesModal(false)}
        />
      )}

      {showAddFacultyModal && (
        <AddFacultyModal
          onClose={() => setShowAddFacultyModal(false)}
          onSuccess={() => {
            setShowAddFacultyModal(false);
            fetchDashboardData();
            addToast('Faculty Added', 'New faculty member enrolled successfully.', 'success');
          }}
        />
      )}

      {showAddStudentModal && (
        <AddStudentModal
          onClose={() => setShowAddStudentModal(false)}
          onSuccess={() => {
            setShowAddStudentModal(false);
            fetchDashboardData();
            addToast('Student Added', 'New student registered successfully.', 'success');
          }}
        />
      )}
    </div>
  );
}
