import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import VisitorLog from "../models/VisitorLog.js";
import StudentEarlyGatePass from "../models/StudentEarlyGatePass.js";
import Student from "../models/Student.js";
import Staff from "../models/Staff.js";
import User from "../models/User.js";
import Class from "../models/Class.js";
import Section from "../models/Section.js";

dotenv.config();

const seedSecurityData = async () => {
  try {
    console.log("Connecting to database for Campus Security seed...");
    await connectDB();

    console.log("Clearing existing Visitor Logs and Early Gate Passes...");
    await VisitorLog.deleteMany({});
    await StudentEarlyGatePass.deleteMany({});

    // Fetch existing students, staff, and admin
    const students = await Student.find({}).populate("user_id").populate("class_id").populate("section_id").limit(10);
    const staffMembers = await Staff.find({}).populate("user_id").limit(10);
    const adminUser = await User.findOne({ email: "admin@kidzgalaxy.org" }) || (await User.findOne());

    if (!students.length) {
      console.warn("No students found in DB. Please run seed:demo first.");
      process.exit(1);
    }

    const hostStaff1 = staffMembers[0]?.user_id ? `${staffMembers[0].user_id.first_name} ${staffMembers[0].user_id.last_name}` : "Sunita Rao (Vice Principal)";
    const hostStaff2 = staffMembers[1]?.user_id ? `${staffMembers[1].user_id.first_name} ${staffMembers[1].user_id.last_name}` : "Arun Joshi (Science Teacher)";
    const hostStaff3 = staffMembers[2]?.user_id ? `${staffMembers[2].user_id.first_name} ${staffMembers[2].user_id.last_name}` : "Meenakshi Sundaram (Admin Head)";

    console.log("Seeding Visitor Logs...");

    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const visitorsData = [
      {
        pass_number: "VIS-2026-0001",
        visitor_name: "Amitabh Srivastava",
        visitor_phone: "9839012345",
        visitor_email: "amitabh.srivastava@gmail.com",
        visitor_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        id_proof_type: "Aadhaar Card",
        id_proof_number: "XXXXXXXX8921",
        purpose: "Parent Meeting",
        purpose_details: "Discussion regarding Class 10 term exam preparation",
        person_to_meet_type: "staff",
        person_to_meet_user_id: staffMembers[0]?.user_id?._id || null,
        person_to_meet_name: hostStaff1,
        person_to_meet_department: "Academic Wing",
        vehicle_number: "UP-32-BN-4491",
        accompanying_count: 1,
        belongings_declared: "Handbag, Car keys",
        otp_code: "582910",
        otp_verified: true,
        otp_verified_at: oneHourAgo,
        check_in_time: oneHourAgo,
        status: "checked_in",
        security_guard_name: "Surendra Singh",
        gate_number: "Gate 1 - Main Entrance",
        badge_printed: true,
        badge_print_count: 1,
        remarks: "ID physically verified at reception.",
      },
      {
        pass_number: "VIS-2026-0002",
        visitor_name: "Dr. Rohini Deshmukh",
        visitor_phone: "9820154872",
        visitor_email: "dr.rohini@medicare.in",
        visitor_photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        id_proof_type: "Driving License",
        id_proof_number: "DL-1420180029",
        purpose: "Official / CBSE Inspection",
        purpose_details: "Annual School Health & POCSO Safety Audit inspection",
        person_to_meet_type: "staff",
        person_to_meet_user_id: staffMembers[2]?.user_id?._id || null,
        person_to_meet_name: hostStaff3,
        person_to_meet_department: "Principal Office",
        vehicle_number: "DL-03-CC-9012",
        accompanying_count: 0,
        belongings_declared: "Laptop Dell XPS, Audit dossier",
        otp_code: "741298",
        otp_verified: true,
        otp_verified_at: twoHoursAgo,
        check_in_time: twoHoursAgo,
        status: "checked_in",
        security_guard_name: "Surendra Singh",
        gate_number: "Gate 1 - Main Entrance",
        badge_printed: true,
        badge_print_count: 2,
        remarks: "VIP Official Visitor. Escorted to Principal office.",
      },
      {
        pass_number: "VIS-2026-0003",
        visitor_name: "Manoj Kumar Verma",
        visitor_phone: "9792019483",
        visitor_email: "mverma.aircon@gmail.com",
        visitor_photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        id_proof_type: "Aadhaar Card",
        id_proof_number: "XXXXXXXX4412",
        purpose: "Maintenance / Contractor",
        purpose_details: "Auditorium HVAC inspection & filter replacement",
        person_to_meet_type: "department",
        person_to_meet_name: "Estate & Maintenance Manager",
        person_to_meet_department: "Estate Office",
        vehicle_number: "UP-32-EA-2039",
        accompanying_count: 2,
        belongings_declared: "Tool box, Vacuum pump, Gas cylinder manifold",
        otp_code: "619024",
        otp_verified: true,
        otp_verified_at: fourHoursAgo,
        check_in_time: fourHoursAgo,
        status: "checked_in", // >3 hrs => overstayed alert
        security_guard_name: "Ram Niwas",
        gate_number: "Gate 2 - Service Gate",
        badge_printed: true,
        badge_print_count: 1,
        remarks: "Contractor passed safety briefing.",
      },
      {
        pass_number: "VIS-2026-0004",
        visitor_name: "Sunita Agarwal",
        visitor_phone: "9838491024",
        visitor_email: "sunita.agarwal90@gmail.com",
        visitor_photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        id_proof_type: "Voter ID",
        id_proof_number: "UP/32/190234",
        purpose: "Admissions Inquiry",
        purpose_details: "Inquiry for Class 1 & 3 admission for siblings",
        person_to_meet_type: "staff",
        person_to_meet_name: "Admissions Desk Coordinator",
        person_to_meet_department: "Admissions & Marketing",
        vehicle_number: "UP-32-KZ-1823",
        accompanying_count: 1,
        belongings_declared: "None",
        otp_code: "893120",
        otp_verified: true,
        otp_verified_at: thirtyMinsAgo,
        check_in_time: thirtyMinsAgo,
        status: "checked_in",
        security_guard_name: "Surendra Singh",
        gate_number: "Gate 1 - Main Entrance",
        badge_printed: false,
        badge_print_count: 0,
        remarks: "Prospective parents. Given admission brochure.",
      },
      {
        pass_number: "VIS-2026-0005",
        visitor_name: "Rajesh Kumar (Blue Dart Express)",
        visitor_phone: "9450192841",
        visitor_email: "dispatch.lko@bluedart.com",
        visitor_photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
        id_proof_type: "Govt ID / Other",
        id_proof_number: "BD-EMPLOYEE-98214",
        purpose: "Vendor / Delivery",
        purpose_details: "CBSE official documents & exam parcel delivery",
        person_to_meet_type: "department",
        person_to_meet_name: "Central Dispatch & Store",
        person_to_meet_department: "Administrative Block",
        vehicle_number: "UP-32-CD-5678",
        accompanying_count: 0,
        belongings_declared: "3 Sealed Courier Packets",
        otp_code: "331890",
        otp_verified: true,
        otp_verified_at: yesterday,
        check_in_time: yesterday,
        check_out_time: new Date(yesterday.getTime() + 25 * 60 * 1000),
        status: "checked_out",
        security_guard_name: "Surendra Singh",
        gate_number: "Gate 1 - Main Entrance",
        badge_printed: true,
        badge_print_count: 1,
        remarks: "Parcel safely handed over to Admin office.",
      },
      {
        pass_number: "VIS-2026-0006",
        visitor_name: "Pooja Malhotra",
        visitor_phone: "9839401928",
        visitor_email: "pooja.malhotra@yahoo.co.in",
        visitor_photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        id_proof_type: "Aadhaar Card",
        id_proof_number: "XXXXXXXX7723",
        purpose: "Fee / Accounts Inquiry",
        purpose_details: "Discussion on quarterly fee structure and receipt",
        person_to_meet_type: "department",
        person_to_meet_name: "Accounts Officer (Mr. Sharma)",
        person_to_meet_department: "Accounts Wing",
        vehicle_number: null,
        accompanying_count: 0,
        belongings_declared: "Handbag",
        otp_code: "449012",
        otp_verified: true,
        otp_verified_at: yesterday,
        check_in_time: yesterday,
        check_out_time: new Date(yesterday.getTime() + 45 * 60 * 1000),
        status: "checked_out",
        security_guard_name: "Ram Niwas",
        gate_number: "Gate 1 - Main Entrance",
        badge_printed: true,
        badge_print_count: 1,
        remarks: "Fee query resolved.",
      },
    ];

    for (const v of visitorsData) {
      await VisitorLog.create(v);
    }
    console.log(`Successfully seeded ${visitorsData.length} Visitor Logs.`);

    console.log("Seeding Student Early Gate Passes...");

    const earlyPassesData = [];

    if (students.length >= 1) {
      const s = students[0];
      const sUser = s.user_id;
      earlyPassesData.push({
        pass_number: "EGP-2026-0001",
        student_id: s._id,
        class_id: s.class_id?._id || null,
        section_id: s.section_id?._id || null,
        academic_year: "2025-2026",
        reason_type: "Illness / Medical Emergency",
        reason_details: "Student developed sudden high fever (102°F) and nausea in 3rd period. Examined by school infirmary nurse.",
        pickup_person_name: s.primary_guardian_name || "Vikas Sharma",
        pickup_person_relation: s.primary_guardian_relationship === "mother" ? "Mother" : "Father",
        pickup_person_phone: s.primary_guardian_phone || sUser?.mobile || "9839102456",
        pickup_person_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        pickup_person_id_proof: "Aadhaar Card (Verified with Student Profile)",
        parent_consent_method: "Parent Mobile OTP",
        parent_otp_code: "948123",
        parent_otp_verified: true,
        parent_otp_verified_at: oneHourAgo,
        parent_notified: true,
        approval_status: "released_at_gate",
        teacher_approval: {
          approved: true,
          approved_by: staffMembers[1]?.user_id?._id || adminUser?._id,
          approved_by_name: hostStaff2,
          approved_at: oneHourAgo,
          remarks: "Confirmed by Class Teacher. Infirmary referral attached.",
        },
        admin_approval: {
          approved: true,
          approved_by: adminUser?._id,
          approved_by_name: "Principal Office / Dr. R. K. Saxena",
          approved_at: new Date(oneHourAgo.getTime() + 10 * 60 * 1000),
          remarks: "Authorized medical release.",
        },
        gate_security: {
          released: true,
          released_by_guard: "Surendra Singh",
          released_at: new Date(oneHourAgo.getTime() + 20 * 60 * 1000),
          gate_number: "Gate 1 - Main Entrance",
          remarks: "Father physically verified. Left in vehicle UP-32-BN-1042.",
        },
        departure_time: oneHourAgo,
        actual_exit_time: new Date(oneHourAgo.getTime() + 20 * 60 * 1000),
        slip_printed: true,
        slip_printed_at: oneHourAgo,
      });
    }

    if (students.length >= 2) {
      const s = students[1];
      const sUser = s.user_id;
      earlyPassesData.push({
        pass_number: "EGP-2026-0002",
        student_id: s._id,
        class_id: s.class_id?._id || null,
        section_id: s.section_id?._id || null,
        academic_year: "2025-2026",
        reason_type: "Doctor Appointment",
        reason_details: "Pre-scheduled Pediatric Dental Surgery appointment at Apollo Hospital at 2:30 PM.",
        pickup_person_name: s.primary_guardian_name || "Sunita Verma",
        pickup_person_relation: "Mother",
        pickup_person_phone: s.primary_guardian_phone || sUser?.mobile || "9838204891",
        pickup_person_photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        pickup_person_id_proof: "Driving License UP32-2019-0091",
        parent_consent_method: "Parent Mobile OTP",
        parent_otp_code: "512890",
        parent_otp_verified: true,
        parent_otp_verified_at: thirtyMinsAgo,
        parent_notified: true,
        approval_status: "approved_by_admin", // Ready at Gate
        teacher_approval: {
          approved: true,
          approved_by: staffMembers[0]?.user_id?._id || adminUser?._id,
          approved_by_name: hostStaff1,
          approved_at: thirtyMinsAgo,
          remarks: "Appointment prescription slip verified.",
        },
        admin_approval: {
          approved: true,
          approved_by: adminUser?._id,
          approved_by_name: "Principal Office / Dr. R. K. Saxena",
          approved_at: new Date(thirtyMinsAgo.getTime() + 5 * 60 * 1000),
          remarks: "Approved for 1:30 PM early pickup.",
        },
        departure_time: now,
        slip_printed: true,
        slip_printed_at: now,
      });
    }

    if (students.length >= 3) {
      const s = students[2];
      const sUser = s.user_id;
      earlyPassesData.push({
        pass_number: "EGP-2026-0003",
        student_id: s._id,
        class_id: s.class_id?._id || null,
        section_id: s.section_id?._id || null,
        academic_year: "2025-2026",
        reason_type: "Family Emergency",
        reason_details: "Family emergency requiring urgent outstation departure with parents.",
        pickup_person_name: "Ramesh Chandra Gupta",
        pickup_person_relation: "Father",
        pickup_person_phone: s.primary_guardian_phone || sUser?.mobile || "9415029481",
        pickup_person_photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        pickup_person_id_proof: "Aadhaar Card",
        parent_consent_method: "Parent Mobile OTP",
        parent_otp_code: "782341",
        parent_otp_verified: true,
        parent_otp_verified_at: now,
        parent_notified: true,
        approval_status: "approved_by_teacher", // Awaiting Principal Approval
        teacher_approval: {
          approved: true,
          approved_by: staffMembers[1]?.user_id?._id || adminUser?._id,
          approved_by_name: hostStaff2,
          approved_at: now,
          remarks: "Telephonically spoken to parent. Class work handed over.",
        },
        departure_time: now,
        slip_printed: false,
      });
    }

    if (students.length >= 4) {
      const s = students[3];
      const sUser = s.user_id;
      earlyPassesData.push({
        pass_number: "EGP-2026-0004",
        student_id: s._id,
        class_id: s.class_id?._id || null,
        section_id: s.section_id?._id || null,
        academic_year: "2025-2026",
        reason_type: "Pre-approved Event / Competition",
        reason_details: "CBSE Cluster Volleyball Tournament representing Kidz Galaxy School at KD Singh Babu Stadium.",
        pickup_person_name: "Coach Arvind Trivedi",
        pickup_person_relation: "Authorized Driver / Escort",
        pickup_person_phone: "9839401298",
        pickup_person_photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
        pickup_person_id_proof: "School Sports Dept ID #PE-104",
        parent_consent_method: "Written Note / Email",
        parent_otp_code: "623910",
        parent_otp_verified: true,
        parent_notified: true,
        approval_status: "pending", // Newly submitted, awaiting Class Teacher
        departure_time: now,
        slip_printed: false,
      });
    }

    for (const p of earlyPassesData) {
      await StudentEarlyGatePass.create(p);
    }
    console.log(`Successfully seeded ${earlyPassesData.length} Student Early Gate Passes.`);

    console.log("Campus Security demo seed completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding Campus Security data:", err);
    process.exit(1);
  }
};

seedSecurityData();

