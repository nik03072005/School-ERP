import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";

// Models
import User from "../models/User.js";
import Role from "../models/Role.js";
import Staff from "../models/Staff.js";
import TeachingProfile from "../models/TeachingProfile.js";
import NonTeachingProfile from "../models/NonTeachingProfile.js";
import Class from "../models/Class.js";
import Section from "../models/Section.js";
import Student from "../models/Student.js";
import Counter from "../models/Counter.js";
import SchoolPeriod from "../models/SchoolPeriod.js";
import FeeHead from "../models/FeeHead.js";
import FeeStructure from "../models/FeeStructure.js";
import StudentFee from "../models/StudentFee.js";
import Notice from "../models/Notice.js";
import ExamSchedule from "../models/ExamSchedule.js";
import ProgressReport from "../models/ProgressReport.js";
import DailyLogbook from "../models/DailyLogbook.js";
import TimetableEntry from "../models/TimetableEntry.js";
import StudentAttendance from "../models/StudentAttendance.js";
import StaffAttendance from "../models/StaffAttendance.js";
import Subject from "../models/Subject.js";
import Syllabus from "../models/Syllabus.js";
import { CBSE_SUBJECT_PRESETS } from "../utils/cbsePresets.js";

dotenv.config();

// ── Realistic Indian Datasets ──────────────────────────────────────────

const FIRST_NAMES_MALE = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
  "Shaurya", "Atharv", "Advait", "Pranav", "Dhruv", "Kabir", "Aryan", "Rudra", "Ayush", "Om",
  "Rohan", "Ansh", "Dev", "Harsh", "Tanmay", "Samar", "Kunal", "Yash", "Parth", "Varun",
  "Nikhil", "Manan", "Shivam", "Rishi", "Mohit", "Gaurav", "Alok", "Deepak", "Chetan", "Akash",
  "Harshit", "Raghav", "Abhinav", "Chirag", "Naman", "Piyush", "Mayank", "Kartik", "Tushar", "Siddharth",
  "Suresh", "Ramesh", "Dinesh", "Manoj", "Naresh", "Ashok", "Sanjay", "Vinod", "Rajesh", "Mukesh",
  "Sunil", "Anil", "Pankaj", "Vikas", "Amit", "Sumit", "Sachin", "Vishal", "Vijay", "Ajay"
];

const FIRST_NAMES_FEMALE = [
  "Aadhya", "Ananya", "Diya", "Saanvi", "Kiara", "Pari", "Myra", "Riya", "Anika", "Ishita",
  "Kavya", "Avni", "Sneha", "Pooja", "Neha", "Tanvi", "Shreya", "Anjali", "Meera", "Riddhi",
  "Siddhi", "Priya", "Aditi", "Sanya", "Navya", "Swati", "Divya", "Mansi", "Khushi", "Simran",
  "Bhavna", "Payal", "Komal", "Nidhi", "Garima", "Ritu", "Shilpa", "Pragati", "Sakshi", "Archana",
  "Jyoti", "Sonam", "Aarti", "Deepa", "Meenakshi", "Sunita", "Radhika", "Vandana", "Preeti", "Suman",
  "Kiran", "Rekha", "Anita", "Geeta", "Shobha", "Seema", "Manju", "Pushpa", "Sarita", "Usha"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Patel", "Singh", "Iyer", "Joshi", "Yadav", "Mishra", "Nair",
  "Banerjee", "Chatterjee", "Rao", "Reddy", "Kulkarni", "Deshmukh", "Chauhan", "Agarwal", "Saxena", "Pandey",
  "Tiwari", "Tripathi", "Dubey", "Shukla", "Bhatia", "Kapoor", "Malhotra", "Khanna", "Mehta", "Shah",
  "Jain", "Goyal", "Bansal", "Choudhary", "Thakur", "Rajput", "Sen", "Ghosh", "Das", "Roy",
  "Kumar", "Prasad", "Srivastava", "Jha", "Gautam", "Chawla", "Bhardwaj", "Bhatt", "Bhattacharya", "Sinha"
];

const INDIAN_CITIES = [
  { city: "Lucknow", state: "Uttar Pradesh", zip: "226001", localities: ["Gomti Nagar", "Aliganj", "Indira Nagar", "Hazratganj", "Mahanagar"] },
  { city: "Kanpur", state: "Uttar Pradesh", zip: "208001", localities: ["Civil Lines", "Swaroop Nagar", "Kakadeo", "Kalyanpur", "Shastri Nagar"] },
  { city: "Varanasi", state: "Uttar Pradesh", zip: "221001", localities: ["Sigra", "Lanka", "Bhelupur", "Orderly Bazar", "Shivpur"] },
  { city: "Prayagraj", state: "Uttar Pradesh", zip: "211001", localities: ["Civil Lines", "George Town", "Katra", "Tagore Town", "Naini"] },
  { city: "New Delhi", state: "Delhi", zip: "110001", localities: ["Rohini", "Dwarka", "Lajpat Nagar", "Janakpuri", "Pitampura"] },
  { city: "Noida", state: "Uttar Pradesh", zip: "201301", localities: ["Sector 15", "Sector 62", "Sector 50", "Sector 18", "Sector 137"] },
  { city: "Jaipur", state: "Rajasthan", zip: "302001", localities: ["Malviya Nagar", "Vaishali Nagar", "Mansarovar", "C-Scheme", "Raja Park"] },
  { city: "Patna", state: "Bihar", zip: "800001", localities: ["Kankarbagh", "Boring Road", "Rajendra Nagar", "Bailey Road", "Danapur"] },
  { city: "Bhopal", state: "Madhya Pradesh", zip: "462001", localities: ["Arera Colony", "MP Nagar", "Kolar Road", "Shahpura", "TT Nagar"] },
  { city: "Indore", state: "Madhya Pradesh", zip: "452001", localities: ["Vijay Nagar", "Palasia", "Saket Nagar", "Annapurna", "Bhawarkua"] }
];

const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];
const BANKS = [
  "State Bank of India",
  "Punjab National Bank",
  "HDFC Bank",
  "ICICI Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "Axis Bank",
  "Kotak Mahindra Bank"
];

