import React from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, Building2, Calendar, FileText } from 'lucide-react';

export default function FormalApplicationModal({ item, onClose }) {
  if (!item) return null;

  const handlePrint = () => {
    window.print();
  };

  const studentName = item.student?.user?.name || item.applicant?.name || 'Avinash Bharti';
  const enrollmentNo = item.student?.rollNumber || '0105CS241101';
  const sectionCode = item.student?.section?.name || item.student?.section?.code || 'Section B';
  const academicDept = 'Department of Computer Science & Engineering';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container max-w-2xl w-[95%] max-h-[92vh] overflow-y-auto bg-white p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              Official Sanction Order Issued
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Sanction Order</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Official Institutional Document */}
        <div className="mt-4 p-6 sm:p-8 rounded-2xl border-2 border-slate-300 bg-white font-sans text-slate-900 shadow-sm relative overflow-hidden print:border-none print:p-0">
          {/* Institutional Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <img src="/oriental.png" alt="OIST Seal" className="w-96 h-96 object-contain" />
          </div>

          {/* Institutional Header */}
          <div className="text-center pb-5 border-b-2 border-slate-800">
            <div className="w-14 h-14 mx-auto mb-2">
              <img src="/oriental.png" alt="OIST Logo" className="w-full h-full object-contain" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600 m-0">
              ORIENTAL GROUP OF INSTITUTES
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0 mt-0.5">
              Oriental Institute of Science & Technology, Bhopal
            </h2>
            <p className="text-xs font-bold text-slate-700 m-0 mt-0.5">
              {academicDept} (NBA & NAAC 'A+' Accredited)
            </p>
            <p className="text-[10px] text-slate-500 m-0 mt-1">
              Affiliated to Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV) • Approved by AICTE
            </p>
          </div>

          {/* Order Meta Bar */}
          <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-600 pb-3 border-b border-slate-200">
            <div>
              <span>Ref. No: </span>
              <strong className="text-slate-900 font-mono">
                OIST/CSE/SANCTION/{item._id ? item._id.toString().slice(-8).toUpperCase() : '2026-001'}
              </strong>
            </div>
            <div>
              <span>Date of Issue: </span>
              <strong className="text-slate-900">
                {new Date(item.updatedAt || Date.now()).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </div>
          </div>

          {/* Title */}
          <div className="my-6 text-center">
            <span className="inline-block px-4 py-1.5 rounded-md bg-slate-100 border border-slate-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900">
              OFFICIAL ACADEMIC SANCTION & CONSIDERATION ORDER
            </span>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">Student Full Name:</span>
              <strong className="text-slate-900 font-bold text-sm">{studentName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Enrollment No. / ID:</span>
              <strong className="text-slate-900 font-bold font-mono">{enrollmentNo}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Academic Section & Batch:</span>
              <strong className="text-slate-900">{sectionCode} • CSE Department</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Status of Sanction:</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 size={13} />
                APPROVED & CREDIT GRANTED
              </span>
            </div>
          </div>

          {/* Clearance Body Details */}
          <div className="mt-5 space-y-3 text-xs text-slate-700 leading-relaxed">
            <p>
              This is to certify that the attendance consideration / leave application submitted by{' '}
              <strong>{studentName}</strong> has been evaluated under the Autonomous Clearance Protocol
              and has received multi-tier recommendation and final sanction from the Head of the Department.
            </p>

            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Activity / Reason:</span>
                <strong className="text-slate-900">{item.eventTitle || item.leaveType || item.reason}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Effective Period Range:</span>
                <strong className="text-slate-900">
                  {item.startDate} to {item.endDate}
                </strong>
              </div>
              {item.requestedPeriods && (
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Periods Credited:</span>
                  <strong className="text-blue-700">
                    {item.hodReview?.approvedPeriods || item.requestedPeriods} Periods{' '}
                    {item.selectedPeriods?.length > 0 ? `(${item.selectedPeriods.join(', ')})` : ''}
                  </strong>
                </div>
              )}
              {item.totalDays && (
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Sanctioned Absence Duration:</span>
                  <strong className="text-blue-700">{item.totalDays} Academic Day(s)</strong>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 italic mt-3">
              Attendance ledgers and academic registers shall reflect credited attendance as per college
              statutes and departmental clearance regulations.
            </p>
          </div>

          {/* Signatures & Seal */}
          <div className="mt-10 pt-6 border-t border-slate-300 flex items-end justify-between text-center">
            <div>
              <div className="h-10 flex items-center justify-center">
                <span className="text-xs font-serif italic text-blue-800 font-bold">[Digitally Verified]</span>
              </div>
              <p className="text-xs font-bold text-slate-900 m-0">Tutor Guardian (TG)</p>
              <p className="text-[10px] text-slate-500 m-0">Tier-1 Recommendation Desk</p>
            </div>

            <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-600 text-emerald-700 flex flex-col items-center justify-center text-[9px] font-black uppercase rotate-[-12deg] shrink-0">
              <span>OIST CSE</span>
              <span className="text-[8px] font-bold">SANCTIONED</span>
              <span>OFFICIAL</span>
            </div>

            <div>
              <div className="h-10 flex items-center justify-center">
                <span className="text-xs font-serif italic text-blue-800 font-bold">[Digitally Approved]</span>
              </div>
              <p className="text-xs font-bold text-slate-900 m-0">Head of Department (HOD)</p>
              <p className="text-[10px] text-slate-500 m-0">Department of CSE, OIST</p>
            </div>
          </div>
        </div>

        {/* Modal Close Button */}
        <div className="mt-6 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer"
          >
            Close Sanction Order
          </button>
        </div>
      </div>
    </div>
  );
}
