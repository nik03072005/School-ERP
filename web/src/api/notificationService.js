import API from "./api.js";

export const notificationService = {
  getNotifications: (page = 1, limit = 20) =>
    API.get("/notifications", { params: { page, limit } }).then((r) => r.data),

  getUnreadCount: () =>
    API.get("/notifications/unread-count").then((r) => r.data),

  markRead: (id) =>
    API.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    API.patch("/notifications/read-all").then((r) => r.data),
};
