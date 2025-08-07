import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

const CampaignCardMenu = ({ campaign, isCompleted, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewFeedback = (e) => {
    e.stopPropagation();
    navigate(`/app/campaigns/${campaign.id}/evaluations`);
    setIsOpen(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
      await onDelete(campaign.id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded-full hover:bg-warmGray-100 focus:outline-none"
        aria-label="Menu de la campagne"
      >
        <EllipsisVerticalIcon className="w-5 h-5 text-warmGray-500" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 py-1 border border-warmGray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleViewFeedback}
            className="w-full text-left px-4 py-2 text-sm text-warmGray-700 hover:bg-warmGray-50"
          >
            Voir les feedbacks
          </button>
          <button
            onClick={handleDelete}
            disabled={isCompleted}
            className={`w-full text-left px-4 py-2 text-sm
              ${isCompleted 
                ? 'text-warmGray-400 cursor-not-allowed' 
                : 'text-red-600 hover:bg-warmGray-50'
              }`}
          >
            Supprimer la campagne
            {isCompleted && (
              <span className="ml-2 text-xs text-warmGray-400">(Complétée)</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CampaignCardMenu;
