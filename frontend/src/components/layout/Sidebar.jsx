import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // State management
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load saved preference from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-expanded');
    if (savedState !== null) {
      setIsExpanded(JSON.parse(savedState));
    }
  }, []);

  // Save preference to localStorage and notify layout
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('sidebar-expanded', JSON.stringify(newState));

    // Dispatch custom event for same-tab layout updates
    window.dispatchEvent(new CustomEvent('sidebarToggle', {
      detail: { isExpanded: newState }
    }));
  };

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

  // Navigation items - Focused on HR manager organizing employee coffee meetings
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      path: '/dashboard',
      active: location.pathname === '/dashboard'
    },
    {
      id: 'campaigns',
      label: 'Coffee Campaigns',
      icon: CalendarDaysIcon,
      path: '/campaigns',
      active: location.pathname.startsWith('/campaigns'),
      subItems: [
        {
          id: 'all-campaigns',
          label: 'All Campaigns',
          icon: CalendarDaysIcon,
          path: '/campaigns',
          active: location.pathname === '/campaigns'
        },
        {
          id: 'create-campaign',
          label: 'Create Campaign',
          icon: PlusIcon,
          path: '/campaigns/create',
          active: location.pathname === '/campaigns/create'
        },
        {
          id: 'active-campaigns',
          label: 'Active Campaigns',
          icon: ClockIcon,
          path: '/campaigns/active',
          active: location.pathname === '/campaigns/active'
        },
        {
          id: 'completed-campaigns',
          label: 'Completed',
          icon: CheckCircleIcon,
          path: '/campaigns/completed',
          active: location.pathname === '/campaigns/completed'
        },
        {
          id: 'campaign-history',
          label: 'Campaign History',
          icon: DocumentTextIcon,
          path: '/campaigns/history',
          active: location.pathname === '/campaigns/history'
        }
      ]
    },
    {
      id: 'employees',
      label: 'Employee Management',
      icon: UserGroupIcon,
      path: '/employees',
      active: location.pathname.startsWith('/employees'),
      subItems: [
        {
          id: 'all-employees',
          label: 'All Employees',
          icon: UserGroupIcon,
          path: '/employees',
          active: location.pathname === '/employees'
        },
        {
          id: 'import-employees',
          label: 'Import Employees',
          icon: PlusIcon,
          path: '/employees/import',
          active: location.pathname === '/employees/import'
        }
      ]
    },
    {
      id: 'profile',
      label: 'Profile & Settings',
      icon: CogIcon,
      path: '/settings',
      active: location.pathname.startsWith('/settings')
    }
  ];

  // Navigation item component
  const NavItem = ({ item, isSubItem = false }) => {
    const Icon = item.icon;
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const showSubItems = isExpanded && hasSubItems && item.active;

    return (
      <div className="mb-2">
        <button
          onClick={() => navigate(item.path)}
          className={`w-full flex items-center text-left transition-all duration-200 rounded-xl group relative overflow-hidden ${
            isExpanded ? 'px-4 py-3' : 'px-3 py-3 justify-center'
          } ${
            item.active
              ? 'bg-gradient-to-r from-[#E8C4A0] to-[#DDB892] text-[#8B6F47] shadow-lg'
              : 'text-warmGray-600 hover:bg-warmGray-100 hover:text-warmGray-800'
          } ${isSubItem ? 'ml-4 py-2' : ''}`}
        >
          {/* Active indicator */}
          {item.active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8B6F47] rounded-r-full"></div>
          )}

          <Icon className={`${isExpanded ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0 transition-all duration-200 ${
            item.active ? 'text-[#8B6F47]' : 'text-warmGray-500 group-hover:text-warmGray-700'
          } ${isExpanded ? 'mr-3' : ''}`} />

          {isExpanded && (
            <span className={`font-medium ${isSubItem ? 'text-sm' : 'text-sm'} transition-all duration-200 ${
              item.active ? 'text-[#8B6F47]' : 'text-warmGray-700 group-hover:text-warmGray-800'
            }`}>
              {item.label}
            </span>
          )}
        </button>
        
        {/* Sub-items */}
        {showSubItems && (
          <div className="mt-1 space-y-1 ml-2">
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

  // Mobile toggle button
  const MobileToggle = () => (
    <button
      onClick={() => setIsMobileOpen(true)}
      className="lg:hidden fixed top-4 left-4 z-30 bg-white rounded-lg p-2 shadow-lg border border-warmGray-200 hover:bg-warmGray-50 transition-all duration-200"
    >
      <Bars3Icon className="w-6 h-6 text-warmGray-600" />
    </button>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <MobileToggle />
      
      {/* Mobile Overlay */}
      <MobileOverlay />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white border-r border-warmGray-200 z-50 transition-all duration-300 ease-in-out shadow-lg ${
          // Mobile styles
          isMobileOpen
            ? 'translate-x-0 w-80 lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop styles
          isExpanded ? 'lg:w-80' : 'lg:w-20'
        }`}
      >
        {/* Header - Enhanced with Logo */}
        <div className="flex items-center justify-between p-4 border-b border-warmGray-200">
          {/* Logo Section */}
          {isExpanded && (
            <div className="flex items-center space-x-3">
              {/* Coffee Cup Logo */}
              <div className="flex items-center justify-center w-10 h-10 bg-[#E8C4A0] rounded-xl shadow-sm">
                <svg
                  className="w-6 h-6 text-[#8B6F47]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                  <line x1="6" x2="6" y1="2" y2="4" />
                  <line x1="10" x2="10" y1="2" y2="4" />
                  <line x1="14" x2="14" y1="2" y2="4" />
                </svg>
              </div>

              {/* Platform Title */}
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-warmGray-800 leading-tight">
                  CoffeeMeet
                </h1>
                <p className="text-xs text-warmGray-500 leading-tight">
                  Employee Coffee Meeting Platform
                </p>
              </div>
            </div>
          )}

          {/* Collapsed Logo */}
          {!isExpanded && (
            <div className="flex items-center justify-center w-10 h-10 bg-[#E8C4A0] rounded-xl shadow-sm mx-auto">
              <svg
                className="w-6 h-6 text-[#8B6F47]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="6" x2="6" y1="2" y2="4" />
                <line x1="10" x2="10" y1="2" y2="4" />
                <line x1="14" x2="14" y1="2" y2="4" />
              </svg>
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleExpanded}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-warmGray-100 transition-all duration-200"
          >
            {isExpanded ? (
              <ChevronLeftIcon className="w-4 h-4 text-warmGray-600" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-warmGray-600" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-warmGray-100 transition-all duration-200 ml-auto"
          >
            <XMarkIcon className="w-4 h-4 text-warmGray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigationItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-warmGray-200">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center px-4 py-3 text-left transition-all duration-200 rounded-r-2xl text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRightOnRectangleIcon className={`${isExpanded ? 'w-5 h-5 mr-3' : 'w-6 h-6'} flex-shrink-0`} />
            {isExpanded && (
              <span className="font-medium">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
