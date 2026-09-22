import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import InventoryVendor from "../models/InventoryVendor.js";
import InventoryItem from "../models/InventoryItem.js";
import InventoryKit from "../models/InventoryKit.js";
import InventoryPurchase from "../models/InventoryPurchase.js";
import InventorySale from "../models/InventorySale.js";
import InventoryLog from "../models/InventoryLog.js";
import Class from "../models/Class.js";
import Student from "../models/Student.js";
import User from "../models/User.js";

dotenv.config();

const seedInventory = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for Inventory Seeding...");

    // Find admin user
    const adminUser = await User.findOne({ email: "admin@school.com" }) || (await User.findOne());
    if (!adminUser) {
      console.error("No admin user found. Please ensure users are seeded first.");
      process.exit(1);
    }

    // Find classes
    const classes = await Class.find().sort({ numeric_level: 1 });
    const classMap = {};
    classes.forEach((c) => {
      classMap[c.name] = c._id;
    });

    console.log(`Found ${classes.length} classes for inventory mapping.`);

    // ── 1. Seed Vendors ──────────────────────────────────────────
    const vendorsData = [
      {
        name: "Navneet & Oxford Educational Publishers",
        code: "VND-PUB-01",
        contact_person: "Ramesh Aggarwal",
        phone: "+91 98112 34567",
        email: "orders@navneet-oxford.com",
        address: "44 Daryaganj, Book Market",
        city: "New Delhi",
        gstin: "07AAACN1234F1Z8",
        categories_supplied: ["book", "stationery"],
        status: "active",
        notes: "Primary academic books & NCERT authorized supplier.",
      },
      {
        name: "Raymonds Academic Uniforms & Textiles",
        code: "VND-UNI-02",
        contact_person: "Vikram Singhania",
        phone: "+91 98223 45678",
        email: "uniforms@raymonds-school.com",
        address: "Shop 12-14, Gandhi Nagar Textile Market",
        city: "Delhi",
        gstin: "07AAACR9876E1ZQ",
        categories_supplied: ["uniform"],
        status: "active",
        notes: "Official supplier for shirts, trousers, skirts, blazers, and ties.",
      },
      {
        name: "Koh-i-Noor & Camlin Stationery Mart",
        code: "VND-STN-03",
        contact_person: "Dinesh Mehta",
        phone: "+91 98334 56789",
        email: "sales@kohinoorstationery.in",
        address: "78 Sadar Bazar",
        city: "Lucknow",
        gstin: "09AAACK5432D1ZU",
        categories_supplied: ["stationery"],
        status: "active",
        notes: "Notebooks, drawing books, colors, and art & craft packs.",
      },
      {
        name: "Modern Scientific & Lab Apparatus Supplies",
        code: "VND-LAB-04",
        contact_person: "Dr. Alok Verma",
        phone: "+91 98445 67890",
        email: "labtech@modernscientific.com",
        address: "Plot 5, Ambala Cantt Industrial Area",
        city: "Ambala",
        gstin: "06AAACM4321C1ZX",
        categories_supplied: ["lab_equipment"],
        status: "active",
        notes: "Physics, Chemistry, and Biology apparatus, glassware & consumables.",
      },
    ];

    const savedVendors = {};
    for (const v of vendorsData) {
      const vendor = await InventoryVendor.findOneAndUpdate(
        { code: v.code },
        { ...v },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      savedVendors[v.code] = vendor;
    }
    console.log("Seeded 4 Vendors.");

    // Helper for class IDs
    const getClassId = (name) => {
      const match = classes.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));
      return match ? [match._id] : [];
    };

    // ── 2. Seed Items Catalog ────────────────────────────────────
    const itemsData = [
      // ── Uniforms ──
      {
        item_name: "Boys Summer Shirt White (Size 28)",
        sku_code: "UNI-SHT-WHT-28",
        category: "uniform",
        subcategory: "Summer Uniform",
        unit: "piece",
        specifications: { size: "28", shelf_location: "Aisle U-1" },
        cost_price: 240,
        selling_price: 380,
        current_stock: 45,
        min_alert_stock: 10,
        description: "Standard poly-cotton white shirt with school crest embroidery.",
      },
      {
        item_name: "Boys Summer Shirt White (Size 32)",
        sku_code: "UNI-SHT-WHT-32",
        category: "uniform",
        subcategory: "Summer Uniform",
        unit: "piece",
        specifications: { size: "32", shelf_location: "Aisle U-1" },
        cost_price: 280,
        selling_price: 440,
        current_stock: 35,
        min_alert_stock: 10,
        description: "Standard poly-cotton white shirt for middle school.",
      },
      {
        item_name: "Boys Grey Trousers (Size 30)",
        sku_code: "UNI-TRS-GRY-30",
        category: "uniform",
        subcategory: "Summer Uniform",
        unit: "piece",
        specifications: { size: "30", shelf_location: "Aisle U-2" },
        cost_price: 360,
        selling_price: 550,
        current_stock: 40,
        min_alert_stock: 8,
        description: "Dark grey school uniform formal trousers.",
      },
      {
        item_name: "Girls Pleated Skirt Navy Blue (Size 28)",
        sku_code: "UNI-SKT-NVY-28",
        category: "uniform",
        subcategory: "Summer Uniform",
        unit: "piece",
        specifications: { size: "28", shelf_location: "Aisle U-3" },
        cost_price: 320,
        selling_price: 490,
        current_stock: 30,
        min_alert_stock: 8,
        description: "Box-pleated navy blue skirt with elastic adjustment band.",
      },
      {
        item_name: "School Winter Navy Blazer (Size 32)",
        sku_code: "UNI-BLZ-NVY-32",
        category: "uniform",
        subcategory: "Winter Uniform",
        unit: "piece",
        specifications: { size: "32", shelf_location: "Aisle U-4" },
        cost_price: 900,
        selling_price: 1350,
        current_stock: 18,
        min_alert_stock: 5,
        description: "Pure wool-blend navy blue blazer with school brass buttons.",
      },
      {
        item_name: "School Belt & Tie Set",
        sku_code: "UNI-ACC-BLT-01",
        category: "uniform",
        subcategory: "Accessories",
        unit: "set",
        specifications: { shelf_location: "Aisle U-5" },
        cost_price: 95,
        selling_price: 180,
        current_stock: 85,
        min_alert_stock: 20,
        description: "Stripe pattern tie with adjustable brass buckle belt.",
      },
      {
        item_name: "Sports House T-Shirt (Red - Falcon)",
        sku_code: "UNI-SPT-RED-M",
        category: "uniform",
        subcategory: "Sports Uniform",
        unit: "piece",
        specifications: { size: "M", shelf_location: "Aisle U-6" },
        cost_price: 190,
        selling_price: 320,
        current_stock: 4, // Low stock on purpose
        min_alert_stock: 10,
        description: "Dry-fit active polyester house sports t-shirt.",
      },

      // ── Books ──
      {
        item_name: "NCERT Mathematics Textbook - Class 1",
        sku_code: "BK-NCERT-MTH-01",
        category: "book",
        subcategory: "Textbook",
        unit: "piece",
        applicable_class_ids: getClassId("1"),
        specifications: { edition_or_publisher: "NCERT (2026 Edition)", shelf_location: "Book Shelf B-1" },
        cost_price: 65,
        selling_price: 80,
        current_stock: 50,
        min_alert_stock: 10,
        description: "Math-Magic textbook for Class 1.",
      },
      {
        item_name: "Mridang English Reader - Class 1",
        sku_code: "BK-NCERT-ENG-01",
        category: "book",
        subcategory: "Textbook",
        unit: "piece",
        applicable_class_ids: getClassId("1"),
        specifications: { edition_or_publisher: "NCERT (2026 Edition)", shelf_location: "Book Shelf B-1" },
        cost_price: 60,
        selling_price: 75,
        current_stock: 48,
        min_alert_stock: 10,
        description: "Foundational English curriculum book.",
      },
      {
        item_name: "Sarangi Hindi Textbook - Class 1",
        sku_code: "BK-NCERT-HIN-01",
        category: "book",
        subcategory: "Textbook",
        unit: "piece",
        applicable_class_ids: getClassId("1"),
        specifications: { edition_or_publisher: "NCERT (2026 Edition)", shelf_location: "Book Shelf B-1" },
        cost_price: 60,
        selling_price: 75,
        current_stock: 52,
        min_alert_stock: 10,
        description: "Primary Hindi language textbook.",
      },
      {
        item_name: "NCERT Science & Technology - Class 9",
        sku_code: "BK-NCERT-SCI-09",
        category: "book",
        subcategory: "Textbook",
        unit: "piece",
        applicable_class_ids: getClassId("9"),
        specifications: { edition_or_publisher: "NCERT", shelf_location: "Book Shelf B-4" },
        cost_price: 140,
        selling_price: 180,
        current_stock: 25,
        min_alert_stock: 8,
        description: "Comprehensive science textbook for secondary students.",
      },
      {
        item_name: "Oxford School Atlas (Latest Edition)",
        sku_code: "BK-OXF-ATLAS",
        category: "book",
        subcategory: "Reference Book",
        unit: "piece",
        specifications: { edition_or_publisher: "Oxford University Press", shelf_location: "Book Shelf B-5" },
        cost_price: 280,
        selling_price: 395,
        current_stock: 2, // Low stock on purpose
        min_alert_stock: 10,
        description: "Essential reference maps and topographical guide.",
      },

      // ── Stationery ──
      {
        item_name: "Four-Line English Notebook (172 Pages)",
        sku_code: "STN-NB-4LINE-172",
        category: "stationery",
        subcategory: "Notebook",
        unit: "piece",
        specifications: { edition_or_publisher: "Classmate / Navneet", shelf_location: "Stationery Rack S-1" },
        cost_price: 32,
        selling_price: 50,
        current_stock: 240,
        min_alert_stock: 30,
        description: "High-grade 70gsm smooth paper notebook for handwriting.",
      },
      {
        item_name: "Square-Grid Math Notebook (172 Pages)",
        sku_code: "STN-NB-GRID-172",
        category: "stationery",
        subcategory: "Notebook",
        unit: "piece",
        specifications: { shelf_location: "Stationery Rack S-1" },
        cost_price: 32,
        selling_price: 50,
        current_stock: 180,
        min_alert_stock: 30,
        description: "Half-inch square grid for arithmetic calculations.",
      },
      {
        item_name: "Student Geometry Mathematical Drawing Box",
        sku_code: "STN-BOX-GEO-01",
        category: "stationery",
        subcategory: "Instrument Box",
        unit: "box",
        specifications: { edition_or_publisher: "Camlin Kokuyo", shelf_location: "Stationery Rack S-2" },
        cost_price: 85,
        selling_price: 140,
        current_stock: 60,
        min_alert_stock: 15,
        description: "Self-centering compass, divider, protractor, set squares, and 15cm ruler.",
      },
      {
        item_name: "Junior Art & Oil Pastel Color Kit (24 Shades)",
        sku_code: "STN-ART-PST-24",
        category: "stationery",
        subcategory: "Art Supplies",
        unit: "set",
        specifications: { shelf_location: "Stationery Rack S-3" },
        cost_price: 70,
        selling_price: 110,
        current_stock: 55,
        min_alert_stock: 15,
        description: "Non-toxic vibrant drawing pastels with scraping tool.",
      },

      // ── Laboratory Equipment ──
      {
        item_name: "Borosilicate Glass Beaker 250ml",
        sku_code: "LAB-BKR-BORO-250",
        category: "lab_equipment",
        subcategory: "Glassware",
        unit: "piece",
        specifications: {
          lab_type: "glassware",
          shelf_location: "Chemistry Lab Cabinet C-2",
        },
        cost_price: 45,
        selling_price: 75,
        current_stock: 80,
        min_alert_stock: 20,
        description: "Heat-resistant borosilicate 3.3 graduation beaker with spout.",
      },
      {
        item_name: "Compound Monocular Optical Microscope (1000x)",
        sku_code: "LAB-MIC-OPT-1000",
        category: "lab_equipment",
        subcategory: "Apparatus",
        unit: "piece",
        specifications: {
          lab_type: "non_consumable",
          shelf_location: "Biology Lab Instrument Shelf",
        },
        cost_price: 4800,
        selling_price: 6500,
        current_stock: 12,
        min_alert_stock: 3,
        description: "Triple revolving nosepiece, coarse & fine focusing with LED illumination.",
      },
      {
        item_name: "Digital LCD Vernier Caliper (150mm)",
        sku_code: "LAB-PHY-CAL-150",
        category: "lab_equipment",
        subcategory: "Physics Apparatus",
        unit: "piece",
        specifications: {
          lab_type: "apparatus",
          shelf_location: "Physics Lab Locker P-1",
        },
        cost_price: 520,
        selling_price: 790,
        current_stock: 20,
        min_alert_stock: 5,
        description: "High-precision stainless steel caliper for physics practical measurements.",
      },
      {
        item_name: "Litmus Indicator Strips (100 Blue + 100 Red)",
        sku_code: "LAB-CHM-LTM-100",
        category: "lab_equipment",
        subcategory: "Consumable",
        unit: "box",
        specifications: {
          lab_type: "consumable",
          shelf_location: "Chemistry Reagents Locker",
        },
        cost_price: 60,
        selling_price: 95,
        current_stock: 35,
        min_alert_stock: 10,
        description: "Acid-base indicator paper booklets for laboratory experiments.",
      },
    ];

    const savedItems = {};
    for (const item of itemsData) {
      const saved = await InventoryItem.findOneAndUpdate(
        { sku_code: item.sku_code },
        { ...item },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      savedItems[item.sku_code] = saved;
    }
    console.log(`Seeded ${itemsData.length} Inventory Items.`);

    // ── 3. Seed Class Kits / Bundles ─────────────────────────────
    const class1Id = getClassId("1")[0];
    if (class1Id) {
      const kit1 = await InventoryKit.findOneAndUpdate(
        { code: "KIT-CLS1-FULL" },
        {
          name: "Class 1 Complete Admission & Session Kit",
          code: "KIT-CLS1-FULL",
          class_id: class1Id,
          category: "combined_kit",
          items: [
            { item_id: savedItems["UNI-SHT-WHT-28"]._id, quantity: 2 },
            { item_id: savedItems["UNI-ACC-BLT-01"]._id, quantity: 1 },
            { item_id: savedItems["BK-NCERT-MTH-01"]._id, quantity: 1 },
            { item_id: savedItems["BK-NCERT-ENG-01"]._id, quantity: 1 },
            { item_id: savedItems["BK-NCERT-HIN-01"]._id, quantity: 1 },
            { item_id: savedItems["STN-NB-4LINE-172"]._id, quantity: 4 },
            { item_id: savedItems["STN-NB-GRID-172"]._id, quantity: 3 },
            { item_id: savedItems["STN-ART-PST-24"]._id, quantity: 1 },
          ],
          bundle_price: 1650, // Discounted package price
          description: "Full starter kit given at Class 1 admission containing 2 uniforms, tie/belt, 3 textbooks, 7 notebooks, and art colors.",
          is_active: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Seeded Class 1 Admission Kit (${kit1.name}).`);
    }

    // ── 4. Seed Inward Purchase Bills ────────────────────────────
    const samplePurchase = await InventoryPurchase.findOneAndUpdate(
      { invoice_no: "INV-RAY-2026-904" },
      {
        vendor_id: savedVendors["VND-UNI-02"]._id,
        invoice_no: "INV-RAY-2026-904",
        purchase_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        items: [
          {
            item_id: savedItems["UNI-SHT-WHT-28"]._id,
            item_name: savedItems["UNI-SHT-WHT-28"].item_name,
            quantity: 50,
            unit_cost: 240,
            tax_percent: 5,
            total: 12600,
          },
          {
            item_id: savedItems["UNI-TRS-GRY-30"]._id,
            item_name: savedItems["UNI-TRS-GRY-30"].item_name,
            quantity: 40,
            unit_cost: 360,
            tax_percent: 5,
            total: 15120,
          },
        ],
        subtotal: 26400,
        tax_amount: 1320,
        discount: 0,
        grand_total: 27720,
        payment_status: "paid",
        payment_mode: "bank_transfer",
        received_by: adminUser._id,
        remarks: "Annual uniform stock delivery for Session 2026-2027.",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Seeded Inward Purchase Voucher (${samplePurchase.purchase_number || "PUR"}).`);

    // ── 5. Seed a Sample Student Distribution Sale ──────────────
    const sampleStudent = await Student.findOne();
    if (sampleStudent) {
      const sampleSale = await InventorySale.findOneAndUpdate(
        { academic_session: "2026-2027", remarks: "Demo admission kit issuance" },
        {
          student_id: sampleStudent._id,
          distribution_type: "admission_kit",
          academic_session: "2026-2027",
          items: [
            {
              item_id: savedItems["UNI-SHT-WHT-28"]._id,
              item_name: savedItems["UNI-SHT-WHT-28"].item_name,
              sku_code: savedItems["UNI-SHT-WHT-28"].sku_code,
              category: "uniform",
              quantity: 2,
              unit_price: 380,
              discount: 0,
              total: 760,
            },
            {
              item_id: savedItems["UNI-ACC-BLT-01"]._id,
              item_name: savedItems["UNI-ACC-BLT-01"].item_name,
              sku_code: savedItems["UNI-ACC-BLT-01"].sku_code,
              category: "uniform",
              quantity: 1,
              unit_price: 180,
              discount: 0,
              total: 180,
            },
            {
              item_id: savedItems["BK-NCERT-MTH-01"]._id,
              item_name: savedItems["BK-NCERT-MTH-01"].item_name,
              sku_code: savedItems["BK-NCERT-MTH-01"].sku_code,
              category: "book",
              quantity: 1,
              unit_price: 80,
              discount: 0,
              total: 80,
            },
          ],
          subtotal: 1020,
          discount_total: 20,
          payable_amount: 1000,
          paid_amount: 1000,
          payment_mode: "upi",
          payment_status: "paid",
          transaction_ref: "UPI/628941098273",
          sale_date: new Date(),
          issued_by: adminUser._id,
          remarks: "Demo admission kit issuance",
          status: "completed",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Seeded Sample Student Distribution Voucher (${sampleSale.sale_number || "STR"}).`);
    }

    console.log("\n=== Inventory, Uniform & Book Store Demo Seed Complete! ===");
    process.exit(0);
  } catch (err) {
    console.error("Error during inventory seeding:", err);
    process.exit(1);
  }
};

seedInventory();