const TEACHING_SPECIALTIES = [
  { designation: "PGT - Mathematics", dept: "Mathematics", subject: "Mathematics", qual: "M.Sc Mathematics, B.Ed", classes: ["9", "10", "11", "12"] },
  { designation: "PGT - Physics", dept: "Science", subject: "Physics", qual: "M.Sc Physics, B.Ed", classes: ["11", "12"] },
  { designation: "PGT - Chemistry", dept: "Science", subject: "Chemistry", qual: "M.Sc Chemistry, B.Ed", classes: ["11", "12"] },
  { designation: "PGT - Biology", dept: "Science", subject: "Biology", qual: "M.Sc Botany/Zoology, B.Ed", classes: ["11", "12"] },
  { designation: "PGT - Computer Science", dept: "Computer Science", subject: "Computer Science", qual: "MCA / B.Tech CSE", classes: ["9", "10", "11", "12"] },
  { designation: "PGT - English Core", dept: "English", subject: "English", qual: "M.A. English Literature, B.Ed", classes: ["11", "12"] },
  { designation: "PGT - Commerce & Accounts", dept: "Commerce", subject: "Accountancy", qual: "M.Com, B.Ed", classes: ["11", "12"] },
  { designation: "PGT - Economics", dept: "Commerce", subject: "Economics", qual: "M.A. Economics, B.Ed", classes: ["9", "10", "11", "12"] },
  { designation: "PGT - Hindi Literature", dept: "Hindi", subject: "Hindi", qual: "M.A. Hindi, B.Ed", classes: ["9", "10", "11", "12"] },
  { designation: "PGT - History & Civics", dept: "Social Science", subject: "History", qual: "M.A. History, B.Ed", classes: ["9", "10", "11", "12"] },
  { designation: "TGT - Mathematics", dept: "Mathematics", subject: "Mathematics", qual: "B.Sc, B.Ed", classes: ["6", "7", "8"] },
  { designation: "TGT - Science", dept: "Science", subject: "Science", qual: "B.Sc (PCM/ZBC), B.Ed", classes: ["6", "7", "8"] },
  { designation: "TGT - English", dept: "English", subject: "English", qual: "B.A. English, B.Ed", classes: ["6", "7", "8"] },
  { designation: "TGT - Social Studies", dept: "Social Science", subject: "Social Studies", qual: "B.A., B.Ed", classes: ["6", "7", "8"] },
  { designation: "TGT - Hindi", dept: "Hindi", subject: "Hindi", qual: "B.A. Hindi, B.Ed", classes: ["6", "7", "8"] },
  { designation: "TGT - Sanskrit", dept: "Languages", subject: "Sanskrit", qual: "B.A. Sanskrit, B.Ed", classes: ["6", "7", "8"] },
  { designation: "TGT - Information Technology", dept: "Computer Science", subject: "Computer Science", qual: "BCA / B.Sc IT", classes: ["6", "7", "8"] },
  { designation: "PRT - Primary Head Teacher", dept: "Primary Wing", subject: "All Primary Subjects", qual: "B.A., D.El.Ed / B.Ed", classes: ["3", "4", "5"] },
  { designation: "PRT - Mathematics", dept: "Primary Wing", subject: "Mathematics", qual: "B.Sc, B.Ed", classes: ["3", "4", "5"] },
  { designation: "PRT - English", dept: "Primary Wing", subject: "English", qual: "B.A. English, B.Ed", classes: ["3", "4", "5"] },
  { designation: "PRT - Environmental Studies (EVS)", dept: "Primary Wing", subject: "EVS", qual: "B.Sc, D.El.Ed", classes: ["1", "2", "3", "4", "5"] },
  { designation: "PRT - Hindi", dept: "Primary Wing", subject: "Hindi", qual: "B.A. Hindi, B.Ed", classes: ["1", "2", "3", "4", "5"] },
  { designation: "PRT - Junior Foundation", dept: "Primary Wing", subject: "Foundational Literacy & Numeracy", qual: "NTT / D.El.Ed", classes: ["1", "2"] },
  { designation: "Physical Education Teacher (PET)", dept: "Sports & Physical Education", subject: "Physical Education", qual: "M.P.Ed / B.P.Ed", classes: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] },
  { designation: "Art & Craft Instructor", dept: "Arts & Culture", subject: "Visual Arts", qual: "BFA / MFA", classes: ["1", "2", "3", "4", "5", "6", "7", "8"] },
  { designation: "Music & Performing Arts", dept: "Arts & Culture", subject: "Music", qual: "Sangeet Visharad / M.Mus", classes: ["1", "2", "3", "4", "5", "6", "7", "8"] }
];

const NON_TEACHING_ROLES = [
  { designation: "Senior Accountant", dept: "Finance & Accounts", job_category: "Finance", shift: "General (9 AM - 5 PM)", perms: ["fee_collection", "payroll", "ledgers"] },
  { designation: "Assistant Accountant", dept: "Finance & Accounts", job_category: "Finance", shift: "General (9 AM - 5 PM)", perms: ["fee_counter", "receipts"] },
  { designation: "Head Librarian", dept: "Library", job_category: "Administrative", shift: "Morning (8 AM - 4 PM)", perms: ["book_issue", "library_catalog"] },
  { designation: "Assistant Librarian", dept: "Library", job_category: "Support", shift: "Morning (8 AM - 4 PM)", perms: ["book_return", "shelf_management"] },
  { designation: "Senior Lab Assistant - Physics", dept: "Science Labs", job_category: "Technical", shift: "Morning (8 AM - 4 PM)", perms: ["lab_inventory", "apparatus_setup"] },
  { designation: "Senior Lab Assistant - Chemistry", dept: "Science Labs", job_category: "Technical", shift: "Morning (8 AM - 4 PM)", perms: ["chemical_store", "safety_inspection"] },
  { designation: "Lab Assistant - Biology", dept: "Science Labs", job_category: "Technical", shift: "Morning (8 AM - 4 PM)", perms: ["specimen_handling", "microscope_maintenance"] },
  { designation: "Computer Lab Network Administrator", dept: "IT & Systems", job_category: "Technical", shift: "General (9 AM - 5 PM)", perms: ["lan_management", "lab_access"] },
  { designation: "Hardware & Systems Technician", dept: "IT & Systems", job_category: "Technical", shift: "Morning (8 AM - 4 PM)", perms: ["hardware_repair", "projector_maintenance"] },
  { designation: "Administrative Officer", dept: "Administration", job_category: "Administrative", shift: "General (9 AM - 5 PM)", perms: ["general_admin", "staff_attendance"] },
  { designation: "Senior Front Desk Executive", dept: "Front Desk & Reception", job_category: "Administrative", shift: "Morning (8 AM - 4 PM)", perms: ["visitor_log", "enquiry_management"] },
  { designation: "Admission Counselor", dept: "Admissions", job_category: "Administrative", shift: "General (9 AM - 5 PM)", perms: ["enquiry_followup", "form_verification"] },
  { designation: "School Nurse & Medical In-charge", dept: "Infirmary", job_category: "Medical", shift: "Morning (8 AM - 4 PM)", perms: ["first_aid", "health_records"] },
  { designation: "Transport Supervisor", dept: "Transport", job_category: "Operations", shift: "Split (7 AM - 10 AM, 1 PM - 5 PM)", perms: ["bus_routes", "gps_tracking"] },
  { designation: "Fleet Maintenance Coordinator", dept: "Transport", job_category: "Operations", shift: "Morning (8 AM - 4 PM)", perms: ["bus_fitness", "fuel_audit"] },
  { designation: "Store & Inventory Manager", dept: "Stores & Purchase", job_category: "Administrative", shift: "General (9 AM - 5 PM)", perms: ["stock_entry", "uniform_books_issue"] },
  { designation: "Estate & Facilities Supervisor", dept: "Maintenance", job_category: "Maintenance", shift: "Morning (7 AM - 3 PM)", perms: ["campus_inspection", "cleanliness_audit"] },
  { designation: "Senior Electrician & DG Operator", dept: "Maintenance", job_category: "Maintenance", shift: "Morning (8 AM - 4 PM)", perms: ["power_backup", "electrical_maintenance"] },
  { designation: "Security Head / Chief Warden", dept: "Campus Security", job_category: "Security", shift: "Rotational (24x7)", perms: ["gate_security", "cctv_monitoring"] },
  { designation: "Office Assistant / Dispatch Clerk", dept: "Administration", job_category: "Support", shift: "Morning (8 AM - 4 PM)", perms: ["postal_dispatch", "document_filing"] }
];

// Helper to pick random item
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad = (num, size) => String(num).padStart(size, "0");

const generateIndianMobile = (seed) => {
  const prefixes = ["98", "97", "99", "94", "88", "89", "70", "79", "80", "91"];
  const prefix = prefixes[seed % prefixes.length];
  const rest = String((10000000 + (seed * 47) % 90000000)).slice(0, 8);
  return `${prefix}${rest}`;
};

