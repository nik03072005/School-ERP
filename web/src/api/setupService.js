import API from "./api";

export const setupService = {
  listClasses: async (params) => {
    const response = await API.get("/setup/classes", { params });
    return response.data;
  },

  createClass: async (payload) => {
    const response = await API.post("/setup/classes", payload);
    return response.data;
  },

  updateClass: async (classId, payload) => {
    const response = await API.patch(`/setup/classes/${classId}`, payload);
    return response.data;
  },

  listSections: async (params) => {
    const response = await API.get("/setup/sections", { params });
    return response.data;
  },

  createSection: async (payload) => {
    const response = await API.post("/setup/sections", payload);
    return response.data;
  },

  updateSection: async (sectionId, payload) => {
    const response = await API.patch(`/setup/sections/${sectionId}`, payload);
    return response.data;
  },

  assignClassTeacher: async (sectionId, class_teacher_user_id) => {
    const response = await API.patch(`/setup/sections/${sectionId}/assign-class-teacher`, { class_teacher_user_id });
    return response.data;
  },

  listPeriods: async (params) => {
    const response = await API.get("/setup/periods", { params });
    return response.data;
  },

  createPeriod: async (payload) => {
    const response = await API.post("/setup/periods", payload);
    return response.data;
  },

  updatePeriod: async (periodId, payload) => {
    const response = await API.patch(`/setup/periods/${periodId}`, payload);
    return response.data;
  },

  createTeacherAssignment: async (payload) => {
    const response = await API.post("/setup/teacher-assignments", payload);
    return response.data;
  },

  listTeacherAssignments: async (params) => {
    const response = await API.get("/setup/teacher-assignments", { params });
    return response.data;
  },

  deactivateTeacherAssignment: async (assignmentId) => {
    const response = await API.patch(`/setup/teacher-assignments/${assignmentId}/deactivate`);
    return response.data;
  },
};
