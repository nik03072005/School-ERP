import API from "./api.js";

export const leaveService = {
  applyLeave: (data) =>
    API.post("/leaves", data).then((r) => r.data),

  getMyLeaves: (params = {}) =>
    API.get("/leaves/mine", { params }).then((r) => r.data),

  getAllLeaves: (params = {}) =>
    API.get("/leaves", { params }).then((r) => r.data),

  reviewLeave: (id, data) =>
    API.patch(`/leaves/${id}/review`, data).then((r) => r.data),

  cancelLeave: (id) =>
    API.patch(`/leaves/${id}/cancel`).then((r) => r.data),
};
