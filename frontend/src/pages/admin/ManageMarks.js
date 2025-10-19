import React, { useEffect, useState } from 'react';
import { markAPI, classAPI, subjectAPI, studentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ManageMarks = () => {
  const toast = useToast();
  const [marks, setMarks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ class_assigned:'', subject:'', student:'' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFilters(); fetchMarks(); }, []);
  const loadFilters = async () => {
    try { const [cRes, sRes, stRes] = await Promise.all([classAPI.getAll(), subjectAPI.getAll(), studentAPI.getAll()]); setClasses(cRes.data); setSubjects(sRes.data); setStudents(stRes.data); }
    catch(e){ console.error(e); }
  };
  const fetchMarks = async () => {
    try { setLoading(true); const res = await markAPI.getAll(Object.fromEntries(Object.entries(filters).filter(([,v])=>v))); setMarks(res.data); }
    catch(e){ console.error(e); toast.error('Failed to load marks'); }
    finally { setLoading(false); }
  };
  const publish = async (id) => {
    try { await markAPI.publish(id); setMarks(marks.map(m=> m.id===id ? { ...m, published: true } : m)); toast.success('Published'); }
    catch(e){ console.error(e); toast.error('Failed to publish'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Marks</h1>
          <button onClick={fetchMarks} className="px-4 py-2 bg-blue-600 text-white rounded">Refresh</button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={filters.class_assigned} onChange={(e)=>setFilters({...filters, class_assigned:e.target.value})} className="px-3 py-2 border rounded"><option value="">All Classes</option>{classes.map(c=>(<option key={c.id} value={c.id}>{c.name}{c.section?` - ${c.section}`:''}</option>))}</select>
          <select value={filters.subject} onChange={(e)=>setFilters({...filters, subject:e.target.value})} className="px-3 py-2 border rounded"><option value="">All Subjects</option>{subjects.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}</select>
          <select value={filters.student} onChange={(e)=>setFilters({...filters, student:e.target.value})} className="px-3 py-2 border rounded"><option value="">All Students</option>{students.map(s=>(<option key={s.id} value={s.id}>{s.user.first_name} {s.user.last_name}</option>))}</select>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">Student</th>
                    <th className="px-6 py-3 text-left">Class</th>
                    <th className="px-6 py-3 text-left">Subject</th>
                    <th className="px-6 py-3 text-left">Exam</th>
                    <th className="px-6 py-3 text-left">Score</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {marks.map(m => (
                    <tr key={m.id}>
                      <td className="px-6 py-3">{m.student_name}</td>
                      <td className="px-6 py-3">{m.class_name}</td>
                      <td className="px-6 py-3">{m.subject_name}</td>
                      <td className="px-6 py-3">{m.exam_name}</td>
                      <td className="px-6 py-3">{m.score} / {m.max_score}</td>
                      <td className="px-6 py-3">{m.date}</td>
                      <td className="px-6 py-3">{m.published ? 'Published' : 'Draft'}</td>
                      <td className="px-6 py-3 space-x-2">{!m.published && (<button onClick={()=>publish(m.id)} className="px-3 py-1 bg-green-600 text-white rounded">Publish</button>)}</td>
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

export default ManageMarks;

