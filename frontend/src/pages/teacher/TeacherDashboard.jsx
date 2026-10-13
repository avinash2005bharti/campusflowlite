import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useERP } from '../../context/ERPContext.jsx';
import { dashboardApi, leaveApi } from '../../api';
import {
  StatCard,
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/common';
import {
  BookOpen,
  Calendar,
  ShieldCheck,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileText,
  Users,
} from 'lucide-react';

export default function TeacherDashboard() {
  const { currentUser, openModal } = useERP();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAppointedTg = Boolean(currentUser?.isTG || currentUser?.mentorGroupId);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, leavesRes] = await Promise.all([
        dashboardApi.getSummary().catch(() => ({ data: {} })),
        leaveApi.getMine().catch(() => ({ data: [] })),
      ]);

      setSummary(sumRes?.data || {});
      setRecentLeaves(leavesRes?.data?.slice(0, 5) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleRefresh = () => fetchData();
    window.addEventListener('campusflow_refresh_leaves', handleRefresh);
    return () => {
      window.removeEventListener('campusflow_refresh_leaves', handleRefresh);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="text-blue-600" size={26} />
            Faculty Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, {currentUser?.name || 'Professor'} • Computer Science & Engineering
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAppointedTg && (
            <Button
              variant="secondary"
              onClick={() => navigate('/tg')}
              className="text-xs font-bold"
            >
              <ShieldCheck size={15} />
              Open TG Mentor Portal
            </Button>
          )}

          <Button
            variant="primary"
            onClick={() => openModal('APPLY_LEAVE')}
            className="text-xs font-black shadow-xs"
          >
            <Plus size={15} />
            Apply for Leave
          </Button>
        </div>
      </div>

      {/* TG Mentor Banner if Appointed */}
      {isAppointedTg && (
        <Card className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-none shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
                <ShieldCheck size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-heading font-black text-sm text-white">
                  Appointed Teacher Guardian (TG)
                </h3>
                <p className="text-xs text-blue-100">
                  You are designated as Teacher Guardian for student mentee cohorts. Click below to review pending student requests.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/tg/requests')}
              className="bg-white text-blue-700 hover:bg-blue-50 border-white text-xs font-black shrink-0"
            >
              Review Mentee Requests
              <ArrowRight size={14} />
            </Button>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Leaves Applied"
          value={summary?.leaves?.total ?? recentLeaves.length}
          icon={Calendar}
          variant="primary"
          trend="Personal record"
          trendDirection="neutral"
        />

        <StatCard
          title="Pending Approval"
          value={summary?.leaves?.pending ?? recentLeaves.filter((l) => l.status === 'PENDING').length}
          icon={Clock}
          variant="warning"
          trend="Awaiting HOD approval"
          trendDirection="neutral"
        />

        <StatCard
          title="Supervisory Role"
          value={isAppointedTg ? 'Teacher Guardian' : 'Faculty Member'}
          icon={ShieldCheck}
          variant={isAppointedTg ? 'success' : 'default'}
          trend={isAppointedTg ? 'Active TG cohort' : 'Standard faculty'}
          trendDirection="neutral"
        />
      </div>

      {/* Recent Leaves Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <h3 className="font-heading font-black text-sm text-slate-900">
              Recent Leave Applications
            </h3>
          </div>
          <button
            onClick={() => navigate('/teacher/leaves')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View history <ArrowRight size={13} />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading leave records...</div>
        ) : recentLeaves.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No personal leave applications submitted yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave Type</TableHead>
                <TableHead>Dates & Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Applied Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLeaves.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <span className="badge badge-indigo text-[10px] font-bold">
                      {item.leaveType}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-medium text-slate-800">
                      {item.startDate === item.endDate
                        ? item.startDate
                        : `${item.startDate} to ${item.endDate}`}{' '}
                      ({item.totalDays} days)
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-600 truncate max-w-[220px] block" title={item.reason}>
                      {item.reason}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`badge text-[10px] font-bold ${
                        item.status === 'APPROVED'
                          ? 'badge-emerald'
                          : item.status === 'REJECTED'
                          ? 'badge-danger'
                          : 'badge-primary'
                      }`}
                    >
                      {item.status}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <span className="text-[11px] font-mono text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
