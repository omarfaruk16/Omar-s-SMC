import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { teacherAPI, studentAPI, classAPI, noticeAPI, attendanceAPI, examAPI, teacherAssignmentAPI } from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalClasses: 0,
    pendingApprovals: 0,
    totalAssignments: 0,
    unassignedTeachers: 0,
    todayAttendance: 0,
    upcomingExams: 0,
    recentAttendance: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [teachers, students, classes, assignments, attendance, exams] = await Promise.all([
        teacherAPI.getAll(),
        studentAPI.getAll(),
        classAPI.getAll(),
        teacherAssignmentAPI.getAll().catch(() => ({ data: [] })),
        attendanceAPI.getAll({ date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), date_to: new Date().toISOString().slice(0, 10) }).catch(() => ({ data: [] })),
        examAPI.getAll().catch(() => ({ data: [] }))
      ]);

      const pendingTeachers = teachers.data.filter(t => t.user.status === 'pending').length;
      const pendingStudents = students.data.filter(s => s.user.status === 'pending').length;
      const approvedTeachers = teachers.data.filter(t => t.user.status === 'approved').length;
      const approvedStudents = students.data.filter(s => s.user.status === 'approved').length;

      const today = new Date().toISOString().slice(0, 10);
      const todayAttendanceCount = attendance.data.filter(a => a.date === today).length;
      const upcomingExamsCount = exams.data.filter(e => new Date(e.date) >= new Date()).length;

      // Get teacher assignments by teacher
      const teacherAssignmentMap = {};
      (assignments.data || []).forEach(a => {
        teacherAssignmentMap[a.teacher] = (teacherAssignmentMap[a.teacher] || 0) + 1;
      });
      const unassignedCount = teachers.data.filter(t => t.user.status === 'approved' && !teacherAssignmentMap[t.id]).length;

      // Last 7 days attendance summary
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().slice(0, 10);
        const dayRecords = attendance.data.filter(a => a.date === dateStr);
        const presentCount = dayRecords.filter(a => a.status === 'present').length;
        last7Days.push({
          date: dateStr,
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          present: presentCount,
          total: dayRecords.length
        });
      }

      setStats({
        totalTeachers: approvedTeachers,
        totalStudents: approvedStudents,
        totalClasses: classes.data.length,
        pendingApprovals: pendingTeachers + pendingStudents,
        totalAssignments: assignments.data?.length || 0,
        unassignedTeachers: unassignedCount,
        todayAttendance: todayAttendanceCount,
        upcomingExams: upcomingExamsCount,
        recentAttendance: last7Days
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const attendanceRate = useMemo(() => {
    const total = stats.recentAttendance.reduce((sum, day) => sum + day.total, 0);
    const present = stats.recentAttendance.reduce((sum, day) => sum + day.present, 0);
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }, [stats.recentAttendance]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Overview of your school management system</p>
          </div>
          <Link
            to="/admin/admission-form"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
          >
            Configure Admission Form
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Main Stats Cards - Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/admin/users" className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-blue-100 text-sm font-medium mb-1">Total Teachers</p>
                <p className="text-4xl font-bold">{stats.totalTeachers}</p>
                <p className="text-blue-100 text-xs mt-2">View all teachers</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </Link>

          <Link to="/admin/users" className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-green-100 text-sm font-medium mb-1">Total Students</p>
                <p className="text-4xl font-bold">{stats.totalStudents}</p>
                <p className="text-green-100 text-xs mt-2">View all students</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </Link>

          <Link to="/admin/classes" className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-purple-100 text-sm font-medium mb-1">Total Classes</p>
                <p className="text-4xl font-bold">{stats.totalClasses}</p>
                <p className="text-purple-100 text-xs mt-2">Manage classes</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </Link>

          <Link to="/admin/pending" className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-orange-100 text-sm font-medium mb-1">Pending Approvals</p>
                <p className="text-4xl font-bold">{stats.pendingApprovals}</p>
                <p className="text-orange-100 text-xs mt-2">Review pending users</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Secondary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/admin/manage-teacher-assignments" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-indigo-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-indigo-100">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
                {stats.unassignedTeachers > 0 && (
                  <p className="text-xs text-orange-600 mt-1">{stats.unassignedTeachers} teachers unassigned</p>
                )}
              </div>
            </div>
          </Link>

          <Link to="/admin/admission-form" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-green-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .843-3 1.882v.236c0 .299.132.584.363.79L12 14l2.637-3.092A1.04 1.04 0 0015 10.118v-.236C15 8.843 13.657 8 12 8z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v4m0 0l-2 2m2-2l2 2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2h-5.586a1 1 0 00-.707.293L9 5.293A1 1 0 018.293 5H6a2 2 0 00-2 2v11.998A2 2 0 006 20z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">Admission Form</p>
                <p className="text-2xl font-bold text-gray-900">Designer</p>
                <p className="text-xs text-gray-500 mt-1">Update branding & fields</p>
              </div>
            </div>
          </Link>

          <Link to="/admin/admission-submissions" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-emerald-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-emerald-100">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">Admission Forms</p>
                <p className="text-2xl font-bold text-gray-900">Submissions</p>
                <p className="text-xs text-gray-500 mt-1">View paid applicants</p>
              </div>
            </div>
          </Link>

          <Link to="/admin/attendance" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-teal-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-teal-100">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">Today's Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayAttendance}</p>
                <p className="text-xs text-gray-500 mt-1">{attendanceRate}% avg this week</p>
              </div>
            </div>
          </Link>

          <Link to="/admin/exams" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-pink-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-pink-100">
                <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">Upcoming Exams</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingExams}</p>
                <p className="text-xs text-gray-500 mt-1">Scheduled exams</p>
              </div>
            </div>
          </Link>

          <Link to="/admin/subjects" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-cyan-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-cyan-100">
                <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">Subjects</p>
                <p className="text-2xl font-bold text-gray-900">View All</p>
                <p className="text-xs text-gray-500 mt-1">Manage subjects</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Attendance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Attendance Overview (Last 7 Days)</h2>
            <div className="flex items-end justify-between h-64 space-x-2">
              {stats.recentAttendance.map((day, idx) => {
                const percentage = day.total > 0 ? (day.present / day.total) * 100 : 0;
                const heightPercentage = percentage;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col justify-end" style={{ height: '200px' }}>
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500 relative group"
                        style={{ height: `${heightPercentage}%` }}
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
                <div className="w-4 h-4 bg-gradient-to-t from-blue-500 to-blue-400 rounded"></div>
                <span className="text-gray-600">Present students</span>
              </div>
              <span className="font-semibold text-gray-700">Average: {attendanceRate}%</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm text-indigo-100">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalTeachers + stats.totalStudents}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm text-indigo-100">Attendance Rate</p>
                <p className="text-3xl font-bold">{attendanceRate}%</p>
                <p className="text-xs text-indigo-100 mt-1">Last 7 days average</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm text-indigo-100">Action Required</p>
                <p className="text-3xl font-bold">{stats.pendingApprovals + stats.unassignedTeachers}</p>
                <p className="text-xs text-indigo-100 mt-1">Pending + Unassigned</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/pending"
              className="p-5 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                  <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="font-bold text-lg text-gray-800">Manage Pending</p>
                  <p className="text-sm text-gray-600">{stats.pendingApprovals} awaiting approval</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/manage-teacher-assignments"
              className="p-5 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group bg-purple-50"
            >
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="font-bold text-lg text-gray-800">Teacher Assignments</p>
                  <p className="text-sm text-purple-700">Quick Edit & Manage</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="font-bold text-lg text-gray-800">Manage Users</p>
                  <p className="text-sm text-gray-600">View all users</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Other Management Options */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Management Options</h2>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link
              to="/admin/attendance"
              className="p-4 text-center border-2 border-gray-200 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center">
                <div className="p-3 bg-teal-100 rounded-lg mb-2 group-hover:bg-teal-200 transition-colors">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <p className="font-semibold text-sm">Attendance</p>
              </div>
            </Link>
            <Link
              to="/admin/exams"
              className="p-4 text-center border-2 border-gray-200 rounded-xl hover:border-pink-400 hover:bg-pink-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center">
                <div className="p-3 bg-pink-100 rounded-lg mb-2 group-hover:bg-pink-200 transition-colors">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-sm">Exams</p>
              </div>
            </Link>
            <Link
              to="/admin/marks"
              className="p-4 text-center border-2 border-gray-200 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center">
                <div className="p-3 bg-yellow-100 rounded-lg mb-2 group-hover:bg-yellow-200 transition-colors">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <p className="font-semibold text-sm">Marks</p>
              </div>
            </Link>
            <Link
              to="/admin/subjects"
              className="p-4 text-center border-2 border-gray-200 rounded-xl hover:border-cyan-400 hover:bg-cyan-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center">
                <div className="p-3 bg-cyan-100 rounded-lg mb-2 group-hover:bg-cyan-200 transition-colors">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="font-semibold text-sm">Subjects</p>
              </div>
            </Link>
            <Link
              to="/admin/notices"
              className="p-4 text-center border-2 border-gray-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center">
                <div className="p-3 bg-red-100 rounded-lg mb-2 group-hover:bg-red-200 transition-colors">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="font-semibold text-sm">Notices</p>
              </div>
            </Link>
            <Link
              to="/admin/timetable"
              className="p-4 text-center border-2 border-gray-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center">
                <div className="p-3 bg-emerald-100 rounded-lg mb-2 group-hover:bg-emerald-200 transition-colors">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-sm">Timetable</p>
              </div>
            </Link>
            <Link
              to="/admin/results"
              className="p-4 text-center border-2 border-gray-200 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center">
                <div className="p-3 bg-violet-100 rounded-lg mb-2 group-hover:bg-violet-200 transition-colors">
                  <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="font-semibold text-sm">Results</p>
              </div>
            </Link>
            <Link
              to="/admin/fees"
              className="p-4 text-center border-2 border-gray-200 rounded-xl hover:border-lime-400 hover:bg-lime-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center">
                <div className="p-3 bg-lime-100 rounded-lg mb-2 group-hover:bg-lime-200 transition-colors">
                  <svg className="w-6 h-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-sm">Fees</p>
              </div>
            </Link>
            <Link
              to="/admin/payments"
              className="p-4 text-center border-2 border-gray-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center">
                <div className="p-3 bg-amber-100 rounded-lg mb-2 group-hover:bg-amber-200 transition-colors">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="font-semibold text-sm">Payments</p>
              </div>
            </Link>
            <Link
              to="/admin/transcripts"
              className="p-4 text-center border-2 border-gray-200 rounded-xl hover:border-sky-400 hover:bg-sky-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center">
                <div className="p-3 bg-sky-100 rounded-lg mb-2 group-hover:bg-sky-200 transition-colors">
                  <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-7-3l7 4 7-4" />
                  </svg>
                </div>
                <p className="font-semibold text-sm">Transcripts</p>
              </div>
            </Link>
            <Link
              to="/admin/teacher-assignments"
              className="p-4 text-center border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center">
                <div className="p-3 bg-indigo-100 rounded-lg mb-2 group-hover:bg-indigo-200 transition-colors">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-sm">T. Assignments</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
