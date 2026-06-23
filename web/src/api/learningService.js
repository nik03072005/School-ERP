import API from "./api";

export const getContent = (params) => API.get("/learning", { params }).then((r) => r.data);
export const getMyContent = () => API.get("/learning/mine").then((r) => r.data);
export const createContent = (data) => API.post("/learning", data).then((r) => r.data);
export const updateContent = (id, data) => API.put(`/learning/${id}`, data).then((r) => r.data);
export const togglePublish = (id) => API.patch(`/learning/${id}/publish`).then((r) => r.data);
export const deleteContent = (id) => API.delete(`/learning/${id}`).then((r) => r.data);
