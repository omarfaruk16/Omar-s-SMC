import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Calendar from '../../components/Calendar';
import Modal from '../../components/Modal';
import { notificationAPI, timetableAPI, teacherAssignmentAPI, attendanceAPI, studentAPI } from '../../services/api';
import {
  getActiveSubscription,
  getOrCreateSubscription,
  getPushPermission,
  isPushSupported,
} from '../../utils/pushNotifications';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const menuItems = [
    { title: 'Quick Attendance', path: '/teacher/attendance', icon: '✅', description: 'Tap to take attendance', color: 'from-emerald-500 to-teal-600' },
    { title: 'My Classes', path: '/teacher/classes', icon: '📚', description: 'View your classes', color: 'from-blue-500 to-blue-600' },
    { title: 'Results', path: '/teacher/results', icon: '📊', description: 'Record exam results', color: 'from-purple-500 to-indigo-600' },
    { title: 'Students', path: '/teacher/students', icon: '👩‍🎓', description: 'Check student progress', color: 'from-pink-500 to-rose-600' },
    { title: 'Class Materials', path: '/teacher/materials', icon: '📝', description: 'Upload materials', color: 'from-orange-500 to-amber-600' },
    { title: 'Timetable', path: '/teacher/timetable', icon: '🗓️', description: 'Weekly schedule', color: 'from-cyan-500 to-blue-600' },
  ];

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [slots, setSlots] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [pushStatus, setPushStatus] = useState(getPushPermission());
  const [pushLoading, setPushLoading] = useState(false);
  const pushSupported = isPushSupported();
  const [stats, setStats] = useState({
    mySubjects: 0,
    myClasses: 0,
    totalStudents: 0,
    todayClasses: 0,
    weeklyAttendance: []
  });
  const header = useMemo(() => new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }), [year, month]);

  useEffect(() => {
    (async()=>{
      try {
        const res = await timetableAPI.getAll();
        setSlots(res.data);

        // Get teacher stats
        const assignmentsRes = await teacherAssignmentAPI.getAll().catch(() => ({ data: [] }));
        const myAssignments = assignmentsRes.data.filter(a => a.teacher_name === `${user.first_name} ${user.last_name}`);
        const uniqueSubjects = [...new Set(myAssignments.map(a => a.subject))];
        const uniqueClasses = [...new Set(myAssignments.map(a => a.class_obj))];

        // Get attendance for last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().slice(0, 10);
          const attendanceRes = await attendanceAPI.getAll({ date_from: dateStr, date_to: dateStr }).catch(() => ({ data: [] }));
          const dayRecords = attendanceRes.data;
          const presentCount = dayRecords.filter(a => a.status === 'present').length;
          last7Days.push({
            date: dateStr,
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            present: presentCount,
            total: dayRecords.length
          });
        }

        // Count students
        const studentsRes = await studentAPI.getAll().catch(() => ({ data: [] }));
        const totalStudents = studentsRes.data.filter(s => s.user.status === 'approved').length;

        // Today's classes count
        const todayWeekday = (new Date().getDay() + 6) % 7;
        const todayClasses = res.data.filter(s => s.weekday === todayWeekday).length;

        setStats({
          mySubjects: uniqueSubjects.length,
          myClasses: uniqueClasses.length,
          totalStudents: totalStudents,
          todayClasses: todayClasses,
          weeklyAttendance: last7Days
        });
      } catch(e){
        console.error(e);
      }
    })();
  }, [year, month, user]);

  useEffect(() => {
    if (!pushSupported) return;
    setPushStatus(getPushPermission());
  }, [pushSupported]);

  const enableNotifications = async () => {
    if (!pushSupported || pushLoading) return;
    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);
      if (permission !== 'granted') {
        toast.error('Notifications were not enabled.');
        return;
      }
      const config = await notificationAPI.getPushConfig();
      const publicKey = config.data?.publicKey;
      if (!publicKey) {
        toast.error('Push configuration is missing.');
        return;
      }
      const subscription = await getOrCreateSubscription(publicKey);
      if (!subscription) {
        toast.error('Unable to create a push subscription.');
        return;
      }
      await notificationAPI.registerPushSubscription({
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys,
        user_agent: navigator.userAgent,
      });
      toast.success('Class reminders enabled.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to enable notifications.');
    } finally {
      setPushLoading(false);
    }
  };

  const disableNotifications = async () => {
    if (!pushSupported || pushLoading) return;
    setPushLoading(true);
    try {
      const subscription = await getActiveSubscription();
      if (subscription) {
        await notificationAPI.unregisterPushSubscription({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      toast.success('Class reminders disabled.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to disable notifications.');
    } finally {
      setPushLoading(false);
    }
  };

  // compute next 5 upcoming classes from weekly slots
  const upcoming = useMemo(() => {
    const nowDt = new Date();
    const items = slots.map(s => {
      const next = new Date(nowDt);
      const todayWeekday = (nowDt.getDay() + 6) % 7; // Mon=0
      const delta = (s.weekday - todayWeekday + 7) % 7;
      next.setDate(nowDt.getDate() + delta);
      // set time from slot
      const [sh, sm] = String(s.start_time || '00:00').split(':').map(Number);
      next.setHours(sh || 0, sm || 0, 0, 0);
      return { ...s, nextAt: next };
    }).filter(x => x.nextAt >= nowDt);
    items.sort((a,b) => a.nextAt - b.nextAt);
    return items.slice(0,5);
  }, [slots]);

  const attendanceRate = useMemo(() => {
    const total = stats.weeklyAttendance.reduce((sum, day) => sum + day.total, 0);
    const present = stats.weeklyAttendance.reduce((sum, day) => sum + day.present, 0);
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }, [stats.weeklyAttendance]);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.first_name}! Here's your overview</p>
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Class Reminder Notifications</h2>
              <p className="text-sm text-gray-600">
                Get a browser reminder 15 minutes before each of your scheduled classes.
              </p>
              {!pushSupported && (
                <p className="text-xs text-red-500 mt-1">Push notifications are not supported in this browser.</p>
              )}
              {pushSupported && pushStatus === 'denied' && (
                <p className="text-xs text-red-500 mt-1">Notifications are blocked in your browser settings.</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {pushSupported && pushStatus === 'granted' ? (
                <button
                  type="button"
                  onClick={disableNotifications}
                  disabled={pushLoading}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  {pushLoading ? 'Updating...' : 'Disable'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enableNotifications}
                  disabled={!pushSupported || pushLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {pushLoading ? 'Enabling...' : 'Enable'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">My Subjects</p>
                <p className="text-4xl font-bold">{stats.mySubjects}</p>
                <p className="text-blue-100 text-xs mt-2">Teaching subjects</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">My Classes</p>
                <p className="text-4xl font-bold">{stats.myClasses}</p>
                <p className="text-purple-100 text-xs mt-2">Assigned classes</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Today's Classes</p>
                <p className="text-4xl font-bold">{stats.todayClasses}</p>
                <p className="text-emerald-100 text-xs mt-2">Scheduled today</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">Attendance Rate</p>
                <p className="text-4xl font-bold">{attendanceRate}%</p>
                <p className="text-orange-100 text-xs mt-2">Last 7 days average</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Calendar
              year={year}
              month={month}
              header={header}
              onPrev={() => setMonth((m) => (m === 0 ? (setYear(y=>y-1), 11) : m - 1))}
              onNext={() => setMonth((m) => (m === 11 ? (setYear(y=>y+1), 0) : m + 1))}
              onDayClick={(date)=>{ setModalDate(date); setModalOpen(true); }}
              renderDay={(date) => {
                const isCurrentMonth = date.getMonth() === month;
                const weekday = date.getDay() === 0 ? 6 : date.getDay()-1;
                const daySlots = slots.filter(s => s.weekday === weekday);
                return (
                  <div className={`text-sm ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{date.getDate()}</span>
                      {daySlots.length > 0 && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">{daySlots.length}</span>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            {/* Legend */}
            <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1"><span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">#</span><span>Classes count</span></div>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="font-semibold mb-2">Upcoming Classes</h2>
              <div className="space-y-2 text-sm">
                {upcoming.length === 0 ? (
                  <div className="text-gray-500">No upcoming classes</div>
                ) : (
                  upcoming.map(u => (
                    <div key={u.id} className="flex items-center justify-between">
                      <div className="truncate">
                        <span className="font-medium">{u.subject_name || '—'}</span>
                        <span className="text-xs text-gray-500"> · {u.class_name}</span>
                      </div>
                      <div className="text-gray-600 text-xs">{u.nextAt.toLocaleDateString()} {u.start_time}</div>
                    </div>
                  ))
                )}
              </div>
              <Link to="/teacher/timetable" className="text-blue-600 text-sm inline-block mt-2">View timetable →</Link>
            </div>
          </div>
        </div>

        {/* Attendance Chart */}
        <div className="mb-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Weekly Attendance Trend</h2>
          <div className="flex items-end justify-between h-48 space-x-2">
            {stats.weeklyAttendance.map((day, idx) => {
              const percentage = day.total > 0 ? (day.present / day.total) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                    <div
                      className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-300 hover:from-purple-600 hover:to-purple-500 relative group"
                      style={{ height: `${percentage}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {day.present}/{day.total} ({Math.round(percentage)}%)
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-gray-600">{day.day}</p>
                    <p className="text-xs text-gray-400">{new Date(day.date).getDate()}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gradient-to-t from-purple-500 to-purple-400 rounded"></div>
              <span className="text-gray-600">Present students</span>
            </div>
            <span className="font-semibold text-gray-700">Average: {attendanceRate}%</span>
          </div>
        </div>

        {/* Action Cards with Modern Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`bg-gradient-to-br ${item.color} p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-white`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-5xl">{item.icon}</div>
                <svg className="w-6 h-6 text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
              <p className="text-white text-opacity-90 text-sm">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
    <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={modalDate ? modalDate.toDateString() : ''}>
      {modalDate && (() => {
        const weekday = modalDate.getDay() === 0 ? 6 : modalDate.getDay()-1;
        const daySlots = slots.filter(s => s.weekday === weekday);
        return (
          <div className="space-y-2 text-sm">
            {daySlots.length === 0 ? (
              <div className="text-gray-600">No classes on this date.</div>
            ) : (
              daySlots.map(s => (
                <div key={s.id} className="flex items-center justify-between border-b py-1">
                  <div>
                    <div className="font-medium">{s.subject_name || '—'}</div>
                    <div className="text-xs text-gray-500">{s.class_name}</div>
                  </div>
                  <div className="text-gray-600">{s.start_time} - {s.end_time}</div>
                </div>
              ))
            )}
          </div>
        );
      })()}
    </Modal>
    </>
  );
};

export default TeacherDashboard;
