import User from "../models/User.js";
import Staff from "../models/Staff.js";
import Student from "../models/Student.js";

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

