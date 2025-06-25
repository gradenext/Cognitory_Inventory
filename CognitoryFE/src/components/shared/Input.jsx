const Input = ({
  label,
  name,
  value,
  onChange,
  required = true,
  placeholder = "",
  type = "text",
  error = null,
}) => {
  return (
    <div className="w-full relative my-4">
      <label
        htmlFor={name}
        className="absolute -top-2 left-2 bg-white text-sm font-medium text-gray-600 "
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        required={required}
        className="block w-full px-4 py-2.5 rounded-md bg-white border border-gray-300 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-600 transition-all"
      />
      {error && <div className="text-red-900 text-xs">{error}</div>}
    </div>
  );
};

export default Input;
