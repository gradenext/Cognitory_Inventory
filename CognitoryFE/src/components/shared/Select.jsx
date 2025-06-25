import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { FiSearch, FiX } from "react-icons/fi";

const Select = ({
  options,
  placeholder = "Select an option",
  onSelect,
  selectedOption,
  className = "",
  disabled = false,
  multiple = false,
  showChip = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState(
    multiple
      ? Array.isArray(selectedOption)
        ? selectedOption
        : []
      : selectedOption || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef(null);

  useEffect(() => {
    if (multiple && selectedOption && Array.isArray(selectedOption)) {
      setSelectedValues(selectedOption);
    } else if (!multiple && selectedOption) {
      setSelectedValues(selectedOption);
    }
  }, [selectedOption, multiple]);

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
    if (!disabled) setIsOpen((prev) => !prev);
  };

  const handleOptionClick = (value) => {
    if (multiple) {
      const newSelectedValues = selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value];
      setSelectedValues(newSelectedValues);
      if (onSelect) onSelect(newSelectedValues);
    } else {
      setSelectedValues(value);
      if (onSelect) onSelect(value);
      setIsOpen(false);
    }
  };

  const removeChip = (value, e) => {
    e.stopPropagation();
    const newSelectedValues = selectedValues.filter((item) => item !== value);
    setSelectedValues(newSelectedValues);
    if (onSelect) onSelect(newSelectedValues);
  };

  const displayValue = () => {
    if (multiple && showChip) {
      return (
        <div className="flex flex-wrap items-center gap-1">
          {selectedValues.map((value) => {
            const option = options.find((opt) => opt.value === value);
            return (
              <div
                key={value}
                className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs"
              >
                <span>{option?.label || value}</span>
                <X
                  className="w-3 h-3 cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={(e) => removeChip(value, e)}
                />
              </div>
            );
          })}
          {selectedValues.length === 0 && (
            <span className="text-sm py-0.5">{placeholder}</span>
          )}
        </div>
      );
    } else if (multiple) {
      return (
        <span className="truncate text-sm">
          {selectedValues.length > 0
            ? `${selectedValues.length} selected`
            : placeholder}
        </span>
      );
    } else {
      const selectedOption = options.find(
        (opt) => opt.value === selectedValues
      );
      return (
        <span className="truncate text-sm">
          {selectedOption?.label || selectedValues || placeholder}
        </span>
      );
    }
  };

  // Filtered options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      ref={selectRef}
      className={`relative w-full ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div
        className={`flex items-center justify-between w-full p-2.5 rounded-lg transition-all ${
          isOpen
            ? "border-[#3a643b] rounded-b-none border-[1px] border-b-0"
            : "border-gray-300 border "
        } ${disabled ? "bg-gray-100" : "bg-white"}`}
        onClick={toggleDropdown}
        tabIndex={disabled ? -1 : 0}
        role="button"
      >
        <div className="flex-1 overflow-hidden">{displayValue()}</div>
        <div className="flex justify-center items-center gap-x-1">
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
          {!multiple && selectedValues && (
            <X
              onClick={(e) => {
                e.stopPropagation();
                setSelectedValues(null);
                if (onSelect) onSelect(null);
                setIsOpen(false);
              }}
              className="w-4 h-4 text-gray-500"
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      <div
        className={`absolute z-10 w-full rounded-md border border-t-0 border-gray-300 rounded-b-lg bg-white transition-all duration-200 ease-in-out ${
          isOpen
            ? "opacity-100 max-h-60 overflow-y-auto rounded-t-none"
            : "opacity-0 max-h-0 pointer-events-none"
        }`}
      >
        {/* Search input */}
        <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full py-2 pl-10 pr-8 text-sm text-gray-700 placeholder-gray-400 bg-gray-100 rounded-md focus:outline-none focus:border focus:border-primaryColor"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {filteredOptions.length > 0 ? (
          <ul role="listbox" className="m-0 p-0">
            {filteredOptions.map((option) => {
              const isSelected = multiple
                ? selectedValues.includes(option.value)
                : selectedValues === option.value;
              return (
                <li
                  key={option.value}
                  className={`px-3 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center justify-between ${
                    isSelected ? "bg-gray-100 text-gray-600" : "text-gray-900"
                  }`}
                  onClick={() => handleOptionClick(option.value)}
                  role="option"
                  tabIndex={0}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-current" />}
                </li>
              );
            })}
          </ul>
        ) : (
          <li className="px-3 py-2 text-center text-sm text-gray-500">
            No options found
          </li>
        )}
      </div>
    </div>
  );
};

export default Select;
