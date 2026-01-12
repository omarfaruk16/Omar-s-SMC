import React from 'react';
import { Link } from 'react-router-dom';

const PaymentSuccess = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow rounded-xl p-8 max-w-md w-full text-center">
        <div className="text-sm text-green-600 font-semibold mb-2">Success</div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Payment Successful</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been received. It may take a few moments to reflect in your account.
        </p>
        <Link to="/student/fees" className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Back to Fees
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;
