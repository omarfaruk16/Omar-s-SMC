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
  const [selectedFee, setSelectedFee] = useState(null);
  const [selectedFeeDetails, setSelectedFeeDetails] = useState(null);
  const [selectedFeeStudents, setSelectedFeeStudents] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const statusBadgeStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    running: 'bg-blue-100 text-blue-800',
    complete: 'bg-green-100 text-green-800',
  };

  const paymentStatusStyles = {
    approved: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    not_paid: 'bg-gray-100 text-gray-600',
  };

  const formatAmount = (value) => {
    const numeric = Number(value || 0);
    return `BDT ${numeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const capitalize = (value) => {
    if (!value) return '';
    return value
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  };

  const formatMonth = (value) => capitalize(value);
  const formatStatus = (value) => capitalize(value);

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
  };

  const detailSummary = selectedFee ? (selectedFeeDetails || selectedFee) : null;
  const paymentStats = selectedFeeStudents.reduce(
    (acc, record) => {
      const status = record.payment_status || 'not_paid';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { approved: 0, pending: 0, rejected: 0, not_paid: 0 }
  );
  const totalStudents = selectedFeeStudents.length;

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

  const openFeeDetails = async (fee) => {
    setSelectedFee(fee);
    setDetailLoading(true);
    setDetailError('');
    try {
      const [feeRes, studentsRes] = await Promise.all([
        feeAPI.getOne(fee.id),
        feeAPI.getStudents(fee.id),
      ]);
      setSelectedFeeDetails(feeRes.data);
      setSelectedFeeStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
    } catch (e) {
      console.error('Failed to load fee details', e);
      setDetailError('Failed to load fee details. Please try again.');
      setSelectedFeeDetails(null);
      setSelectedFeeStudents([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeFeeDetails = () => {
    setSelectedFee(null);
    setSelectedFeeDetails(null);
    setSelectedFeeStudents([]);
    setDetailError('');
  };

  const openCreate = () => {
    closeFeeDetails();
    setEditing(null);
    setFormData({ title:'', class_assigned:'', amount:'', month:'january', status:'pending' });
    setShowForm(true);
  };
  const openEdit = (f) => {
    closeFeeDetails();
    setEditing(f);
    setFormData({ title:f.title, class_assigned: f.class_assigned, amount:f.amount, month:f.month, status:f.status });
    setShowForm(true);
  };

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
    try {
      await feeAPI.delete(id);
      setFees(fees.filter(f=>f.id!==id));
      toast.success('Fee deleted');
      if (selectedFee && selectedFee.id === id) {
        closeFeeDetails();
      }
    }
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

        {selectedFee && (
          <div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-4 py-6 md:items-center"
            onClick={closeFeeDetails}
          >
            <div
              className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">Fee Overview</p>
                  <h2 className="mt-1 text-2xl font-semibold text-gray-900">
                    {detailSummary?.title || selectedFee.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    {detailSummary?.class_name || selectedFee.class_name} -{' '}
                    {formatMonth(detailSummary?.month || selectedFee.month)}
                  </p>
                </div>
                <button
                  onClick={closeFeeDetails}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[80vh] overflow-y-auto px-6 py-5 space-y-6">
                {detailLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                  </div>
                ) : (
                  <>
                    {detailError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {detailError}
                      </div>
                    )}

                    {detailSummary && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                          <p className="text-xs font-semibold uppercase text-gray-500">Amount</p>
                          <p className="mt-2 text-xl font-semibold text-gray-900">
                            {formatAmount(detailSummary.amount)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                          <p className="text-xs font-semibold uppercase text-gray-500">Status</p>
                          <span className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeStyles[detailSummary.status] || 'bg-gray-100 text-gray-700'}`}>
                            {formatStatus(detailSummary.status)}
                          </span>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                          <p className="text-xs font-semibold uppercase text-gray-500">Month</p>
                          <p className="mt-2 text-base font-semibold text-gray-900">
                            {formatMonth(detailSummary.month)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                          <p className="text-xs font-semibold uppercase text-gray-500">Created On</p>
                          <p className="mt-2 text-base font-semibold text-gray-900">
                            {formatDate(detailSummary.created_date)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Payment Summary</h3>
                          <p className="text-sm text-gray-500">
                            Tracking {totalStudents} students for this fee.
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase text-gray-500">Approved Payments</p>
                          <p className="text-xl font-semibold text-gray-900">{paymentStats.approved}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {Object.entries(paymentStats).map(([status, count]) => (
                          <div
                            key={status}
                            className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-4 text-center"
                          >
                            <p className="text-xs font-medium uppercase text-gray-500">
                              {formatStatus(status)}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{count}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900">Student Payments</h3>
                      <p className="text-sm text-gray-500">
                        Detailed view of each student&apos;s payment status.
                      </p>
                      {selectedFeeStudents.length === 0 ? (
                        <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                          No student payment activity recorded for this fee yet.
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {selectedFeeStudents.map((entry) => {
                            const status = entry.payment_status || 'not_paid';
                            const badgeClass = paymentStatusStyles[status] || 'bg-gray-100 text-gray-700';
                            return (
                              <div
                                key={entry.student_id}
                                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {entry.student_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {entry.student_phone || 'No phone number provided'}
                                    </p>
                                  </div>
                                  <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                                  >
                                    {formatStatus(status)}
                                  </span>
                                </div>
                                {(entry.payment_method || entry.transaction_id || entry.payment_date) && (
                                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-2">
                                    {entry.payment_method && (
                                      <span>
                                        Method:{' '}
                                        <span className="font-medium text-gray-800">
                                          {formatStatus(entry.payment_method)}
                                        </span>
                                      </span>
                                    )}
                                    {entry.transaction_id && (
                                      <span>
                                        Transaction ID:{' '}
                                        <span className="font-medium text-gray-800">
                                          {entry.transaction_id}
                                        </span>
                                      </span>
                                    )}
                                    {entry.payment_date && (
                                      <span>
                                        Paid On:{' '}
                                        <span className="font-medium text-gray-800">
                                          {formatDate(entry.payment_date)}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}


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
                    {MONTHS.map(m => (<option key={m} value={m}>{capitalize(m)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select required value={formData.status} onChange={(e)=>setFormData({...formData, status:e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    {STATUSES.map(s => (<option key={s} value={s}>{capitalize(s)}</option>))}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payments
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fees.map((fee) => {
                    const badgeClass = statusBadgeStyles[fee.status] || 'bg-gray-100 text-gray-700';
                    return (
                      <tr
                        key={fee.id}
                        onClick={() => openFeeDetails(fee)}
                        className="group cursor-pointer transition-colors hover:bg-blue-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{fee.title}</div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1">
                              Class: {fee.class_name}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1">
                              Month: {formatMonth(fee.month)}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1">
                              Created: {formatDate(fee.created_date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatAmount(fee.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                            {formatStatus(fee.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{fee.payment_count}</div>
                          <div className="text-xs text-gray-500">approved payments</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(fee); }}
                              className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(fee.id); }}
                              className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                              Delete
                            </button>
                          </div>
                          <div className="mt-2 text-xs text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                            Click row to view details
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
