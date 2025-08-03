import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar onHoverChange={setIsHovered} />
      <Header isHovered={isHovered} />

      {/* Main Content Area - Adjusts when sidebar expands */}
      <div className={`transition-all duration-300 ease-in-out pt-16 ${
        isHovered ? 'lg:ml-96' : 'lg:ml-24'
      }`}>
        <main className="px-3 lg:px-4 pt-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
