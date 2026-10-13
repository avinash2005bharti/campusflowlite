import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext.jsx';
import { leaveApi } from '../../api';
import {
  PageHeader,
  Button,
  Card,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
} from '../../components/common';
import { Calendar, Plus, Eye, Ban, FileText } from 'lucide-react';
import WorkflowTimeline from '../../components/WorkflowTimeline.jsx';

export default function StudentLeaves() {
  const { openModal, viewAttachment, addToast } = useERP();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await leaveApi.getMine(params);
      setLeaves(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();

    const handleRefresh = () => fetchLeaves();
    window.addEventListener('campusflow_refresh_leaves', handleRefresh);
    return () => {
      window.removeEventListener('campusflow_refresh_leaves', handleRefresh);
    };
  }, [statusFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this pending leave application?')) return;
    try {
      await leaveApi.cancel(id);
      addToast('Cancelled', 'Leave application cancelled.', 'info');
      fetchLeaves();
      if (selectedLeave?._id === id) setSelectedLeave(null);
    } catch (err) {
      addToast('Error', err.message || 'Cannot cancel leave.', 'danger');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED_BY_HOD':
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'RECOMMENDED_BY_TG':
        return <Badge variant="warning">Recommended by TG</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral">Cancelled</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="primary">Pending Review</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student Leave Applications"
        description="Clearance pipeline for medical, emergency, and casual leaves."
        actions={
          <Button
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => openModal('APPLY_LEAVE')}
          >
            Apply for Leave
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: 'All Leaves', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Recommended', value: 'RECOMMENDED_BY_TG' },
          { label: 'Approved', value: 'APPROVED_BY_HOD' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={selectedLeave ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card>
            {leaves.length === 0 ? (
              <EmptyState
                title="No Leave Records Found"
                description="Apply for sanctioned leave clearance through your assigned Tutor Guardian."
                actionLabel="Apply for Leave"
                onAction={() => openModal('APPLY_LEAVE')}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type & Reason</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((l) => (
                    <TableRow key={l._id} isSelected={selectedLeave?._id === l._id}>
                      <TableCell>
                        <div className="font-extrabold text-slate-900">{l.leaveType} Leave</div>
                        <div className="text-[11px] text-slate-500 max-w-[200px] truncate">
                          {l.reason}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {l.startDate} to {l.endDate}
                      </TableCell>
                      <TableCell className="font-bold text-slate-800">
                        {l.totalDays} day{l.totalDays > 1 ? 's' : ''}
                      </TableCell>
                      <TableCell>{getStatusBadge(l.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedLeave(l)}
                            className="btn btn-outline btn-xs p-1"
                            title="View Details"
                          >
                            <Eye size={13} />
                          </button>
                          {l.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancel(l._id)}
                              className="btn btn-danger btn-xs p-1"
                              title="Cancel Application"
                            >
                              <Ban size={13} />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        {/* Selected Leave Detail Drawer */}
        {selectedLeave && (
          <div className="lg:col-span-1">
            <Card className="border-blue-200 shadow-md">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs font-bold text-blue-600 uppercase">
                    Leave Details
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 m-0 mt-0.5">
                    {selectedLeave.leaveType} Leave ({selectedLeave.totalDays}d)
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLeave(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3.5 my-4 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold">Status:</span>{' '}
                  {getStatusBadge(selectedLeave.status)}
                </div>

                <div>
                  <span className="text-slate-500 font-semibold">Date Range:</span>{' '}
                  <span className="text-slate-900 font-bold">
                    {selectedLeave.startDate} to {selectedLeave.endDate}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">Reason:</span>
                  <p className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 m-0">
                    {selectedLeave.reason}
                  </p>
                </div>

                {selectedLeave.attachments?.length > 0 && (
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">Medical Proof:</span>
                    <div className="flex flex-col gap-1.5">
                      {selectedLeave.attachments.map((att, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => viewAttachment(att.fileId, att.name)}
                          className="flex items-center justify-between p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText size={14} className="shrink-0" />
                            <span className="truncate">{att.name}</span>
                          </div>
                          <Eye size={14} className="shrink-0 text-blue-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <WorkflowTimeline
                  history={selectedLeave.history}
                  currentStatus={selectedLeave.status}
                />
              </div>

              {selectedLeave.status === 'PENDING' && (
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  icon={<Ban size={15} />}
                  onClick={() => handleCancel(selectedLeave._id)}
                >
                  Cancel Leave
                </Button>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
