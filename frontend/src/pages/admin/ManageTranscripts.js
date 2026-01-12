import React, { useEffect, useState } from 'react';
import { transcriptAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ManageTranscripts = () => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const approve = async (id) => {
    try {
      await transcriptAPI.approve(id);
      toast.success('Transcript request approved');
      load();
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Failed to approve request');
    }
  };

  const reject = async (id) => {
    if (!window.confirm('Reject this transcript request?')) return;
    try {
      await transcriptAPI.reject(id);
      toast.success('Transcript request rejected');
      load();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Transcript Requests</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No transcript requests.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{req.student_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{req.student_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">BDT {req.payment_amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{req.payment_status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{req.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {req.status === 'pending_review' ? (
                          <div className="flex gap-2">
                            <button onClick={() => approve(req.id)} className="px-3 py-1 bg-green-600 text-white rounded">
                              Approve
                            </button>
                            <button onClick={() => reject(req.id)} className="px-3 py-1 bg-red-600 text-white rounded">
                              Reject
                            </button>
                          </div>
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

export default ManageTranscripts;
