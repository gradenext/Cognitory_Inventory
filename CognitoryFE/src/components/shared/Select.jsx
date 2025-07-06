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
      <span className="truncate text-sm text-black">
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
        <label className="bg-white text-black text-xs font-semibold px-2 py-0.5 rounded-full border border-gray-300 z-10 shadow-sm">
          {label}
        </label>
      )}

      {/* Trigger */}
      <div
        className={`flex items-center justify-between w-full px-4 py-3 mt-1 rounded-xl border text-black bg-white/50 backdrop-blur-md shadow-inner transition-all duration-200 ${
          isOpen ? "border-black" : "border-white/20 hover:border-black/50"
        } ${
          disabled || loading
            ? "bg-gray-800 cursor-not-allowed"
            : "cursor-pointer"
        }`}
        onClick={toggleDropdown}
        tabIndex={disabled || loading ? -1 : 0}
        role="button"
      >
        <div className="flex-1 overflow-hidden">{displayValue()}</div>
        <div className="flex gap-1 items-center">
          {loading ? (
            <Loader2 className="w-4 h-4 text-black animate-spin" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-black transition-transform duration-300 ${
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
              className="w-4 h-4 text-black hover:text-red-400 cursor-pointer"
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      <div
        className={`absolute z-30 w-full mt-0.5 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl transition-all duration-200 shadow-lg overflow-hidden ${
          isOpen
            ? "opacity-100 max-h-64"
            : "opacity-0 max-h-0 pointer-events-none"
        }`}
      >
        {/* Search */}
        <div className="sticky top-0 z-10 px-3 py-2 bg-black/80 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-2 w-4 h-4 text-white/40" />
            <input
              type="text"
              className="w-full py-2 pl-10 pr-8 text-sm text-white bg-transparent placeholder-white/40 focus:outline-none"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4 cursor-pointer" />
              </button>
            )}
          </div>
        </div>

        {/* Options */}
        <ul
          role="listbox"
          className="max-h-48 overflow-y-auto scroll-smooth scroll-py-2"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li
                key={option.value}
                className={`px-4 py-2 text-sm flex justify-between items-center transition-colors ${
                  selectedValue === option.value
                    ? "bg-white/20 text-white"
                    : "hover:bg-white/10 text-white/80"
                } cursor-pointer`}
                onClick={() => handleOptionClick(option.value)}
                role="option"
              >
                <span>{option.label}</span>
                {selectedValue === option.value && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-sm text-white/50 text-center">
              No options found
            </li>
          )}
        </ul>
      </div>

      {/* Error */}
      <div className="text-red-400 text-xs min-h-[1rem] mt-1 ml-1">
        {error ? `*${error}` : ""}
      </div>
    </div>
  );
};

export default Select;
