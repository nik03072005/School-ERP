import { useCallback, useEffect, useState } from "react";
import { Bell, Loader2, Megaphone, Pencil, Pin, PinOff, Plus, Trash2, X } from "lucide-react";
import { noticeService } from "../../api/noticeService";
import MediaUpload from "../../components/MediaUpload";

const TYPE_COLORS = {
  general: "bg-slate-100 text-slate-700",
  event: "bg-purple-100 text-purple-700",
  exam: "bg-blue-100 text-blue-700",
  fee: "bg-amber-100 text-amber-700",
  holiday: "bg-green-100 text-green-700",
  emergency: "bg-red-100 text-red-700",
};

const AUDIENCE_COLORS = {
  all: "bg-cyan-100 text-cyan-700",
  students: "bg-indigo-100 text-indigo-700",
  staff: "bg-orange-100 text-orange-700",
  parents: "bg-pink-100 text-pink-700",
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
  const [filterActive, setFilterActive] = useState("all");

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
      setError(err?.response?.data?.message || "Failed to load notices.");
    } finally {
      setLoading(false);
    }
  }, [filterActive]);

  useEffect(() => {
    load();
  }, [load]);

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
      type: notice.type,
      target_audience: notice.target_audience,
      attachments: notice.attachments || [],
      is_pinned: notice.is_pinned,
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
      setFormError(err?.response?.data?.message || "Failed to save notice.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this notice?")) return;
    try {
      await noticeService.deleteNotice(id);
      setNotices((prev) => prev.filter((n) => n._id !== id));
    } catch {
      alert("Failed to delete notice.");
    }
  };

  const handleToggleActive = async (notice) => {
    try {
      await noticeService.updateNotice(notice._id, { is_active: !notice.is_active });
      setNotices((prev) =>
        prev.map((n) => (n._id === notice._id ? { ...n, is_active: !notice.is_active } : n))
      );
    } catch {
      alert("Failed to update notice.");
    }
  };

  const handleTogglePin = async (notice) => {
    try {
      await noticeService.updateNotice(notice._id, { is_pinned: !notice.is_pinned });
      setNotices((prev) =>
        prev.map((n) => (n._id === notice._id ? { ...n, is_pinned: !notice.is_pinned } : n))
      );
    } catch {
      alert("Failed to update notice.");
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addAttachment = (media) =>
    setForm((f) => ({
      ...f,
      attachments: [...f.attachments, { url: media.url, type: media.type, filename: media.filename }],
    }));

  const removeAttachment = (idx) =>
    setForm((f) => ({ ...f, attachments: f.attachments.filter((_, i) => i !== idx) }));

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Notices & Announcements</h2>
          <p className="mt-1 text-sm text-slate-500">Publish announcements visible to students, staff, or everyone.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          <Plus size={16} /> New Notice
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[["all", "All"], ["true", "Active"], ["false", "Inactive"]].map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setFilterActive(val)}
            className={[
              "rounded-xl px-3 py-1.5 text-sm font-medium transition",
              filterActive === val
                ? "bg-cyan-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto self-center text-sm text-slate-500">{total} notices</span>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Notice cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
          <Megaphone size={36} className="opacity-30" />
          <p className="text-sm">No notices found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice._id}
              className={[
                "rounded-2xl border bg-white p-4 shadow-sm",
                notice.is_pinned ? "border-cyan-200" : "border-slate-200",
                !notice.is_active ? "opacity-60" : "",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                {notice.is_pinned && (
                  <Pin size={14} className="mt-1 shrink-0 text-cyan-500" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800">{notice.title}</h3>
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TYPE_COLORS[notice.type]}`}>
                      {notice.type}
                    </span>
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${AUDIENCE_COLORS[notice.target_audience]}`}>
                      {notice.target_audience}
                    </span>
                    {!notice.is_active && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                        inactive
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">{notice.content}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span>
                      By {notice.created_by?.first_name} {notice.created_by?.last_name}
                    </span>
                    <span>
                      {new Date(notice.published_at || notice.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
                    {notice.expires_at && (
                      <span className="text-amber-600">
                        Expires {new Date(notice.expires_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                    {notice.attachments?.length > 0 && (
                      <span>{notice.attachments.length} attachment{notice.attachments.length > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title={notice.is_pinned ? "Unpin" : "Pin"}
                    onClick={() => handleTogglePin(notice)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-cyan-600"
                  >
                    {notice.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
                  <button
                    type="button"
                    title={notice.is_active ? "Deactivate" : "Activate"}
                    onClick={() => handleToggleActive(notice)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
                  >
                    <Bell size={14} />
                  </button>
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => openEdit(notice)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => handleDelete(notice._id)}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-800">
                {editing ? "Edit Notice" : "New Notice"}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="max-h-[75vh] overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Notice title"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => set("content", e.target.value)}
                  placeholder="Write the announcement…"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => set("type", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    {["general", "event", "exam", "fee", "holiday", "emergency"].map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Audience</label>
                  <select
                    value={form.target_audience}
                    onChange={(e) => set("target_audience", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    {["all", "students", "staff", "parents"].map((a) => (
                      <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Expires on (optional)</label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => set("expires_at", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.is_pinned}
                      onChange={(e) => set("is_pinned", e.target.checked)}
                      className="h-4 w-4 rounded accent-cyan-600"
                    />
                    Pin this notice
                  </label>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">Attachments</p>
                {form.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {form.attachments.map((a, i) => (
                      <div key={i} className="relative">
                        {a.type === "image" ? (
                          <img src={a.url} alt={a.filename} className="h-14 w-14 rounded-lg object-cover border border-slate-200" />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] text-slate-500">
                            Video
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachment(i)}
                          className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow text-slate-400 hover:text-red-500 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <MediaUpload label="Add Attachment" onUpload={addAttachment} />
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{formError}</div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editing ? "Save Changes" : "Publish Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
