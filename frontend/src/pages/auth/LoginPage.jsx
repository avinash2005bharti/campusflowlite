import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useERP } from '../../context/ERPContext.jsx';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  GraduationCap,
  Shield,
  ArrowRight,
  AlertCircle,
  UserCheck,
  Landmark,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useERP();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('avinashbharti3007@gmail.com');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [forgotNotice, setForgotNotice] = useState('');

  // Role credentials map for quick access
  const roleAccounts = {
    student: { email: 'avinashbharti3007@gmail.com', pass: 'Password@123' },
    faculty: { email: 'kavita.teacher@campusflow.edu', pass: 'Password@123' },
    tg: { email: 'test_teacher@mail.in', pass: 'Password@123' },
    hod: { email: 'hod@campusflow.edu', pass: 'Password@123' },
    admin: { email: 'admin@campusflow.edu', pass: 'Password@123' },
  };

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    const acc = roleAccounts[roleKey];
    if (acc) {
      setEmail(acc.email);
      setPassword(acc.pass);
    }
    setError('');
  };

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
      setPassword('');
      setSelectedRole('student');
      setSuccessNotice('Account registered successfully! Please sign in with your credentials.');
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');
    setForgotNotice('');

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      const role = (user.role || '').toLowerCase();
      if (user.mustChangePassword) {
        navigate('/change-password');
      } else if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'hod') {
        navigate('/hod');
      } else if (user.isTG) {
        navigate('/tg');
      } else if (role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-login-page min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 font-sans">
      {/* =======================================================================
          LEFT SECTION: Deep Royal Blue Branding Banner (Split 50% on Desktop)
          ======================================================================= */}
      <div
        className="auth-brand-panel hidden lg:flex lg:w-1/2 w-full min-h-screen relative flex-col justify-between p-10 xl:p-16 text-white overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 75% 25%, #1d4ed8 0%, #0d2870 38%, #071744 75%, #051030 100%)',
        }}
      >
        {/* Glow Spheres */}
        <div className="absolute top-1/5 right-1/4 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Official Institutional Gateway Pill */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-white/95 font-medium shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Official Institutional Gateway • Estd. 1995</span>
          </div>

          {/* Logo Card & College Headline */}
          <div className="mt-10 flex items-center gap-4">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white p-2.5 shadow-xl shrink-0 flex items-center justify-center border border-white/30">
              <img
                src="/iit.png"
                alt="IIT Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-300 m-0">
                ORIENTAL GROUP OF INSTITUTES
              </p>
              <h1 className="text-xl sm:text-2xl xl:text-3xl font-black text-white tracking-tight mt-1 mb-0 leading-tight">
                Oriental Institute of Science & Technology
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 mt-1 mb-0 font-medium">
                Department of Computer Science & Engineering (CSE)
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="mt-8 text-xs sm:text-sm text-slate-300/95 leading-relaxed max-w-lg font-normal">
            CampusFlow ERP — Enterprise academic management powering real-time attendance ledgers,
            timetable generation, multi-tier clearances, and transparent student governance.
          </p>
        </div>

        {/* Bottom Accreditation Badges in a Row matching login-pc.png */}
        <div className="relative z-10 mt-12 flex flex-wrap gap-2.5">
          <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] font-medium text-white/90 flex items-center gap-1.5">
            <Shield size={13} className="text-blue-300" />
            NAAC 'A+' Grade Accredited
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] font-medium text-white/90 flex items-center gap-1.5">
            <Building2 size={13} className="text-blue-300" />
            Approved by AICTE, New Delhi
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] font-medium text-white/90 flex items-center gap-1.5">
            <GraduationCap size={13} className="text-blue-300" />
            Affiliated to RGPV, Bhopal
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] font-medium text-white/90 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-blue-300" />
            NBA Accredited Programmes
          </span>
        </div>
      </div>

      {/* =======================================================================
          RIGHT SECTION: Sign-in Form (Split 50% on Desktop, 100% on Mobile)
          ======================================================================= */}
      <div className="auth-login-panel w-full lg:w-1/2 min-h-screen bg-slate-50 flex flex-col justify-center items-center px-3 sm:px-12 xl:px-20 py-10">
        <div className="auth-login-form">
          {/* Mobile-only Branding Header matching login-responsive.png */}
          <div className="lg:hidden flex flex-col items-center text-center mb-6">
            <div className="auth-mobile-emblem w-16 h-16 rounded-2xl bg-white p-2 shadow-md border border-slate-200/80 mb-3 flex items-center justify-center">
              <img
                src="/iit.png"
                alt="IIT Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-[13px] font-black text-slate-900 leading-tight">
              Oriental Institute of Science & Technology
            </h1>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Department of Computer Science & Engineering
            </p>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 block mb-1">
              AUTHENTICATION GATEWAY
            </span>
            <h2 className="text-base sm:text-[28px] font-black text-slate-900 tracking-tight leading-tight m-0">
              Sign in to CampusFlow
            </h2>
            <p className="auth-form-description text-[10px] sm:text-sm text-slate-500 mt-1 mb-0">
              Enter your registered official email address and password to sign in.
            </p>
          </div>

          {/* Feedback Notices */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {forgotNotice && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-blue-600" />
              <span>{forgotNotice}</span>
            </div>
          )}

          {/* Select Portal / Role Tabs matching screenshot */}
          <div className="mb-5">
            <label className="auth-role-label block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Select Portal / Role
            </label>
            <div className="auth-role-tabs grid grid-cols-5 gap-1 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
              {[
                { id: 'student', label: 'Student', icon: GraduationCap },
                { id: 'faculty', label: 'Faculty', icon: Building2 },
                { id: 'tg', label: 'TG', icon: UserCheck },
                { id: 'hod', label: 'HOD', icon: Landmark },
                { id: 'admin', label: 'Admin', icon: Shield },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = selectedRole === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleRoleSelect(tab.id)}
                    className={`auth-role-tab flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-blue-700 shadow-xs border border-slate-200/90'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon size={12} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                    <span className="mt-0.5 leading-tight">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#EDF3FF] hover:bg-[#E5EFFE] focus:bg-white border border-blue-200/70 focus:border-blue-600 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() =>
                    setForgotNotice('For password reset, please contact your Tutor Guardian or Department Administration.')
                  }
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#EDF3FF] hover:bg-[#E5EFFE] focus:bg-white border border-blue-200/70 focus:border-blue-600 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="auth-submit w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to ERP Portal</span>
              )}
            </button>
          </form>

          {/* Student Self-Registration Card */}
          <div className="auth-register-block mt-8 pt-6 border-t border-slate-200/80">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
              STUDENT SELF-REGISTRATION
            </span>
            <Link
              to="/register/student"
              className="auth-register-link w-full p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 transition-all flex items-center justify-between group no-underline text-slate-800 cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="auth-register-icon w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <GraduationCap size={12} />
                </div>
                <span className="auth-register-link-text text-xs font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                  New Student? Create Student Account
                </span>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </Link>
            <p className="auth-register-note text-[11px] text-slate-400 text-center mt-3 font-normal m-0">
              Faculty & Staff accounts are provisioned exclusively by Department Administration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
