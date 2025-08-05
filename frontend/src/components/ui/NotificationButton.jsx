import React, { useState } from 'react';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const NotificationButton = () => {
  const [hasNotifications, setHasNotifications] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: 'New Campaign Created',
      message: 'Coffee Meeting Campaign "Q1 Team Building" has been created',
      time: '2 minutes ago',
      unread: true,
      type: 'campaign'
    },
    {
      id: 2,
      title: 'Evaluation Completed',
      message: 'John Doe completed their coffee meeting evaluation',
      time: '1 hour ago',
      unread: true,
      type: 'evaluation'
    },
    {
      id: 3,
      title: 'Campaign Ended',
      message: 'Campaign "December Connections" has ended successfully',
      time: '3 hours ago',
      unread: false,
      type: 'campaign'
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="relative">
      {/* Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100/50 transition-all duration-200 focus:outline-none"
      >
        <BellIcon className="w-5 h-5 text-gray-600" />

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 backdrop-blur-sm">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                    notification.unread ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Notification Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
                      notification.type === 'campaign' 
                        ? 'bg-[#E8C4A0] text-[#8B6F47]' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <BellIcon className="w-4 h-4" />
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {notification.title}
                        </p>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <BellIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <button className="w-full text-sm text-[#8B6F47] hover:text-[#6B5537] font-medium transition-colors">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationButton;
