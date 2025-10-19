import React, { useEffect, useState } from 'react';
import { materialAPI, teacherAPI, subjectAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const TeacherMaterials = () => {
  const toast = useToast();
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title:'', description:'', link:'', class_assigned:'', file:null });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [mRes, tRes, sRes] = await Promise.all([
        materialAPI.getAll(),
        teacherAPI.getAll(),
        subjectAPI.getAll(),
      ]);
      setMaterials(mRes.data);
      const me = Array.isArray(tRes.data) && tRes.data.length > 0 ? tRes.data[0] : null;
      setClasses(me?.assigned_classes || []);
      setSubjects(sRes.data);
    } catch (e) { console.error(e); toast.error('Failed to load materials'); }
    finally { setLoading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      if (formData.link) fd.append('link', formData.link);
      fd.append('class_assigned', formData.class_assigned);
      if (formData.file) fd.append('file', formData.file);
      if (formData.subject) fd.append('subject', formData.subject);
      await materialAPI.create(fd);
      toast.success('Material uploaded');
      setShowForm(false);
      setFormData({ title:'', description:'', link:'', class_assigned:'', file:null });
      loadAll();
    } catch (e) { console.error(e); toast.error('Failed to upload'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try { await materialAPI.delete(id); setMaterials(materials.filter(m=>m.id!==id)); toast.success('Material deleted'); }
    catch(e){ console.error(e); toast.error('Failed to delete'); }
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
          <h1 className="text-3xl font-bold text-gray-900">Class Materials</h1>
          <button onClick={()=>setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Upload</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Upload Material</h2>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input type="text" required value={formData.title} onChange={(e)=>setFormData({...formData, title:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <select required value={formData.class_assigned} onChange={(e)=>setFormData({...formData, class_assigned:e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="" disabled>Select class</option>
                    {classes.map(c => (<option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}`:''}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select value={formData.subject || ''} onChange={(e)=>setFormData({...formData, subject: e.target.value || null})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">(optional)</option>
                  {subjects
                    .filter(s => !formData.class_assigned || s.classes?.includes(Number(formData.class_assigned)))
                    .map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea required rows="3" value={formData.description} onChange={(e)=>setFormData({...formData, description:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                  <input type="url" value={formData.link} onChange={(e)=>setFormData({...formData, link:e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                  <input type="file" onChange={(e)=>setFormData({...formData, file:e.target.files?.[0] || null})} />
                </div>
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Upload</button>
                <button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {materials.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No materials yet.</div>
          ) : (
            <div className="divide-y">
              {materials.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{m.title} <span className="text-gray-500 text-sm">({m.class_name}{m.subject_name ? ` · ${m.subject_name}`:''})</span></p>
                    <p className="text-sm text-gray-600">{m.description}</p>
                    {m.link && (<a href={m.link} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">Open link</a>)}
                    {m.file && (<a href={m.file} target="_blank" rel="noreferrer" className="ml-3 text-blue-600 text-sm">Download file</a>)}
                  </div>
                  <div className="space-x-2">
                    <button onClick={()=>remove(m.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherMaterials;
