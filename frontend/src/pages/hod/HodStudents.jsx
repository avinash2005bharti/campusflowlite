import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext.jsx';
import { masterDataApi } from '../../api/modulesApi.js';
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
  GraduationCap,
  Search,
  Users,
  ShieldCheck,
  Mail,
  Phone,
  Eye,
  Filter,
  User,
  X,
} from 'lucide-react';

export default function HodStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await masterDataApi.getStudents();
      setStudents(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStudentSemester = (st) => {
    return st.semester || st.section?.semester || 5;
  };

  const filteredStudents = students.filter((st) => {
    const name = (st.user?.name || '').toLowerCase();
    const roll = (st.rollNumber || '').toLowerCase();
    const enrollment = (st.enrollmentNumber || '').toLowerCase();
    const email = (st.user?.email || '').toLowerCase();
    const sem = getStudentSemester(st);
    const q = search.toLowerCase();

    const matchesSearch =
      !search ||
      name.includes(q) ||
      roll.includes(q) ||
      enrollment.includes(q) ||
      email.includes(q);

    const matchesSemester =
      semesterFilter === 'ALL' || String(sem) === String(semesterFilter);

    return matchesSearch && matchesSemester;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 font-sans">
      <PageHeader
        title="Department Students Roster"
        description="Comprehensive directory of enrolled students, semester cohorts, and assigned Tutor Guardians."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex-1 sm:max-w-md">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by student name, roll number, enrollment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs border-none p-0 focus:outline-none w-full text-slate-800 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="form-select text-xs py-1.5 px-3 bg-white border-slate-200 rounded-xl font-medium cursor-pointer"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          <span className="badge badge-indigo text-xs font-bold py-1.5 px-3">
            {filteredStudents.length} Students
          </span>
        </div>
      </div>

      {/* Students Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading student directory...</div>
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            title="No Students Found"
            description="No student records match your query."
            icon={GraduationCap}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll / Enrollment</TableHead>
                <TableHead>Semester & Section</TableHead>
                <TableHead>Tutor Guardian (TG)</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((st) => {
                const sem = getStudentSemester(st);
                const studentName = st.user?.name || st.designation || 'Student';
                const tgTeacher = st.mentorGroup?.tg;
                const tgName =
                  tgTeacher?.user?.name ||
                  tgTeacher?.designation ||
                  (st.mentorGroup ? 'Assigned' : 'Not assigned');

                return (
                  <TableRow key={st._id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                          {studentName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-heading font-black text-xs text-slate-900">
                          {studentName}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col text-xs font-mono">
                        <span className="font-bold text-slate-900">
                          {st.rollNumber || 'Not provided'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {st.enrollmentNumber || 'Not provided'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="badge badge-primary text-[10px] font-bold">
                          Semester {sem}
                        </span>
                        <span className="badge badge-slate text-[10px] font-bold">
                          Sec {st.section?.name || st.section?.code || '-'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {st.mentorGroup ? (
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                            {tgName}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            Assigned
                          </span>
                        </div>
                      ) : (
                        <span className="badge badge-slate text-[10px] font-bold">
                          Not assigned
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col text-[11px] text-slate-500">
                        <span>{st.user?.email || 'Not provided'}</span>
                        <span className="font-mono">{st.user?.phone || 'Not provided'}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <button
                        onClick={() => setSelectedStudent(st)}
                        className="btn btn-sm btn-ghost p-1.5 text-blue-600 hover:bg-blue-50 cursor-pointer"
                        title="View Student Profile"
                      >
                        <Eye size={15} />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-heading font-black text-slate-900 text-sm m-0">
                Student Profile
              </h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 font-black text-lg flex items-center justify-center shrink-0">
                  {(selectedStudent.user?.name || selectedStudent.designation || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-base text-slate-900 m-0 truncate">
                    {selectedStudent.user?.name || selectedStudent.designation || 'Student'}
                  </h4>
                  <p className="text-slate-500 font-mono text-[11px] m-0 mt-0.5 truncate">
                    Roll: {selectedStudent.rollNumber || 'Not provided'} • Enrollment: {selectedStudent.enrollmentNumber || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl space-y-2.5 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Semester:</span>
                  <span className="font-bold text-blue-700">
                    Semester {getStudentSemester(selectedStudent)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Section:</span>
                  <span className="font-bold text-slate-800">
                    {selectedStudent.section?.name || selectedStudent.section?.code || 'Not assigned'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Department:</span>
                  <span className="font-bold text-slate-800">
                    {selectedStudent.department?.name || 'Computer Science & Engineering'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Tutor Guardian:</span>
                  <span className="font-bold text-slate-900">
                    {selectedStudent.mentorGroup?.tg?.user?.name ||
                      selectedStudent.mentorGroup?.tg?.designation ||
                      'Not assigned'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">TG Assignment Status:</span>
                  <span
                    className={`font-bold ${
                      selectedStudent.mentorGroup ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {selectedStudent.mentorGroup ? 'Assigned' : 'Not assigned'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-700 truncate">
                    {selectedStudent.user?.email || 'Not provided'}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-700 truncate">
                    {selectedStudent.user?.phone || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setSelectedStudent(null)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
