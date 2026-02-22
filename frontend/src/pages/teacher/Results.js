import React, { useEffect, useMemo, useState } from 'react';
import { examAPI, studentAPI, resultSubmissionAPI, teacherAssignmentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';

const TeacherResults = () => {
    const toast = useToast();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Selection State
    const [selectedExam, setSelectedExam] = useState(null);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    
    // Marks Entry State
    const [students, setStudents] = useState([]);
    const [scores, setScores] = useState({});
    const [maxScore, setMaxScore] = useState(100);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            const res = await examAPI.getAll(); 
            // The API already filters for exams where teacher has assignments
            setExams(res.data || []);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load exams');
        } finally {
            setLoading(false);
        }
    };

    // When exam is selected, filter subjects to only those taught by this teacher in this class
    useEffect(() => {
        if (!selectedExam) {
            setAvailableSubjects([]);
            return;
        }

        const fetchMySubjects = async () => {
            try {
                // We need to know which subjects this teacher teaches for this specific class
                const assignments = await teacherAssignmentAPI.getAll({ 
                     class_id: selectedExam.class_assigned
                });
                
                // Get subject IDs from assignments
                const mySubjectIds = new Set(assignments.data.map(a => a.subject));
                
                // Filter exam schedules to find intersection
                const validSubjects = selectedExam.schedules.filter(sch => 
                    mySubjectIds.has(sch.subject)
                ).map(sch => ({
                    id: sch.subject,
                    name: sch.subject_name,
                    code: sch.subject_code,
                    date: sch.date
                }));
                
                setAvailableSubjects(validSubjects);
            } catch (e) {
                console.error(e);
                toast.error('Failed to load eligible subjects');
            }
        };
        fetchMySubjects();
    }, [selectedExam, toast]);

    const handleExamSelect = (exam) => {
        setSelectedExam(exam);
        setSelectedSubject('');
        setStudents([]);
        setScores({});
    };

    const handleSubjectSelect = async (subjectId) => {
        setSelectedSubject(subjectId);
        if(!subjectId) return;

        setLoadingStudents(true);
        try {
            const res = await studentAPI.getByClass(selectedExam.class_assigned);
            setStudents(res.data || []);
            // TODO: ideally fetch existing marks if any
        } catch (e) {
            console.error(e);
            toast.error('Failed to load students');
        } finally {
            setLoadingStudents(false);
        }
    };

    const save = async () => {
        if (!selectedExam || !selectedSubject || saving) return;

        const payloadScores = students
            .map((student) => ({
                student_id: student.id,
                score: scores[student.id] !== undefined && scores[student.id] !== ''
                    ? Number(scores[student.id])
                    : null,
            }))
            .filter((item) => item.score !== null && !Number.isNaN(item.score));

        if (payloadScores.length === 0) {
            toast.info('Enter scores before submitting');
            return;
        }

        try {
            setSaving(true);
            await resultSubmissionAPI.submit({
                exam_id: selectedExam.id,
                subject_id: Number(selectedSubject),
                class_id: selectedExam.class_assigned,
                max_score: Number(maxScore),
                scores: payloadScores,
            });
            toast.success('Results submitted successfully');
            setScores({});
            setSelectedSubject('');
            setSelectedExam(null);
        } catch (e) {
            console.error(e);
            toast.error('Failed to submit results');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Exams...</div>;

    if (selectedExam) {
        return (
            <div className="container mx-auto p-4 max-w-4xl">
                <button onClick={() => setSelectedExam(null)} className="mb-4 text-blue-600 hover:underline">← Back to Exams</button>
                
                <div className="bg-white p-6 rounded shadow mb-6">
                    <h1 className="text-2xl font-bold mb-2">{selectedExam.title}</h1>
                    <p className="text-gray-600 mb-4">Class: {selectedExam.class_name}</p>
                    
                    <div className="flex gap-4 items-end mb-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Select Subject</label>
                            <select 
                                value={selectedSubject} 
                                onChange={(e) => handleSubjectSelect(e.target.value)}
                                className="w-full border p-2 rounded"
                            >
                                <option value="">-- Choose Subject --</option>
                                {availableSubjects.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.code}) - {s.date}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-32">
                             <label className="block text-sm font-medium mb-1">Max Score</label>
                             <input 
                                type="number" 
                                value={maxScore} 
                                onChange={e => setMaxScore(e.target.value)}
                                className="w-full border p-2 rounded"
                             />
                        </div>
                    </div>
                </div>

                {selectedSubject && (
                    <div className="bg-white rounded shadow overflow-hidden">
                        {loadingStudents ? (
                            <div className="p-8 text-center text-gray-500">Loading Students...</div>
                        ) : (
                            <>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obtained Marks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {students.map(std => (
                                            <tr key={std.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{std.roll_number || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar image={std.user?.image} name={`${std.user?.first_name || ''} ${std.user?.last_name || ''}`} size="sm" />
                                                        <span>{std.user.first_name} {std.user.last_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <input 
                                                        type="number" 
                                                        className="border p-1 w-24 rounded"
                                                        placeholder={`/ ${maxScore}`}
                                                        value={scores[std.id] || ''}
                                                        onChange={e => setScores({...scores, [std.id]: e.target.value})}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="p-4 bg-gray-50 flex justify-end">
                                    <button 
                                        onClick={save} 
                                        disabled={saving}
                                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {saving ? 'Submitting...' : 'Submit Result'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Result Entry</h1>
            <div className="bg-white rounded shadow overflow-hidden">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {exams.map(exam => (
                            <tr key={exam.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exam.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.class_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(exam.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleExamSelect(exam)} className="text-blue-600 hover:text-blue-900">Add Result</button>
                                </td>
                            </tr>
                        ))}
                         {exams.length === 0 && (
                            <tr><td colSpan="4" className="p-4 text-center text-gray-500">No exams pending for your classes.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherResults;

