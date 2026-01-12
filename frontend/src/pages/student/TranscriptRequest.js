import React, { useEffect, useState } from 'react';
import { transcriptAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const TranscriptRequest = () => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sslLoading, setSslLoading] = useState(false);

  const amount = Number(process.env.REACT_APP_TRANSCRIPT_FEE_AMOUNT || 3500);

  const load = async () => {
    try {
      setLoading(true);
      const res = await transcriptAPI.getAll();
      setRequests(res.data);
    } catch (error) {
      console.error('Failed to load transcript requests:', error);
      toast.error('Failed to load transcript requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startSslPayment = async () => {
    if (sslLoading) return;
    setSslLoading(true);
    try {
      const response = await transcriptAPI.initSslcommerz();
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
      setSslLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Transcript Request</h1>
          <p className="text-gray-600">Transcript fee: BDT {amount}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <button
            type="button"
            onClick={startSslPayment}
            disabled={sslLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
          >
            {sslLoading ? 'Redirecting...' : `Request Transcript (Pay BDT ${amount})`}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Payment is required to submit your transcript request.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No transcript requests yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{req.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{req.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{req.payment_status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {req.requested_at ? new Date(req.requested_at).toLocaleString() : '—'}
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

export default TranscriptRequest;
