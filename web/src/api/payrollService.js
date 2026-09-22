import API from "./api";

export const payrollService = {
  // Admin: Process / recalculate a payroll batch
  runPayrollBatch: async (payload) => {
    const res = await API.post("/payroll/run", payload);
    return res.data;
  },

  // Admin: List all payroll batches
  listBatches: async () => {
    const res = await API.get("/payroll/batches");
    return res.data;
  },

  // Admin: Get batch detail with slips
  getBatchById: async (batchId, params = {}) => {
    const res = await API.get(`/payroll/batches/${batchId}`, { params });
    return res.data;
  },

  // Admin: Approve / Disburse batch
  updateBatchStatus: async (batchId, payload) => {
    const res = await API.patch(`/payroll/batches/${batchId}/status`, payload);
    return res.data;
  },

  // Admin: Override individual slip
  updateSlip: async (slipId, payload) => {
    const res = await API.patch(`/payroll/slips/${slipId}`, payload);
    return res.data;
  },

  // Admin / Staff: Get single slip by ID
  getSlipById: async (slipId) => {
    const res = await API.get(`/payroll/slips/${slipId}`);
    return res.data;
  },

  // Staff self-service: Get own payslips
  getMyPayslips: async () => {
    const res = await API.get("/payroll/slips/my-slips");
    return res.data;
  },

  // Admin: Download bank payout CSV
  getBankPayoutUrl: (batchId, bankCode) =>
    `/api/payroll/batches/${batchId}/export-bank/${bankCode}`,
};

