import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useERP } from '../../context/ERPContext.jsx';
import { dashboardApi, leaveApi, masterDataApi } from '../../api';
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
  Shield,
  Users,
  Database,
  Calendar,
  Layers,
  ArrowRight,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Lock,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminDashboard() {
  const { openModal } = useERP();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [hodLeaves, setHodLeaves] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, leavesRes, usersRes] = await Promise.all([
        dashboardApi.getSummary().catch(() => ({ data: {} })),
        leaveApi.getAdminQueue().catch(() => ({ data: [] })),
        masterDataApi.getUsers({ limit: 1 }).catch(() => ({ data: { meta: { total: 0 } } })),
      ]);

      setSummary(sumRes?.data || {});
      setHodLeaves(leavesRes?.data || []);
      setUsersCount(usersRes?.data?.meta?.total || 0);
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="text-blue-600" size={26} />
            Institutional Administration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System Control Panel • User Management, Master Bulk Imports & Executive Approvals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/audit')}
            className="text-xs"
          >
            <Activity size={14} />
            System Audit Trail
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/admin/import')}
            className="text-xs"
          >
            <Database size={14} />
            Bulk Import
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="User Accounts"
          value={usersCount}
          icon={Users}
          variant="primary"
          trend="Total Active"
          trendDirection="up"
        />

        <StatCard
          title="Pending HOD Leaves"
          value={hodLeaves.filter((l) => l.status === 'PENDING').length}
          icon={Calendar}
          variant="warning"
          trend="Executive authorization"
          trendDirection="neutral"
        />

        <StatCard
          title="Active Escalations"
          value={(summary?.escalatedConsiderations || 0) + (summary?.escalatedLeaves || 0)}
          icon={AlertTriangle}
          variant="danger"
          trend="48h Inactivity"
          trendDirection="down"
        />

        <StatCard
          title="Faculty on Leave"
          value={summary?.facultyOnLeaveToday ?? 0}
          icon={UserCheck}
          variant="default"
          trend="Active today"
          trendDirection="neutral"
        />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => navigate('/admin/users')}
          className="card p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">User Accounts</h4>
              <p className="text-[11px] text-slate-400">Manage credentials & roles</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </div>

        <div
          onClick={() => navigate('/admin/import')}
          className="card p-4 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Database size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">Excel Bulk Import</h4>
              <p className="text-[11px] text-slate-400">Students & Faculty rosters</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
        </div>

        <div
          onClick={() => navigate('/admin/hod-leaves')}
          className="card p-4 cursor-pointer hover:border-amber-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Calendar size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">HOD Leaves</h4>
              <p className="text-[11px] text-slate-400">Director approval queue</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
        </div>

        <div
          onClick={() => navigate('/audit')}
          className="card p-4 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Shield size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">Security Audit Trail</h4>
              <p className="text-[11px] text-slate-400">Tamper-evident logs</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* Urgent HOD Leave Applications Queue */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-amber-600" />
            <h3 className="font-heading font-black text-sm text-slate-900">
              Department Head (HOD) Leave Requests Queue
            </h3>
          </div>
          <button
            onClick={() => navigate('/admin/hod-leaves')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Manage all <ArrowRight size={13} />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading HOD leaves...</div>
        ) : hodLeaves.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No HOD leave requests currently pending executive review.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HOD Name</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Dates & Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hodLeaves.slice(0, 5).map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <span className="font-heading font-black text-xs text-slate-900">
                      {item.applicant?.name || 'Department Head'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="badge badge-amber text-[10px] font-bold">
                      {item.leaveType}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-medium text-slate-700">
                      {item.startDate === item.endDate
                        ? item.startDate
                        : `${item.startDate} to ${item.endDate}`}{' '}
                      ({item.totalDays} days)
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-600 truncate max-w-[200px] block" title={item.reason}>
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
                    {item.status === 'PENDING' && (
                      <Button
                        variant="warning"
                        onClick={() =>
                          openModal('REVIEW_ACTION', {
                            type: 'LEAVE',
                            role: 'ADMIN',
                            item,
                          })
                        }
                        className="btn-sm text-[11px] font-bold py-1 px-3"
                      >
                        Review
                      </Button>
                    )}
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
