import React, { useEffect, useState } from 'react';
import { timetableAPI, classAPI, subjectAPI, teacherAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const weekdays = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' },
];

// 45-minute lesson bins from 08:00 to 17:00
const TIME_BINS = [
  '08:00','08:45','09:30','10:15','11:00','11:45','12:30','13:15','14:00','14:45','15:30','16:15'
];

const addMinutes = (hhmm, mins) => {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  const total = (h * 60 + m + mins + 24 * 60) % (24 * 60);
  const nh = String(Math.floor(total / 60)).padStart(2, '0');
  const nm = String(total % 60).padStart(2, '0');
  return `${nh}:${nm}`;
};

const ManageTimetable = () => {
  const toast = useToast();
  const [slots, setSlots] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ class_assigned:'', weekday:0, start_time:'09:00', end_time:'09:45', subject:'', teacher:'' });
  const [viewClass, setViewClass] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [hoverBin, setHoverBin] = useState(null); // `${weekday}-${time}`

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [tRes, cRes, sRes, trRes] = await Promise.all([
        timetableAPI.getAll(), classAPI.getAll(), subjectAPI.getAll(), teacherAPI.getAll()
      ]);
      setSlots(tRes.data);
      setClasses(cRes.data);
      setSubjects(sRes.data);
      setTeachers(trRes.data);
    } catch (e) { console.error(e); toast.error('Failed to load timetable'); }
    finally { setLoading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    try { await timetableAPI.create({ ...form, subject: form.subject || null, teacher: form.teacher || null }); toast.success('Slot added'); setForm({ class_assigned:'', weekday:0, start_time:'09:00', end_time:'09:45', subject:'', teacher:'' }); load(); }
    catch(e){ console.error(e); toast.error('Failed to add slot'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this slot?')) return;
    try { await timetableAPI.delete(id); setSlots(slots.filter(s=>s.id!==id)); toast.success('Slot deleted'); }
    catch(e){ console.error(e); toast.error('Failed to delete slot'); }
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Timetable</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Add Slot</h2>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select required value={form.class_assigned} onChange={(e)=>setForm({...form, class_assigned:Number(e.target.value)})} className="px-3 py-2 border rounded-lg">
              <option value="" disabled>Select class</option>
              {classes.map(c => (<option key={c.id} value={c.id}>{c.name}{c.section?` - ${c.section}`:''}</option>))}
            </select>
            <select required value={form.weekday} onChange={(e)=>setForm({...form, weekday:Number(e.target.value)})} className="px-3 py-2 border rounded-lg">
              {weekdays.map(w => (<option key={w.value} value={w.value}>{w.label}</option>))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={form.start_time} onChange={(e)=>setForm({...form, start_time:e.target.value})} className="px-3 py-2 border rounded-lg" />
              <input type="time" value={form.end_time} onChange={(e)=>setForm({...form, end_time:e.target.value})} className="px-3 py-2 border rounded-lg" />
            </div>
            <select value={form.subject} onChange={(e)=>setForm({...form, subject: e.target.value ? Number(e.target.value) : ''})} className="px-3 py-2 border rounded-lg">
              <option value="">(no subject)</option>
              {subjects.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            <select value={form.teacher} onChange={(e)=>setForm({...form, teacher: e.target.value ? Number(e.target.value) : ''})} className="px-3 py-2 border rounded-lg">
              <option value="">(no teacher)</option>
              {teachers.map(t => (<option key={t.id} value={t.id}>{t.user.first_name} {t.user.last_name}</option>))}
            </select>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {slots.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No slots added.</div>
          ) : (
            <div className="p-4">
              <div className="mb-3">
                <select value={viewClass} onChange={(e)=>setViewClass(e.target.value)} className="px-3 py-2 border rounded-lg">
                  <option value="">All Classes</option>
                  {classes.map(c => (<option key={c.id} value={c.id}>{c.name}{c.section?` - ${c.section}`:''}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weekdays.map((w) => (
                  <div key={w.value} className="border rounded hover:shadow-sm transition"
                    onDragOver={(e)=>e.preventDefault()}
                    onDrop={async (e)=>{
                      const data = e.dataTransfer.getData('text/plain');
                      const id = Number(data);
                      if (!id && id !== 0) return;
                      try {
                        await timetableAPI.patch(id, { weekday: w.value });
                        setSlots(prev => prev.map(s=> s.id===id ? { ...s, weekday: w.value } : s));
                        toast.success('Moved slot');
                      } catch(err) { console.error(err); toast.error('Failed to move slot'); }
                    }}
                  >
                    <div className="px-3 py-2 font-semibold bg-gray-50">{w.label}</div>
                    {/* Time bins for precise drop to change time */}
                    <div className="px-3 py-2 space-y-1 border-t">
                      <div className="text-xs text-gray-500">Drag a class into a time to reschedule start time.</div>
                      <div className="grid grid-cols-2 gap-1">
                        {TIME_BINS.map((t) => (
                          <button
                            key={`${w.value}-${t}`}
                            type="button"
                            className={`text-left text-xs px-2 py-1 border rounded cursor-pointer transition ${hoverBin===`${w.value}-${t}` ? 'bg-purple-50 border-purple-300' : 'hover:bg-purple-50'}`}
                            onDragOver={(e)=>{ e.preventDefault(); setHoverBin(`${w.value}-${t}`); }}
                            onDragLeave={()=> setHoverBin(null)}
                            onDrop={async (e)=>{
                              const data = e.dataTransfer.getData('text/plain');
                              const id = Number(data);
                              if (!id && id !== 0) return;
                              const slot = slots.find(s=>s.id===id);
                              if (!slot) return;
                              const sh = String(slot.start_time||'00:00');
                              const eh = String(slot.end_time||'00:00');
                              const [sH,sM] = sh.split(':').map(Number);
                              const [eH,eM] = eh.split(':').map(Number);
                              const dur = (eH*60+eM) - (sH*60+sM);
                              const newStart = t;
                              const newEnd = addMinutes(newStart, Math.max(0, dur||45));
                              try {
                                await timetableAPI.patch(id, { weekday: w.value, start_time: newStart, end_time: newEnd });
                                setSlots(prev => prev.map(s=> s.id===id ? { ...s, weekday: w.value, start_time: newStart, end_time: newEnd } : s));
                                setHoverBin(null);
                                toast.success(`Moved to ${w.label} ${newStart}`);
                              } catch(err) { console.error(err); toast.error('Failed to reschedule'); }
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(slots.filter(s => s.weekday===w.value && (!viewClass || s.class_assigned===Number(viewClass))).map(s => (
                      <div key={s.id} className={`px-3 py-2 flex items-center justify-between border-t cursor-move transition ${draggingId===s.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        draggable
                        onDragStart={(e)=>{ e.dataTransfer.setData('text/plain', String(s.id)); setDraggingId(s.id); }}
                        onDragEnd={()=> setDraggingId(null)}
                      >
                        <div>
                          <div className="font-medium">{s.subject_name || '—'}</div>
                          <div className="text-xs text-gray-500">{s.class_name} {s.teacher_name ? `· ${s.teacher_name}` : ''}</div>
                        </div>
                        <div className="space-x-2">
                          <span className="text-sm text-gray-600">{s.start_time}-{s.end_time}</span>
                          <button onClick={()=>remove(s.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Delete</button>
                        </div>
                      </div>
                    ))) || null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTimetable;
