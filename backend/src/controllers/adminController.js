import User from "../models/User.js";
import Staff from "../models/Staff.js";
import Student from "../models/Student.js";
import Role from "../models/Role.js";
import TeachingProfile from "../models/TeachingProfile.js";
import NonTeachingProfile from "../models/NonTeachingProfile.js";

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

const STAFF_FIELDS = [
  "employee_code",
  "designation",
  "department",
  "joining_date",
  "basic_salary",
  "bank_account_no",
  "bank_name",
  "staff_type",
  "is_active",
];

const TEACHING_PROFILE_FIELDS = [
  "qualification",
  "experience_years",
  "subjects",
  "classes_assigned",
  "employee_notes",
];

const NON_TEACHING_PROFILE_FIELDS = [
  "job_category",
  "shift",
  "reporting_manager",
  "operational_permissions",
  "employee_notes",
];

const USER_SORT_FIELDS = {
  first_name: "first_name",
  last_name: "last_name",
  email: "email",
  status: "status",
  createdAt: "createdAt",
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const hasMeaningfulValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return value;
  return true;
};

const isStudentFormFilled = (studentDoc) => {
  if (!studentDoc) return false;
  if (studentDoc.admission_status && studentDoc.admission_status !== "not_submitted") return true;
  return ADMISSION_FIELDS.some((field) => hasMeaningfulValue(studentDoc[field]));
};

const hasCoreStaffDetails = (staffDoc) => {
  if (!staffDoc) return false;
  const coreFields = STAFF_FIELDS.filter((field) => field !== "is_active" && field !== "staff_type");
  return coreFields.some((field) => hasMeaningfulValue(staffDoc[field]));
};

const hasTeachingDetails = (profileDoc) => {
  if (!profileDoc) return false;
  return TEACHING_PROFILE_FIELDS.some((field) => hasMeaningfulValue(profileDoc[field]));
};

const hasNonTeachingDetails = (profileDoc) => {
  if (!profileDoc) return false;
  return NON_TEACHING_PROFILE_FIELDS.some((field) => hasMeaningfulValue(profileDoc[field]));
};

const getStaffProfileByRole = async (roleName, staffId) => {
  if (roleName === "teaching_staff") {
    return TeachingProfile.findOne({ staff_id: staffId });
  }
  if (roleName === "non_teaching_staff") {
    return NonTeachingProfile.findOne({ staff_id: staffId });
  }
  return null;
};

const buildUserFilter = async (query, forceStatus) => {
  const { role, status, is_active, search, created_from, created_to } = query;
  const filter = {};

  if (forceStatus) {
    filter.status = forceStatus;
  } else if (status) {
    filter.status = status;
  }

  if (is_active !== undefined && is_active !== "") {
    filter.is_active = is_active === "true";
  }

  if (search) {
    const searchRegex = new RegExp(search.trim(), "i");
    filter.$or = [
      { first_name: searchRegex },
      { last_name: searchRegex },
      { email: searchRegex },
      { mobile: searchRegex },
    ];
  }

  const fromDate = parseDate(created_from);
  const toDate = parseDate(created_to);
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = fromDate;
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
  }

  if (role) {
    const roleDoc = await Role.findOne({ name: role }).select("_id");
    if (!roleDoc) {
      return { noResults: true, filter };
    }
    filter.role_id = roleDoc._id;
  }

  return { noResults: false, filter };
};

