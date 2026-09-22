import API from "./api.js";

export const transportService = {
  // Summary
  getSummary: () => API.get("/transport/summary").then((r) => r.data),

  // Vehicles
  getVehicles: (params = {}) => API.get("/transport/vehicles", { params }).then((r) => r.data),
  createVehicle: (data) => API.post("/transport/vehicles", data).then((r) => r.data),
  updateVehicle: (id, data) => API.put(`/transport/vehicles/${id}`, data).then((r) => r.data),
  deleteVehicle: (id) => API.delete(`/transport/vehicles/${id}`).then((r) => r.data),

  // Routes
  getRoutes: () => API.get("/transport/routes").then((r) => r.data),
  getRouteById: (id) => API.get(`/transport/routes/${id}`).then((r) => r.data),
  createRoute: (data) => API.post("/transport/routes", data).then((r) => r.data),
  updateRoute: (id, data) => API.put(`/transport/routes/${id}`, data).then((r) => r.data),
  deleteRoute: (id) => API.delete(`/transport/routes/${id}`).then((r) => r.data),
  getRouteManifest: (routeId) => API.get(`/transport/routes/${routeId}/manifest`).then((r) => r.data),

  // Student Allocations
  getAllocations: (params = {}) => API.get("/transport/allocations", { params }).then((r) => r.data),
  allocateStudent: (data) => API.post("/transport/allocations", data).then((r) => r.data),
  bulkAllocateStudents: (data) => API.post("/transport/allocations/bulk", data).then((r) => r.data),
  cancelAllocation: (id, data = {}) => API.post(`/transport/allocations/${id}/cancel`, data).then((r) => r.data),
  getUnallocatedStudents: (params = {}) => API.get("/transport/unallocated-students", { params }).then((r) => r.data),

  // Student / Parent self service
  getMyTransport: () => API.get("/transport/my").then((r) => r.data),
};

