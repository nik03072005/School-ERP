import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Send, CheckCircle2, AlertCircle, ArrowRight, Filter, Search } from "lucide-react";
import { feeService } from "../../../api/feeService";
import { setupService } from "../../../api/setupService";

const STATUS_COLORS = {
  pending: "bg-slate-100 text-slate-700 border border-slate-200",
  partial: "bg-amber-50 text-amber-800 border border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  overdue: "bg-rose-50 text-rose-700 border border-rose-200",
};

const currency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function FeeAssignmentsAdmin() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [structures, setStructures] = useState([]);

  const [assignStructureId, setAssignStructureId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState("");

  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupService.listClasses().then((d) => setClasses(d.classes || []));
    feeService.getFeeStructures().then((d) => setStructures(d.structures || []));
  }, []);

  useEffect(() => {
    if (!filterClass) {
      setSections([]);
      setFilterSection("");
      return;
    }
    setupService.listSections({ class_id: filterClass }).then((d) => setSections(d.sections || []));
  }, [filterClass]);

  useEffect(() => {
    loadDues();
  }, [filterClass, filterSection, filterStatus, overdueOnly]);

  const loadDues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterClass) params.class_id = filterClass;
      if (filterSection) params.section_id = filterSection;
      if (filterStatus) params.status = filterStatus;
      if (overdueOnly) params.overdue_only = "true";
      const { studentFees } = await feeService.getDues(params);
      setDues(studentFees || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignStructureId) return;
    setAssigning(true);
    setAssignResult("");
    try {
      const { message } = await feeService.assignFeeStructure({ fee_structure_id: assignStructureId });
      setAssignResult(message || "Fee structure assigned successfully.");
      loadDues();
    } catch (err) {
      setAssignResult(err?.response?.data?.message || "Failed to assign fee structure");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <Users size={15} />
            Student Fee Accounts
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Fee Assignments &amp; Dues
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Batch-enroll students into class fee structures and track collection balances in real-time.
          </p>
        </div>
      </div>

      {/* ── Batch Assign Action Card ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Send size={15} className="text-cyan-600" />
          <h3 className="font-extrabold text-slate-900 text-sm">Batch Assign Fee Structure</h3>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <label className="text-xs font-bold text-slate-700">Target Fee Structure</label>
            <select
              value={assignStructureId}
              onChange={(e) => setAssignStructureId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:bg-white"
            >
              <option value="">Select a structure to assign</option>
              {structures.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.class_id?.name} {s.section_id ? `· ${s.section_id.name}` : "· All Sections"} ({s.academic_year}) —{" "}
                  {currency(s.total_annual_amount)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAssign}
            disabled={!assignStructureId || assigning}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-cyan-600/30 hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-50"
          >
            <Send size={14} />
            <span>{assigning ? "Assigning Students..." : "Assign to Class/Section"}</span>
          </button>
        </div>

        <p className="mt-2 text-[11px] text-slate-400">
          This assigns the schedule to every approved student in the matching class. Existing assignments for that academic year are preserved.
        </p>

        {assignResult && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>{assignResult}</span>
          </div>
        )}
      </div>

      {/* ── Filters Toolbar ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-44">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="mt-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
            >
              <option value="">All Academic Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-40">
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              disabled={!filterClass}
              className="mt-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white disabled:opacity-50"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-36">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pl-1">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-rose-600"
            />
            <span className="text-rose-600">Only Overdue Dues</span>
          </label>
        </div>
      </div>

      {/* ── Dues Ledger Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-cyan-600 border-t-transparent mx-auto" />
            <p className="mt-2 text-xs font-bold text-slate-500">Loading student dues ledger...</p>
          </div>
        ) : dues.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium">No fee assignments match the active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-4 py-3">Class & Section</th>
                  <th className="px-4 py-3">Net Payable</th>
                  <th className="px-4 py-3">Total Paid</th>
                  <th className="px-4 py-3">Balance Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {dues.map((sf) => {
                  const student = sf.student_id;
                  const name = `${student?.user_id?.first_name || ""} ${student?.user_id?.last_name || ""}`.trim();
                  return (
                    <tr key={sf._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{name || "—"}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{student?.admission_no || "—"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {student?.class_id?.name} {student?.section_id ? `· ${student.section_id.name}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{currency(sf.net_payable)}</td>
                      <td className="px-4 py-3.5 text-emerald-700 font-semibold">{currency(sf.total_paid)}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{currency(sf.total_due)}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            STATUS_COLORS[sf.status] || STATUS_COLORS.pending
                          }`}
                        >
                          {sf.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/fees/students/${student?._id}`)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-cyan-700"
                        >
                          <span>Ledger</span>
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
