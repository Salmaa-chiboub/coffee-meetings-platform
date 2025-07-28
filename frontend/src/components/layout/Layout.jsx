import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Sync with sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-expanded');
    if (savedState !== null) {
      setIsExpanded(JSON.parse(savedState));
    }

    // Listen for sidebar state changes
    const handleStorageChange = () => {
      const newState = localStorage.getItem('sidebar-expanded');
      if (newState !== null) {
        setIsExpanded(JSON.parse(newState));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab updates
    const handleSidebarToggle = (event) => {
      setIsExpanded(event.detail.isExpanded);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar />
      <Header />

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          // Mobile: always full width with top padding for toggle button and header
          'pt-32 lg:pt-16'
        } ${
          // Desktop: adjust margin based on sidebar state
          isExpanded ? 'lg:ml-80' : 'lg:ml-20'
        }`}
      >
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
