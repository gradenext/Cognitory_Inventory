const Textarea = ({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  error = null,
  rows = 5,
  disabled = false, // ✅ added
  ...props
}) => {
  return (
    <div className="w-full relative my-4">
      {label && (
        <div className="w-fit bg-white text-xs font-medium text-black p-1 rounded-lg border mb-1">
          {label}
        </div>
      )}
      <textarea
        {...props}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled} // ✅ applied
        className={`block w-full px-4 py-2.5 rounded-md border text-white placeholder-gray-400 shadow-sm transition-all focus:outline-none focus:ring focus:ring-white focus:border-white
          ${
            disabled
              ? "bg-gray-700 cursor-not-allowed opacity-60"
              : "bg-black border-gray-300"
          }
        `}
      />
      {error && <div className="text-white text-xs mt-1">*{error}</div>}
    </div>
  );
};

export default Textarea;
