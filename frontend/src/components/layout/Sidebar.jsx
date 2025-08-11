import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChartPieIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  ViewColumnsIcon,
  ClockIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ onHoverChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // State management - Default closed, opens on hover
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Show expanded state when hovered or mobile is open
  const shouldShowExpanded = isHovered || isMobileOpen;

  // Debounced hover handlers to prevent rapid layout shifts
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
    if (onHoverChange) onHoverChange(true);
  };

  const handleMouseLeave = () => {
    // Add small delay to prevent flickering when moving between sidebar elements
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      if (onHoverChange) onHoverChange(false);
    }, 100);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Modern navigation items
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: ChartBarIcon,
      path: '/app',
      active: location.pathname === '/app'
    },
    {
      id: 'campaigns',
      label: 'Campagnes',
      icon: CalendarDaysIcon,
      path: '/app/campaigns',
      active: location.pathname.startsWith('/app/campaigns') && !location.pathname.startsWith('/app/campaigns/history')
    },
    {
      id: 'employees',
      label: 'Employés',
      icon: UserGroupIcon,
      path: '/app/employees',
      active: location.pathname.startsWith('/app/employees')
    },
    {
      id: 'history',
      label: 'Historique',
      icon: ClockIcon,
      path: '/app/history',
      active: location.pathname.startsWith('/app/history')
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      path: '/app/notifications',
      active: location.pathname.startsWith('/app/notifications')
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: UserIcon,
      path: '/app/profile',
      active: location.pathname.startsWith('/app/profile')
    }
  ];

  // Modern navigation item component
  const NavItem = ({ item, isSubItem = false }) => {
    const Icon = item.icon;
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const showSubItems = shouldShowExpanded && hasSubItems && item.active;

    return (
      <div className="mb-1">
        <button
          onClick={() => navigate(item.path)}
          className={`flex items-center text-left transition-all duration-300 group relative ${
            shouldShowExpanded
              ? 'px-4 py-3 rounded-lg mx-3'
              : 'w-12 h-12 justify-center items-center rounded-lg mx-auto'
          } ${
            item.active
              ? 'bg-[#E8C4A0]/20 text-[#8B6F47] font-medium'
              : 'text-warmGray-600 hover:bg-warmGray-100 hover:text-[#8B6F47]'
          } ${isSubItem ? 'ml-6 mr-6 py-2 text-sm' : shouldShowExpanded ? 'w-[calc(100%-1.5rem)]' : ''}`}
        >

          <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
            item.active ? 'text-[#8B6F47]' : 'text-warmGray-500 group-hover:text-[#8B6F47]'
          } ${shouldShowExpanded ? 'mr-3' : ''}`} />

          {shouldShowExpanded && (
            <span className={`font-medium text-sm transition-all duration-300 ${
              item.active ? 'text-[#8B6F47]' : 'text-warmGray-700 group-hover:text-[#8B6F47]'
            }`}>
              {item.label}
            </span>
          )}

          {/* Tooltip for collapsed state */}
          {!shouldShowExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-warmGray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </div>
          )}
        </button>

        {/* Sub-items */}
        {showSubItems && (
          <div className="mt-1 space-y-1">
            {item.subItems.map((subItem) => (
              <NavItem key={subItem.id} item={subItem} isSubItem={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Mobile overlay
  const MobileOverlay = () => (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${
        isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setIsMobileOpen(false)}
    />
  );

  // Mobile toggle button (3 lines menu for phone and tablet only)
  const MobileToggle = () => (
    <button
      onClick={() => setIsMobileOpen(true)}
      className="lg:hidden fixed top-20 left-4 z-20 bg-white rounded-xl p-2 shadow-lg border border-warmGray-200 hover:bg-warmGray-50 transition-all duration-200"
    >
      <svg className="w-6 h-6 text-warmGray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <MobileToggle />

      {/* Mobile Overlay */}
      <MobileOverlay />

      {/* Modern Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white z-50 transition-all duration-300 ease-in-out shadow-xl flex flex-col ${
          // Mobile/Tablet: hidden by default, shows when toggle is clicked
          isMobileOpen
            ? 'translate-x-0 w-72 lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop: always visible, expands on hover
          shouldShowExpanded ? 'lg:w-96' : 'lg:w-24'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo Section */}
        <div className={`flex items-center p-4 border-b border-warmGray-100 ${shouldShowExpanded ? 'justify-start' : 'justify-center'}`}>
          {shouldShowExpanded ? (
            <div className="flex items-center space-x-3">
              {/* Coffee Meetings Logo */}
              <div className="flex items-center justify-center w-20 h-20">
                <img
                  src="/logo.png"
                  alt="Coffee Meetings Logo"
                  className="w-18 h-16 object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#8B6F47]">CoffeeMeet</h1>
                <p className="text-xs text-warmGray-500">Plateforme RH</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-18 h-18">
              <img
                src="/logo.png"
                alt="Coffee Meetings Logo"
                className="w-16 h-14 object-contain"
              />
            </div>
          )}

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden ml-auto flex items-center justify-center w-8 h-8 rounded-lg hover:bg-warmGray-100 transition-all duration-200"
          >
            <svg className="w-5 h-5 text-warmGray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navigationItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="p-3 border-t border-warmGray-100">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center transition-all duration-300 group relative ${
              shouldShowExpanded ? 'px-4 py-3 rounded-lg mx-3 w-[calc(100%-1.5rem)]' : 'w-12 h-12 justify-center items-center rounded-lg mx-auto'
            } text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ArrowRightOnRectangleIcon className={`w-5 h-5 flex-shrink-0 ${shouldShowExpanded ? 'mr-3' : ''}`} />
            {shouldShowExpanded && (
              <span className="font-medium text-sm">
                {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
              </span>
            )}

            {/* Tooltip for collapsed state */}
            {!shouldShowExpanded && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-warmGray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Déconnexion
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
