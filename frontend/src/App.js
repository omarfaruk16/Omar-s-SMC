import React from 'react';
import ScrollToTop from "./components/ScrollToTop";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Teachers from './pages/Teachers';
import Notices from './pages/Notices';
import NoticeDetail from './pages/NoticeDetail';
import Results from './pages/Results';
import Contact from './pages/Contact';

// Information Pages
import GoverningBody from './pages/GoverningBody';
import StudentsInformation from './pages/StudentsInformation';
import Staffs from './pages/Staffs';
import LibraryInformation from './pages/LibraryInformation';

// Auth Pages
import Login from './pages/Login';
import TeacherRegister from './pages/TeacherRegister';
import StudentRegister from './pages/StudentRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';

// Admin Dashboard
import AdminDashboard from './pages/admin/Dashboard';
import ManagePending from './pages/admin/ManagePending';
import ManageUsers from './pages/admin/ManageUsers';
import ManageClasses from './pages/admin/ManageClasses';
import ManageNotices from './pages/admin/ManageNotices';
import ManageResults from './pages/admin/ManageResults';
import ManageFees from './pages/admin/ManageFees';
import ManagePayments from './pages/admin/ManagePayments';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageTimetable from './pages/admin/ManageTimetable';
import ManageAttendance from './pages/admin/ManageAttendance';
import ManageExams from './pages/admin/ManageExams';
import ManageMarks from './pages/admin/ManageMarks';
import TeacherAssignments from './pages/admin/TeacherAssignments';
import ManageTeacherAssignments from './pages/admin/ManageTeacherAssignments';
import ManageAdmissionForm from './pages/admin/ManageAdmissionForm';
import ManageTranscripts from './pages/admin/ManageTranscripts';

// Teacher Dashboard
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherClasses from './pages/teacher/Classes';
import TeacherMaterials from './pages/teacher/Materials';
import TeacherAttendance from './pages/teacher/Attendance';
import TeacherTimetable from './pages/teacher/Timetable';
import TeacherStudents from './pages/teacher/Students';
import TeacherResults from './pages/teacher/Results';

// Student Dashboard
import StudentDashboard from './pages/student/Dashboard';
import StudentMaterials from './pages/student/Materials';
import StudentFees from './pages/student/Fees';
import StudentAttendance from './pages/student/Attendance';
import StudentTimetable from './pages/student/Timetable';
import TranscriptRequest from './pages/student/TranscriptRequest';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFail from './pages/PaymentFail';
import PaymentCancel from './pages/PaymentCancel';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
        <ScrollToTop />
          <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/notices/:id" element={<NoticeDetail />} />
            <Route path="/results" element={<Results />} />
            <Route path="/contact" element={<Contact />} />

            {/* Information Routes */}
            <Route path="/information/governing-body" element={<GoverningBody />} />
            <Route path="/information/students" element={<StudentsInformation />} />
            <Route path="/information/staffs" element={<Staffs />} />
            <Route path="/information/library" element={<LibraryInformation />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register/teacher" element={<TeacherRegister />} />
            <Route path="/register/student" element={<StudentRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/fail" element={<PaymentFail />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/pending"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManagePending />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageUsers />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageClasses />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/notices"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageNotices />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/results"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageResults />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/fees"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageFees />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManagePayments />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/subjects"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageSubjects />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/timetable"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageTimetable />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageAttendance />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/exams"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageExams />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/marks"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageMarks />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/teacher-assignments"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <TeacherAssignments />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/manage-teacher-assignments"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageTeacherAssignments />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/admission-form"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageAdmissionForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/transcripts"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageTranscripts />
                </PrivateRoute>
              }
            />

            {/* Teacher Routes */}
            <Route
              path="/teacher/dashboard"
              element={
                <PrivateRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/teacher/classes"
              element={
                <PrivateRoute allowedRoles={['teacher']}>
                  <TeacherClasses />
                </PrivateRoute>
              }
            />
            <Route
              path="/teacher/materials"
              element={
                <PrivateRoute allowedRoles={['teacher']}>
                  <TeacherMaterials />
                </PrivateRoute>
              }
            />
            <Route
              path="/teacher/students"
              element={
                <PrivateRoute allowedRoles={['teacher']}>
                  <TeacherStudents />
                </PrivateRoute>
              }
            />
            <Route
              path="/teacher/results"
              element={
                <PrivateRoute allowedRoles={['teacher']}>
                  <TeacherResults />
                </PrivateRoute>
              }
            />
            <Route
              path="/teacher/attendance"
              element={
                <PrivateRoute allowedRoles={['teacher']}>
                  <TeacherAttendance />
                </PrivateRoute>
              }
            />
            <Route
              path="/teacher/timetable"
              element={
                <PrivateRoute allowedRoles={['teacher']}>
                  <TeacherTimetable />
                </PrivateRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/materials"
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentMaterials />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/fees"
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentFees />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/attendance"
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentAttendance />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/timetable"
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentTimetable />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/transcripts"
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <TranscriptRequest />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute allowedRoles={['admin', 'teacher', 'student']}>
                  <Profile />
                </PrivateRoute>
              }
            />
          </Routes>
          </Layout>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
