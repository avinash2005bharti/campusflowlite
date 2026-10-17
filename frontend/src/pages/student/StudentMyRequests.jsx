import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useERP } from '../../context/ERPContext.jsx';
import { considerationApi, leaveApi } from '../../api';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import FormalApplicationModal from '../../components/modals/FormalApplicationModal.jsx';

export default function StudentMyRequests() {
  const { openModal, currentUser } = useERP();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const urlStatus = searchParams.get('status');

  const resolveInitialTab = () => {
    if (urlTab === 'active' || urlTab === 'pending' || urlStatus === 'PENDING' || urlStatus === 'pending') {
      return 'active';
    }
    if (urlTab === 'completed' || urlStatus === 'APPROVED' || urlStatus === 'APPROVED_BY_HOD') {
      return 'completed';
    }
    return urlTab || 'all';
  };

  const [activeTab, setActiveTab] = useState(resolveInitialTab);
  const [requests, setRequests] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSanction, setSelectedSanction] = useState(null);

  useEffect(() => {
    if (urlTab === 'active' || urlTab === 'pending' || urlStatus === 'PENDING' || urlStatus === 'pending') {
      setActiveTab('active');
    } else if (urlTab === 'completed' || urlStatus === 'APPROVED' || urlStatus === 'APPROVED_BY_HOD') {
      setActiveTab('completed');
    } else if (urlTab === 'all') {
      setActiveTab('all');
    }
  }, [urlTab, urlStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [conRes, leaveRes] = await Promise.allSettled([
        considerationApi.getMine(),
        leaveApi.getMine(),
      ]);

      const conList = conRes.status === 'fulfilled' ? conRes.value?.data || [] : [];
      const leaveList = leaveRes.status === 'fulfilled' ? leaveRes.value?.data || [] : [];

      setRequests(conList);
      setLeaves(leaveList);
    } finally {
      setLoading(false);
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

  // Merge items with a type indicator
  const allItems = [
    ...requests.map((r) => ({ ...r, itemType: 'CONSIDERATION' })),
    ...leaves.map((l) => ({ ...l, itemType: 'LEAVE' })),
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const activeItems = allItems.filter(
    (i) => i.status === 'PENDING' || i.status === 'RECOMMENDED_BY_TG'
  );

  const completedItems = allItems.filter(
    (i) => i.status === 'APPROVED_BY_HOD' || i.status === 'APPROVED' || i.status === 'REJECTED' || i.status === 'CANCELLED'
  );

  const displayedItems =
    activeTab === 'active'
      ? activeItems
      : activeTab === 'completed'
      ? completedItems
      : allItems;

  const studentProfile = currentUser?.profile || {};
  const studentName = currentUser?.name || currentUser?.designation || 'Student';
  const enrollmentNo = studentProfile.enrollmentNumber || studentProfile.rollNumber || 'Not provided';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED_BY_HOD':
      case 'APPROVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Approved
          </span>
        );
      case 'RECOMMENDED_BY_TG':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Recommended by TG
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight m-0">
              My Applications & Requests
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-extrabold uppercase tracking-wider">
              Status Tracking
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1 mb-0">
            Track your attendance consideration requests and student leave applications
          </p>
        </div>

        <button
          onClick={() => openModal('APPLY_LEAVE')}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Clearance Protocol Stepper Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider">
            APPROVAL WORKFLOW
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Standard Review Timeline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mb-1">
              1
            </span>
            <span className="text-xs font-bold text-slate-900">Student Submits</span>
            <span className="text-[11px] text-slate-500 font-medium">Online Request</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mb-1">
              2
            </span>
            <span className="text-xs font-bold text-slate-900">Tutor Guardian (TG)</span>
            <span className="text-[11px] text-slate-500 font-medium">Recommendation</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mb-1">
              3
            </span>
            <span className="text-xs font-bold text-slate-900">Head of Department (HOD)</span>
            <span className="text-[11px] text-slate-500 font-medium">Final Approval</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => {
            setActiveTab('all');
            setSearchParams({});
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({allItems.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('active');
            setSearchParams({ tab: 'active' });
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Active ({activeItems.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('completed');
            setSearchParams({ tab: 'completed' });
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({completedItems.length})
        </button>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {displayedItems.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Clock size={32} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-extrabold text-slate-700">No Applications Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              No clearance requests recorded in this filter view.
            </p>
          </div>
        ) : (
          displayedItems.map((item) => {
            const isApproved =
              item.status === 'APPROVED_BY_HOD' || item.status === 'APPROVED';
            const isPending = item.status === 'PENDING';
            const isConsideration = item.itemType === 'CONSIDERATION';

            const title = isConsideration
              ? `Attendance Consideration: ${item.eventTitle}`
              : `Leave Application: ${item.leaveType ? item.leaveType.replace(/_/g, ' ') : 'Leave'}`;

            const periodText = isConsideration
              ? (item.hodReview?.approvedPeriods
                  ? `Approved Lectures: ${item.hodReview.approvedPeriods} of ${item.requestedPeriods} Requested`
                  : `Requested Lectures: ${item.requestedPeriods} ${item.requestedPeriods === 1 ? 'Lecture' : 'Lectures'}`)
              : `Total Duration: ${item.totalDays} Day${item.totalDays !== 1 ? 's' : ''}`;

            return (
              <div
                key={item._id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 m-0">
                        {title}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 m-0">
                        {studentName} ({enrollmentNo})
                      </p>
                    </div>
                  </div>

                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* Dates & Resolution */}
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar size={14} />
                    <span>
                      {item.startDate} {item.endDate !== item.startDate ? `to ${item.endDate}` : ''}
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-700 font-semibold">
                    {isPending ? 'Under Review' : 'Processed'}
                  </span>
                </div>

                {/* Reason */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium">
                  <span className="text-slate-500">Reason: </span>
                  <span>{item.description || item.reason || 'Attendance consideration request'}</span>
                </div>

                {/* Requested Lectures Pill */}
                <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs font-semibold text-blue-800 flex items-center gap-2">
                  <Clock size={14} className="shrink-0 text-blue-600" />
                  <span>{periodText}</span>
                </div>

                {/* Approved Sanction Order Issued Banner */}
                {isApproved && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                      <div>
                        <span>Official Sanction Order Issued</span>
                        <span className="block text-[11px] font-normal text-emerald-700">
                          Formally sanctioned by Department of CSE
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSanction(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <FileText size={14} />
                      <span>View Order</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Formal Sanction Order Modal */}
      {selectedSanction && (
        <FormalApplicationModal
          item={selectedSanction}
          onClose={() => setSelectedSanction(null)}
        />
      )}
    </div>
  );
}
