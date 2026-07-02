// Shared fee math used by studentFeeController and feePaymentController.
// Read-only endpoints call recomputeStudentFeeTotals() on the fetched document but
// never .save() it, so overdue status / late fees stay live without writing on every GET.
// Payment/cancel endpoints call the same function and then .save(), which is the only
// time a computed late fee actually gets persisted.

export const buildInstallmentsFromStructure = (feeStructure, netPayable) => {
  const plans = feeStructure.installments || [];
  if (plans.length === 0) {
    return [
      {
        name: "Full Payment",
        due_date: new Date(),
        amount_due: netPayable,
        amount_paid: 0,
        late_fee_applied: 0,
        status: "pending",
        paid_date: null,
      },
    ];
  }

  let allocated = 0;
  const installments = plans.map((plan, index) => {
    const isLast = index === plans.length - 1;
    const amount = isLast
      ? Math.round((netPayable - allocated) * 100) / 100
      : Math.round(netPayable * (plan.percentage / 100) * 100) / 100;
    allocated += amount;

    return {
      name: plan.name,
      due_date: plan.due_date,
      amount_due: amount,
      amount_paid: 0,
      late_fee_applied: 0,
      status: "pending",
      paid_date: null,
    };
  });

  return installments;
};

const countUnits = (dueDate, today, frequency) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLate = Math.floor((today - dueDate) / msPerDay);
  if (daysLate <= 0) return 0;
  if (frequency === "per_day") return daysLate;
  if (frequency === "per_month") return Math.floor(daysLate / 30) + 1;
  return 1; // once
};

// Pure function — does not mutate the installment. Returns the live status and late fee.
export const computeInstallmentStatus = (installment, lateFeePolicy, today = new Date()) => {
  if (installment.status === "waived") {
    return { status: "waived", lateFee: installment.late_fee_applied || 0 };
  }

  const dueDate = new Date(installment.due_date);
  const paid = installment.amount_paid || 0;
  const graceDays = lateFeePolicy?.grace_days || 0;
  const gracedDueDate = new Date(dueDate.getTime() + graceDays * 24 * 60 * 60 * 1000);
  const isPastDue = today > gracedDueDate;

  let lateFee = installment.late_fee_applied || 0;
  if (isPastDue && paid < installment.amount_due && lateFeePolicy?.enabled) {
    const units = countUnits(gracedDueDate, today, lateFeePolicy.penalty_frequency);
    lateFee =
      lateFeePolicy.penalty_type === "percentage"
        ? (installment.amount_due * lateFeePolicy.penalty_value) / 100
        : lateFeePolicy.penalty_value;
    lateFee *= units || 1;
    if (lateFeePolicy.max_penalty > 0) lateFee = Math.min(lateFee, lateFeePolicy.max_penalty);
    lateFee = Math.round(lateFee * 100) / 100;
  }

  const totalDue = installment.amount_due + lateFee;
  let status;
  if (paid >= totalDue && totalDue > 0) status = "paid";
  else if (paid > 0) status = isPastDue ? "overdue" : "partial";
  else status = isPastDue ? "overdue" : "pending";

  return { status, lateFee };
};

// Mutates studentFee.installments/total_paid/total_due/status in place. Caller decides
// whether to .save() (payment/cancel flows) or just serialize the in-memory result (GET flows).
export const recomputeStudentFeeTotals = (studentFee, feeStructure) => {
  const lateFeePolicy = feeStructure?.late_fee_policy;
  let totalPaid = 0;
  let totalDue = 0;
  let anyOverdue = false;
  let allPaid = true;

  studentFee.installments.forEach((installment) => {
    const { status, lateFee } = computeInstallmentStatus(installment, lateFeePolicy);
    installment.late_fee_applied = lateFee;
    installment.status = status;

    totalPaid += installment.amount_paid || 0;
    const remaining = Math.max(0, installment.amount_due + lateFee - (installment.amount_paid || 0));
    totalDue += remaining;

    if (status === "overdue") anyOverdue = true;
    if (status !== "paid" && status !== "waived") allPaid = false;
  });

  studentFee.total_paid = Math.round(totalPaid * 100) / 100;
  studentFee.total_due = Math.round(totalDue * 100) / 100;

  if (allPaid) studentFee.status = "paid";
  else if (anyOverdue) studentFee.status = "overdue";
  else if (totalPaid > 0) studentFee.status = "partial";
  else studentFee.status = "pending";

  return studentFee;
};
