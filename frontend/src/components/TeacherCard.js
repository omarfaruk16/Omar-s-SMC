import React, { useState } from 'react';
import { FaPhone, FaEnvelope } from 'react-icons/fa';
import Avatar from './Avatar';

/**
 * Compact portrait-style teacher card for grid display
 * Shows image/avatar, name, designation, phone, email
 */
const TeacherCard = ({ teacher, isHeadTeacher = false }) => {
  const [imageError, setImageError] = useState(false);

  // Extract initials from full_name
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(teacher.full_name);

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full ${isHeadTeacher ? 'ring-2 ring-yellow-400' : ''
        }`}
    >
      {/* Image/Avatar Section - Compact Portrait */}
      <div className="w-48 h-48 overflow-hidden flex-shrink-0">
        {teacher.image && !imageError ? (
          <img
            src={teacher.image}
            alt={teacher.full_name}
            className="w-full h-full object-cover block"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-400 to-blue-600">
            <span className="text-3xl font-bold text-white">{initials}</span>
          </div>
        )}
      </div>

      {/* Info Section - Compact */}
      <div className="p-2.5 text-center flex flex-col flex-grow">
        {/* Head Teacher Badge */}
        {isHeadTeacher && (
          <div className="mb-1 inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full self-center">
            Principle
          </div>
        )}

        {/* Name */}
        <h3 className="text-xs font-bold text-gray-900 break-words leading-tight line-clamp-2">
          {teacher.full_name || 'N/A'}
        </h3>

        {/* Designation */}
        <p className="text-xs text-blue-600 font-medium mt-0.5 line-clamp-1">
          {teacher.designation || 'N/A'}
        </p>

        {/* Divider */}
        <div className="my-1.5 h-px bg-gray-200"></div>

        {/* Contact Info */}
        <div className="space-y-1 text-xs flex-grow flex flex-col justify-center">
          {/* Phone */}
          <div className="flex items-center justify-center text-gray-700 overflow-hidden">
            <FaPhone className="w-2.5 h-2.5 mr-1 text-gray-500 flex-shrink-0" />
            <span className="truncate text-xs">{teacher.phone || 'N/A'}</span>
          </div>

          {/* Email */}
          <div className="flex items-center justify-center text-gray-700 overflow-hidden">
            <FaEnvelope className="w-2.5 h-2.5 mr-1 text-gray-500 flex-shrink-0" />
            <span className="truncate text-xs">{teacher.email || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherCard;
