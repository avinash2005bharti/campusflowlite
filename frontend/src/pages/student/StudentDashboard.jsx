import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useERP } from '../../context/ERPContext.jsx';
import { dashboardApi, considerationApi, leaveApi } from '../../api';
import {
  Sparkles,
  PlusCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Calendar,
  Inbox,
  ArrowRight,
  User,
} from 'lucide-react';

export default function StudentDashboard() {
  const { currentUser, openModal } = useERP();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [recentConsiderations, setRecentConsiderations] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [sumRes, conRes, leaveRes] = await Promise.allSettled([
        dashboardApi.getSummary(),
        considerationApi.getMine({ limit: 5 }),
        leaveApi.getMine({ limit: 5 }),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value?.data || sumRes.value);
      if (conRes.status === 'fulfilled') setRecentConsiderations(conRes.value?.data || []);
      if (leaveRes.status === 'fulfilled') setRecentLeaves(leaveRes.value?.data || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleRefresh = () => fetchData();
    window.addEventListener('campusflow_refresh_considerations', handleRefresh);
    window.addEventListener('campusflow_refresh_leaves', handleRefresh);
    return () => {
      window.removeEventListener('campusflow_refresh_considerations', handleRefresh);
      window.removeEventListener('campusflow_refresh_leaves', handleRefresh);
    };
  }, []);

  const studentProfile = currentUser?.profile || {};
  const sectionName = studentProfile.section?.name || studentProfile.section?.code || 'Section B';
  const semesterNum = studentProfile.section?.semester || 5;
  const tgMentor = studentProfile.mentorGroup?.tg?.user;
  const tgTeacher = studentProfile.mentorGroup?.tg;

  const approvedLeavesCount = summary?.leaves?.approved ?? 0;
  const approvedConsiderationsCount = summary?.considerations?.approved ?? 0;

  const approvedLeaveDays = recentLeaves
    .filter((l) => l.status === 'APPROVED_BY_HOD' || l.status === 'APPROVED')
    .reduce((sum, l) => sum + (l.totalDays || 1), 0);

  const approvedPeriodsCount = recentConsiderations
    .filter((c) => c.status === 'APPROVED_BY_HOD' || c.status === 'APPROVED')
    .reduce((sum, c) => sum + (c.hodReview?.approvedPeriods || c.requestedPeriods || 0), 0);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED_BY_HOD':
      case 'APPROVED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Approved by HOD
          </span>
        );
      case 'RECOMMENDED_BY_TG':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Recommended by TG
          </span>
        );
      case 'REJECTED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-10 font-sans">
      {/* =======================================================================
          TOP ROW: Greeting & Header Controls matching student dashboard.png
          ======================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 m-0">
            <span>Good day, {currentUser?.name || currentUser?.designation || 'Student'}</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 mb-0 flex items-center gap-2 flex-wrap">
            <span>CSE Department</span>
            <span>•</span>
            <span className="text-blue-600 font-bold">{sectionName}</span>
            <span>•</span>
            <span>Enrolled</span>
            <span>•</span>
            <span>Semester {semesterNum}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchData}
            disabled={refreshing}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'} />
            <span>Refresh</span>
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => navigate('/student/profile')}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer shadow-2xs"
              title="My Profile"
            >
              <User size={15} />
            </button>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
        </div>
      </div>

      {/* =======================================================================
          3 ACTION BUTTONS matching student dashboard.png & myrequest.png
          1) Request Consideration
          2) Apply Leave
          3) My Requests (with clear visible clock logo)
          ======================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Button 1: Request Consideration */}
        <button
          type="button"
          onClick={() => openModal('REQUEST_CONSIDERATION')}
          className="p-4 sm:p-5 rounded-2xl bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-lg bg-white/90 border border-[#C7D2FE] text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <span className="text-sm sm:text-base font-extrabold text-[#1E40AF] group-hover:text-blue-900 transition-colors">
            Request Consideration
          </span>
        </button>

        {/* Button 2: Apply Leave */}
        <button
          type="button"
          onClick={() => openModal('APPLY_LEAVE')}
          className="p-4 sm:p-5 rounded-2xl bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-lg bg-white/90 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <PlusCircle size={18} />
          </div>
          <span className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-900 transition-colors">
            Apply Leave
          </span>
        </button>

        {/* Button 3: My Requests (with clear visible Clock logo pill matching myrequest.png) */}
        <button
          type="button"
          onClick={() => navigate('/student/requests')}
          className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-slate-200 flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Clock size={18} strokeWidth={2.2} />
          </div>
          <span className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-blue-900 transition-colors">
            My Requests
          </span>
        </button>
      </div>

      {/* =======================================================================
          METRICS / APPROVED STATS ROW (Aligned under left buttons)
          ======================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              APPROVED LEAVES
            </span>
            <span className="block text-2xl font-black text-slate-900 mt-0.5">
              {approvedLeavesCount}
            </span>
            <span className="block text-xs text-slate-500 font-medium mt-0.5">
              {approvedLeavesCount > 0
                ? `${approvedLeaveDays} Day${approvedLeaveDays !== 1 ? 's' : ''} Sanctioned`
                : 'Leaves Availed: 0 Days'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ON-DUTY (OD) CREDITS
            </span>
            <span className="block text-2xl font-black text-slate-900 mt-0.5">
              {approvedConsiderationsCount}
            </span>
            <span className="block text-xs text-emerald-600 font-medium mt-0.5">
              {approvedConsiderationsCount > 0
                ? `${approvedPeriodsCount} Lectures Credited`
                : 'Attendance Credit Granted'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* =======================================================================
          ASSIGNED MENTOR / TUTOR GUARDIAN (TG) CARD
          ======================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <UserCheck size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
              ASSIGNED MENTOR / TUTOR GUARDIAN (TG)
            </span>
            <span className="block text-sm font-extrabold text-slate-900 mt-0.5">
              {tgMentor?.name
                ? `${tgMentor.name} (${tgTeacher?.designation || 'Tutor Guardian'})`
                : tgTeacher?.designation
                ? `${tgTeacher.designation} (TG)`
                : 'Not assigned'}
            </span>
            <span className="block text-xs text-slate-500 font-medium mt-0.5">
              Academic Session: {studentProfile.mentorGroup?.academicYear || '2025-26'} • Section: {sectionName} • Email: {tgMentor?.email || 'Not provided'}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium md:max-w-xs md:text-right">
          TG reviews all OD considerations & leaves prior to HOD approval.
        </div>
      </div>

      {/* =======================================================================
          RECENT CONSIDERATION REQUESTS CARD
          ======================================================================= */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider m-0">
            Recent Attendance Consideration Requests
          </h2>
          <button
            type="button"
            onClick={() => openModal('REQUEST_CONSIDERATION')}
            className="text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
          >
            <span>+ New</span>
          </button>
        </div>

        {recentConsiderations.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mb-3">
              <Inbox size={22} />
            </div>
            <h3 className="text-xs font-extrabold text-slate-800 m-0">
              No Consideration Requests
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 font-normal">
              Submit attendance waivers for hackathons, sports, or official college events.
            </p>
            <button
              type="button"
              onClick={() => openModal('REQUEST_CONSIDERATION')}
              className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              Apply Consideration
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentConsiderations.slice(0, 3).map((req) => (
              <div
                key={req._id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer"
                onClick={() => navigate('/student/requests')}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{req.eventTitle}</span>
                    {renderStatusBadge(req.status)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 m-0">
                    {req.startDate} to {req.endDate} • {req.requestedPeriods} Periods
                  </p>
                </div>
                <div className="text-xs text-blue-600 font-bold flex items-center gap-1">
                  <span>View Details</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =======================================================================
          RECENT LEAVE APPLICATIONS CARD
          ======================================================================= */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider m-0">
            Recent Leave Applications
          </h2>
          <button
            type="button"
            onClick={() => openModal('APPLY_LEAVE')}
            className="text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
          >
            <span>+ New</span>
          </button>
        </div>

        {recentLeaves.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mb-3">
              <Calendar size={22} />
            </div>
            <h3 className="text-xs font-extrabold text-slate-800 m-0">
              No Leave Applications
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 font-normal">
              Apply for medical rest, official duty, or personal absence clearances.
            </p>
            <button
              type="button"
              onClick={() => openModal('APPLY_LEAVE')}
              className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              Apply Leave
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLeaves.slice(0, 3).map((leave) => (
              <div
                key={leave._id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer"
                onClick={() => navigate('/student/requests')}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {leave.leaveType} Leave ({leave.totalDays} Day{leave.totalDays !== 1 ? 's' : ''})
                    </span>
                    {renderStatusBadge(leave.status)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 m-0">
                    {leave.startDate} to {leave.endDate} • {leave.reason}
                  </p>
                </div>
                <div className="text-xs text-blue-600 font-bold flex items-center gap-1">
                  <span>View Details</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
