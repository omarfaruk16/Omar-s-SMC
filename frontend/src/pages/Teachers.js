import React, { useState, useEffect } from 'react';
import { publicAPI } from '../services/api';
import TeacherCard from '../components/TeacherCard';
import { HEAD_TEACHER_DESIGNATION } from '../constants/designations';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await publicAPI.getApprovedTeachers();
      setTeachers(response.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setError('Failed to load teachers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Separate Head Teachers from others
  const headTeachers = teachers.filter(
    (teacher) => teacher.designation === HEAD_TEACHER_DESIGNATION
  );
  const otherTeachers = teachers.filter(
    (teacher) => teacher.designation !== HEAD_TEACHER_DESIGNATION
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Our Teachers</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading teachers...</p>
          </div>
        ) : error ? (
          <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No teachers found.</p>
          </div>
        ) : (
          <>
            {/* Head Teachers Section */}
            {headTeachers.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                  Principle
                </h2>
                <div
                  className={`grid gap-4 mb-8 ${
                    headTeachers.length === 1
                      ? 'grid-cols-1 sm:grid-cols-1 md:grid-cols-1 max-w-xs mx-auto'
                      : headTeachers.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`}
                >
                  {headTeachers.map((teacher) => (
                    <TeacherCard
                      key={teacher.id}
                      teacher={teacher}
                      isHeadTeacher={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Other Teachers Section */}
            {otherTeachers.length > 0 && (
              <div>
                {headTeachers.length > 0 && (
                  <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                    Other Teachers
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {otherTeachers.map((teacher) => (
                    <TeacherCard
                      key={teacher.id}
                      teacher={teacher}
                      isHeadTeacher={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Teachers;
