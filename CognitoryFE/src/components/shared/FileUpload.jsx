import React, { useRef, useState, useEffect } from "react";
import { ArrowUpFromLine, X } from "lucide-react";

const ImageUpload = ({ onSelect, disabled = false }) => {
  const fileInputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  const handleButtonClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const newPreviews = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    const updatedPreviews = [...previews, ...newPreviews];
    setPreviews(updatedPreviews);
    onSelect?.(updatedPreviews.map((p) => p.file));

    e.target.value = "";
  };

  const removeImage = (index) => {
    const removed = previews[index];
    if (removed?.preview) {
      URL.revokeObjectURL(removed.preview);
    }

    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    onSelect?.(updatedPreviews.map((p) => p.file));
  };

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, []);

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

      {/* Preview Grid */}
      <div>
        {previews.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-4">
            {previews.map(({ preview }, index) => (
              <div
                key={index}
                className="relative w-48 h-48 p-2 rounded-xl border border-white/30 shadow-inner backdrop-blur-sm"
              >
                <img
                  src={preview}
                  alt={`preview-${index}`}
                  className=" h-40 object-contain"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
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
    </div>
  );
};

export default ImageUpload;
