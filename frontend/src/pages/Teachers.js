import React, { useState, useEffect } from 'react';
import { publicAPI } from '../services/api';
import Avatar from '../components/Avatar';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await publicAPI.getApprovedTeachers();
      setTeachers(response.data);
    } catch (error) {
      if (error.response?.status === 401) setAuthRequired(true);
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Our Teachers</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : teachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center mb-4">
                  <Avatar image={teacher.image} name={teacher.full_name || 'Teacher'} size="2xl" />
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-gray-800">{teacher.full_name}</h3>
                    {teacher.assigned_classes?.length > 0 && (
                      <p className="text-sm text-gray-600">
                        {teacher.assigned_classes.map(c=>`${c.name}${c.section?`-${c.section}`:''}`).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No teachers available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teachers;
