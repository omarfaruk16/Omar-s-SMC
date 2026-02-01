import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, API_BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const apiRoot = API_BASE_URL.replace(/\/api\/?$/, '');
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

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
      const studentFields = [
        'bangla_name',
        'date_of_birth',
        'address',
        'village',
        'post_office',
        'guardian_name',
        'guardian_phone',
        'guardian_monthly_income',
        'fathers_name',
        'fathers_nid',
        'fathers_occupation',
        'mothers_name',
        'mothers_nid',
        'mothers_occupation',
      ];
      const teacherFields = ['nid', 'designation'];
      const allowedFields = [
        ...baseFields,
        ...(isStudent ? studentFields : []),
        ...(isTeacher ? teacherFields : []),
      ];

      let payload = {};
      allowedFields.forEach((field) => {
        if (profile[field] === undefined) return;
        if (field === 'date_of_birth' && !profile[field]) return;
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
    
    // Skip if all password fields are empty
    if (!passwordData.current_password && !passwordData.new_password && !passwordData.new_password_confirm) {
      toast.info('No password changes to save');
      return;
    }

    // Validate all fields are filled if any is filled
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.new_password_confirm) {
      toast.error('Please fill in all password fields');
      return;
    }

    setPasswordLoading(true);
    try {
      await authAPI.changePassword(passwordData);
      toast.success('Password updated');
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (error) {
      console.error('Password update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update password');
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

            {isStudent && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class <span className="text-gray-500 text-xs">(Read-only)</span>
                    </label>
                    <input
                      value={profile.student_class_detail?.name || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Roll Number <span className="text-gray-500 text-xs">(Read-only)</span>
                    </label>
                    <input
                      value={profile.roll_number || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration <span className="text-gray-500 text-xs">(Read-only)</span>
                    </label>
                    <input
                      value={profile.registration || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session <span className="text-gray-500 text-xs">(Read-only)</span>
                    </label>
                    <input
                      value={profile.session || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bangla Name</label>
                    <input
                      name="bangla_name"
                      value={profile.bangla_name || ''}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="বাংলা নাম"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      name="date_of_birth"
                      type="date"
                      value={profile.date_of_birth || ''}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                    <input
                      name="village"
                      value={profile.village || ''}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Village"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Post Office</label>
                    <input
                      name="post_office"
                      value={profile.post_office || ''}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Post Office"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={profile.address || ''}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={2}
                      placeholder="Full address"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Guardian Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                      <input
                        name="guardian_name"
                        value={profile.guardian_name || ''}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Guardian name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
                      <input
                        name="guardian_phone"
                        value={profile.guardian_phone || ''}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Guardian phone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Monthly Income</label>
                      <input
                        name="guardian_monthly_income"
                        type="number"
                        value={profile.guardian_monthly_income || ''}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Monthly income"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Father's Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                      <input
                        name="fathers_name"
                        value={profile.fathers_name || ''}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Father's name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father's NID</label>
                      <input
                        name="fathers_nid"
                        value={profile.fathers_nid || ''}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Father's NID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father's Occupation</label>
                      <input
                        name="fathers_occupation"
                        value={profile.fathers_occupation || ''}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Father's occupation"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Mother's Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                      <input
                        name="mothers_name"
                        value={profile.mothers_name || ''}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Mother's name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother's NID</label>
                      <input
                        name="mothers_nid"
                        value={profile.mothers_nid || ''}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Mother's NID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Occupation</label>
                      <input
                        name="mothers_occupation"
                        value={profile.mothers_occupation || ''}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Mother's occupation"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isTeacher && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NID</label>
                  <input
                    name="nid"
                    value={profile.nid || ''}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="NID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    name="designation"
                    value={profile.designation || ''}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Designation"
                  />
                </div>
              </div>
            )}

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                name="current_password"
                type="password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                name="new_password"
                type="password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                name="new_password_confirm"
                type="password"
                value={passwordData.new_password_confirm}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Confirm new password"
              />
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

export default Profile;
