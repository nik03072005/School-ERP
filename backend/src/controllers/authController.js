import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Staff from "../models/Staff.js";
import Role from "../models/Role.js";

const buildUserPayload = async (user) => {
  const payload = {
    id: user._id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    mobile: user.mobile,
    avatar: user.avatar,
    role: user.role_id?.name ?? user.role_id,
    status: user.status,
    is_active: user.is_active,
  };
  if ((user.role_id?.name ?? user.role_id) === "student") {
    const studentDoc = await Student.findOne({ user_id: user._id }).select("admission_status");
    payload.admission_status = studentDoc?.admission_status ?? "not_submitted";
  }
  return payload;
};

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  let createdUser = null;

  try {
    const { first_name, last_name, email, password, mobile, avatar, role } = req.body;

    if (!first_name || !last_name || !email || !password || !role) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    if (role === "admin") {
      return res.status(403).json({ message: "Admin accounts can only be created by admins" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      return res.status(400).json({ message: `Invalid role: ${role}` });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    createdUser = await User.create({
      first_name,
      last_name,
      email: normalizedEmail,
      password,
      mobile,
      avatar,
      role_id: roleDoc._id,
      status: "pending",
      is_active: true,
      created_by: null,
    });

    if (role === "teaching_staff" || role === "non_teaching_staff") {
      await Staff.create({ user_id: createdUser._id, staff_type: role });
    } else if (role === "student") {
      await Student.create({ user_id: createdUser._id });
    }

    const user = await User.findById(createdUser._id).populate("role_id", "name");
    const token = signToken(user._id);
    const userPayload = await buildUserPayload(user);

    res.status(201).json({
      message: "Registration successful. Awaiting admin approval.",
      token,
      user: userPayload,
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

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).populate("role_id", "name");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "Account has been deactivated" });
    }

    // Update last login
    user.last_login = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    const userPayload = await buildUserPayload(user);

    res.status(200).json({ token, user: userPayload });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const userPayload = await buildUserPayload(req.user);
    res.status(200).json({ user: userPayload });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Logout (client drops token — stateless)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Change password
// @route   PATCH /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide current and new password" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Reset password using email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Please provide email and new password" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "No account found for this email" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful. You can now sign in." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
