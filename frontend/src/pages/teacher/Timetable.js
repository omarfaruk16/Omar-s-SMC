import React, { useEffect, useState } from 'react';
import { timetableAPI } from '../../services/api';

const weekdays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const TeacherTimetable = () => {
  const [slots, setSlots] = useState([]);
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setLoading(true); const res = await timetableAPI.getAll(); setSlots(res.data); }
    catch(e){ console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Timetable</h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {slots.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No timetable assigned.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {days.map((d, idx) => (
                <div key={d} className="border rounded">
                  <div className="px-3 py-2 font-semibold bg-gray-50">{d}</div>
                  <div>
                    {slots.filter(s => s.weekday === idx).map(s => (
                      <div key={s.id} className="px-3 py-2 flex items-center justify-between border-t">
                        <div>
                          <div className="font-medium">{s.subject_name || '—'}</div>
                          <div className="text-xs text-gray-500">{s.class_name}</div>
                        </div>
                        <div className="text-sm text-gray-600">{s.start_time} - {s.end_time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherTimetable;
