import React, { useState } from 'react';
import { reportApi } from '../../api';
import { X, FileSpreadsheet, Download, Filter } from 'lucide-react';
import { Button, FormField, Select, Input } from '../common';

export default function AttendanceLeaveReportsModal({ onClose }) {
  const [reportType, setReportType] = useState('considerations'); // 'considerations' | 'leaves'
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const params = {};
    if (status) params.status = status;
    if (from) params.from = from;
    if (to) params.to = to;

    setDownloading(true);
    try {
      if (reportType === 'considerations') {
        await reportApi.downloadConsiderationsExcel(params);
      } else {
        await reportApi.downloadLeavesExcel(params);
      }
      onClose();
    } catch (err) {
      alert('Failed to generate export file: ' + (err.message || 'Error'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container max-w-md w-[95%]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 className="modal-title">Export Academic Reports</h3>
              <p className="modal-subtitle">Download filtered records in Excel (.xlsx) format</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 mt-2">
          <FormField label="Report Scope">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReportType('considerations')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  reportType === 'considerations'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Considerations (OD)
              </button>
              <button
                type="button"
                onClick={() => setReportType('leaves')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  reportType === 'leaves'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Leave Applications
              </button>
            </div>
          </FormField>

          <FormField label="Filter by Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending Review' },
                { value: 'RECOMMENDED_BY_TG', label: 'Recommended by TG' },
                { value: 'APPROVED_BY_HOD', label: 'Approved by HOD' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="From Date">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </FormField>

            <FormField label="To Date">
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </FormField>
          </div>

          <div className="modal-footer mt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              icon={<Download size={15} />}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Generating XLSX...' : 'Export Excel File'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
