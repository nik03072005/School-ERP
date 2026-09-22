import API from "./api";

export const subjectService = {
  getSubjects: async (params = {}) => {
    const response = await API.get("/subjects", { params });
    return response.data;
  },

  getSubjectById: async (id) => {
    const response = await API.get(`/subjects/${id}`);
    return response.data;
  },

  createSubject: async (payload) => {
    const response = await API.post("/subjects", payload);
    return response.data;
  },

  updateSubject: async (id, payload) => {
    const response = await API.put(`/subjects/${id}`, payload);
    return response.data;
  },

  deleteSubject: async (id) => {
    const response = await API.delete(`/subjects/${id}`);
    return response.data;
  },

  getPresets: async (params = {}) => {
    const response = await API.get("/subjects/presets", { params });
    return response.data;
  },

  seedPresetsForClass: async (payload) => {
    const response = await API.post("/subjects/seed-presets", payload);
    return response.data;
  },
};

