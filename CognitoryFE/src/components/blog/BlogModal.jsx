const BlogModal = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    onClick={onClose}
  >
    <div
      className="bg-black border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-white text-xl font-bold mb-5">{title}</h2>
      {children}
    </div>
  </div>
);

export default BlogModal;
