import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Megaphone,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { noticeService } from "../../api/noticeService";
import MediaUpload from "../../components/MediaUpload";
import { FeatureHelpButton } from "../../components/FeatureHelpModal";

const TYPE_CONFIG = {
  general: {
    label: "General Notice",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Megaphone,
  },
  event: {
    label: "Campus Event",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Calendar,
  },
  exam: {
    label: "Exam & Assessment",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: FileSpreadsheet,
  },
  fee: {
    label: "Fee & Finance",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: DollarSign,
  },
  holiday: {
    label: "Holiday / Vacation",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Calendar,
  },
  emergency: {
    label: "Emergency Alert",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: AlertTriangle,
  },
};

const AUDIENCE_CONFIG = {
  all: { label: "Campus-Wide (Everyone)", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  students: { label: "Students Only", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  staff: { label: "Faculty & Staff", color: "bg-orange-50 text-orange-700 border-orange-200" },
  parents: { label: "Parents & Guardians", color: "bg-pink-50 text-pink-700 border-pink-200" },
};

const EMPTY_FORM = {
  title: "",
  content: "",
  type: "general",
  target_audience: "all",
  attachments: [],
  is_pinned: false,
  expires_at: "",
};

export default function NoticesAdmin() {
  const [notices, setNotices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Filters
  const [filterActive, setFilterActive] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filterActive !== "all") params.is_active = filterActive;
      const data = await noticeService.getAllNotices(params);
      setNotices(data.notices || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load institutional notices.");
    } finally {
      setLoading(false);
    }
  }, [filterActive]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      if (filterAudience !== "all" && n.target_audience !== filterAudience) return false;
      if (filterType !== "all" && n.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title?.toLowerCase().includes(q);
        const matchContent = n.content?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent) return false;
      }
      return true;
    });
  }, [notices, filterAudience, filterType, searchQuery]);

  // Stats
  const activeCount = notices.filter((n) => n.is_active).length;
  const pinnedCount = notices.filter((n) => n.is_pinned).length;
  const emergencyCount = notices.filter((n) => n.type === "emergency" && n.is_active).length;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (notice) => {
    setEditing(notice._id);
    setForm({
      title: notice.title,
      content: notice.content,
      type: notice.type || "general",
      target_audience: notice.target_audience || "all",
      attachments: notice.attachments || [],
      is_pinned: !!notice.is_pinned,
      expires_at: notice.expires_at ? new Date(notice.expires_at).toISOString().slice(0, 10) : "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setFormError("Title and content are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...form, expires_at: form.expires_at || null };
      if (editing) {
        await noticeService.updateNotice(editing, payload);
      } else {
        await noticeService.createNotice(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this announcement?")) return;
    try {
      await noticeService.deleteNotice(id);
      setNotices((prev) => prev.filter((n) => n._id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch {
      alert("Failed to delete notice.");
    }
  };

  const handleToggleActive = async (notice) => {
    try {
      const nextActive = !notice.is_active;
      await noticeService.updateNotice(notice._id, { is_active: nextActive });
      setNotices((prev) =>
        prev.map((n) => (n._id === notice._id ? { ...n, is_active: nextActive } : n))
      );
    } catch {
      alert("Failed to update publication status.");
    }
  };

  const handleTogglePin = async (notice) => {
    try {
      const nextPinned = !notice.is_pinned;
      await noticeService.updateNotice(notice._id, { is_pinned: nextPinned });
      setNotices((prev) =>
        prev.map((n) => (n._id === notice._id ? { ...n, is_pinned: nextPinned } : n))
      );
    } catch {
      alert("Failed to toggle pin state.");
    }
  };

  const setFormField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addAttachment = (media) =>
    setForm((f) => ({
      ...f,
      attachments: [...f.attachments, { url: media.url, type: media.type, filename: media.filename }],
    }));

  const removeAttachment = (idx) =>
    setForm((f) => ({ ...f, attachments: f.attachments.filter((_, i) => i !== idx) }));

  return (
    <div className="space-y-6">
      {/* ── Executive Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 p-6 md:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-cyan-500/15 blur-2xl" />
        <div className="pointer-events-none absolute right-40 -bottom-10 h-48 w-48 rounded-full bg-blue-500/15 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Megaphone size={12} />
                Campus Communications Hub
              </span>
              <span className="text-xs text-slate-400">Institutional Notice Board</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Notices & Announcements
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Broadcast verified circulars, academic notices, event bulletins, and urgent emergency
              alerts across students, faculty, and guardians.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FeatureHelpButton guideKey="admin_notices" label="Circular Guide" />
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 shadow-md active:scale-95"
            >
              <Plus size={16} />
              <span>Compose Bulletin</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Total Broadcasts</span>
            <Megaphone size={16} className="text-cyan-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-slate-900">{total}</p>
            <span className="text-[11px] font-semibold text-slate-500">all circulars</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Live / Active</span>
            <Bell size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-emerald-600">{activeCount}</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              currently visible
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Pinned Bulletins</span>
            <Pin size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-amber-600">{pinnedCount}</p>
            <span className="text-[11px] font-semibold text-amber-600">top priority</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Urgent Alerts</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-rose-600">{emergencyCount}</p>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
              action alert
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars by subject, topic or content..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Active status switcher */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
            {[
              ["all", "All"],
              ["true", "Active"],
              ["false", "Archived"],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFilterActive(val)}
                className={[
                  "rounded-lg px-2.5 py-1 transition",
                  filterActive === val
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Audience selector */}
          <select
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
          >
            <option value="all">All Audiences</option>
            <option value="students">Students</option>
            <option value="staff">Staff</option>
            <option value="parents">Parents</option>
          </select>

          {/* Type selector */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
          >
            <option value="all">All Categories</option>
            {Object.entries(TYPE_CONFIG).map(([k, cfg]) => (
              <option key={k} value={k}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Notice Cards List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white py-20 text-slate-400">
          <Loader2 size={32} className="animate-spin text-cyan-600 mb-2" />
          <p className="text-xs font-medium">Loading circulars registry...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <Megaphone size={24} />
          </div>
          <p className="text-sm font-bold text-slate-700">No circulars match current filters</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Try resetting your search query or publish a new official announcement using the Compose button above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotices.map((notice) => {
            const typeInfo = TYPE_CONFIG[notice.type] || TYPE_CONFIG.general;
            const TypeIcon = typeInfo.icon;
            const audienceInfo = AUDIENCE_CONFIG[notice.target_audience] || AUDIENCE_CONFIG.all;
            const isExpired = notice.expires_at && new Date(notice.expires_at) < new Date();

            return (
              <div
                key={notice._id}
                className={[
                  "group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md",
                  notice.is_pinned
                    ? "border-cyan-300 ring-1 ring-cyan-200/60 bg-gradient-to-r from-cyan-50/20 via-white to-white"
                    : "border-slate-200/80",
                  !notice.is_active || isExpired ? "opacity-75 bg-slate-50/50" : "",
                ].join(" ")}
              >
                {/* Pinned top accent */}
                {notice.is_pinned && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
                )}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left content */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {notice.is_pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 text-cyan-800 px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase">
                          <Pin size={10} className="fill-cyan-700" />
                          Pinned
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${typeInfo.color}`}
                      >
                        <TypeIcon size={11} />
                        {typeInfo.label}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${audienceInfo.color}`}
                      >
                        <Users size={11} />
                        {audienceInfo.label}
                      </span>

                      {!notice.is_active ? (
                        <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase">
                          Archived
                        </span>
                      ) : isExpired ? (
                        <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                          Expired
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          Active Broadcast
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {notice.title}
                    </h2>

                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {notice.content}
                    </p>

                    {/* Attachments preview */}
                    {notice.attachments?.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Attached Materials ({notice.attachments.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {notice.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group/att flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-700 transition hover:border-cyan-400 hover:bg-white"
                            >
                              {att.type === "image" ? (
                                <img
                                  src={att.url}
                                  alt={att.filename || "Attachment"}
                                  className="h-6 w-6 rounded-md object-cover border border-slate-200"
                                />
                              ) : (
                                <FileText size={14} className="text-cyan-600" />
                              )}
                              <span className="max-w-[150px] truncate text-[11px] font-medium group-hover/att:text-cyan-700">
                                {att.filename || `File ${idx + 1}`}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meta tags */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span>
                        Published by{" "}
                        <strong className="text-slate-600 font-semibold">
                          {notice.created_by
                            ? `${notice.created_by.first_name} ${notice.created_by.last_name}`
                            : "Administration"}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(notice.published_at || notice.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {notice.expires_at && (
                        <>
                          <span>•</span>
                          <span
                            className={
                              isExpired ? "font-bold text-rose-500" : "font-medium text-amber-600"
                            }
                          >
                            Expires{" "}
                            {new Date(notice.expires_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions toolbar */}
                  <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50/70 p-1">
                    <button
                      type="button"
                      title={notice.is_pinned ? "Unpin circular" : "Pin to top of board"}
                      onClick={() => handleTogglePin(notice)}
                      className={[
                        "rounded-lg p-2 transition",
                        notice.is_pinned
                          ? "bg-cyan-100 text-cyan-800"
                          : "text-slate-500 hover:bg-white hover:text-cyan-700",
                      ].join(" ")}
                    >
                      {notice.is_pinned ? <PinOff size={15} /> : <Pin size={15} />}
                    </button>

                    <button
                      type="button"
                      title={notice.is_active ? "Archive / Deactivate" : "Activate broadcast"}
                      onClick={() => handleToggleActive(notice)}
                      className={[
                        "rounded-lg p-2 transition",
                        notice.is_active
                          ? "text-emerald-700 hover:bg-white"
                          : "text-slate-400 hover:bg-white hover:text-emerald-700",
                      ].join(" ")}
                    >
                      <Bell size={15} />
                    </button>

                    <button
                      type="button"
                      title="Edit bulletin"
                      onClick={() => openEdit(notice)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      title="Permanently remove"
                      onClick={() => handleDelete(notice._id)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Notice Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <Megaphone size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editing ? "Edit Circular Bulletin" : "Compose Official Notice"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Target verified academic or administrative constituencies
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Circular Title / Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setFormField("title", e.target.value)}
                  placeholder="e.g. Schedule for Annual Sports Meet 2026-27"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Detailed Notice Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setFormField("content", e.target.value)}
                  placeholder="Write complete circular details, instructions, or schedules..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Circular Category
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setFormField("type", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
                  >
                    {Object.entries(TYPE_CONFIG).map(([k, cfg]) => (
                      <option key={k} value={k}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Target Audience
                  </label>
                  <select
                    value={form.target_audience}
                    onChange={(e) => setFormField("target_audience", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
                  >
                    <option value="all">Campus-Wide (Students, Staff & Parents)</option>
                    <option value="students">Students Only</option>
                    <option value="staff">Faculty & Staff</option>
                    <option value="parents">Parents & Guardians</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Expiration Date <span className="text-[11px] font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => setFormField("expires_at", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_pinned}
                      onChange={(e) => setFormField("is_pinned", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Pin to top of Bulletin Board</span>
                  </label>
                </div>
              </div>

              {/* Attachments */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">Supporting Attachments</p>
                  <span className="text-[10px] text-slate-400">PDFs, Circulars, Photos</span>
                </div>

                {form.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.attachments.map((a, i) => (
                      <div key={i} className="relative group">
                        {a.type === "image" ? (
                          <img
                            src={a.url}
                            alt={a.filename || "Attachment"}
                            className="h-14 w-14 rounded-xl object-cover border border-slate-200 shadow-xs"
                          />
                        ) : (
                          <div className="flex h-14 w-20 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-1 text-center shadow-xs">
                            <FileText size={16} className="text-cyan-600" />
                            <span className="max-w-full truncate text-[9px] text-slate-500 mt-1 font-medium">
                              {a.filename || "File"}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachment(i)}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <MediaUpload label="Upload Attachment" onUpload={addAttachment} />
              </div>

              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-700 transition disabled:opacity-60 shadow-md shadow-cyan-600/20"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  <span>{editing ? "Save Changes" : "Publish Announcement"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
