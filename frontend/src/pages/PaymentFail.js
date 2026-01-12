import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

const PaymentFail = () => {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isAdmission = params.get('source') === 'admission';
  const backPath = isAdmission ? '/admission' : '/student/fees';
  const backLabel = isAdmission ? 'Back to Admission Form' : 'Try Again';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow rounded-xl p-8 max-w-md w-full text-center">
        <div className="text-sm text-red-600 font-semibold mb-2">Failed</div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          The payment could not be completed. Please try again or use a different method.
        </p>
        <Link to={backPath} className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {backLabel}
        </Link>
      </div>
    </div>
  );
};

export default PaymentFail;
