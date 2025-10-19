import React, { useState, useEffect } from 'react';
import { teacherAPI, studentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import TeacherApprovalModal from '../../components/TeacherApprovalModal';

const ManagePending = () => {
  const toast = useToast();
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teachers');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Pending Registrations</h1>

        {/* Tabs */}
        <div className="mb-6 border-b">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'teachers'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Teachers ({pendingTeachers.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'students'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Students ({pendingStudents.length})
          </button>
        </div>

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {pendingTeachers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No pending teacher registrations
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingTeachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {teacher.user.first_name} {teacher.user.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{teacher.user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{teacher.user.phone || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{teacher.nid}</td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleApproveTeacher(teacher)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Approve & Assign
                          </button>
                          <button
                            onClick={() => handleReject(teacher.id, 'teacher')}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
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
            {pendingStudents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No pending student registrations
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.user.first_name} {student.user.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{student.user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{student.user.phone || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.student_class?.name || 'Not Assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleApproveStudent(student.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(student.id, 'student')}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
