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
import Contact from './pages/Contact';
import AdmissionForm from './pages/AdmissionForm';

// Information Pages
import GoverningBody from './pages/GoverningBody';
import StudentsInformation from './pages/StudentsInformation';
import Staffs from './pages/Staffs';
import LibraryInformation from './pages/LibraryInformation';

// Auth Pages
import Login from './pages/Login';
import TeacherRegister from './pages/TeacherRegister';
import StudentRegister from './pages/StudentRegister';
import AdminProfile from './pages/admin/AdminProfile';
import TeacherProfile from './pages/teacher/TeacherProfile';
import StudentProfile from './pages/student/StudentProfile';

// Admin Dashboard
import AdminDashboard from './pages/admin/Dashboard';
import ManagePending from './pages/admin/ManagePending';
import ManageUsers from './pages/admin/ManageUsers';
import ManageStudents from './pages/admin/ManageStudents';
import ManageTeachers from './pages/admin/ManageTeachers';
import AdminAdmissions from './pages/admin/ManageAdmissionSubmissions';
import TeacherDetails from './pages/admin/TeacherDetails';
import StudentDetails from './pages/admin/StudentDetails';
import ManageClasses from './pages/admin/ManageClasses';
import ClassDetails from './pages/admin/ClassDetails';
import ManageNotices from './pages/admin/ManageNotices';
import ManageFees from './pages/admin/ManageFees';
import ManagePayments from './pages/admin/ManagePayments';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageTimetable from './pages/admin/ManageTimetable';
import ManageAttendance from './pages/admin/ManageAttendance';
import ManageExams from './pages/admin/ManageExamsNew';
import ManageResults from './pages/admin/ManageResults';
import ExamResultsView from './pages/admin/ExamResultsView';
import TeacherAssignments from './pages/admin/TeacherAssignments';
import ManageTeacherAssignments from './pages/admin/ManageTeacherAssignments';
import StudentEdit from './pages/admin/StudentEdit';
import TeacherEdit from './pages/admin/TeacherEdit';
import ManageTestimonials from './pages/admin/ManageTestimonials';

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
import StudentExams from './pages/student/Exams';
import StudentExamResults from './pages/student/ExamResults';
import StudentAttendance from './pages/student/Attendance';
import StudentTimetable from './pages/student/Timetable';
import TestimonialRequest from './pages/student/TestimonialRequest';
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
            <Route path="/contact" element={<Contact />} />
            <Route path="/admission" element={<AdmissionForm />} />

            {/* Information Routes */}
            <Route path="/information/governing-body" element={<GoverningBody />} />
            <Route path="/information/students" element={<StudentsInformation />} />
            <Route path="/information/staffs" element={<Staffs />} />
            <Route path="/information/library" element={<LibraryInformation />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register/teacher" element={<TeacherRegister />} />
            <Route path="/register/student" element={<StudentRegister />} />
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
              path="/admin/students/edit/:id"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <StudentEdit />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/teachers/edit/:id"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <TeacherEdit />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageStudents />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/teachers"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageTeachers />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/teachers/:id"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <TeacherDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/students/:id"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <StudentDetails />
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
              path="/admin/classes/:classId"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ClassDetails />
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
              path="/admin/results"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageResults />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/results/view"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ExamResultsView />
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
              path="/admin/admissions"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminAdmissions />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/testimonials"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ManageTestimonials />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminProfile />
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
            <Route
              path="/teacher/profile"
              element={
                <PrivateRoute allowedRoles={['teacher']}>
                  <TeacherProfile />
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
              path="/student/exams"
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentExams />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/exams/results"
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentExamResults />
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
              path="/student/testimonials"
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <TestimonialRequest />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentProfile />
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
