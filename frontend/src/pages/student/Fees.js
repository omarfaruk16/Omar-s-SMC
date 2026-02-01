import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { feeAPI, paymentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const StudentFees = () => {
  const toast = useToast();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sslLoadingFeeId, setSslLoadingFeeId] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setLoading(true); const res = await feeAPI.getMyFees(); setFees(res.data); }
    catch(e){ console.error(e); toast.error('Failed to load fees'); }
    finally { setLoading(false); }
  };

  const formatStatusLabel = (value) => {
    if (!value) return '—';
    return value
      .toString()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getBadgeClasses = (value, type) => {
    const key = (value || '').toString().toLowerCase();
    const map = type === 'payment'
      ? {
        approved: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        rejected: 'bg-red-100 text-red-800',
        not_paid: 'bg-gray-100 text-gray-700',
      }
      : {
        running: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        overdue: 'bg-red-100 text-red-800',
        pending: 'bg-yellow-100 text-yellow-800',
      };
    return map[key] || 'bg-gray-100 text-gray-700';
  };

  const startSslPayment = async (fee) => {
    if (!fee?.fee_id || sslLoadingFeeId) return;
    setSslLoadingFeeId(fee.fee_id);
    try {
      const response = await paymentAPI.initSslcommerz({ fee_id: fee.fee_id });
      const gatewayUrl = response.data?.data;
      if (!gatewayUrl) {
        toast.error(response.data?.message || response.data?.error || 'Failed to start payment');
        return;
      }
      window.location.assign(gatewayUrl);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to start payment');
    } finally {
      setSslLoadingFeeId('');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Fees & Payments</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {fees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No fees assigned.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fees.map((f) => (
                    <tr key={f.fee_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{f.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{f.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{f.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getBadgeClasses(f.fee_status, 'fee')}`}>
                          {formatStatusLabel(f.fee_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getBadgeClasses(f.payment_status, 'payment')}`}>
                          {formatStatusLabel(f.payment_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {f.fee_type === 'exam' ? (
                            <Link
                              to="/student/exams"
                              className="px-3 py-1 bg-indigo-600 text-white rounded"
                            >
                              Go to Exam
                            </Link>
                          ) : f.payment_status === 'not_paid' && ['running', 'pending'].includes((f.fee_status || '').toLowerCase()) ? (
                          <button
                            type="button"
                            onClick={() => startSslPayment(f)}
                            disabled={sslLoadingFeeId === f.fee_id}
                            className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60"
                          >
                            {sslLoadingFeeId === f.fee_id ? 'Redirecting...' : 'Pay Now'}
                          </button>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
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

export default StudentFees;
