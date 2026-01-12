import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Calendar from '../../components/Calendar';
import Modal from '../../components/Modal';
import { attendanceAPI, timetableAPI, examAPI, markAPI, admissionAPI, studentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [records, setRecords] = useState([]);
  const [slots, setSlots] = useState([]);
  const [exams, setExams] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [recentMarks, setRecentMarks] = useState([]);
  const [publishedMarks, setPublishedMarks] = useState([]);
  const [admissionTemplate, setAdmissionTemplate] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [downloadingAdmissionForm, setDownloadingAdmissionForm] = useState(false);
  const [downloadingAdmitCard, setDownloadingAdmitCard] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentSource, setPaymentSource] = useState('');
  const [stats, setStats] = useState({
    totalClasses: 0,
    presentCount: 0,
    absentCount: 0,
    upcomingExams: 0,
    avgMarks: 0,
    attendanceRate: 0
  });
  const header = useMemo(() => new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }), [year, month]);
  const groupedResults = useMemo(() => {
    const groups = {};
    (publishedMarks || []).forEach((mark) => {
      const examName = mark.exam_name || 'Exam Results';
      if (!groups[examName]) {
        groups[examName] = { examName, date: mark.date, marks: [] };
      }
      groups[examName].marks.push(mark);
      if (mark.date && (!groups[examName].date || new Date(mark.date) > new Date(groups[examName].date))) {
        groups[examName].date = mark.date;
      }
    });
    return Object.values(groups).sort((a, b) => {
      const ad = a.date ? new Date(a.date).getTime() : 0;
      const bd = b.date ? new Date(b.date).getTime() : 0;
      return bd - ad;
    });
  }, [publishedMarks]);

  useEffect(() => {
    const date_from = new Date(year, month, 1).toISOString().slice(0,10);
    const date_to = new Date(year, month + 1, 0).toISOString().slice(0,10);
    (async () => {
      try {
        const res = await attendanceAPI.getAll({ date_from, date_to });
        setRecords(res.data);

        // Calculate attendance stats
        const presentCount = res.data.filter(r => r.status === 'present').length;
        const absentCount = res.data.filter(r => r.status === 'absent').length;
        const totalClasses = res.data.length;
        const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

        setStats(prev => ({
          ...prev,
          presentCount,
          absentCount,
          totalClasses,
          attendanceRate
        }));
      } catch (e) { console.error(e); toast.error('Failed to load attendance'); }
    })();
    (async () => {
      try {
        const res = await timetableAPI.getAll();
        setSlots(res.data);
      } catch (e) { console.error(e); }
    })();
    (async () => {
      try {
        const res = await examAPI.getAll({ date_from, date_to });
        setExams(res.data);

        // Count upcoming exams
        const upcomingExams = res.data.filter(e => new Date(e.date) >= new Date()).length;
        setStats(prev => ({ ...prev, upcomingExams }));
      } catch (e) { console.error(e); }
    })();
    (async () => {
      try {
        const res = await markAPI.getAll();
        const published = (res.data || []).filter(m => m.published);
        setPublishedMarks(published);
        const recent = published.sort((a,b)=> new Date(b.date) - new Date(a.date)).slice(0,5);
        setRecentMarks(recent);

        // Calculate average marks
        if (recent.length > 0) {
          const avgMarks = Math.round(recent.reduce((sum, m) => sum + ((m.score / m.max_score) * 100), 0) / recent.length);
          setStats(prev => ({ ...prev, avgMarks }));
        }
      } catch (e) { console.error(e); }
    })();
  }, [year, month, toast]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get('payment');
    if (!payment) return;
    setPaymentStatus(payment);
    setPaymentSource(params.get('source') || '');
    setPaymentModalOpen(true);
    ['payment', 'source', 'tran_id', 'val_id'].forEach((key) => params.delete(key));
    const query = params.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ''}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const [templateRes, studentRes] = await Promise.all([
          admissionAPI.getDefaultTemplate().catch(() => null),
          studentAPI.getAll().catch(() => ({ data: [] })),
        ]);

        if (templateRes?.data) {
          setAdmissionTemplate(templateRes.data);
        }

        const studentRecord = studentRes.data?.[0];
        if (studentRecord) {
          setStudentProfile(studentRecord);
        }
      } catch (error) {
        console.error('Failed to prepare admission form data', error);
      }
    })();
  }, []);

  const handleDownloadAdmissionForm = useCallback(async () => {
    if (!admissionTemplate || !studentProfile) {
      toast.error('Admission form is not ready yet. Please try again later.');
      return;
    }

    try {
      setDownloadingAdmissionForm(true);
      const response = await admissionAPI.downloadStudentForm(admissionTemplate.slug, studentProfile.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${admissionTemplate.slug}-admission-form.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download admission form', error);
      toast.error('Unable to download your admission form right now.');
    } finally {
      setDownloadingAdmissionForm(false);
    }
  }, [admissionTemplate, studentProfile, toast]);

  const handleDownloadAdmitCard = useCallback(async (examTitle, classId) => {
    const key = `${examTitle}-${classId}`;
    try {
      setDownloadingAdmitCard(key);
      const response = await examAPI.downloadAdmitCard(examTitle, classId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admit-card-${examTitle.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download admit card', error);
      toast.error('Unable to download admit card right now.');
    } finally {
      setDownloadingAdmitCard('');
    }
  }, [toast]);

  const menuItems = useMemo(() => [
    { key: 'materials', title: 'Study Materials', path: '/student/materials', icon: '📚', description: 'Access class materials and resources', color: 'from-blue-500 to-blue-600' },
    { key: 'fees', title: 'Fees & Payments', path: '/student/fees', icon: '💰', description: 'View and pay your fees', color: 'from-green-500 to-emerald-600' },
    { key: 'transcripts', title: 'Transcript Request', path: '/student/transcripts', icon: 'TR', description: 'Request your transcript', color: 'from-indigo-500 to-indigo-600' },
    { key: 'attendance', title: 'Attendance', path: '/student/attendance', icon: '✅', description: 'View your attendance', color: 'from-purple-500 to-indigo-600' },
    { key: 'timetable', title: 'Timetable', path: '/student/timetable', icon: '🗓️', description: 'View class timetable', color: 'from-orange-500 to-amber-600' },
    {
      key: 'admission-form',
      title: 'Admission Form',
      icon: '📝',
      description: 'Download your pre-filled admission form PDF',
      color: 'from-emerald-500 to-teal-600',
      onClick: handleDownloadAdmissionForm,
      disabled: !admissionTemplate || !studentProfile,
      loading: downloadingAdmissionForm,
    },
  ], [handleDownloadAdmissionForm, admissionTemplate, studentProfile, downloadingAdmissionForm]);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.first_name}! Here's your overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Classes</p>
                <p className="text-4xl font-bold">{stats.totalClasses}</p>
                <p className="text-blue-100 text-xs mt-2">This month</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Attendance Rate</p>
                <p className="text-4xl font-bold">{stats.attendanceRate}%</p>
                <p className="text-green-100 text-xs mt-2">{stats.presentCount} present</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Upcoming Exams</p>
                <p className="text-4xl font-bold">{stats.upcomingExams}</p>
                <p className="text-purple-100 text-xs mt-2">Scheduled exams</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">Average Score</p>
                <p className="text-4xl font-bold">{stats.avgMarks}%</p>
                <p className="text-orange-100 text-xs mt-2">Recent exams</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar overview */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Calendar
              year={year}
              month={month}
              header={header}
              onPrev={() => setMonth((m) => (m === 0 ? (setYear(y=>y-1), 11) : m - 1))}
              onNext={() => setMonth((m) => (m === 11 ? (setYear(y=>y+1), 0) : m + 1))}
              onDayClick={(date) => { setModalDate(date); setModalOpen(true); }}
              renderDay={(date) => {
                const isCurrentMonth = date.getMonth() === month;
                const dstr = date.toISOString().slice(0,10);
                const rec = records.find(r => r.date === dstr);
                const dayExams = exams.filter(e => e.date === dstr);
                const weekday = date.getDay() === 0 ? 6 : date.getDay()-1;
                const daySlots = slots.filter(s => s.weekday === weekday);
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
                    {daySlots.length > 0 && (
                      <div className="mt-1 flex items-center space-x-1">
                        <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full" title={`${daySlots.length} class(es)`}></span>
                        {daySlots.length > 1 && <span className="text-[10px] text-blue-600">{daySlots.length}</span>}
                      </div>
                    )}
                    {dayExams.length > 0 && (
                      <div className="mt-1 text-[10px] bg-blue-100 text-blue-800 inline-block px-1.5 py-0.5 rounded">Exam</div>
                    )}
                  </div>
                );
              }}
            />
            {/* Legend */}
            <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1"><span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span><span>Class(es) scheduled</span></div>
              <div className="flex items-center space-x-1"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Exam</span><span>Exam on this day</span></div>
              <div className="flex items-center space-x-1"><span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded">P</span><span>Present</span></div>
              <div className="flex items-center space-x-1"><span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded">A</span><span>Absent</span></div>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="font-semibold mb-2">This Week</h2>
              <div className="space-y-2 text-sm">
                {slots.slice(0,5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="truncate">{s.subject_name || '—'}</div>
                    <div className="text-gray-500">{s.start_time} - {s.end_time}</div>
                  </div>
                ))}
              </div>
              <Link to="/student/timetable" className="text-blue-600 text-sm inline-block mt-2">View timetable →</Link>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 mt-6">
              <h2 className="font-semibold mb-2">Recent Marks</h2>
              <div className="space-y-1 text-sm">
                {recentMarks.length === 0 ? (
                  <div className="text-gray-500">No published marks yet.</div>
                ) : (
                  recentMarks.map(m => (
                    <div key={m.id} className="flex items-center justify-between">
                      <div className="truncate"><span className="font-medium">{m.subject_name}</span> · {m.exam_name}</div>
                      <div className="text-gray-600">{m.score}/{m.max_score}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="mb-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Recent Performance</h2>
          <div className="space-y-3">
            {recentMarks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No marks published yet</p>
            ) : (
              recentMarks.map((mark, idx) => {
                const percentage = (mark.score / mark.max_score) * 100;
                return (
                  <div key={mark.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="font-semibold text-gray-900">{mark.subject_name}</p>
                          <p className="text-xs text-gray-500">{mark.exam_name}</p>
                        </div>
                        <span className="font-bold text-lg">{mark.score}/{mark.max_score}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentage >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                            percentage >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                            percentage >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                            'bg-gradient-to-r from-red-400 to-red-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mb-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Published Results</h2>
          {groupedResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No published results yet</p>
          ) : (
            <div className="space-y-6">
              {groupedResults.map((group) => {
                const totals = group.marks.reduce(
                  (acc, mark) => ({
                    score: acc.score + (Number(mark.score) || 0),
                    max: acc.max + (Number(mark.max_score) || 0),
                  }),
                  { score: 0, max: 0 }
                );
                const percentage = totals.max ? Math.round((totals.score / totals.max) * 100) : 0;
                return (
                  <div key={group.examName} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.examName}</h3>
                        <p className="text-xs text-gray-500">
                          {group.date ? new Date(group.date).toLocaleDateString() : 'Result published'}
                        </p>
                      </div>
                      <div className="text-sm text-gray-700 font-medium">
                        Total: {totals.score}/{totals.max} ({percentage}%)
                      </div>
                    </div>
                    <div className="divide-y">
                      {group.marks.map((mark) => {
                        const percent = mark.max_score ? Math.round((mark.score / mark.max_score) * 100) : 0;
                        return (
                          <div key={mark.id} className="flex items-center justify-between py-2 text-sm">
                            <div className="font-medium text-gray-800">{mark.subject_name}</div>
                            <div className="text-gray-600">
                              {mark.score}/{mark.max_score} ({percent}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Cards with Modern Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => {
            const Content = (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-5xl">{item.icon}</div>
                  {item.loading ? (
                    <svg className="w-6 h-6 text-white opacity-80 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                <p className="text-white text-opacity-90 text-sm">{item.description}</p>
              </>
            );

            const baseClasses = `bg-gradient-to-br ${item.color} p-6 rounded-xl shadow-lg transition-all duration-200 text-white`;

            if (item.onClick) {
              const disabled = item.disabled || item.loading;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={disabled ? undefined : item.onClick}
                  disabled={disabled}
                  className={`${baseClasses} text-left ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl transform hover:scale-105'}`}
                >
                  {Content}
                </button>
              );
            }

            return (
              <Link
                key={item.key}
                to={item.path}
                className={`${baseClasses} hover:shadow-xl transform hover:scale-105`}
              >
                {Content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
    <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={modalDate ? modalDate.toDateString() : ''}>
      {modalDate && (() => {
        const dstr = modalDate.toISOString().slice(0,10);
        const rec = records.find(r => r.date === dstr);
        const weekday = modalDate.getDay() === 0 ? 6 : modalDate.getDay()-1;
        const daySlots = slots.filter(s => s.weekday === weekday);
        const dayExams = exams.filter(e => e.date === dstr);
        const examGroups = dayExams.reduce((acc, exam) => {
          const key = `${exam.title}-${exam.class_assigned}`;
          if (!acc[key]) {
            acc[key] = { title: exam.title, class_assigned: exam.class_assigned };
          }
          return acc;
        }, {});
        const admitCardGroups = Object.values(examGroups);
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Attendance</h4>
              <div className="text-sm">{rec ? (rec.status === 'present' ? 'Present' : 'Absent') : 'No record'}</div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Timetable</h4>
              {daySlots.length === 0 ? <div className="text-sm text-gray-500">No classes</div> : (
                <ul className="text-sm space-y-1">
                  {daySlots.map(s => (<li key={s.id} className="flex items-center justify-between"><span>{s.subject_name || '—'}</span><span className="text-gray-500">{s.start_time} - {s.end_time}</span></li>))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Exams</h4>
              {dayExams.length === 0 ? <div className="text-sm text-gray-500">No exams</div> : (
                <div className="space-y-3">
                  <ul className="text-sm space-y-1">
                    {dayExams.map(e => (
                      <li key={e.id}>
                        <span className="font-medium">{e.title}</span>
                        {e.subject_name ? ` · ${e.subject_name}` : ''}
                        {e.start_time ? ` · ${e.start_time}-${e.end_time||''}` : ''}
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    {admitCardGroups.map(group => {
                      const key = `${group.title}-${group.class_assigned}`;
                      const isLoading = downloadingAdmitCard === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleDownloadAdmitCard(group.title, group.class_assigned)}
                          disabled={isLoading}
                          className={`px-3 py-2 text-sm rounded ${isLoading ? 'bg-gray-300 text-gray-700' : 'bg-blue-600 text-white'}`}
                        >
                          {isLoading ? 'Preparing Admit Card...' : `Download Admit Card (${group.title})`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </Modal>
    <Modal
      open={paymentModalOpen}
      onClose={() => setPaymentModalOpen(false)}
      title={paymentStatus === 'success' ? 'Payment Successful' : 'Payment Failed'}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          {paymentStatus === 'success'
            ? `Your ${paymentSource === 'transcript' ? 'transcript request' : 'fee'} payment has been completed successfully.`
            : `Your ${paymentSource === 'transcript' ? 'transcript request' : 'fee'} payment could not be completed. Please try again.`}
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setPaymentModalOpen(false)}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
    </>
  );
};

export default StudentDashboard;
