import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext.jsx';
import { considerationApi } from '../../api';
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
  Sparkles,
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
      const res = await considerationApi.getHODQueue();
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

  const filteredItems = items.filter((item) => {
    const studentName = (item.student?.user?.name || '').toLowerCase();
    const roll = (item.student?.rollNumber || '').toLowerCase();
    const reason = (item.reason || '').toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch = !search || studentName.includes(q) || roll.includes(q) || reason.includes(q);
    const matchesType = typeFilter === 'ALL' || item.type === typeFilter;

    let matchesStatus = true;
    if (filterMode === 'ACTION_NEEDED') {
      matchesStatus = item.status === 'RECOMMENDED_BY_TG' || (item.status === 'PENDING' && item.escalated);
    } else if (filterMode === 'APPROVED') {
      matchesStatus = item.status === 'APPROVED_BY_HOD';
    } else if (filterMode === 'REJECTED') {
      matchesStatus = item.status === 'REJECTED';
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (item) => {
    if (item.status === 'APPROVED_BY_HOD') {
      return <Badge variant="success">Approved by HOD</Badge>;
    }
    if (item.status === 'REJECTED') {
      return <Badge variant="danger">Rejected</Badge>;
    }
    if (item.status === 'RECOMMENDED_BY_TG') {
      return <Badge variant="warning">TG Recommended</Badge>;
    }
    if (item.escalated) {
      return (
        <span className="badge badge-amber flex items-center gap-1">
          <AlertTriangle size={12} />
          Escalated to HOD
        </span>
      );
    }
    return <Badge variant="primary">{item.status}</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
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
            { id: 'ACTION_NEEDED', label: 'Action Required', count: items.filter((i) => i.status === 'RECOMMENDED_BY_TG' || (i.status === 'PENDING' && i.escalated)).length },
            { id: 'ALL', label: 'All Requests', count: items.length },
            { id: 'APPROVED', label: 'Approved', count: items.filter((i) => i.status === 'APPROVED_BY_HOD').length },
            { id: 'REJECTED', label: 'Rejected', count: items.filter((i) => i.status === 'REJECTED').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`btn btn-sm text-xs font-bold px-3 py-1.5 flex items-center gap-2 ${
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
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 flex-1 md:w-64">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs border-none p-0 focus:outline-none w-full"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select text-xs py-1.5 px-3 bg-white border-slate-200 rounded-xl"
          >
            <option value="ALL">All Types</option>
            <option value="OD">On Duty (OD)</option>
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
              <div className="p-12 text-center text-xs text-slate-400">Loading consideration requests...</div>
            ) : filteredItems.length === 0 ? (
              <EmptyState
                title="No Considerations Found"
                description={
                  filterMode === 'ACTION_NEEDED'
                    ? 'No requests currently pending your final HOD determination.'
                    : 'No requests match your current filters.'
                }
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
                    const isActionNeeded =
                      item.status === 'RECOMMENDED_BY_TG' || (item.status === 'PENDING' && item.escalated);

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
                              {item.student?.user?.name || 'Student'}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {item.student?.rollNumber || item.student?.enrollmentNumber || 'N/A'} • Sec {item.student?.section?.code || '-'}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="badge badge-indigo text-[10px] font-bold">
                            {item.type}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="font-bold text-slate-700">
                              {item.startDate === item.endDate
                                ? item.startDate
                                : `${item.startDate} to ${item.endDate}`}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {item.requestedPeriods} period{item.requestedPeriods > 1 ? 's' : ''} requested
                              {item.approvedPeriods !== undefined && (
                                <span className="text-emerald-700 font-bold ml-1">
                                  ({item.approvedPeriods} approved)
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
                                TG: {item.tgReview.decision}
                              </span>
                            ) : (
                              <span className="text-slate-400">TG Pending</span>
                            )}
                            {item.tgReview?.remarks && (
                              <span className="text-slate-500 truncate max-w-[140px]" title={item.tgReview.remarks}>
                                "{item.tgReview.remarks}"
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>{getStatusBadge(item)}</TableCell>

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
                                title="View Proof"
                              >
                                <Eye size={14} />
                              </button>
                            )}

                            {isActionNeeded && (
                              <Button
                                variant="primary"
                                onClick={() =>
                                  openModal('REVIEW_ACTION', {
                                    type: 'CONSIDERATION',
                                    role: 'HOD',
                                    item,
                                  })
                                }
                                className="btn-sm text-[11px] font-bold py-1 px-3"
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
                <h3 className="font-heading font-black text-sm text-slate-900">
                  Request Detail & Audit
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Close
                </button>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Student Details
                </span>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {selectedItem.student?.user?.name}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Roll: {selectedItem.student?.rollNumber} • Sem {selectedItem.student?.semester}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                  <span className="font-bold text-blue-700">{selectedItem.type}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Requested</span>
                  <span className="font-bold text-slate-800">{selectedItem.requestedPeriods} periods</span>
                </div>
              </div>

              <div className="text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Reason & Description
                </span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 border border-slate-100 italic leading-relaxed">
                  "{selectedItem.reason}"
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
                    className="w-full btn btn-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center justify-center gap-2 py-2"
                  >
                    <Eye size={14} />
                    View Signed Proof Document
                  </button>
                </div>
              )}

              {/* Workflow Audit Timeline */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Lifecycle Workflow
                </span>
                <WorkflowTimeline item={selectedItem} type="CONSIDERATION" />
              </div>

              {/* Action Trigger in Drawer */}
              {(selectedItem.status === 'RECOMMENDED_BY_TG' || (selectedItem.status === 'PENDING' && selectedItem.escalated)) && (
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
                    className="w-full text-xs font-bold py-2.5 shadow-sm"
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
