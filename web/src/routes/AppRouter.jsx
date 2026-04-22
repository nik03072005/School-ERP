import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import AdminLayout from "../layouts/AdminLayout";
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
import TeacherAttendance from "../pages/teacher/TeacherAttendance";

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
          <Route path="admissions/:studentId" element={<AdmissionDetail />} />
          <Route path="admissions/edit/:userId" element={<AdmissionEditor />} />
          <Route path="staff/edit/:userId" element={<StaffEditor />} />
        </Route>

        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute>
              <TeacherAttendance />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;