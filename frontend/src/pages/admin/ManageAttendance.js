import React, { useEffect, useState } from 'react';
import { attendanceAPI, classAPI, subjectAPI, studentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ManageAttendance = () => {
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ class_id: '', subject_id: '', student_id: '', date_from: '', date_to: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFilters(); fetchRecords(); }, []);

  const loadFilters = async () => {
    try {
      const [cRes, sRes, stRes] = await Promise.all([classAPI.getAll(), subjectAPI.getAll(), studentAPI.getAll()]);
      setClasses(cRes.data);
      setSubjects(sRes.data);
      setStudents(stRes.data);
    } catch (e) { console.error(e); }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.getAll(Object.fromEntries(Object.entries(filters).filter(([,v]) => v)));
      setRecords(res.data);
    } catch (e) { console.error(e); toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <button onClick={fetchRecords} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Refresh</button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <select value={filters.class_id} onChange={(e)=>setFilters({...filters, class_id:e.target.value})} className="px-3 py-2 border rounded-lg">
            <option value="">All Classes</option>
            {classes.map(c => (<option key={c.id} value={c.id}>{c.name}{c.section?` - ${c.section}`:''}</option>))}
          </select>
          <select value={filters.subject_id} onChange={(e)=>setFilters({...filters, subject_id:e.target.value})} className="px-3 py-2 border rounded-lg">
            <option value="">All Subjects</option>
            {subjects.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
          <select value={filters.student_id} onChange={(e)=>setFilters({...filters, student_id:e.target.value})} className="px-3 py-2 border rounded-lg">
            <option value="">All Students</option>
            {students.map(s => (<option key={s.id} value={s.id}>{s.user.first_name} {s.user.last_name}</option>))}
          </select>
          <input type="date" value={filters.date_from} onChange={(e)=>setFilters({...filters, date_from:e.target.value})} className="px-3 py-2 border rounded-lg" />
          <input type="date" value={filters.date_to} onChange={(e)=>setFilters({...filters, date_to:e.target.value})} className="px-3 py-2 border rounded-lg" />
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No attendance records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map(r => (
                    <tr key={r.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{r.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{r.student_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{r.class_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{r.subject_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{r.status}</td>
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

export default ManageAttendance;

