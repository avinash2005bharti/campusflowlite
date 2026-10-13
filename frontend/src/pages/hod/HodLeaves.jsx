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
  Search,
  Users,
  UserCheck,
  Eye,
  AlertTriangle,
  Download,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import WorkflowTimeline from '../../components/WorkflowTimeline.jsx';

export default function HodLeaves() {
  const { openModal, viewAttachment } = useERP();

  const [activeRoleTab, setActiveRoleTab] = useState('ALL'); // 'ALL' | 'STUDENT' | 'TEACHER'
  const [filterMode, setFilterMode] = useState('ACTION_NEEDED'); // 'ACTION_NEEDED' | 'ALL' | 'APPROVED' | 'REJECTED'
  const [search, setSearch] = useState('');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await leaveApi.getHODQueue();
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
    const applicantName = (item.applicant?.name || '').toLowerCase();
    const reason = (item.reason || '').toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch = !search || applicantName.includes(q) || reason.includes(q);
    const matchesRole = activeRoleTab === 'ALL' || item.applicantRole === activeRoleTab;

    let matchesStatus = true;
    if (filterMode === 'ACTION_NEEDED') {
      if (item.applicantRole === 'STUDENT') {
        matchesStatus = item.status === 'RECOMMENDED_BY_TG' || (item.status === 'PENDING' && item.escalated);
      } else {
        matchesStatus = item.status === 'PENDING';
      }
    } else if (filterMode === 'APPROVED') {
      matchesStatus = item.status === 'APPROVED_BY_HOD' || item.status === 'APPROVED';
    } else if (filterMode === 'REJECTED') {
      matchesStatus = item.status === 'REJECTED';
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (item) => {
    if (item.status === 'APPROVED_BY_HOD' || item.status === 'APPROVED') {
      return <Badge variant="success">Approved</Badge>;
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
    return <Badge variant="primary">Pending Review</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Leave Approvals Central"
        description="Review student leaves (Tier-2 after TG recommendation) and direct faculty leave requests."
        action={
          <Button
            variant="secondary"
            onClick={() => openModal('EXPORT_REPORTS')}
            className="text-xs"
          >
            <Download size={14} />
            Export Leaves
          </Button>
        }
      />

      {/* Role Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveRoleTab('ALL')}
            className={`btn btn-sm text-xs font-bold px-3.5 py-1.5 ${
              activeRoleTab === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All Applicants ({items.length})
          </button>
          <button
            onClick={() => setActiveRoleTab('STUDENT')}
            className={`btn btn-sm text-xs font-bold px-3.5 py-1.5 flex items-center gap-1.5 ${
              activeRoleTab === 'STUDENT'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Users size={14} />
            Students ({items.filter((i) => i.applicantRole === 'STUDENT').length})
          </button>
          <button
            onClick={() => setActiveRoleTab('TEACHER')}
            className={`btn btn-sm text-xs font-bold px-3.5 py-1.5 flex items-center gap-1.5 ${
              activeRoleTab === 'TEACHER'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <UserCheck size={14} />
            Faculty ({items.filter((i) => i.applicantRole === 'TEACHER').length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 flex-1 sm:w-64">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search applicant name, reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs border-none p-0 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs">
            {['ACTION_NEEDED', 'ALL', 'APPROVED', 'REJECTED'].map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  filterMode === mode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                {mode === 'ACTION_NEEDED' ? 'Pending' : mode.charAt(0) + mode.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`flex flex-col gap-4 ${selectedItem ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading leave requests...</div>
            ) : filteredItems.length === 0 ? (
              <EmptyState
                title="No Leaves Found"
                description="No leave applications match your selection."
                icon={Calendar}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Dates & Duration</TableHead>
                    <TableHead>TG Review / Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const isActionNeeded =
                      item.applicantRole === 'STUDENT'
                        ? item.status === 'RECOMMENDED_BY_TG' || (item.status === 'PENDING' && item.escalated)
                        : item.status === 'PENDING';

                    return (
                      <TableRow
                        key={item._id}
                        className={`cursor-pointer transition-colors ${
                          selectedItem?._id === item._id ? 'bg-amber-50/50' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-heading font-black text-xs text-slate-900">
                              {item.applicant?.name || 'Applicant'}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate max-w-[160px]">
                              {item.applicant?.email}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`badge text-[10px] font-bold ${
                              item.applicantRole === 'TEACHER' ? 'badge-indigo' : 'badge-slate'
                            }`}
                          >
                            {item.applicantRole}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="badge badge-amber text-[10px] font-bold">
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
                                variant="warning"
                                onClick={() =>
                                  openModal('REVIEW_ACTION', {
                                    type: 'LEAVE',
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

        {/* Selected Item Drawer */}
        {selectedItem && (
          <div className="lg:col-span-1">
            <Card className="p-5 flex flex-col gap-4 border-amber-200 shadow-md sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-heading font-black text-sm text-slate-900">
                  Leave Details
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
                  Applicant
                </span>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {selectedItem.applicant?.name}
                </div>
                <div className="text-xs text-slate-500">
                  {selectedItem.applicantRole} • {selectedItem.applicant?.email}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                  <span className="font-bold text-amber-700">{selectedItem.leaveType}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Duration</span>
                  <span className="font-bold text-slate-800">{selectedItem.totalDays} day(s)</span>
                </div>
              </div>

              <div className="text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Reason
                </span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 border border-slate-100 italic leading-relaxed">
                  "{selectedItem.reason}"
                </p>
              </div>

              {selectedItem.documentFileId && (
                <div className="pt-1">
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
                    View Proof Attachment
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Workflow Trail
                </span>
                <WorkflowTimeline item={selectedItem} type="LEAVE" />
              </div>

              {(selectedItem.applicantRole === 'STUDENT'
                ? selectedItem.status === 'RECOMMENDED_BY_TG' || (selectedItem.status === 'PENDING' && selectedItem.escalated)
                : selectedItem.status === 'PENDING') && (
                <div className="pt-3 border-t border-slate-100">
                  <Button
                    variant="warning"
                    onClick={() =>
                      openModal('REVIEW_ACTION', {
                        type: 'LEAVE',
                        role: 'HOD',
                        item: selectedItem,
                      })
                    }
                    className="w-full text-xs font-bold py-2.5 shadow-sm"
                  >
                    Approve / Determine Leave
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
