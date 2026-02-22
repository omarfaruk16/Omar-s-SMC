import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import AuthenticatedHeader from './AuthenticatedHeader';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Authenticated Layout: show only for dashboard routes; public pages keep public header
  const isDashboardRoute = /^\/(admin|teacher|student)(\/|$)/.test(location.pathname);
  if (isAuthenticated && isDashboardRoute) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          <AuthenticatedHeader onSidebarToggle={toggleSidebar} />
          
          <main className="flex-1 p-4 lg:p-4 overflow-y-auto">
            {children}
          </main>
          
          <Footer />
        </div>
      </div>
    );
  }

  // Public Layout: Standard Header + Content
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
