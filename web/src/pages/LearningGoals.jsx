import { useEffect, useRef, useState } from "react";
import { BookOpen, ExternalLink, X } from "lucide-react";
import { getContent } from "../api/learningService";
import { setupService } from "../api/setupService";

const TYPE_META = {
  video:    { icon: "🎥", label: "Video",    color: "bg-purple-50 text-purple-700" },
  audio:    { icon: "🎵", label: "Audio",    color: "bg-pink-50 text-pink-700" },
  image:    { icon: "🖼️", label: "Image",    color: "bg-amber-50 text-amber-700" },
  document: { icon: "📄", label: "Document", color: "bg-blue-50 text-blue-700" },
};

const fmtDuration = (s) => {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

function ContentViewer({ item, onClose }) {
  const { content_type, media_url, title } = item;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 truncate pr-4">{title}</h3>
          <button onClick={onClose} className="shrink-0 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {content_type === "video" && (
            <video
              src={media_url}
              controls
              autoPlay
              className="w-full rounded-2xl max-h-[60vh] bg-black"
            />
          )}
          {content_type === "audio" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <span className="text-7xl">🎵</span>
              <p className="font-semibold text-slate-700">{title}</p>
              <audio src={media_url} controls autoPlay className="w-full" />
            </div>
          )}
          {content_type === "image" && (
            <img
              src={media_url}
              alt={title}
              className="w-full rounded-2xl max-h-[60vh] object-contain"
            />
          )}
          {content_type === "document" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <span className="text-6xl">📄</span>
              <p className="text-slate-600">Documents open in a new tab</p>
              <a
                href={media_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-2xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-700 transition"
              >
                <ExternalLink size={16} /> Open Document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LearningGoals() {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    setupService.listClasses().then((d) => setClasses(d.classes || []));
  }, []);

  useEffect(() => {
    loadContent();
  }, [filterClass, filterType]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterClass) params.class_id = filterClass;
      if (filterType) params.type = filterType;
      const { content } = await getContent(params);
      setItems(content);
    } finally {
      setLoading(false);
    }
  };

  const subjects = [...new Set(items.map((i) => i.subject).filter(Boolean))].sort();

  const filtered = filterSubject
    ? items.filter((i) => i.subject?.toLowerCase().includes(filterSubject.toLowerCase()))
    : items;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-purple-600 p-3 text-white">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Learning Goals</h1>
            <p className="text-sm text-slate-500">Videos, audios, and study materials</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">All Types</option>
            {Object.entries(TYPE_META).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
          {subjects.length > 0 && (
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 py-20 text-center">
            <BookOpen size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No learning content available</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const meta = TYPE_META[item.content_type] || TYPE_META.document;
              return (
                <button
                  key={item._id}
                  onClick={() => setViewing(item)}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md hover:border-cyan-200 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl leading-none group-hover:scale-110 transition-transform">
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${meta.color}`}>
                          {meta.label}
                        </span>
                        {item.duration && (
                          <span className="text-[10px] text-slate-400">{fmtDuration(item.duration)}</span>
                        )}
                      </div>
                      <p className="mt-1 font-semibold text-slate-900 line-clamp-2 text-sm leading-snug">
                        {item.title}
                      </p>
                      {item.subject && (
                        <p className="mt-0.5 text-xs text-slate-400">{item.subject}</p>
                      )}
                      {item.description && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.description}</p>
                      )}
                      {item.class_ids?.length > 0 && (
                        <p className="mt-1.5 text-[10px] text-slate-300">
                          {item.class_ids.map((c) => c.name || c).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {viewing && <ContentViewer item={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
