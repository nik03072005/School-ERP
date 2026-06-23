import API from "./api.js";

export const logbookService = {
  upsertEntry: (data) =>
    API.post("/logbook", data).then((r) => r.data),

  getEntriesByDate: (class_id, section_id, date) =>
    API.get("/logbook", { params: { class_id, section_id, date } }).then((r) => r.data),

  getMyEntries: (params = {}) =>
    API.get("/logbook/mine", { params }).then((r) => r.data),

  getAllEntries: (params = {}) =>
    API.get("/logbook/all", { params }).then((r) => r.data),

  deleteEntry: (id) =>
    API.delete(`/logbook/${id}`).then((r) => r.data),
};
