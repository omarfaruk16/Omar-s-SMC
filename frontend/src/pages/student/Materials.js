import React, { useEffect, useState } from 'react';
import { materialAPI } from '../../services/api';

const StudentMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await materialAPI.getAll();
        setMaterials(res.data);
      } catch (e) {
        console.error(e); alert('Failed to load materials');
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Study Materials</h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {materials.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No materials available.</div>
          ) : (
            <div className="divide-y">
              {materials.map((m) => (
                <div key={m.id} className="p-4">
                  <p className="font-semibold">{m.title} <span className="text-gray-500 text-sm">({m.class_name})</span></p>
                  <p className="text-sm text-gray-600 mb-1">By {m.teacher_name}{m.subject_name ? ` · ${m.subject_name}` : ''}</p>
                  <p className="text-sm text-gray-700 mb-2">{m.description}</p>
                  {m.link && (<a href={m.link} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">Open link</a>)}
                  {m.file && (<a href={m.file} target="_blank" rel="noreferrer" className="ml-3 text-blue-600 text-sm">Download file</a>)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentMaterials;
