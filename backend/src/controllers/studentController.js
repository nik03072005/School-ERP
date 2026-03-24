import Student from "../models/Student.js";

// @desc    Get my admission form
// @route   GET /api/student/admission
// @access  Student
export const getMyAdmissionForm = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) return res.status(404).json({ message: "Student profile not found" });
    res.status(200).json({ student });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
