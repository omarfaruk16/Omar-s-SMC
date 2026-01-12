import React, { useEffect, useState } from 'react';
import { examAPI, feeAPI, paymentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const METHODS = [
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'cash', label: 'Cash' },
];

const StudentFees = () => {
  const toast = useToast();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [form, setForm] = useState({ method: 'bkash', number: '', transaction_id: '' });
  const [sslLoading, setSslLoading] = useState(false);
  const [downloadingAdmit, setDownloadingAdmit] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setLoading(true); const res = await feeAPI.getMyFees(); setFees(res.data); }
    catch(e){ console.error(e); toast.error('Failed to load fees'); }
    finally { setLoading(false); }
  };

  const openPay = (fee) => { setPaying(fee); setForm({ method: 'bkash', number: '', transaction_id: '' }); };
  const cancelPay = () => { setPaying(null); };

  const startSslPayment = async () => {
    if (!paying || sslLoading) return;
    setSslLoading(true);
    try {
      const response = await paymentAPI.initSslcommerz({ fee_id: paying.fee_id });
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

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { fee: paying.fee_id, method: form.method };
      if (['bkash','nagad','rocket'].includes(form.method)) {
        payload.number = form.number;
        payload.transaction_id = form.transaction_id;
      }
      await paymentAPI.create(payload);
      toast.success('Payment submitted, awaiting approval');
      setPaying(null);
      load();
    } catch (e) { console.error(e); toast.error('Failed to submit payment'); }
  };

  const downloadAdmitCard = async (fee) => {
    if (!fee.exam_title || !fee.class_id) {
      toast.error('Admit card data is missing.');
      return;
    }
    const key = `${fee.exam_title}-${fee.class_id}`;
    try {
      setDownloadingAdmit(key);
      const response = await examAPI.downloadAdmitCard(fee.exam_title, fee.class_id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admit-card-${fee.exam_title.replace(/\\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download admit card', error);
      toast.error('Unable to download admit card right now.');
    } finally {
      setDownloadingAdmit('');
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{f.fee_status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{f.payment_status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {f.fee_type === 'exam' && f.payment_status === 'approved' ? (
                          <button
                            type="button"
                            onClick={() => downloadAdmitCard(f)}
                            disabled={downloadingAdmit === `${f.exam_title}-${f.class_id}`}
                            className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-60"
                          >
                            {downloadingAdmit === `${f.exam_title}-${f.class_id}` ? 'Preparing...' : 'Download Admit Card'}
                          </button>
                        ) : f.payment_status === 'not_paid' && f.fee_status === 'running' ? (
                          <button onClick={()=>openPay(f)} className="px-3 py-1 bg-blue-600 text-white rounded">Pay Now</button>
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

        {paying && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">Pay: {paying.title}</h2>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={startSslPayment}
                  disabled={sslLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                >
                  {sslLoading ? 'Redirecting...' : 'Pay with SSLCOMMERZ'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Secure card and mobile banking payments via SSLCOMMERZ.
                </p>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method *</label>
                  <select value={form.method} onChange={(e)=>setForm({...form, method:e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    {METHODS.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
                  </select>
                </div>
                {['bkash','nagad','rocket'].includes(form.method) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                      <input type="text" value={form.number} onChange={(e)=>setForm({...form, number:e.target.value})} className="w-full px-3 py-2 border rounded-lg" required={['bkash','nagad','rocket'].includes(form.method)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID *</label>
                      <input type="text" value={form.transaction_id} onChange={(e)=>setForm({...form, transaction_id:e.target.value})} className="w-full px-3 py-2 border rounded-lg" required={['bkash','nagad','rocket'].includes(form.method)} />
                    </div>
                  </>
                )}
                <div className="flex space-x-2">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Submit</button>
                  <button type="button" onClick={cancelPay} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFees;
