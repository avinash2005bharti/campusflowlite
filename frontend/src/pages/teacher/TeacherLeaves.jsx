import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext.jsx';
import { leaveApi } from '../../api';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
} from '../../components/common';
import {
  Calendar,
  Plus,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import WorkflowTimeline from '../../components/WorkflowTimeline.jsx';

export default function TeacherLeaves() {
  const { openModal, addToast, viewAttachment } = useERP();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await leaveApi.getMine();
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
  }, []);

  const handleCancel = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) return;

    try {
      await leaveApi.cancel(leaveId);
      addToast({
        type: 'success',
        title: 'Leave Cancelled',
        message: 'Your leave application was cancelled successfully.',
      });
      fetchLeaves();
    } catch (err) {
      addToast({
        type: 'danger',
        title: 'Cancellation Failed',
        message: err.message,
      });
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    if (statusFilter === 'ALL') return true;
    return l.status === statusFilter;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Faculty Leave Management"
        description="Submit personal absence applications and track HOD administrative reviews."
        action={
          <Button
            variant="primary"
            onClick={() => openModal('APPLY_LEAVE')}
            className="text-xs font-black shadow-xs"
          >
            <Plus size={15} />
            Apply for Leave
          </Button>
        }
      />

      {/* Status Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'ALL', label: 'All Leaves' },
          { id: 'PENDING', label: 'Pending Approval' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'REJECTED', label: 'Rejected' },
          { id: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`btn btn-sm text-xs font-bold px-3.5 py-1.5 ${
              statusFilter === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`flex flex-col gap-4 ${selectedLeave ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading leave records...</div>
            ) : filteredLeaves.length === 0 ? (
              <EmptyState
                title="No Leave Records"
                description="No personal leaves match your current filter."
                icon={Calendar}
                action={
                  <Button variant="primary" onClick={() => openModal('APPLY_LEAVE')} className="text-xs">
                    <Plus size={14} />
                    Apply Now
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates & Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HOD Determination</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaves.map((item) => (
                    <TableRow
                      key={item._id}
                      className={`cursor-pointer transition-colors ${
                        selectedLeave?._id === item._id ? 'bg-amber-50/50' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedLeave(item)}
                    >
                      <TableCell>
                        <span className="badge badge-indigo text-[10px] font-bold">
                          {item.leaveType}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-slate-800">
                            {item.startDate === item.endDate
                              ? item.startDate
                              : `${item.startDate} to ${item.endDate}`}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {item.totalDays} day{item.totalDays > 1 ? 's' : ''}
                          </span>
                        </div>
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
                              : item.status === 'CANCELLED'
                              ? 'badge-slate'
                              : 'badge-primary'
                          }`}
                        >
                          {item.status}
                        </span>
                      </TableCell>

                      <TableCell>
                        {item.finalReview?.remarks ? (
                          <span className="text-xs text-slate-600 italic">
                            "{item.finalReview.remarks}"
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Awaiting HOD</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {item.documentFileId && (
                            <button
                              onClick={() =>
                                viewAttachment({
                                  fileId: item.documentFileId,
                                  fileName: item.documentOriginalName || 'Document.pdf',
                                })
                              }
                              className="btn btn-sm btn-ghost p-1.5 text-slate-500 hover:text-blue-600"
                              title="View Document"
                            >
                              <Eye size={14} />
                            </button>
                          )}

                          {item.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancel(item._id)}
                              className="btn btn-sm btn-ghost p-1.5 text-rose-500 hover:bg-rose-50"
                              title="Cancel Request"
                            >
                              <Trash2 size={14} />
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
            <Card className="p-5 flex flex-col gap-4 border-amber-200 shadow-md sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-heading font-black text-sm text-slate-900">
                  Leave Application Detail
                </h3>
                <button
                  onClick={() => setSelectedLeave(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                  <span className="font-bold text-amber-700">{selectedLeave.leaveType}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Duration</span>
                  <span className="font-bold text-slate-800">{selectedLeave.totalDays} day(s)</span>
                </div>
              </div>

              <div className="text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Reason for Leave
                </span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 border border-slate-100 italic leading-relaxed">
                  "{selectedLeave.reason}"
                </p>
              </div>

              {selectedLeave.documentFileId && (
                <button
                  onClick={() =>
                    viewAttachment({
                      fileId: selectedLeave.documentFileId,
                      fileName: selectedLeave.documentOriginalName || 'Document.pdf',
                    })
                  }
                  className="w-full btn btn-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center justify-center gap-2 py-2"
                >
                  <Eye size={14} />
                  View Uploaded Proof
                </button>
              )}

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Workflow Lifecycle
                </span>
                <WorkflowTimeline item={selectedLeave} type="LEAVE" />
              </div>

              {selectedLeave.status === 'PENDING' && (
                <div className="pt-3 border-t border-slate-100">
                  <Button
                    variant="danger"
                    onClick={() => handleCancel(selectedLeave._id)}
                    className="w-full text-xs font-bold py-2"
                  >
                    Cancel Application
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
