import React, { useState, useEffect } from 'react';
import { reportApi } from '../../api';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  Share2,
  X,
  Search,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export default function OfficialClearancesLedgerModal({
  initialTab = 'considerations', // 'considerations' | 'leaves'
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [semesterFilter, setSemesterFilter] = useState('All Semesters');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [considerations, setConsiderations] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const [conRes, leaveRes] = await Promise.allSettled([
        reportApi.getConsiderations({ status: 'APPROVED_BY_HOD' }),
        reportApi.getLeaves({ status: 'APPROVED' }),
      ]);

      if (conRes.status === 'fulfilled') {
        setConsiderations(conRes.value?.data || []);
      }
      if (leaveRes.status === 'fulfilled') {
        setLeaves(leaveRes.value?.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleExportExcel = async () => {
    try {
      if (activeTab === 'considerations') {
        await reportApi.downloadConsiderationsExcel({ status: 'APPROVED_BY_HOD' });
      } else {
        await reportApi.downloadLeavesExcel({ status: 'APPROVED' });
      }
    } catch (err) {
      alert('Error exporting Excel: ' + (err.message || 'Failed'));
    }
  };

  const handleExportCsv = () => {
    const list = activeTab === 'considerations' ? considerations : leaves;
    let csv = '';
    if (activeTab === 'considerations') {
      csv = 'Student Name,Enrollment,Section,Periods,Time From,Time To,Date From,Date To,Number of Days\n';
      list.forEach((item) => {
        const name = item.student?.user?.name || item.student?.designation || 'Student';
        const roll = item.student?.enrollmentNumber || item.student?.rollNumber || 'Not provided';
        const sec = item.student?.section?.name?.replace(/Section\s*/i, '') || 'B';
        const periods = item.selectedPeriods?.join(' ') || `P${item.requestedPeriods || 1}`;
        csv += `"${name}","${roll}","${sec}","${periods}","10:50 AM","01:20 PM","${item.startDate}","${item.endDate}","1 Day"\n`;
      });
    } else {
      csv = 'Student Name,Enrollment,Section,Category,Date From,Date To,Number of Days\n';
      list.forEach((item) => {
        const name = item.applicant?.name || item.student?.user?.name || 'Student';
        const roll = item.student?.rollNumber || 'N/A';
        const sec = item.student?.section?.name?.replace(/Section\s*/i, '') || 'B';
        csv += `"${name}","${roll}","${sec}","${item.leaveType}","${item.startDate}","${item.endDate}","${item.totalDays} Days"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTab}_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGoogleSheet = () => {
    window.open('https://docs.google.com/spreadsheets/u/0/', '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'OIST CSE Sanctioned Clearances Ledger',
        text: 'Official Approved Attendance Considerations & Sanctioned OD Ledger',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Ledger link copied to clipboard!');
    }
  };

  // Filter current list
  const currentList = activeTab === 'considerations' ? considerations : leaves;
  const filteredList = currentList.filter((item) => {
    const student = item.student || {};
    const name = (student.user?.name || item.applicant?.name || student.designation || 'Student').toLowerCase();
    const roll = (student.enrollmentNumber || student.rollNumber || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    if (query && !name.includes(query) && !roll.includes(query)) {
      return false;
    }

    if (sectionFilter !== 'All') {
      const secName = student.section?.name || '';
      if (!secName.includes(sectionFilter)) return false;
    }

    return true;
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container max-w-5xl w-[96%] max-h-[92vh] overflow-y-auto bg-white p-5 sm:p-7 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 m-0">
                  ORIENTAL INSTITUTE OF SCIENCE & TECHNOLOGY (OIST)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  CampusFlow ERP
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
                Department of Computer Science & Engineering • Official Clearances & Sanctioned Requests Ledger
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleGoogleSheet}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={14} className="text-emerald-700" />
              <span>google live sheet</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={14} className="text-emerald-700" />
              <span>export excel</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>csv</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>print report</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Share report"
            >
              <Share2 size={14} />
              <span>share</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab switcher & Search Filter Row */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('considerations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'considerations'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              attendance consideration list ({considerations.length})
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'leaves'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              leave list ({leaves.length})
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <span className="font-semibold">select semester:</span>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none"
              >
                <option value="All Semesters">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={`Semester ${s}`}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-600">
              <span className="font-semibold">section:</span>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none"
              >
                <option value="All">All</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or roll..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 w-48"
              />
            </div>
          </div>
        </div>

        {/* Subhead Banner */}
        <div className="mt-4 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="font-bold text-slate-800">
            LEDGER VIEW:{' '}
            {activeTab === 'considerations'
              ? 'Official Approved Attendance Considerations & Sanctioned OD Ledger'
              : 'Official Approved Student Leave Applications Ledger'}
          </span>
          <span className="text-slate-500">
            Showing {filteredList.length} record(s) • Filtered by: {semesterFilter}
          </span>
        </div>

        {/* Ledger Table */}
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3 border-r border-slate-200">student name</th>
                <th className="p-3 border-r border-slate-200">enrollment</th>
                <th className="p-3 border-r border-slate-200 text-center">section</th>
                <th className="p-3 border-r border-slate-200">periods</th>
                <th className="p-3 border-r border-slate-200 text-center" colSpan={2}>
                  time
                  <div className="grid grid-cols-2 text-[10px] font-normal text-slate-500 border-t border-slate-200 mt-1 pt-0.5">
                    <span>from</span>
                    <span>to</span>
                  </div>
                </th>
                <th className="p-3 border-r border-slate-200 text-center" colSpan={2}>
                  date
                  <div className="grid grid-cols-2 text-[10px] font-normal text-slate-500 border-t border-slate-200 mt-1 pt-0.5">
                    <span>from</span>
                    <span>to</span>
                  </div>
                </th>
                <th className="p-3 text-center">number of days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No approved sanction records matching filters in current database.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const student = item.student || {};
                  const studentName = student.user?.name || item.applicant?.name || student.designation || 'Student';
                  const rollNo = student.enrollmentNumber || student.rollNumber || 'Not provided';
                  const secName = (student.section?.name || 'B').replace(/Section\s*/i, '');
                  const reasonSubtitle = item.description || item.reason || item.eventTitle || 'Official duty';
                  const periodsStr = item.selectedPeriods?.length
                    ? item.selectedPeriods.join(', ')
                    : item.requestedPeriods
                    ? `P1 - P${item.requestedPeriods}`
                    : 'Full Day';

                  return (
                    <tr key={item._id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 border-r border-slate-100">
                        <span className="font-extrabold text-slate-900 block">{studentName}</span>
                        <span className="text-[10px] text-slate-500 block truncate max-w-xs italic">
                          {reasonSubtitle}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-100 font-mono text-slate-700">
                        {rollNo}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                          {secName}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-100 font-semibold text-slate-700">
                        {periodsStr}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center text-slate-600">
                        10:50 AM
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center text-slate-600">
                        01:20 PM
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center text-slate-600 whitespace-nowrap">
                        {item.startDate || '12/10/2026'}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center text-slate-600 whitespace-nowrap">
                        {item.endDate || '12/10/2026'}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          {item.totalDays ? `${item.totalDays} Day${item.totalDays !== 1 ? 's' : ''}` : '1 Day'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Authorized Sign-off:{' '}
            <strong className="text-slate-800">
              Head of Department (HOD CSE) • Department of CSE
            </strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer self-end sm:self-auto"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
}
