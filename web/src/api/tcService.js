import API from "./api";

export const tcService = {
  getStudentTCData: async (studentId) => {
    const response = await API.get(`/tc/prefill/${studentId}`);
    return response.data;
  },

  createTC: async (payload) => {
    const response = await API.post("/tc", payload);
    return response.data;
  },

  listTCs: async (params) => {
    const response = await API.get("/tc", { params });
    return response.data;
  },

  getTCById: async (id) => {
    const response = await API.get(`/tc/${id}`);
    return response.data;
  },

  cancelTC: async (id, reason) => {
    const response = await API.patch(`/tc/${id}/cancel`, { reason });
    return response.data;
  },
};

