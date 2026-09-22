import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Film,
  GraduationCap,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  createContent,
  deleteContent,
  getContent,
  togglePublish,
  updateContent,
} from "../../api/learningService";
import { setupService } from "../../api/setupService";
import API from "../../api/api";
import { FeatureHelpButton } from "../../components/FeatureHelpModal";

const CONTENT_TYPES = [
  { value: "video", label: "Video", icon: Film, badge: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "audio", label: "Audio", icon: Headphones, badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "image", label: "Diagram / Infographic", icon: ImageIcon, badge: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "document", label: "E-Book / PDF Doc", icon: FileText, badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

const ACCEPT_MAP = {
  video: "video/mp4,video/webm,video/quicktime,video/x-msvideo",
  audio: "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/x-m4a",
  image: "image/jpeg,image/png,image/webp,image/gif",
  document:
    "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
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
  const IconComponent = typeInfo.icon;

  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:shadow-md">
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${typeInfo.badge}`}
            >
              <IconComponent size={11} />
              {typeInfo.label}
            </span>

            {item.subject && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                {item.subject}
              </span>
            )}
          </div>

          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              item.is_published
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {item.is_published ? "Live On Portal" : "Draft"}
          </span>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</h4>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {item.description || "No summary provided for this resource."}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50/70 p-2.5 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Class Access:</span>
            <span className="font-semibold text-slate-700 truncate max-w-[150px]">
              {item.class_ids?.length
                ? item.class_ids.map((c) => c.name || c).join(", ")
                : "All Campus Grades"}
            </span>
          </div>

          {item.duration && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Duration:</span>
              <span className="font-semibold text-slate-700">
                {Math.floor(item.duration / 60)}m {item.duration % 60}s
              </span>
            </div>
          )}

          {item.file_size && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">File Size:</span>
              <span className="font-semibold text-slate-700">{fmtSize(item.file_size)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 border-t border-slate-100 bg-slate-50/50 p-2 text-xs">
        <button
          type="button"
          onClick={() => onPublish(item._id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 font-bold text-slate-700 hover:bg-white transition"
        >
          {item.is_published ? (
            <>
              <EyeOff size={13} className="text-amber-600" />
              <span>Unpublish</span>
            </>
          ) : (
            <>
              <Eye size={13} className="text-emerald-600" />
              <span>Publish</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => onEdit(item)}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl py-1.5 font-bold text-slate-700 hover:bg-white transition"
        >
          <Pencil size={13} className="text-cyan-600" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(item._id)}
          className="flex items-center justify-center rounded-xl p-1.5 text-rose-500 hover:bg-rose-50 transition"
          title="Delete resource"
        >
          <Trash2 size={14} />
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
  const [searchQuery, setSearchQuery] = useState("");
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
      setItems(filtered || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [filterType, filterPublished]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const subj = item.subject?.toLowerCase() || "";
      const desc = item.description?.toLowerCase() || "";
      return title.includes(q) || subj.includes(q) || desc.includes(q);
    });
  }, [items, searchQuery]);

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
      content_type: item.content_type || "video",
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
          data.type === "video"
            ? "video"
            : data.type === "audio"
            ? "audio"
            : data.type === "document"
            ? "document"
            : "image",
      }));
    } catch (err) {
      setUploadError(err?.response?.data?.message || "File upload failed.");
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
      alert(err?.response?.data?.message || "Failed to save learning content.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id) => {
    await togglePublish(id);
    loadContent();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this learning resource?")) return;
    await deleteContent(id);
    loadContent();
  };

  const liveCount = items.filter((i) => i.is_published).length;
  const draftCount = items.length - liveCount;

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
                <BookOpen size={12} />
                Digital Learning & Curriculum Repository
              </span>
              <span className="text-xs text-slate-400">Audio-Visual Asset Library</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Learning Goals & Digital Resources
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Curate and publish educational videos, lecture recordings, diagrams, and digital course
              reading materials for enrolled students.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FeatureHelpButton guideKey="admin_learning" label="Resource Guide" />
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 shadow-md active:scale-95"
            >
              <Plus size={16} />
              <span>Upload New Media</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Metric Highlights ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Total Digital Assets</span>
            <Film size={16} className="text-cyan-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-slate-900">{items.length}</p>
            <span className="text-[11px] font-semibold text-slate-500">uploaded items</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Live On Student App</span>
            <Eye size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-emerald-600">{liveCount}</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              accessible
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Draft Content</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-amber-600">{draftCount}</p>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              unlisted
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
            placeholder="Search resources by title, subject or tags..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-cyan-500 focus:outline-none"
          >
            <option value="">All Formats</option>
            {CONTENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-cyan-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="true">Published Live</option>
            <option value="false">Unpublished Drafts</option>
          </select>
        </div>
      </div>

      {/* ── Content Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white py-20 text-slate-400">
          <Loader2 size={32} className="animate-spin text-cyan-600 mb-2" />
          <p className="text-xs font-medium">Scanning educational media library...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <BookOpen size={24} />
          </div>
          <p className="text-sm font-bold text-slate-700">No Learning Resources Found</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Upload videos, podcasts, or documents using the button above to populate the student library.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
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

      {/* ── Upload / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="my-8 w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <Film size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editing ? "Modify Learning Content" : "Upload Educational Resource"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Audio, video, or digital reading files for student portal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Resource Title <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Molecular Biology - Chapter 4 Overview"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Overview / Summary
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Provide brief learning objectives or instructions for students..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Subject Name
                  </label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Physics"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    placeholder="e.g. 360 (for 6 mins)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
                    min={1}
                  />
                </div>
              </div>

              {/* Class access chips */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Class Access Eligibility</label>
                  <span className="text-[10px] text-slate-400">
                    {form.class_ids.length === 0
                      ? "Available to all classes"
                      : `${form.class_ids.length} selected`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {classes.map((c) => {
                    const isSelected = form.class_ids.includes(c._id);
                    return (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => toggleClass(c._id)}
                        className={`rounded-xl border px-3 py-1 text-xs font-bold transition ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-50 text-cyan-800"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                  {classes.length === 0 && (
                    <p className="text-xs text-slate-400">No classes configured yet.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Search Tags <span className="text-[11px] font-normal text-slate-400">(Comma-separated)</span>
                </label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. biology, cell-structure, revision, lab"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 transition"
                />
              </div>

              {/* Media upload container */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  {editing ? "Replace Media Asset (Optional)" : "Select Media Asset *"}
                </label>

                {form.media_url && !uploading ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span className="truncate">
                        Uploaded {form.content_type} file ({fmtSize(Number(form.file_size))})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({
                          ...f,
                          media_url: "",
                          media_key: "",
                          mime_type: "",
                          file_size: "",
                        }));
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-cyan-500 hover:bg-cyan-50/30 disabled:opacity-50 shadow-xs"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={24} className="animate-spin text-cyan-600" />
                        <span className="text-xs font-bold text-slate-700">
                          Uploading and processing media...
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                          <Upload size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Click to upload audio, video or document
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Supports MP4, WebM, MP3, WAV, PDF, DOCX
                          </p>
                        </div>
                      </>
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

                {uploadError && (
                  <p className="text-xs font-semibold text-rose-600">{uploadError}</p>
                )}

                {/* Content Type Selector */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
                  {CONTENT_TYPES.map((t) => {
                    const IconComp = t.icon;
                    const isSelected = form.content_type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, content_type: t.value }));
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-50 text-cyan-800 shadow-xs"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <IconComp size={13} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading || (!form.media_url && !editing)}
                  className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-700 transition disabled:opacity-60 shadow-md shadow-cyan-600/20"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  <span>{editing ? "Save Changes" : "Publish Resource"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
