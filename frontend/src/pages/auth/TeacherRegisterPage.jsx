import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi.js';
import {
  UserCheck,
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  ArrowLeft,
  Briefcase,
} from 'lucide-react';
import { Button } from '../../components/common';

export default function TeacherRegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    designation: 'Assistant Professor',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setError('Please provide your official faculty name.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please provide a valid institutional email address.');
      return;
    }

    if (!formData.employeeId.trim()) {
      setError('Employee ID is required (e.g. EMP_CSE_01).');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.registerTeacher({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        employeeId: formData.employeeId.trim().toUpperCase(),
        designation: formData.designation,
        phone: formData.phone.trim() || null,
      });

      setSuccessMsg(res?.message || 'Faculty account successfully registered!');
      setTimeout(() => {
        navigate('/login', {
          state: {
            registeredEmail: formData.email.trim().toLowerCase(),
            roleNotice: 'teacher',
          },
        });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
        {/* Header Branding Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-blue-800 to-indigo-900 p-6 sm:p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white transition-colors font-bold"
            >
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </Link>

            <span className="text-[10px] uppercase tracking-wider font-extrabold bg-white/20 px-3 py-1 rounded-full text-white backdrop-blur-xs">
              Faculty Registration
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center font-bold text-white shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Create Faculty Account
              </h1>
              <p className="text-xs text-indigo-100 mt-0.5">
                Department of Computer Science & Engineering • Faculty Portal
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="p-3.5 mb-5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{successMsg} Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Full Official Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Preeti Sharma"
                  required
                  className="input-field pl-9 w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Institutional Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. preeti.cse@oriental.ac.in"
                  required
                  className="input-field pl-9 w-full text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Employee ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. EMP_CSE_08"
                  required
                  className="input-field w-full text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Designation</label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="form-select w-full bg-white border-slate-200 rounded-xl py-2 px-3 text-xs"
                >
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Adjunct Faculty">Adjunct Faculty</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91..."
                  className="input-field pl-9 w-full text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Min. 6 characters"
                    className="input-field pl-9 pr-9 w-full text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Re-enter password"
                    className="input-field pl-9 w-full text-xs"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={loading}
              className="mt-4 font-black shadow-sm"
            >
              Register Faculty Account
            </Button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-blue-600 hover:underline">
                Sign in here
              </Link>
            </span>

            <Link
              to="/register/student"
              className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
            >
              <span>Student? Create Student Account</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
