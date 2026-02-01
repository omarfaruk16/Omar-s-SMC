import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { noticeAPI, admissionAPI } from "../services/api";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [registerDropdownOpen, setRegisterDropdownOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admissionTemplate, setAdmissionTemplate] = useState(null);

  useEffect(() => {
    fetchLatestNotices();
    // Only check for templates if not logged in or logged in as student
    // Though logic says "if student logged in, then show that student's info otherwise show info to log in as student"
    fetchAdmissionTemplate();
  }, []);

  const fetchLatestNotices = async () => {
    try {
      const response = await noticeAPI.getAll();
      setNotices(response.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmissionTemplate = async () => {
    try {
      const response = await admissionAPI.getDefaultTemplate();
      setAdmissionTemplate(response.data);
    } catch (error) {
       // Ignore if not found
    } 
  };
  
  // Logic: "Fillup Admission Form button should be there only if a student is logged in or not logged in at all"
  const canShowAdmission = !user || user.role === 'student';

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleLoginClick = (role) => {
    setLoginDropdownOpen(false);
    navigate("/login", { state: { role } });
  };

  const handleRegisterClick = (role) => {
    setRegisterDropdownOpen(false);
    navigate(`/register/${role}`);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* SECTION 1: Logo, Name, Contact Info */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Left: Logo and School Name */}
            <Link to="/" className="flex items-center space-x-3 mb-2 md:mb-0">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center">
                <img 
                  src="/rozey-mozammel-womens-college-logo.png" 
                  alt="School Logo" 
                  className="w-12 h-12 md:w-14 md:h-14 object-contain rounded-full"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/40x40/22c55e/ffffff?text=SMS";
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold leading-tight">
                  Rosey Mozammel Women's College
                </h1>
                <p className="text-xs md:text-sm opacity-90">রোজী মোজাম্মেল মহিলা কলেজ</p>
              </div>
            </Link>

            {/* Right: Contact Information */}
            <div className="hidden lg:flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span>📞 01309-124030</span>
              </div>
              <div className="flex items-left space-x-2">
                <span>✉️ roseycollege@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Navigation Menu and Login/Register */}
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Desktop Navigation Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/" className="px-4 py-2 text-gray-700 hover:bg-blue-600 hover:text-white transition rounded">Home</Link>
            <Link to="/about" className="px-4 py-2 text-gray-700 hover:bg-blue-600 hover:text-white transition rounded">About</Link>

            {/* Information Dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 text-gray-700 hover:bg-blue-600 hover:text-white transition rounded flex items-center space-x-1">
                <span>Information</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block z-50">
                <Link to="/information/governing-body" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600">Governing Body</Link>
                <Link to="/information/students" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600">Students Information</Link>
                <Link to="/information/staffs" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600">Staffs</Link>
                <Link to="/information/library" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600">Library Information</Link>
              </div>
            </div>

            <Link to="/teachers" className="px-4 py-2 text-gray-700 hover:bg-blue-600 hover:text-white transition rounded">Teachers</Link>
            <Link to="/notices" className="px-4 py-2 text-gray-700 hover:bg-blue-600 hover:text-white transition rounded">Notices</Link>
            <Link to="/contact" className="px-4 py-2 text-gray-700 hover:bg-blue-600 hover:text-white transition rounded">Contact</Link>
            
            {canShowAdmission && admissionTemplate && (
              <Link to="/admission" className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition rounded">
                Fillup Admission Form
              </Link>
            )}
          </div>
          
            {/* User Controls */}
          {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 font-medium hidden md:block">
                    {user.name} ({user.role})
                  </span>
                  <Link
                    to={`/${user.role}/dashboard`}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition rounded"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 transition rounded border border-red-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                 <div className="flex items-center gap-2">
                     {/* Login Button */}
                     <Link to="/login" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition rounded">
                        Login
                     </Link>
                     <div className="relative group">
                          <button className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition rounded flex items-center">
                            Register
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block z-50 border">
                                <button onClick={() => handleRegisterClick('student')} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50">Student</button>
                                <button onClick={() => handleRegisterClick('teacher')} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50">Teacher</button>
                          </div>
                     </div>
                 </div>
              )}

             {/* Mobile Menu Button - simplified for brevity, assume similar structure */}
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
             </button>
          </div>
        </nav>
        
        {/* Mobile Menu - Simplified logic */}
        {mobileMenuOpen && (
             <div className="md:hidden bg-white border-t p-4 space-y-2">
                 <Link to="/" className="block py-2 text-gray-700">Home</Link>
                 <Link to="/about" className="block py-2 text-gray-700">About</Link>
                 <Link to="/teachers" className="block py-2 text-gray-700">Teachers</Link>
                 {canShowAdmission && <Link to="/admission" className="block py-2 text-green-600 font-bold">Admission</Link>}
             </div>
        )}
    </header>
  );
};

export default Header;
