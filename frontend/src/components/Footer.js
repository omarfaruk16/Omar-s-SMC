import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-blue-700 text-white mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and About Section */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-[120px] h-auto bg-white rounded-full flex items-center justify-center p-2">
                <img 
                  src="/assets/images/logo.png" 
                  alt="School Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/64x64/22c55e/ffffff?text=SMS";
                  }}
                />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Rosey Mozammel Women's College</h2>
            <p className="text-sm text-blue-100 mb-4">
              রোজী মোজাম্মেল মহিলা কলেজ</p>
          </div>

          {/* Key Informations */}
          <div>
            <h3 className="text-base font-bold mb-4 uppercase">Key Informations</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-blue-100">Establishment Year: 1994</span>
              </li>
              <li>
                <span className="text-blue-100">MPIN Code : 8403043101</span>
              </li>
              <li>
                <span className="text-blue-100">EIIN Number : 124030</span>
              </li>
              <li>
                <span className="text-blue-100">College code : 2308</span>
              </li>
              <li>
                <span className="text-blue-100">National University : 2328</span>
              </li>
          
            </ul>
            <div className="flex space-x-3 my-5">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-white text-blue-700 rounded-full flex items-center justify-center hover:bg-blue-100 transition"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-white text-blue-700 rounded-full flex items-center justify-center hover:bg-blue-100 transition"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-white text-blue-700 rounded-full flex items-center justify-center hover:bg-blue-100 transition"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-white text-blue-700 rounded-full flex items-center justify-center hover:bg-blue-100 transition"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-base font-bold mb-4 uppercase">Contact Us</h3>
            <ul className="space-y-3 text-sm text-blue-100">
              <li className="flex items-start space-x-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="leading-relaxed">Gurudaspur, Natore Bangladesh</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+8801908126761" className="hover:text-white transition">
                  01309-124030
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:premtailcollege@gmail.com" className="hover:text-white transition break-all">
                roseycollege@gmail.com
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <a href="https://www.premtailcollege.edu.bd" target="_blank" rel="noopener noreferrer" className="hover:text-white transition break-all">
                  www.premtailcollege.edu.bd
                </a>
              </li>
            </ul>
          </div>

          {/* Important Links */}
          <div>
            <h3 className="text-base font-bold mb-4 uppercase">Important Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="https://www.ebook.com.bd/" className="text-blue-100 hover:text-white transition flex items-center group">
                  <span className="mr-2 text-white group-hover:translate-x-1 transition-transform">›</span>
                  ই-বুক
                </Link>
              </li>
              <li>
                <Link to="https://banbeis.gov.bd/" className="text-blue-100 hover:text-white transition flex items-center group">
                  <span className="mr-2 text-white group-hover:translate-x-1 transition-transform">›</span>
                  ব্যানবেইস
                </Link>
              </li>
              <li>
                <Link to="https://nctb.gov.bd/" className="text-blue-100 hover:text-white transition flex items-center group">
                  <span className="mr-2 text-white group-hover:translate-x-1 transition-transform">›</span>
                  জাতীয় শিক্ষা বোর্ড
                </Link>
              </li>
              <li>
                <Link to="https://rajshahieducationboard.gov.bd/" className="text-blue-100 hover:text-white transition flex items-center group">
                  <span className="mr-2 text-white group-hover:translate-x-1 transition-transform">›</span>
                  রাজশাহী শিক্ষা বোর্ড, রাজশাহী
                </Link>
              </li>
              <li>
                <Link to="https://www.nu.ac.bd/" className="text-blue-100 hover:text-white transition flex items-center group">
                  <span className="mr-2 text-white group-hover:translate-x-1 transition-transform">›</span>
                  National University
                </Link>
              </li>
              <li>
                <Link to="https://teachers.gov.bd/" className="text-blue-100 hover:text-white transition flex items-center group">
                  <span className="mr-2 text-white group-hover:translate-x-1 transition-transform">›</span>
                  শিক্ষক বাতায়ন
                </Link>
              </li>
              <li>
                <Link to="http://emis.gov.bd/EMIS" className="text-blue-100 hover:text-white transition flex items-center group">
                  <span className="mr-2 text-white group-hover:translate-x-1 transition-transform">›</span>
                  EMIS
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-blue-600 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm">
            <p className="text-blue-100 text-center md:text-left">
              © Copyright {currentYear} Rosey Mozammel Women's College
            </p>
            <a href="https://pitmcf.com/">
            <p className="text-blue-100 text-center md:text-right">
              Developed By: <span className="text-white font-medium">PHTMCF (Padma IT, Rajshahi)</span>
            </p>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center z-50"
        aria-label="Scroll to top"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </footer>
  );
};

export default Footer;