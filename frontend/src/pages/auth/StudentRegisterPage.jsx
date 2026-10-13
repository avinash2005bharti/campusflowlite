import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi.js';
import {
  GraduationCap,
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
  Calendar,
  Hash,
  Shield,
  ArrowLeft,
} from 'lucide-react';

export default function StudentRegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    enrollment_no: '',
    year: '3rd Year',
    semester: 5,
    section: 'Section A',
    batch: '2022-2026',
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

  const handleYearChange = (e) => {
    const yr = e.target.value;
    let sem = 1;
    if (yr === '1st Year') sem = 1;
    else if (yr === '2nd Year') sem = 3;
    else if (yr === '3rd Year') sem = 5;
    else if (yr === '4th Year') sem = 7;

    setFormData((prev) => ({
      ...prev,
      year: yr,
      semester: sem,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setError('Please provide your full legal name.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please provide a valid official or personal email address.');
      return;
    }

    if (!formData.enrollment_no.trim()) {
      setError('Enrollment No. / Student ID is required.');
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
      const cleanSection = formData.section.replace(/Section\s*/i, '').trim() || 'A';
      const cleanYear = parseInt(formData.year) || 3;

      const res = await authApi.registerStudent({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        rollNumber: formData.enrollment_no.trim().toUpperCase(),
        enrollment_no: formData.enrollment_no.trim().toUpperCase(),
        year: cleanYear,
        semester: Number(formData.semester),
        section: cleanSection,
        batch: formData.batch.trim(),
        phone: formData.phone.trim() || null,
      });

      setSuccessMsg(res?.message || 'Student account created successfully!');
      setTimeout(() => {
        navigate('/login', {
          state: {
            registeredEmail: formData.email.trim().toLowerCase(),
          },
        });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 lg:bg-[#081530] font-sans">
      {/* LEFT BRANDING PANEL */}
      <div className="hidden lg:flex lg:w-1/2 w-full relative flex-col justify-between p-8 sm:p-12 lg:p-16 text-white overflow-hidden bg-gradient-to-br from-[#061B48] via-[#0A2668] to-[#041233]">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-slate-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Official Institutional Gateway • Estd. 1995</span>
          </div>

          <div className="mt-8 flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2.5 shadow-xl shrink-0 flex items-center justify-center border border-white/30">
              <img
                src="/oist.png"
                alt="Oriental Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-300 m-0">
                ORIENTAL GROUP OF INSTITUTES
              </p>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mt-1 mb-0 leading-tight">
                Oriental Institute of Science & Technology
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-1 mb-0 font-medium">
                Department of Computer Science & Engineering (CSE)
              </p>
            </div>
          </div>

          {/* Student Self-Registration Portal Info Box */}
          <div className="mt-8 p-5 rounded-2xl bg-white/6 backdrop-blur-md border border-white/15">
            <div className="flex items-center gap-2 text-blue-200 font-bold text-sm mb-1.5">
              <GraduationCap size={18} className="text-blue-300" />
              <span>Student Self-Registration Portal</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed m-0 font-normal">
              Create your official student profile. Once enrolled, your attendance tracking, timetable sync,
              leave approvals, and exam eligibility are automatically managed through the departmental database.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <span className="px-3 py-1.5 rounded-full bg-white/8 backdrop-blur-sm border border-white/15 text-[11px] font-medium text-slate-200 flex items-center gap-1.5">
              <Shield size={13} className="text-blue-300" />
              NAAC 'A+' Grade
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/8 backdrop-blur-sm border border-white/15 text-[11px] font-medium text-slate-200 flex items-center gap-1.5">
              <Building2 size={13} className="text-blue-300" />
              AICTE Approved
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/8 backdrop-blur-sm border border-white/15 text-[11px] font-medium text-slate-200 flex items-center gap-1.5">
              <GraduationCap size={13} className="text-blue-300" />
              RGPV Affiliated
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-12 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>© 2026 OIST Bhopal • CSE Dept.</span>
          <span className="text-slate-400">Security Verified</span>
        </div>
      </div>

      {/* RIGHT REGISTRATION FORM */}
      <div className="auth-register-panel lg:w-1/2 w-full bg-white flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 overflow-y-auto">
        <div className="auth-register-form">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">
              <GraduationCap size={15} />
              <span>STUDENT REGISTRATION</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Create Student Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enroll in Computer Science & Engineering department records.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{successMsg} Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Legal Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ayush Sharma"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
              </div>
            </div>

            {/* Email & Enrollment No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official / Personal Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. student@gmail.com"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-blue-50/50 border border-blue-200/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enrollment No. / Student ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="enrollment_no"
                    value={formData.enrollment_no}
                    onChange={handleChange}
                    placeholder="0103CS211001"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Year, Semester, Section */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Year <span className="text-rose-500">*</span>
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleYearChange}
                  className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Semester <span className="text-rose-500">*</span>
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Section <span className="text-rose-500">*</span>
                </label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                  <option value="Section C">Section C</option>
                  <option value="Section D">Section D</option>
                </select>
              </div>
            </div>

            {/* Academic Batch & Contact Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Academic Batch <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    placeholder="2022-2026"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Phone (Optional)
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-9 pr-9 py-2.5 bg-blue-50/50 border border-blue-200/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-4"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enrolling Student...</span>
                </>
              ) : (
                <span>Complete Student Registration →</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-xs text-slate-500">Already have an account? </span>
            <Link to="/login" className="text-xs font-bold text-blue-600 hover:text-blue-700 underline">
              Sign In to ERP
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
