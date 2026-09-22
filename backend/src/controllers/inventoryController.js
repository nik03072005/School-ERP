import mongoose from "mongoose";
import InventoryItem from "../models/InventoryItem.js";
import InventoryVendor from "../models/InventoryVendor.js";
import InventoryPurchase from "../models/InventoryPurchase.js";
import InventorySale from "../models/InventorySale.js";
import InventoryKit from "../models/InventoryKit.js";
import InventoryLog from "../models/InventoryLog.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";

// ── Dashboard & Summary ─────────────────────────────────────────────
export const getInventorySummary = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalItems,
      allStockItems,
      todaySalesAgg,
      monthSalesAgg,
      recentSales,
      recentPurchases,
    ] = await Promise.all([
      InventoryItem.countDocuments({ is_active: true }),
      InventoryItem.find({ is_active: true }).select(
        "item_name sku_code category current_stock min_alert_stock cost_price selling_price unit"
      ),
      InventorySale.aggregate([
        {
          $match: {
            sale_date: { $gte: todayStart },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$payable_amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      InventorySale.aggregate([
        {
          $match: {
            sale_date: { $gte: monthStart },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$payable_amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      InventorySale.find({ status: "completed" })
        .sort({ sale_date: -1 })
        .limit(5)
        .populate({
          path: "student_id",
          select: "roll_no admission_no user_id class_id section_id",
          populate: [
            { path: "user_id", select: "first_name last_name" },
            { path: "class_id", select: "name" },
            { path: "section_id", select: "name" },
          ],
        }),
      InventoryPurchase.find()
        .sort({ purchase_date: -1 })
        .limit(5)
        .populate("vendor_id", "name contact_person"),
    ]);

    let totalStockValueCost = 0;
    let totalStockValueSelling = 0;
    const lowStockItems = [];
    const categoryStats = {
      uniform: { count: 0, stock: 0, costValue: 0 },
      book: { count: 0, stock: 0, costValue: 0 },
      stationery: { count: 0, stock: 0, costValue: 0 },
      lab_equipment: { count: 0, stock: 0, costValue: 0 },
      other: { count: 0, stock: 0, costValue: 0 },
    };

    allStockItems.forEach((item) => {
      const stock = item.current_stock || 0;
      const costVal = stock * (item.cost_price || 0);
      const sellVal = stock * (item.selling_price || 0);

      totalStockValueCost += costVal;
      totalStockValueSelling += sellVal;

      if (stock <= item.min_alert_stock) {
        lowStockItems.push(item);
      }

      const cat = item.category in categoryStats ? item.category : "other";
      categoryStats[cat].count += 1;
      categoryStats[cat].stock += stock;
      categoryStats[cat].costValue += costVal;
    });

    res.json({
      success: true,
      data: {
        totalItems,
        totalStockValueCost,
        totalStockValueSelling,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.slice(0, 10),
        todaySales: {
          amount: todaySalesAgg[0]?.totalAmount || 0,
          count: todaySalesAgg[0]?.count || 0,
        },
        monthSales: {
          amount: monthSalesAgg[0]?.totalAmount || 0,
          count: monthSalesAgg[0]?.count || 0,
        },
        categoryStats,
        recentSales,
        recentPurchases,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory summary:", error);
    res.status(500).json({ message: "Failed to fetch inventory summary", error: error.message });
  }
};

// ── Items Management ────────────────────────────────────────────────
export const getItems = async (req, res) => {
  try {
    const { category, search, class_id, low_stock, is_active } = req.query;
    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    if (is_active !== undefined) {
      filter.is_active = is_active === "true";
    }

    if (class_id) {
      filter.$or = [
        { applicable_class_ids: class_id },
        { applicable_class_ids: { $size: 0 } },
      ];
    }

    if (search) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { item_name: regex },
        { sku_code: regex },
        { subcategory: regex },
        { "specifications.size": regex },
        { "specifications.edition_or_publisher": regex },
      ];
    }

    let items = await InventoryItem.find(filter)
      .populate("applicable_class_ids", "name")
      .sort({ category: 1, item_name: 1 });

    if (low_stock === "true") {
      items = items.filter((i) => i.current_stock <= i.min_alert_stock);
    }

    res.json({ success: true, items });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Failed to fetch inventory items", error: error.message });
  }
};

export const getItemById = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id).populate(
      "applicable_class_ids",
      "name"
    );
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const logs = await InventoryLog.find({ item_id: item._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("performed_by", "first_name last_name");

    res.json({ success: true, item, logs });
  } catch (error) {
    console.error("Error fetching item details:", error);
    res.status(500).json({ message: "Failed to fetch item details", error: error.message });
  }
};

export const createItem = async (req, res) => {
  try {
    const {
      item_name,
      sku_code,
      category,
      subcategory,
      unit,
      applicable_class_ids,
      specifications,
      cost_price,
      selling_price,
      current_stock,
      min_alert_stock,
      description,
    } = req.body;

    const existingSku = await InventoryItem.findOne({
      sku_code: sku_code.trim().toUpperCase(),
    });
    if (existingSku) {
      return res.status(400).json({ message: `SKU code "${sku_code}" already exists.` });
    }

    const initialStock = Number(current_stock) || 0;

    const item = await InventoryItem.create({
      item_name: item_name.trim(),
      sku_code: sku_code.trim().toUpperCase(),
      category,
      subcategory,
      unit: unit || "piece",
      applicable_class_ids: applicable_class_ids || [],
      specifications: specifications || {},
      cost_price: Number(cost_price) || 0,
      selling_price: Number(selling_price) || 0,
      current_stock: initialStock,
      min_alert_stock: Number(min_alert_stock) || 5,
      description,
      is_active: true,
    });

    if (initialStock > 0) {
      await InventoryLog.create({
        item_id: item._id,
        action_type: "initial_stock",
        quantity_change: initialStock,
        previous_stock: 0,
        new_stock: initialStock,
        performed_by: req.user._id,
        reason: "Initial stock upon item creation",
      });
    }

    res.status(201).json({ success: true, item, message: "Inventory item created successfully" });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ message: "Failed to create inventory item", error: error.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const {
      item_name,
      category,
      subcategory,
      unit,
      applicable_class_ids,
      specifications,
      cost_price,
      selling_price,
      min_alert_stock,
      is_active,
      description,
    } = req.body;

    if (item_name) item.item_name = item_name.trim();
    if (category) item.category = category;
    if (subcategory !== undefined) item.subcategory = subcategory;
    if (unit) item.unit = unit;
    if (applicable_class_ids !== undefined) item.applicable_class_ids = applicable_class_ids;
    if (specifications) item.specifications = specifications;
    if (cost_price !== undefined) item.cost_price = Number(cost_price);
    if (selling_price !== undefined) item.selling_price = Number(selling_price);
    if (min_alert_stock !== undefined) item.min_alert_stock = Number(min_alert_stock);
    if (is_active !== undefined) item.is_active = is_active;
    if (description !== undefined) item.description = description;

    await item.save();

    res.json({ success: true, item, message: "Item updated successfully" });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ message: "Failed to update item", error: error.message });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const { action_type, quantity_change, reason } = req.body;
    const qtyChange = Number(quantity_change);

    if (isNaN(qtyChange) || qtyChange === 0) {
      return res.status(400).json({ message: "Invalid quantity change value" });
    }

    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const prevStock = item.current_stock || 0;
    const newStock = prevStock + qtyChange;

    if (newStock < 0) {
      return res.status(400).json({
        message: `Adjustment would result in negative stock. Current stock is ${prevStock}.`,
      });
    }

    item.current_stock = newStock;
    await item.save();

    await InventoryLog.create({
      item_id: item._id,
      action_type: action_type || "manual_correction",
      quantity_change: qtyChange,
      previous_stock: prevStock,
      new_stock: newStock,
      performed_by: req.user._id,
      reason: reason || "Manual stock adjustment",
    });

    res.json({
      success: true,
      current_stock: newStock,
      message: `Stock successfully adjusted to ${newStock} ${item.unit}`,
    });
  } catch (error) {
    console.error("Error adjusting stock:", error);
    res.status(500).json({ message: "Failed to adjust stock", error: error.message });
  }
};

// ── Vendors Management ──────────────────────────────────────────────
export const getVendors = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (search) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: regex },
        { contact_person: regex },
        { phone: regex },
        { gstin: regex },
      ];
    }

    const vendors = await InventoryVendor.find(filter).sort({ name: 1 });
    res.json({ success: true, vendors });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Failed to fetch vendors", error: error.message });
  }
};

