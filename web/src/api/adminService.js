import API from "./api";

export const adminService = {
  getPendingUsers: async () => {
    const response = await API.get("/admin/users/pending");
    return response.data;
  },

  getAllUsers: async (params) => {
    const response = await API.get("/admin/users", { params });
    return response.data;
  },

  createUser: async (payload) => {
    const response = await API.post("/admin/users", payload);
    return response.data;
  },

  approveUser: async (id) => {
    const response = await API.patch(`/admin/users/${id}/approve`);
    return response.data;
  },

  rejectUser: async (id) => {
    const response = await API.patch(`/admin/users/${id}/reject`);
    return response.data;
  },

  activateUser: async (id) => {
    const response = await API.patch(`/admin/users/${id}/activate`);
    return response.data;
  },

  deactivateUser: async (id) => {
    const response = await API.patch(`/admin/users/${id}/deactivate`);
    return response.data;
  },

  getPendingAdmissions: async () => {
    const response = await API.get("/admin/admissions/pending");
    return response.data;
  },

  getStudentAdmission: async (studentId) => {
    const response = await API.get(`/admin/admissions/${studentId}`);
    return response.data;
  },

  getStudentAdmissionByUser: async (userId) => {
    const response = await API.get(`/admin/admissions/by-user/${userId}`);
    return response.data;
  },

  upsertStudentAdmission: async (studentId, payload) => {
    const response = await API.put(`/admin/admissions/${studentId}`, payload);
    return response.data;
  },

  approveAdmission: async (studentId) => {
    const response = await API.patch(`/admin/admissions/${studentId}/approve`);
    return response.data;
  },

  rejectAdmission: async (studentId) => {
    const response = await API.patch(`/admin/admissions/${studentId}/reject`);
    return response.data;
  },
};
