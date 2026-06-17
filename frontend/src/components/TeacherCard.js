import React, { useState } from 'react';
import { FaPhone, FaEnvelope, FaCrown, FaBookOpen } from 'react-icons/fa';

/**
 * Teacher card for the public Teachers page.
 * The photo fills the full width of the card (4:5 portrait), with the
 * details below. Head teacher (Principal) gets a highlighted treatment.
 */
const TeacherCard = ({ teacher, isHeadTeacher = false }) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(teacher.full_name);
  const subjectName = teacher.preferred_subject?.name;

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm
        transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
        ${isHeadTeacher ? 'ring-2 ring-amber-400' : 'border border-gray-100'}`}
    >
      {/* Full-width photo */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-100">
        {teacher.image && !imageError ? (
          <img
            src={teacher.image}
            alt={teacher.full_name}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-700">
            <span className="text-5xl font-bold text-white/90">{initials}</span>
          </div>
        )}

        {/* Gradient overlay + name pinned over the image */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-3 pt-10">
          <h3 className="text-base font-bold leading-tight text-white drop-shadow line-clamp-2">
            {teacher.full_name || 'N/A'}
          </h3>
        </div>

        {/* Principal badge */}
        {isHeadTeacher && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-amber-950 shadow">
            <FaCrown className="h-3 w-3" /> Principal
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-grow flex-col p-4">
        <p className="text-sm font-semibold text-blue-600 line-clamp-1">
          {teacher.designation || 'Teacher'}
        </p>

        {subjectName && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 line-clamp-1">
            <FaBookOpen className="h-3 w-3 flex-shrink-0 text-gray-400" />
            {subjectName}
          </p>
        )}

        <div className="my-3 h-px bg-gray-100" />

        <div className="mt-auto space-y-1.5 text-sm">
          {teacher.phone && (
            <a
              href={`tel:${teacher.phone}`}
              className="flex items-center gap-2 text-gray-600 transition-colors hover:text-blue-600"
            >
              <FaPhone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <span className="truncate">{teacher.phone}</span>
            </a>
          )}
          {teacher.email && (
            <a
              href={`mailto:${teacher.email}`}
              className="flex items-center gap-2 text-gray-600 transition-colors hover:text-blue-600"
            >
              <FaEnvelope className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <span className="truncate">{teacher.email}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherCard;
