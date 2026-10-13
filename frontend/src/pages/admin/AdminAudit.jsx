import React, { useEffect, useState } from 'react';
import { reportApi } from '../../api';
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
  Shield,
  Activity,
  Search,
  Filter,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 25,
      };
      if (entityType) params.entityType = entityType;
      if (actionFilter) params.action = actionFilter;

      const res = await reportApi.getAudit(params);
      setLogs(res?.data?.logs || res?.data || []);
      setTotal(res?.data?.meta?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entityType, actionFilter]);

  const getActionBadge = (action) => {
    if (action.includes('APPROVE') || action === 'CREATE') {
      return <span className="badge badge-emerald text-[10px] font-bold">{action}</span>;
    }
    if (action.includes('REJECT') || action.includes('CANCEL')) {
      return <span className="badge badge-danger text-[10px] font-bold">{action}</span>;
    }
    if (action.includes('ESCALATE') || action.includes('RECOMMEND')) {
      return <span className="badge badge-amber text-[10px] font-bold">{action}</span>;
    }
    return <span className="badge badge-indigo text-[10px] font-bold">{action}</span>;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Immutable System Audit Trail"
        description="Comprehensive historical logs of all administrative determinations, status transitions, and role appointments."
        action={
          <Button variant="secondary" onClick={fetchLogs} className="text-xs font-bold">
            <RefreshCw size={13} /> Refresh Trail
          </Button>
        }
      />

      {/* Filters Bar */}
      <Card className="p-4 bg-slate-50/60 border-slate-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs">
          <div className="flex-1">
            <label className="font-bold text-slate-600 block mb-1">Entity Scope</label>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="form-select w-full bg-white border-slate-200 rounded-xl py-1.5 text-xs"
            >
              <option value="">All Entities</option>
              <option value="CONSIDERATION">Consideration Requests</option>
              <option value="LEAVE">Leave Applications</option>
              <option value="USER">User Accounts</option>
              <option value="MENTOR_GROUP">TG Mentor Groups</option>
              <option value="SECTION">Sections</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="font-bold text-slate-600 block mb-1">Action Type</label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="form-select w-full bg-white border-slate-200 rounded-xl py-1.5 text-xs"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="TG_RECOMMEND">TG_RECOMMEND</option>
              <option value="TG_REJECT">TG_REJECT</option>
              <option value="HOD_APPROVE">HOD_APPROVE</option>
              <option value="HOD_REJECT">HOD_REJECT</option>
              <option value="ADMIN_APPROVE">ADMIN_APPROVE</option>
              <option value="ADMIN_REJECT">ADMIN_REJECT</option>
              <option value="ESCALATE">ESCALATE</option>
              <option value="RESET_PASSWORD">RESET_PASSWORD</option>
            </select>
          </div>

          <div className="flex items-end">
            <span className="badge badge-slate text-xs font-bold py-2 px-3">
              {total} Log Entries
            </span>
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No Audit Records Found"
            description="No system operations match your query."
            icon={Shield}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp (IST)</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="text-right">Audit Payload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const isExpanded = expandedLogId === log._id;

                return (
                  <React.Fragment key={log._id}>
                    <TableRow className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <span className="font-mono text-xs text-slate-600 font-medium">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : '-'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-heading font-black text-xs text-slate-900">
                            {log.actor?.name || 'System / Auto'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {log.actorRole || 'SYSTEM'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>{getActionBadge(log.action)}</TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs font-mono">
                          <span className="font-bold text-slate-800">{log.entityType}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {log.entityId}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-mono text-[11px] text-slate-500">
                          {log.ipAddress || '-'}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        {log.details ? (
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                            className="btn btn-sm btn-ghost p-1.5 text-blue-600 hover:bg-blue-50 text-[11px] font-bold"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>

                    {isExpanded && log.details && (
                      <TableRow className="bg-slate-50/80">
                        <TableCell colSpan={6} className="p-3">
                          <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
