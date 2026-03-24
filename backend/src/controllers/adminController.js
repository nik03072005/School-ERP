import User from "../models/User.js";
import Staff from "../models/Staff.js";
import Student from "../models/Student.js";
import Role from "../models/Role.js";

const ADMISSION_FIELDS = [
  "gender", "date_of_birth", "class_applying", "blood_group", "aadhar_number",
  "address", "city", "state", "zip_code", "previous_school",
  "transport_required", "pickup_drop_address",
  "primary_guardian_name", "primary_guardian_relationship",
  "primary_guardian_phone", "primary_guardian_email", "primary_guardian_address",
  "secondary_guardian_name", "secondary_guardian_relationship",
  "secondary_guardian_phone", "secondary_guardian_email",
  "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_phone",
  "has_allergies", "allergies_list",
  "has_medical_conditions", "medical_conditions",
  "physician_name", "physician_phone",
  "health_insurance_provider", "policy_number",
  "docs_birth_certificate", "docs_vaccination_card", "docs_aadhar_card",
  "docs_address_proof", "docs_photograph", "docs_other",
];

// @desc    Get all users (with optional filters: role, status, is_active)
// @route   GET /api/admin/users
// @access  Admin
export const getAllUsers = async (req, res) => {
  try {
    const { role, status, is_active } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (is_active !== undefined) filter.is_active = is_active === "true";

    let users = await User.find(filter)
      .select("-password")
      .populate("role_id", "name")
      .populate("created_by", "first_name last_name email")
      .sort({ createdAt: -1 });

    // Filter by role name if provided
    if (role) {
      users = users.filter((u) => u.role_id?.name === role);
    }

    res.status(200).json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Admin creates a user account
// @route   POST /api/admin/users
// @access  Admin
export const createUser = async (req, res) => {
  let createdUser = null;

  try {
    const { first_name, last_name, email, password, mobile, role } = req.body;

    if (!first_name || !last_name || !email || !password || !role) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      return res.status(400).json({ message: `Invalid role: ${role}` });
    }

    const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    createdUser = await User.create({
      first_name,
      last_name,
      email,
      password,
      mobile,
      role_id: roleDoc._id,
      status: "approved",
      is_active: true,
      created_by: req.user._id,
    });

    if (role === "teaching_staff" || role === "non_teaching_staff") {
      await Staff.create({ user_id: createdUser._id });
    } else if (role === "student") {
      await Student.create({ user_id: createdUser._id });
    }

    const created = await User.findById(createdUser._id)
      .select("-password")
      .populate("role_id", "name")
      .populate("created_by", "first_name last_name email");

    res.status(201).json({
      message: "User created successfully",
      user: created,
    });
  } catch (error) {
    if (createdUser) {
      await User.deleteOne({ _id: createdUser._id }).catch(() => {});
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: messages });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all pending users
// @route   GET /api/admin/users/pending
// @access  Admin
export const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: "pending" })
      .select("-password")
      .populate("role_id", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("role_id", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Attach profile if exists
    let profile = null;
    const roleName = user.role_id?.name;
    if (roleName === "teaching_staff" || roleName === "non_teaching_staff") {
      profile = await Staff.findOne({ user_id: user._id });
    } else if (roleName === "student") {
      profile = await Student.findOne({ user_id: user._id });
    }

    res.status(200).json({ user, profile });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Approve a user account
// @route   PATCH /api/admin/users/:id/approve
// @access  Admin
export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.status === "approved") {
      return res.status(400).json({ message: "User is already approved" });
    }

    user.status = "approved";
    user.is_active = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "User approved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Reject a user account
// @route   PATCH /api/admin/users/:id/reject
// @access  Admin
export const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = "rejected";
    user.is_active = false;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "User rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Deactivate a user account
// @route   PATCH /api/admin/users/:id/deactivate
// @access  Admin
export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent admin from deactivating themselves
    if (user._id.equals(req.user._id)) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }

    user.is_active = false;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "User deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Activate a user account
// @route   PATCH /api/admin/users/:id/activate
// @access  Admin
export const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.is_active = true;
    user.status = "approved";
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "User activated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a user and their profile
// @route   DELETE /api/admin/users/:id
// @access  Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("role_id", "name");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (user._id.equals(req.user._id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const roleName = user.role_id?.name;

    // Delete associated profile first, then the user
    if (roleName === "teaching_staff" || roleName === "non_teaching_staff") {
      await Staff.deleteOne({ user_id: user._id });
    } else if (roleName === "student") {
      await Student.deleteOne({ user_id: user._id });
    }

    await User.deleteOne({ _id: user._id });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Admission Management ─────────────────────────────────────────────────────

// @desc    Get all pending admission forms
// @route   GET /api/admin/admissions/pending
// @access  Admin
export const getPendingAdmissions = async (req, res) => {
  try {
    const students = await Student.find({ admission_status: "pending" })
      .populate({
        path: "user_id",
        select: "-password",
        populate: { path: "role_id", select: "name" },
      })
      .sort({ admission_submitted_at: -1 });

    res.status(200).json({ count: students.length, students });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get full admission detail for one student
// @route   GET /api/admin/admissions/:studentId
// @access  Admin
export const getStudentAdmission = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).populate({
      path: "user_id",
      select: "-password",
      populate: { path: "role_id", select: "name" },
    });

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ student });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get student admission detail by linked user ID
// @route   GET /api/admin/admissions/by-user/:userId
// @access  Admin
export const getStudentAdmissionByUser = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.params.userId }).populate({
      path: "user_id",
      select: "-password",
      populate: { path: "role_id", select: "name" },
    });

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ student });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create or update admission form for a student
// @route   PUT /api/admin/admissions/:studentId
// @access  Admin
export const upsertStudentAdmission = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    ADMISSION_FIELDS.forEach((field) => {
      const val = req.body[field];
      if (val !== undefined && val !== null && val !== "") {
        student[field] = val;
      }
    });

    student.admission_status = req.body.admission_status || "approved";
    student.admission_submitted_at = student.admission_submitted_at || new Date();
    await student.save();

    const populated = await Student.findById(student._id).populate({
      path: "user_id",
      select: "-password",
      populate: { path: "role_id", select: "name" },
    });

    res.status(200).json({ message: "Admission form saved successfully", student: populated });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Approve student admission
// @route   PATCH /api/admin/admissions/:studentId/approve
// @access  Admin
export const approveAdmission = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.admission_status = "approved";
    await student.save();

    res.status(200).json({ message: "Admission approved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Reject student admission (student may resubmit)
// @route   PATCH /api/admin/admissions/:studentId/reject
// @access  Admin
export const rejectAdmission = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.admission_status = "rejected";
    await student.save();

    res.status(200).json({ message: "Admission rejected. Student may resubmit." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

