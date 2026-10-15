import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useERP } from '../context/ERPContext.jsx';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import NotificationToast from '../components/NotificationToast.jsx';
import FilePreviewModal from '../components/FilePreviewModal.jsx';
import RequestConsiderationModal from '../components/modals/RequestConsiderationModal.jsx';
import ApplyLeaveModal from '../components/modals/ApplyLeaveModal.jsx';
import AttendanceLeaveReportsModal from '../components/modals/AttendanceLeaveReportsModal.jsx';
import ReviewModal from '../components/modals/ReviewModal.jsx';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  const { activeModal, modalData, closeModal } = useERP();

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      {/* Main Content Area */}
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="content-container p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Global Toast System */}
      <NotificationToast />

      {/* Secure File Viewer Modal */}
      <FilePreviewModal />

      {/* Global Modals */}
      {activeModal === 'REQUEST_CONSIDERATION' && (
        <RequestConsiderationModal
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            window.dispatchEvent(new CustomEvent('campusflow_refresh_considerations'));
          }}
        />
      )}

      {activeModal === 'APPLY_LEAVE' && (
        <ApplyLeaveModal
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            window.dispatchEvent(new CustomEvent('campusflow_refresh_leaves'));
          }}
        />
      )}

      {activeModal === 'EXPORT_REPORTS' && (
        <AttendanceLeaveReportsModal onClose={closeModal} />
      )}

      {activeModal === 'REVIEW_ACTION' && (
        <ReviewModal
          type={modalData.type}
          role={modalData.role}
          item={modalData.item}
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            window.dispatchEvent(new CustomEvent('campusflow_queue_changed'));
          }}
        />
      )}
    </div>
  );
}
