import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const DownloadDropdown = ({
  onDownloadPDF,
  onDownloadExcel,
  onDownloadCSV,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingState, setLoadingState] = useState(null); // 'pdf', 'excel', 'csv', or null
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      const dropdownHeight = 280; // Approximate height
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate horizontal position (prefer right-aligned, but adjust if it goes off-screen)
      let left = rect.right - dropdownWidth + window.scrollX;
      if (left < 10) {
        left = rect.left + window.scrollX; // Align to left if right alignment goes off-screen
      }
      if (left + dropdownWidth > viewportWidth - 10) {
        left = viewportWidth - dropdownWidth - 10; // Ensure it doesn't go off right edge
      }

      // Calculate vertical position (prefer below button, but show above if no space)
      let top = rect.bottom + window.scrollY + 8;
      if (top + dropdownHeight > viewportHeight + window.scrollY - 10) {
        top = rect.top + window.scrollY - dropdownHeight - 8; // Show above button
      }

      setDropdownPosition({ top, left });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      updateDropdownPosition();
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const downloadOptions = [
    {
      label: 'Download PDF Report',
      icon: DocumentTextIcon,
      onClick: onDownloadPDF,
      description: 'Professional PDF report with campaign summary'
    },
    {
      label: 'Download Excel File',
      icon: TableCellsIcon,
      onClick: onDownloadExcel,
      description: 'Excel spreadsheet with multiple sheets'
    },
    {
      label: 'Download CSV File',
      icon: TableCellsIcon,
      onClick: onDownloadCSV,
      description: 'Simple CSV file for data analysis'
    }
  ];

  const handleOptionClick = async (option) => {
    const loadingKey = option.label.includes('PDF') ? 'pdf' :
                      option.label.includes('Excel') ? 'excel' : 'csv';

    setLoadingState(loadingKey);
    setIsOpen(false);

    try {
      await option.onClick();
      // Show success briefly
      setTimeout(() => setLoadingState(null), 1000);
    } catch (error) {
      console.error('Download error:', error);
      // Show error state briefly, then clear
      setLoadingState('error');
      setTimeout(() => setLoadingState(null), 2000);

      // Show user-friendly error message
      alert(`Failed to download ${loadingKey.toUpperCase()} file. Please try again.`);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || loadingState}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${disabled || loadingState
              ? 'bg-warmGray-100 text-warmGray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-peach-400 to-peach-500 text-white hover:from-peach-500 hover:to-peach-600 shadow-md hover:shadow-lg'
            }
          `}
        >
          {loadingState === 'error' ? (
            <>
              <div className="h-5 w-5 text-red-500">⚠</div>
              <span>Error - Try Again</span>
            </>
          ) : loadingState ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Generating {loadingState.toUpperCase()}...</span>
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span>Download Report</span>
              <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
      </div>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[99999]">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-20"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div
            ref={dropdownRef}
            className="absolute w-80 max-w-[calc(100vw-20px)] bg-white rounded-xl shadow-2xl border-2 border-peach-200 opacity-0 animate-fade-in"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${Math.max(10, Math.min(dropdownPosition.left, window.innerWidth - 330))}px`,
              maxHeight: '400px',
              overflowY: 'auto',
              animation: 'fadeIn 200ms ease-out forwards'
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-peach-50 to-cream-50 rounded-t-xl border-b border-warmGray-100">
              <h3 className="text-sm font-semibold text-warmGray-800">Download Options</h3>
              <p className="text-xs text-warmGray-600 mt-1">Choose your preferred format</p>
            </div>

            {/* Options */}
            <div className="py-2">
              {downloadOptions.map((option, index) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleOptionClick(option)}
                    className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-peach-50 hover:to-cream-50 transition-all duration-200 flex items-start space-x-3 border-b border-warmGray-50 last:border-b-0 group"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-peach-100 rounded-lg flex items-center justify-center group-hover:bg-peach-200 transition-colors duration-200">
                      <IconComponent className="h-4 w-4 text-peach-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-warmGray-900 group-hover:text-warmGray-800">
                        {option.label}
                      </div>
                      <div className="text-xs text-warmGray-500 mt-1 group-hover:text-warmGray-600">
                        {option.description}
                      </div>
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-2 h-2 bg-peach-400 rounded-full"></div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-warmGray-50 rounded-b-xl border-t border-warmGray-100">
              <p className="text-xs text-warmGray-500 text-center">Press ESC to close</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default DownloadDropdown;
