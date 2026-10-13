import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext.jsx';
import { considerationApi } from '../../api';
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
import { FileText, Plus, Eye, Ban, Calendar, Clock, AlertCircle } from 'lucide-react';
import WorkflowTimeline from '../../components/WorkflowTimeline.jsx';

export default function StudentConsiderations() {
  const { openModal, viewAttachment, addToast } = useERP();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await considerationApi.getMine(params);
      setRequests(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const handleRefresh = () => fetchRequests();
    window.addEventListener('campusflow_refresh_considerations', handleRefresh);
    return () => {
      window.removeEventListener('campusflow_refresh_considerations', handleRefresh);
    };
  }, [statusFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this pending consideration request?')) return;
    try {
      await considerationApi.cancel(id);
      addToast('Cancelled', 'Consideration request has been cancelled.', 'info');
      fetchRequests();
      if (selectedRequest?._id === id) setSelectedRequest(null);
    } catch (err) {
      addToast('Error', err.message || 'Cannot cancel request.', 'danger');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED_BY_HOD':
        return <Badge variant="success">Approved by HOD</Badge>;
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
        title="Attendance Consideration (OD) Requests"
        description="Official duty attendance waiver applications for hackathons, sports, and department activities."
        actions={
          <Button
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => openModal('REQUEST_CONSIDERATION')}
          >
            New Request
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: 'All Requests', value: '' },
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
        {/* Table / List View */}
        <div className={selectedRequest ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card>
            {requests.length === 0 ? (
              <EmptyState
                title="No Consideration Requests Found"
                description="Apply for an official attendance credit when participating in events."
                actionLabel="Submit Consideration"
                onAction={() => openModal('REQUEST_CONSIDERATION')}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event & Category</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Periods</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow
                      key={r._id}
                      isSelected={selectedRequest?._id === r._id}
                    >
                      <TableCell>
                        <div className="font-extrabold text-slate-900">{r.eventTitle}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {r.eventType} • {r.organizer || 'Autonomous'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {r.startDate} {r.endDate !== r.startDate ? `to ${r.endDate}` : ''}
                      </TableCell>
                      <TableCell className="font-bold text-slate-800">
                        {r.requestedPeriods}
                        {r.hodReview?.approvedPeriods && (
                          <span className="text-emerald-700 block text-[11px]">
                            Approved: {r.hodReview.approvedPeriods}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedRequest(r)}
                            className="btn btn-outline btn-xs p-1"
                            title="View Audit Stepper"
                          >
                            <Eye size={13} />
                          </button>
                          {r.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancel(r._id)}
                              className="btn btn-danger btn-xs p-1"
                              title="Cancel Request"
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

        {/* Selected Request Detail Drawer */}
        {selectedRequest && (
          <div className="lg:col-span-1">
            <Card className="border-blue-200 shadow-md">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs font-bold text-blue-600 uppercase">
                    Request Details
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 m-0 mt-0.5">
                    {selectedRequest.eventTitle}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3.5 my-4 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold">Status:</span>{' '}
                  {getStatusBadge(selectedRequest.status)}
                </div>

                <div>
                  <span className="text-slate-500 font-semibold">Duration:</span>{' '}
                  <span className="text-slate-900 font-bold">
                    {selectedRequest.startDate} to {selectedRequest.endDate}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold">Periods Requested:</span>{' '}
                  <span className="text-slate-900 font-bold">
                    {selectedRequest.requestedPeriods}
                  </span>
                </div>

                {selectedRequest.description && (
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Narrative:</span>
                    <p className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 m-0">
                      {selectedRequest.description}
                    </p>
                  </div>
                )}

                {/* Attachments */}
                {selectedRequest.attachments?.length > 0 && (
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">Attached Documents:</span>
                    <div className="flex flex-col gap-1.5">
                      {selectedRequest.attachments.map((att, i) => (
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

                {/* Workflow Stepper */}
                <WorkflowTimeline
                  history={selectedRequest.history}
                  currentStatus={selectedRequest.status}
                />
              </div>

              {selectedRequest.status === 'PENDING' && (
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  icon={<Ban size={15} />}
                  onClick={() => handleCancel(selectedRequest._id)}
                >
                  Cancel Request
                </Button>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
