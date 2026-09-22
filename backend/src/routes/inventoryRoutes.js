import express from "express";
import {
  getInventorySummary,
  getItems,
  getItemById,
  createItem,
  updateItem,
  adjustStock,
  getVendors,
  createVendor,
  updateVendor,
  getPurchases,
  createPurchase,
  getKits,
  createKit,
  updateKit,
  deleteKit,
  createStudentSale,
  getStudentSales,
  getSaleById,
  cancelSale,
  getStudentSelfStore,
} from "../controllers/inventoryController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Student self-service route
router.get("/student/my-store", protect, authorize("student"), getStudentSelfStore);

// Admin & Store staff routes
router.use(protect, authorize("admin", "non_teaching_staff"));

// Summary & KPI
router.get("/summary", getInventorySummary);

// Items Catalog & Stock
router.get("/items", getItems);
router.get("/items/:id", getItemById);
router.post("/items", createItem);
router.put("/items/:id", updateItem);
router.post("/items/:id/adjust", adjustStock);

// Vendors
router.get("/vendors", getVendors);
router.post("/vendors", createVendor);
router.put("/vendors/:id", updateVendor);

// Inward Purchases
router.get("/purchases", getPurchases);
router.post("/purchases", createPurchase);

// Bundles / Class Kits
router.get("/kits", getKits);
router.post("/kits", createKit);
router.put("/kits/:id", updateKit);
router.delete("/kits/:id", deleteKit);

// Student Distribution & Direct Sales (POS)
router.get("/sales", getStudentSales);
router.get("/sales/:id", getSaleById);
router.post("/sales", createStudentSale);
router.post("/sales/:id/cancel", cancelSale);

export default router;

