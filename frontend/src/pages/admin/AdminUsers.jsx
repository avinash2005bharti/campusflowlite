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
  Users,
  UserPlus,
  Search,
  Key,
  Shield,
  CheckCircle2,
  XCircle,
  Copy,
  Lock,
  Mail,
  Phone,
  X,
} from 'lucide-react';

export default function AdminUsers() {
  const { addToast } = useERP();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('STUDENT');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('Welcome@123');
  const [creating, setCreating] = useState(false);
  const [createdInfo, setCreatedInfo] = useState(null);

  // Reset Password State
  const [resetModalData, setResetModalData] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await masterDataApi.getUsers({
        page,
        limit: 25,
        role: roleFilter || undefined,
        search: search || undefined,
      });

      setUsers(res?.data?.users || []);
      setTotal(res?.data?.meta?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, search]);

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.isActive;
    try {
      await masterDataApi.updateUserStatus(user._id, nextStatus);
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `User ${user.name} is now ${nextStatus ? 'active' : 'suspended'}.`,
      });
      fetchUsers();
    } catch (err) {
      addToast({
        type: 'danger',
        title: 'Error',
        message: err.message,
      });
    }
  };

  const handleResetPassword = async (user) => {
    try {
      const res = await masterDataApi.resetPassword(user._id);
      setResetModalData({
        user,
        tempPassword: res?.data?.tempPassword || 'Reset successful',
      });
    } catch (err) {
      addToast({
        type: 'danger',
        title: 'Reset Failed',
        message: err.message,
      });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await masterDataApi.createUser({
        name: newName,
        email: newEmail,
        role: newRole,
        phone: newPhone,
        password: newPassword,
      });

      setCreatedInfo({
        user: res?.data?.user,
        tempPassword: res?.data?.tempPassword || newPassword,
      });

      addToast({
        type: 'success',
        title: 'User Created',
        message: `Account for ${newName} created successfully.`,
      });

      fetchUsers();
    } catch (err) {
      addToast({
        type: 'danger',
        title: 'Creation Failed',
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast({
      type: 'success',
      title: 'Copied',
      message: 'Temporary password copied to clipboard.',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="User Account Management"
        description="Provision accounts, control security states, and reset credentials for Students, Teachers, HOD, and Admins."
        action={
          <Button
            variant="primary"
            onClick={() => {
              setCreatedInfo(null);
              setShowCreateModal(true);
            }}
            className="text-xs font-black shadow-xs"
          >
            <UserPlus size={15} />
            Create User Account
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex-1 sm:max-w-md">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="text-xs border-none p-0 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="form-select text-xs py-1.5 px-3 bg-white border-slate-200 rounded-xl"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="TEACHER">Teachers</option>
            <option value="HOD">HODs</option>
            <option value="ADMIN">Admins</option>
          </select>

          <span className="badge badge-slate text-xs font-bold py-1.5 px-3">
            {total} Total Users
          </span>
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading user accounts...</div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description="No accounts match your criteria."
            icon={Users}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Force Password Change</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                        {(u.name || 'U').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-heading font-black text-xs text-slate-900 block truncate">
                          {u.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono truncate">
                          {u.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`badge text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'badge-danger'
                          : u.role === 'HOD'
                          ? 'badge-amber'
                          : u.role === 'TEACHER'
                          ? 'badge-indigo'
                          : 'badge-primary'
                      }`}
                    >
                      {u.role}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-600 font-mono">
                      {u.phone || '-'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`badge cursor-pointer text-[10px] font-bold transition-transform active:scale-95 ${
                        u.isActive ? 'badge-emerald' : 'badge-danger'
                      }`}
                      title="Click to toggle status"
                    >
                      {u.isActive ? 'Active' : 'Suspended'}
                    </button>
                  </TableCell>

                  <TableCell>
                    {u.mustChangePassword ? (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Complete</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="secondary"
                      onClick={() => handleResetPassword(u)}
                      className="btn-sm text-[11px] font-bold py-1 px-2.5"
                    >
                      <Key size={13} />
                      Reset Pwd
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-blue-600" />
                <h3 className="font-heading font-black text-slate-900 text-sm">
                  Create User Account
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {createdInfo ? (
              <div className="p-5 space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Account Provisioned Successfully!
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    User {createdInfo.user?.name} ({createdInfo.user?.email}) has been created with initial credentials.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Temporary Password
                  </span>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-xs">
                    <span className="font-bold text-slate-900">{createdInfo.tempPassword}</span>
                    <button
                      onClick={() => copyToClipboard(createdInfo.tempPassword)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Copy"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedInfo(null);
                    }}
                    className="text-xs"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    placeholder="e.g. John Doe"
                    className="input-field w-full text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="e.g. user@oriental.ac.in"
                    className="input-field w-full text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      System Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="form-select w-full bg-white border-slate-200 rounded-xl py-2 px-3 text-xs"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="HOD">HOD</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+91..."
                      className="input-field w-full text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field w-full text-xs font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={creating}>
                    {creating ? 'Creating...' : 'Provision User'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-5 space-y-4 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-slate-900 font-heading font-black text-sm">
              <Key size={18} className="text-amber-600" />
              Password Reset Notice
            </div>

            <p className="text-slate-600">
              The password for <strong>{resetModalData.user?.name}</strong> has been reset. The user will be required to change this upon next login.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Temporary Password
              </span>
              <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                <span>{resetModalData.tempPassword}</span>
                <button
                  onClick={() => copyToClipboard(resetModalData.tempPassword)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={() => setResetModalData(null)} className="text-xs">
                Acknowledge
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
