import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { classAPI, subjectAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const [classData, setClassData] = useState(null);
  const [classSubjects, setClassSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSection, setNewSection] = useState('');
  
  // New Subject Creation State
  const [newSubjectData, setNewSubjectData] = useState({ name: '', code: '', description: '', is_fourth_subject: false });

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('addSubject') === '1') {
      setShowAddSubject(true);
    }
  }, [location.search]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      const classRes = await classAPI.getById(classId);
      setClassData(classRes.data);

      const allClassesRes = await classAPI.getAll();
      setAllClasses(allClassesRes.data || []);
      
      // Get all subjects filtered by class_assigned (new FK)
      const allSubjectsRes = await subjectAPI.getAll();
      // The updated backend might filter it for us if we passed a param, but for now filtering client-side
      const classSubjectsData = (allSubjectsRes.data || []).filter(subject => 
        (subject.class_assigned === parseInt(classId) || subject.class_assigned?.id === parseInt(classId))
      );
      
      setClassSubjects(classSubjectsData);
      setAvailableSubjects([]);
      
    } catch (err) {
      console.error('Failed to fetch class details:', err);
      toast.error('Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectData.name || !newSubjectData.code) {
      toast.error('Name and Code are required');
      return;
    }

    try {
      await subjectAPI.create({
        ...newSubjectData,
        class_assigned: parseInt(classId)
      });
      
      toast.success('Subject created successfully');
      setNewSubjectData({ name: '', code: '', description: '', is_fourth_subject: false });
      setShowAddSubject(false);
      fetchClassDetails();
    } catch (err) {
      console.error('Failed to create subject:', err);
      toast.error(err.response?.data?.detail || 'Failed to create subject.');
    }
  };

  const handleRemoveSubject = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject? This action cannot be undone.')) return;

    try {
      await subjectAPI.delete(subjectId);
      
      toast.success('Subject deleted successfully');
      fetchClassDetails();
    } catch (err) {
      console.error('Failed to delete subject:', err);
      toast.error('Failed to delete subject');
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSection.trim()) {
      toast.error('Please enter a section');
      return;
    }
    try {
      await classAPI.create({
        name: classData.name,
        section: newSection.trim(),
        session: classData.session || ''
      });
      toast.success('Section added');
      setNewSection('');
      setShowAddSection(false);
      fetchClassDetails();
    } catch (err) {
      console.error('Failed to add section:', err);
      toast.error('Failed to add section');
    }
  };


  const handleDeleteClass = async (id) => {
    if (!window.confirm('Delete this class entry?')) return;
    try {
      await classAPI.delete(id);
      toast.success('Class entry deleted');
      if (String(id) === String(classId)) {
        navigate('/admin/classes');
        return;
      }
      fetchClassDetails();
    } catch (err) {
      console.error('Failed to delete class entry:', err);
      toast.error('Failed to delete class entry');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Class Not Found</h1>
            <button
              onClick={() => navigate('/admin/classes')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Classes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/classes')}
            className="mb-4 px-3 py-1 text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            ← Back to Classes
          </button>
          <h1 className="text-4xl font-bold text-gray-900">
            {classData.name}
            {classData.section && <span className="text-gray-500 ml-2">- {classData.section}</span>}
          </h1>
          {classData.session && (
            <p className="text-gray-600 mt-2">Session: {classData.session}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Students</div>
            <div className="text-3xl font-bold text-gray-900">{classData.student_count || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Teachers</div>
            <div className="text-3xl font-bold text-gray-900">{classData.teacher_count || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Subjects</div>
            <div className="text-3xl font-bold text-gray-900">{classSubjects.length}</div>
          </div>
        </div>

        {/* Sections & Sessions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Sections & Sessions</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowAddSection((prev) => !prev)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                + Add Section
              </button>
            </div>
          </div>

          {showAddSection && (
            <div className="p-6 border-b bg-gray-50">
              <form onSubmit={handleAddSection} className="flex flex-col md:flex-row gap-3 items-start md:items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Section *</label>
                  <input
                    type="text"
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., B"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg">Add Section</button>
                <button type="button" onClick={() => setShowAddSection(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
              </form>
            </div>
          )}


          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allClasses
                  .filter((item) => item.name === classData.name)
                  .map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.section || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.session || '—'}</td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/classes/${item.id}`)}
                          className="px-3 py-1 bg-green-600 text-white rounded"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(item.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subjects Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Subjects</h2>
            {!showAddSubject && (
              <button
                onClick={() => setShowAddSubject(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Create Subject
              </button>
            )}
          </div>

          {/* Create Subject Form */}
          {showAddSubject && (
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Create New Subject</h3>
              <form onSubmit={handleCreateSubject} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                      <input
                        type="text"
                        required
                        value={newSubjectData.name}
                        onChange={(e) => setNewSubjectData({ ...newSubjectData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g. Higher Math Class 9"
                      />
                      <p className="text-xs text-gray-500 mt-1">Must be unique (e.g. include class name)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
                      <input
                        type="text"
                        required
                        value={newSubjectData.code}
                        onChange={(e) => setNewSubjectData({ ...newSubjectData, code: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g. 126"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={newSubjectData.description}
                        onChange={(e) => setNewSubjectData({ ...newSubjectData, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        rows="2"
                        placeholder="Optional description..."
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={newSubjectData.is_fourth_subject} 
                            onChange={(e) => setNewSubjectData({ ...newSubjectData, is_fourth_subject: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-900">Is Fourth Subject?</span>
                        </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Create Subject
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddSubject(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
            </div>
          )}

          {/* Subjects List */}
          <div className="p-6">
            {classSubjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No subjects assigned to this class yet.</p>
                {!showAddSubject && (
                  <button
                    onClick={() => setShowAddSubject(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Create First Subject
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {subject.name}
                        </h3>
                        {subject.code && (
                          <p className="text-sm text-gray-600">Code: {subject.code}</p>
                        )}
                        {subject.description && (
                          <p className="text-sm text-gray-600 mt-2">{subject.description}</p>
                        )}
                        {subject.fourth_subject_eligible && (
                          <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded mr-2">
                            4th Subject Eligible
                          </span>
                        )}
                        {subject.is_fourth_subject && (
                          <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            Is Fourth Subject
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveSubject(subject.id)}
                        className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove subject"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate('/admin/classes')}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Back to Classes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassDetails;
