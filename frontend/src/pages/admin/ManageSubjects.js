import React, { useEffect, useState } from 'react';
import { subjectAPI, classAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ManageSubjects = () => {
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', classes: [] });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [sRes, cRes] = await Promise.all([subjectAPI.getAll(), classAPI.getAll()]);
      setSubjects(sRes.data);
      setClasses(cRes.data);
    } catch (e) { console.error(e); toast.error('Failed to load subjects'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm({ name:'', code:'', description:'', classes: [] }); setShowForm(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name:s.name, code:s.code || '', description:s.description || '', classes: s.classes || [] }); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await subjectAPI.update(editing.id, form); toast.success('Subject updated'); }
      else { await subjectAPI.create(form); toast.success('Subject created'); }
      setShowForm(false); setEditing(null); setForm({ name:'', code:'', description:'', classes: [] });
      load();
    } catch (e) { console.error(e); toast.error('Failed to save subject'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try { await subjectAPI.delete(id); setSubjects(subjects.filter(s=>s.id!==id)); toast.success('Subject deleted'); }
    catch(e){ console.error(e); toast.error('Failed to delete subject'); }
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Subjects</h1>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Subject</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Subject' : 'Add Subject'}</h2>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" required value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input type="text" value={form.code} onChange={(e)=>setForm({...form, code:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows="3" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classes</label>
                <select multiple value={form.classes} onChange={(e)=>setForm({...form, classes: Array.from(e.target.selectedOptions).map(o=>Number(o.value))})} className="w-full px-3 py-2 border rounded-lg h-32">
                  {classes.map(c => (<option key={c.id} value={c.id}>{c.name}{c.section?` - ${c.section}`:''}</option>))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={()=>{ setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {subjects.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No subjects found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subjects.map((s) => (
                    <tr key={s.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{s.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{s.code || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{(s.classes_detail || []).map(c=>`${c.name}${c.section?`-${c.section}`:''}`).join(', ') || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button onClick={()=>openEdit(s)} className="px-3 py-1 bg-blue-600 text-white rounded">Edit</button>
                        <button onClick={()=>remove(s.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
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

export default ManageSubjects;
