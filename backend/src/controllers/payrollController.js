import mongoose from "mongoose";
import PayrollBatch from "../models/PayrollBatch.js";
import SalarySlip from "../models/SalarySlip.js";
import Staff from "../models/Staff.js";
import StaffAttendance from "../models/StaffAttendance.js";
import LeaveApplication from "../models/LeaveApplication.js";
import { numberToWordsIndian } from "../utils/indianCurrency.js";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Calculate Indian Professional Tax based on standard state slab
const calculatePT = (grossEarnings, month) => {
  if (grossEarnings < 10000) return 0;
  if (grossEarnings <= 15000) return 150;
  // In month 2 (February), some states collect ₹300, else standard ₹200
  return month === 2 ? 300 : 200;
};

// ── 1. Run or Recalculate Payroll Batch ──────────────────────────────────────
export const runOrRecalculatePayrollBatch = async (req, res) => {
  try {
    const { month, year, total_working_days } = req.body;

    const m = Number(month);
    const y = Number(year);

    if (!m || m < 1 || m > 12 || !y || y < 2000 || y > 2100) {
      return res.status(400).json({ message: "Valid month (1-12) and year are required" });
    }

    const calendarDays = new Date(y, m, 0).getDate();
    const workingDays = Number(total_working_days) || (calendarDays <= 30 ? 26 : 27);
    const batchCode = `PAYROLL-${y}-${String(m).padStart(2, "0")}`;

    // Find all active staff with populated user
    const activeStaff = await Staff.find({ is_active: true })
      .populate("user_id", "first_name last_name email mobile is_active status")
      .lean();

    const eligibleStaff = activeStaff.filter(
      (s) => s.user_id && s.user_id.is_active !== false && s.user_id.status !== "rejected"
    );

    if (eligibleStaff.length === 0) {
      return res.status(400).json({ message: "No active staff members found to process payroll" });
    }

    // Find or create batch
    let batch = await PayrollBatch.findOne({ month: m, year: y });
    if (!batch) {
      batch = new PayrollBatch({
        month: m,
        year: y,
        batch_code: batchCode,
        status: "draft",
        total_calendar_days: calendarDays,
        total_working_days: workingDays,
        processed_by: req.user?._id,
      });
    } else {
      batch.total_calendar_days = calendarDays;
      batch.total_working_days = workingDays;
      batch.processed_by = req.user?._id;
    }

    // Date range for attendance lookup
    const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    // Attendance records for the month
    const staffUserIds = eligibleStaff.map((s) => s.user_id._id);
    const attendanceRecords = await StaffAttendance.find({
      user_id: { $in: staffUserIds },
      attendance_date: { $gte: startDate, $lte: endDate },
    }).lean();

    // Approved leaves for the month
    const approvedLeaves = await LeaveApplication.find({
      applicant: { $in: staffUserIds },
      applicant_type: "staff",
      status: "approved",
      start_date: { $lte: endDate },
      end_date: { $gte: startDate },
    }).lean();

    // Map attendance and leaves by user_id
    const attendanceByUser = new Map();
    attendanceRecords.forEach((att) => {
      const uid = String(att.user_id);
      if (!attendanceByUser.has(uid)) attendanceByUser.set(uid, []);
      attendanceByUser.get(uid).push(att);
    });

    const leavesByUser = new Map();
    approvedLeaves.forEach((lv) => {
      const uid = String(lv.applicant);
      if (!leavesByUser.has(uid)) leavesByUser.set(uid, []);
      leavesByUser.get(uid).push(lv);
    });

    let batchGross = 0;
    let batchBasic = 0;
    let batchAllowances = 0;
    let batchEPF = 0;
    let batchESI = 0;
    let batchPT = 0;
    let batchTDS = 0;
    let batchLOP = 0;
    let batchOtherDeductions = 0;
    let batchTotalDeductions = 0;
    let batchNetPay = 0;
    let teachingCount = 0;
    let nonTeachingCount = 0;

    const salarySlipsToSave = [];

    eligibleStaff.forEach((staff, index) => {
      const user = staff.user_id;
      const uid = String(user._id);
      const isTeaching = staff.staff_type === "teaching_staff";
      if (isTeaching) teachingCount++;
      else nonTeachingCount++;

      // ── Attendance & LOP Calculation ──
      const userAtt = attendanceByUser.get(uid) || [];
      let absentDaysCount = 0;
      let halfDaysCount = 0;
      let presentCheckpoints = 0;

      userAtt.forEach((rec) => {
        if (rec.status === "absent") absentDaysCount++;
        else if (rec.status === "half_day") halfDaysCount++;
        else if (rec.status === "present" || rec.status === "late") presentCheckpoints++;
      });

      // Divide checkpoints by 2 if both start & end exist, or direct daily count
      const halfDays = Math.min(workingDays, Math.round(halfDaysCount / 2 * 10) / 10);
      const absentDays = Math.min(workingDays, Math.round(absentDaysCount / 2 * 10) / 10);

      // Approved leaves count as paid
      const userLeaves = leavesByUser.get(uid) || [];
      const approvedPaidDays = userLeaves.reduce((acc, lv) => acc + (Number(lv.total_days) || 0), 0);

      // LOP days = absent days (unapproved) + half of half-days
      const rawLopDays = Math.max(0, absentDays + (halfDays * 0.5));
      const lopDays = Math.min(workingDays, Math.round(rawLopDays * 10) / 10);
      const presentDays = Math.max(0, Math.round((workingDays - lopDays) * 10) / 10);
      const payableDays = Math.max(0, Math.round((calendarDays - lopDays) * 10) / 10);

      // ── Salary Breakdown ──
      const basic = Number(staff.basic_salary) || (isTeaching ? 32000 : 20000);
      const struct = staff.salary_structure || {};

      // Dearness Allowance (DA) - default 10% of basic if not customized
      const da = struct.da_amount ?? Math.round(basic * 0.10);
      // House Rent Allowance (HRA) - default 20% of basic if not customized
      const hra = struct.hra_amount ?? Math.round(basic * 0.20);
      // Conveyance Allowance - default ₹1,600
      const conveyance = struct.conveyance_allowance ?? 1600;
      // Medical Allowance - default ₹1,250
      const medical = struct.medical_allowance ?? 1250;
      // Special Allowance - default balance
      const special = struct.special_allowance ?? (isTeaching ? 2500 : 1000);

      const allowancesTotal = da + hra + conveyance + medical + special;
      const grossEarnings = basic + allowancesTotal;

      // ── Deductions Breakdown ──
      // 1. Loss of Pay (LOP) Deduction = (Gross / Calendar Days) * LOP Days
      const perDayRate = grossEarnings / calendarDays;
      const lopDeduction = Math.round(perDayRate * lopDays);

      // 2. EPF (Employee Provident Fund) - Standard 12% on (Basic + DA)
      const epfApplicable = struct.epf_applicable !== false;
      const epfWage = basic + da;
      const epfEmployee = epfApplicable ? Math.round(epfWage * 0.12) : 0;
      const epfEmployer = epfApplicable ? Math.round(epfWage * 0.12) : 0;

      // 3. ESI (Employee State Insurance) - 0.75% for Gross <= 21,000
      const esiApplicable = struct.esi_applicable === true || (grossEarnings <= 21000 && struct.esi_applicable !== false);
      const esiEmployee = esiApplicable ? Math.round(grossEarnings * 0.0075) : 0;
      const esiEmployer = esiApplicable ? Math.round(grossEarnings * 0.0325) : 0;

      // 4. Professional Tax (PT) - Indian standard monthly slab
      const ptApplicable = struct.pt_applicable !== false;
      const professionalTax = ptApplicable ? calculatePT(grossEarnings, m) : 0;

      // 5. TDS (Income Tax)
      const tds = Number(struct.tds_monthly) || 0;

      const totalDeductions = lopDeduction + epfEmployee + esiEmployee + professionalTax + tds;
      const netSalary = Math.max(0, grossEarnings - totalDeductions);
      const netSalaryWords = numberToWordsIndian(netSalary);

      const slipNumber = `PAY-${y}${String(m).padStart(2, "0")}-${String(index + 1).padStart(4, "0")}`;

      const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

      salarySlipsToSave.push({
        batch_id: batch._id,
        staff_id: staff._id,
        user_id: user._id,
        slip_number: slipNumber,
        month: m,
        year: y,
        employee_code: staff.employee_code || `EMP-${String(index + 1).padStart(4, "0")}`,
        employee_name: fullName,
        designation: staff.designation || (isTeaching ? "Teacher" : "Staff Member"),
        department: staff.department || "Academics",
        staff_type: staff.staff_type,
        joining_date: staff.joining_date || new Date(2022, 0, 1),
        pan_number: staff.pan_number || "AABCS1234F",
        uan_number: staff.uan_number || `10098765${String(index + 1).padStart(4, "0")}`,
        pf_account_no: staff.pf_account_no || `DL/CPM/0023456/000/${String(index + 1).padStart(4, "0")}`,
        esi_number: staff.esi_number || `31000${String(index + 1).padStart(7, "0")}`,
        bank_name: staff.bank_name || "State Bank of India",
        bank_account_no: staff.bank_account_no || `3000${String(index + 1).padStart(8, "0")}`,
        bank_ifsc: staff.bank_ifsc || (staff.bank_name?.includes("HDFC") ? "HDFC0001234" : staff.bank_name?.includes("PNB") ? "PUNB0123400" : "SBIN0001234"),
        calendar_days: calendarDays,
        working_days: workingDays,
        present_days: presentDays,
        approved_leaves: approvedPaidDays,
        half_days: halfDays,
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
        net_salary_words: netSalaryWords,
        status: batch.status === "disbursed" ? "paid" : "processed",
      });

      // Accumulate batch totals
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
    });

    // Update batch totals
    batch.staff_count = eligibleStaff.length;
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
    batch.total_other_deductions = batchOtherDeductions;
    batch.total_deductions = batchTotalDeductions;
    batch.total_net_pay = batchNetPay;
    batch.status = "processed";

    await batch.save();

    // Delete any old slips for this batch and bulk insert fresh calculated slips
    await SalarySlip.deleteMany({ batch_id: batch._id });
    await SalarySlip.insertMany(salarySlipsToSave);

    res.status(200).json({
      message: `Payroll for ${MONTH_NAMES[m]} ${y} processed successfully for ${eligibleStaff.length} employees`,
      batch,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to process payroll batch", error: error.message });
  }
};

// ── 2. List All Payroll Batches ─────────────────────────────────────────────
export const listPayrollBatches = async (req, res) => {
  try {
    const batches = await PayrollBatch.find()
      .populate("processed_by", "first_name last_name")
      .populate("approved_by", "first_name last_name")
      .populate("disbursed_by", "first_name last_name")
      .sort({ year: -1, month: -1 });

    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ message: "Failed to list payroll batches", error: error.message });
  }
};