const generateAadhaar = (seed) => {
  const p1 = String(2000 + (seed * 17) % 8000);
  const p2 = String(3000 + (seed * 31) % 7000);
  const p3 = String(4000 + (seed * 53) % 6000);
  return `${p1}${p2}${p3}`;
};

const generateDOBForGrade = (gradeLevel) => {
  const currentYear = 2026;
  const age = 5 + gradeLevel; // Class 1 = ~6 yrs old (born 2020), Class 12 = ~17 yrs old (born 2009)
  const birthYear = currentYear - age;
  const birthMonth = pad(randInt(1, 12), 2);
  const birthDay = pad(randInt(1, 28), 2);
  return `${birthDay}/${birthMonth}/${birthYear}`;
};

// ── Master Seed Function ──────────────────────────────────────────────

export async function seedIndianDemoData() {
  console.log("==========================================================");
  console.log("   SEEDING INDIAN SCHOOL ERP DATABASE WITH REALISTIC DATA ");
  console.log("==========================================================");

  await connectDB();

  // 1. Roles
  const roles = await Role.find({});
  const roleMap = {};
  for (const r of roles) roleMap[r.name] = r._id;

  if (!roleMap.admin || !roleMap.teaching_staff || !roleMap.non_teaching_staff || !roleMap.student) {
    console.error("Missing standard roles! Please run initial role seeding first.");
    process.exit(1);
  }

  // 2. Identify Super Admin to preserve
  const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL || "admin@school.com" });
  const adminId = adminUser?._id;
  console.log(`Preserving Super Admin: ${adminUser?.email || "admin@school.com"} (${adminId || "created fresh"})`);

  // 3. Clean slate for demo entities (keeping admin user only)
  console.log("Cleaning existing non-admin data...");
  const adminFilter = adminId ? { _id: { $ne: adminId } } : {};
  await User.deleteMany(adminFilter);
  await Staff.deleteMany({});
  await TeachingProfile.deleteMany({});
  await NonTeachingProfile.deleteMany({});
  await Class.deleteMany({});
  await Section.deleteMany({});
  await Student.deleteMany({});
  await SchoolPeriod.deleteMany({});
  await FeeHead.deleteMany({});
  await FeeStructure.deleteMany({});
  await StudentFee.deleteMany({});
  await Notice.deleteMany({});
  await ExamSchedule.deleteMany({});
  await ProgressReport.deleteMany({});
  await DailyLogbook.deleteMany({});
  await TimetableEntry.deleteMany({});
  await StudentAttendance.deleteMany({});
  await StaffAttendance.deleteMany({});
  await Subject.deleteMany({});
  await Syllabus.deleteMany({});

  // Reset counters
  await Counter.deleteMany({});
  await Counter.create([
    { key: "employee_code_teaching_staff", seq: 50 },
    { key: "employee_code_non_teaching_staff", seq: 20 }
  ]);

  // Ensure Admin exists if missing
  let currentAdminId = adminId;
  if (!currentAdminId) {
    const adminHashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin@123", 10);
    const newAdmin = await User.create({
      role_id: roleMap.admin,
      first_name: "Super",
      last_name: "Admin",
      email: process.env.ADMIN_EMAIL || "admin@school.com",
      password: adminHashedPassword,
      mobile: process.env.ADMIN_MOBILE || "9999999999",
      is_active: true,
      status: "approved",
      profile_completed: true,
      created_by: null
    });
    currentAdminId = newAdmin._id;
    console.log("Created fresh Super Admin user.");
  }

  // 4. Precompute Passwords for maximum speed
  console.log("Precomputing bcrypt password hashes for fast batch insertion...");
  const teacherPasswordHash = await bcrypt.hash("Teacher@123", 10);
  const staffPasswordHash = await bcrypt.hash("Staff@123", 10);
  const studentPasswordHash = await bcrypt.hash("Student@123", 10);

  // 5. Create 50 Teaching Staff
  console.log("Creating 50 Teaching Staff users and profiles...");
  const teacherUsersData = [];
  const teacherProfilesData = [];
  const teacherStaffData = [];

  for (let i = 1; i <= 50; i++) {
    const isMale = i % 2 !== 0;
    const firstName = isMale ? FIRST_NAMES_MALE[(i * 3) % FIRST_NAMES_MALE.length] : FIRST_NAMES_FEMALE[(i * 3) % FIRST_NAMES_FEMALE.length];
    const lastName = LAST_NAMES[(i * 5) % LAST_NAMES.length];
    const email = i === 1 ? "teacher@school.com" : `teacher.${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@school.com`;
    const spec = TEACHING_SPECIALTIES[(i - 1) % TEACHING_SPECIALTIES.length];
    const location = INDIAN_CITIES[i % INDIAN_CITIES.length];

    const userId = new mongoose.Types.ObjectId();
    const staffId = new mongoose.Types.ObjectId();

    teacherUsersData.push({
      _id: userId,
      role_id: roleMap.teaching_staff,
      first_name: firstName,
      last_name: lastName,
      email,
      password: teacherPasswordHash,
      mobile: generateIndianMobile(5000 + i),
      avatar: null,
      is_active: true,
      status: "approved",
      profile_completed: true,
      created_by: currentAdminId
    });

    teacherStaffData.push({
      _id: staffId,
      user_id: userId,
      employee_code: `TCH-${pad(i, 4)}`,
      designation: spec.designation,
      department: spec.dept,
      joining_date: new Date(2021 + (i % 4), (i % 12), 1),
      basic_salary: 32000 + (i % 25) * 1500,
      bank_account_no: `SBI${pad(1000000000 + i * 8371, 11)}`,
      bank_name: BANKS[i % BANKS.length],
      staff_type: "teaching_staff",
      date_of_birth: new Date(1982 + (i % 15), (i % 12), (i % 25) + 1),
      is_active: true
    });

    teacherProfilesData.push({
      staff_id: staffId,
      qualification: spec.qual,
      experience_years: 3 + (i % 18),
      subjects: [spec.subject],
      classes_assigned: spec.classes,
      employee_notes: `Certified Indian Educator, specialist in ${spec.subject} CBSE syllabus.`
    });
  }

  await User.insertMany(teacherUsersData);
  await Staff.insertMany(teacherStaffData);
  await TeachingProfile.insertMany(teacherProfilesData);
  console.log("50 Teaching Staff created successfully.");

  // 6. Create 20 Non-Teaching Staff
  console.log("Creating 20 Non-Teaching Staff users and profiles...");
  const nonTeachingUsersData = [];
  const nonTeachingStaffData = [];
  const nonTeachingProfilesData = [];

  for (let i = 1; i <= 20; i++) {
    const isMale = i % 2 !== 0;
    const firstName = isMale ? FIRST_NAMES_MALE[(100 + i * 7) % FIRST_NAMES_MALE.length] : FIRST_NAMES_FEMALE[(100 + i * 7) % FIRST_NAMES_FEMALE.length];
    const lastName = LAST_NAMES[(200 + i * 9) % LAST_NAMES.length];
    const roleInfo = NON_TEACHING_ROLES[i - 1];
    const email = i === 1 ? "staff@school.com" : `staff.${roleInfo.job_category.toLowerCase()}${i}@school.com`;

    const userId = new mongoose.Types.ObjectId();
    const staffId = new mongoose.Types.ObjectId();

    nonTeachingUsersData.push({
      _id: userId,
      role_id: roleMap.non_teaching_staff,
      first_name: firstName,
      last_name: lastName,
      email,
      password: staffPasswordHash,
      mobile: generateIndianMobile(8000 + i),
      avatar: null,
      is_active: true,
      status: "approved",
      profile_completed: true,
      created_by: currentAdminId
    });

    nonTeachingStaffData.push({
      _id: staffId,
      user_id: userId,
      employee_code: `NTS-${pad(i, 4)}`,
      designation: roleInfo.designation,
      department: roleInfo.dept,
      joining_date: new Date(2022 + (i % 3), (i % 12), 15),
      basic_salary: 18000 + (i % 15) * 1200,
      bank_account_no: `PNB${pad(2000000000 + i * 6491, 11)}`,
      bank_name: BANKS[(i + 3) % BANKS.length],
      staff_type: "non_teaching_staff",
      date_of_birth: new Date(1985 + (i % 14), (i % 12), (i % 25) + 1),
      is_active: true
    });

    nonTeachingProfilesData.push({
      staff_id: staffId,
      job_category: roleInfo.job_category,
      shift: roleInfo.shift,
      reporting_manager: "Administrative Officer",
      operational_permissions: roleInfo.perms,
      employee_notes: `Permanent non-teaching staff in ${roleInfo.dept}.`
    });
  }

  await User.insertMany(nonTeachingUsersData);
  await Staff.insertMany(nonTeachingStaffData);
  await NonTeachingProfile.insertMany(nonTeachingProfilesData);
  console.log("20 Non-Teaching Staff created successfully.");

  // 7. Create 12 Classes (Class 1 to Class 12)
  console.log("Creating 12 Classes (Class 1 to Class 12)...");
  const classDocs = [];
  for (let grade = 1; grade <= 12; grade++) {
    classDocs.push({
      _id: new mongoose.Types.ObjectId(),
      name: `Class ${grade}`,
      grade_level: grade,
      capacity: 240, // 4 sections * 60 students
      is_active: true
    });
  }
  await Class.insertMany(classDocs);
  console.log("12 Classes created successfully.");

  // 8. Create 48 Sections (4 sections: A, B, C, D per class)
  // Assign first 48 teachers as Class Teachers
  console.log("Creating 48 Sections (A, B, C, D) with 48 assigned Class Teachers...");
  const sectionDocs = [];
  const sectionNames = ["A", "B", "C", "D"];
  let teacherIndex = 0;

  for (let c = 0; c < classDocs.length; c++) {
    const classDoc = classDocs[c];
    for (let s = 0; s < sectionNames.length; s++) {
      const classTeacherUserId = teacherUsersData[teacherIndex]._id;
      teacherIndex++;

      sectionDocs.push({
        _id: new mongoose.Types.ObjectId(),
        class_id: classDoc._id,
        name: sectionNames[s],
        class_teacher_user_id: classTeacherUserId,
        is_active: true
      });
    }
  }
  await Section.insertMany(sectionDocs);
  console.log("48 Sections created and linked with Class Teachers.");

  // 9. Create 2,880 Students (60 students per section * 48 sections)
  console.log("Creating 2,880 Students (60 per section) with full Indian demographics...");

  const studentUsers = [];
  const studentProfiles = [];
  let globalStudentSeq = 1;

  for (let sIdx = 0; sIdx < sectionDocs.length; sIdx++) {
    const sectionDoc = sectionDocs[sIdx];
    const classDoc = classDocs.find((c) => c._id.equals(sectionDoc.class_id));
    const gradeLevel = classDoc.grade_level;

    for (let roll = 1; roll <= 60; roll++) {
      const isMale = (roll % 2 !== 0);
      const fnSeed = (globalStudentSeq * 13) % (isMale ? FIRST_NAMES_MALE.length : FIRST_NAMES_FEMALE.length);
      const lnSeed = (globalStudentSeq * 17) % LAST_NAMES.length;
      const firstName = isMale ? FIRST_NAMES_MALE[fnSeed] : FIRST_NAMES_FEMALE[fnSeed];
      const lastName = LAST_NAMES[lnSeed];
      const cityData = INDIAN_CITIES[globalStudentSeq % INDIAN_CITIES.length];
      const locality = cityData.localities[globalStudentSeq % cityData.localities.length];

      const fatherName = `${pick(FIRST_NAMES_MALE)} ${lastName}`;
      const motherName = `${pick(FIRST_NAMES_FEMALE)} ${lastName}`;
      const guardianPhone = generateIndianMobile(100000 + globalStudentSeq);

      const rollNumber = `CLASS${gradeLevel}-${sectionDoc.name}-${pad(roll, 3)}`;
      const admissionNo = `ADM-2026-${pad(globalStudentSeq, 4)}`;
      const studentEmail = globalStudentSeq === 1 ? "student@school.com" : `student.${firstName.toLowerCase()}.${lastName.toLowerCase()}${globalStudentSeq}@student.school.com`;

      const sUserId = new mongoose.Types.ObjectId();
      const sProfileId = new mongoose.Types.ObjectId();

      studentUsers.push({
        _id: sUserId,
        role_id: roleMap.student,
        first_name: firstName,
        last_name: lastName,
        email: studentEmail,
        password: studentPasswordHash,
        mobile: guardianPhone,
        avatar: null,
        is_active: true,
        status: "approved",
        profile_completed: true,
        created_by: currentAdminId
      });

      studentProfiles.push({
        _id: sProfileId,
        user_id: sUserId,
        class_id: classDoc._id,
        section_id: sectionDoc._id,
        admission_no: admissionNo,
        roll_no: rollNumber,
        admission_date: new Date(2026, 3, 1),
        gender: isMale ? "male" : "female",
        date_of_birth: generateDOBForGrade(gradeLevel),
        class_applying: `Class ${gradeLevel}`,
        blood_group: pick(BLOOD_GROUPS),
        aadhar_number: generateAadhaar(globalStudentSeq),
        address: `${randInt(1, 250)}, ${locality}`,
        city: cityData.city,
        state: cityData.state,
        zip_code: cityData.zip,
        previous_school: gradeLevel > 1 ? `${cityData.city} Public School` : "Little Angels Playway",
        transport_required: roll % 3 === 0,
        pickup_drop_address: roll % 3 === 0 ? `${locality}, ${cityData.city}` : "",
        primary_guardian_name: fatherName,
        primary_guardian_relationship: "father",
        primary_guardian_phone: guardianPhone,
        primary_guardian_email: `parent.${globalStudentSeq}@gmail.com`,
        primary_guardian_address: `${locality}, ${cityData.city}`,
        secondary_guardian_name: motherName,
        secondary_guardian_relationship: "mother",
        secondary_guardian_phone: generateIndianMobile(200000 + globalStudentSeq),
        secondary_guardian_email: `mother.${globalStudentSeq}@gmail.com`,
        emergency_contact_name: fatherName,
        emergency_contact_relationship: "father",
        emergency_contact_phone: guardianPhone,
        has_allergies: roll % 15 === 0,
        allergies_list: roll % 15 === 0 ? "Peanuts / Dust" : "",
        has_medical_conditions: false,
        medical_conditions: "",
        physician_name: `Dr. ${pick(FIRST_NAMES_MALE)} ${pick(LAST_NAMES)}`,
        physician_phone: generateIndianMobile(300000 + globalStudentSeq),
        health_insurance_provider: "Star Health Insurance",
        policy_number: `POL-SH-${pad(globalStudentSeq, 6)}`,
        docs_birth_certificate: true,
        docs_vaccination_card: true,
        docs_aadhar_card: true,
        docs_address_proof: true,
        docs_photograph: true,
        father_name: fatherName,
        mother_name: motherName,
        guardian_mobile: guardianPhone,
        admission_status: "approved",
        admission_submitted_at: new Date(2026, 2, randInt(1, 28))
      });

      globalStudentSeq++;
    }
  }

  // 10. Add 5 Pending Admission applicants to showcase applicant review workflow
  console.log("Adding 5 Pending Admission candidates for demoing applicant review workflows...");
  for (let p = 1; p <= 5; p++) {
    const isMale = p % 2 === 0;
    const firstName = isMale ? FIRST_NAMES_MALE[p + 10] : FIRST_NAMES_FEMALE[p + 10];
    const lastName = LAST_NAMES[p + 20];
    const cityData = INDIAN_CITIES[p];
    const locality = cityData.localities[0];
    const phone = generateIndianMobile(990000 + p);

    const pUserId = new mongoose.Types.ObjectId();
    studentUsers.push({
      _id: pUserId,
      role_id: roleMap.student,
      first_name: firstName,
      last_name: lastName,
      email: `applicant.${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.com`,
      password: studentPasswordHash,
      mobile: phone,
      avatar: null,
      is_active: true,
      status: "pending",
      profile_completed: false,
      created_by: currentAdminId
    });

    studentProfiles.push({
      _id: new mongoose.Types.ObjectId(),
      user_id: pUserId,
      class_id: classDocs[p % 6]._id,
      section_id: null,
      admission_no: `ADM-2026-PENDING-${p}`,
      admission_date: new Date(),
      gender: isMale ? "male" : "female",
      date_of_birth: generateDOBForGrade(p),
      class_applying: `Class ${p}`,
      blood_group: pick(BLOOD_GROUPS),
      aadhar_number: generateAadhaar(990000 + p),
      address: `${randInt(1, 100)}, ${locality}`,
      city: cityData.city,
      state: cityData.state,
      zip_code: cityData.zip,
      previous_school: "St. Xavier's Junior School",
      transport_required: true,
      pickup_drop_address: `${locality}, ${cityData.city}`,
      primary_guardian_name: `${pick(FIRST_NAMES_MALE)} ${lastName}`,
      primary_guardian_relationship: "father",
      primary_guardian_phone: phone,
      primary_guardian_email: `applicant.parent${p}@gmail.com`,
      primary_guardian_address: `${locality}, ${cityData.city}`,
      secondary_guardian_name: `${pick(FIRST_NAMES_FEMALE)} ${lastName}`,
      secondary_guardian_relationship: "mother",
      emergency_contact_name: `${pick(FIRST_NAMES_MALE)} ${lastName}`,
      emergency_contact_relationship: "father",
      emergency_contact_phone: phone,
      docs_birth_certificate: true,
      docs_vaccination_card: true,
      docs_aadhar_card: true,
      docs_address_proof: true,
      docs_photograph: true,
      admission_status: "pending",
      admission_submitted_at: new Date()
    });
  }

  // Insert students in batches of 500
  console.log(`Inserting ${studentUsers.length} student users and profiles in batches...`);
  const batchSize = 500;
  for (let i = 0; i < studentUsers.length; i += batchSize) {
    await User.insertMany(studentUsers.slice(i, i + batchSize));
    await Student.insertMany(studentProfiles.slice(i, i + batchSize));
    process.stdout.write(`Processed ${Math.min(i + batchSize, studentUsers.length)}/${studentUsers.length} students...\r`);
  }
  console.log("\nAll students and applicants inserted successfully!");

  // 11. School Periods (8 Periods + Lunch Break)
  console.log("Creating School Periods (1 to 8 + Break)...");
  const schoolPeriods = [
    { name: "Period 1", period_number: 1, start_time: "08:00", end_time: "08:45", is_break: false, is_active: true },
    { name: "Period 2", period_number: 2, start_time: "08:45", end_time: "09:30", is_break: false, is_active: true },
    { name: "Period 3", period_number: 3, start_time: "09:30", end_time: "10:15", is_break: false, is_active: true },
    { name: "Morning Break", period_number: 4, start_time: "10:15", end_time: "10:40", is_break: true, is_active: true },
    { name: "Period 4", period_number: 5, start_time: "10:40", end_time: "11:25", is_break: false, is_active: true },
    { name: "Period 5", period_number: 6, start_time: "11:25", end_time: "12:10", is_break: false, is_active: true },
    { name: "Period 6", period_number: 7, start_time: "12:10", end_time: "12:55", is_break: false, is_active: true },
    { name: "Period 7", period_number: 8, start_time: "12:55", end_time: "01:40", is_break: false, is_active: true }
  ];
  const insertedPeriods = await SchoolPeriod.insertMany(schoolPeriods);
  console.log("8 School periods created.");

  // 12. Fee Heads & Fee Structures
  console.log("Creating Fee Heads & Annual Fee Structures for Classes 1 to 12...");
  const feeHeadsData = [
    { name: "Tuition Fee", code: "TUTION", description: "Quarterly Academic Tuition Fee", is_refundable: false, is_active: true, created_by: currentAdminId },
    { name: "Annual Development Fee", code: "DEV", description: "School Infrastructure & Campus Development", is_refundable: false, is_active: true, created_by: currentAdminId },
    { name: "Science & Computer Lab Fee", code: "LAB", description: "Laboratory consumables and practical setup", is_refundable: false, is_active: true, created_by: currentAdminId },
    { name: "Library & Learning Resource", code: "LIB", description: "Library books, journal access, digital resources", is_refundable: false, is_active: true, created_by: currentAdminId },
    { name: "Examination & Assessment Fee", code: "EXAM", description: "CBSE & internal semester exams, test series", is_refundable: false, is_active: true, created_by: currentAdminId },
    { name: "Sports & Extra-Curricular Activity", code: "SPORTS", description: "Sports equipment, coaching, cultural events", is_refundable: false, is_active: true, created_by: currentAdminId }
  ];
  const insertedFeeHeads = await FeeHead.insertMany(feeHeadsData);

  const headMap = {};
  insertedFeeHeads.forEach((h) => { headMap[h.code] = h._id; });

  const feeStructuresData = [];
  for (const c of classDocs) {
    const grade = c.grade_level;
    const baseTuition = 20000 + (grade * 1500);
    const devFee = 8000;
    const labFee = grade >= 6 ? 4000 + (grade * 500) : 1500;
    const libFee = 2000;
    const examFee = 3000;
    const sportsFee = 2500;

    const components = [
      { fee_head_id: headMap.TUTION, amount: baseTuition, frequency: "term" },
      { fee_head_id: headMap.DEV, amount: devFee, frequency: "annual" },
      { fee_head_id: headMap.LAB, amount: labFee, frequency: "annual" },
      { fee_head_id: headMap.LIB, amount: libFee, frequency: "annual" },
      { fee_head_id: headMap.EXAM, amount: examFee, frequency: "term" },
      { fee_head_id: headMap.SPORTS, amount: sportsFee, frequency: "annual" }
    ];

    const totalAnnual = components.reduce((acc, comp) => acc + comp.amount, 0);

    feeStructuresData.push({
      academic_year: "2026-2027",
      class_id: c._id,
      section_id: null,
      components,
      installments: [
        { name: "Quarter 1 (April - June)", due_date: new Date(2026, 3, 15), percentage: 35 },
        { name: "Quarter 2 (July - Sept)", due_date: new Date(2026, 6, 15), percentage: 25 },
        { name: "Quarter 3 (Oct - Dec)", due_date: new Date(2026, 9, 15), percentage: 20 },
        { name: "Quarter 4 (Jan - March)", due_date: new Date(2027, 0, 15), percentage: 20 }
      ],
      late_fee_policy: {
        enabled: true,
        grace_days: 10,
        penalty_type: "flat",
        penalty_value: 100,
        penalty_frequency: "once",
        max_penalty: 500
      },
      total_annual_amount: totalAnnual,
      status: "active",
      created_by: currentAdminId
    });
  }
  const insertedFeeStructures = await FeeStructure.insertMany(feeStructuresData);
  console.log("12 Fee Structures created.");

  // 13. Student Fee records for students
  console.log("Generating Student Fee accounts with realistic payment statuses...");
  const feeMapByClass = {};
  insertedFeeStructures.forEach((fs) => { feeMapByClass[String(fs.class_id)] = fs; });

  const studentFeeDocs = [];
  // Sample student fees for the 2,880 active students
  for (let idx = 0; idx < 2880; idx++) {
    const sProfile = studentProfiles[idx];
    const fs = feeMapByClass[String(sProfile.class_id)];
    if (!fs) continue;

    const gross = fs.total_annual_amount;
    const hasDiscount = idx % 20 === 0; // 5% students have scholarships / sibling discount
    const discountAmount = hasDiscount ? Math.round(gross * 0.15) : 0;
    const net = gross - discountAmount;

    // Status: 65% paid full Q1, 20% partial, 15% pending
    const statusRoll = idx % 10;
    let totalPaid = 0;
    let feeStatus = "pending";

    const q1Amount = Math.round(net * 0.35);
    const q2Amount = Math.round(net * 0.25);
    const q3Amount = Math.round(net * 0.20);
    const q4Amount = Math.round(net * 0.20);

    const installments = [
      {
        name: "Quarter 1 (April - June)",
        due_date: new Date(2026, 3, 15),
        amount_due: q1Amount,
        amount_paid: 0,
        late_fee_applied: 0,
        status: "pending",
        paid_date: null
      },
      {
        name: "Quarter 2 (July - Sept)",
        due_date: new Date(2026, 6, 15),
        amount_due: q2Amount,
        amount_paid: 0,
        late_fee_applied: 0,
        status: "pending",
        paid_date: null
      },
      {
        name: "Quarter 3 (Oct - Dec)",
        due_date: new Date(2026, 9, 15),
        amount_due: q3Amount,
        amount_paid: 0,
        late_fee_applied: 0,
        status: "pending",
        paid_date: null
      },
      {
        name: "Quarter 4 (Jan - March)",
        due_date: new Date(2027, 0, 15),
        amount_due: q4Amount,
        amount_paid: 0,
        late_fee_applied: 0,
        status: "pending",
        paid_date: null
      }
    ];

    if (statusRoll < 6) {
      // Paid Q1
      installments[0].amount_paid = q1Amount;
      installments[0].status = "paid";
      installments[0].paid_date = new Date(2026, 3, 10);
      totalPaid = q1Amount;
      feeStatus = "partial";
    } else if (statusRoll < 8) {
      // Partial on Q1
      const part = Math.round(q1Amount * 0.5);
      installments[0].amount_paid = part;
      installments[0].status = "partial";
      totalPaid = part;
      feeStatus = "partial";
    } else {
      // Pending / overdue
      installments[0].status = "overdue";
      feeStatus = "overdue";
    }

    studentFeeDocs.push({
      student_id: sProfile._id,
      fee_structure_id: fs._id,
      academic_year: "2026-2027",
      gross_amount: gross,
      total_discount: discountAmount,
      net_payable: net,
      installments,
      total_paid: totalPaid,
      total_due: net - totalPaid,
      status: feeStatus
    });
  }

  for (let i = 0; i < studentFeeDocs.length; i += batchSize) {
    await StudentFee.insertMany(studentFeeDocs.slice(i, i + batchSize));
  }
  console.log("2,880 Student Fee ledgers initialized.");

  // 14. Authentic Indian School Notices
  console.log("Publishing official Institutional Notices...");
  const noticeDocs = [
    {
      title: "CBSE Board Examination 2026-27 Registration & LOC Verification",
      content: "All Class 10 and Class 12 students are hereby notified that verification of List of Candidates (LOC) for CBSE Board Examination 2027 has commenced. Parents and students must verify subject combinations, spelling of candidate name, date of birth, and Aadhaar linkage in the school administrative office before Friday.",
      type: "exam",
      target_audience: "all",
      is_pinned: true,
      is_active: true,
      published_at: new Date(2026, 8, 15),
      created_by: currentAdminId
    },
    {
      title: "Annual Sports Meet 'Khelotsav 2026' - Selection Trials",
      content: "The Annual Inter-House Sports Meet 'Khelotsav 2026' will be organized in November. Selection trials for Athletics (100m, 200m, 400m relay), Cricket, Basketball, Football, Badminton, and Kho-Kho will begin this Monday during sports periods. Interested students must register with their House Masters.",
      type: "event",
      target_audience: "students",
      is_pinned: true,
      is_active: true,
      published_at: new Date(2026, 8, 18),
      created_by: currentAdminId
    },
    {
      title: "Quarterly Parent-Teacher Meeting (PTM) Schedule",
      content: "The second term Parent-Teacher Meeting (PTM) is scheduled for Saturday from 8:30 AM to 12:30 PM. Class teachers and subject teachers will share individual academic performance, attendance records, and notebook assessment. Parents are requested to attend in formal attire along with their wards in complete school uniform.",
      type: "general",
      target_audience: "parents",
      is_pinned: false,
      is_active: true,
      published_at: new Date(2026, 8, 20),
      created_by: currentAdminId
    },
    {
      title: "Fee Reminder - Quarter 2 Installment Due Date",
      content: "This is a gentle reminder to parents that Quarter 2 School Fees for Academic Year 2026-27 is due. Kindly clear the outstanding fee dues through the online ERP Parent Portal or school fee counter by the 15th to avoid late penalty charges.",
      type: "fee",
      target_audience: "parents",
      is_pinned: false,
      is_active: true,
      published_at: new Date(2026, 8, 10),
      created_by: currentAdminId
    },
    {
      title: "National Science Day & Atal Tinkering Lab (ATL) Exhibition",
      content: "Our institution will host the Inter-School Science & Robotics Exhibition showcasing innovative working models designed by students from Class 6 to 12 under Atal Innovation Mission. Esteemed professors from IIT/NIT will preside as jury members.",
      type: "event",
      target_audience: "all",
      is_pinned: false,
      is_active: true,
      published_at: new Date(2026, 8, 5),
      created_by: currentAdminId
    },
    {
      title: "Staff Faculty Meeting: Implementation of NEP 2020 Holistic Progress Cards",
      content: "All teaching staff members are requested to assemble in the Senior Audio-Visual Hall on Friday at 2:30 PM for a workshop on 360-degree multidimensional Holistic Progress Card (HPC) reporting under NEP 2020 guidelines.",
      type: "general",
      target_audience: "staff",
      is_pinned: false,
      is_active: true,
      published_at: new Date(2026, 8, 21),
      created_by: currentAdminId
    },
    {
      title: "Gazetted Holiday Notice: Gandhi Jayanti & Dussehra Break",
      content: "The school will observe holiday on account of Mahatma Gandhi Jayanti and Vijayadashami. Normal classes will resume strictly as per the regular timetable from Monday. Homework assignments are uploaded on the Student Logbook portal.",
      type: "holiday",
      target_audience: "all",
      is_pinned: false,
      is_active: true,
      published_at: new Date(2026, 8, 22),
      created_by: currentAdminId
    }
  ];
  await Notice.insertMany(noticeDocs);
  console.log("7 Institutional Notices published.");

  // 15. Exam Schedules & Sample Progress Reports
  console.log("Setting up Mid-Term & Periodic Assessment Exam Schedules with CBSE Marks...");
  const examSubjectsClass10 = [
    { subject: "English Language & Literature", max_marks: 80, exam_date: new Date(2026, 8, 25) },
    { subject: "Hindi Course-A", max_marks: 80, exam_date: new Date(2026, 8, 27) },
    { subject: "Mathematics (Standard/Basic)", max_marks: 80, exam_date: new Date(2026, 8, 29) },
    { subject: "Science (Theory)", max_marks: 80, exam_date: new Date(2026, 9, 3) },
    { subject: "Social Science", max_marks: 80, exam_date: new Date(2026, 9, 6) },
    { subject: "Information Technology (Code 402)", max_marks: 50, exam_date: new Date(2026, 9, 8) }
  ];

  const class10Doc = classDocs.find((c) => c.grade_level === 10);
  const examScheduleDoc = await ExamSchedule.create({
    name: "Mid-Term Examination 2026-27",
    exam_type: "mid_term",
    class_id: class10Doc._id,
    section_id: null,
    subjects: examSubjectsClass10,
    academic_year: "2026-2027",
    is_published: true,
    created_by: currentAdminId
  });

  // Add Progress Reports for Class 10 Section A students
  const class10SecA = sectionDocs.find((s) => s.class_id.equals(class10Doc._id) && s.name === "A");
  const class10SecAStudents = studentProfiles.filter((s) => s.section_id && s.section_id.equals(class10SecA._id));

  const progressReports = [];
  for (const s of class10SecAStudents) {
    const marksObtainedList = examSubjectsClass10.map((sub) => {
      const marks = randInt(Math.round(sub.max_marks * 0.45), Math.round(sub.max_marks * 0.95));
      const pct = (marks / sub.max_marks) * 100;
      let grade = "C1";
      if (pct >= 90) grade = "A1";
      else if (pct >= 80) grade = "A2";
      else if (pct >= 70) grade = "B1";
      else if (pct >= 60) grade = "B2";
      return {
        subject: sub.subject,
        max_marks: sub.max_marks,
        marks_obtained: marks,
        grade
      };
    });

    const totalMarksObt = marksObtainedList.reduce((sum, m) => sum + m.marks_obtained, 0);
    const totalMax = marksObtainedList.reduce((sum, m) => sum + m.max_marks, 0);
    const pctTotal = Math.round((totalMarksObt / totalMax) * 100 * 10) / 10;
    let overallGrade = "B1";
    if (pctTotal >= 90) overallGrade = "A1";
    else if (pctTotal >= 80) overallGrade = "A2";
    else if (pctTotal >= 70) overallGrade = "B1";
    else if (pctTotal >= 60) overallGrade = "B2";

    progressReports.push({
      student_id: s._id,
      exam_schedule_id: examScheduleDoc._id,
      marks: marksObtainedList,
      total_marks_obtained: totalMarksObt,
      total_max_marks: totalMax,
      percentage: pctTotal,
      overall_grade: overallGrade,
      remarks: pctTotal >= 80 ? "Outstanding conceptual grasp and regular in homework submission." : "Good progress, focus recommended in Science numerical problem solving.",
      is_published: true,
      published_by: currentAdminId,
      published_at: new Date(),
      entered_by: class10SecA.class_teacher_user_id
    });
  }
  await ProgressReport.insertMany(progressReports);
  console.log(`Exam schedule and ${progressReports.length} Progress Reports created for Class 10-A.`);

  // 16. Daily Logbook entries (Classwork & Homework)
  console.log("Generating teacher Daily Logbook records...");
  const sampleLogbooks = [
    {
      class_id: class10Doc._id,
      section_id: class10SecA._id,
      subject: "Mathematics",
      teacher_id: class10SecA.class_teacher_user_id,
      date: new Date(2026, 8, 21),
      classwork: { text: "Chapter 5: Arithmetic Progressions - Explained nth term derivation and solved NCERT Ex 5.2 Q1 to Q10 in class." },
      homework: { text: "Complete NCERT Exercise 5.2 Q11 to Q20 in Homework notebook. Prepare for short formula quiz tomorrow." },
      status: "published"
    },
    {
      class_id: class10Doc._id,
      section_id: class10SecA._id,
      subject: "Science",
      teacher_id: teacherUsersData[1]._id,
      date: new Date(2026, 8, 21),
      classwork: { text: "Light: Reflection and Refraction - Lens formula derivation, sign convention, and ray diagram practice." },
      homework: { text: "Draw ray diagrams for convex lens (all 6 positions) with focal length and center of curvature labels in practical file." },
      status: "published"
    },
    {
      class_id: classDocs[4]._id, // Class 5
      section_id: sectionDocs.find((s) => s.class_id.equals(classDocs[4]._id))._id,
      subject: "English",
      teacher_id: teacherUsersData[4]._id,
      date: new Date(2026, 8, 21),
      classwork: { text: "Unit 4: The Wonderful Words poem recitation, rhyming words identification, and vocabulary discussion." },
      homework: { text: "Write 5 rhyming word pairs and write a short paragraph on 'Words that heal'." },
      status: "published"
    }
  ];
  await DailyLogbook.insertMany(sampleLogbooks);
  console.log("Teacher Logbooks published.");

  // 16b. Central Subject Master & Syllabus Tracker
  console.log("Seeding Central Subject Master & Chapter-wise Syllabus with CBSE codes...");
  let totalSeededSubjects = 0;
  let totalSeededSyllabi = 0;

  for (const c of classDocs) {
    const grade = c.grade_level;
    const matchingPresets = CBSE_SUBJECT_PRESETS.filter((p) => p.grade_range.includes(grade));

    for (const p of matchingPresets) {
      // Find an appropriate teacher from teacherUsersData
      const teacher = teacherUsersData.find((t, tIdx) => {
        const spec = TEACHING_SPECIALTIES[tIdx % TEACHING_SPECIALTIES.length];
        return spec.classes.includes(String(grade)) || spec.subject.toLowerCase().includes(p.name.toLowerCase().slice(0, 4));
      }) || teacherUsersData[0];

      const subDoc = await Subject.create({
        name: p.name,
        code: p.code,
        class_id: c._id,
        board: "CBSE",
        subject_type: p.subject_type,
        split_type: p.split_type,
        theory_marks: p.theory_marks,
        practical_marks: p.practical_marks,
        internal_marks: p.internal_marks,
        total_marks: p.total_marks,
        pass_marks: p.pass_marks,
        periods_per_week: p.periods_per_week,
        assigned_teachers: [teacher._id],
        description: p.description,
        academic_year: "2026-2027",
        is_active: true,
      });
      totalSeededSubjects++;

      // Create Syllabus chapters
      const chapters = (p.default_chapters || []).map((defCh, chIdx) => {
        let status = "not_started";
        let pct = 0;
        let actualPeriods = 0;
        let completedAt = undefined;
        let notes = "";

        // If Class 10 or Class 12, simulate mid-year realistic syllabus completion
        if (grade === 10 || grade === 12) {
          if (chIdx < 4) {
            status = "completed";
            pct = 100;
            actualPeriods = defCh.planned_periods;
            completedAt = new Date(2026, 6 + (chIdx % 2), 15 + chIdx);
            notes = "Completed with unit revision and chapter test.";
          } else if (chIdx === 4) {
            status = "in_progress";
            pct = 65;
            actualPeriods = Math.round(defCh.planned_periods * 0.7);
            notes = "Ongoing discussions and problem solving exercises.";
          }
        }

        return {
          chapter_number: defCh.chapter_number,
          title: defCh.title,
          term: defCh.term || "Term 1",
          planned_periods: defCh.planned_periods || 8,
          actual_periods: actualPeriods,
          status,
          completion_percentage: pct,
          completed_at: completedAt,
          completed_by: status === "completed" ? teacher._id : undefined,
          teacher_notes: notes,
        };
      });

      const syllabus = new Syllabus({
        subject_id: subDoc._id,
        class_id: c._id,
        academic_year: "2026-2027",
        chapters,
      });
      syllabus.recalculateProgress();
      await syllabus.save();
      totalSeededSyllabi++;
    }
  }
  console.log(`Central Subject Master & Syllabus Tracker seeded: ${totalSeededSubjects} Subjects, ${totalSeededSyllabi} Syllabi.`);

  // 16c. Conflict-Free Timetable for All 48 Sections (6 Days x 7 Periods = 2,016 Slots)
  console.log("Generating conflict-free weekly timetable for all 48 sections...");
  const teachingPeriodsOnly = insertedPeriods.filter((p) => !p.is_break);
  const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const timetableDocs = [];

  for (let d = 0; d < WEEK_DAYS.length; d++) {
    const day = WEEK_DAYS[d];

    for (let p = 0; p < teachingPeriodsOnly.length; p++) {
      const period = teachingPeriodsOnly[p];

      for (let s = 0; s < sectionDocs.length; s++) {
        const section = sectionDocs[s];
        const classDoc = classDocs.find((c) => c._id.equals(section.class_id));
        const gradeLevel = classDoc.grade_level;

        // Conflict-free teacher selection
        const teacherOffset = (s + p + 7 * d) % teacherUsersData.length;
        const teacherUserId = teacherUsersData[teacherOffset]._id;

        // Subject selection
        const subjects = gradeLevel <= 5
          ? ["English", "Mathematics", "Hindi", "Environmental Studies", "Computer Science", "Art & Craft", "Physical Education"]
          : gradeLevel <= 8
          ? ["Mathematics", "Science", "English", "Social Science", "Hindi", "Computer Science", "Physical Education"]
          : gradeLevel <= 10
          ? ["Mathematics", "Science", "English", "Social Science", "Hindi Course-A", "Information Technology", "Physical Education"]
          : section.name === "C"
          ? ["Accountancy", "Business Studies", "Economics", "English Core", "Applied Mathematics", "Physical Education", "Entrepreneurship"]
          : section.name === "D"
          ? ["History", "Political Science", "Economics", "English Core", "Psychology", "Physical Education", "Sociology"]
          : ["Physics", "Chemistry", "Mathematics", "Biology", "English Core", "Computer Science", "Physical Education"];

        const subjectIndex = (p + d * 2) % subjects.length;
        const subjectName = subjects[subjectIndex];

        let roomName = `Room ${Math.min(4, Math.ceil(gradeLevel / 3)) * 100 + ((gradeLevel - 1) % 3) * 4 + (section.name.charCodeAt(0) - 64)}`;
        if (subjectName === "Physical Education") roomName = "Main Sports Ground";
        else if (subjectName.includes("Computer") || subjectName.includes("Information")) roomName = gradeLevel <= 8 ? "Computer Lab 1" : "Computer Lab 2";
        else if (["Physics", "Chemistry", "Biology"].includes(subjectName) && gradeLevel >= 11) roomName = `${subjectName} Lab`;

        timetableDocs.push({
          class_id: classDoc._id,
          section_id: section._id,
          period_id: period._id,
          teacher_user_id: teacherUserId,
          day_of_week: day,
          subject_name: subjectName,
          room: roomName,
          is_active: true,
          created_by_user_id: currentAdminId
        });
      }
    }
  }

  for (let i = 0; i < timetableDocs.length; i += 500) {
    await TimetableEntry.insertMany(timetableDocs.slice(i, i + 500));
  }
  console.log(`Timetable generated: ${timetableDocs.length} slots across all 48 sections.`);

  // 17. Sample Attendance Records
  console.log("Creating recent student attendance records for Class 1-A and Class 10-A...");
  const attendanceDates = [new Date(2026, 8, 20), new Date(2026, 8, 21), new Date(2026, 8, 22)];
  const attendanceDocs = [];

  const targetSections = [sectionDocs[0], class10SecA];
  for (const sec of targetSections) {
    const studentsInSec = studentProfiles.filter((s) => s.section_id && s.section_id.equals(sec._id));
    for (const d of attendanceDates) {
      for (const s of studentsInSec) {
        const isAbsent = Math.random() < 0.05; // 95% attendance rate
        attendanceDocs.push({
          student_id: s._id,
          class_id: sec.class_id,
          section_id: sec._id,
          attendance_date: d,
          checkpoint: "start",
          status: isAbsent ? "absent" : "present",
          remarks: isAbsent ? "Sick leave informed" : "On time",
          marked_by_user_id: sec.class_teacher_user_id
        });
      }
    }
  }
  await StudentAttendance.insertMany(attendanceDocs);
  console.log(`${attendanceDocs.length} attendance checkpoints recorded.`);

  console.log("==========================================================");
  console.log("   DATA SEEDING COMPLETED SUCCESSFULLY!                   ");
  console.log("==========================================================");
  console.log(`Classes: 12 (Class 1 to Class 12)`);
  console.log(`Sections: 48 (4 sections per class, A, B, C, D)`);
  console.log(`Teaching Staff: 50 (TCH-0001 to TCH-0050)`);
  console.log(`Non-Teaching Staff: 20 (NTS-0001 to NTS-0020)`);
  console.log(`Active Students: 2,880 (60 per section across 48 sections)`);
  console.log(`Pending Admissions: 5 (For demoing review & admission flow)`);
  console.log(`Total System Users: ${studentUsers.length + teacherUsersData.length + nonTeachingUsersData.length + 1}`);
  console.log(`School Periods: 8`);
  console.log(`Timetable Slots: ${timetableDocs.length} across all 48 sections (Zero Conflicts)`);
  console.log(`Fee Heads: 6`);
  console.log(`Fee Structures: 12`);
  console.log(`Student Fee Records: ${studentFeeDocs.length}`);
  console.log(`Notices: ${noticeDocs.length}`);
  console.log(`Exam Schedules & Progress Reports: 1 Schedule, ${progressReports.length} Progress Reports`);
  console.log(`Super Admin preserved: ${adminUser?.email || "admin@school.com"}`);
  console.log("Default Passwords:");
  console.log("  Super Admin:        Admin@123");
  console.log("  Teaching Staff:     Teacher@123");
  console.log("  Non-Teaching Staff: Staff@123");
  console.log("  Student:            Student@123");
  console.log("==========================================================");

  await mongoose.disconnect();
}

// Direct CLI invocation check
if (process.argv[1]?.endsWith("seedIndianDemoData.js")) {
  seedIndianDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Error during seeding:", err);
      process.exit(1);
    });
}
