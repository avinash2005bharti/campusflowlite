import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useERP } from '../../context/ERPContext.jsx';
import { authApi } from '../../api';
import { Lock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, FormField, Input } from '../../components/common';

export default function ChangePasswordPage() {
  const { currentUser, addToast, currentRole } = useERP();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      addToast('Password Changed', 'Your password has been successfully updated.', 'success');
      navigate(`/${currentRole}`);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-2 text-white">
            <KeyRound size={22} />
          </div>
          <h2 className="text-lg font-extrabold tracking-tight m-0">Change Account Password</h2>
          <p className="text-xs text-slate-400 mt-1 mb-0">
            {currentUser?.mustChangePassword
              ? 'Security requirement: please update your default password.'
              : 'Update your account credentials.'}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <FormField label="Current Password" required>
              <Input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </FormField>

            <FormField label="New Password (min 8 chars, 1 uppercase, 1 number)" required>
              <Input
                type="password"
                placeholder="Enter strong new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Confirm New Password" required>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </FormField>

            <Button type="submit" size="md" fullWidth loading={loading} className="mt-2">
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
