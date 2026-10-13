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
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  FileText,
  Search,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function HodReports() {
  const [activeTab, setActiveTab] = useState('considerations'); // 'considerations' | 'leaves'
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (type) params.type = type;
      if (from) params.from = from;
      if (to) params.to = to;

      if (activeTab === 'considerations') {
        const res = await reportApi.getConsiderations(params);
        setData(res?.data?.requests || res?.data || []);
      } else {
        const res = await reportApi.getLeaves(params);
        setData(res?.data?.leaves || res?.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, status, type, from, to]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (type) params.type = type;
      if (from) params.from = from;
      if (to) params.to = to;

      if (activeTab === 'considerations') {
        await reportApi.downloadConsiderationsExcel(params);
      } else {
        await reportApi.downloadLeavesExcel(params);
      }
    } catch (err) {
      alert('Export failed: ' + (err.message || 'Error'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Department Academic Reports"
        description="Audit-grade attendance consideration and leave reports with real-time Excel spreadsheet export."
        action={
          <Button
            variant="success"
            onClick={handleExport}
            disabled={exporting}
            className="text-xs font-black shadow-xs"
          >
            <Download size={15} />
            {exporting ? 'Generating XLSX...' : 'Download Excel (.xlsx)'}
          </Button>
        }
      />

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => {
            setActiveTab('considerations');
            setStatus('');
            setType('');
          }}
          className={`btn btn-sm text-xs font-bold px-4 py-2 flex items-center gap-2 ${
            activeTab === 'considerations'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <FileText size={15} />
          Attendance Considerations (OD)
        </button>

        <button
          onClick={() => {
            setActiveTab('leaves');
            setStatus('');
            setType('');
          }}
          className={`btn btn-sm text-xs font-bold px-4 py-2 flex items-center gap-2 ${
            activeTab === 'leaves'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Calendar size={15} />
          Leave Applications
        </button>
      </div>

      {/* Filter Controls Panel */}
      <Card className="p-4 bg-slate-50/70 border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-600 block mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-select w-full bg-white border-slate-200 rounded-xl py-1.5 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED_BY_HOD">Approved by HOD</option>
              <option value="APPROVED">Approved</option>
              <option value="RECOMMENDED_BY_TG">Recommended by TG</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">
              {activeTab === 'considerations' ? 'Consideration Type' : 'Leave Type'}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="form-select w-full bg-white border-slate-200 rounded-xl py-1.5 text-xs"
            >
              <option value="">All Types</option>
              {activeTab === 'considerations' ? (
                <>
                  <option value="OD">On Duty (OD)</option>
                  <option value="MEDICAL">Medical</option>
                  <option value="SPORTS">Sports</option>
                  <option value="EVENT">Event</option>
                  <option value="OTHER">Other</option>
                </>
              ) : (
                <>
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="ACADEMIC">Academic Leave</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                  <option value="DUTY">Duty Leave</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">From Date</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input-field w-full text-xs py-1"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">To Date</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input-field w-full text-xs py-1"
            />
          </div>
        </div>
      </Card>

      {/* Report Records Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <h3 className="font-heading font-black text-xs text-slate-800">
              Report Data Records ({data.length})
            </h3>
          </div>
          <button
            onClick={fetchData}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading report records...</div>
        ) : data.length === 0 ? (
          <EmptyState
            title="No Records Found"
            description="No entries match your selected report parameters."
            icon={FileSpreadsheet}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{activeTab === 'considerations' ? 'Student' : 'Applicant'}</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>{activeTab === 'considerations' ? 'Periods' : 'Days'}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-heading font-black text-xs text-slate-900">
                        {activeTab === 'considerations'
                          ? row.student?.user?.name || row.student?.rollNumber
                          : row.applicant?.name || 'Applicant'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {activeTab === 'considerations'
                          ? row.student?.rollNumber || row.student?.enrollmentNumber
                          : row.applicantRole}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="badge badge-indigo text-[10px] font-bold">
                      {row.type || row.leaveType}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-medium text-slate-700">
                      {row.startDate === row.endDate
                        ? row.startDate
                        : `${row.startDate} to ${row.endDate}`}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-bold text-slate-800">
                      {activeTab === 'considerations'
                        ? `${row.requestedPeriods} req${row.approvedPeriods !== undefined ? ` / ${row.approvedPeriods} app` : ''}`
                        : `${row.totalDays} day(s)`}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`badge text-[10px] font-bold ${
                        row.status?.includes('APPROVED')
                          ? 'badge-emerald'
                          : row.status === 'REJECTED'
                          ? 'badge-danger'
                          : 'badge-amber'
                      }`}
                    >
                      {row.status}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-600 truncate max-w-[200px] block" title={row.reason}>
                      {row.reason}
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
