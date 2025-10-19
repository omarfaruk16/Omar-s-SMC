import React from 'react';

const GoverningBody = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Governing Body
            </h1>
            <p className="text-gray-600">
              Information about the school's governing body members and their responsibilities.
            </p>
          </div>

          {/* Content Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="prose max-w-none">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Governing Body Members
              </h2>
              
              <div className="space-y-6">
                {/* Example structure - can be filled with actual data */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800">Chairman</h3>
                  <p className="text-gray-600">
                    [Name and details to be added]
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800">Vice Chairman</h3>
                  <p className="text-gray-600">
                    [Name and details to be added]
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800">Secretary</h3>
                  <p className="text-gray-600">
                    [Name and details to be added]
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800">Members</h3>
                  <p className="text-gray-600">
                    [Members list to be added]
                  </p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <p className="text-gray-700 italic">
                  This page is under construction. Content will be added soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoverningBody;
