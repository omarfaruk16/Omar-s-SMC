import React, { useEffect, useState } from 'react';
import { examAPI, classAPI, subjectAPI, teacherAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ManageExams = () => {
  const toast = useToast();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title:'', class_ids:[], papers:[{ subject:'', date:'', start_time:'', end_time:'', invigilator:'' }], description:'' });

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { setLoading(true); const [eRes, cRes, sRes, tRes] = await Promise.all([examAPI.getAll(), classAPI.getAll(), subjectAPI.getAll(), teacherAPI.getAll()]); setExams(eRes.data); setClasses(cRes.data); setSubjects(sRes.data); setTeachers(tRes.data); }
    catch(e){ console.error(e); toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      // Create one Exam per class per paper (subject/date/time)
      const payloads = [];
      form.class_ids.forEach((cid) => {
        form.papers.forEach((p) => {
          if (!p.subject || !p.date) return;
          payloads.push({
            title: form.title,
            class_assigned: cid,
            subject: Number(p.subject),
            date: p.date,
            start_time: p.start_time || null,
            end_time: p.end_time || null,
            description: form.description || '',
            invigilator: p.invigilator ? Number(p.invigilator) : null,
          });
        });
      });
      await Promise.all(payloads.map(pl => examAPI.create(pl)));
      toast.success('Exam schedule created');
      setForm({ title:'', class_ids:[], papers:[{ subject:'', date:'', start_time:'', end_time:'', invigilator:'' }], description:'' });
      load();
    }
    catch(e){ console.error(e); toast.error('Failed to create exam'); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this exam?')) return;
    try { await examAPI.delete(id); setExams(exams.filter(x=>x.id!==id)); toast.success('Exam deleted'); }
    catch(e){ console.error(e); toast.error('Failed to delete exam'); }
  };
  const publish = async (id) => {
    try {
      await examAPI.publish(id);
      setExams(exams.map(e => e.id === id ? { ...e, published: true } : e));
      toast.success('Exam published');
    } catch (e) {
      console.error(e);
      toast.error('Failed to publish exam');
    }
  };
  const unpublish = async (id) => {
    try {
      await examAPI.unpublish(id);
      setExams(exams.map(e => e.id === id ? { ...e, published: false } : e));
      toast.success('Exam unpublished');
    } catch (e) {
      console.error(e);
      toast.error('Failed to unpublish exam');
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Exams</h1>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Create Exam</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" placeholder="Exam Title (e.g., Mid Term)" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} className="px-3 py-2 border rounded" required />
              <select multiple value={form.class_ids} onChange={(e)=>setForm({...form, class_ids: Array.from(e.target.selectedOptions).map(o=>Number(o.value))})} className="px-3 py-2 border rounded h-28">
                {classes.map(c => (<option key={c.id} value={c.id}>{c.name}{c.section?` - ${c.section}`:''}</option>))}
              </select>
              <input type="text" placeholder="Description (optional)" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} className="px-3 py-2 border rounded" />
            </div>
            <div className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Papers (Subjects)</h3>
                <button type="button" onClick={()=>setForm({...form, papers:[...form.papers, { subject:'', date:'', start_time:'', end_time:'', invigilator:'' }]})} className="px-3 py-1 bg-gray-100 rounded">+ Add Subject</button>
              </div>
              <div className="space-y-2">
                {form.papers.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                    <select value={p.subject} onChange={(e)=>{
                      const v = e.target.value; const papers=[...form.papers]; papers[idx] = { ...papers[idx], subject: v ? Number(v) : '' }; setForm({...form, papers});
                    }} className="px-3 py-2 border rounded" required>
                      <option value="">Select subject</option>
                      {subjects.filter(s => form.class_ids.length===0 || form.class_ids.some(cid => (s.classes||[]).includes(cid))).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <input type="date" value={p.date} onChange={(e)=>{ const papers=[...form.papers]; papers[idx] = { ...papers[idx], date:e.target.value }; setForm({...form, papers}); }} className="px-3 py-2 border rounded" required />
                    <input type="time" value={p.start_time} onChange={(e)=>{ const papers=[...form.papers]; papers[idx] = { ...papers[idx], start_time:e.target.value }; setForm({...form, papers}); }} className="px-3 py-2 border rounded" />
                    <input type="time" value={p.end_time} onChange={(e)=>{ const papers=[...form.papers]; papers[idx] = { ...papers[idx], end_time:e.target.value }; setForm({...form, papers}); }} className="px-3 py-2 border rounded" />
                    <select value={p.invigilator} onChange={(e)=>{ const papers=[...form.papers]; papers[idx] = { ...papers[idx], invigilator: e.target.value ? Number(e.target.value) : '' }; setForm({...form, papers}); }} className="px-3 py-2 border rounded">
                      <option value="">(invigilator)</option>
                      {teachers.map(t => (<option key={t.id} value={t.id}>{t.user.first_name} {t.user.last_name}</option>))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create Exam Schedule</button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {exams.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No exams created.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exams.map(e => (
                    <tr key={e.id}>
                      <td className="px-6 py-4">{e.title}</td>
                      <td className="px-6 py-4">{e.class_name}</td>
                      <td className="px-6 py-4">{e.subject_name || '-'}</td>
                      <td className="px-6 py-4">{e.date}</td>
                      <td className="px-6 py-4">{e.start_time || '-'}{e.end_time ? ` - ${e.end_time}` : ''}</td>
                      <td className="px-6 py-4">{e.published ? 'Published' : 'Draft'}</td>
                      <td className="px-6 py-4 space-x-2">
                        {e.published ? (
                          <button onClick={()=>unpublish(e.id)} className="px-3 py-1 bg-yellow-600 text-white rounded">Unpublish</button>
                        ) : (
                          <button onClick={()=>publish(e.id)} className="px-3 py-1 bg-green-600 text-white rounded">Publish</button>
                        )}
                        <button onClick={()=>remove(e.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
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

export default ManageExams;
