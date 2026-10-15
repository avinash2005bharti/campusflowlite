import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useERP } from '../../context/ERPContext.jsx';
import { dashboardApi, mentorshipApi, considerationApi, leaveApi } from '../../api';
import {
  Users,
  CheckSquare,
  FileText,
  Calendar,
  ArrowRight,
  RefreshCw,
  Bell,
  ExternalLink,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Megaphone,
} from 'lucide-react';
import OfficialClearancesLedgerModal from '../../components/modals/OfficialClearancesLedgerModal.jsx';

export default function TgDashboard() {
  const { currentUser } = useERP();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [cohort, setCohort] = useState(null);
  const [pendingConsiderations, setPendingConsiderations] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active duty toggle state
  const [activeDuty, setActiveDuty] = useState(true);
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [selectedSem, setSelectedSem] = useState('5th Semester');
  const [selectedSec, setSelectedSec] = useState('Section B');

  // Ledger Modal State
  const [ledgerModalTab, setLedgerModalTab] = useState(null); // 'considerations' | 'leaves' | null

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, cohortRes, conRes, leaveRes] = await Promise.allSettled([
        dashboardApi.getSummary(),
        mentorshipApi.getMyCohort(),
        considerationApi.getTGQueue(),
        leaveApi.getTGQueue(),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value?.data || sumRes.value);
      if (cohortRes.status === 'fulfilled') setCohort(cohortRes.value?.data || cohortRes.value);
      if (conRes.status === 'fulfilled') setPendingConsiderations(conRes.value?.data || []);
      if (leaveRes.status === 'fulfilled') setPendingLeaves(leaveRes.value?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleQueueChange = () => fetchData();
    window.addEventListener('campusflow_queue_changed', handleQueueChange);
    return () => {
      window.removeEventListener('campusflow_queue_changed', handleQueueChange);
    };
  }, []);

  const totalPending = pendingConsiderations.length + pendingLeaves.length;
  const menteeCount = cohort?.students?.length || 0;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-10">
      {/* Top Bar Switcher Link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            TUTOR GUARDIAN PORTAL
          </span>
        </div>
        <Link
          to="/teacher"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group no-underline"
        >
          <span>Teacher Dashboard</span>
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Welcome & Section Control Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              Welcome back, {currentUser?.name || currentUser?.designation || 'Tutor Guardian'}!
            </h1>
            <p className="text-xs text-slate-500 mt-1 mb-3 font-medium">
              Here's the latest overview of your assigned section.
            </p>

            {/* Controls Row: Active Duty Toggle + Dropdowns */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveDuty(!activeDuty)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                  activeDuty
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <span>Active Duty</span>
                <span
                  className={`w-6 h-3.5 rounded-full p-0.5 transition-colors flex items-center ${
                    activeDuty ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white block" />
                </span>
              </button>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="CSE">CSE</option>
              </select>

              <select
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="5th Semester">5th Semester</option>
                <option value="4th Semester">4th Semester</option>
                <option value="6th Semester">6th Semester</option>
              </select>

              <select
                value={selectedSec}
                onChange={(e) => setSelectedSec(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="Section B">Section B</option>
                <option value="Section A">Section A</option>
                <option value="Section C">Section C</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top Right Quick Stat Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[140px] shrink-0">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 mx-auto mb-1 flex items-center justify-center">
            <Users size={16} />
          </div>
          <span className="block text-2xl font-black text-slate-900">{menteeCount}</span>
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Mentees in your section
          </span>
        </div>
      </div>

      {/* 4 Primary Action / Information Cards Row matching wireframe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: PENDING REQUESTS */}
        <div
          onClick={() => navigate('/tg/requests')}
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <FileText size={18} />
            </div>
            <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              PENDING REQUESTS
            </span>
            <span className="block text-3xl font-black text-slate-900 mt-1">
              {totalPending}
            </span>
            <span className="block text-xs text-rose-600 font-semibold mt-0.5">
              Requires your action
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
            <span>Forward to HOD</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: TOTAL MENTEES */}
        <div
          onClick={() => navigate('/tg/students')}
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Users size={18} />
            </div>
            <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              TOTAL MENTEES
            </span>
            <span className="block text-3xl font-black text-slate-900 mt-1">
              {menteeCount}
            </span>
            <span className="block text-xs text-slate-500 font-medium mt-0.5">
              CSE • 5th Semester • Section B
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
            <span>View Roster</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: view consideration list button card */}
        <div
          onClick={() => setLedgerModalTab('considerations')}
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <CheckSquare size={18} />
            </div>
            <span className="block text-base font-extrabold text-slate-900 leading-snug group-hover:text-purple-700 transition-colors">
              view consideration list
            </span>
            <span className="block text-xs text-slate-500 mt-1">
              Approved clearances & sanctioned OD ledger
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
            <span>Open Ledger</span>
            <ExternalLink size={14} />
          </div>
        </div>

        {/* Card 4: view leave lists button card */}
        <div
          onClick={() => setLedgerModalTab('leaves')}
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Calendar size={18} />
            </div>
            <span className="block text-base font-extrabold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
              view leave lists
            </span>
            <span className="block text-xs text-slate-500 mt-1">
              Section absence records & sanctioned leaves
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>Open Ledger</span>
            <ExternalLink size={14} />
          </div>
        </div>
      </div>

      {/* Notice Board Section */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-blue-600" />
            <h2 className="text-sm font-extrabold text-slate-900 m-0">Notice Board</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
              Latest
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-500 hover:bg-slate-100 cursor-pointer">
              Circulars
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-500 hover:bg-slate-100 cursor-pointer">
              Department
            </span>
          </div>
        </div>

        <div className="py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto mb-2 flex items-center justify-center">
            <Megaphone size={18} />
          </div>
          <p className="text-xs font-bold text-slate-700 m-0">No notices posted</p>
          <p className="text-[11px] text-slate-400 m-0 mt-0.5">
            No active circulars for CSE • 5th Semester • Section B.
          </p>
        </div>
      </div>

      {/* Official Clearances Ledger Modal */}
      {ledgerModalTab && (
        <OfficialClearancesLedgerModal
          initialTab={ledgerModalTab}
          onClose={() => setLedgerModalTab(null)}
        />
      )}
    </div>
  );
}
