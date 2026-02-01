
import os

content = r'''import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { teacherAPI, studentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { FaEye, FaPen, FaTrash, FaBan, FaCheckCircle } from 'react-icons/fa';

const ManageUsers = () => {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Parse query params for active tab
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'students') return 'students';
    return 'teachers';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.search]);

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/admin/users?tab=${tab}`);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (activeTab === 'teachers') {
          const teachersRes = await teacherAPI.getAll();
          const visibleTeachers = teachersRes.data.filter(t => t.user.status === 'approved');
          setTeachers(visibleTeachers);
      } else {
          const studentsRes = await studentAPI.getAll();
          const visibleStudents = studentsRes.data.filter(s => s.user.status === 'approved');
          setStudents(visibleStudents);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      if (type === 'teacher') {
        await teacherAPI.delete(id);
        setTeachers(teachers.filter(t => t.id !== id));
      } else {
        await studentAPI.delete(id);
        setStudents(students.filter(s => s.id !== id));
      }
      toast.success('User deleted');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (id, type) => {
      try {
          if (type === 'teacher') {
              const res = await teacherAPI.toggleStatus(id);
              setTeachers(teachers.map(t => 
                  t.id === id ? { ...t, user: { ...t.user, is_active: res.data.is_active } } : t
              ));
              toast.success(res.data.message);
          } else {
              const res = await studentAPI.toggleStatus(id);
              setStudents(students.map(s => 
                  s.id === id ? { ...s, user: { ...s.user, is_active: res.data.is_active } } : s
              ));
              toast.success(res.data.message);
          }
      } catch (error) {
          console.error('Error toggling status:', error);
          toast.error('Failed to update status');
      }
  };

  if (loading && teachers.length === 0 && students.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
            <div className="flex gap-2">
                <button
                    onClick={() => navigate('/register/teacher')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                    Add Teacher
                </button>
                <button
                    onClick={() => navigate('/register/student')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                    Add Student
                </button>
            </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b flex space-x-2">
          <button
            onClick={() => handleTabChange('teachers')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'teachers'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            Teachers
          </button>
          <button
            onClick={() => handleTabChange('students')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'students'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            Students
          </button>
        </div>

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {teachers.length === 0 && !loading ? (
              <div className="p-8 text-center text-gray-500">
                No approved teachers found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teachers.map((teacher) => (
                      <tr key={teacher.id} className={`hover:bg-gray-50 ${!teacher.user.is_active ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                                {teacher.user.image ? (
                                    <img src={teacher.user.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                        {teacher.user.first_name?.[0]}{teacher.user.last_name?.[0]}
                                    </div>
                                )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {teacher.user.first_name} {teacher.user.last_name}
                              </div>
                              {!teacher.user.is_active && (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Blocked
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col">
                              <span><strong>Email:</strong> {teacher.user.email}</span>
                              <span className="text-gray-500"><strong>Mobile:</strong> {teacher.user.phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {teacher.designation || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                              <button
                                onClick={() => navigate(`/admin/teachers/edit/${teacher.id}`)}
                                className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                                title="View/Edit"
                              >
                                <FaEye size={18} />
                              </button>
                              <button
                                onClick={() => navigate(`/admin/teachers/edit/${teacher.id}`)}
                                className="text-amber-600 hover:text-amber-900 p-2 rounded hover:bg-amber-50"
                                title="Edit"
                              >
                                <FaPen size={17} />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(teacher.id, 'teacher')}
                                className={`${teacher.user.is_active ? 'text-gray-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'} p-2 rounded hover:bg-gray-100`}
                                title={teacher.user.is_active ? "Block User" : "Activate User"}
                              >
                                {teacher.user.is_active ? <FaBan size={17} /> : <FaCheckCircle size={17} />}
                              </button>
                              <button
                                onClick={() => handleDelete(teacher.id, 'teacher')}
                                className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                                title="Delete"
                              >
                                <FaTrash size={17} />
                              </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {students.length === 0 && !loading ? (
              <div className="p-8 text-center text-gray-500">
                No approved students found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">Class Info</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/6">Roll No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/6">Contact</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase w-1/6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => {
                         const className = student.student_class?.name || 'N/A';
                         const section = student.student_class?.section || 'N/A';
                         const session = student.student_class?.year || 'N/A';
                         
                         return (
                          <tr key={student.id} className={`hover:bg-gray-50 ${!student.user.is_active ? 'bg-red-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                    {student.user.image ? (
                                        <img src={student.user.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                                            {student.user.first_name?.[0]}{student.user.last_name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.user.first_name} {student.user.last_name}
                                  </div>
                                  {!student.user.is_active && (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                      Blocked
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className="block font-medium text-gray-700">Class: {className}</span>
                                <span className="block text-xs">Sec: {section} | Session: {session}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.roll_number || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.user.phone || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => navigate(`/admin/students/edit/${student.id}`)}
                                    className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                                    title="View"
                                  >
                                    <FaEye size={18} />
                                  </button>
                                  <button
                                    onClick={() => navigate(`/admin/students/edit/${student.id}`)}
                                    className="text-amber-600 hover:text-amber-900 p-2 rounded hover:bg-amber-50"
                                    title="Edit"
                                  >
                                    <FaPen size={17} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(student.id, 'student')}
                                    className={`${student.user.is_active ? 'text-gray-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'} p-2 rounded hover:bg-gray-100`}
                                    title={student.user.is_active ? "Block User" : "Activate User"}
                                  >
                                    {student.user.is_active ? <FaBan size={17} /> : <FaCheckCircle size={17} />}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(student.id, 'student')}
                                    className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                                    title="Delete"
                                  >
                                    <FaTrash size={17} />
                                  </button>
                              </div>
                            </td>
                          </tr>
                         );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
'''

with open('/home/fahimaloy/Projects/omar/frontend/src/pages/admin/ManageUsers.js', 'w') as f:
    f.write(content)