export const createVendor = async (req, res) => {
  try {
    const {
      name,
      code,
      contact_person,
      phone,
      email,
      address,
      city,
      gstin,
      categories_supplied,
      bank_details,
      notes,
    } = req.body;

    const vendor = await InventoryVendor.create({
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : undefined,
      contact_person,
      phone,
      email,
      address,
      city,
      gstin: gstin ? gstin.trim().toUpperCase() : undefined,
      categories_supplied: categories_supplied || ["stationery"],
      bank_details,
      notes,
      status: "active",
    });

    res.status(201).json({ success: true, vendor, message: "Vendor created successfully" });
  } catch (error) {
    console.error("Error creating vendor:", error);
    res.status(500).json({ message: "Failed to create vendor", error: error.message });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const vendor = await InventoryVendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    res.json({ success: true, vendor, message: "Vendor updated successfully" });
  } catch (error) {
    console.error("Error updating vendor:", error);
    res.status(500).json({ message: "Failed to update vendor", error: error.message });
  }
};

// ── Stock Purchases / Inward Supply ─────────────────────────────────
export const getPurchases = async (req, res) => {
  try {
    const { vendor_id, from, to } = req.query;
    const filter = {};
    if (vendor_id) filter.vendor_id = vendor_id;
    if (from || to) {
      filter.purchase_date = {};
      if (from) filter.purchase_date.$gte = new Date(from);
      if (to) filter.purchase_date.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    const purchases = await InventoryPurchase.find(filter)
      .populate("vendor_id", "name contact_person phone gstin")
      .populate("received_by", "first_name last_name")
      .sort({ purchase_date: -1 });

    res.json({ success: true, purchases });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ message: "Failed to fetch purchases", error: error.message });
  }
};

