import React, { useEffect, useMemo, useState } from 'react';
import { examAPI, timetableAPI, studentAPI, markAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const TeacherResults = () => {
  const toast = useToast();
  const [exams, setExams] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const [eRes, slRes] = await Promise.all([examAPI.getAll(), timetableAPI.getAll()]);
        setExams(eRes.data);
        setSlots(slRes.data);
      } catch (e) { console.error(e); toast.error('Failed to load exams'); }
    })();
  }, []);

  const allowedExams = useMemo(() => {
    const teachPairs = new Set(slots.filter(s => s.subject).map(s => `${s.class_assigned}-${s.subject}`));
    return exams.filter(ex => ex.subject && teachPairs.has(`${ex.class_assigned}-${ex.subject}`));
  }, [exams, slots]);

  useEffect(() => {
    if (!selectedExam) return;
    (async () => {
      try {
        const res = await studentAPI.getByClass(selectedExam.class_assigned);
        setStudents(res.data);
      } catch (e) { console.error(e); toast.error('Failed to load students'); }
    })();
  }, [selectedExam]);

  const save = async () => {
    if (!selectedExam) return;
    const payloads = students.map(s => ({
      student: s.id,
      class_assigned: selectedExam.class_assigned,
      subject: selectedExam.subject,
      exam_name: selectedExam.title,
      date: selectedExam.date,
      score: scores[s.id] !== undefined && scores[s.id] !== '' ? parseFloat(scores[s.id]) : NaN,
      max_score: 100,
    })).filter(p => !Number.isNaN(p.score));
    if (payloads.length === 0) { toast.info('Enter some scores to save'); return; }
    try {
      await Promise.all(payloads.map(p => markAPI.create(p)));
      toast.success('Marks saved (draft). Admin can publish them');
      setScores({});
    } catch (e) { console.error(e); toast.error('Failed to save marks'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Record Results</h1>
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={selectedExam?.id || ''} onChange={(e)=>{
            const ex = allowedExams.find(x => x.id === Number(e.target.value)) || null;
            setSelectedExam(ex);
          }} className="px-3 py-2 border rounded">
            <option value="">Select Exam</option>
            {allowedExams.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.title} · {ex.class_name} · {ex.subject_name} · {ex.date}</option>
            ))}
          </select>
          {selectedExam && (
            <div className="text-sm text-gray-600 flex items-center">Class: <span className="ml-1 font-medium">{selectedExam.class_name}</span></div>
          )}
          {selectedExam && (
            <div className="text-sm text-gray-600 flex items-center">Subject: <span className="ml-1 font-medium">{selectedExam.subject_name}</span></div>
          )}
        </div>
        {selectedExam && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Enter Scores</h2>
              <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
            {students.length === 0 ? (
              <div className="text-sm text-gray-500">No students in this class</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Student</th>
                      <th className="px-4 py-2 text-left">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className="border-t">
                        <td className="px-4 py-2">{s.user.first_name} {s.user.last_name}</td>
                        <td className="px-4 py-2">
                          <input type="number" min="0" max="100" value={scores[s.id] || ''} onChange={(e)=>setScores({...scores, [s.id]: e.target.value})} className="px-3 py-2 border rounded w-32" />
                        </td>
                      </tr>
                    ))}
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

export default TeacherResults;

