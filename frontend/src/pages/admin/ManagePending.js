import React, { useState, useEffect } from 'react';
import { teacherAPI, studentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import TeacherApprovalModal from '../../components/TeacherApprovalModal';
import { FaCheck, FaTimes, FaEye, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import Avatar from '../../components/Avatar';

const ManagePending = () => {
  const toast = useToast();
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('both'); // 'students', 'teachers', or 'both'
  const [approvalModalTeacher, setApprovalModalTeacher] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const [teachersRes, studentsRes] = await Promise.all([
        teacherAPI.getPending(),
        studentAPI.getPending()
      ]);
      setPendingTeachers(teachersRes.data);
      setPendingStudents(studentsRes.data);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTeacher = (teacher) => {
    // Open modal for teacher assignment
    setApprovalModalTeacher(teacher);
  };

  const handleApproveStudent = async (id) => {
    if (!window.confirm('Are you sure you want to approve this student?')) return;

    try {
      await studentAPI.approve(id);
      setPendingStudents(pendingStudents.filter(s => s.id !== id));
      toast.success('Student approved');
    } catch (error) {
      console.error('Error approving student:', error);
      toast.error('Failed to approve student');
    }
  };

  const completeTeacherApproval = async () => {
    try {
      await teacherAPI.approve(approvalModalTeacher.id);
      setPendingTeachers(pendingTeachers.filter(t => t.id !== approvalModalTeacher.id));
      setApprovalModalTeacher(null);
      toast.success('Teacher approved with subject assignments!');
    } catch (error) {
      console.error('Error approving teacher:', error);
      toast.error('Failed to approve teacher');
      throw error;
    }
  };

  const handleReject = async (id, type) => {
    if (!window.confirm('Are you sure you want to reject this user?')) return;
    
    try {
      if (type === 'teacher') {
        await teacherAPI.reject(id);
        setPendingTeachers(pendingTeachers.filter(t => t.id !== id));
      } else {
        await studentAPI.reject(id);
        setPendingStudents(pendingStudents.filter(s => s.id !== id));
      }
      toast.success('User rejected');
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pending Registrations</h1>
            <p className="text-sm text-gray-600 mt-1">Review and approve user registrations</p>
          </div>
          
          {/* View Mode Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Show:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="both">Both (All Pending)</option>
              <option value="students">Students Only</option>
              <option value="teachers">Teachers Only</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">Total Pending</p>
                <p className="text-3xl font-bold">{pendingTeachers.length + pendingStudents.length}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Pending Students</p>
                <p className="text-3xl font-bold">{pendingStudents.length}</p>
              </div>
              <FaUserGraduate className="text-white text-opacity-20 text-5xl" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Pending Teachers</p>
                <p className="text-3xl font-bold">{pendingTeachers.length}</p>
              </div>
              <FaChalkboardTeacher className="text-white text-opacity-20 text-5xl" />
            </div>
          </div>
        </div>

        {/* Students Section */}
        {(viewMode === 'students' || viewMode === 'both') && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaUserGraduate /> Pending Students ({pendingStudents.length})
                </h2>
              </div>
              {pendingStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No pending student registrations
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar 
                                image={student.user?.image}
                                name={`${student.user?.first_name} ${student.user?.last_name}`}
                                size="md"
                                className="mr-3"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {student.user?.first_name} {student.user?.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{student.user?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.user?.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.student_class?.name || 'Not Assigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.session || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.roll_number || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleApproveStudent(student.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <FaCheck size={18} />
                              </button>
                              <button
                                onClick={() => handleReject(student.id, 'student')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <FaTimes size={18} />
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
          </div>
        )}

        {/* Teachers Section */}
        {(viewMode === 'teachers' || viewMode === 'both') && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaChalkboardTeacher /> Pending Teachers ({pendingTeachers.length})
                </h2>
              </div>
              {pendingTeachers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No pending teacher registrations
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preferred Subject</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingTeachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar 
                                image={teacher.user?.image}
                                name={`${teacher.user?.first_name} ${teacher.user?.last_name}`}
                                size="md"
                                className="mr-3"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {teacher.user?.first_name} {teacher.user?.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{teacher.user?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {teacher.user?.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {teacher.teacher_id || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {teacher.designation || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {teacher.nid || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {teacher.preferred_subject_detail
                              ? `${teacher.preferred_subject_detail.name}`
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleApproveTeacher(teacher)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve & Assign"
                              >
                                <FaCheck size={18} />
                              </button>
                              <button
                                onClick={() => handleReject(teacher.id, 'teacher')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <FaTimes size={18} />
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
          </div>
        )}

        {/* Teacher Approval Modal */}
        {approvalModalTeacher && (
          <TeacherApprovalModal
            teacher={approvalModalTeacher}
            onClose={() => setApprovalModalTeacher(null)}
            onApprove={completeTeacherApproval}
          />
        )}
      </div>
    </div>
  );
};

export default ManagePending;
