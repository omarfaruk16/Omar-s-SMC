import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { admissionAPI } from '../services/api';

const PaymentSuccess = () => {
  const location = useLocation();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const source = params.get('source');
  const tranId = params.get('tran_id') || (source === 'admission' ? sessionStorage.getItem('admission_tran_id') || '' : '');
  const valId = params.get('val_id') || '';
  const isAdmission = source === 'admission' || tranId.startsWith('ADM-');

  const triggerDownload = async () => {
    if (!tranId) return;
    setDownloadError('');
    setDownloading(true);
    try {
      const response = await admissionAPI.downloadSubmission({ tran_id: tranId, val_id: valId });
      const disposition = response.headers?.['content-disposition'] || '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : 'admission-form.pdf';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      sessionStorage.removeItem('admission_tran_id');
    } catch (error) {
      console.error('Failed to download admission form:', error);
      let message = error.response?.data?.detail || 'Unable to download the admission form yet.';
      if (error.response?.status === 409) {
        message = 'Payment is still processing. Please try again in a moment.';
      }
      setDownloadError(message);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (isAdmission && tranId) {
      triggerDownload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmission, tranId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow rounded-xl p-8 max-w-md w-full text-center">
        <div className="text-sm text-green-600 font-semibold mb-2">Success</div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Payment Successful</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been received. It may take a few moments to reflect in your account.
        </p>
        {isAdmission ? (
          <>
            <button
              type="button"
              onClick={triggerDownload}
              disabled={downloading || !tranId}
              className="inline-flex px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {downloading ? 'Preparing download...' : 'Download Admission Form'}
            </button>
            {downloadError && (
              <p className="text-sm text-red-600 mt-3">{downloadError}</p>
            )}
            <div className="mt-6">
              <Link to="/admission" className="text-blue-600 hover:underline">
                Back to Admission Form
              </Link>
            </div>
          </>
        ) : (
          <Link to="/student/fees" className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Fees
          </Link>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