// ── 3. Get Single Payroll Batch by ID with Slips ─────────────────────────────
export const getPayrollBatchById = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { staff_type, department, search } = req.query;

    const batch = await PayrollBatch.findById(batchId)
      .populate("processed_by", "first_name last_name email")
      .populate("approved_by", "first_name last_name email")
      .populate("disbursed_by", "first_name last_name email");

    if (!batch) {
      return res.status(404).json({ message: "Payroll batch not found" });
    }

    const filter = { batch_id: batch._id };
    if (staff_type) filter.staff_type = staff_type;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { employee_name: { $regex: search, $options: "i" } },
        { employee_code: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
      ];
    }

    const slips = await SalarySlip.find(filter)
      .sort({ staff_type: -1, employee_code: 1 });

    res.status(200).json({ batch, slips });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payroll batch details", error: error.message });
  }
};

// ── 4. Update Batch Status (Draft -> Approved -> Disbursed) ─────────────────
export const updatePayrollBatchStatus = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { status, disbursement_reference, payment_method, notes } = req.body;

    const batch = await PayrollBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Payroll batch not found" });
    }

    if (status === "approved") {
      batch.status = "approved";
      batch.approved_by = req.user._id;
      batch.approved_at = new Date();
      if (notes) batch.notes = notes;
      await batch.save();
      await SalarySlip.updateMany({ batch_id: batch._id }, { status: "approved" });
    } else if (status === "disbursed") {
      batch.status = "disbursed";
      batch.disbursed_by = req.user._id;
      batch.disbursed_at = new Date();
      if (disbursement_reference) batch.disbursement_reference = disbursement_reference;
      if (payment_method) batch.payment_method = payment_method;
      if (notes) batch.notes = notes;
      await batch.save();
      await SalarySlip.updateMany(
        { batch_id: batch._id },
        {
          status: "paid",
          payment_date: new Date(),
          transaction_reference: disbursement_reference || "NEFT-BULK-BATCH",
        }
      );
    } else if (status === "draft") {
      batch.status = "draft";
      await batch.save();
      await SalarySlip.updateMany({ batch_id: batch._id }, { status: "draft" });
    }

    res.status(200).json({ message: `Batch status updated to ${status}`, batch });
  } catch (error) {
    res.status(500).json({ message: "Failed to update batch status", error: error.message });
  }
};

