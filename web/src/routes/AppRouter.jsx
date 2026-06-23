import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import TeacherRoute from "./TeacherRoute";
import StudentRoute from "./StudentRoute";
import AdminLayout from "../layouts/AdminLayout";
import TeacherLayout from "../layouts/TeacherLayout";
import StudentLayout from "../layouts/StudentLayout";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import UserManagement from "../pages/admin/UserManagement";
import AdmissionDetail from "../pages/admin/AdmissionDetail";
import AdmissionEditor from "../pages/admin/AdmissionEditor";
import StaffEditor from "../pages/admin/StaffEditor";
import SchoolSetup from "../pages/admin/SchoolSetup";
import AttendanceAdmin from "../pages/admin/AttendanceAdmin";
import AttendanceAudit from "../pages/admin/AttendanceAudit";
import StudentManagement from "../pages/admin/StudentManagement";
import StaffManagement from "../pages/admin/StaffManagement";
import LogbookAdmin from "../pages/admin/LogbookAdmin";
import NoticesAdmin from "../pages/admin/NoticesAdmin";
import LeavesAdmin from "../pages/admin/LeavesAdmin";
import ParentNotesAdmin from "../pages/admin/ParentNotesAdmin";
import ExamsAdmin from "../pages/admin/ExamsAdmin";
import ProgressReportAdmin from "../pages/admin/ProgressReportAdmin";
import LearningAdmin from "../pages/admin/LearningAdmin";

// Teacher pages
import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import TeacherAttendance from "../pages/teacher/TeacherAttendance";
import TeacherLogbook from "../pages/teacher/TeacherLogbook";
import TeacherMarksEntry from "../pages/teacher/TeacherMarksEntry";
import TeacherLearning from "../pages/teacher/TeacherLearning";
import TeacherNotices from "../pages/teacher/TeacherNotices";
import TeacherSettings from "../pages/teacher/TeacherSettings";

// Student pages
import StudentDashboard from "../pages/student/StudentDashboard";
import StudentAttendance from "../pages/student/StudentAttendance";
import StudentLogbook from "../pages/student/StudentLogbook";
import StudentNotices from "../pages/student/StudentNotices";
import StudentLeave from "../pages/student/StudentLeave";
import StudentResults from "../pages/student/StudentResults";
import StudentQueries from "../pages/student/StudentQueries";
import StudentBirthdays from "../pages/student/StudentBirthdays";

// Shared pages
import LeaveApply from "../pages/LeaveApply";
import ProgressReport from "../pages/ProgressReport";
import LearningGoals from "../pages/LearningGoals";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ── Admin routes ── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="school-setup">
            <Route index element={<Navigate to="class-section" replace />} />
            <Route path="class-section" element={<SchoolSetup view="class-section" />} />
            <Route path="operations" element={<SchoolSetup view="operations" />} />
          </Route>
          <Route path="attendance" element={<AttendanceAdmin />} />
          <Route path="attendance-audit" element={<AttendanceAudit />} />
          <Route path="logbook" element={<LogbookAdmin />} />
          <Route path="notices" element={<NoticesAdmin />} />
          <Route path="leaves" element={<LeavesAdmin />} />
          <Route path="parent-notes" element={<ParentNotesAdmin />} />
          <Route path="exams" element={<ExamsAdmin />} />
          <Route path="progress-reports" element={<ProgressReportAdmin />} />
          <Route path="learning" element={<LearningAdmin />} />
          <Route path="birthdays" element={<StudentBirthdays />} />
          <Route path="admissions/:studentId" element={<AdmissionDetail />} />
          <Route path="admissions/edit/:userId" element={<AdmissionEditor />} />
          <Route path="staff/edit/:userId" element={<StaffEditor />} />
        </Route>

        {/* ── Teacher routes ── */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute>
              <TeacherRoute>
                <TeacherLayout />
              </TeacherRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="logbook" element={<TeacherLogbook />} />
          <Route path="marks" element={<TeacherMarksEntry />} />
          <Route path="learning" element={<TeacherLearning />} />
          <Route path="leave" element={<LeaveApply />} />
          <Route path="notices" element={<TeacherNotices />} />
          <Route path="parent-notes" element={<ParentNotesAdmin />} />
          <Route path="birthdays" element={<StudentBirthdays />} />
          <Route path="settings" element={<TeacherSettings />} />
        </Route>

        {/* ── Student routes ── */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <StudentRoute>
                <StudentLayout />
              </StudentRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="logbook" element={<StudentLogbook />} />
          <Route path="notices" element={<StudentNotices />} />
          <Route path="leave" element={<StudentLeave />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="queries" element={<StudentQueries />} />
          <Route path="birthdays" element={<StudentBirthdays />} />
        </Route>

        {/* ── Shared / fallback routes ── */}
        <Route
          path="/progress-report"
          element={
            <ProtectedRoute>
              <ProgressReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning"
          element={
            <ProtectedRoute>
              <LearningGoals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave"
          element={
            <ProtectedRoute>
              <LeaveApply />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