const enrichUsersWithFormMeta = async (users) => {
  const userIds = users.map((user) => user._id);
  if (userIds.length === 0) return [];

  const [studentProfiles, staffProfiles] = await Promise.all([
    Student.find({ user_id: { $in: userIds } }).select(["user_id", "admission_status", ...ADMISSION_FIELDS].join(" ")),
    Staff.find({ user_id: { $in: userIds } }).select("user_id staff_type employee_code designation department joining_date basic_salary bank_account_no bank_name"),
  ]);

  const staffIds = staffProfiles.map((entry) => entry._id);
  const [teachingProfiles, nonTeachingProfiles] = await Promise.all([
    TeachingProfile.find({ staff_id: { $in: staffIds } }).select(["staff_id", ...TEACHING_PROFILE_FIELDS].join(" ")),
    NonTeachingProfile.find({ staff_id: { $in: staffIds } }).select(["staff_id", ...NON_TEACHING_PROFILE_FIELDS].join(" ")),
  ]);

  const studentMap = new Map(studentProfiles.map((entry) => [String(entry.user_id), entry]));
  const staffMap = new Map(staffProfiles.map((entry) => [String(entry.user_id), entry]));
  const teachingMap = new Map(teachingProfiles.map((entry) => [String(entry.staff_id), entry]));
  const nonTeachingMap = new Map(nonTeachingProfiles.map((entry) => [String(entry.staff_id), entry]));

  return users.map((userDoc) => {
    const user = userDoc.toObject();
    const userId = String(user._id);
    const studentProfile = studentMap.get(userId);
    const staffProfile = staffMap.get(userId);

    let hasStaffDetails = hasCoreStaffDetails(staffProfile);
    if (staffProfile?.staff_type === "teaching_staff") {
      hasStaffDetails = hasStaffDetails || hasTeachingDetails(teachingMap.get(String(staffProfile._id)));
    }
    if (staffProfile?.staff_type === "non_teaching_staff") {
      hasStaffDetails = hasStaffDetails || hasNonTeachingDetails(nonTeachingMap.get(String(staffProfile._id)));
    }

    return {
      ...user,
      has_admission_form: isStudentFormFilled(studentProfile),
      has_staff_details: hasStaffDetails,
    };
  });
};

