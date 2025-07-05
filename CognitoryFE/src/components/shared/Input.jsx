const Input = ({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  type = "text",
  error = null,
  disabled = false,
}) => {
  return (
    <div className="w-full relative ">
      {label && (
        <label
          htmlFor={name}
          className=" bg-white text-black text-xs font-semibold px-2 py-0.5 rounded-full border border-gray-300 z-10 shadow-sm"
        >
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        className={`w-full px-4 py-3 mt-1 rounded-xl border text-white placeholder-white/50 bg-white/10 backdrop-blur-md shadow-inner transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white
          ${
            disabled
              ? "bg-gray-800 text-gray-400 cursor-not-allowed opacity-60"
              : "border-white/20"
          }
        `}
      />
      <div className="text-red-400 text-xs ml-1 min-h-[1rem]">
        {error ? `*${error}` : ""}
      </div>
    </div>
  );
};

export default Input;
