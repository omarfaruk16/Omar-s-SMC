import React from 'react';
import { useAuth } from '../context/AuthContext';
import UserDropdown from './UserDropdown';
import { HiMenuAlt2 } from 'react-icons/hi';

const AuthenticatedHeader = ({ onSidebarToggle }) => {
  const { user } = useAuth();
  
  // Helper to get descriptive page title could go here, 
  // or we can show a welcome message.

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30 h-16">
      <div className="px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        
        {/* Left: Sidebar Toggle & Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <span className="sr-only">Open sidebar</span>
            <HiMenuAlt2 className="w-6 h-6" />
          </button>
          
          <h2 className="text-xl font-semibold text-gray-800 hidden sm:block">
            Welcome, {user?.first_name || 'User'}!
          </h2>
        </div>

        {/* Right: User Dropdown */}
        <div className="flex items-center space-x-4">
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedHeader;
