import React, { useEffect, useState } from 'react';
import { teacherAPI, teacherAssignmentAPI, subjectAPI, classAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ManageTeacherAssignments = () => {
  const toast = useToast();
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [newAssignments, setNewAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [tRes, aRes, sRes, cRes] = await Promise.all([
        teacherAPI.getAll(),
        teacherAssignmentAPI.getAll(),
        subjectAPI.getAll(),
        classAPI.getAll(),
      ]);
      setTeachers(tRes.data.filter(t => t.user.status === 'approved'));
      setAssignments(aRes.data);
      setSubjects(sRes.data);
      setClasses(cRes.data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getTeacherAssignments = (teacherId) => {
    return assignments.filter(a => a.teacher === teacherId);
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher.id);
    setNewAssignments([{ subject_id: '', class_id: '' }]);
  };

  const handleCancelEdit = () => {
    setEditingTeacher(null);
    setNewAssignments([]);
  };

  const addNewAssignment = () => {
    setNewAssignments([...newAssignments, { subject_id: '', class_id: '' }]);
  };

  const updateNewAssignment = (index, field, value) => {
    const updated = [...newAssignments];
    updated[index][field] = value;
    setNewAssignments(updated);
  };

  const removeNewAssignmentRow = (index) => {
    if (newAssignments.length > 1) {
      setNewAssignments(newAssignments.filter((_, i) => i !== index));
    }
  };

  const handleSaveNewAssignments = async () => {
    const validAssignments = newAssignments.filter(a => a.subject_id && a.class_id);

    if (validAssignments.length === 0) {
      toast.error('Please add at least one valid assignment');
      return;
    }

    try {
      await teacherAssignmentAPI.bulkAssign(editingTeacher, validAssignments);
      toast.success(`${validAssignments.length} assignment(s) added!`);
      setEditingTeacher(null);
      setNewAssignments([]);
      loadAll();
    } catch (e) {
      console.error(e);
      toast.error('Failed to add assignments');
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this assignment?')) return;

    try {
      await teacherAssignmentAPI.delete(assignmentId);
      toast.success('Assignment removed');
      setAssignments(assignments.filter(a => a.id !== assignmentId));
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove assignment');
    }
  };

  const filteredTeachers = teachers.filter(t =>
    `${t.user.first_name} ${t.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Teacher Assignments</h1>
          <p className="text-gray-600">Quick actions to edit, add, or remove subject-class assignments for each teacher</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search teachers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Teachers List */}
        <div className="space-y-4">
          {filteredTeachers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              No approved teachers found
            </div>
          ) : (
            filteredTeachers.map(teacher => {
              const teacherAssignments = getTeacherAssignments(teacher.id);
              const isEditing = editingTeacher === teacher.id;

              return (
                <div key={teacher.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Teacher Header */}
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {teacher.user.first_name} {teacher.user.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">{teacher.user.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {teacherAssignments.length} Assignment{teacherAssignments.length !== 1 ? 's' : ''}
                        </span>
                        {!isEditing && (
                          <button
                            onClick={() => handleEditTeacher(teacher)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            + Add Subjects
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Current Assignments */}
                  <div className="px-6 py-4">
                    {teacherAssignments.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 bg-yellow-50 rounded-lg border border-yellow-200">
                        ⚠️ No subjects assigned to this teacher yet
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {teacherAssignments.map(assignment => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition"
                          >
                            <div>
                              <p className="font-semibold text-gray-900">{assignment.subject_name}</p>
                              <p className="text-sm text-gray-600">{assignment.class_name}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveAssignment(assignment.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Remove assignment"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add New Assignments Form */}
                  {isEditing && (
                    <div className="px-6 py-4 bg-gray-50 border-t">
                      <h4 className="font-semibold text-gray-900 mb-3">Add New Assignments</h4>
                      <div className="space-y-3 mb-4">
                        {newAssignments.map((assignment, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-3 bg-white rounded-lg border">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                              <select
                                value={assignment.subject_id}
                                onChange={(e) => updateNewAssignment(index, 'subject_id', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select subject...</option>
                                {subjects.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                              <select
                                value={assignment.class_id}
                                onChange={(e) => updateNewAssignment(index, 'class_id', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select class...</option>
                                {classes.map(c => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}{c.section ? ` - ${c.section}` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex space-x-2">
                              {index === newAssignments.length - 1 && (
                                <button
                                  onClick={addNewAssignment}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                >
                                  + Add
                                </button>
                              )}
                              {newAssignments.length > 1 && (
                                <button
                                  onClick={() => removeNewAssignmentRow(index)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSaveNewAssignments}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Save Assignments
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Unassigned Teachers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teachers.filter(t => getTeacherAssignments(t.id).length === 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageTeacherAssignments;
