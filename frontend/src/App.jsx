import React from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useERP } from './context/ERPContext.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

// Auth Pages
import LoginPage from './pages/auth/LoginPage.jsx';
import ChangePasswordPage from './pages/auth/ChangePasswordPage.jsx';
import StudentRegisterPage from './pages/auth/StudentRegisterPage.jsx';
import TeacherRegisterPage from './pages/auth/TeacherRegisterPage.jsx';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import StudentMyRequests from './pages/student/StudentMyRequests.jsx';
import StudentConsiderations from './pages/student/StudentConsiderations.jsx';
import StudentLeaves from './pages/student/StudentLeaves.jsx';
import StudentProfile from './pages/student/StudentProfile.jsx';

// TG Pages
import TgDashboard from './pages/tg/TgDashboard.jsx';
import TgRequests from './pages/tg/TgRequests.jsx';
import TgMyStudents from './pages/tg/TgMyStudents.jsx';

// HOD Pages
import HodDashboard from './pages/hod/HodDashboard.jsx';
import HodConsiderations from './pages/hod/HodConsiderations.jsx';
import HodLeaves from './pages/hod/HodLeaves.jsx';
import HodMentorship from './pages/hod/HodMentorship.jsx';
import HodStudents from './pages/hod/HodStudents.jsx';
import HodTeachers from './pages/hod/HodTeachers.jsx';
import HodReports from './pages/hod/HodReports.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminBulkImport from './pages/admin/AdminBulkImport.jsx';
import AdminHodLeaves from './pages/admin/AdminHodLeaves.jsx';
import AdminAudit from './pages/admin/AdminAudit.jsx';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard.jsx';
import TeacherLeaves from './pages/teacher/TeacherLeaves.jsx';

import NotFound from './pages/NotFound.jsx';

import { ShieldAlert, ArrowLeft } from 'lucide-react';

function RoleRedirect() {
  const { currentRole, currentUser, isAuthenticated, loadingAuth } = useERP();

  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-bold">Verifying Session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return <Navigate to={`/${currentRole}`} replace />;
}

function ProtectedLayout() {
  const { isAuthenticated, loadingAuth } = useERP();
  const location = useLocation();

  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-bold">Authenticating Academic Session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <DashboardLayout />;
}

function LoginWrapper() {
  const { isAuthenticated, currentRole, currentUser, loadingAuth } = useERP();
  if (loadingAuth) return null;
  if (isAuthenticated) {
    if (currentUser?.mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }
    return <Navigate to={`/${currentRole}`} replace />;
  }
  return <LoginPage />;
}