const listUsersWithQuery = async (query, forceStatus = null) => {
  const { noResults, filter } = await buildUserFilter(query, forceStatus);
  const sortField = USER_SORT_FIELDS[query.sort_by] || "createdAt";
  const sortDir = query.sort_dir === "asc" ? 1 : -1;
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 25), 100);
  const skip = (page - 1) * limit;

  if (noResults) {
    return {
      users: [],
      count: 0,
      pagination: {
        page,
        limit,
        totalPages: 0,
        totalItems: 0,
      },
    };
  }

  const [totalItems, userDocs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select("-password")
      .populate("role_id", "name")
      .populate("created_by", "first_name last_name email")
      .sort({ [sortField]: sortDir, _id: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  const users = await enrichUsersWithFormMeta(userDocs);

  return {
    users,
    count: users.length,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
    },
  };
};

// @desc    Get all users (search + filters + sorting + pagination)
// @route   GET /api/admin/users
// @access  Admin
export const getAllUsers = async (req, res) => {
  try {
    const result = await listUsersWithQuery(req.query);
    res.status(200).json(result);
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
    const { first_name, last_name, email, password, mobile, avatar, role } = req.body;

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
      avatar,
      role_id: roleDoc._id,
      status: "approved",
      is_active: true,
      created_by: req.user._id,
    });

    if (role === "teaching_staff" || role === "non_teaching_staff") {
      await Staff.create({ user_id: createdUser._id, staff_type: role });
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
    const result = await listUsersWithQuery(req.query, "pending");
    res.status(200).json(result);
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
      const staff = await Staff.findOne({ user_id: user._id });
      const staffProfile = staff ? await getStaffProfileByRole(roleName, staff._id) : null;
      profile = { staff, staff_profile: staffProfile };
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
      const staff = await Staff.findOne({ user_id: user._id }).select("_id");
      if (staff) {
        await Promise.all([
          TeachingProfile.deleteOne({ staff_id: staff._id }),
          NonTeachingProfile.deleteOne({ staff_id: staff._id }),
          Staff.deleteOne({ _id: staff._id }),
        ]);
      }
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
    const { search, created_from, created_to } = req.query;
    const filter = { admission_status: "pending" };

    const fromDate = parseDate(created_from);
    const toDate = parseDate(created_to);
    if (fromDate || toDate) {
      filter.admission_submitted_at = {};
      if (fromDate) filter.admission_submitted_at.$gte = fromDate;
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
        filter.admission_submitted_at.$lte = toDate;
      }
    }

    let students = await Student.find(filter)
      .populate({
        path: "user_id",
        select: "-password",
        populate: { path: "role_id", select: "name" },
      })
      .sort({ admission_submitted_at: -1 });

    if (search) {
      const normalized = search.trim().toLowerCase();
      students = students.filter((student) => {
        const user = student?.user_id;
        if (!user) return false;
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
        return (
          fullName.includes(normalized)
          || String(user.email || "").toLowerCase().includes(normalized)
          || String(user.mobile || "").toLowerCase().includes(normalized)
        );
      });
    }

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

    if (typeof req.body.avatar === "string" && req.body.avatar.trim()) {
      await User.findByIdAndUpdate(student.user_id, { avatar: req.body.avatar.trim() });
    }

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

// @desc    Get staff profile by linked user ID
// @route   GET /api/admin/staff/by-user/:userId
// @access  Admin
export const getStaffByUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password")
      .populate("role_id", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const roleName = user.role_id?.name;
    const isStaffRole = roleName === "teaching_staff" || roleName === "non_teaching_staff";
    if (!isStaffRole) {
      return res.status(400).json({ message: "Only staff users can have staff details" });
    }

    const staff = await Staff.findOne({ user_id: user._id });
    const staffProfile = staff ? await getStaffProfileByRole(roleName, staff._id) : null;
    const hasProfileDetails = roleName === "teaching_staff"
      ? hasTeachingDetails(staffProfile)
      : hasNonTeachingDetails(staffProfile);

    res.status(200).json({
      user,
      staff,
      staff_profile: staffProfile,
      has_staff_details: hasCoreStaffDetails(staff) || hasProfileDetails,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create or update staff profile by linked user ID
// @route   PUT /api/admin/staff/by-user/:userId
// @access  Admin
export const upsertStaffByUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("role_id", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const roleName = user.role_id?.name;
    const isStaffRole = roleName === "teaching_staff" || roleName === "non_teaching_staff";
    if (!isStaffRole) {
      return res.status(400).json({ message: "Only staff users can have staff details" });
    }

    let staff = await Staff.findOne({ user_id: user._id });
    if (!staff) {
      staff = new Staff({ user_id: user._id, staff_type: roleName });
    } else {
      staff.staff_type = roleName;
    }

    STAFF_FIELDS.forEach((field) => {
      if (req.body[field] === undefined) return;

      if (field === "joining_date") {
        staff.joining_date = req.body.joining_date ? new Date(req.body.joining_date) : null;
        return;
      }

      if (field === "basic_salary") {
        staff.basic_salary = req.body.basic_salary === "" || req.body.basic_salary === null
          ? null
          : Number(req.body.basic_salary);
        return;
      }

      if (field === "is_active") {
        staff.is_active = Boolean(req.body.is_active);
        return;
      }

      const rawValue = req.body[field];
      staff[field] = rawValue === "" ? null : String(rawValue).trim();
    });

    await staff.save();

    let staffProfile = await getStaffProfileByRole(roleName, staff._id);
    if (!staffProfile) {
      staffProfile = roleName === "teaching_staff"
        ? new TeachingProfile({ staff_id: staff._id })
        : new NonTeachingProfile({ staff_id: staff._id });
    }

    const profileFields = roleName === "teaching_staff" ? TEACHING_PROFILE_FIELDS : NON_TEACHING_PROFILE_FIELDS;
    profileFields.forEach((field) => {
      if (req.body[field] === undefined) return;

      if (field === "subjects" || field === "classes_assigned" || field === "operational_permissions") {
        if (Array.isArray(req.body[field])) {
          staffProfile[field] = req.body[field].map((item) => String(item).trim()).filter(Boolean);
        } else if (typeof req.body[field] === "string") {
          staffProfile[field] = req.body[field]
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }
        return;
      }

      if (field === "experience_years") {
        staffProfile.experience_years = req.body.experience_years === "" || req.body.experience_years === null
          ? null
          : Number(req.body.experience_years);
        return;
      }

      const rawValue = req.body[field];
      staffProfile[field] = rawValue === "" ? null : String(rawValue).trim();
    });

    await staffProfile.save();

    const hasProfileDetails = roleName === "teaching_staff"
      ? hasTeachingDetails(staffProfile)
      : hasNonTeachingDetails(staffProfile);

    res.status(200).json({
      message: "Staff details saved successfully",
      staff,
      staff_profile: staffProfile,
      has_staff_details: hasCoreStaffDetails(staff) || hasProfileDetails,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: messages });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

