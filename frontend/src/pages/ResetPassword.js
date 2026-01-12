import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [step, setStep] = useState('verify');
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    new_password: '',
    new_password_confirm: '',
  });

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp(email, otp);
      setResetToken(res.data.reset_token);
      setStep('reset');
      toast.success('OTP verified');
    } catch (error) {
      console.error('OTP verification failed:', error);
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.resetPassword(
        email,
        resetToken,
        passwords.new_password,
        passwords.new_password_confirm
      );
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (error) {
      console.error('Password reset failed:', error);
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white shadow rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Reset Password</h2>
        {step === 'verify' ? (
          <>
            <p className="text-sm text-gray-600 mb-6">Enter the OTP sent to your email.</p>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter OTP"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-6">Set your new password.</p>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwords.new_password}
                  onChange={(e) =>
                    setPasswords({ ...passwords, new_password: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwords.new_password_confirm}
                  onChange={(e) =>
                    setPasswords({ ...passwords, new_password_confirm: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <div className="mt-4 text-sm text-center">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Request a new OTP
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
