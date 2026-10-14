import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext.jsx';
import { considerationApi } from '../../api';
import {
  STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  formatDateIST,
  formatPeriods,
} from '../../utils/constants.js';
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
  FileText,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
} from 'lucide-react';
import WorkflowTimeline from '../../components/WorkflowTimeline.jsx';

export default function HodConsiderations() {
  const { openModal, viewAttachment } = useERP();

  const [filterMode, setFilterMode] = useState('ACTION_NEEDED'); // 'ACTION_NEEDED' | 'ALL' | 'APPROVED' | 'REJECTED'
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await considerationApi.getHODQueue({ all: true });
      setItems(res?.data || []);
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

  const isActionNeeded = (item) => {
    return (
      item.status === 'RECOMMENDED_BY_TG' ||
      (item.status === 'PENDING' && (item.escalated || !item.tg)) ||
      (item.tier2Reviewer && item.tier2Reviewer.status === 'PENDING')
    );
  };

  const isApproved = (item) => {
    return item.status === 'APPROVED_BY_HOD' || item.tier2Reviewer?.status === 'APPROVED';
  };

  const isRejected = (item) => {
    return (
      item.status === 'REJECTED' ||
      item.status === 'REJECTED_BY_HOD' ||
      item.tier2Reviewer?.status === 'REJECTED'
    );
  };

  const filteredItems = items.filter((item) => {
    const studentName = (item.student?.user?.name || '').toLowerCase();
    const roll = (item.student?.rollNumber || '').toLowerCase();
    const enroll = (item.student?.enrollmentNumber || '').toLowerCase();
    const reason = (item.description || item.reason || '').toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch =
      !search ||
      studentName.includes(q) ||
      roll.includes(q) ||
      enroll.includes(q) ||
      reason.includes(q);

    const itemType = item.eventType || item.type;
    const matchesType = typeFilter === 'ALL' || itemType === typeFilter;

    let matchesStatus = true;
    if (filterMode === 'ACTION_NEEDED') {
      matchesStatus = isActionNeeded(item);
    } else if (filterMode === 'APPROVED') {
      matchesStatus = isApproved(item);
    } else if (filterMode === 'REJECTED') {
      matchesStatus = isRejected(item);
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (item) => {
    if (isApproved(item)) {
      return <Badge variant="success">Approved by HOD</Badge>;
    }
    if (isRejected(item)) {
      return <Badge variant="danger">Rejected by HOD</Badge>;
    }
    if (item.status === 'RECOMMENDED_BY_TG') {
      return <Badge variant="warning">Recommended by TG</Badge>;
    }
    if (item.escalated) {
      return (
        <span className="badge badge-amber flex items-center gap-1 font-bold">
          <AlertTriangle size={12} />
          Escalated to HOD
        </span>
      );
    }
    return <Badge variant="primary">{STATUS_LABELS[item.status] || item.status}</Badge>;
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 font-sans">
      <PageHeader
        title="Attendance Consideration Approvals"
        description="Tier-2 final authorization for On-Duty (OD), Medical, and Special Activity attendance considerations."
        action={
          <Button
            variant="secondary"
            onClick={() => openModal('EXPORT_REPORTS')}
            className="text-xs"
          >
            <Download size={14} />
            Export Report
          </Button>
        }
      />

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            {
              id: 'ACTION_NEEDED',
              label: 'Action Required',
              count: items.filter(isActionNeeded).length,
            },
            { id: 'ALL', label: 'All Requests', count: items.length },
            {
              id: 'APPROVED',
              label: 'Approved',
              count: items.filter(isApproved).length,
            },
            {
              id: 'REJECTED',
              label: 'Rejected',
              count: items.filter(isRejected).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`btn btn-sm text-xs font-bold px-3.5 py-1.5 flex items-center gap-2 cursor-pointer transition-all ${
                filterMode === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  filterMode === tab.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 flex-1 md:w-64">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search student, roll or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs border-none p-0 focus:outline-none w-full text-slate-800"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select text-xs py-1.5 px-3 bg-white border-slate-200 rounded-xl font-medium cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="OD">On-Duty (OD)</option>
            <option value="MEDICAL">Medical</option>
            <option value="SPORTS">Sports</option>
            <option value="EVENT">Event</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`flex flex-col gap-4 ${selectedItem ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Loading consideration requests...
              </div>
            ) : filteredItems.length === 0 ? (
              <EmptyState
                title="No consideration requests found"
                description="No requests match the selected filters. Try changing the status or request type."
                icon={FileText}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates & Periods</TableHead>
                    <TableHead>TG Review Status</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const actionNeeded = isActionNeeded(item);
                    const itemType = item.eventType || item.type;
                    const typeLabel = REQUEST_TYPE_LABELS[itemType] || itemType || 'On-Duty (OD)';
                    const semLabel = item.student?.semester || item.student?.section?.semester
                      ? `Semester ${item.student?.semester || item.student?.section?.semester}`
                      : 'Semester 5';

                    return (
                      <TableRow
                        key={item._id}
                        className={`cursor-pointer transition-colors ${
                          selectedItem?._id === item._id ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-heading font-black text-xs text-slate-900">
                              {item.student?.user?.name || item.student?.designation || 'Student'}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {item.student?.enrollmentNumber || item.student?.rollNumber || 'Not provided'} • {semLabel} • Sec {item.student?.section?.name || item.student?.section?.code || '-'}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="badge badge-indigo text-[10px] font-bold">
                            {typeLabel}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="font-bold text-slate-700">
                              {item.startDate === item.endDate
                                ? formatDateIST(item.startDate)
                                : `${formatDateIST(item.startDate)} to ${formatDateIST(item.endDate)}`}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {formatPeriods(item.requestedPeriods)} requested
                              {item.approvedPeriods !== undefined && (
                                <span className="text-emerald-700 font-bold ml-1">
                                  ({formatPeriods(item.approvedPeriods)} approved)
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1 text-[11px]">
                            {item.escalated ? (
                              <span className="badge badge-amber text-[9px] py-0 px-1.5 w-fit font-bold">
                                48h TG Escalated
                              </span>
                            ) : item.tgReview?.decision ? (
                              <span className="badge badge-emerald text-[9px] py-0 px-1.5 w-fit font-bold">
                                TG: {STATUS_LABELS[item.tgReview.decision] || item.tgReview.decision}
                              </span>
                            ) : (
                              <span className="text-slate-400">TG Pending</span>
                            )}
                            {item.tgReview?.remarks && (
                              <span
                                className="text-slate-500 truncate max-w-[140px]"
                                title={item.tgReview.remarks}
                              >
                                "{item.tgReview.remarks}"
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>{getStatusBadge(item)}</TableCell>

                        <TableCell className="text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.documentFileId && (
                              <button
                                onClick={() =>
                                  viewAttachment({
                                    fileId: item.documentFileId,
                                    fileName: item.documentOriginalName || 'Document.pdf',
                                  })
                                }
                                className="btn btn-sm btn-ghost p-1.5 text-slate-500 hover:text-blue-600 cursor-pointer"
                                title="View Proof"
                              >
                                <Eye size={14} />
                              </button>
                            )}

                            {actionNeeded && (
                              <Button
                                variant="primary"
                                onClick={() =>
                                  openModal('REVIEW_ACTION', {
                                    type: 'CONSIDERATION',
                                    role: 'HOD',
                                    item,
                                  })
                                }
                                className="btn-sm text-[11px] font-bold py-1 px-3 cursor-pointer"
                              >
                                Review
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        {/* Selected Item Drawer / Side Panel */}
        {selectedItem && (
          <div className="lg:col-span-1">
            <Card className="p-5 flex flex-col gap-4 border-blue-200 shadow-md sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-heading font-black text-sm text-slate-900 m-0">
                  Request Detail & Timeline
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Student Details
                </span>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {selectedItem.student?.user?.name || selectedItem.student?.designation || 'Student'}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  Roll: {selectedItem.student?.enrollmentNumber || selectedItem.student?.rollNumber || 'Not provided'} • Semester {selectedItem.student?.semester || selectedItem.student?.section?.semester || 5}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                  <span className="font-bold text-blue-700">
                    {REQUEST_TYPE_LABELS[selectedItem.eventType || selectedItem.type] || selectedItem.eventType || selectedItem.type || 'On-Duty (OD)'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Requested</span>
                  <span className="font-bold text-slate-800">
                    {formatPeriods(selectedItem.requestedPeriods)}
                  </span>
                </div>
              </div>

              <div className="text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Reason / Purpose
                </span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 border border-slate-100 italic leading-relaxed m-0">
                  "{selectedItem.description || selectedItem.reason || 'Not provided'}"
                </p>
              </div>

              {selectedItem.documentFileId && (
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Supporting Document
                  </span>
                  <button
                    onClick={() =>
                      viewAttachment({
                        fileId: selectedItem.documentFileId,
                        fileName: selectedItem.documentOriginalName || 'Document.pdf',
                      })
                    }
                    className="w-full btn btn-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center justify-center gap-2 py-2 cursor-pointer"
                  >
                    <Eye size={14} />
                    View Signed Proof Document
                  </button>
                </div>
              )}

              {/* Workflow Audit Timeline */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Approval Timeline
                </span>
                <WorkflowTimeline item={selectedItem} type="CONSIDERATION" />
              </div>

              {/* Action Trigger in Drawer */}
              {isActionNeeded(selectedItem) && (
                <div className="pt-3 border-t border-slate-100">
                  <Button
                    variant="primary"
                    onClick={() =>
                      openModal('REVIEW_ACTION', {
                        type: 'CONSIDERATION',
                        role: 'HOD',
                        item: selectedItem,
                      })
                    }
                    className="w-full text-xs font-bold py-2.5 shadow-sm cursor-pointer"
                  >
                    Authorize / Final Review
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
