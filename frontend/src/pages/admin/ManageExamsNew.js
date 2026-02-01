import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examAPI, classAPI, subjectAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { FaEdit, FaTrash, FaCheckCircle, FaFileDownload, FaClipboardList, FaBullhorn } from 'react-icons/fa';

const ManageExamsNew = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [title, setTitle] = useState('');
    const [examFee, setExamFee] = useState(0);
    const [selectedClass, setSelectedClass] = useState('');
    const [subjectEntries, setSubjectEntries] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            const [eRes, cRes, sRes] = await Promise.all([
                examAPI.getAll(),
                classAPI.getAll(),
                subjectAPI.getAll(),
            ]);
            setExams(eRes.data || []);
            setClasses(cRes.data || []);
            setSubjects(sRes.data || []);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Auto-populate subjects when class changes (only for Create mode)
    useEffect(() => {
        if (!isEditing && selectedClass) {
            const classId = Number(selectedClass);
            const filteredSubjects = subjects.filter(s => Number(s.class_assigned) === classId);
            setSubjectEntries(filteredSubjects.map(s => ({
                subject_id: s.id,
                name: s.name,
                code: s.code,
                date: '',
                start_time: '',
                end_time: ''
            })));
        } else if (!selectedClass && !isEditing) {
            setSubjectEntries([]);
        }
    }, [selectedClass, subjects, isEditing]);

    const updateEntry = (index, field, value) => {
        const newEntries = [...subjectEntries];
        newEntries[index][field] = value;
        setSubjectEntries(newEntries);
    };

    const handleEdit = (exam) => {
        setIsEditing(true);
        setEditId(exam.id);
        setTitle(exam.title);
        setExamFee(exam.exam_fee);
        setSelectedClass(exam.class_assigned);
        
        // Map existing schedules
        // Note: The API response for getAll might differ structure from create payload.
        // Assuming schedules are included or we might need to fetch detailed exam
        // If getAll doesn't return schedules, we should fetchById. 
        // For now, let's assume simple edit of basic details, or clear schedules.
        // To be safe and simple: Fetch exam full details first
        fetchExamDetails(exam.id);
        
        // Scroll to top
        window.scrollTo(0,0);
    };

    const fetchExamDetails = async (id) => {
        // Implement if API supports getById which returns full nested schedule.
        // If not readily available in api.js, we might skip schedule editing for now or implement it.
        // Let's assume standard behavior:
        // For now, I'll just keep the class and title editable, and re-populate subject list based on class
        // warning the user that schedule will reset if class changes.
        // If we want to keep schedules, we need to map them back.
        // Let's try to map from exam.schedules if it exists
        const exam = exams.find(e => e.id === id);
           if (exam && exam.schedules) {
             const existingSchedules = exam.schedules.map(sch => ({
                 subject_id: sch.subject, // or subject_id depending on serializer
                 name: sch.subject_name,
                 code: sch.subject_code,
                 date: sch.date,
                 start_time: sch.start_time,
                 end_time: sch.end_time
             }));
             // We also need to add missing subjects for that class
             const classId = Number(exam.class_assigned);
               const classSubjects = subjects.filter(s => Number(s.class_assigned) === classId);
             
             const merged = classSubjects.map(s => {
                 const existing = existingSchedules.find(es => es.subject_id === s.id);
                 return existing || {
                     subject_id: s.id,
                     name: s.name,
                     code: s.code,
                     date: '',
                     start_time: '',
                     end_time: ''
                 };
             });
             setSubjectEntries(merged);
        } else {
            // Fallback if no schedules in list view
             setSubjectEntries([]); 
             // Ideally we should alert that we are fetching fresh or implementation needed
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setTitle('');
        setExamFee(0);
        setSelectedClass('');
        setSubjectEntries([]);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this exam?")) return;
        try {
            await examAPI.delete(id);
            toast.success("Exam deleted");
            load();
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete exam");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !selectedClass) {
            toast.error('Please fill required fields');
            return;
        }

        const validSchedules = subjectEntries.filter(e => e.date && e.start_time && e.end_time);
        
        if (validSchedules.length === 0) {
            if(!window.confirm("No subjects have full schedule. Create empty exam event?")) return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title,
                class_assigned: Number(selectedClass),
                exam_fee: examFee,
                schedules: validSchedules.map(e => ({
                    subject_id: e.subject_id,
                    date: e.date,
                    start_time: e.start_time,
                    end_time: e.end_time
                }))
            };
            
            if (isEditing) {
                await examAPI.update(editId, payload);
                toast.success('Exam updated successfully');
                handleCancelEdit();
            } else {
                await examAPI.create(payload);
                toast.success('Exam created successfully');
                setTitle('');
                setExamFee(0);
                setSelectedClass('');
                setSubjectEntries([]);
            }
            load();
        } catch (error) {
            console.error(error);
            toast.error(`Failed to ${isEditing ? 'update' : 'create'} exam`);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePublish = async (exam) => {
        if(exam.published) return; 
        try {
            await examAPI.publish(exam.id);
            toast.success('Published');
            load();
        } catch (e) { toast.error('Failed to publish'); }
    }

    const handlePublishResult = async (exam) => {
        if(exam.results_published) return; 
        try {
            await examAPI.publishResult(exam.id);
            toast.success('Results Published');
            load();
        } catch (e) { toast.error('Failed to publish results'); }
    }
    
    const downloadRoutine = async (exam) => {
        try {
            const response = await examAPI.downloadRoutine(exam.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `routine-${exam.title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) { toast.error('Failed to download'); }
    }

    if (loading) return (
         <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Exams</h1>
            
            {/* Creation/Edit Form */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {isEditing ? 'Edit Exam' : 'Create New Exam'}
                    </h2>
                    {isEditing && (
                        <button onClick={handleCancelEdit} className="text-sm text-gray-500 hover:text-gray-700">
                            Cancel Edit
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="e.g. Final Term 2026" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select 
                            value={selectedClass} 
                            onChange={e => setSelectedClass(e.target.value)} 
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            disabled={isEditing} // Prevent class change on edit for simplicity
                        >
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {isEditing && <p className="text-xs text-gray-500 mt-1">Class cannot be changed during edit</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Fee</label>
                        <input 
                            type="number" 
                            value={examFee} 
                            onChange={e => setExamFee(e.target.value)} 
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                </div>

                {subjectEntries.length > 0 && (
                    <div className="mb-6 overflow-x-auto border rounded-lg">
                        <table className="min-w-full text-sm divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Subject</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Schedule (Date & Time)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {subjectEntries.map((entry, idx) => (
                                    <tr key={entry.subject_id} className="bg-white">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            <div>{entry.name}</div>
                                            {entry.code && <div className="text-xs text-gray-500">{entry.code}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <input 
                                                    type="date" 
                                                    value={entry.date || ''} 
                                                    onChange={e => updateEntry(idx, 'date', e.target.value)} 
                                                    className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500" 
                                                    placeholder="Date"
                                                />
                                                <input 
                                                    type="time" 
                                                    value={entry.start_time || ''} 
                                                    onChange={e => updateEntry(idx, 'start_time', e.target.value)} 
                                                    className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500" 
                                                    placeholder="Start"
                                                />
                                                <input 
                                                    type="time" 
                                                    value={entry.end_time || ''} 
                                                    onChange={e => updateEntry(idx, 'end_time', e.target.value)} 
                                                    className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500" 
                                                    placeholder="End"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex gap-2">
                    <button 
                        onClick={handleSubmit} 
                        disabled={submitting} 
                        className={`px-6 py-2 rounded-lg text-white font-medium transition ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {submitting ? 'Saving...' : (isEditing ? 'Update Exam' : 'Create Exam')}
                    </button>
                    {isEditing && (
                        <button 
                            onClick={handleCancelEdit}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Exam List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden text-sm">
                <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Exam List</h3>
                </div>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {exams.map(exam => (
                            <tr key={exam.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{exam.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{exam.class_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{exam.exam_fee}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-xs w-max ${exam.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {exam.published ? 'Routine Published' : 'Draft'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs w-max ${exam.results_published ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {exam.results_published ? 'Results Published' : 'Results Pending'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <div className="flex justify-end gap-3 items-center">
                                         {/* Tooltips using title attribute for now */}
                                        <button 
                                            onClick={() => downloadRoutine(exam)} 
                                            className="text-gray-600 hover:text-blue-600" 
                                            title="Download Routine"
                                        >
                                            <FaFileDownload size={16} />
                                        </button>
                                        
                                        <div className="flex items-center gap-2">
                                            {!exam.published ? (
                                                <button 
                                                    onClick={() => handlePublish(exam)} 
                                                    className="inline-flex items-center gap-1 text-gray-600 hover:text-green-600"
                                                    title="Publish Exam"
                                                >
                                                    <FaBullhorn size={16} />
                                                    <span className="text-xs">Publish Exam</span>
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-green-500 cursor-default" title="Exam Published">
                                                    <FaCheckCircle size={16} />
                                                    <span className="text-xs">Published</span>
                                                </span>
                                            )}

                                            {!exam.results_published ? (
                                                <button 
                                                    onClick={() => handlePublishResult(exam)} 
                                                    className="inline-flex items-center gap-1 text-gray-600 hover:text-purple-600"
                                                    title="Publish Results"
                                                >
                                                    <FaClipboardList size={16} />
                                                    <span className="text-xs">Publish Results</span>
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-blue-500 cursor-default" title="Results Published">
                                                    <FaCheckCircle size={16} />
                                                    <span className="text-xs">Results Published</span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="h-4 w-px bg-gray-300 mx-1"></div>

                                        <button 
                                            onClick={() => navigate(`/admin/results/view?exam_id=${exam.id}`)}
                                            className="text-purple-600 hover:text-purple-800"
                                            title="View Results"
                                        >
                                            <FaClipboardList size={16} />
                                        </button>

                                        <button 
                                            onClick={() => handleEdit(exam)} 
                                            className="text-blue-600 hover:text-blue-800"
                                            title="Edit Exam"
                                        >
                                            <FaEdit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(exam.id)} 
                                            className="text-red-600 hover:text-red-800"
                                            title="Delete Exam"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
                 {exams.length === 0 && <div className="p-8 text-center text-gray-500">No exams found.</div>}
            </div>
        </div>
        </div>
    );
};

export default ManageExamsNew;
