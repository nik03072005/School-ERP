import API from "./api";

export const getExams = (params) => API.get("/exams", { params }).then((r) => r.data);
export const getExam = (id) => API.get(`/exams/${id}`).then((r) => r.data);
export const createExam = (data) => API.post("/exams", data).then((r) => r.data);
export const updateExam = (id, data) => API.put(`/exams/${id}`, data).then((r) => r.data);
export const deleteExam = (id) => API.delete(`/exams/${id}`).then((r) => r.data);
