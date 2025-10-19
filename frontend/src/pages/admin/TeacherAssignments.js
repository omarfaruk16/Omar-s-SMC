import React, { useEffect, useState } from 'react';
import { teacherAPI, teacherAssignmentAPI, subjectAPI, classAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const TeacherAssignments = () => {
  const toast = useToast();
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedAssignments, setSelectedAssignments] = useState([{ subject_id: '', class_id: '' }]);

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

  const addAssignmentRow = () => {
    setSelectedAssignments([...selectedAssignments, { subject_id: '', class_id: '' }]);
  };

  const removeAssignmentRow = (index) => {
    if (selectedAssignments.length > 1) {
      setSelectedAssignments(selectedAssignments.filter((_, i) => i !== index));
    }
  };

  const updateAssignment = (index, field, value) => {
    const updated = [...selectedAssignments];
    updated[index][field] = value;
    setSelectedAssignments(updated);
  };

  const handleBulkAssign = async () => {
    if (!selectedTeacher) {
      toast.error('Please select a teacher');
      return;
    }

    const validAssignments = selectedAssignments.filter(a => a.subject_id && a.class_id);
    if (validAssignments.length === 0) {
      toast.error('Please add at least one valid assignment');
      return;
    }

    try {
      await teacherAssignmentAPI.bulkAssign(selectedTeacher, validAssignments);
      toast.success(`${validAssignments.length} assignment(s) created!`);
      setSelectedTeacher('');
      setSelectedAssignments([{ subject_id: '', class_id: '' }]);
      loadAll();
    } catch (e) {
      console.error(e);
      toast.error('Failed to create assignments');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      await teacherAssignmentAPI.delete(id);
      toast.success('Assignment removed');
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove assignment');
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Teacher Subject Assignments</h1>

        {/* Assignment Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Assign Teacher to Subject-Class</h2>

          {/* Teacher Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Teacher *</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a teacher...</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.user.first_name} {t.user.last_name} ({t.user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Assignments */}
          <div className="space-y-3 mb-4">
            {selectedAssignments.map((assignment, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select
                    value={assignment.subject_id}
                    onChange={(e) => updateAssignment(index, 'subject_id', e.target.value)}
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
                    onChange={(e) => updateAssignment(index, 'class_id', e.target.value)}
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
                  {index === selectedAssignments.length - 1 && (
                    <button
                      onClick={addAssignmentRow}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      + Add More
                    </button>
                  )}
                  {selectedAssignments.length > 1 && (
                    <button
                      onClick={() => removeAssignmentRow(index)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleBulkAssign}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Assign to Teacher
          </button>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">Current Assignments</h2>
          </div>
          {assignments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No assignments yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map(a => (
                    <tr key={a.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {a.teacher_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {a.subject_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {a.class_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete(a.id)}
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
    </div>
  );
};

export default TeacherAssignments;
