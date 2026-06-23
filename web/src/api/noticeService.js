import API from "./api.js";

export const noticeService = {
  getNotices: (params = {}) =>
    API.get("/notices", { params }).then((r) => r.data),

  getAllNotices: (params = {}) =>
    API.get("/notices/all", { params }).then((r) => r.data),

  createNotice: (data) =>
    API.post("/notices", data).then((r) => r.data),

  updateNotice: (id, data) =>
    API.put(`/notices/${id}`, data).then((r) => r.data),

  deleteNotice: (id) =>
    API.delete(`/notices/${id}`).then((r) => r.data),
};
