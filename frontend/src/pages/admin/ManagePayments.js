import React, { useEffect, useState } from 'react';
import { paymentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ManagePayments = () => {
  const toast = useToast();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await paymentAPI.getPending();
      setPending(res.data);
    } catch (e) { console.error(e); toast.error('Failed to fetch pending payments'); }
    finally { setLoading(false); }
  };

  const approve = async (id) => {
    if (!window.confirm('Approve this payment?')) return;
    try { await paymentAPI.approve(id); setPending(pending.filter(p=>p.id!==id)); toast.success('Payment approved'); }
    catch(e){ console.error(e); toast.error('Failed to approve payment'); }
  };

  const reject = async (id) => {
    const notes = window.prompt('Reason for rejection (optional):','');
    if (notes === null) return;
    try { await paymentAPI.reject(id, notes || ''); setPending(pending.filter(p=>p.id!==id)); toast.success('Payment rejected'); }
    catch(e){ console.error(e); toast.error('Failed to reject payment'); }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Payment Approvals</h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {pending.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No pending payments.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Txn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pending.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{p.student_name}<div className="text-gray-500 text-xs">{p.student_phone}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{p.fee_title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{p.fee_amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{p.method}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{p.transaction_id || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button onClick={()=>approve(p.id)} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                        <button onClick={()=>reject(p.id)} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
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

export default ManagePayments;
