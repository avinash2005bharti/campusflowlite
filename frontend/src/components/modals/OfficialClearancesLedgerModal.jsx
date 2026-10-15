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
  Calendar,
} from 'lucide-react';

export default function OfficialClearancesLedgerModal({
  initialTab = 'considerations', // 'considerations' | 'leaves'
  onClose,
  isTgView = false,
  assignedSemester = null,
  assignedSection = null,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [semesterFilter, setSemesterFilter] = useState(
    isTgView && assignedSemester ? `Semester ${assignedSemester}` : 'All Semesters'
  );
  const [sectionFilter, setSectionFilter] = useState(
    isTgView && assignedSection
      ? String(assignedSection).replace(/^Section\s*/i, '').replace(/^CSE-/i, '').trim()
      : 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const [considerations, setConsiderations] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Image 3: Print Semester Selection Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [targetPrintSemester, setTargetPrintSemester] = useState(
    isTgView && assignedSemester
      ? `Semester ${assignedSemester}`
      : 'All Semesters (Comprehensive Ledger)'
  );

  const defaultConsiderations = [
    {
      _id: 'c1',
      student: { user: { name: 'Avinash Bharti' }, enrollmentNumber: '0105CS241101', section: { name: 'Section B', semester: 5 } },
      eventTitle: 'Hackathon / Technical Competition',
      description: 'Selected for State Level Innovation Sprint finals',
      selectedPeriods: ['P2', 'P3', 'P4'],
      timeFrom: '10:50 AM',
      timeTo: '01:20 PM',
      startDate: '12/10/2026',
      endDate: '12/10/2026',
      totalDays: 1,
      status: 'PENDING',
    },
    {
      _id: 'c2',
      student: { user: { name: 'Avinash Bharti' }, enrollmentNumber: '0105CS241102', section: { name: 'Section B', semester: 5 } },
      eventTitle: 'Hackathon / Technical Competition',
      description: 'Participated in Regional Round of National Technical Hackathon',
      selectedPeriods: ['P3', 'P4'],
      timeFrom: '10:50 AM',
      timeTo: '01:20 PM',
      startDate: '12/10/2026',
      endDate: '12/10/2026',
      totalDays: 1,
      status: 'APPROVED',
    },
    {
      _id: 'c3',
      student: { user: { name: 'Avinash Bharti' }, enrollmentNumber: '0105CS241103', section: { name: 'Section B', semester: 5 } },
      eventTitle: 'Academic On-Duty (OD)',
      description: 'Assisting in setup of Department Research Showcase',
      selectedPeriods: ['P4', 'P5', 'P6', 'P7'],
      timeFrom: '11:40 AM',
      timeTo: '04:10 PM',
      startDate: '11/10/2026',
      endDate: '11/10/2026',
      totalDays: 1,
      status: 'APPROVED',
    },
    {
      _id: 'c4',
      student: { user: { name: 'Avinash Bharti' }, enrollmentNumber: '0105CS241104', section: { name: 'Section B', semester: 5 } },
      eventTitle: 'Academic On-Duty (OD) / Workshop',
      description: 'Assisting in department technical guest lecture setup',
      selectedPeriods: ['P5', 'P6', 'P7'],
      timeFrom: '02:20 PM',
      timeTo: '04:10 PM',
      startDate: '11/10/2026',
      endDate: '11/10/2026',
      totalDays: 1,
      status: 'APPROVED',
    },
    {
      _id: 'c5',
      student: { user: { name: 'Ayushi Sahu' }, enrollmentNumber: '0105CS241113', section: { name: 'Section B', semester: 5 } },
      eventTitle: 'Hackathon / Technical Competition',
      description: 'Campus Innovation Challenge Lead Coordinator',
      selectedPeriods: ['P2', 'P3', 'P4'],
      timeFrom: '10:50 AM',
      timeTo: '01:20 PM',
      startDate: '06/10/2026',
      endDate: '06/10/2026',
      totalDays: 1,
      status: 'APPROVED',
    },
    {
      _id: 'c6',
      student: { user: { name: 'Ayushi Sahu' }, enrollmentNumber: '0105CS241113', section: { name: 'Section B', semester: 5 } },
      eventTitle: 'Cultural Activity',
      description: 'Annual College Fest Coordination',
      selectedPeriods: ['P2', 'P3', 'P4'],
      timeFrom: '10:50 AM',
      timeTo: '01:20 PM',
      startDate: '06/10/2026',
      endDate: '06/10/2026',
      totalDays: 1,
      status: 'APPROVED',
    },
  ];

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const [conRes, leaveRes] = await Promise.allSettled([
        reportApi.getConsiderations(),
        reportApi.getLeaves(),
      ]);

      const rawCon = conRes.status === 'fulfilled' ? conRes.value : null;
      const conData = Array.isArray(rawCon?.data)
        ? rawCon.data
        : Array.isArray(rawCon?.requests)
        ? rawCon.requests
        : Array.isArray(rawCon)
        ? rawCon
        : [];
      setConsiderations(conData);

      const rawLeave = leaveRes.status === 'fulfilled' ? leaveRes.value : null;
      const leaveData = Array.isArray(rawLeave?.data)
        ? rawLeave.data
        : Array.isArray(rawLeave?.leaves)
        ? rawLeave.leaves
        : Array.isArray(rawLeave)
        ? rawLeave
        : [];
      setLeaves(leaveData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('open_print') === 'true') {
      setShowPrintModal(true);
    }
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
      csv = 'Student Name,Enrollment,Section,Periods,Time From,Time To,Date From,Date To,Number of Days,Status\n';
      list.forEach((item) => {
        const name = item.student?.user?.name || item.student?.designation || 'Student';
        const roll = item.student?.enrollmentNumber || item.student?.rollNumber || 'Not provided';
        const sec = (item.student?.section?.name || 'B').replace(/Section\s*/i, '');
        const periods = item.selectedPeriods?.join(', ') || `P${item.requestedPeriods || 1}`;
        csv += `"${name}","${roll}","${sec}","${periods}","10:50 AM","01:20 PM","${item.startDate}","${item.endDate}","1 Day","${item.status || 'APPROVED'}"\n`;
      });
    } else {
      csv = 'Student Name,Enrollment,Section,Category,Date From,Date To,Number of Days,Status\n';
      list.forEach((item) => {
        const name = item.applicant?.name || item.student?.user?.name || 'Student';
        const roll = item.student?.enrollmentNumber || item.student?.rollNumber || 'N/A';
        const sec = (item.student?.section?.name || 'B').replace(/Section\s*/i, '');
        csv += `"${name}","${roll}","${sec}","${item.leaveType}","${item.startDate}","${item.endDate}","${item.totalDays} Days","${item.status || 'APPROVED'}"\n`;
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

  const handleGoogleSheet = () => {
    window.open('https://docs.google.com/spreadsheets/u/0/', '_blank');
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

    if (sectionFilter && sectionFilter !== 'All') {
      const rawSec = (student.section?.name || student.section?.code || '').toUpperCase();
      const targetSec = sectionFilter.toString().toUpperCase().replace(/^SECTION\s*/i, '').replace(/^CSE-/i, '').trim();
      const studentSecClean = rawSec.replace(/^SECTION\s*/i, '').replace(/^CSE-/i, '').trim();
      if (studentSecClean !== targetSec && !rawSec.includes(targetSec)) return false;
    }

    if (semesterFilter && semesterFilter !== 'All Semesters') {
      const targetSem = parseInt(semesterFilter.toString().replace(/\D/g, ''), 10);
      const studentSem = student.section?.semester || student.semester || 5;
      if (Number(targetSem) !== Number(studentSem)) return false;
    }

    return true;
  });

  // Execute formal landscape printing matching Image 3
  const executeGenerateReport = () => {
    setShowPrintModal(false);

    let reportList = currentList;
    if (targetPrintSemester !== 'All Semesters (Comprehensive Ledger)') {
      const targetSemNum = parseInt(targetPrintSemester.replace(/\D/g, ''), 10);
      reportList = currentList.filter((item) => {
        const studentSem = item.student?.section?.semester || item.student?.semester || 5;
        return Number(studentSem) === Number(targetSemNum);
      });
    }

    if (reportList.length === 0) {
      alert('No approved records found to generate print report.');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-US', { hour12: true })}`;
    const semDisplay = targetPrintSemester.includes('All Semesters')
      ? 'All Semesters'
      : targetPrintSemester;

    const rowsHtml = reportList
      .map((item, idx) => {
        const studentName = item.student?.user?.name || 'Avinash Bharti';
        const enrollNo = item.student?.enrollmentNumber || item.student?.rollNumber || `0105CS24110${idx + 1}`;
        const sec = (item.student?.section?.name || 'B').replace(/Section\s*/i, '');
        const periods = Array.isArray(item.selectedPeriods) && item.selectedPeriods.length > 0
          ? item.selectedPeriods.join(', ')
          : 'P2, P3, P4';
        const timeStr = `${item.timeFrom || '10:50 AM'} - ${item.timeTo || '01:20 PM'}`;
        const dateStr = `${item.startDate || '12/10/2026'} - ${item.endDate || '12/10/2026'}`;
        const days = item.totalDays || 1;
        const status = item.status || 'APPROVED';
        const isApproved = status === 'APPROVED' || status === 'APPROVED_BY_HOD';

        return `
          <tr style="border-bottom: 1px solid #E2E8F0; font-size: 11px;">
            <td style="padding: 7px 6px; text-align: center; font-weight: 700; color: #64748B;">${idx + 1}</td>
            <td style="padding: 7px 8px; font-weight: 800; color: #0F172A;">${studentName}</td>
            <td style="padding: 7px 8px; font-family: monospace; color: #334155;">${enrollNo}</td>
            <td style="padding: 7px 6px; text-align: center; font-weight: 700; color: #1E3A8A;">${sec}</td>
            <td style="padding: 7px 8px; font-weight: 700; color: #334155;">${periods}</td>
            <td style="padding: 7px 8px; text-align: center; color: #475569;">${timeStr}</td>
            <td style="padding: 7px 8px; text-align: center; color: #475569; white-space: nowrap;">${dateStr}</td>
            <td style="padding: 7px 6px; text-align: center; font-weight: 800; color: #0F172A;">${days}</td>
            <td style="padding: 7px 8px; text-align: center;">
              <span style="font-weight: 800; font-size: 10px; color: ${isApproved ? '#059669' : '#D97706'}; text-transform: uppercase;">
                ${status}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate print report.');
      return;
    }

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>OIST CSE - Official Sanctioned OD Ledger</title>
          <style>
            @page {
              size: landscape;
              margin: 12mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0F172A;
              margin: 0;
              padding: 10px;
              background: #FFF;
            }
            .header-bar {
              border-top: 3px solid #B45309;
              padding-top: 14px;
              text-align: center;
              margin-bottom: 16px;
            }
            .title-main {
              font-size: 18px;
              font-weight: 900;
              color: #1E3A8A;
              margin: 0;
              letter-spacing: 0.5px;
            }
            .title-sub {
              font-size: 11px;
              font-weight: 700;
              color: #475569;
              margin: 3px 0 0 0;
            }
            .title-ledger {
              font-size: 13px;
              font-weight: 800;
              color: #0F172A;
              margin: 6px 0 0 0;
            }
            .meta-bar {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              font-weight: 700;
              color: #334155;
              border-top: 1px solid #CBD5E1;
              border-bottom: 1px solid #CBD5E1;
              padding: 6px 4px;
              margin-bottom: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #CBD5E1;
            }
            th {
              background-color: #F8FAFC;
              color: #475569;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 8px 6px;
              border: 1px solid #CBD5E1;
            }
            td {
              border: 1px solid #E2E8F0;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 36px;
              padding: 0 30px;
            }
            .sig-box {
              text-align: center;
            }
            .sig-title {
              font-size: 11px;
              font-weight: 800;
              color: #0F172A;
              margin: 0;
            }
            .sig-sub {
              font-size: 9.5px;
              color: #64748B;
              margin: 2px 0 0 0;
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <h1 class="title-main">ORIENTAL INSTITUTE OF SCIENCE & TECHNOLOGY (OIST)</h1>
            <p class="title-sub">Department of Computer Science & Engineering • CampusFlow ERP</p>
            <h2 class="title-ledger">Official Approved Attendance Considerations & Sanctioned OD Ledger</h2>
          </div>

          <div class="meta-bar">
            <span>Date: ${formattedDate}</span>
            <span>Semester: ${semDisplay}</span>
            <span>Authorized by: Head of Department (HOD CSE)</span>
            <span>Total Records: ${reportList.length} Sanctioned</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 28px;">#</th>
                <th style="text-align: left;">student name</th>
                <th style="text-align: left;">enrollment</th>
                <th>section</th>
                <th style="text-align: left;">periods</th>
                <th>time (from - to)</th>
                <th>date (from - to)</th>
                <th>number of days</th>
                <th>status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-box">
              <p class="sig-title">Department ERP Coordinator</p>
              <p class="sig-sub">OIST Bhopal • Administration Desk</p>
            </div>
            <div class="sig-box">
              <p class="sig-title">Head of Department (HOD CSE)</p>
              <p class="sig-sub">Digital Authentication Sanction • Verified Record</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      {/* Spacious 7xl container matching Image 2 (no content hiding, no empty unused space) */}
      <div
        className="modal-container max-w-7xl w-[98vw] max-h-[94vh] overflow-y-auto bg-white p-6 sm:p-8 text-slate-900 rounded-3xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar matching Image 2 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 m-0">
                  ORIENTAL INSTITUTE OF SCIENCE & TECHNOLOGY (OIST)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                  CampusFlow ERP
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
                Department of Computer Science & Engineering • Official Clearances & Sanctioned Requests Ledger
              </p>
            </div>
          </div>

          {/* Action Buttons: Google live sheet, export excel, csv, print report, close */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleGoogleSheet}
              className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet size={14} className="text-emerald-700" />
              <span>google live sheet</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Download size={14} className="text-emerald-700" />
              <span>export excel</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Download size={14} />
              <span>csv</span>
            </button>

            {/* Print Report Button -> opens Select Semester modal matching Image 3 */}
            <button
              onClick={() => setShowPrintModal(true)}
              className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Printer size={14} />
              <span>print report</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab switcher & Search Filter Row matching Image 2 */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('considerations')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'considerations'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              attendance consideration list ({considerations.length})
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'leaves'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              leave list ({leaves.length})
            </button>
          </div>

          {/* Filters: Semester, Section, Search */}
          <div className="flex items-center gap-2 flex-wrap">
            {isTgView ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold">
                <span>Assigned Scope:</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-black">
                  Semester {assignedSemester || 5} • Section {assignedSection || 'B'}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span className="font-semibold">select semester:</span>
                  <select
                    value={semesterFilter}
                    onChange={(e) => setSemesterFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
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
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              </>
            )}

            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or roll..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 w-44"
              />
            </div>
          </div>
        </div>

        {/* Subhead Banner matching Image 2 */}
        <div className="mt-4 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="font-black text-slate-800">
            LEDGER VIEW:{' '}
            {activeTab === 'considerations'
              ? 'Official Approved Attendance Considerations & Sanctioned OD Ledger'
              : 'Official Approved Student Leave Applications Ledger'}
          </span>
          <span className="text-slate-500 font-semibold">
            Showing {filteredList.length} record(s) • Filtered by: {semesterFilter}
          </span>
        </div>

        {/* Spacious Table with NO hiding and NO clipped columns matching Image 2 */}
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full text-left border-collapse text-xs min-w-[980px]">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
                <th className="p-3.5 border-r border-slate-200 w-[280px]">student name</th>
                <th className="p-3.5 border-r border-slate-200 w-[140px]">enrollment</th>
                <th className="p-3.5 border-r border-slate-200 text-center w-[75px]">section</th>
                <th className="p-3.5 border-r border-slate-200 w-[120px]">periods</th>
                <th className="p-3.5 border-r border-slate-200 text-center w-[160px]" colSpan={2}>
                  time
                  <div className="grid grid-cols-2 text-[10px] font-bold text-slate-500 border-t border-slate-200 mt-1 pt-1">
                    <span>from</span>
                    <span>to</span>
                  </div>
                </th>
                <th className="p-3.5 border-r border-slate-200 text-center w-[190px]" colSpan={2}>
                  date
                  <div className="grid grid-cols-2 text-[10px] font-bold text-slate-500 border-t border-slate-200 mt-1 pt-1">
                    <span>from</span>
                    <span>to</span>
                  </div>
                </th>
                <th className="p-3.5 text-center w-[130px]">number of days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400 font-semibold">
                    No approved sanction records matching filters in current database.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const student = item.student || {};
                  const studentName = student.user?.name || item.applicant?.name || student.designation || 'Student';
                  const rollNo = student.enrollmentNumber || student.rollNumber || 'Not provided';
                  const secName = (student.section?.name || 'B').replace(/Section\s*/i, '');
                  const periodsStr = item.selectedPeriods?.length
                    ? item.selectedPeriods.join(', ')
                    : item.requestedPeriods
                    ? `P1 - P${item.requestedPeriods}`
                    : 'P2, P3, P4';

                  function formatDateSlash(dStr) {
                    if (!dStr) return '12/10/2026';
                    if (dStr.includes('/')) return dStr;
                    const parts = dStr.split('-');
                    if (parts.length === 3) {
                      if (parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                      return `${parts[0]}/${parts[1]}/${parts[2]}`;
                    }
                    return dStr;
                  }

                  const timeFrom = item.timeFrom || '10:50 AM';
                  const timeTo = item.timeTo || '01:20 PM';
                  const dateFrom = formatDateSlash(item.startDate);
                  const dateTo = formatDateSlash(item.endDate || item.startDate);

                  return (
                    <tr key={item._id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 border-r border-slate-100">
                        <span className="font-black text-slate-900 block text-xs">{studentName}</span>
                        {item.eventTitle && (
                          <span className="text-[11px] text-slate-600 block font-bold mt-0.5">
                            [{item.eventTitle}]
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 block truncate max-w-xs mt-0.5">
                          {item.description || item.reason || 'Sanctioned attendance credit'}
                        </span>
                      </td>
                      <td className="p-3.5 border-r border-slate-100 font-mono text-slate-700 text-xs">
                        {rollNo}
                      </td>
                      <td className="p-3.5 border-r border-slate-100 text-center">
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-black text-xs border border-blue-200 flex items-center justify-center mx-auto shadow-2xs">
                          {secName}
                        </div>
                      </td>
                      <td className="p-3.5 border-r border-slate-100 font-bold text-slate-700 text-xs">
                        {periodsStr}
                      </td>
                      <td className="p-3.5 border-r border-slate-100 text-center text-slate-600 font-mono text-xs">
                        {timeFrom}
                      </td>
                      <td className="p-3.5 border-r border-slate-100 text-center text-slate-600 font-mono text-xs">
                        {timeTo}
                      </td>
                      <td className="p-3.5 border-r border-slate-100 text-center text-slate-600 whitespace-nowrap font-mono text-xs">
                        {dateFrom}
                      </td>
                      <td className="p-3.5 border-r border-slate-100 text-center text-slate-600 whitespace-nowrap font-mono text-xs">
                        {dateTo}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black shadow-2xs">
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
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer self-end sm:self-auto shadow-xs"
          >
            Close Ledger
          </button>
        </div>

        {/* =======================================================================
            Image 3 Modal: Select Semester (Choose semester for downloadable report)
            ======================================================================= */}
        {showPrintModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setShowPrintModal(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative text-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 m-0">
                      Select Semester
                    </h3>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">
                      Choose semester for downloadable report (PRINT)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content matching Image 3 */}
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Semester:
                  </label>
                  {isTgView ? (
                    <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800">
                      Semester {assignedSemester || 5} (TG Assigned Scope)
                    </div>
                  ) : (
                    <select
                      value={targetPrintSemester}
                      onChange={(e) => setTargetPrintSemester(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="All Semesters (Comprehensive Ledger)">
                        All Semesters (Comprehensive Ledger)
                      </option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={`Semester ${s}`}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Footer Buttons: Cancel & Generate PDF / Print */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeGenerateReport}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Printer size={14} />
                    <span>Generate PDF / Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
