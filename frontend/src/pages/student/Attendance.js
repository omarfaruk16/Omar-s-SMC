import React, { useEffect, useMemo, useState } from 'react';
import { attendanceAPI } from '../../services/api';
import Calendar from '../../components/Calendar';
import Modal from '../../components/Modal';

const StudentAttendance = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(new Date(year, month, 1).toISOString().slice(0,10));
  const [dateTo, setDateTo] = useState(new Date(year, month + 1, 0).toISOString().slice(0,10));
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const header = useMemo(() => new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }), [year, month]);

  useEffect(() => {
    const df = new Date(year, month, 1).toISOString().slice(0,10);
    const dt = new Date(year, month + 1, 0).toISOString().slice(0,10);
    setDateFrom(df);
    setDateTo(dt);
  }, [year, month]);

  useEffect(() => { load(); }, [dateFrom, dateTo]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.getAll({ date_from: dateFrom, date_to: dateTo });
      setRecords(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const total = records.length;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <input type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} className="px-3 py-2 border rounded" />
            <input type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} className="px-3 py-2 border rounded" />
            <div className="px-3 py-2 bg-green-50 text-green-800 rounded">Present: {present}</div>
            <div className="px-3 py-2 bg-red-50 text-red-800 rounded">Absent: {absent}</div>
          </div>
        </div>
        <div className="mb-6">
          <Calendar
            year={year}
            month={month}
            header={header}
            onPrev={() => setMonth((m) => (m === 0 ? (setYear(y=>y-1), 11) : m - 1))}
            onNext={() => setMonth((m) => (m === 11 ? (setYear(y=>y+1), 0) : m + 1))}
            onDayClick={(date)=>{ setModalDate(date); setModalOpen(true); }}
            renderDay={(date) => {
              const isCurrentMonth = date.getMonth() === month;
              const dstr = date.toISOString().slice(0,10);
              const rec = records.find(r => r.date === dstr);
              return (
                <div className={`text-sm ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{date.getDate()}</span>
                    {rec && (
                      <span className={`text-xs px-2 py-0.5 rounded ${rec.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {rec.status === 'present' ? 'P' : 'A'}
                      </span>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {records.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No records in this range.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map(r => (
                    <tr key={r.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{r.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{r.class_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
    <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={modalDate ? modalDate.toDateString() : ''}>
      {modalDate && (() => {
        const dstr = modalDate.toISOString().slice(0,10);
        const rec = records.find(r => r.date === dstr);
        return (
          <div className="text-sm">
            {rec ? (
              <div className="space-y-1">
                <div><span className="font-semibold">Date:</span> {rec.date}</div>
                <div><span className="font-semibold">Class:</span> {rec.class_name}</div>
                <div><span className="font-semibold">Status:</span> {rec.status}</div>
              </div>
            ) : (
              <div className="text-gray-600">No attendance record for this date.</div>
            )}
          </div>
        );
      })()}
    </Modal>
    </>
  );
};

export default StudentAttendance;
