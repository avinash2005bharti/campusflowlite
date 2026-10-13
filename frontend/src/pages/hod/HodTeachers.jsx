import React, { useEffect, useState } from 'react';
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
  UserCheck,
  Search,
  ShieldCheck,
  Mail,
  Phone,
  Briefcase,
  Users,
} from 'lucide-react';

export default function HodTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await masterDataApi.getTeachers();
      setTeachers(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTeachers = teachers.filter((t) => {
    const name = (t.user?.name || '').toLowerCase();
    const emp = (t.employeeId || '').toLowerCase();
    const email = (t.user?.email || '').toLowerCase();
    const des = (t.designation || '').toLowerCase();
    const q = search.toLowerCase();

    return !search || name.includes(q) || emp.includes(q) || email.includes(q) || des.includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Department Faculty Directory"
        description="Faculty roster, designations, contact channels, and Teacher Guardian appointment statuses."
      />

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex-1 sm:max-w-md">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search faculty by name, employee id, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs border-none p-0 focus:outline-none w-full"
          />
        </div>

        <span className="badge badge-indigo text-xs font-bold py-1.5 px-3">
          {filteredTeachers.length} Faculty Members
        </span>
      </div>

      {/* Teachers Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading faculty directory...</div>
        ) : filteredTeachers.length === 0 ? (
          <EmptyState
            title="No Teachers Found"
            description="No faculty records match your query."
            icon={UserCheck}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>TG Role</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((t) => (
                <TableRow key={t._id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">
                        {(t.user?.name || 'T').charAt(0)}
                      </div>
                      <span className="font-heading font-black text-xs text-slate-900">
                        {t.user?.name || 'Teacher'}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {t.employeeId || 'N/A'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="badge badge-slate text-[11px] font-bold">
                      {t.designation || 'Assistant Professor'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-600">
                      {t.department?.name || 'Computer Science & Engineering'}
                    </span>
                  </TableCell>

                  <TableCell>
                    {t.isTG ? (
                      <span className="badge badge-emerald flex items-center gap-1 text-[11px] font-bold">
                        <ShieldCheck size={12} />
                        Appointed TG
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Faculty</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col text-[11px] text-slate-500">
                      <span>{t.user?.email || '-'}</span>
                      <span className="font-mono">{t.user?.phone || '-'}</span>
                    </div>
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