export const createPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      vendor_id,
      invoice_no,
      purchase_date,
      items,
      subtotal,
      tax_amount,
      discount,
      grand_total,
      payment_status,
      payment_mode,
      remarks,
    } = req.body;

    if (!items || !items.length) {
      await session.abortTransaction();
      return res.status(400).json({ message: "At least one item is required in a purchase" });
    }

    const purchase = new InventoryPurchase({
      vendor_id,
      invoice_no,
      purchase_date: purchase_date || new Date(),
      items,
      subtotal: Number(subtotal) || 0,
      tax_amount: Number(tax_amount) || 0,
      discount: Number(discount) || 0,
      grand_total: Number(grand_total) || 0,
      payment_status: payment_status || "paid",
      payment_mode: payment_mode || "bank_transfer",
      received_by: req.user._id,
      remarks,
    });

    await purchase.save({ session });

    // Increment inventory stock & write logs for each purchased item
    for (const entry of items) {
      const item = await InventoryItem.findById(entry.item_id).session(session);
      if (item) {
        const prevStock = item.current_stock || 0;
        const addQty = Number(entry.quantity) || 0;
        const newStock = prevStock + addQty;

        item.current_stock = newStock;
        if (entry.unit_cost && entry.unit_cost > 0) {
          item.cost_price = Number(entry.unit_cost);
        }
        await item.save({ session });

        await InventoryLog.create(
          [
            {
              item_id: item._id,
              action_type: "purchase_inward",
              quantity_change: addQty,
              previous_stock: prevStock,
              new_stock: newStock,
              reference_id: purchase._id,
              reference_model: "InventoryPurchase",
              performed_by: req.user._id,
              reason: `Inward Purchase Bill #${invoice_no || purchase.purchase_number}`,
            },
          ],
          { session }
        );
      }
    }

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      purchase,
      message: `Inward stock purchase ${purchase.purchase_number} recorded and inventory updated.`,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error recording purchase:", error);
    res.status(500).json({ message: "Failed to record purchase", error: error.message });
  } finally {
    session.endSession();
  }
};

// ── Bundles / Kits Management ───────────────────────────────────────
export const getKits = async (req, res) => {
  try {
    const { class_id, category } = req.query;
    const filter = { is_active: true };
    if (class_id) filter.class_id = class_id;
    if (category) filter.category = category;

    const kits = await InventoryKit.find(filter)
      .populate("class_id", "name")
      .populate("items.item_id")
      .sort({ name: 1 });

    res.json({ success: true, kits });
  } catch (error) {
    console.error("Error fetching kits:", error);
    res.status(500).json({ message: "Failed to fetch kits", error: error.message });
  }
};

