import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherAPI, teacherAssignmentAPI, classAPI, subjectAPI } from '../../services/api'; 
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import { DESIGNATION_OPTIONS } from '../../constants/designations';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const TeacherEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    teacher_id: '',
    designation: '',
    nid: ''
  });
  
  const [newAssignment, setNewAssignment] = useState({
    class_id: '',
    subject_id: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teacherRes, classesRes, subjectsRes, assignmentsRes] = await Promise.all([
        teacherAPI.getById(id),
        classAPI.getAll(),
        subjectAPI.getAll(),
        teacherAssignmentAPI.getByTeacher(id)
      ]);

      const teacher = teacherRes.data;
      const user = teacher.user || {};

      // Set current image URL if exists
      if (user.image) {
        setCurrentImageUrl(user.image);
        setProfileImagePreview(user.image);
      }

      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        teacher_id: teacher.teacher_id || '',
        designation: teacher.designation || '',
        nid: teacher.nid || ''
      });

      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setAssignments(assignmentsRes.data || []);

    } catch (error) {
      console.error('Error fetching teacher data:', error);
      toast.error('Failed to load teacher details');
      navigate('/admin/users?tab=teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      let payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }
      
      // Handle profile image - create FormData if image is provided
      if (profileImage) {
        const formDataWithImage = new FormData();
        Object.keys(payload).forEach(key => {
          if (payload[key] !== null && payload[key] !== undefined && payload[key] !== '') {
            formDataWithImage.append(key, payload[key]);
          }
        });
        formDataWithImage.append('image', profileImage);
        payload = formDataWithImage;
      }
      
      await teacherAPI.update(id, payload);
      toast.success('Teacher profile updated');
    } catch (error) {
      console.error('Error updating teacher:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.class_id || !newAssignment.subject_id) {
      toast.error('Please select both class and subject');
      return;
    }
    
    try {
      await teacherAssignmentAPI.create({
        teacher: id,
        class_assigned: newAssignment.class_id,
        subject: newAssignment.subject_id
      });
      toast.success('Assignment added');
      // Refresh assignments
      const res = await teacherAssignmentAPI.getByTeacher(id);
      setAssignments(res.data);
      setNewAssignment({ class_id: '', subject_id: '' });
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('Failed to add assignment');
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this subject assignment?')) return;
    try {
      await teacherAssignmentAPI.delete(assignmentId);
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      toast.success('Assignment removed');
    } catch (error) {
      console.error('Delete error', error);
      toast.error('Failed to remove assignment');
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  // Filter subjects based on selected class for assignment
  const availableSubjects = newAssignment.class_id 
    ? subjects.filter(s => s.class_assigned === Number(newAssignment.class_id))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
              <h1 className="text-2xl font-bold">Edit Teacher</h1>
              <button 
                  onClick={() => navigate('/admin/users?tab=teachers')}
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded text-sm transition"
              >
                  Back to List
              </button>
          </div>

          <div className="border-b">
             <nav className="flex">
               <button
                 onClick={() => setActiveTab('profile')}
                 className={`px-6 py-4 text-sm font-medium ${activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Profile Information
               </button>
               <button
                 onClick={() => setActiveTab('assignments')}
                 className={`px-6 py-4 text-sm font-medium ${activeTab === 'assignments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Class & Subject Assignments
               </button>
             </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-3xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input type="text" name="first_name" value={formData.first_name} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg" required />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input type="text" name="last_name" value={formData.last_name} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg" required />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input type="email" name="email" value={formData.email} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg" required />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input type="text" name="phone" value={formData.phone} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password (optional)</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleProfileChange}
                              className="w-full px-3 py-2 pr-10 border rounded-lg"
                              placeholder="Leave blank to keep current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Teacher ID</label>
                          <input type="text" name="teacher_id" value={formData.teacher_id} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                          <select name="designation" value={formData.designation} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg">
                            <option value="">Select a designation</option>
                            {DESIGNATION_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">NID</label>
                          <input type="text" name="nid" value={formData.nid} onChange={handleProfileChange} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                  </div>

                  {/* Profile Picture */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture (Optional)
                    </label>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum file size: 5MB</p>

                    {/* Image preview */}
                    {profileImagePreview && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">
                          {currentImageUrl ? 'Current/Preview:' : 'Preview:'}
                        </p>
                        <Avatar
                          image={profileImagePreview}
                          name={`${formData.first_name} ${formData.last_name}`}
                          size="3xl"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end pt-4">
                      <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                          Save Profile
                      </button>
                  </div>
              </form>
            )}

            {activeTab === 'assignments' && (
              <div className="space-y-8">
                {/* Add New Assignment */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign New Subject</h3>
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                      <select 
                        value={newAssignment.class_id}
                        onChange={(e) => setNewAssignment({ class_id: e.target.value, subject_id: '' })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Select Class...</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name} {c.section ? `- ${c.section}` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <select 
                        value={newAssignment.subject_id}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, subject_id: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        disabled={!newAssignment.class_id}
                      >
                         <option value="">{newAssignment.class_id ? 'Select Subject...' : 'Select Class First'}</option>
                         {availableSubjects.map(s => (
                           <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                         ))}
                      </select>
                    </div>
                    <button 
                      onClick={handleAddAssignment}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 h-[42px]"
                    >
                      Add Assignment
                    </button>
                  </div>
                </div>

                {/* Current Assignments List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Assignments</h3>
                  {assignments.length === 0 ? (
                    <p className="text-gray-500 italic">No subjects assigned to this teacher yet.</p>
                  ) : (
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {assignments.map(assign => (
                            <tr key={assign.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {assign.class_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {assign.subject_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <button 
                                  onClick={() => handleRemoveAssignment(assign.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherEdit;
