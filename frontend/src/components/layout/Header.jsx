import React from 'react';
import ProfileDropdown from '../ui/ProfileDropdown';
import NotificationButton from '../ui/NotificationButton';
import SearchButton from '../ui/SearchButton';

const Header = ({ isHovered = false }) => {

  return (
    <header
      className={`bg-white shadow-sm border-b border-gray-200 transition-all duration-300 ease-in-out ${
        isHovered ? 'lg:ml-96' : 'lg:ml-24'
      }`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: 0,
        zIndex: 30
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 py-2">
          {/* Left side - Search */}
          <div className="flex items-center">
            <SearchButton />
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <NotificationButton />

            {/* Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
