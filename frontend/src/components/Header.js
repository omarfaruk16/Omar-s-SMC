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
  const [admissionLoading, setAdmissionLoading] = useState(false);

  useEffect(() => {
    fetchLatestNotices();
    fetchAdmissionTemplate();
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileMenuOpen]);

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
    setAdmissionLoading(true);
    try {
      const response = await admissionAPI.getDefaultTemplate();
      setAdmissionTemplate(response.data);
    } catch (error) {
      console.error("Error fetching default admission form template:", error);
      try {
        const listResponse = await admissionAPI.listTemplates();
        const templates = listResponse.data || [];
        if (templates.length > 0) {
          setAdmissionTemplate(templates[0]);
        }
      } catch (listError) {
        console.error("Error fetching admission templates list:", listError);
      }
    } finally {
      setAdmissionLoading(false);
    }
  };

  const shouldShowAdmissionCta = !user && admissionTemplate;

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
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <img 
                  src="/rozey-mozammel-womens-college-logo.png" 
                  alt="School Logo" 
                  className="w-10 h-10 object-contain"
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
            <div className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4 text-sm">
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
            <Link
              to="/"
              className="px-4 py-2 text-gray-700 hover:bg-blue-600 hover:text-white transition rounded"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="px-4 py-2 text-gray-700 hover:bg-blue-600 hover:text-white transition rounded"
            >
              About
            </Link>

            {/* Information Dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 text-gray-700 hover:bg-blue-600 hover:text-white transition rounded flex items-center space-x-1">
                <span>Information</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block z-50">
                <Link
                  to="/information/governing-body"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  Governing Body
                </Link>
                <Link
                  to="/information/students"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  Students Information
                </Link>
                <Link
                  to="/information/staffs"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  Staffs
                </Link>
                <Link
                  to="/information/library"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  Library Information
                </Link>
              </div>
            </div>

            <Link
              to="/teachers"
              className="px-4 py-2 text-gray-700 hover:bg-blue-600 hover:text-white transition rounded"
            >
              Teachers
            </Link>
            <Link
              to="/notices"
              className="px-4 py-2 text-gray-700 hover:bg-blue-600 hover:text-white transition rounded"
            >
              Notices
            </Link>
            <Link
              to="/results"
              className="px-4 py-2 text-gray-700 hover:bg-blue-600 hover:text-white transition rounded"
            >
              Results
            </Link>
            <Link
              to="/contact"
              className="px-4 py-2 text-gray-700 hover:bg-blue-600 hover:text-white transition rounded"
            >
              Contact
            </Link>
            {shouldShowAdmissionCta ? (
              <Link
                to="/admission"
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition rounded"
              >
                Fillup Admission Form
              </Link>
            ) : (
              !user && (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 bg-gray-200 text-gray-500 rounded cursor-not-allowed"
                  title={admissionLoading ? "Loading admission form..." : "Admission form unavailable"}
                >
                  Fillup Admission Form
                </button>
              )
            )}
          </div>

          {/* Desktop Login/Register */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to={
                    user.role === "admin"
                      ? "/admin/dashboard"
                      : user.role === "teacher"
                      ? "/teacher/dashboard"
                      : "/student/dashboard"
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Login Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition flex items-center space-x-1"
                  >
                    <span>Login</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {loginDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <button
                        onClick={() => handleLoginClick('admin')}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        Admin Login
                      </button>
                      <button
                        onClick={() => handleLoginClick('teacher')}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        Teacher Login
                      </button>
                      <button
                        onClick={() => handleLoginClick('student')}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        Student Login
                      </button>
                    </div>
                  )}
                </div>

                {/* Register Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setRegisterDropdownOpen(!registerDropdownOpen)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center space-x-1"
                  >
                    <span>Register</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {registerDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg py-2 z-50">
                      <button
                        onClick={() => handleRegisterClick('teacher')}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        Teacher Registration
                      </button>
                      <button
                        onClick={() => handleRegisterClick('student')}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        Student Registration
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <span className="text-sm font-medium">Menu</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" id="mobile-menu">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
              <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <img
                      src="/assets/images/logo.png"
                      alt="School Logo"
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/40x40/22c55e/ffffff?text=SMS";
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">Rosey Mozammel Women's College</p>
                    <p className="text-xs opacity-90">রোজী মোজাম্মেল মহিলা কলেজ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Main</p>
                  <Link to="/" className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    Home
                    <span className="text-gray-400">→</span>
                  </Link>
                  <Link to="/about" className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    About
                    <span className="text-gray-400">→</span>
                  </Link>
                  <Link to="/teachers" className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    Teachers
                    <span className="text-gray-400">→</span>
                  </Link>
                  <Link to="/notices" className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    Notices
                    <span className="text-gray-400">→</span>
                  </Link>
                  <Link to="/results" className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    Results
                    <span className="text-gray-400">→</span>
                  </Link>
                  <Link to="/contact" className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    Contact
                    <span className="text-gray-400">→</span>
                  </Link>
                </div>

                <details className="group">
                  <summary className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg cursor-pointer">
                    <span className="font-medium">Information</span>
                    <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-2 space-y-1 pl-2">
                    <Link to="/information/governing-body" className="block px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                      Governing Body
                    </Link>
                    <Link to="/information/students" className="block px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                      Students Information
                    </Link>
                    <Link to="/information/staffs" className="block px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                      Staffs
                    </Link>
                    <Link to="/information/library" className="block px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                      Library Information
                    </Link>
                  </div>
                </details>

                {shouldShowAdmissionCta ? (
                  <Link
                    to="/admission"
                    className="block px-4 py-3 bg-green-600 text-white rounded-lg text-center font-semibold shadow hover:bg-green-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Fillup Admission Form
                  </Link>
                ) : (
                  !user && (
                    <button
                      type="button"
                      disabled
                      className="w-full px-4 py-3 bg-gray-200 text-gray-500 rounded-lg"
                      title={admissionLoading ? "Loading admission form..." : "Admission form unavailable"}
                    >
                      Fillup Admission Form
                    </button>
                  )
                )}

                {user ? (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Account</p>
                    <Link
                      to={user.role === "admin" ? "/admin/dashboard" : user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"}
                      className="block px-4 py-2 bg-blue-600 text-white rounded-lg text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Login</p>
                      <button
                        onClick={() => { handleLoginClick('admin'); setMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-blue-100"
                      >
                        Admin Login
                      </button>
                      <button
                        onClick={() => { handleLoginClick('teacher'); setMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-blue-100"
                      >
                        Teacher Login
                      </button>
                      <button
                        onClick={() => { handleLoginClick('student'); setMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-blue-100"
                      >
                        Student Login
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Register</p>
                      <Link
                        to="/register/teacher"
                        className="block px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-blue-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Teacher Registration
                      </Link>
                      <Link
                        to="/register/student"
                        className="block px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-blue-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Student Registration
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Notice Ticker */}
      {!loading && notices.length > 0 && (
        <div className="bg-red-600 text-white py-2">
          <div className="container mx-auto px-4">
            <div className="flex items-center">
              <span className="bg-white text-red-600 px-3 py-1 rounded text-xs font-bold mr-4 flex-shrink-0">
                RECENT NOTICES
              </span>
              <div className="overflow-hidden flex-grow">
                <div className="animate-marquee whitespace-nowrap">
                  {notices.map((notice) => (
                    <React.Fragment key={notice.id}>
                      <Link to={`/notices/${notice.id}`} className="inline-block mx-6 hover:underline">
                        • {notice.title}
                      </Link>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </header>
  );
};

export default Header;
