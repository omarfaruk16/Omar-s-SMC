import React, { useEffect, useState } from 'react';
import { noticeAPI, classAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ManageNotices = () => {
  const toast = useToast();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', is_active: true, target_role: 'all', target_classes: [], file: null });

  useEffect(() => {
    fetchNotices();
    (async () => { try { const res = await classAPI.getAll(); setClasses(res.data); } catch(e) { /* ignore */ } })();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await noticeAPI.getAll();
      setNotices(res.data);
    } catch (e) {
      console.error('Error fetching notices', e);
      toast.error('Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({ title: '', description: '', is_active: true, target_role: 'all', target_classes: [], file: null });
    setShowForm(true);
  };

  const openEdit = (notice) => {
    setEditing(notice);
    setFormData({ title: notice.title, description: notice.description, is_active: notice.is_active, target_role: notice.target_role || 'all', target_classes: notice.target_classes || [], file: null });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('is_active', formData.is_active);
      if (formData.file) fd.append('file', formData.file);
      fd.append('target_role', formData.target_role);
      formData.target_classes.forEach((cid) => fd.append('target_classes', cid));

      if (editing) {
        await noticeAPI.update(editing.id, fd);
        toast.success('Notice updated');
      } else {
        await noticeAPI.create(fd);
        toast.success('Notice created');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ title: '', description: '', is_active: true, target_role: 'all', target_classes: [], file: null });
      fetchNotices();
    } catch (e) {
      console.error('Save failed', e);
      toast.error('Failed to save notice');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await noticeAPI.delete(id);
      setNotices(notices.filter(n => n.id !== id));
      toast.success('Notice deleted');
    } catch (e) {
      console.error('Delete failed', e);
      toast.error('Failed to delete notice');
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Notices</h1>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Notice</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Notice' : 'Add Notice'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" required value={formData.title} onChange={(e)=>setFormData({...formData, title:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea required rows="3" value={formData.description} onChange={(e)=>setFormData({...formData, description:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                  <input type="file" onChange={(e)=>setFormData({...formData, file:e.target.files?.[0] || null})} />
                </div>
                <div className="flex items-center space-x-2 mt-6 md:mt-0">
                  <input id="active" type="checkbox" checked={formData.is_active} onChange={(e)=>setFormData({...formData, is_active:e.target.checked})} />
                  <label htmlFor="active">Active</label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                  <select value={formData.target_role} onChange={(e)=>setFormData({...formData, target_role:e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="all">All</option>
                    <option value="teacher">Teachers</option>
                    <option value="student">Students</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Classes</label>
                  <select multiple value={formData.target_classes} onChange={(e)=>setFormData({...formData, target_classes: Array.from(e.target.selectedOptions).map(o=>Number(o.value))})} className="w-full px-3 py-2 border rounded-lg h-32">
                    {classes.map(c => (<option key={c.id} value={c.id}>{c.name}{c.section?` - ${c.section}`:''}</option>))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple (applies for teacher/student audience)</p>
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
          {notices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No notices found.</div>
          ) : (
            <div className="divide-y">
              {notices.map((n) => (
                <div key={n.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{n.title} {n.is_active ? (<span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Active</span>) : (<span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">Inactive</span>)}</p>
                    <p className="text-sm text-gray-600">{n.description}</p>
                    {n.file && (<a href={n.file} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">View file</a>)}
                  </div>
                  <div className="space-x-2">
                    <button onClick={()=>openEdit(n)} className="px-3 py-1 bg-blue-600 text-white rounded">Edit</button>
                    <button onClick={()=>handleDelete(n.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
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

export default ManageNotices;
