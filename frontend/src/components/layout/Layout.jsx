import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Handle sidebar hover state changes
  const handleSidebarHoverChange = (hovered) => {
    setIsHovered(hovered);
  };

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar onHoverChange={handleSidebarHoverChange} />
      <Header isHovered={isHovered} />

      {/* Main Content Area */}
      <div
        className={`main-content-responsive content-container-responsive transition-all duration-300 ease-in-out ${
          // Mobile/Tablet: full width with top padding for toggle button and header
          'pt-32 lg:pt-16'
        } ${
          // Desktop: adjust margin based on sidebar hover state
          isHovered ? 'lg:ml-96' : 'lg:ml-24'
        }`}
      >
        <main className="p-2 lg:p-3 w-full">
          <div className="min-w-0 max-w-full" data-sidebar-hovered={isHovered}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
