import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '../../hooks/useDebounce';

const SearchBar = ({
  placeholder = "Search...",
  value = "",
  onChange,
  onSubmit,
  className = "",
  showShortcut = false,
  shortcutKey = "⌘F",
  debounceDelay = 300,
  autoFocus = false,
  disabled = false,
  size = "md"
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceDelay);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Call onChange with debounced value
  useEffect(() => {
    if (onChange && debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  const handleInputChange = (e) => {
    setLocalValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(localValue);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search-input]');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sizeClasses = {
    sm: "py-1.5 text-sm",
    md: "py-2 text-base",
    lg: "py-3 text-lg"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6"
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      {/* Premium gradient border wrapper */}
      <div className="relative p-[2px] rounded-full bg-gradient-to-r from-[#E8C4A0] via-[#F5E6D3] to-[#E8C4A0] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>

        {/* Inner container with white background */}
        <div className="relative rounded-full bg-white">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className={`${iconSizes[size]} text-[#E8C4A0] group-hover:text-[#D4A574] transition-colors duration-200`} />
          </div>
          <input
            type="text"
            placeholder={placeholder}
            value={localValue}
            onChange={handleInputChange}
            disabled={disabled}
            autoFocus={autoFocus}
            data-search-input
            className={`
              block w-full pl-10 ${showShortcut ? 'pr-12' : 'pr-4'} ${sizeClasses[size]}
              border-0 rounded-full bg-transparent text-warmGray-900
              placeholder-warmGray-400 focus:outline-none focus:ring-0
              disabled:bg-warmGray-50 disabled:text-warmGray-500 disabled:cursor-not-allowed
              transition-all duration-200
            `}
          />
        </div>
      </div>

      {showShortcut && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <kbd className="inline-flex items-center px-2 py-1 border border-warmGray-200 rounded text-xs font-sans font-medium text-warmGray-400">
            {shortcutKey}
          </kbd>
        </div>
      )}
    </form>
  );
};

export default SearchBar;
