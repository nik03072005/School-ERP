import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { studentService } from "../../api/studentService";

const STATUS_COLORS = {
  present: "bg-green-500",
  late: "bg-amber-400",
  half_day: "bg-orange-400",
  absent: "bg-red-500",
  leave_pending: "bg-blue-400",
  leave_approved: "bg-indigo-400",
};

const STATUS_BADGE = {
  present: "bg-green-100 text-green-700",
  late: "bg-amber-100 text-amber-700",
  half_day: "bg-orange-100 text-orange-700",
  absent: "bg-red-100 text-red-700",
  leave_pending: "bg-blue-100 text-blue-700",
  leave_approved: "bg-indigo-100 text-indigo-700",
};

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

export default function StudentAttendance() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

  useEffect(() => {
    setLoading(true);
    setError("");
    studentService
      .getMyAttendance({
        from_date: isoDate(monthStart),
        to_date: isoDate(monthEnd),
        checkpoint: "start",
      })
      .then(setData)
      .catch((err) => setError(err?.response?.data?.message || "Failed to load attendance"))
      .finally(() => setLoading(false));
  }, [viewDate.getFullYear(), viewDate.getMonth()]);

  const dayMap = useMemo(() => {
    const map = {};
    (data?.records || []).forEach((r) => {
      const key = new Date(r.attendance_date).toISOString().slice(0, 10);
      map[key] = r.status;
    });
    return map;
  }, [data]);

  const summary = data?.summary || {};
  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  const present = (summary.present || 0) + (summary.late || 0);
  const pct = total ? Math.round((present / total) * 100) : null;

  const daysInMonth = monthEnd.getDate();
  const firstDow = monthStart.getDay();

  const prevMonth = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
            <CalendarCheck2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Attendance</h1>
            <p className="text-sm text-slate-500">
              {data?.student?.class_id?.name
                ? `${data.student.class_id.name} – ${data.student.section_id?.name || ""}`
                : "Loading class info…"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[
          { key: "present", label: "Present", color: "text-green-700 bg-green-50" },
          { key: "late", label: "Late", color: "text-amber-700 bg-amber-50" },
          { key: "half_day", label: "Half Day", color: "text-orange-700 bg-orange-50" },
          { key: "absent", label: "Absent", color: "text-red-700 bg-red-50" },
          { key: "leave_approved", label: "Leave", color: "text-indigo-700 bg-indigo-50" },
        ].map(({ key, label, color }) => (
          <div
            key={key}
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <span className={`rounded-lg px-2 py-0.5 text-xl font-bold ${color}`}>
              {summary[key] || 0}
            </span>
            <span className="mt-1 text-[11px] text-slate-500">{label}</span>
          </div>
        ))}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-600 p-3 shadow-sm text-white">
          <span className="text-xl font-bold">{pct !== null ? `${pct}%` : "—"}</span>
          <span className="mt-1 text-[11px] text-indigo-200">Rate</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-sm font-bold text-slate-800">
            {viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
          <button
            onClick={nextMonth}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day labels */}
        <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const key = isoDate(
                new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
              );
              const status = dayMap[key];
              const isToday = key === isoDate(new Date());
              return (
                <div
                  key={day}
                  className={`relative flex flex-col items-center py-2 ${
                    isToday ? "rounded-xl bg-indigo-50" : ""
                  }`}
                >
                  <span
                    className={`text-xs font-medium ${
                      isToday ? "text-indigo-700" : "text-slate-700"
                    }`}
                  >
                    {day}
                  </span>
                  {status && (
                    <span
                      className={`mt-1 h-1.5 w-1.5 rounded-full ${STATUS_COLORS[status]}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          {Object.entries(STATUS_COLORS).map(([key, cls]) => (
            <span key={key} className="flex items-center gap-1.5 text-[11px] text-slate-500 capitalize">
              <span className={`h-2 w-2 rounded-full ${cls}`} />
              {key.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </div>

      {/* Recent records list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-800">Attendance Records</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-indigo-500" />
          </div>
        ) : (data?.records || []).length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No records for this month</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Day</th>
                  <th className="px-4 py-3 text-left font-semibold">Session</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data.records || []).map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {new Date(r.attendance_date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {new Date(r.attendance_date).toLocaleDateString("en-IN", {
                        weekday: "short",
                      })}
                    </td>
                    <td className="px-4 py-2.5 capitalize text-slate-500">{r.checkpoint}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[r.status] || "bg-slate-100 text-slate-500"}`}
                      >
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{r.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
