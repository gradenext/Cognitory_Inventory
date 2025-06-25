import React, { useEffect, useRef, useState } from "react";
import {
  X,
  File,
  FileText,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileImage,
  Maximize2,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { infoToast } from "../toast/Toast";

const fileTypeMap = {
  images: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  videos: ["video/mp4", "video/webm", "video/ogg"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/flac"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ],
  archives: [
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/x-tar",
  ],
  code: [
    "text/javascript",
    "application/json",
    "text/html",
    "text/css",
    "application/x-python-code",
    "application/sql",
  ],
  all: ["*"],
};

const renderFileIcon = (fileType) => {
  if (!fileType) return <File size={24} />;
  if (fileType.includes("image")) return <FileImage size={24} />;
  if (fileType.includes("pdf") || fileType.includes("document"))
    return <FileText size={24} />;
  if (fileType.includes("zip") || fileType.includes("compressed"))
    return <FileArchive size={24} />;
  if (fileType.includes("audio")) return <FileAudio size={24} />;
  if (fileType.includes("video")) return <FileVideo size={24} />;
  if (
    fileType.includes("json") ||
    fileType.includes("javascript") ||
    fileType.includes("code")
  )
    return <FileCode size={24} />;
  return <File size={24} />;
};

const FileUpload = ({
  fileType = "all", // type of file - images, videos, documents, archives, code, all for multiple add required with space seprated
  multiple = false, // should acccept multiple files or not
  maxFiles = 1, // if multiple then max no of files
  files = [], // files array to be passed as prop
  setFiles, // function to change files array
  required = false, // control wheather it's required or not
  value, // existing files to display should be an array
  className, // to change container style
  previewClassName = " object-cover", // to change preview box style
}) => {
  const prevValueRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    if (JSON.stringify(prevValueRef.current) !== JSON.stringify(value)) {
      try {
        const preloadedFiles = value
          ?.filter((url) => typeof url === "string" && url.trim() !== "")
          ?.map((url) => {
            const parts = url.split("/");
            const rawName = parts.pop() || "";
            let name;
            try {
              name = decodeURIComponent(rawName);
            } catch (error) {
              name = rawName;
            }

            let type = "";
            const extension = name.split(".").pop().toLowerCase();
            if (/\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(name)) {
              type = `image/${extension}`;
              if (type === "image/jpg") type = "image/jpeg";
            } else if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(name)) {
              type = `video/${extension}`;
            } else if (/\.(pdf)(\?.*)?$/i.test(name)) {
              type = "application/pdf";
            }

            return { preview: url, name, isExisting: true, type };
          });
        setFiles(preloadedFiles);
      } catch (err) {
        console.error("Error processing files:", err);
      }
      prevValueRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    return () => {
      files?.forEach((file) => {
        if (file.preview && !file.isExisting) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const fileTypes = fileType.split(" ");

  const allowedTypes = fileTypes.reduce((acc, type) => {
    return [...acc, ...(fileTypeMap[type] || [])];
  }, []);

  const accept =
    fileType === "all"
      ? undefined
      : allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {});

  const onDrop = (acceptedFiles) => {
    if (multiple && files.length + acceptedFiles.length > maxFiles) {
      infoToast(`You can only upload up to ${maxFiles} files`);
      return;
    }

    const newFiles = acceptedFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      return Object.assign(file, { preview });
    });

    setFiles((prevFiles) => {
      const updatedFiles = multiple ? [...prevFiles, ...newFiles] : newFiles;
      if (inputRef.current) {
        inputRef.current.value = null;
      }
      return updatedFiles;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxFiles,
    noClick: true,
  });

  const removeFile = (index) => {
    const fileToRemove = files[index];
    if (fileToRemove?.preview && !fileToRemove.isExisting) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);

    if (newFiles.length === 0 && inputRef.current) {
      inputRef.current.value = null;
    }
  };

  const renderPreview = (file) => {
    const identifier = file.name
      ? file.name.toLowerCase()
      : file.preview.toLowerCase();

    if (file.isExisting && file.preview) {
      if (/\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(identifier)) {
        return (
          <img
            src={file.preview}
            alt={file.name}
            className={`rounded-md mx-auto min-h-24 ${previewClassName}`}
          />
        );
      }
      if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(identifier)) {
        return (
          <video
            src={file.preview}
            controls
            className={`rounded-md mx-auto min-h-24 ${previewClassName}`}
          />
        );
      }
      if (/\.(pdf)(\?.*)?$/i.test(identifier)) {
        return (
          <embed
            src={file.preview}
            type="application/pdf"
            className={`rounded-md mx-auto min-h-24 ${previewClassName}`}
          />
        );
      }
      return (
        <div
          className={`rounded-md flex justify-center items-center mx-auto ${previewClassName}`}
        >
          {renderFileIcon(file.type)}
        </div>
      );
    }

    if (!file.preview) {
      return (
        <div
          className={`rounded-md flex justify-center items-center mx-auto ${previewClassName}`}
        >
          {renderFileIcon(file.type)}
        </div>
      );
    }
    if (file.type && file.type.startsWith("image/")) {
      return (
        <img
          src={file.preview}
          alt={file.name}
          className={`rounded-md mx-auto min-h-24 ${previewClassName}`}
        />
      );
    }
    if (file.type && file.type.startsWith("video/")) {
      return (
        <video
          src={file.preview}
          controls
          className={`rounded-md mx-auto min-h-24 ${previewClassName}`}
        />
      );
    }
    if (file.type === "application/pdf") {
      return (
        <embed
          src={file.preview}
          type="application/pdf"
          className={`rounded-md mx-auto min-h-24 ${previewClassName}`}
        />
      );
    }
    return (
      <div
        className={`rounded-md flex justify-center items-center mx-auto ${previewClassName}`}
      >
        {renderFileIcon(file.type)}
      </div>
    );
  };

  return (
    <div
      {...getRootProps()}
      className={`p-2 border-2 rounded-lg text-center flex flex-col items-center w-full ${className}`}
      style={{ minHeight: "300px" }}
    >
      <div className="flex-1 flex items-center justify-center flex-wrap gap-2 m-2 ">
        {files && files.length > 0 ? (
          files?.map((file, index) => (
            <div key={index} className={"border rounded-lg p-2"}>
              <div className="flex justify-between items-center my-1 gap-3">
                <p className=" text-xs max-w-48  text-gray-700 truncate">
                  {file.name}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    removeFile(index);
                  }}
                  className=" bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X size={12} className="text-white m-1" />
                </button>
              </div>
              <div className="bg-[#3a643b] h-[1px] my-2"></div>
              {renderPreview(file)}
            </div>
          ))
        ) : (
          <div className="text-gray-500 flex justify-center items-center">
            No File Selected
          </div>
        )}
      </div>

      <div
        className={
          "h-fit w-full border-2 border-dashed hover:border-[#3a643b] transition-colors duration-300 rounded-xl m-2 py-2 px-4 cursor-pointer"
        }
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current.click();
        }}
      >
        <input
          {...getInputProps()}
          required={required && files.length === 0}
          ref={inputRef}
        />
        <p className="text-gray-600 text-xs">
          {isDragActive
            ? "Drop the files here"
            : "Drag & drop files here, or click to select files"}
        </p>
        {multiple && (
          <p className="text-xs text-gray-500">Up to {maxFiles} files</p>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
