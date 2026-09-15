import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { uploadBlogImage } from "../../services/blogAPIs";
import { inputCls, labelCls, hintCls } from "./blogUtils";

const BlogImageField = ({ label, value = {}, onChange, altRequired = true }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const update = (patch) => onChange({ url: "", publicId: "", alt: "", ...value, ...patch });

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadBlogImage(file);
      update({ url: result.url, publicId: result.publicId });
    } catch {
      // error toast shown by service
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className={labelCls}>{label}</label>
      {value.url ? (
        <img src={value.url} alt={value.alt || ""} className="w-full aspect-video object-cover rounded-lg border border-white/10" />
      ) : (
        <div className="w-full aspect-video rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/30 text-sm">
          No image
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/90 transition disabled:opacity-50"
        >
          <ImagePlus className="w-3.5 h-3.5" />
          {uploading ? "Uploading..." : value.url ? "Replace" : "Upload"}
        </button>
        {value.url && (
          <button
            type="button"
            onClick={() => update({ url: "", publicId: "" })}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <input
        type="url"
        value={value.url || ""}
        onChange={(e) => update({ url: e.target.value, publicId: "" })}
        placeholder="…or paste an image URL"
        className={inputCls}
      />
      <input
        type="text"
        value={value.alt || ""}
        onChange={(e) => update({ alt: e.target.value })}
        placeholder={altRequired ? "Alt text (required) — describe the image" : "Alt text — describe the image"}
        className={inputCls}
      />
      <p className={hintCls}>Alt text should describe what is in the image, for accessibility and search.</p>
    </div>
  );
};

export default BlogImageField;
