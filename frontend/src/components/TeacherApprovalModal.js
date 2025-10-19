import React, { useState, useEffect } from 'react';
import { subjectAPI, classAPI, teacherAssignmentAPI } from '../services/api';

const TeacherApprovalModal = ({ teacher, onClose, onApprove }) => {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([{ subject_id: '', class_id: '' }]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        subjectAPI.getAll(),
        classAPI.getAll(),
      ]);
      setSubjects(sRes.data);
      setClasses(cRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addAssignment = () => {
    setAssignments([...assignments, { subject_id: '', class_id: '' }]);
  };

  const removeAssignment = (index) => {
    if (assignments.length > 1) {
      setAssignments(assignments.filter((_, i) => i !== index));
    }
  };

  const updateAssignment = (index, field, value) => {
    const updated = [...assignments];
    updated[index][field] = value;
    setAssignments(updated);
  };

  const handleApprove = async () => {
    const validAssignments = assignments.filter(a => a.subject_id && a.class_id);

    if (validAssignments.length === 0) {
      alert('Please assign at least one subject to at least one class before approving');
      return;
    }

    setSubmitting(true);
    try {
      // Create assignments first
      await teacherAssignmentAPI.bulkAssign(teacher.id, validAssignments);
      // Then approve
      await onApprove();
    } catch (e) {
      console.error(e);
      alert('Failed to approve teacher. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Approve Teacher: {teacher.user.first_name} {teacher.user.last_name}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Assign at least one subject to at least one class before approving
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-4">
                {assignments.map((assignment, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-4 border rounded-lg bg-gray-50">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject *
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class *
                      </label>
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
                      {index === assignments.length - 1 && (
                        <button
                          onClick={addAssignment}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          + Add
                        </button>
                      )}
                      {assignments.length > 1 && (
                        <button
                          onClick={() => removeAssignment(index)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> You must assign at least one subject to one class before this teacher can be approved.
                    The teacher will be able to login and access only the assigned subject-class combinations.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={submitting || loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Approving...' : 'Approve Teacher'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherApprovalModal;
