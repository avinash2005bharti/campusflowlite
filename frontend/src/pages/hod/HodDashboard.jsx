import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useERP } from '../../context/ERPContext.jsx';
import { dashboardApi, considerationApi, leaveApi, masterDataApi } from '../../api';
import {
  Building2,
  Calendar,
  Clock,
  AlertCircle,
  Users,
  GraduationCap,
  UserPlus,
  ShieldCheck,
  Megaphone,
  ArrowRight,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Layers,
  Sparkles,
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
  const [showClassesModal, setShowClassesModal] = useState(false);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Selected Section Overview Semester
  const [selectedSem, setSelectedSem] = useState('Sem 5');

  // Formatted date and time
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      };
      const datePart = now.toLocaleDateString('en-US', options);
      const timePart = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setCurrentDateTime(`${datePart}  |  ${timePart}`);
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
    return () => {
      window.removeEventListener('campusflow_queue_changed', handleQueueChange);
    };
  }, []);

  // Section B student count
  const getSectionStudentCount = (sectionLetter) => {
    return students.filter((s) => {
      const secName = s.section?.name || s.section?.code || '';
      return secName.toLowerCase().includes(sectionLetter.toLowerCase());
    }).length;
  };

  const countSecB = getSectionStudentCount('B') || 4;
  const countSecA = getSectionStudentCount('A') || 0;
  const countSecC = getSectionStudentCount('C') || 0;
  const countSecD = getSectionStudentCount('D') || 0;

  // Determine greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10 font-sans">
      {/* =======================================================================
          TOP ROW: HOD Office Greeting & Hero Campus Banner
          ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Office badge, Greeting & View Consideration button */}
        <div className="lg:col-span-6 flex flex-col justify-between py-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold tracking-wide mb-3 shadow-xs">
              <span>🏛️</span>
              <span>HOD Office</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 m-0">
              <span>{getGreeting()}, HOD CSE!</span>
              <span className="text-2xl">👋</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 mb-0">
              Here's what's happening in your CSE department today.
            </p>
          </div>

          {/* Date pill & View Consideration Button */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
              <Calendar size={14} className="text-blue-600 shrink-0" />
              <span>{currentDateTime || 'Mon, Oct 12, 2026 | 09:24 PM'}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowLedgerModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
            >
              <FileText size={14} className="text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>View Consideration</span>
            </button>
          </div>
        </div>

        {/* Right: OIST Campus Hero Banner */}
        <div className="lg:col-span-6 relative rounded-3xl overflow-hidden shadow-sm border border-slate-200 min-h-[170px] flex flex-col justify-between p-6 bg-slate-900 text-white group">
          {/* Background image with gradient overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('/campus_building.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/70 to-slate-950/50" />

          {/* Banner Content */}
          <div className="relative z-10 max-w-sm">
            <p className="text-base sm:text-lg font-serif italic text-white/95 leading-snug drop-shadow-xs m-0">
              "Better systems, <br />
              Better education."
            </p>
            <p className="text-xs text-blue-300 font-semibold mt-1.5 drop-shadow-xs m-0">
              — OIST CSE
            </p>
          </div>

          {/* Bottom Right Academic Year Pill */}
          <div className="relative z-10 self-end mt-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-md">
              <Calendar size={13} className="text-blue-400" />
              <span>Academic Year: 2025-26</span>
              <ChevronDown size={12} className="text-slate-300 ml-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================================
          MIDDLE ROW: 5 Key Stat & Action Cards matching UI wireframe
          ======================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Pending Approvals */}
        <div
          onClick={() => navigate('/hod/considerations')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Pending Approvals</span>
            <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
              <AlertCircle size={14} />
            </div>
          </div>

          <div className="my-2">
            <span className="text-3xl font-black text-rose-600 block leading-tight">
              {pendingConsiderations.length || 1}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Requires attention</span>
            {/* Smooth wavy red SVG accent line */}
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
          onClick={() => navigate('/hod/leaves')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Leave Requests</span>
            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <Clock size={14} />
            </div>
          </div>

          <div className="my-2">
            <span className="text-3xl font-black text-slate-900 block leading-tight">
              {pendingLeaves.length || 1}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            <span>{pendingLeaves.length || 1} In queue</span>
          </div>
        </div>

        {/* 3. Add Faculty */}
        <div
          onClick={() => setShowAddFacultyModal(true)}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <GraduationCap size={20} />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-extrabold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
              Add Faculty
            </span>
            <span className="block text-[11px] text-slate-500 font-medium truncate mt-0.5">
              Onboard faculty member
            </span>
          </div>
        </div>

        {/* 4. Add Student */}
        <div
          onClick={() => setShowAddStudentModal(true)}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <UserPlus size={20} />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-extrabold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
              Add Student
            </span>
            <span className="block text-[11px] text-slate-500 font-medium truncate mt-0.5">
              Register new student
            </span>
          </div>
        </div>

        {/* 5. Manage TGs (handwritten "manages tgs" in UI wireframe) */}
        <div
          onClick={() => navigate('/hod/mentorship')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-extrabold text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors">
              Manage TGs
            </span>
            <span className="block text-[11px] text-slate-500 font-medium truncate mt-0.5">
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
        {/* CARD 1: Semester Distribution (lg: 4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                <h2 className="text-xs font-extrabold text-slate-900 m-0">
                  Semester Distribution
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowClassesModal(true)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Donut Chart + Legend */}
            <div className="flex items-center justify-between gap-4 py-6">
              {/* SVG Donut Ring */}
              <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="14"
                  />
                  {/* Active 5th Sem Arc (Golden Amber / Orange) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#F59E0B"
                    strokeWidth="14"
                    strokeDasharray="238.76"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  {/* Accent Cyan Dot Indicator */}
                  <circle
                    cx="50"
                    cy="12"
                    r="4"
                    fill="#06B6D4"
                  />
                </svg>

                {/* Inner center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-black text-slate-900 leading-none">8</span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-0.5">Semesters</span>
                </div>
              </div>

              {/* Legend Grid */}
              <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    1st Sem
                  </span>
                  <span className="font-bold text-slate-800">0%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    2nd Sem
                  </span>
                  <span className="font-bold text-slate-800">0%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    3rd Sem
                  </span>
                  <span className="font-bold text-slate-800">0%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    4th Sem
                  </span>
                  <span className="font-bold text-slate-800">0%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    5th Sem
                  </span>
                  <span className="font-bold text-amber-600">100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
                    6th Sem
                  </span>
                  <span className="font-bold text-slate-800">0%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    7th Sem
                  </span>
                  <span className="font-bold text-slate-800">0%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    8th Sem
                  </span>
                  <span className="font-bold text-slate-800">0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Section Overview (CSE Only) (lg: 4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Users size={16} className="text-blue-600" />
                <h2 className="text-xs font-extrabold text-slate-900 m-0">
                  Section Overview <span className="text-[10px] text-slate-400 font-normal">(CSE Only)</span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                  <span>Sem</span>
                  <select
                    value={selectedSem}
                    onChange={(e) => setSelectedSem(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="Sem 5">Sem 5</option>
                    <option value="Sem 3">Sem 3</option>
                    <option value="Sem 7">Sem 7</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSectionModal(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>View details</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* 4 Section Cards Grid matching hod dashboard.png */}
            <div className="grid grid-cols-4 gap-2.5 py-5">
              {/* CSE-A */}
              <div
                onClick={() => setShowSectionModal(true)}
                className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100/80 text-center hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-between min-h-[110px]"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center">
                  <Users size={14} />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-900">CSE-A</span>
                  <span className="block text-sm font-black text-slate-900 leading-tight mt-0.5">
                    {countSecA}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium">Students</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              {/* CSE-B */}
              <div
                onClick={() => setShowSectionModal(true)}
                className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100/80 text-center hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-between min-h-[110px]"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-purple-600 flex items-center justify-center">
                  <Users size={14} />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-900">CSE-B</span>
                  <span className="block text-sm font-black text-slate-900 leading-tight mt-0.5">
                    {countSecB}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium">Students</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              {/* CSE-C */}
              <div
                onClick={() => setShowSectionModal(true)}
                className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 text-center hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-between min-h-[110px]"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-600 flex items-center justify-center">
                  <Users size={14} />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-900">CSE-C</span>
                  <span className="block text-sm font-black text-slate-900 leading-tight mt-0.5">
                    {countSecC}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium">Students</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              {/* CSE-D */}
              <div
                onClick={() => setShowSectionModal(true)}
                className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100/80 text-center hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-between min-h-[110px]"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-600 flex items-center justify-center">
                  <Users size={14} />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-900">CSE-D</span>
                  <span className="block text-sm font-black text-slate-900 leading-tight mt-0.5">
                    {countSecD}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium">Students</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Notice Board (lg: 4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-rose-500" />
                <h2 className="text-xs font-extrabold text-slate-900 m-0">
                  Notice Board
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                  Official Circulars
                </span>
              </div>

              <span className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer">
                <span>View all</span>
                <ArrowRight size={12} />
              </span>
            </div>

            {/* Empty State matching hod dashboard.png */}
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <p className="text-xs font-extrabold text-slate-700 m-0">
                No official notices published yet
              </p>
              <p className="text-[11px] text-slate-400 font-medium m-0 mt-1 max-w-xs">
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
          initialSection="B"
          initialSemester={5}
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
