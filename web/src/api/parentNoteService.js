import API from "./api.js";

export const parentNoteService = {
  submitNote: (data) =>
    API.post("/parent-notes", data).then((r) => r.data),

  getMyNotes: (params = {}) =>
    API.get("/parent-notes/mine", { params }).then((r) => r.data),

  getAllNotes: (params = {}) =>
    API.get("/parent-notes", { params }).then((r) => r.data),

  replyToNote: (id, data) =>
    API.patch(`/parent-notes/${id}/reply`, data).then((r) => r.data),

  updateStatus: (id, status) =>
    API.patch(`/parent-notes/${id}/status`, { status }).then((r) => r.data),
};
