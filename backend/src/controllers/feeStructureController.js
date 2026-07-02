import FeeHead from "../models/FeeHead.js";
import FeeStructure from "../models/FeeStructure.js";
import StudentFee from "../models/StudentFee.js";

// ── Fee Heads ────────────────────────────────────────────────────────────

// @desc    List fee heads
// @route   GET /api/fees/heads
// @access  Private (admin)
export const getFeeHeads = async (req, res) => {
  try {
    const filter = {};
    if (req.query.active === "true") filter.is_active = true;
    const heads = await FeeHead.find(filter).sort({ name: 1 }).lean();
    res.json({ heads });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch fee heads", error: error.message });
  }
};

// @desc    Create a fee head
// @route   POST /api/fees/heads
// @access  Private (admin)
export const createFeeHead = async (req, res) => {
  try {
    const { name, code, description, is_refundable } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    const head = await FeeHead.create({
      name,
      code,
      description,
      is_refundable: !!is_refundable,
      created_by: req.user._id,
    });
    res.status(201).json({ message: "Fee head created", head });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "A fee head with this name already exists" });
    }
    res.status(500).json({ message: "Failed to create fee head", error: error.message });
  }
};

// @desc    Update a fee head
// @route   PUT /api/fees/heads/:id
// @access  Private (admin)
export const updateFeeHead = async (req, res) => {
  try {
    const { name, code, description, is_refundable, is_active } = req.body;
    const head = await FeeHead.findByIdAndUpdate(
      req.params.id,
      { name, code, description, is_refundable, is_active },
      { new: true, runValidators: true }
    );
    if (!head) return res.status(404).json({ message: "Fee head not found" });
    res.json({ message: "Fee head updated", head });
  } catch (error) {
    res.status(500).json({ message: "Failed to update fee head", error: error.message });
  }
};

// @desc    Deactivate a fee head (soft delete — referenced by fee structures)
// @route   DELETE /api/fees/heads/:id
// @access  Private (admin)
export const deleteFeeHead = async (req, res) => {
  try {
    const head = await FeeHead.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true });
    if (!head) return res.status(404).json({ message: "Fee head not found" });
    res.json({ message: "Fee head deactivated", head });
  } catch (error) {
    res.status(500).json({ message: "Failed to deactivate fee head", error: error.message });
  }
};

// ── Fee Structures ───────────────────────────────────────────────────────

// @desc    List fee structures (filterable by class_id, academic_year)
// @route   GET /api/fees/structures
// @access  Private (admin)
export const getFeeStructures = async (req, res) => {
  try {
    const { class_id, academic_year, status } = req.query;
    const filter = {};
    if (class_id) filter.class_id = class_id;
    if (academic_year) filter.academic_year = academic_year;
    if (status) filter.status = status;

    const structures = await FeeStructure.find(filter)
      .populate("class_id", "name grade_level")
      .populate("section_id", "name")
      .populate("components.fee_head_id", "name code")
      .sort({ academic_year: -1, createdAt: -1 })
      .lean();
    res.json({ structures });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch fee structures", error: error.message });
  }
};

// @desc    Get one fee structure
// @route   GET /api/fees/structures/:id
// @access  Private (admin)
export const getFeeStructure = async (req, res) => {
  try {
    const structure = await FeeStructure.findById(req.params.id)
      .populate("class_id", "name grade_level")
      .populate("section_id", "name")
      .populate("components.fee_head_id", "name code")
      .lean();
    if (!structure) return res.status(404).json({ message: "Fee structure not found" });
    res.json({ structure });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch fee structure", error: error.message });
  }
};

const validateInstallmentPercentages = (installments) => {
  if (!installments || installments.length === 0) return true;
  const total = installments.reduce((sum, i) => sum + (Number(i.percentage) || 0), 0);
  return Math.abs(total - 100) < 0.01;
};

// @desc    Create a fee structure
// @route   POST /api/fees/structures
// @access  Private (admin)
export const createFeeStructure = async (req, res) => {
  try {
    const { academic_year, class_id, section_id, components, installments, late_fee_policy } = req.body;
    if (!academic_year || !class_id) {
      return res.status(400).json({ message: "academic_year and class_id are required" });
    }
    if (!components || components.length === 0) {
      return res.status(400).json({ message: "At least one fee component is required" });
    }
    if (!validateInstallmentPercentages(installments)) {
      return res.status(400).json({ message: "Installment percentages must add up to 100" });
    }

    const structure = await FeeStructure.create({
      academic_year,
      class_id,
      section_id: section_id || null,
      components,
      installments: installments || [],
      late_fee_policy: late_fee_policy || {},
      created_by: req.user._id,
    });

    res.status(201).json({ message: "Fee structure created", structure });
  } catch (error) {
    res.status(500).json({ message: "Failed to create fee structure", error: error.message });
  }
};

// @desc    Update a fee structure
// @route   PUT /api/fees/structures/:id
// @access  Private (admin)
export const updateFeeStructure = async (req, res) => {
  try {
    const { academic_year, class_id, section_id, components, installments, late_fee_policy, status } = req.body;
    if (installments && !validateInstallmentPercentages(installments)) {
      return res.status(400).json({ message: "Installment percentages must add up to 100" });
    }

    const structure = await FeeStructure.findById(req.params.id);
    if (!structure) return res.status(404).json({ message: "Fee structure not found" });

    if (academic_year !== undefined) structure.academic_year = academic_year;
    if (class_id !== undefined) structure.class_id = class_id;
    if (section_id !== undefined) structure.section_id = section_id || null;
    if (components !== undefined) structure.components = components;
    if (installments !== undefined) structure.installments = installments;
    if (late_fee_policy !== undefined) structure.late_fee_policy = late_fee_policy;
    if (status !== undefined) structure.status = status;

    await structure.save();
    res.json({ message: "Fee structure updated", structure });
  } catch (error) {
    res.status(500).json({ message: "Failed to update fee structure", error: error.message });
  }
};

// @desc    Archive a fee structure
// @route   DELETE /api/fees/structures/:id
// @access  Private (admin)
export const archiveFeeStructure = async (req, res) => {
  try {
    const assignedCount = await StudentFee.countDocuments({ fee_structure_id: req.params.id });
    if (assignedCount > 0) {
      const structure = await FeeStructure.findByIdAndUpdate(
        req.params.id,
        { status: "archived" },
        { new: true }
      );
      if (!structure) return res.status(404).json({ message: "Fee structure not found" });
      return res.json({ message: "Fee structure archived (students already assigned)", structure });
    }

    const structure = await FeeStructure.findByIdAndDelete(req.params.id);
    if (!structure) return res.status(404).json({ message: "Fee structure not found" });
    res.json({ message: "Fee structure deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove fee structure", error: error.message });
  }
};

// @desc    Clone a fee structure into a new academic year
// @route   POST /api/fees/structures/:id/clone
// @access  Private (admin)
export const cloneFeeStructure = async (req, res) => {
  try {
    const { academic_year } = req.body;
    if (!academic_year) return res.status(400).json({ message: "academic_year is required" });

    const source = await FeeStructure.findById(req.params.id).lean();
    if (!source) return res.status(404).json({ message: "Fee structure not found" });

    const clone = await FeeStructure.create({
      academic_year,
      class_id: source.class_id,
      section_id: source.section_id,
      components: source.components,
      installments: source.installments,
      late_fee_policy: source.late_fee_policy,
      created_by: req.user._id,
    });

    res.status(201).json({ message: "Fee structure cloned", structure: clone });
  } catch (error) {
    res.status(500).json({ message: "Failed to clone fee structure", error: error.message });
  }
};
