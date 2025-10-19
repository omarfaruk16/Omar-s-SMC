import React from 'react';

const PremtoliDegreeCollegeContact = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* Google Maps Section */}
      <div className="w-full bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center mb-4">
            {/* College Info on Map */}
            <div className="bg-white p-4 rounded-lg shadow-md md:mr-4 mb-4 md:mb-0 max-w-sm w-full z-10">
              <h2 className="text-xl font-semibold text-gray-900">Premtoli Degree College</h2>
              <p className="text-gray-600 text-sm">9CW4+2HJ, Godagari</p>
              <div className="flex items-center mt-1">
                <span className="text-yellow-500 font-bold text-sm">4.3</span>
                <span className="text-gray-500 text-sm ml-1">⭐</span>
                <span className="text-blue-600 text-sm ml-2">74 reviews</span>
              </div>
              <a href="https://www.google.com/maps/place/Premtoli+Degree+College/@24.4578842,88.3582136,17z/data=!3m1!4b1!4m6!3m5!1s0x39fbd05505f02c63:0xb63628e945c57980!8m2!3d24.4578842!4d88.3582136!16s%2Fg%2F11b6m521c8?entry=ttu" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm mt-2 block">
                Directions
              </a>
              <a href="https://www.google.com/maps/place/Premtoli+Degree+College/@24.4578842,88.3582136,17z/data=!3m1!4b1!4m6!3m5!1s0x39fbd05505f02c63:0xb63628e945c57980!8m2!3d24.4578842!4d88.3582136!16s%2Fg%2F11b6m521c8?entry=ttu" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm mt-1 block">
                View larger map
              </a>
            </div>

            {/* Google Maps Embed */}
            <div className="flex-grow w-full md:w-auto h-96 relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.045763266224!2d88.35563867439007!3d24.45788417812929!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fbd05505f02c63%3A0xb63628e945c57980!2sPremtoli%20Degree%20College!5e0!3m2!1sen!2sbd!4v1701021430000!5m2!1sen!2sbd"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Premtoli Degree College Location"
                className="absolute top-0 left-0"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Section (Mimicking the bottom part of the image) */}
      <div className="w-full bg-white shadow-md mt-8 py-8 px-4">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          {/* প্রতিষ্ঠানেন ঠিকানা (Institution Address) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">প্রতিষ্ঠানেন ঠিকানা</h3>
            <p className="text-gray-700">প্রেমতলী, গোদাগাড়ী,</p>
            <p className="text-gray-700">জেলা- রাজশাহী, বিভাগ- রাজশাহী</p>
          </div>

          {/* ইমেইল (Email) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">ইমেইল</h3>
            <p className="text-gray-700">premtalicollege@gmail.com</p>
            <p className="text-gray-700">c2522@nu.ac.bd</p>
          </div>

          {/* মোবাইল নাম্বার (Mobile Number) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">মোবাইল নাম্বার</h3>
            <p className="text-gray-700">01309126761</p>
          </div>

          {/* যোগাযোগোর সময় (Contact Hours) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">যোগাযোগোর সময়</h3>
            <p className="text-gray-700">রবি - বৃহস্পতিবার</p>
            <p className="text-gray-700">সকাল ৯টা থেকে বিকাল ৫টা</p>
            <p className="text-gray-700">পর্যন্ত</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremtoliDegreeCollegeContact;