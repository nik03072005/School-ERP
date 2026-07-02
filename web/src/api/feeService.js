import API from "./api.js";

export const feeService = {
  // Fee heads
  getFeeHeads: (params = {}) => API.get("/fees/heads", { params }).then((r) => r.data),
  createFeeHead: (data) => API.post("/fees/heads", data).then((r) => r.data),
  updateFeeHead: (id, data) => API.put(`/fees/heads/${id}`, data).then((r) => r.data),
  deleteFeeHead: (id) => API.delete(`/fees/heads/${id}`).then((r) => r.data),

  // Fee structures
  getFeeStructures: (params = {}) => API.get("/fees/structures", { params }).then((r) => r.data),
  getFeeStructure: (id) => API.get(`/fees/structures/${id}`).then((r) => r.data),
  createFeeStructure: (data) => API.post("/fees/structures", data).then((r) => r.data),
  updateFeeStructure: (id, data) => API.put(`/fees/structures/${id}`, data).then((r) => r.data),
  archiveFeeStructure: (id) => API.delete(`/fees/structures/${id}`).then((r) => r.data),
  cloneFeeStructure: (id, data) => API.post(`/fees/structures/${id}/clone`, data).then((r) => r.data),

  // Assignment, discounts, dues, summary, reminders
  assignFeeStructure: (data) => API.post("/fees/assign", data).then((r) => r.data),
  addDiscount: (studentFeeId, data) => API.post(`/fees/${studentFeeId}/discount`, data).then((r) => r.data),
  sendFeeReminder: (studentFeeId) => API.post(`/fees/${studentFeeId}/reminder`).then((r) => r.data),
  getDues: (params = {}) => API.get("/fees/dues", { params }).then((r) => r.data),
  getFeeSummary: (params = {}) => API.get("/fees/summary", { params }).then((r) => r.data),
  getStudentFee: (studentId, params = {}) => API.get(`/fees/student/${studentId}`, { params }).then((r) => r.data),

  // Student self-service
  getMyFee: (params = {}) => API.get("/fees/my", { params }).then((r) => r.data),
  getMyPayments: () => API.get("/fees/payments/mine").then((r) => r.data),

  // Payments
  recordPayment: (data) => API.post("/fees/payments", data).then((r) => r.data),
  getPayments: (params = {}) => API.get("/fees/payments", { params }).then((r) => r.data),
  getPayment: (id) => API.get(`/fees/payments/${id}`).then((r) => r.data),
  cancelPayment: (id, data) => API.post(`/fees/payments/${id}/cancel`, data).then((r) => r.data),
};
