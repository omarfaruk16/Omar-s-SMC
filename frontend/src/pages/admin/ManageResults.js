import React, { useEffect, useState } from 'react';
import { resultAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ManageResults = () => {
  const toast = useToast();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ title: '', is_active: true, file: null });

  useEffect(() => { fetchResults(); }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await resultAPI.getAll();
      setResults(res.data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to fetch results');
    } finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setFormData({ title:'', is_active:true, file:null }); setShowForm(true); };
  const openEdit = (r) => { setEditing(r); setFormData({ title:r.title, is_active:r.is_active, file:null }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('is_active', formData.is_active);
      if (formData.file) fd.append('file', formData.file);
      if (editing) { await resultAPI.update(editing.id, fd); toast.success('Result updated'); }
      else { await resultAPI.create(fd); toast.success('Result created'); }
      setShowForm(false); setEditing(null); setFormData({ title:'', is_active:true, file:null });
      fetchResults();
    } catch (e) { console.error(e); toast.error('Failed to save result'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this result?')) return;
    try { await resultAPI.delete(id); setResults(results.filter(r=>r.id!==id)); toast.success('Result deleted'); }
    catch(e){ console.error(e); toast.error('Failed to delete result'); }
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Results</h1>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Result</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Result' : 'Add Result'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" required value={formData.title} onChange={(e)=>setFormData({...formData, title:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                  <input type="file" onChange={(e)=>setFormData({...formData, file:e.target.files?.[0] || null})} />
                </div>
                <div className="flex items-center space-x-2 mt-6 md:mt-0">
                  <input id="active" type="checkbox" checked={formData.is_active} onChange={(e)=>setFormData({...formData, is_active:e.target.checked})} />
                  <label htmlFor="active">Active</label>
                </div>
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={()=>{ setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No results found.</div>
          ) : (
            <div className="divide-y">
              {results.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{r.title} {r.is_active ? (<span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Active</span>) : (<span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">Inactive</span>)}</p>
                    {r.file && (<a href={r.file} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">View file</a>)}
                  </div>
                  <div className="space-x-2">
                    <button onClick={()=>openEdit(r)} className="px-3 py-1 bg-blue-600 text-white rounded">Edit</button>
                    <button onClick={()=>handleDelete(r.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
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

export default ManageResults;
