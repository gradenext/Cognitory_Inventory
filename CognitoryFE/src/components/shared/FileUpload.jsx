import React, { useRef, useState, useEffect } from "react";
import { ArrowUpToLine, X } from "lucide-react";

const ImageUpload = ({ onSelect, error, disabled = false }) => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleButtonClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newPreviews = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    const updatedFiles = [...files, ...selectedFiles];
    const updatedPreviews = [...previews, ...newPreviews];

    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  const removeImage = (index) => {
    const updatedFiles = [...files];
    const updatedPreviews = [...previews];

    URL.revokeObjectURL(previews[index].preview);
    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);

    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  useEffect(() => {
    onSelect(files);
  }, [files]);

  return (
    <div
      className={`max-w-[80%] min-h-64 flex flex-col justify-between mx-auto p-6 bg-black rounded-xl shadow border border-gray-200 space-y-6 ${
        disabled ? "opacity-60 pointer-events-none select-none" : ""
      }`}
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
          <div className="flex justify-center items-center flex-wrap gap-4">
            {previews.map((img, index) => (
              <div
                key={index}
                className="relative w-fit p-1 group border border-white rounded-md shadow-sm"
              >
                <img
                  src={img.preview}
                  alt={`preview-${index}`}
                  className="h-32 w-32 object-contain"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute cursor-pointer z-50 -top-2 -right-2 bg-white text-black rounded-full p-1 text-xs hover:bg-opacity-80"
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
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        className={`w-1/3 mx-auto flex items-center justify-center gap-2 py-3 px-4 rounded-md border transition font-medium 
          ${
            disabled
              ? "bg-gray-700 text-gray-300 border-gray-400 cursor-not-allowed"
              : "bg-black text-white hover:bg-white hover:text-black border-white"
          }
        `}
      >
        <ArrowUpToLine className="h-5 w-5" />
        Upload
      </button>

      {error && <div className="text-white text-xs">*{error}</div>}
    </div>
  );
};

export default ImageUpload;
