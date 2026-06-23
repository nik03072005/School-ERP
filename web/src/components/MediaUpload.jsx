import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import API from "../api/api.js";

const ACCEPTED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
]);

// Props:
//   onUpload(result)  — called with { url, type, mimeType, size, filename }
//   accept            — file input accept string  (default: images + videos)
//   label             — button label
//   className         — extra wrapper classes
export default function MediaUpload({
  onUpload,
  accept = "image/*,video/*",
  label = "Upload Media",
  className = "",
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null); // { objectUrl, type }
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Unsupported file type. Use JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, or AVI.");
      return;
    }

    const maxBytes = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File too large. Max ${isVideo ? "100 MB for videos" : "5 MB for images"}.`);
      return;
    }

    setPreview({ objectUrl: URL.createObjectURL(file), type: isVideo ? "video" : "image" });
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await API.post("/uploads/media", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpload?.(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Upload failed. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {preview.type === "image" ? (
            <img src={preview.objectUrl} alt="Preview" className="max-h-52 w-full object-contain" />
          ) : (
            <video src={preview.objectUrl} controls className="max-h-52 w-full rounded-xl" />
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
              <Loader2 size={28} className="animate-spin text-cyan-600" />
            </div>
          )}

          {!uploading && (
            <button
              type="button"
              onClick={clear}
              className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-sm hover:bg-red-50 hover:text-red-500"
              aria-label="Remove"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Upload size={15} />
          )}
          {uploading ? "Uploading…" : label}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
