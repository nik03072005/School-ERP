import API from "./api";

export const getMyReports = () => API.get("/progress-reports/mine").then((r) => r.data);
export const upsertReport = (data) => API.post("/progress-reports", data).then((r) => r.data);
export const batchUpsertReports = (data) =>
  API.post("/progress-reports/batch", data).then((r) => r.data);
export const getExamReport = (examId) =>
  API.get(`/progress-reports/exam/${examId}`).then((r) => r.data);
export const publishReports = (examId) =>
  API.patch(`/progress-reports/exam/${examId}/publish`).then((r) => r.data);
