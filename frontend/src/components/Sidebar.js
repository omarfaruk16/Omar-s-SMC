import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaChartPie, FaUserGraduate, FaChalkboardTeacher, 
  FaChalkboard, FaBook, FaBullhorn, FaMoneyBillWave, 
  FaCertificate, FaClipboardList, FaFileAlt, FaPenFancy 
} from 'react-icons/fa';
import { HiX } from 'react-icons/hi';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isTeacher, isStudent } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItemClass = (path) => `
    flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200
    ${isActive(path) 
      ? 'bg-blue-800 text-white border-r-4 border-blue-400' 
      : 'text-blue-100 hover:bg-blue-800 hover:text-white'}
  `;

  // Admin Navigation Config
  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: FaChartPie },
    { path: '/admin/students', label: 'Students', icon: FaUserGraduate },
    { path: '/admin/teachers', label: 'Teachers', icon: FaChalkboardTeacher },
    { path: '/admin/classes', label: 'Classes', icon: FaChalkboard },
    { path: '/admin/subjects', label: 'Subjects', icon: FaBook },
    { path: '/admin/notices', label: 'Notices', icon: FaBullhorn },
    { path: '/admin/fees', label: 'Fees', icon: FaMoneyBillWave },
    { path: '/admin/testimonials', label: 'Testimonials', icon: FaCertificate },
  ];

  // Teacher Navigation Config
  const teacherLinks = [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: FaChartPie },
    { path: '/teacher/classes', label: 'My Classes', icon: FaChalkboard },
    { path: '/teacher/attendance', label: 'Attendance', icon: FaClipboardList },
    { path: '/teacher/results', label: 'Results', icon: FaFileAlt },
    { path: '/teacher/materials', label: 'Materials', icon: FaBook },
    // Missing: notices (using public for now if needed), notifications
  ];

  // Student Navigation Config
  const studentLinks = [
    { path: '/student/dashboard', label: 'Dashboard', icon: FaChartPie },
    { path: '/student/timetable', label: 'My Classes', icon: FaChalkboard },
    { path: '/student/exams/results', label: 'Results', icon: FaFileAlt },
    { path: '/student/attendance', label: 'Attendance', icon: FaClipboardList },
    { path: '/notices', label: 'Notices', icon: FaBullhorn },
    { path: '/student/materials', label: 'Materials', icon: FaBook },
    { path: '/student/fees', label: 'Fees', icon: FaMoneyBillWave },
    { path: '/admission', label: 'Admission Form', icon: FaPenFancy },
    { path: '/student/testimonials', label: 'Testimonial', icon: FaCertificate },
  ];

  let links = [];
  if (isAdmin) links = adminLinks;
  else if (isTeacher) links = teacherLinks;
  else if (isStudent) links = studentLinks;

  const sidebarClasses = `
    fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:sticky lg:top-0 lg:translate-x-0 lg:h-screen transition-transform duration-300 ease-in-out
    w-72 bg-gradient-to-b from-blue-900 to-blue-800 shadow-xl z-50 flex flex-col
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Branding Header */}
        <div className="flex items-center justify-between h-20 px-6 bg-blue-950 shadow-md flex-shrink-0">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
               <img 
                 src="/rozey-mozammel-womens-college-logo.png" 
                 alt="Logo" 
                 className="w-8 h-8 object-contain rounded-full"
                 onError={(e) => {
                   e.target.src = "https://via.placeholder.com/40x40/22c55e/ffffff?text=RM";
                 }}
               />
            </div>
            <div className="text-white overflow-hidden">
              <h1 className="text-sm font-bold leading-tight truncate">Rosey Mozammel</h1>
              <p className="text-xs opacity-75 truncate">Women's College</p>
            </div>
          </Link>
          
          <button onClick={onClose} className="lg:hidden text-white hover:text-gray-300">
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 space-y-1">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={navItemClass(link.path)}
              onClick={() => window.innerWidth < 1024 && onClose()}
            >
              <link.icon className="w-5 h-5 mr-3" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Info Footer (Optional, can be removed if redundant with header) */}
        <div className="p-4 bg-blue-950">
          <div className="flex items-center space-x-3 text-blue-100">
             <div className="flex-1">
               <p className="text-xs font-medium uppercase tracking-wider opacity-70">
                 Logged in as
               </p>
               <p className="text-sm font-bold truncate">
                 {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
               </p>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
