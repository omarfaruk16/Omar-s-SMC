import React, { useEffect, useState } from 'react';
import { feeAPI, classAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const MONTHS = [
  'january','february','march','april','may','june','july','august','september','october','november','december'
];
const STATUSES = ['pending','running','complete'];

const ManageFees = () => {
  const toast = useToast();
  const [fees, setFees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ title:'', class_assigned:'', amount:'', month:'january', status:'pending' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [feesRes, classesRes] = await Promise.all([feeAPI.getAll(), classAPI.getAll()]);
      setFees(feesRes.data);
      setClasses(classesRes.data);
    } catch (e) { console.error(e); toast.error('Failed to load fees/classes'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setFormData({ title:'', class_assigned:'', amount:'', month:'january', status:'pending' }); setShowForm(true); };
  const openEdit = (f) => { setEditing(f); setFormData({ title:f.title, class_assigned: f.class_assigned, amount:f.amount, month:f.month, status:f.status }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, amount: parseFloat(formData.amount) };
      if (editing) { await feeAPI.update(editing.id, payload); toast.success('Fee updated'); }
      else { await feeAPI.create(payload); toast.success('Fee created'); }
      setShowForm(false); setEditing(null); setFormData({ title:'', class_assigned:'', amount:'', month:'january', status:'pending' });
      fetchAll();
    } catch (e) { console.error(e); toast.error('Failed to save fee'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fee?')) return;
    try { await feeAPI.delete(id); setFees(fees.filter(f=>f.id!==id)); toast.success('Fee deleted'); }
    catch(e){ console.error(e); toast.error('Failed to delete fee'); }
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Fees</h1>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Fee</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Fee' : 'Add Fee'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input type="number" step="0.01" required value={formData.amount} onChange={(e)=>setFormData({...formData, amount:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                  <select required value={formData.month} onChange={(e)=>setFormData({...formData, month:e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    {MONTHS.map(m => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select required value={formData.status} onChange={(e)=>setFormData({...formData, status:e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    {STATUSES.map(s => (<option key={s} value={s}>{s}</option>))}
                  </select>
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
          {fees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No fees found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fees.map((f) => (
                    <tr key={f.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{f.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{f.class_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{f.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{f.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{f.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{f.payment_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button onClick={()=>openEdit(f)} className="px-3 py-1 bg-blue-600 text-white rounded">Edit</button>
                        <button onClick={()=>handleDelete(f.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
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

export default ManageFees;