// ── 5. Override / Adjust Individual Salary Slip ─────────────────────────────
export const updateSalarySlip = async (req, res) => {
  try {
    const { slipId } = req.params;
    const {
      lop_days,
      bonus,
      overtime_pay,
      tds,
      other_deductions,
      remarks,
    } = req.body;

    const slip = await SalarySlip.findById(slipId);
    if (!slip) {
      return res.status(404).json({ message: "Salary slip not found" });
    }

    if (lop_days !== undefined) {
      slip.lop_days = Number(lop_days);
      slip.payable_days = Math.max(0, slip.calendar_days - slip.lop_days);
      slip.present_days = Math.max(0, slip.working_days - slip.lop_days);
      const perDayRate = slip.gross_earnings / slip.calendar_days;
      slip.lop_deduction = Math.round(perDayRate * slip.lop_days);
    }

    if (bonus !== undefined) slip.bonus = Number(bonus);
    if (overtime_pay !== undefined) slip.overtime_pay = Number(overtime_pay);
    if (tds !== undefined) slip.tds = Number(tds);
    if (other_deductions !== undefined) slip.other_deductions = Number(other_deductions);
    if (remarks !== undefined) slip.remarks = remarks;

    // Recalculate gross earnings
    const baseEarnings = slip.basic_salary + slip.da + slip.hra + slip.conveyance_allowance + slip.medical_allowance + slip.special_allowance;
    slip.gross_earnings = baseEarnings + slip.bonus + slip.overtime_pay;

    // Recalculate deductions
    slip.total_deductions = slip.lop_deduction + slip.epf_employee + slip.esi_employee + slip.professional_tax + slip.tds + slip.other_deductions;
    slip.net_salary = Math.max(0, slip.gross_earnings - slip.total_deductions);
    slip.net_salary_words = numberToWordsIndian(slip.net_salary);

    await slip.save();

    // Recalculate batch totals
    const allSlips = await SalarySlip.find({ batch_id: slip.batch_id });
    const newBatchGross = allSlips.reduce((acc, s) => acc + s.gross_earnings, 0);
    const newBatchNet = allSlips.reduce((acc, s) => acc + s.net_salary, 0);
    const newBatchDeductions = allSlips.reduce((acc, s) => acc + s.total_deductions, 0);
    const newBatchLOP = allSlips.reduce((acc, s) => acc + s.lop_deduction, 0);
    const newBatchTDS = allSlips.reduce((acc, s) => acc + s.tds, 0);

    await PayrollBatch.findByIdAndUpdate(slip.batch_id, {
      total_gross_pay: newBatchGross,
      total_net_pay: newBatchNet,
      total_deductions: newBatchDeductions,
      total_lop_deductions: newBatchLOP,
      total_tds: newBatchTDS,
    });

    res.status(200).json({ message: "Salary slip updated successfully", slip });
  } catch (error) {
    res.status(500).json({ message: "Failed to update salary slip", error: error.message });
  }
};

