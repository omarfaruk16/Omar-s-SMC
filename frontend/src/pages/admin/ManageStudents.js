import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, classAPI, subjectAPI, examAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';

const ManageStudents = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [classSubjects, setClassSubjects] = useState([]);
  const [recentExams, setRecentExams] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        studentAPI.getAll(),
        classAPI.getAll(),
      ]);
      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const studentClassId = student.student_class_detail?.id || student.student_class;
    const matchesClass = !filterClass || Number(studentClassId) === parseInt(filterClass);
    const matchesStatus = !filterStatus || student.user?.status === filterStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleViewDetails = (student) => {
    navigate(`/admin/students/${student.id}`);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setEditFormData({
      // User fields
      first_name: student.user?.first_name || '',
      last_name: student.user?.last_name || '',
      email: student.user?.email || '',
      phone: student.user?.phone || '',
      password: '',
      image: null,
      imagePreview: student.user?.image || null,
      // Student fields
      roll_number: student.roll_number || '',
      student_class: student.student_class?.id || '',
      address: student.address || '',
      date_of_birth: student.date_of_birth ? (String(student.date_of_birth).split('T')[0]) : '',
      gender: student.gender || '',
      registration: student.registration || '',
      session: student.session || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const formData = new FormData();

      // Append user fields
      if (editFormData.first_name !== undefined) formData.append('first_name', editFormData.first_name);
      if (editFormData.last_name !== undefined) formData.append('last_name', editFormData.last_name);
      if (editFormData.email !== undefined) formData.append('email', editFormData.email);
      if (editFormData.phone !== undefined) formData.append('phone', editFormData.phone);
      if (editFormData.password) formData.append('password', editFormData.password);
      if (editFormData.image instanceof File) formData.append('image', editFormData.image);

      // Append student fields
      if (editFormData.roll_number !== undefined) formData.append('roll_number', editFormData.roll_number);
      if (editFormData.student_class !== undefined) formData.append('student_class', editFormData.student_class);
      if (editFormData.address !== undefined) formData.append('address', editFormData.address);
      if (editFormData.date_of_birth !== undefined) formData.append('date_of_birth', editFormData.date_of_birth);
      if (editFormData.gender !== undefined) formData.append('gender', editFormData.gender);
      if (editFormData.registration !== undefined) formData.append('registration', editFormData.registration);
      if (editFormData.session !== undefined) formData.append('session', editFormData.session);

      await studentAPI.update(selectedStudent.id, formData);

      toast.success('Student information updated successfully');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student information');
    }
  };

  const handleSuspend = async (studentId) => {
    if (!window.confirm('Are you sure you want to suspend/activate this student?')) return;
    try {
      await studentAPI.suspend(studentId);
      toast.success('Student status updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error suspending student:', error);
      toast.error('Failed to update student status');
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
    try {
      await studentAPI.delete(studentId);
      toast.success('Student deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Manage Students</h1>
          
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name, email, or roll number..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filter by Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Class
                </label>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.section ? `${cls.name} - ${cls.section}` : cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Total Students</div>
              <div className="text-2xl font-bold text-gray-900">{students.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Approved</div>
              <div className="text-2xl font-bold text-green-600">
                {students.filter(s => s.user?.status === 'approved').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">
                {students.filter(s => s.user?.status === 'pending').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Suspended</div>
              <div className="text-2xl font-bold text-red-600">
                {students.filter(s => !s.user?.is_active).length}
              </div>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No students found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className={!student.user?.is_active ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.roll_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar 
                            image={student.user?.image}
                            name={`${student.user?.first_name} ${student.user?.last_name}`}
                            size="sm"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {student.user?.first_name} {student.user?.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.user?.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.student_class_detail
                            ? student.student_class_detail.section
                              ? `${student.student_class_detail.name} - ${student.student_class_detail.section}`
                              : student.student_class_detail.name
                            : 'Not Assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          student.user?.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : student.user?.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.user?.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          student.user?.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.user?.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleViewDetails(student)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-green-600 hover:text-green-800"
                          title="Edit"
                        >
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleSuspend(student.id)}
                          className={`${student.user?.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                          title={student.user?.is_active ? 'Suspend' : 'Activate'}
                        >
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {student.user?.is_active ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Name:</span>
                        <p className="font-medium">{selectedStudent.user?.first_name} {selectedStudent.user?.last_name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Email:</span>
                        <p className="font-medium">{selectedStudent.user?.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Phone:</span>
                        <p className="font-medium">{selectedStudent.user?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Roll Number:</span>
                        <p className="font-medium">{selectedStudent.roll_number || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Class:</span>
                        <p className="font-medium">
                          {selectedStudent.student_class_detail
                            ? selectedStudent.student_class_detail.section
                              ? `${selectedStudent.student_class_detail.name} - ${selectedStudent.student_class_detail.section}`
                              : selectedStudent.student_class_detail.name
                            : 'Not Assigned'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Session:</span>
                        <p className="font-medium">{selectedStudent.student_class_detail?.session || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Date of Birth:</span>
                        <p className="font-medium">{selectedStudent.date_of_birth || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Gender:</span>
                        <p className="font-medium">{selectedStudent.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Religion:</span>
                        <p className="font-medium">{selectedStudent.religion || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Blood Group:</span>
                        <p className="font-medium">{selectedStudent.blood_group || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Nationality:</span>
                        <p className="font-medium">{selectedStudent.nationality || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Address Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <span className="text-sm text-gray-500">Current Address:</span>
                        <p className="font-medium">{selectedStudent.address || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-gray-500">Permanent Address:</span>
                        <p className="font-medium">{selectedStudent.permanent_address || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">District:</span>
                        <p className="font-medium">{selectedStudent.district || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Upazilla/Thana:</span>
                        <p className="font-medium">{selectedStudent.upazilla_thana || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Post Code:</span>
                        <p className="font-medium">{selectedStudent.post_code || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Family Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Family Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Father's Name:</span>
                        <p className="font-medium">{selectedStudent.fathers_name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Father's NID:</span>
                        <p className="font-medium">{selectedStudent.fathers_nid || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Father's Occupation:</span>
                        <p className="font-medium">{selectedStudent.fathers_occupation || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Mother's Name:</span>
                        <p className="font-medium">{selectedStudent.mothers_name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Mother's NID:</span>
                        <p className="font-medium">{selectedStudent.mothers_nid || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Mother's Occupation:</span>
                        <p className="font-medium">{selectedStudent.mothers_occupation || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Guardian Name:</span>
                        <p className="font-medium">{selectedStudent.guardian_name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Guardian Phone:</span>
                        <p className="font-medium">{selectedStudent.guardian_phone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Guardian Monthly Income:</span>
                        <p className="font-medium">{selectedStudent.guardian_monthly_income ? `BDT ${selectedStudent.guardian_monthly_income}` : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Academic History */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Academic History (SSC)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Board:</span>
                        <p className="font-medium">{selectedStudent.ssc_board || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Registration No:</span>
                        <p className="font-medium">{selectedStudent.ssc_registration_no || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Group:</span>
                        <p className="font-medium">{selectedStudent.ssc_group || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Roll Number:</span>
                        <p className="font-medium">{selectedStudent.ssc_roll_number || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Year of Passing:</span>
                        <p className="font-medium">{selectedStudent.ssc_year_of_passing || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">GPA:</span>
                        <p className="font-medium">{selectedStudent.ssc_gpa || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Class Subjects */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Class Subjects</h3>
                    {classSubjects.length === 0 ? (
                      <p className="text-gray-600">No subjects assigned.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {classSubjects.map((subject) => (
                          <span key={subject.id} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                            {subject.name}{subject.code ? ` (${subject.code})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Exams */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Recent Exams (Published Status)</h3>
                    {recentExams.length === 0 ? (
                      <p className="text-gray-600">No exams found for this class.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {recentExams.map((exam) => (
                              <tr key={exam.id}>
                                <td className="px-4 py-2">{exam.title || 'Exam Routine'}</td>
                                <td className="px-4 py-2">{exam.subject_name || '—'}</td>
                                <td className="px-4 py-2">{exam.date || 'TBA'}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${exam.result_status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {exam.result_status === 'published' ? 'Published' : 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Student</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First column: User info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">User Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={editFormData.first_name}
                          onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={editFormData.last_name}
                          onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="text"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password (leave blank to keep)</label>
                        <input
                          type="password"
                          value={editFormData.password}
                          onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
                        {editFormData.imagePreview && (
                          <div className="mb-2">
                            <img src={editFormData.imagePreview} alt="preview" className="w-20 h-20 object-cover rounded-full" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                            setEditFormData({...editFormData, image: file, imagePreview: file ? URL.createObjectURL(file) : (selectedStudent.user?.image || null)});
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Second column: Student info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Student Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                        <input
                          type="text"
                          value={editFormData.roll_number}
                          onChange={(e) => setEditFormData({...editFormData, roll_number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select
                          value={editFormData.student_class}
                          onChange={(e) => setEditFormData({...editFormData, student_class: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Select Class</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.section ? `${cls.name} - ${cls.section}` : cls.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                          type="text"
                          value={editFormData.address}
                          onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={editFormData.date_of_birth}
                          onChange={(e) => setEditFormData({...editFormData, date_of_birth: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                          value={editFormData.gender}
                          onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Registration</label>
                        <input
                          type="text"
                          value={editFormData.registration}
                          onChange={(e) => setEditFormData({...editFormData, registration: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                        <input
                          type="text"
                          value={editFormData.session}
                          onChange={(e) => setEditFormData({...editFormData, session: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStudents;
