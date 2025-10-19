import React, { useEffect, useState } from 'react';
import { teacherAPI, studentAPI, subjectAPI, attendanceAPI, markAPI, timetableAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const TeacherStudents = () => {
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [tRes, sRes, slRes] = await Promise.all([teacherAPI.getAll(), subjectAPI.getAll(), timetableAPI.getAll()]);
        const me = Array.isArray(tRes.data) && tRes.data.length > 0 ? tRes.data[0] : null;
        setClasses(me?.assigned_classes || []);
        setSubjects(sRes.data);
        setSlots(slRes.data);
      } catch (e) { console.error(e); toast.error('Failed to load initial data'); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedClass) { setStudents([]); setSelectedStudent(null); return; }
    (async () => {
      try {
        const res = await studentAPI.getByClass(Number(selectedClass));
        setStudents(res.data);
      } catch (e) { console.error(e); toast.error('Failed to load students'); }
    })();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedStudent || !selectedSubject) { setAttendance([]); setMarks([]); return; }
    (async () => {
      try {
        const [aRes, mRes] = await Promise.all([
          attendanceAPI.getAll({ student_id: selectedStudent.id, subject_id: Number(selectedSubject) }),
          markAPI.getAll({ student: selectedStudent.id, subject: Number(selectedSubject) }),
        ]);
        setAttendance(aRes.data);
        setMarks(mRes.data);
      } catch (e) { console.error(e); toast.error('Failed to load student data'); }
    })();
  }, [selectedStudent, selectedSubject]);

  // Allowed subjects are those the teacher actually teaches for the selected class (from timetable slots)
  const allowedSubjectIds = React.useMemo(() => {
    if (!selectedClass) return [];
    const ids = new Set(slots.filter(s => s.class_assigned === Number(selectedClass) && s.subject).map(s => s.subject));
    return Array.from(ids);
  }, [selectedClass, slots]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Students</h1>
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">Select Class</option>
            {classes.map(c => (<option key={c.id} value={c.id}>{c.name}{c.section?` - ${c.section}`:''}</option>))}
          </select>
          <select value={selectedSubject} onChange={(e)=>setSelectedSubject(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">Select Subject</option>
            {subjects
              .filter(s => !selectedClass || (s.classes || []).includes(Number(selectedClass)))
              .filter(s => !selectedClass || allowedSubjectIds.includes(s.id))
              .map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
          </select>
          <select value={selectedStudent?.id || ''} onChange={(e)=>setSelectedStudent(students.find(x=>x.id===Number(e.target.value)) || null)} className="px-3 py-2 border rounded-lg">
            <option value="">Select Student</option>
            {students.map(s => (<option key={s.id} value={s.id}>{s.user.first_name} {s.user.last_name}</option>))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-4">
            <h2 className="font-semibold mb-2">Students</h2>
            <div className="divide-y max-h-[480px] overflow-auto">
              {students.map(s => (
                <button key={s.id} onClick={()=>setSelectedStudent(s)} className={`w-full text-left p-3 ${selectedStudent?.id===s.id ? 'bg-blue-50' : ''}`}>
                  <div className="font-medium">{s.user.first_name} {s.user.last_name}</div>
                  <div className="text-xs text-gray-500">{s.user.email}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="font-semibold mb-2">Attendance</h2>
              {attendance.length === 0 ? (
                <div className="text-gray-500 text-sm">No attendance records for this subject.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map(a => (
                        <tr key={a.id} className="border-t">
                          <td className="px-4 py-2">{a.date}</td>
                          <td className="px-4 py-2">{a.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="font-semibold mb-2">Marks</h2>
              {marks.length === 0 ? (
                <div className="text-gray-500 text-sm">No marks recorded for this subject.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Exam</th>
                        <th className="px-4 py-2 text-left">Score</th>
                        <th className="px-4 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marks.map(m => (
                        <tr key={m.id} className="border-t">
                          <td className="px-4 py-2">{m.exam_name}</td>
                          <td className="px-4 py-2">{m.score} / {m.max_score}</td>
                          <td className="px-4 py-2">{m.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherStudents;