// ── 6. Get Single Salary Slip by ID ─────────────────────────────────────────
export const getSalarySlipById = async (req, res) => {
  try {
    const { slipId } = req.params;
    const slip = await SalarySlip.findById(slipId);
    if (!slip) {
      return res.status(404).json({ message: "Salary slip not found" });
    }
    res.status(200).json(slip);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch salary slip", error: error.message });
  }
};

// ── 7. Get My Payslips (Teacher / Staff Self-Service) ────────────────────────
export const getMyPayslips = async (req, res) => {
  try {
    const userId = req.user._id;
    const slips = await SalarySlip.find({ user_id: userId })
      .sort({ year: -1, month: -1 });

    res.status(200).json(slips);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payslips", error: error.message });
  }
};

// ── 8. Bank Payout Export File (NEFT / RTGS for SBI, HDFC, PNB, Master) ──────
export const exportBankPayout = async (req, res) => {
  try {
    const { batchId, bankCode } = req.params;

    const batch = await PayrollBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Payroll batch not found" });
    }

    const slips = await SalarySlip.find({ batch_id: batch._id })
      .sort({ employee_code: 1 });

    const monthStr = MONTH_NAMES[batch.month] || `Month-${batch.month}`;
    const filename = `Payroll_${monthStr}_${batch.year}_${bankCode.toUpperCase()}.csv`;

    let csvContent = "";

    if (bankCode === "sbi") {
      // ── SBI Corporate Internet Banking (CMP / Direct Credit / NEFT) Format ──
      // Columns: Record_Type, Beneficiary_Code, Beneficiary_Account_No, Amount, Beneficiary_Name, IFSC, Narration, Sender_Account, Email, Mobile
      const headers = [
        "Record Type",
        "Beneficiary Code",
        "Beneficiary Account Number",
        "Amount (INR)",
        "Beneficiary Name",
        "IFSC Code",
        "Narration",
        "Sender Account Number",
        "Email",
        "Mobile Number",
      ];
      csvContent += headers.join(",") + "\r\n";

      slips.forEach((s) => {
        const isInternalSBI = (s.bank_ifsc || "").toUpperCase().startsWith("SBIN");
        const recordType = isInternalSBI ? "INTERNAL" : "NEFT";
        const row = [
          recordType,
          `"${s.employee_code}"`,
          `"${s.bank_account_no}"`,
          s.net_salary.toFixed(2),
          `"${s.employee_name}"`,
          `"${s.bank_ifsc || "SBIN0001234"}"`,
          `"Salary ${monthStr} ${batch.year}"`,
          `"38920199201"`, // School Master Account Number
          `"${s.employee_code.toLowerCase()}@school.com"`,
          `"9876543210"`,
        ];
        csvContent += row.join(",") + "\r\n";
      });
    } else if (bankCode === "hdfc") {
      // ── HDFC Corporate Enet Bulk Upload Format ──
      // Columns: Transaction Type, Beneficiary Account No, Amount, Beneficiary Name, Payment Details, IFSC Code, Email ID, Mobile
      const headers = [
        "Transaction Type",
        "Beneficiary Account No",
        "Amount",
        "Beneficiary Name",
        "Payment Details",
        "IFSC Code",
        "Email ID",
        "Mobile",
      ];
      csvContent += headers.join(",") + "\r\n";

      slips.forEach((s) => {
        const isInternalHDFC = (s.bank_ifsc || "").toUpperCase().startsWith("HDFC");
        const txType = isInternalHDFC ? "FT" : "NEFT";
        const row = [
          txType,
          `"${s.bank_account_no}"`,
          s.net_salary.toFixed(2),
          `"${s.employee_name}"`,
          `"Salary ${monthStr} ${batch.year}"`,
          `"${s.bank_ifsc || "HDFC0001234"}"`,
          `"${s.employee_code.toLowerCase()}@school.com"`,
          `"9876543210"`,
        ];
        csvContent += row.join(",") + "\r\n";
      });
    } else if (bankCode === "pnb") {
      // ── Punjab National Bank (PNB) Corporate Internet Banking Format ──
      // Columns: Beneficiary Name, Account Number, IFSC Code, Transaction Amount, Remarks, Customer Reference
      const headers = [
        "Beneficiary Name",
        "Account Number",
        "IFSC Code",
        "Transaction Amount",
        "Remarks",
        "Customer Reference",
      ];
      csvContent += headers.join(",") + "\r\n";

      slips.forEach((s) => {
        const row = [
          `"${s.employee_name}"`,
          `"${s.bank_account_no}"`,
          `"${s.bank_ifsc || "PUNB0123400"}"`,
          s.net_salary.toFixed(2),
          `"Salary for ${monthStr} ${batch.year}"`,
          `"${s.employee_code}"`,
        ];
        csvContent += row.join(",") + "\r\n";
      });
    } else {
      // ── Master Payroll Register (Complete Audit Sheet) ──
      const headers = [
        "Sr No",
        "Slip No",
        "Emp Code",
        "Staff Name",
        "Staff Type",
        "Department",
        "Designation",
        "Bank Name",
        "Account No",
        "IFSC Code",
        "PAN",
        "UAN",
        "PF Acc No",
        "ESI No",
        "Calendar Days",
        "Worked Days",
        "LOP Days",
        "Payable Days",
        "Basic Salary",
        "DA",
        "HRA",
        "Conveyance",
        "Medical",
        "Special Allow",
        "Bonus",
        "Gross Earnings",
        "EPF Employee (12%)",
        "EPF Employer (12%)",
        "ESI Employee (0.75%)",
        "ESI Employer (3.25%)",
        "Prof Tax (PT)",
        "TDS",
        "LOP Deduction",
        "Other Deductions",
        "Total Deductions",
        "Net Salary",
        "Payment Status",
      ];
      csvContent += headers.join(",") + "\r\n";

      slips.forEach((s, idx) => {
        const row = [
          idx + 1,
          `"${s.slip_number}"`,
          `"${s.employee_code}"`,
          `"${s.employee_name}"`,
          `"${s.staff_type === "teaching_staff" ? "Teaching" : "Non-Teaching"}"`,
          `"${s.department}"`,
          `"${s.designation}"`,
          `"${s.bank_name}"`,
          `"${s.bank_account_no}"`,
          `"${s.bank_ifsc}"`,
          `"${s.pan_number}"`,
          `"${s.uan_number}"`,
          `"${s.pf_account_no}"`,
          `"${s.esi_number}"`,
          s.calendar_days,
          s.present_days,
          s.lop_days,
          s.payable_days,
          s.basic_salary,
          s.da,
          s.hra,
          s.conveyance_allowance,
          s.medical_allowance,
          s.special_allowance,
          s.bonus,
          s.gross_earnings,
          s.epf_employee,
          s.epf_employer,
          s.esi_employee,
          s.esi_employer,
          s.professional_tax,
          s.tds,
          s.lop_deduction,
          s.other_deductions,
          s.total_deductions,
          s.net_salary,
          `"${s.status}"`,
        ];
        csvContent += row.join(",") + "\r\n";
      });
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: "Failed to export bank payout file", error: error.message });
  }
};

