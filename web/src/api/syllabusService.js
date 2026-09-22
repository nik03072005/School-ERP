import API from "./api";

export const syllabusService = {
  getSyllabusBySubject: async (subjectId) => {
    const response = await API.get(`/syllabus/subject/${subjectId}`);
    return response.data;
  },

  listSyllabusByClass: async (classId, params = {}) => {
    const response = await API.get(`/syllabus/class/${classId}`, { params });
    return response.data;
  },

  addChapter: async (syllabusId, payload) => {
    const response = await API.post(`/syllabus/${syllabusId}/chapters`, payload);
    return response.data;
  },

  updateChapter: async (syllabusId, chapterId, payload) => {
    const response = await API.put(`/syllabus/${syllabusId}/chapters/${chapterId}`, payload);
    return response.data;
  },

  updateChapterProgress: async (syllabusId, chapterId, payload) => {
    const response = await API.patch(
      `/syllabus/${syllabusId}/chapters/${chapterId}/progress`,
      payload
    );
    return response.data;
  },

  deleteChapter: async (syllabusId, chapterId) => {
    const response = await API.delete(`/syllabus/${syllabusId}/chapters/${chapterId}`);
    return response.data;
  },

  seedDefaultChapters: async (subjectId) => {
    const response = await API.post(`/syllabus/seed-chapters/${subjectId}`);
    return response.data;
  },
};

