import Student from "../models/Student.js";

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

// @desc    Submit / re-submit admission form
// @route   POST /api/student/admission
// @access  Student
export const submitAdmissionForm = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) return res.status(404).json({ message: "Student profile not found" });

    if (student.admission_status === "approved") {
      return res.status(400).json({ message: "Your admission is already approved" });
    }

    ADMISSION_FIELDS.forEach((field) => {
      const val = req.body[field];
      // Skip undefined and empty strings — empty strings fail Mongoose enum validation
      if (val !== undefined && val !== null && val !== '') {
        student[field] = val;
      }
    });

    student.admission_status = "pending";
    student.admission_submitted_at = new Date();
    await student.save();

    res.status(200).json({ message: "Admission form submitted successfully. Awaiting admin approval." });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
