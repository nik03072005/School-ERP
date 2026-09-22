import API from "./api";

export const inventoryService = {
  // Summary
  getSummary: async () => {
    const res = await API.get("/inventory/summary");
    return res.data;
  },

  // Items
  getItems: async (params = {}) => {
    const res = await API.get("/inventory/items", { params });
    return res.data;
  },

  getItemById: async (id) => {
    const res = await API.get(`/inventory/items/${id}`);
    return res.data;
  },

  createItem: async (payload) => {
    const res = await API.post("/inventory/items", payload);
    return res.data;
  },

  updateItem: async (id, payload) => {
    const res = await API.put(`/inventory/items/${id}`, payload);
    return res.data;
  },

  adjustStock: async (id, payload) => {
    const res = await API.post(`/inventory/items/${id}/adjust`, payload);
    return res.data;
  },

  // Vendors
  getVendors: async (params = {}) => {
    const res = await API.get("/inventory/vendors", { params });
    return res.data;
  },

  createVendor: async (payload) => {
    const res = await API.post("/inventory/vendors", payload);
    return res.data;
  },

  updateVendor: async (id, payload) => {
    const res = await API.put(`/inventory/vendors/${id}`, payload);
    return res.data;
  },

  // Purchases (Inward Supply)
  getPurchases: async (params = {}) => {
    const res = await API.get("/inventory/purchases", { params });
    return res.data;
  },

  createPurchase: async (payload) => {
    const res = await API.post("/inventory/purchases", payload);
    return res.data;
  },

  // Kits & Bundles
  getKits: async (params = {}) => {
    const res = await API.get("/inventory/kits", { params });
    return res.data;
  },

  createKit: async (payload) => {
    const res = await API.post("/inventory/kits", payload);
    return res.data;
  },

  updateKit: async (id, payload) => {
    const res = await API.put(`/inventory/kits/${id}`, payload);
    return res.data;
  },

  deleteKit: async (id) => {
    const res = await API.delete(`/inventory/kits/${id}`);
    return res.data;
  },

  // Student Distribution & Sales (POS)
  getSales: async (params = {}) => {
    const res = await API.get("/inventory/sales", { params });
    return res.data;
  },

  getSaleById: async (id) => {
    const res = await API.get(`/inventory/sales/${id}`);
    return res.data;
  },

  createStudentSale: async (payload) => {
    const res = await API.post("/inventory/sales", payload);
    return res.data;
  },

  cancelSale: async (id, payload) => {
    const res = await API.post(`/inventory/sales/${id}/cancel`, payload);
    return res.data;
  },

  // Student self-service
  getStudentSelfStore: async () => {
    const res = await API.get("/inventory/student/my-store");
    return res.data;
  },
};

