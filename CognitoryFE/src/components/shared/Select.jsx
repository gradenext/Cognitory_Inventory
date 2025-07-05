import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check, Loader2, Search } from "lucide-react";

const Select = ({
  options,
  placeholder = "Select an option",
  onSelect,
  selectedOption,
  className = "",
  disabled = false,
  loading = false,
  label = "",
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(selectedOption || null);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef(null);

  useEffect(() => {
    setSelectedValue(selectedOption || null);
  }, [selectedOption]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    if (!disabled && !loading) setIsOpen((prev) => !prev);
  };

  const handleOptionClick = (value) => {
    setSelectedValue(value);
    if (onSelect) onSelect(value);
    setIsOpen(false);
  };

  const displayValue = () => {
    const selected = options.find((opt) => opt.value === selectedValue);
    return (
      <span className="truncate text-sm text-white">
        {selected?.label || placeholder}
      </span>
    );
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      ref={selectRef}
      className={`relative w-full ${className} ${
        disabled || loading ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      {label && (
        <label className=" bg-white text-black text-xs font-semibold px-2 py-0.5 rounded-full border border-white z-10 shadow-sm">
          {label}
        </label>
      )}

      {/* Trigger */}
      <div
        className={`flex items-center justify-between w-full px-4 py-3 mt-1 rounded-xl border text-white bg-white/10 backdrop-blur-md shadow-inner transition-all duration-200 focus-within:ring-2 focus-within:ring-white/40 focus-within:border-white
        ${
          isOpen
            ? "border-white rounded-b-none"
            : "border-white/20 hover:border-white/30"
        } ${disabled || loading ? "bg-gray-800 cursor-not-allowed" : ""}
        `}
        onClick={toggleDropdown}
        tabIndex={disabled || loading ? -1 : 0}
        role="button"
      >
        <div className="flex-1 overflow-hidden">{displayValue()}</div>
        <div className="flex justify-center items-center gap-x-1">
          {loading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-white transition-transform duration-300 ${
                isOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          )}
          {selectedValue && !loading && (
            <X
              onClick={(e) => {
                e.stopPropagation();
                if (disabled) return;
                setSelectedValue(null);
                if (onSelect) onSelect(null);
                setIsOpen(false);
              }}
              className="w-4 h-4 text-white hover:text-red-400"
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      <div
        className={`absolute z-20 w-full rounded-b-xl border border-white/20 border-t-0 bg-white/10 backdrop-blur-md transition-all duration-200 ease-in-out shadow-lg overflow-hidden ${
          isOpen
            ? "opacity-100 max-h-64 overflow-y-auto"
            : "opacity-0 max-h-0 pointer-events-none"
        }`}
      >
        {/* Search */}
        <div className="sticky top-0 bg-white/10 backdrop-blur-md px-3 py-1 flex justify-between items-center border-b border-white/10">
          <Search className="absolute left-3 top-3 w-4 h-4 text-white/50" />
          <input
            type="text"
            className="w-full py-2 pl-10 pr-8 text-sm text-white placeholder-white/40 bg-transparent focus:outline-none"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-3 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Options */}
        {filteredOptions.length > 0 ? (
          <ul role="listbox" className="m-0 p-0">
            {filteredOptions.map((option) => (
              <li
                key={option.value}
                className={`px-4 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                  selectedValue === option.value
                    ? "bg-white/20 text-white"
                    : "hover:bg-white/10 text-white/80"
                }`}
                onClick={() => handleOptionClick(option.value)}
                role="option"
                tabIndex={0}
              >
                <span>{option.label}</span>
                {selectedValue === option.value && (
                  <Check className="w-4 h-4 text-current" />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <li className="px-3 py-2 text-center text-sm text-white/50">
            No options found
          </li>
        )}
      </div>

      {/* Error Message (always rendered for layout stability) */}
      <div className="text-red-400 text-xs min-h-[1rem] mt-1 ml-1">
        {error ? `*${error}` : ""}
      </div>
    </div>
  );
};

export default Select;
