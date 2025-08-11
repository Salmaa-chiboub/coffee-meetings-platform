import React, { useState, useRef, useEffect } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

const CampaignCardMenu = ({ campaign, isCompleted, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuClick = (e) => {
    e.stopPropagation(); // Prevent card click
    setIsOpen(!isOpen);
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent card click
    if (isCompleted) return; // Disabled for completed campaigns
    if (onDelete) {
      onDelete(campaign?.id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleMenuClick}
        className="p-1 rounded-full hover:bg-warmGray-100 transition-colors"
      >
        <EllipsisVerticalIcon className="w-5 h-5 text-warmGray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-warmGray-200 rounded-lg shadow-lg z-10">
          <div className="py-1">
            <button
              onClick={handleDelete}
              disabled={isCompleted}
              title={isCompleted ? 'Suppression désactivée pour une campagne terminée' : 'Supprimer'}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                isCompleted
                  ? 'text-warmGray-400 cursor-not-allowed'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignCardMenu;