function RoleRouteGuard({ role, children }) {
  const { currentRole, currentUser, isAuthenticated, loadingAuth } = useERP();
  const location = useLocation();

  if (loadingAuth) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isStudent = currentUser?.role === 'STUDENT' || currentRole === 'student';
  const isFaculty = currentUser?.role === 'TEACHER' || currentUser?.role === 'HOD';
  const isAppointedTg = isFaculty && Boolean(currentUser?.isTG);

  let isMatch = false;

  if (isStudent) {
    // Students can only access student routes
    isMatch = (Array.isArray(role) ? role.includes('student') : role === 'student');
  } else if (Array.isArray(role)) {
    isMatch = role.some((r) => {
      if (r === currentRole) return true;
      if (r === 'teacher') return currentRole === 'teacher' || (currentRole === 'tg' && isAppointedTg);
      if (r === 'tg') return isAppointedTg;
      return false;
    });
  } else if (role === currentRole) {
    if (role === 'tg') {
      isMatch = isAppointedTg;
    } else {
      isMatch = true;
    }
  } else if (role === 'teacher') {
    isMatch = currentRole === 'teacher' || (currentRole === 'tg' && isAppointedTg);
    if (role === 'tg' && (currentRole === 'teacher' || currentRole === 'tg')) {
      return children;
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="card text-center max-w-md w-full p-8 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Access Restricted (403 Forbidden)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              You do not have administrative permission to access this resource. Your authenticated role is{' '}
              <strong className="text-slate-800 uppercase">{currentRole}</strong>.
            </p>
          </div>
          <Link
            to={`/${currentRole}`}
            className="btn btn-primary text-xs font-bold inline-flex items-center gap-2 mt-2"
          >
            <ArrowLeft size={15} />
            <span>Return to My Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginWrapper />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/register" element={<StudentRegisterPage />} />
      <Route path="/register/student" element={<StudentRegisterPage />} />
      <Route path="/register/teacher" element={<Navigate to="/register" replace />} />

      {/* Protected Layout Routes */}
      <Route path="/" element={<ProtectedLayout />}>
        {/* Default route redirect to user role */}
        <Route index element={<RoleRedirect />} />

        {/* Student Routes */}
        <Route
          path="student"
          element={
            <RoleRouteGuard role="student">
              <StudentDashboard />
            </RoleRouteGuard>
          }
        />
        <Route
          path="student/requests"
          element={
            <RoleRouteGuard role="student">
              <StudentMyRequests />
            </RoleRouteGuard>
          }
        />
        <Route
          path="student/considerations"
          element={
            <RoleRouteGuard role="student">
              <StudentConsiderations />
            </RoleRouteGuard>
          }
        />
        <Route
          path="student/leaves"
          element={
            <RoleRouteGuard role="student">
              <StudentLeaves />
            </RoleRouteGuard>
          }
        />
        <Route
          path="student/profile"
          element={
            <RoleRouteGuard role="student">
              <StudentProfile />
            </RoleRouteGuard>
          }
        />

        {/* TG Routes */}
        <Route
          path="tg"
          element={
            <RoleRouteGuard role="tg">
              <TgDashboard />
            </RoleRouteGuard>
          }
        />
        <Route
          path="tg/requests"
          element={
            <RoleRouteGuard role="tg">
              <TgRequests />
            </RoleRouteGuard>
          }
        />
        <Route
          path="tg/students"
          element={
            <RoleRouteGuard role="tg">
              <TgMyStudents />
            </RoleRouteGuard>
          }
        />

        {/* HOD Routes */}
        <Route
          path="hod"
          element={
            <RoleRouteGuard role="hod">
              <HodDashboard />
            </RoleRouteGuard>
          }
        />
        <Route
          path="hod/considerations"
          element={
            <RoleRouteGuard role="hod">
              <HodConsiderations />
            </RoleRouteGuard>
          }
        />
        <Route
          path="hod/leaves"
          element={
            <RoleRouteGuard role="hod">
              <HodLeaves />
            </RoleRouteGuard>
          }
        />
        <Route
          path="hod/mentorship"
          element={
            <RoleRouteGuard role="hod">
              <HodMentorship />
            </RoleRouteGuard>
          }
        />
        <Route
          path="hod/students"
          element={
            <RoleRouteGuard role="hod">
              <HodStudents />
            </RoleRouteGuard>
          }
        />
        <Route
          path="hod/teachers"
          element={
            <RoleRouteGuard role="hod">
              <HodTeachers />
            </RoleRouteGuard>
          }
        />
        <Route
          path="hod/reports"
          element={
            <RoleRouteGuard role="hod">
              <HodReports />
            </RoleRouteGuard>
          }
        />

        {/* Admin Routes */}
        <Route
          path="admin"
          element={
            <RoleRouteGuard role="admin">
              <AdminDashboard />
            </RoleRouteGuard>
          }
        />
        <Route
          path="admin/users"
          element={
            <RoleRouteGuard role="admin">
              <AdminUsers />
            </RoleRouteGuard>
          }
        />
        <Route
          path="admin/import"
          element={
            <RoleRouteGuard role="admin">
              <AdminBulkImport />
            </RoleRouteGuard>
          }
        />
        <Route
          path="admin/hod-leaves"
          element={
            <RoleRouteGuard role="admin">
              <AdminHodLeaves />
            </RoleRouteGuard>
          }
        />

        {/* Common Audit Trail (Admin and HOD) */}
        <Route
          path="audit"
          element={
            <RoleRouteGuard role={['admin', 'hod']}>
              <AdminAudit />
            </RoleRouteGuard>
          }
        />

        {/* Legacy Teacher Routes Redirect to TG Workspace */}
        <Route
          path="teacher"
          element={<Navigate to="/tg" replace />}
        />
        <Route
          path="teacher/leaves"
          element={<Navigate to="/tg/requests" replace />}
        />
      </Route>

      {/* Catch-all fallback 404 page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
