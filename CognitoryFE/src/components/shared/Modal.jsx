import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";


const Modal = ({ children, onClose }) => {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-white/10 text-white rounded-xl w-full max-w-md mx-4 shadow-lg p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute cursor-pointer top-3 right-4 text-white/40 hover:text-white transition text-lg"
        >
          <X/>
        </button>

        {/* Modal Content */}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
