import API from "./api";

export const attendanceService = {
  markStudentBulk: async (payload) => {
    const response = await API.post("/attendance/students/mark-bulk", payload);
    return response.data;
  },

  getStudentDaily: async (params) => {
    const response = await API.get("/attendance/students/daily", { params });
    return response.data;
  },

  getStudentSummary: async (params) => {
    const response = await API.get("/attendance/students/summary", { params });
    return response.data;
  },

  correctStudentAttendance: async (attendanceId, payload) => {
    const response = await API.patch(`/attendance/students/${attendanceId}/correct`, payload);
    return response.data;
  },

  exportStudentCsv: async (params) => {
    const response = await API.get("/attendance/students/export-csv", { params, responseType: "blob" });
    return response.data;
  },

  markStaffBulk: async (payload) => {
    const response = await API.post("/attendance/staff/mark-bulk", payload);
    return response.data;
  },

  getStaffDaily: async (params) => {
    const response = await API.get("/attendance/staff/daily", { params });
    return response.data;
  },

  correctStaffAttendance: async (attendanceId, payload) => {
    const response = await API.patch(`/attendance/staff/${attendanceId}/correct`, payload);
    return response.data;
  },

  exportStaffCsv: async (params) => {
    const response = await API.get("/attendance/staff/export-csv", { params, responseType: "blob" });
    return response.data;
  },

  listAudit: async (params) => {
    const response = await API.get("/attendance/audit", { params });
    return response.data;
  },
};
