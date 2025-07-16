import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const Modal = ({ children, onClose, title = "Preview" }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative bg-zinc-900 border border-white/10 text-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="sticky top-0 z-10 bg-zinc-900 border-b border-white/10 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition cursor-pointer text-xl"
          >
            <X />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
