import React, { useRef, useState, useEffect } from "react";
import { ArrowUpFromLine, X } from "lucide-react";

const generateFileKey = (file) =>
  `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`;

const ImageUpload = ({ onSelect, value = [], error, disabled = false }) => {
  const fileInputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    setPreviews((prev) => {
      const newPreviews = [];

      // Build preview list
      value.forEach((file) => {
        // Reuse existing preview if file object matches
        const existing = prev.find((p) => p.file === file);
        if (existing) {
          newPreviews.push(existing);
        } else {
          newPreviews.push({
            file,
            key: generateFileKey(file),
            preview: URL.createObjectURL(file),
          });
        }
      });

      // Revoke old previews no longer in value
      prev.forEach((p) => {
        if (!newPreviews.find((np) => np.file === p.file)) {
          URL.revokeObjectURL(p.preview);
        }
      });

      return newPreviews;
    });

    // Cleanup on unmount
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, [value]);

  const handleButtonClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (!selectedFiles.length) return;

    onSelect?.([...value, ...selectedFiles]);
    e.target.value = "";
  };

  const removeImage = (key) => {
    const updatedFiles = value.filter(
      (file) => !previews.find((p) => p.key === key && p.file === file)
    );
    onSelect?.(updatedFiles);
  };

  return (
    <div
      className={`w-full flex flex-col justify-between min-h-64 mx-auto p-6 rounded-2xl border border-white/20 backdrop-blur-md bg-white/10 shadow-lg space-y-6 transition-all
        ${disabled ? "opacity-60 pointer-events-none select-none" : ""}
      `}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
        disabled={disabled}
      />

      <div>
        {previews.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-4">
            {previews.map(({ file, key, preview }) => (
              <div
                key={key}
                className="relative w-48 h-48 p-2 flex justify-center items-center rounded-xl border border-white/30 shadow-inner backdrop-blur-sm"
              >
                <img
                  src={preview}
                  alt={file.name}
                  className=" h-40 object-contain"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeImage(key)}
                    className="absolute cursor-pointer -top-2 -right-2 z-10 bg-white text-black rounded-full p-1 hover:bg-opacity-80 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition border cursor-pointer
            ${
              disabled
                ? "bg-gray-700 text-gray-300 border-gray-400 cursor-not-allowed"
                : "bg-white/20 text-black hover:bg-white hover:scale-[1.02]"
            }
          `}
        >
          <ArrowUpFromLine className="h-5 w-5" />
          Upload Images
        </button>
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
};

export default ImageUpload;
