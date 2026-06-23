import API from "./api.js";

export const studentService = {
  getMyProfile: () =>
    API.get("/student/admission").then((r) => r.data),

  getMyAttendance: (params = {}) =>
    API.get("/attendance/students/me", { params }).then((r) => r.data),

  getBirthdays: () =>
    API.get("/student/birthdays").then((r) => r.data),
};
