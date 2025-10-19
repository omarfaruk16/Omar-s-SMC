import React from 'react';

const LibraryInformation = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Library Information
            </h1>
            <p className="text-gray-600">
              Information about school library, resources, and facilities.
            </p>
          </div>

          {/* Content Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="prose max-w-none">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Library Facilities
              </h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800">Library Hours</h3>
                  <p className="text-gray-600">
                    [Library opening hours to be added]
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800">Book Collection</h3>
                  <p className="text-gray-600">
                    [Book collection details to be added]
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800">Library Rules</h3>
                  <p className="text-gray-600">
                    [Library rules and regulations to be added]
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800">Digital Resources</h3>
                  <p className="text-gray-600">
                    [Digital resources and e-library details to be added]
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

export default LibraryInformation;
