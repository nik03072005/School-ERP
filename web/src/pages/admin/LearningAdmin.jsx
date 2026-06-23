import { useEffect, useRef, useState } from "react";
import { BookOpen, Eye, EyeOff, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import {
  createContent,
  deleteContent,
  getContent,
  togglePublish,
  updateContent,
} from "../../api/learningService";
import { setupService } from "../../api/setupService";
import API from "../../api/api";

const CONTENT_TYPES = [
  { value: "video", label: "Video", icon: "🎥" },
  { value: "audio", label: "Audio", icon: "🎵" },
  { value: "image", label: "Image", icon: "🖼️" },
  { value: "document", label: "Document", icon: "📄" },
];

const ACCEPT_MAP = {
  video: "video/mp4,video/webm,video/quicktime,video/x-msvideo",
  audio: "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/x-m4a",
  image: "image/jpeg,image/png,image/webp,image/gif",
  document: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const fmtSize = (b) => {
  if (!b) return "";
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
};

const emptyForm = {
  title: "",
  description: "",
  class_ids: [],
  subject: "",
  content_type: "video",
  tags: "",
  duration: "",
  media_url: "",
  media_key: "",
  mime_type: "",
  file_size: "",
};

function ContentCard({ item, onPublish, onEdit, onDelete }) {
  const typeInfo = CONTENT_TYPES.find((t) => t.value === item.content_type) || CONTENT_TYPES[0];
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <span className="text-3xl leading-none">{typeInfo.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate">{item.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {item.subject || "No subject"} ·{" "}
            {item.class_ids?.map((c) => c.name || c).join(", ") || "All classes"}
          </p>
          {item.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
          )}
          <p className="text-[11px] text-slate-300 mt-1">
            {item.created_by?.first_name} {item.created_by?.last_name}
            {item.file_size ? ` · ${fmtSize(item.file_size)}` : ""}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            item.is_published ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {item.is_published ? "Live" : "Draft"}
        </span>
      </div>
      <div className="flex gap-1 border-t border-slate-100 px-3 py-2">
        <button
          onClick={() => onPublish(item._id)}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          {item.is_published ? (
            <><EyeOff size={12} /> Unpublish</>
          ) : (
            <><Eye size={12} /> Publish</>
          )}
        </button>
        <button
          onClick={() => onEdit(item)}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item._id)}
          className="flex items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function LearningAdmin() {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [filterPublished, setFilterPublished] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setupService.listClasses().then((d) => setClasses(d.classes || []));
  }, []);

  useEffect(() => {
    loadContent();
  }, [filterType, filterPublished]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.type = filterType;
      const { content } = await getContent(params);
      const filtered =
        filterPublished === "true"
          ? content.filter((c) => c.is_published)
          : filterPublished === "false"
          ? content.filter((c) => !c.is_published)
          : content;
      setItems(filtered);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setUploadError("");
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item._id);
    setForm({
      title: item.title,
      description: item.description || "",
      class_ids: item.class_ids?.map((c) => c._id || c) || [],
      subject: item.subject || "",
      content_type: item.content_type,
      tags: item.tags?.join(", ") || "",
      duration: item.duration || "",
      media_url: item.media_url,
      media_key: item.media_key || "",
      mime_type: item.mime_type || "",
      file_size: item.file_size || "",
    });
    setUploadError("");
    setShowModal(true);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await API.post("/uploads/learning", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((f) => ({
        ...f,
        media_url: data.url,
        media_key: data.key,
        mime_type: data.mimeType,
        file_size: data.size,
        content_type:
          data.type === "video" ? "video"
          : data.type === "audio" ? "audio"
          : data.type === "document" ? "document"
          : "image",
      }));
    } catch (err) {
      setUploadError(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const toggleClass = (id) => {
    setForm((f) => ({
      ...f,
      class_ids: f.class_ids.includes(id)
        ? f.class_ids.filter((c) => c !== id)
        : [...f.class_ids, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.media_url) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        duration: form.duration ? Number(form.duration) : undefined,
        file_size: form.file_size ? Number(form.file_size) : undefined,
      };
      if (editing) {
        await updateContent(editing, payload);
      } else {
        await createContent(payload);
      }
      setShowModal(false);
      loadContent();
    } catch (err) {
      alert(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id) => {
    await togglePublish(id);
    loadContent();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this content?")) return;
    await deleteContent(id);
    loadContent();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Learning Goals</h1>
          <p className="text-sm text-slate-500">Manage AV content library for students</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition"
        >
          <Plus size={16} /> Upload Content
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">All Types</option>
          {CONTENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
          ))}
        </select>
        <select
          value={filterPublished}
          onChange={(e) => setFilterPublished(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Drafts</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-20 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No learning content yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ContentCard
              key={item._id}
              item={item}
              onPublish={handlePublish}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editing ? "Edit Content" : "Upload Learning Content"}
              </h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Introduction to Photosynthesis"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Brief summary of the content…"
                  className="input w-full resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Subject</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Science"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Duration (seconds)</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    placeholder="e.g. 300 (for 5 min)"
                    className="input w-full"
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className="label">For Classes (multi-select)</label>
                <div className="flex flex-wrap gap-2">
                  {classes.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => toggleClass(c._id)}
                      className={`rounded-xl border px-3 py-1 text-xs font-semibold transition ${
                        form.class_ids.includes(c._id)
                          ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                  {classes.length === 0 && (
                    <p className="text-xs text-slate-400">Leave empty = all classes</p>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">No selection = visible to all classes</p>
              </div>

              <div>
                <label className="label">Tags (comma-separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. biology, plants, chapter3"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">
                  {editing ? "Replace File (optional)" : "Upload File *"}
                </label>
                {form.media_url && !uploading ? (
                  <div className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3">
                    <span className="text-sm font-medium text-green-700 truncate flex-1">
                      {CONTENT_TYPES.find((t) => t.value === form.content_type)?.icon}{" "}
                      {form.content_type} uploaded
                      {form.file_size ? ` · ${fmtSize(Number(form.file_size))}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, media_url: "", media_key: "", mime_type: "", file_size: "" }));
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 hover:bg-slate-100 transition disabled:opacity-60"
                  >
                    {uploading ? (
                      <><Loader2 size={16} className="animate-spin" /> Uploading…</>
                    ) : (
                      <><Upload size={16} /> Click to upload file</>
                    )}
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept={ACCEPT_MAP[form.content_type] || "*"}
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                />
                {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}

                <div className="mt-2 flex gap-1">
                  {CONTENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, content_type: t.value }));
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className={`flex-1 rounded-xl border py-1.5 text-xs font-semibold transition ${
                        form.content_type === t.value
                          ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading || (!form.media_url && !editing)}
                  className="btn-primary"
                >
                  {saving ? "Saving…" : editing ? "Update" : "Save Content"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
