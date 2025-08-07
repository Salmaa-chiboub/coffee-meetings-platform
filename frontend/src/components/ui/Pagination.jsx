import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Pagination = React.memo(({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
  className = ''
}) => {
  // Don't render if there are no items or only one page
  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  // Calculate visible page numbers (simplified for modern look)
  const getVisiblePages = () => {
    const delta = 1; // Show only 1 page on each side for cleaner look
    const range = [];

    // Show first page
    if (currentPage > 2) {
      range.push(1);
      if (currentPage > 3) {
        range.push('...');
      }
    }

    // Show pages around current
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i);
    }

    // Show last page
    if (currentPage < totalPages - 1) {
      if (currentPage < totalPages - 2) {
        range.push('...');
      }
      range.push(totalPages);
    }

    return [...new Set(range)];
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex flex-col items-center space-y-4 py-8 ${className}`}>
      {/* Modern Page Info */}
      <div className="text-center">
        <p className="text-sm text-warmGray-500 font-medium">
          Page <span className="text-[#8B6F47] font-semibold">{currentPage}</span> sur{' '}
          <span className="text-[#8B6F47] font-semibold">{totalPages}</span>
          <span className="mx-2">•</span>
          <span className="text-warmGray-400">{totalItems} élément{totalItems !== 1 ? 's' : ''} au total</span>
        </p>
      </div>

      {/* Modern Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="group flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-warmGray-200 text-warmGray-400 hover:border-[#E8C4A0] hover:text-[#8B6F47] hover:bg-[#E8C4A0]/5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-warmGray-200 disabled:hover:text-warmGray-400 disabled:hover:bg-white transition-all duration-200"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <div
                  key={`dots-${index}`}
                  className="flex items-center justify-center w-10 h-10 text-warmGray-400 font-medium"
                >
                  ⋯
                </div>
              );
            }

            const isCurrentPage = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${
                  isCurrentPage
                    ? 'bg-gradient-to-r from-[#E8C4A0] to-[#DDB892] text-white shadow-lg shadow-[#E8C4A0]/25 border-2 border-[#E8C4A0]'
                    : 'bg-white border-2 border-warmGray-200 text-warmGray-600 hover:border-[#E8C4A0] hover:text-[#8B6F47] hover:bg-[#E8C4A0]/5'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="group flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-warmGray-200 text-warmGray-400 hover:border-[#E8C4A0] hover:text-[#8B6F47] hover:bg-[#E8C4A0]/5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-warmGray-200 disabled:hover:text-warmGray-400 disabled:hover:bg-white transition-all duration-200"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

export default Pagination;
