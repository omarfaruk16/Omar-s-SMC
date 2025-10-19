import React, { useEffect, useState } from 'react';
import { classAPI, attendanceAPI, studentAPI, teacherAPI, subjectAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const TeacherAttendance = () => {
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [present, setPresent] = useState({});
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const tRes = await teacherAPI.getAll();
      const me = Array.isArray(tRes.data) && tRes.data.length > 0 ? tRes.data[0] : null;
      const cls = me?.assigned_classes || [];
      setClasses(cls);
      // preload subjects for assigned classes
      try { const sRes = await subjectAPI.getAll(); setSubjects(sRes.data); } catch(e) {}
    } catch (e) { console.error(e); toast.error('Failed to load classes'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) return;
      try {
        setLoading(true);
        const sRes = await studentAPI.getByClass(Number(selectedClass));
        const list = sRes.data;
        setStudents(list);
        setPresent(Object.fromEntries(list.map(s => [s.id, true])));
      } catch (e) { console.error(e); toast.error('Failed to load students'); }
      finally { setLoading(false); }
    };
    fetchStudents();
  }, [selectedClass]);

  const submit = async () => {
    try {
      const present_ids = Object.entries(present).filter(([,v])=>v).map(([k])=>Number(k));
      await attendanceAPI.mark(Number(selectedClass), date, present_ids, subject ? Number(subject) : undefined);
      toast.success('Attendance saved');
    } catch (e) { console.error(e); toast.error('Failed to save attendance'); }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Attendance</h1>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <select value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="" disabled>Select class</option>
            {classes.map(c => (<option key={c.id} value={c.id}>{c.name}{c.section?` - ${c.section}`:''}</option>))}
          </select>
          <select value={subject} onChange={(e)=>setSubject(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">(no subject)</option>
            {subjects.filter(s => !selectedClass || (s.classes || []).includes(Number(selectedClass))).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="px-3 py-2 border rounded-lg" />
          <button disabled={!selectedClass} onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Save</button>
        </div>
        {selectedClass && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Present: {Object.values(present).filter(Boolean).length} / {students.length}
              </div>
              <div className="space-x-2">
                <button onClick={()=>setPresent(Object.fromEntries(students.map(s=>[s.id,true])))} className="px-3 py-1 bg-green-100 text-green-800 rounded">Mark all present</button>
                <button onClick={()=>setPresent(Object.fromEntries(students.map(s=>[s.id,false])))} className="px-3 py-1 bg-red-100 text-red-800 rounded">Mark all absent</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {students.map(s => (
                <button key={s.id} onClick={()=>setPresent(p=>({...p,[s.id]: !p[s.id]}))} className={`flex items-center justify-between p-3 rounded border text-left ${present[s.id] ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div>
                    <p className="font-semibold">{s.user.first_name} {s.user.last_name}</p>
                    <p className="text-xs text-gray-500">{s.user.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${present[s.id] ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>{present[s.id] ? 'Present' : 'Absent'}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendance;
