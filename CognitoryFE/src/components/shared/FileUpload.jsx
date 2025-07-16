import React, { useRef, useState, useEffect } from "react";
import { ArrowUpFromLine, X } from "lucide-react";

const ImageUpload = ({ onSelect, disabled = false, value = [] }) => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
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

    setFiles((prev) => [...prev, ...selectedFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);

    e.target.value = ""; // reset input to allow re-uploading same file
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index].preview);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    onSelect?.(files);
  }, [files]);

  useEffect(() => {
    if (Array.isArray(value) && value.length === 0 && files.length > 0) {
      previews.forEach((p) => URL.revokeObjectURL(p.preview));
      setFiles([]);
      setPreviews([]);
    }
  }, [value]);

  return (
    <div
      className={`w-full flex flex-col justify-between min-h-64 mx-auto p-6 rounded-2xl border border-white/20 backdrop-blur-md bg-white/10 shadow-lg space-y-6 transition-all
        ${disabled ? "opacity-60 pointer-events-none select-none" : ""}
      `}
    >
      {/* Hidden file input */}
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
            {previews.map((img, index) => (
              <div
                key={index}
                className="relative w-48 h-48 p-2 rounded-xl border border-white/30 shadow-inner backdrop-blur-sm"
              >
                <img
                  src={img.preview}
                  alt={`preview-${index}`}
                  className="w-full h-full object-contain"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 z-10 bg-white text-black rounded-full p-1 hover:bg-opacity-80 transition"
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
