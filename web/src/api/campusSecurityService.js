import API from "./api.js";

export const campusSecurityService = {
  // ── Stats ──
  getStats: () => API.get("/campus-security/stats").then((r) => r.data),

  // ── Visitors ──
  getVisitors: (params = {}) =>
    API.get("/campus-security/visitors", { params }).then((r) => r.data),
  createVisitor: (data) =>
    API.post("/campus-security/visitors", data).then((r) => r.data),
  sendVisitorOtp: (id) =>
    API.post(`/campus-security/visitors/${id}/send-otp`).then((r) => r.data),
  verifyVisitorOtp: (id, otp) =>
    API.post(`/campus-security/visitors/${id}/verify-otp`, { otp }).then((r) => r.data),
  checkOutVisitor: (id, data = {}) =>
    API.post(`/campus-security/visitors/${id}/checkout`, data).then((r) => r.data),
  recordBadgePrint: (id) =>
    API.post(`/campus-security/visitors/${id}/print-badge`).then((r) => r.data),

  // ── Gate Passes ──
  getGatePasses: (params = {}) =>
    API.get("/campus-security/gate-passes", { params }).then((r) => r.data),
  createGatePass: (data) =>
    API.post("/campus-security/gate-passes", data).then((r) => r.data),
  sendParentOtp: (id) =>
    API.post(`/campus-security/gate-passes/${id}/send-parent-otp`).then((r) => r.data),
  verifyParentOtp: (id, otp) =>
    API.post(`/campus-security/gate-passes/${id}/verify-parent-otp`, { otp }).then((r) => r.data),
  approveByTeacher: (id, data = {}) =>
    API.post(`/campus-security/gate-passes/${id}/approve-teacher`, data).then((r) => r.data),
  approveByAdmin: (id, data = {}) =>
    API.post(`/campus-security/gate-passes/${id}/approve-admin`, data).then((r) => r.data),
  confirmGateExit: (id, data = {}) =>
    API.post(`/campus-security/gate-passes/${id}/gate-exit`, data).then((r) => r.data),
  rejectGatePass: (id, data = {}) =>
    API.post(`/campus-security/gate-passes/${id}/reject`, data).then((r) => r.data),

  // ── Lookups / Autocomplete ──
  searchStudents: (q) =>
    API.get("/campus-security/search-students", { params: { q } }).then((r) => r.data),
  searchStaff: (q) =>
    API.get("/campus-security/search-staff", { params: { q } }).then((r) => r.data),
  quickVerify: (code) =>
    API.get(`/campus-security/quick-verify/${code}`).then((r) => r.data),

  // ── Teacher queue ──
  getTeacherPasses: () =>
    API.get("/campus-security/teacher-passes").then((r) => r.data),

  // ── Student / Parent self-service ──
  getMyPasses: () =>
    API.get("/campus-security/my-passes").then((r) => r.data),
};

