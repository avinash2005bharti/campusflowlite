import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext.jsx';
import { considerationApi, leaveApi } from '../../api';
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
import { CheckSquare, Calendar, FileText, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';
import WorkflowTimeline from '../../components/WorkflowTimeline.jsx';

export default function TgRequests() {
  const { openModal, viewAttachment } = useERP();

  const [activeTab, setActiveTab] = useState('considerations'); // 'considerations' | 'leaves'
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const [considerations, setConsiderations] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { status: statusFilter };
      if (activeTab === 'considerations') {
        const res = await considerationApi.getTGQueue(params);
        setConsiderations(res?.data || []);
      } else {
        const res = await leaveApi.getTGQueue(params);
        setLeaves(res?.data || []);
      }
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
  }, [activeTab, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED_BY_HOD':
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'RECOMMENDED_BY_TG':
        return <Badge variant="warning">Recommended by TG</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="primary">Pending Review</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="TG Review Queue"
        description="Tier-1 evaluation of attendance considerations and leave applications for your mentee cohort."
      />

      {/* Main Mode Tabs & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('considerations');
              setSelectedItem(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'considerations'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText size={15} />
            <span>Considerations (OD)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('leaves');
              setSelectedItem(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'leaves'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Calendar size={15} />
            <span>Leave Applications</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['PENDING', 'RECOMMENDED_BY_TG', 'REJECTED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st === 'ALL' ? '' : st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === (st === 'ALL' ? '' : st)
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'All' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* List & Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={selectedItem ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card>
            {activeTab === 'considerations' ? (
              considerations.length === 0 ? (
                <EmptyState
                  title="No Consideration Items in Queue"
                  description="All mentee consideration requests have been evaluated."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mentee Student</TableHead>
                      <TableHead>Event & Category</TableHead>
                      <TableHead>Periods</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {considerations.map((r) => (
                      <TableRow key={r._id} isSelected={selectedItem?._id === r._id}>
                        <TableCell>
                          <div className="font-extrabold text-slate-900">{r.student?.user?.name}</div>
                          <div className="text-[11px] text-slate-500">
                            Roll: {r.student?.rollNumber} • {r.student?.section?.code}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-900">{r.eventTitle}</div>
                          <div className="text-[11px] text-slate-500">
                            {r.eventType} • {r.startDate}
                          </div>
                        </TableCell>
                        <TableCell className="font-extrabold text-slate-900">
                          {r.requestedPeriods}
                        </TableCell>
                        <TableCell>{getStatusBadge(r.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedItem(r)}
                              className="btn btn-outline btn-xs p-1"
                              title="Details"
                            >
                              <Eye size={13} />
                            </button>
                            {r.status === 'PENDING' && (
                              <Button
                                size="xs"
                                variant="primary"
                                onClick={() =>
                                  openModal('REVIEW_ACTION', {
                                    type: 'CONSIDERATION',
                                    role: 'TG',
                                    item: r,
                                  })
                                }
                              >
                                Review
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            ) : leaves.length === 0 ? (
              <EmptyState
                title="No Leave Applications in Queue"
                description="No mentee leave requests currently awaiting TG review."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentee Student</TableHead>
                    <TableHead>Category & Reason</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((l) => (
                    <TableRow key={l._id} isSelected={selectedItem?._id === l._id}>
                      <TableCell>
                        <div className="font-extrabold text-slate-900">{l.student?.user?.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Roll: {l.student?.rollNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900">{l.leaveType} ({l.totalDays}d)</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{l.reason}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {l.startDate} to {l.endDate}
                      </TableCell>
                      <TableCell>{getStatusBadge(l.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedItem(l)}
                            className="btn btn-outline btn-xs p-1"
                            title="Details"
                          >
                            <Eye size={13} />
                          </button>
                          {l.status === 'PENDING' && (
                            <Button
                              size="xs"
                              variant="primary"
                              onClick={() =>
                                openModal('REVIEW_ACTION', {
                                  type: 'LEAVE',
                                  role: 'TG',
                                  item: l,
                                })
                              }
                            >
                              Review
                            </Button>
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

        {/* Selected Item Drawer */}
        {selectedItem && (
          <div className="lg:col-span-1">
            <Card className="border-amber-200 shadow-md">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs font-bold text-amber-700 uppercase">
                    Mentee Application
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 m-0 mt-0.5">
                    {selectedItem.eventTitle || `${selectedItem.leaveType} Leave`}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3 my-4 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold">Student:</span>{' '}
                  <span className="text-slate-900 font-extrabold">
                    {selectedItem.student?.user?.name} (Roll: {selectedItem.student?.rollNumber})
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold">Status:</span>{' '}
                  {getStatusBadge(selectedItem.status)}
                </div>

                {selectedItem.description && (
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Justification:</span>
                    <p className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 m-0">
                      {selectedItem.description}
                    </p>
                  </div>
                )}

                {selectedItem.reason && (
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Reason:</span>
                    <p className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 m-0">
                      {selectedItem.reason}
                    </p>
                  </div>
                )}

                {selectedItem.attachments?.length > 0 && (
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">Attached Proof:</span>
                    <div className="flex flex-col gap-1.5">
                      {selectedItem.attachments.map((att, i) => (
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
                  history={selectedItem.history}
                  currentStatus={selectedItem.status}
                />
              </div>

              {selectedItem.status === 'PENDING' && (
                <Button
                  size="sm"
                  fullWidth
                  variant="primary"
                  onClick={() =>
                    openModal('REVIEW_ACTION', {
                      type: activeTab === 'considerations' ? 'CONSIDERATION' : 'LEAVE',
                      role: 'TG',
                      item: selectedItem,
                    })
                  }
                >
                  Conduct TG Review
                </Button>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