export const createKit = async (req, res) => {
  try {
    const { name, code, class_id, category, items, bundle_price, description } = req.body;
    const kit = await InventoryKit.create({
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : undefined,
      class_id: class_id || undefined,
      category: category || "combined_kit",
      items,
      bundle_price: Number(bundle_price) || 0,
      description,
      is_active: true,
    });

    res.status(201).json({ success: true, kit, message: "Class bundle kit created successfully" });
  } catch (error) {
    console.error("Error creating kit:", error);
    res.status(500).json({ message: "Failed to create kit", error: error.message });
  }
};

export const updateKit = async (req, res) => {
  try {
    const kit = await InventoryKit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!kit) return res.status(404).json({ message: "Kit not found" });

    res.json({ success: true, kit, message: "Kit updated successfully" });
  } catch (error) {
    console.error("Error updating kit:", error);
    res.status(500).json({ message: "Failed to update kit", error: error.message });
  }
};

export const deleteKit = async (req, res) => {
  try {
    const kit = await InventoryKit.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );
    if (!kit) return res.status(404).json({ message: "Kit not found" });

    res.json({ success: true, message: "Kit removed successfully" });
  } catch (error) {
    console.error("Error deleting kit:", error);
    res.status(500).json({ message: "Failed to delete kit", error: error.message });
  }
};

