const Textarea = ({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  error = null,
  disabled = false,
  rows = 4,
}) => {
  return (
    <div className="w-full relative">
      {label && (
        <label
          htmlFor={name}
          className="bg-white text-black text-xs font-semibold px-2 py-0.5 rounded-full border border-gray-300 z-10 shadow-sm"
        >
          {label}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full px-4 py-3 mt-1 rounded-xl border text-black placeholder-black bg-white/50 backdrop-blur-md shadow-inner transition-all duration-200 focus:outline-none focus:ring-2 focus:border-black ${
          disabled
            ? "bg-gray-800 text-black cursor-not-allowed opacity-80"
            : "border-white/20"
        }`}
      />
      <div className="text-red-400 font-semibold text-xs ml-1 min-h-[1rem]">
        {error ? `*${error}` : ""}
      </div>
    </div>
  );
};

export default Textarea;
