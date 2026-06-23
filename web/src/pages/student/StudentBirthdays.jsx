import { useEffect, useMemo, useState } from "react";
import { Cake, ChevronLeft, ChevronRight, Loader2, PartyPopper, Search } from "lucide-react";
import { studentService } from "../../api/studentService";
import { useAuth } from "../../context/AuthContext";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CLASS_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-orange-100 text-orange-700",
];

const initials = (first, last) =>
  [(first || "")[0], (last || "")[0]].filter(Boolean).join("").toUpperCase() || "?";

const colorFor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return CLASS_COLORS[Math.abs(h) % CLASS_COLORS.length];
};

export default function StudentBirthdays() {
  const { user } = useAuth();
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewDate, setViewDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("calendar");

  useEffect(() => {
    studentService
      .getBirthdays()
      .then((d) => setBirthdays(d.birthdays || []))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load birthdays"))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const todayD = today.getDate();
  const todayM = today.getMonth() + 1;

  const viewMonth = viewDate.getMonth() + 1;
  const viewYear = viewDate.getFullYear();

  const thisMonthBirthdays = useMemo(
    () => birthdays.filter((b) => b.month === viewMonth).sort((a, b) => a.day - b.day),
    [birthdays, viewMonth]
  );

  const todayBirthdays = useMemo(
    () => birthdays.filter((b) => b.is_today),
    [birthdays]
  );

  const upcomingBirthdays = useMemo(
    () => birthdays.filter((b) => b.days_until > 0 && b.days_until <= 30),
    [birthdays]
  );

  const filteredBirthdays = useMemo(() => {
    const q = search.toLowerCase();
    return birthdays.filter(
      (b) =>
        !q ||
        `${b.first_name} ${b.last_name}`.toLowerCase().includes(q) ||
        b.class_name?.toLowerCase().includes(q)
    );
  }, [birthdays, search]);

  // Build calendar day → [students]
  const calDayMap = useMemo(() => {
    const map = {};
    thisMonthBirthdays.forEach((b) => {
      if (!map[b.day]) map[b.day] = [];
      map[b.day].push(b);
    });
    return map;
  }, [thisMonthBirthdays]);

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-pink-50 p-3 text-pink-500">
              <Cake size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Birthday Calendar</h1>
              <p className="text-sm text-slate-500">
                {birthdays.length} students · {todayBirthdays.length} celebrating today
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["calendar", "upcoming", "all"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-xl px-4 py-1.5 text-xs font-semibold capitalize transition ${
                  tab === t
                    ? "bg-pink-500 text-white shadow-sm"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t === "upcoming" ? "Upcoming (30d)" : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-pink-400" />
        </div>
      ) : (
        <>
          {/* Today's birthdays — always visible */}
          {todayBirthdays.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-pink-500 via-rose-500 to-orange-400 p-5 text-white shadow-lg">
              <div className="pointer-events-none absolute right-0 top-0 select-none text-[120px] leading-none opacity-10">
                🎂
              </div>
              <div className="relative z-10">
                <div className="mb-3 flex items-center gap-2">
                  <PartyPopper size={18} />
                  <span className="text-sm font-bold uppercase tracking-wide">
                    🎉 Celebrating Today!
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {todayBirthdays.map((b) => (
                    <div
                      key={b._id}
                      className="flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 backdrop-blur-sm"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/30 text-xs font-bold">
                        {initials(b.first_name, b.last_name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {b.first_name} {b.last_name}
                        </p>
                        <p className="text-[11px] text-white/70">
                          {b.class_name}{b.section_name ? ` – ${b.section_name}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Calendar tab */}
          {tab === "calendar" && (
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              {/* Calendar grid */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    onClick={prevMonth}
                    className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <p className="text-base font-bold text-slate-800">
                    {MONTHS[viewMonth - 1]} {viewYear}
                  </p>
                  <button
                    onClick={nextMonth}
                    className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="py-1">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const bdays = calDayMap[day] || [];
                    const isToday = day === todayD && viewMonth === todayM;
                    const hasBirthday = bdays.length > 0;
                    return (
                      <div
                        key={day}
                        className={`group relative flex flex-col items-center py-2 rounded-xl transition ${
                          isToday ? "bg-pink-50" : hasBirthday ? "hover:bg-slate-50" : ""
                        }`}
                      >
                        <span
                          className={`text-xs font-medium ${
                            isToday ? "font-bold text-pink-600" : "text-slate-700"
                          }`}
                        >
                          {day}
                        </span>
                        {hasBirthday && (
                          <span className="mt-0.5 text-[10px]">🎂</span>
                        )}
                        {/* Tooltip on hover */}
                        {hasBirthday && (
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-max max-w-[160px] -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-lg group-hover:block">
                            {bdays.map((b) => (
                              <p key={b._id} className="text-[11px] font-medium text-slate-800">
                                {b.first_name} {b.last_name}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* This month's list */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {MONTHS[viewMonth - 1]} Birthdays
                    <span className="ml-2 rounded-full bg-pink-100 px-2 py-0.5 text-xs font-bold text-pink-600">
                      {thisMonthBirthdays.length}
                    </span>
                  </p>
                </div>
                {thisMonthBirthdays.length === 0 ? (
                  <p className="py-12 text-center text-sm text-slate-400">
                    No birthdays this month
                  </p>
                ) : (
                  <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
                    {thisMonthBirthdays.map((b) => {
                      const isTodayBday = b.day === todayD && viewMonth === todayM;
                      return (
                        <BirthdayRow key={b._id} b={b} highlight={isTodayBday} />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upcoming tab */}
          {tab === "upcoming" && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-sm font-semibold text-slate-800">
                  Upcoming Birthdays – Next 30 Days
                  <span className="ml-2 rounded-full bg-pink-100 px-2 py-0.5 text-xs font-bold text-pink-600">
                    {upcomingBirthdays.length}
                  </span>
                </p>
              </div>
              {upcomingBirthdays.length === 0 ? (
                <p className="py-16 text-center text-sm text-slate-400">
                  No upcoming birthdays in the next 30 days
                </p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {upcomingBirthdays.map((b) => (
                    <BirthdayRow key={b._id} b={b} showDaysUntil />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All tab */}
          {tab === "all" && (
            <div className="space-y-3">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or class…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    All Students · Sorted by Upcoming
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      {filteredBirthdays.length}
                    </span>
                  </p>
                </div>
                {filteredBirthdays.length === 0 ? (
                  <p className="py-12 text-center text-sm text-slate-400">No students found</p>
                ) : (
                  <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                    {filteredBirthdays.map((b) => (
                      <BirthdayRow key={b._id} b={b} showDaysUntil showYear />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BirthdayRow({ b, highlight, showDaysUntil, showYear }) {
  const avatarColor = colorFor(`${b.first_name}${b.last_name}`);
  const classColor = colorFor(b.class_name || "");

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${
        highlight ? "bg-pink-50" : "hover:bg-slate-50"
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor}`}
      >
        {initials(b.first_name, b.last_name)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-slate-900">
            {b.first_name} {b.last_name}
          </p>
          {highlight && <span className="text-base">🎂</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {b.class_name && (
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${classColor}`}>
              {b.class_name}{b.section_name ? ` – ${b.section_name}` : ""}
            </span>
          )}
          {b.roll_no && (
            <span className="text-[11px] text-slate-400">Roll #{b.roll_no}</span>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-slate-800">
          {String(b.day).padStart(2, "0")}{" "}
          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][b.month - 1]}
          {showYear && b.birth_year ? ` ${b.birth_year}` : ""}
        </p>
        {showDaysUntil && (
          <p className="text-[11px] font-medium text-pink-500">
            {b.days_until === 0 ? "🎉 Today!" : `in ${b.days_until}d`}
          </p>
        )}
      </div>
    </div>
  );
}
