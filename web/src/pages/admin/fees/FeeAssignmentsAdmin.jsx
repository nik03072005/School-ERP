import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Send } from "lucide-react";
import { feeService } from "../../../api/feeService";
import { setupService } from "../../../api/setupService";

const STATUS_COLORS = {
  pending: "bg-slate-200 text-slate-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-rose-100 text-rose-700",
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
      setAssignResult(message);
      loadDues();
    } catch (err) {
      setAssignResult(err?.response?.data?.message || "Failed to assign fee structure");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fee Assignments &amp; Dues</h1>
        <p className="text-sm text-slate-500">Assign fee structures to a class/section and track student dues</p>
      </div>

      <div className="panel">
        <p className="mb-3 text-sm font-semibold text-slate-700">Assign a Fee Structure</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <label>Fee Structure</label>
            <select value={assignStructureId} onChange={(e) => setAssignStructureId(e.target.value)}>
              <option value="">Select a fee structure</option>
              {structures.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.class_id?.name} {s.section_id ? `· ${s.section_id.name}` : "· All Sections"} ({s.academic_year}) —{" "}
                  {currency(s.total_annual_amount)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAssign}
            disabled={!assignStructureId || assigning}
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition disabled:opacity-60"
          >
            <Send size={15} /> {assigning ? "Assigning…" : "Assign to Class/Section"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Assigns to every approved student in the structure's class (and section, if set). Students already assigned
          for that academic year are skipped.
        </p>
        {assignResult && <div className="alert success mt-3">{assignResult}</div>}
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="w-auto">
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="w-auto" disabled={!filterClass}>
          <option value="">All Sections</option>
          {sections.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-auto">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" className="mt-0 w-auto" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
          Overdue only
        </label>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : dues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <Users size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No fee assignments match these filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Net Payable</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dues.map((sf) => {
                const student = sf.student_id;
                const name = `${student?.user_id?.first_name || ""} ${student?.user_id?.last_name || ""}`.trim();
                return (
                  <tr key={sf._id}>
                    <td>
                      <p className="font-semibold text-slate-800">{name || "—"}</p>
                      <p className="text-xs text-slate-400">{student?.admission_no}</p>
                    </td>
                    <td>
                      {student?.class_id?.name} {student?.section_id ? `· ${student.section_id.name}` : ""}
                    </td>
                    <td>{currency(sf.net_payable)}</td>
                    <td>{currency(sf.total_paid)}</td>
                    <td className="font-semibold text-slate-800">{currency(sf.total_due)}</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[sf.status] || STATUS_COLORS.pending}`}>
                        {sf.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/admin/fees/students/${student?._id}`)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
                      >
                        View
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
  );
}
