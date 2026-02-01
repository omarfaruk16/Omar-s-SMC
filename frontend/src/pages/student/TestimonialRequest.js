import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { testimonialAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const TestimonialRequest = () => {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sslLoading, setSslLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [note, setNote] = useState('');

  const amount = Number(process.env.REACT_APP_TESTIMONIAL_FEE_AMOUNT || 3500);

  const load = async () => {
    try {
      setLoading(true);
      const res = await testimonialAPI.getAll();
      setRequests(res.data);
    } catch (error) {
      console.error('Failed to load testimonial requests:', error);
      toast.error('Failed to load testimonial requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get('payment');
    const source = params.get('source');
    if (!payment || source !== 'testimonial') return;

    if (payment === 'success') {
      toast.success('Your testimonial payment has been completed successfully.');
    } else {
      toast.error('Your testimonial payment could not be completed. Please try again.');
    }

    navigate('/student/testimonials', { replace: true });
    load();
  }, [location.search, navigate]);

  const startSslPayment = async () => {
    if (sslLoading) return;
    if (!note || !note.trim()) {
      toast.error('Please enter a note for your testimonial request');
      return;
    }
    setSslLoading(true);
    try {
      const response = await testimonialAPI.initSslcommerz({ note: note.trim() });
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

  const handleDownload = async (req) => {
    if (!req) return;
    if (downloadingId) return;
    setDownloadingId(req.id);
    try {
      const response = await testimonialAPI.download(req.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      const disposition = response.headers?.['content-disposition'] || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const filename = filenameMatch?.[1] || `testimonial-${req.id}.pdf`;

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download testimonial', error);
      toast.error('Unable to download testimonial right now.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatStatus = (value) => {
    if (!value) return '—';
    return value.toString().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const badgeClass = (value) => {
    if (value === 'paid') return 'bg-emerald-100 text-emerald-700';
    if (value === 'failed') return 'bg-rose-100 text-rose-700';
    if (value === 'pending') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-700';
  };

  const hasRequests = useMemo(() => requests && requests.length > 0, [requests]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Testimonial Request</h1>
          <p className="text-gray-600">Testimonial fee: BDT {amount}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Request a new testimonial</h2>
            <p className="text-sm text-gray-500">Payment is required to submit your testimonial request.</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note for testimonial request (required)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter any special notes or instructions for your testimonial"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={startSslPayment}
            disabled={sslLoading || !note.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {sslLoading ? 'Redirecting...' : `Request Testimonial (Pay BDT ${amount})`}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : !hasRequests ? (
            <div className="p-8 text-center text-gray-500">No testimonial requests yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rejection Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((req) => {
                    const isApproved = req.status === 'approved';
                    return (
                      <tr key={req.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{req.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">BDT {req.payment_amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeClass(req.status)}`}>
                            {formatStatus(req.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {req.status === 'rejected' && req.rejection_reason ? (
                            <span className="text-red-600">{req.rejection_reason}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeClass(req.payment_status)}`}>
                            {formatStatus(req.payment_status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {req.requested_at ? new Date(req.requested_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {isApproved ? (
                            <button
                              type="button"
                              onClick={() => handleDownload(req)}
                              disabled={downloadingId === req.id}
                              className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {downloadingId === req.id ? 'Preparing...' : 'Download'}
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
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

export default TestimonialRequest;
