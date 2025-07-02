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
  error
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
        disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      {label && (
        <div className="w-fit bg-white text-xs font-medium text-black p-1 rounded-lg border mb-1">
          {label}
        </div>
      )}

      {/* Trigger */}
      <div
        className={`flex items-center justify-between w-full p-2.5 rounded-lg transition-all ${
          isOpen
            ? "border-white rounded-b-none border-[1px] border-b-0"
            : "border-gray-600 border"
        } ${disabled || loading ? "bg-gray-700" : "bg-black"}`}
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
              className="w-4 h-4 text-white"
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      <div
        className={`absolute z-10 w-full rounded-md border border-t-0 border-gray-600 rounded-b-lg bg-black transition-all duration-200 ease-in-out ${
          isOpen
            ? "opacity-100 max-h-60 overflow-y-auto rounded-t-none"
            : "opacity-0 max-h-0 pointer-events-none"
        }`}
      >
        {/* Search */}
        <div className="sticky top-0 bg-black p-2 border-b border-gray-600">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full py-2 pl-10 pr-8 text-sm text-white placeholder-gray-500 bg-gray-800 rounded-md focus:outline-none"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
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
                className={`px-3 py-2 hover:bg-gray-800 transition-colors duration-150 flex items-center justify-between ${
                  selectedValue === option.value
                    ? "bg-gray-800 text-white"
                    : "text-gray-300"
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
          <li className="px-3 py-2 text-center text-sm text-gray-500">
            No options found
          </li>
        )}
      </div>

      {error && <div className="text-white text-xs">*{error}</div>}
    </div>
  );
};

export default Select;
