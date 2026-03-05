import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, API_BASE_URL } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const AdminProfile = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    new_password_confirm: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const apiRoot = API_BASE_URL.replace(/\/api\/?$/, '');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        setProfile(res.data);
        const imageUrl = res.data.image
          ? (res.data.image.startsWith('http') ? res.data.image : `${apiRoot}${res.data.image}`)
          : '';
        setImagePreview(imageUrl);
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [apiRoot, toast]);

  useEffect(() => {
    if (!imageFile) return;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imageFile, imagePreview]);

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const baseFields = ['first_name', 'last_name', 'email', 'phone'];
      let payload = {};
      baseFields.forEach((field) => {
        if (profile[field] === undefined) return;
        payload[field] = profile[field] ?? '';
      });

      if (imageFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          formData.append(key, value);
        });
        formData.append('image', imageFile);
        payload = formData;
      }

      const result = await updateProfile(payload);
      if (result.success) {
        toast.success('Profile updated');
        if (!imageFile && result.user?.image) {
          const imageUrl = result.user.image.startsWith('http')
            ? result.user.image
            : `${apiRoot}${result.user.image}`;
          setImagePreview(imageUrl);
        }
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordData.new_password && !passwordData.new_password_confirm) {
      toast.info('No password changes to save');
      return;
    }

    if (!passwordData.new_password || !passwordData.new_password_confirm) {
      toast.error('Please fill in both password fields');
      return;
    }

    if (passwordData.new_password !== passwordData.new_password_confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await authAPI.changePassword(passwordData);
      toast.success('Password updated');
      setPasswordData({
        new_password: '',
        new_password_confirm: '',
      });
    } catch (error) {
      console.error('Password update failed:', error);
      const errorMessage = error.response?.data?.non_field_errors?.[0] 
        || error.response?.data?.new_password?.[0]
        || error.response?.data?.message 
        || 'Failed to update password';
      toast.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Profile unavailable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  name="first_name"
                  value={profile.first_name || ''}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  name="last_name"
                  value={profile.last_name || ''}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={profile.email || ''}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  name="phone"
                  value={profile.phone || ''}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Phone"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
                <input type="file" accept="image/*" onChange={handleImageChange} />
              </div>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="w-16 h-16 rounded-full object-cover border"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
          <p className="text-sm text-gray-600 mb-4">Leave fields blank if you don't want to change your password.</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  name="new_password"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 pr-10 border rounded-lg"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  name="new_password_confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.new_password_confirm}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 pr-10 border rounded-lg"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
