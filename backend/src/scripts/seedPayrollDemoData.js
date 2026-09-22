import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Staff from "../models/Staff.js";
import User from "../models/User.js";
import PayrollBatch from "../models/PayrollBatch.js";
import SalarySlip from "../models/SalarySlip.js";
import StaffAttendance from "../models/StaffAttendance.js";
import { numberToWordsIndian } from "../utils/indianCurrency.js";

dotenv.config();

const calculatePT = (gross, month) => {
  if (gross < 10000) return 0;
  if (gross <= 15000) return 150;
  return month === 2 ? 300 : 200;
};

async function seedPayrollDemoData() {
  console.log("Connecting to Database for Payroll Seeding...");
  await connectDB();

  const adminUser = await User.findOne({ email: "admin@school.com" }) || await User.findOne();
  if (!adminUser) {
    console.error("No admin user found! Please seed users first.");
    await mongoose.disconnect();
    return;
  }

  console.log("Enriching Staff records with Indian statutory data (PAN, UAN, PF, ESI, IFSC)...");
  const allStaff = await Staff.find().populate("user_id", "first_name last_name email mobile is_active status");
  console.log(`Found ${allStaff.length} staff records.`);

  const PAN_POOL = ["ABCDE1234F", "FGHIJ5678K", "KLMNO9012P", "PQRST3456U", "UVWXY7890Z"];
  const IFSC_MAP = {
    "State Bank of India": "SBIN0001234",
    "Punjab National Bank": "PUNB0123400",
    "HDFC Bank": "HDFC0001234",
    "ICICI Bank": "ICIC0001234",
    "Bank of Baroda": "BARB0VISHAL",
    "Canara Bank": "CNRB0001234",
    "Axis Bank": "UTIB0001234",
  };

  for (let i = 0; i < allStaff.length; i++) {
    const s = allStaff[i];
    const isTeaching = s.staff_type === "teaching_staff";
    const basic = s.basic_salary || (isTeaching ? 32000 + (i % 8) * 1500 : 18000 + (i % 5) * 1000);
    const bankName = s.bank_name || "State Bank of India";
    const ifsc = IFSC_MAP[bankName] || "SBIN0001234";
    const pan = `AABC${String(1000 + i).slice(-4)}${PAN_POOL[i % PAN_POOL.length].slice(-1)}`;
    const uan = `1009${String(10000000 + i * 4321).slice(-8)}`;
    const pfNo = `DL/CPM/0023456/000/${String(i + 1).padStart(4, "0")}`;
    const esiNo = basic <= 21000 ? `31000${String(1000000 + i * 789).slice(-7)}` : "";

    s.basic_salary = basic;
    s.bank_name = bankName;
    s.bank_ifsc = ifsc;
    s.pan_number = pan;
    s.uan_number = uan;
    s.pf_account_no = pfNo;
    s.esi_number = esiNo;

    // Standard school allowance formula
    s.salary_structure = {
      da_amount: Math.round(basic * 0.10),
      hra_amount: Math.round(basic * 0.20),
      conveyance_allowance: 1600,
      medical_allowance: 1250,
      special_allowance: isTeaching ? 2500 : 1000,
      epf_applicable: true,
      esi_applicable: basic <= 21000,
      pt_applicable: true,
      tds_monthly: basic > 35000 ? 1500 : basic > 28000 ? 800 : 0,
    };

    await s.save();
  }
  console.log("Staff records enriched successfully.");

  // Clean previous demo payroll data
  console.log("Cleaning previous PayrollBatches and SalarySlips...");
  await PayrollBatch.deleteMany({});
  await SalarySlip.deleteMany({});

  // We will seed 2 payroll cycles:
  // 1. Month 8 (August 2026) - Status: 'disbursed'
  // 2. Month 9 (September 2026) - Status: 'processed' (Ready for approval/disbursement)

  const CYCLES = [
    { month: 8, year: 2026, status: "disbursed", utr: "SBI-CMP-20260831-9921", days: 31, working: 26 },
    { month: 9, year: 2026, status: "processed", utr: "", days: 30, working: 26 },
  ];

  for (const cycle of CYCLES) {
    console.log(`Processing Payroll Batch for Month ${cycle.month}/${cycle.year} (Status: ${cycle.status})...`);

    const batch = new PayrollBatch({
      month: cycle.month,
      year: cycle.year,
      batch_code: `PAYROLL-${cycle.year}-${String(cycle.month).padStart(2, "0")}`,
      status: cycle.status,
      total_calendar_days: cycle.days,
      total_working_days: cycle.working,
      processed_by: adminUser._id,
      approved_by: adminUser._id,
      approved_at: cycle.status !== "draft" ? new Date(cycle.year, cycle.month - 1, 28) : undefined,
      disbursed_by: cycle.status === "disbursed" ? adminUser._id : undefined,
      disbursed_at: cycle.status === "disbursed" ? new Date(cycle.year, cycle.month - 1, 30) : undefined,
      payment_method: "bank_transfer",
      disbursement_reference: cycle.utr,
      notes: `Institutional monthly faculty & staff payroll disbursement for ${cycle.month}/${cycle.year}.`,
    });

    let batchGross = 0;
    let batchBasic = 0;
    let batchAllowances = 0;
    let batchEPF = 0;
    let batchESI = 0;
    let batchPT = 0;
    let batchTDS = 0;
    let batchLOP = 0;
    let batchTotalDeductions = 0;
    let batchNetPay = 0;
    let teachingCount = 0;
    let nonTeachingCount = 0;

    const slips = [];

    for (let i = 0; i < allStaff.length; i++) {
      const s = allStaff[i];
      const u = s.user_id;
      if (!u) continue;

      const isTeaching = s.staff_type === "teaching_staff";
      if (isTeaching) teachingCount++;
      else nonTeachingCount++;

      // Simulate occasional leave / LOP for 10% of staff
      const hasLop = (i % 7 === 0);
      const lopDays = hasLop ? (i % 2 === 0 ? 1 : 2) : 0;
      const presentDays = cycle.working - lopDays;
      const payableDays = cycle.days - lopDays;

      const basic = s.basic_salary;
      const da = s.salary_structure.da_amount;
      const hra = s.salary_structure.hra_amount;
      const conveyance = s.salary_structure.conveyance_allowance;
      const medical = s.salary_structure.medical_allowance;
      const special = s.salary_structure.special_allowance;
      const allowancesTotal = da + hra + conveyance + medical + special;
      const grossEarnings = basic + allowancesTotal;

      // LOP
      const perDayRate = grossEarnings / cycle.days;
      const lopDeduction = Math.round(perDayRate * lopDays);

      // EPF
      const epfWage = basic + da;
      const epfEmployee = Math.round(epfWage * 0.12);
      const epfEmployer = epfEmployee;

      // ESI
      const esiEmployee = grossEarnings <= 21000 ? Math.round(grossEarnings * 0.0075) : 0;
      const esiEmployer = grossEarnings <= 21000 ? Math.round(grossEarnings * 0.0325) : 0;

      // PT
      const professionalTax = calculatePT(grossEarnings, cycle.month);

      // TDS
      const tds = s.salary_structure.tds_monthly || 0;

      const totalDeductions = lopDeduction + epfEmployee + esiEmployee + professionalTax + tds;
      const netSalary = Math.max(0, grossEarnings - totalDeductions);
      const netWords = numberToWordsIndian(netSalary);

      const slipNumber = `PAY-${cycle.year}${String(cycle.month).padStart(2, "0")}-${String(i + 1).padStart(4, "0")}`;
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();

      slips.push({
        batch_id: batch._id,
        staff_id: s._id,
        user_id: u._id,
        slip_number: slipNumber,
        month: cycle.month,
        year: cycle.year,
        employee_code: s.employee_code || `EMP-${String(i + 1).padStart(4, "0")}`,
        employee_name: fullName,
        designation: s.designation || (isTeaching ? "Senior Teacher" : "Executive"),
        department: s.department || "Academic Wing",
        staff_type: s.staff_type,
        joining_date: s.joining_date || new Date(2022, 0, 1),
        pan_number: s.pan_number,
        uan_number: s.uan_number,
        pf_account_no: s.pf_account_no,
        esi_number: s.esi_number,
        bank_name: s.bank_name,
        bank_account_no: s.bank_account_no || `3000${String(i + 1).padStart(8, "0")}`,
        bank_ifsc: s.bank_ifsc,
        calendar_days: cycle.days,
        working_days: cycle.working,
        present_days: presentDays,
        approved_leaves: 0,
        half_days: 0,
        lop_days: lopDays,
        payable_days: payableDays,
        basic_salary: basic,
        da,
        hra,
        conveyance_allowance: conveyance,
        medical_allowance: medical,
        special_allowance: special,
        bonus: 0,
        overtime_pay: 0,
        gross_earnings: grossEarnings,
        epf_employee: epfEmployee,
        epf_employer: epfEmployer,
        esi_employee: esiEmployee,
        esi_employer: esiEmployer,
        professional_tax: professionalTax,
        tds,
        lop_deduction: lopDeduction,
        other_deductions: 0,
        total_deductions: totalDeductions,
        net_salary: netSalary,
        net_salary_words: netWords,
        status: cycle.status === "disbursed" ? "paid" : "processed",
        payment_method: "bank_transfer",
        payment_date: cycle.status === "disbursed" ? new Date(cycle.year, cycle.month - 1, 30) : undefined,
        transaction_reference: cycle.status === "disbursed" ? cycle.utr : "",
      });

      batchGross += grossEarnings;
      batchBasic += basic;
      batchAllowances += allowancesTotal;
      batchEPF += epfEmployee;
      batchESI += esiEmployee;
      batchPT += professionalTax;
      batchTDS += tds;
      batchLOP += lopDeduction;
      batchTotalDeductions += totalDeductions;
      batchNetPay += netSalary;
    }

    batch.staff_count = slips.length;
    batch.teaching_staff_count = teachingCount;
    batch.non_teaching_staff_count = nonTeachingCount;
    batch.total_basic_pay = batchBasic;
    batch.total_allowances = batchAllowances;
    batch.total_gross_pay = batchGross;
    batch.total_epf = batchEPF;
    batch.total_esi = batchESI;
    batch.total_pt = batchPT;
    batch.total_tds = batchTDS;
    batch.total_lop_deductions = batchLOP;
    batch.total_other_deductions = 0;
    batch.total_deductions = batchTotalDeductions;
    batch.total_net_pay = batchNetPay;

    await batch.save();
    await SalarySlip.insertMany(slips);

    console.log(`Saved batch ${batch.batch_code} with ${slips.length} slips. Net Pay: ₹${batchNetPay.toLocaleString("en-IN")}`);
  }

  console.log("==========================================================");
  console.log("   PAYROLL DEMO DATA SEEDED SUCCESSFULLY!                 ");
  console.log("==========================================================");
  await mongoose.disconnect();
}

seedPayrollDemoData().catch((err) => {
  console.error("Error seeding payroll data:", err);
  process.exit(1);
});