// ── Direct Sale & Student Distribution (POS) ────────────────────────
export const createStudentSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      student_id,
      kit_id,
      distribution_type,
      academic_session,
      items,
      subtotal,
      discount_total,
      payable_amount,
      paid_amount,
      payment_mode,
      payment_status,
      transaction_ref,
      remarks,
    } = req.body;

    const student = await Student.findById(student_id).session(session);
    if (!student) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Student record not found" });
    }

    if (!items || !items.length) {
      await session.abortTransaction();
      return res.status(400).json({ message: "No items provided for distribution" });
    }

    // Check stock availability for all items before making changes
    for (const line of items) {
      const stockItem = await InventoryItem.findById(line.item_id).session(session);
      if (!stockItem) {
        await session.abortTransaction();
        return res.status(404).json({ message: `Item not found: ${line.item_name}` });
      }
      if (stockItem.current_stock < line.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `Insufficient stock for "${stockItem.item_name}". Available: ${stockItem.current_stock}, Requested: ${line.quantity}.`,
        });
      }
    }

    // Create Sale record
    const sale = new InventorySale({
      student_id,
      kit_id: kit_id || undefined,
      distribution_type: distribution_type || "session_start",
      academic_session: academic_session || "2026-2027",
      items,
      subtotal: Number(subtotal) || 0,
      discount_total: Number(discount_total) || 0,
      payable_amount: Number(payable_amount) || 0,
      paid_amount: Number(paid_amount) || 0,
      payment_mode: payment_mode || "cash",
      payment_status: payment_status || "paid",
      transaction_ref,
      issued_by: req.user._id,
      remarks,
    });

    await sale.save({ session });

    // Decrement stock and create inventory movement logs
    for (const line of items) {
      const stockItem = await InventoryItem.findById(line.item_id).session(session);
      const prevStock = stockItem.current_stock;
      const decQty = Number(line.quantity);
      const newStock = prevStock - decQty;

      stockItem.current_stock = newStock;
      await stockItem.save({ session });

      await InventoryLog.create(
        [
          {
            item_id: stockItem._id,
            action_type: "student_sale",
            quantity_change: -decQty,
            previous_stock: prevStock,
            new_stock: newStock,
            reference_id: sale._id,
            reference_model: "InventorySale",
            performed_by: req.user._id,
            reason: `Distribution to student #${student.admission_no || student.roll_no} (Voucher: ${sale.sale_number})`,
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();

    const populatedSale = await InventorySale.findById(sale._id)
      .populate({
        path: "student_id",
        populate: [
          { path: "user_id", select: "first_name last_name email" },
          { path: "class_id", select: "name" },
          { path: "section_id", select: "name" },
        ],
      })
      .populate("issued_by", "first_name last_name")
      .populate("kit_id", "name");

    res.status(201).json({
      success: true,
      sale: populatedSale,
      message: `Distribution voucher ${sale.sale_number} generated successfully.`,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating student distribution sale:", error);
    res.status(500).json({ message: "Failed to process sale", error: error.message });
  } finally {
    session.endSession();
  }
};

export const getStudentSales = async (req, res) => {
  try {
    const { student_id, distribution_type, from, to, payment_mode, search } = req.query;
    const filter = {};

    if (student_id) filter.student_id = student_id;
    if (distribution_type) filter.distribution_type = distribution_type;
    if (payment_mode) filter.payment_mode = payment_mode;
    if (from || to) {
      filter.sale_date = {};
      if (from) filter.sale_date.$gte = new Date(from);
      if (to) filter.sale_date.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    if (search) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ sale_number: regex }, { transaction_ref: regex }, { remarks: regex }];
    }

    const sales = await InventorySale.find(filter)
      .populate({
        path: "student_id",
        populate: [
          { path: "user_id", select: "first_name last_name email" },
          { path: "class_id", select: "name" },
          { path: "section_id", select: "name" },
        ],
      })
      .populate("issued_by", "first_name last_name")
      .populate("kit_id", "name")
      .sort({ sale_date: -1 });

    res.json({ success: true, sales });
  } catch (error) {
    console.error("Error fetching student sales:", error);
    res.status(500).json({ message: "Failed to fetch sales register", error: error.message });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const sale = await InventorySale.findById(req.params.id)
      .populate({
        path: "student_id",
        populate: [
          { path: "user_id", select: "first_name last_name email" },
          { path: "class_id", select: "name" },
          { path: "section_id", select: "name" },
        ],
      })
      .populate("issued_by", "first_name last_name")
      .populate("cancelled_by", "first_name last_name")
      .populate("kit_id", "name");

    if (!sale) return res.status(404).json({ message: "Distribution receipt not found" });

    res.json({ success: true, sale });
  } catch (error) {
    console.error("Error fetching sale receipt:", error);
    res.status(500).json({ message: "Failed to fetch receipt", error: error.message });
  }
};

export const cancelSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { cancelled_reason } = req.body;
    const sale = await InventorySale.findById(req.params.id).session(session);

    if (!sale) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Sale record not found" });
    }

    if (sale.status === "cancelled") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Sale is already cancelled" });
    }

    // Restore stock for all items in the sale
    for (const line of sale.items) {
      const stockItem = await InventoryItem.findById(line.item_id).session(session);
      if (stockItem) {
        const prevStock = stockItem.current_stock;
        const restoreQty = Number(line.quantity);
        const newStock = prevStock + restoreQty;

        stockItem.current_stock = newStock;
        await stockItem.save({ session });

        await InventoryLog.create(
          [
            {
              item_id: stockItem._id,
              action_type: "sale_cancel",
              quantity_change: restoreQty,
              previous_stock: prevStock,
              new_stock: newStock,
              reference_id: sale._id,
              reference_model: "InventorySale",
              performed_by: req.user._id,
              reason: `Voucher #${sale.sale_number} cancelled: ${cancelled_reason || "Not specified"}`,
            },
          ],
          { session }
        );
      }
    }

    sale.status = "cancelled";
    sale.cancelled_reason = cancelled_reason;
    sale.cancelled_by = req.user._id;
    sale.cancelled_at = new Date();
    await sale.save({ session });

    await session.commitTransaction();
    res.json({
      success: true,
      sale,
      message: `Sale #${sale.sale_number} cancelled and stock restored.`,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error cancelling sale:", error);
    res.status(500).json({ message: "Failed to cancel sale", error: error.message });
  } finally {
    session.endSession();
  }
};

// ── Student Self-Service Store ──────────────────────────────────────
export const getStudentSelfStore = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id })
      .populate("class_id", "name")
      .populate("section_id", "name");

    if (!student) {
      return res.status(404).json({ message: "Student record not found for user" });
    }

    const [mySales, availableKits, classBooksAndUniforms] = await Promise.all([
      InventorySale.find({ student_id: student._id })
        .populate("issued_by", "first_name last_name")
        .sort({ sale_date: -1 }),
      student.class_id
        ? InventoryKit.find({ class_id: student.class_id._id, is_active: true }).populate(
            "items.item_id"
          )
        : [],
      student.class_id
        ? InventoryItem.find({
            applicable_class_ids: student.class_id._id,
            is_active: true,
          }).sort({ category: 1, item_name: 1 })
        : [],
    ]);

    res.json({
      success: true,
      student,
      mySales,
      availableKits,
      classBooksAndUniforms,
    });
  } catch (error) {
    console.error("Error fetching student self-store data:", error);
    res.status(500).json({ message: "Failed to load store data", error: error.message });
  }
};

