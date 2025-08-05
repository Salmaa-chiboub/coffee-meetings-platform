import React, { useState } from 'react';
import { LazyLoadingGrid, LazyLoadingList } from '../ui/LazyLoadingContainer';
import useLazyLoading from '../../hooks/useLazyLoading';
import { useLazyLoadingConfig } from '../../hooks/useLazyLoadingConfig';

/**
 * Demo component to showcase lazy loading capabilities
 * This demonstrates the unified lazy loading system across different content types
 */
const LazyLoadingDemo = () => {
  const [selectedDemo, setSelectedDemo] = useState('campaigns');
  
  // Mock data generator
  const generateMockData = (page, pageSize, type) => {
    const items = [];
    const startId = (page - 1) * pageSize + 1;
    
    for (let i = 0; i < pageSize; i++) {
      const id = startId + i;
      items.push({
        id,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Item ${id}`,
        description: `This is a mock ${type} item for demonstration purposes. Item #${id}`,
        created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        status: Math.random() > 0.5 ? 'active' : 'completed',
        rating: Math.random() * 5,
        participants: Math.floor(Math.random() * 100) + 10
      });
    }
    
    return items;
  };

  // Mock fetch function
  const createMockFetch = (contentType) => async (page, pageSize) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const data = generateMockData(page, pageSize, contentType);
    const totalItems = 50; // Simulate total of 50 items
    const totalPages = Math.ceil(totalItems / pageSize);
    
    return {
      success: true,
      data,
      pagination: {
        current_page: page,
        page_size: pageSize,
        total_count: totalItems,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_previous: page > 1
      }
    };
  };

  // Demo configurations
  const demos = {
    campaigns: {
      title: 'Campaign Cards (Grid Layout)',
      contentType: 'campaigns',
      layout: 'grid'
    },
    history: {
      title: 'History Items (List Layout)',
      contentType: 'history',
      layout: 'list'
    },
    dashboard: {
      title: 'Dashboard Items (Small Batches)',
      contentType: 'dashboard',
      layout: 'list'
    },
    mobile: {
      title: 'Mobile Optimized',
      contentType: 'mobile',
      layout: 'grid'
    }
  };

  const currentDemo = demos[selectedDemo];
  
  // Get configuration for current demo
  const { config, isMobile, isSlowConnection } = useLazyLoadingConfig(currentDemo.contentType);

  // Lazy loading hook
  const {
    data: items,
    loading,
    loadingMore,
    error,
    hasMore,
    isEmpty,
    isFirstLoad,
    refresh,
    sentinelRef
  } = useLazyLoading({
    fetchData: createMockFetch(selectedDemo),
    contentType: currentDemo.contentType,
    resetTrigger: selectedDemo
  });

  // Render item based on layout
  const renderItem = (item) => {
    if (currentDemo.layout === 'grid') {
      return (
        <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {item.status}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{item.participants} participants</span>
            <span>★ {item.rating.toFixed(1)}</span>
          </div>
        </div>
      );
    } else {
      return (
        <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{item.description}</p>
            </div>
            <div className="ml-4 text-right">
              <div className={`px-2 py-1 text-xs rounded-full ${
                item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {item.status}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                ★ {item.rating.toFixed(1)} • {item.participants} participants
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Lazy Loading System Demo</h1>
        <p className="text-gray-600 mb-6">
          This demo showcases the unified lazy loading system with different configurations for various content types.
        </p>
        
        {/* Configuration Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Current Configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Page Size:</span>
              <span className="ml-2 text-blue-900">{config.pageSize}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Threshold:</span>
              <span className="ml-2 text-blue-900">{config.threshold}px</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Mobile:</span>
              <span className="ml-2 text-blue-900">{isMobile ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Slow Connection:</span>
              <span className="ml-2 text-blue-900">{isSlowConnection ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Demo Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(demos).map(([key, demo]) => (
            <button
              key={key}
              onClick={() => setSelectedDemo(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDemo === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {demo.title}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Content */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{currentDemo.title}</h2>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Lazy Loading Container */}
      {currentDemo.layout === 'grid' ? (
        <LazyLoadingGrid
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          hasMore={hasMore}
          isEmpty={isEmpty}
          isFirstLoad={isFirstLoad}
          onRetry={refresh}
          sentinelRef={sentinelRef}
          columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          gap="gap-4"
        >
          {items.map(renderItem)}
        </LazyLoadingGrid>
      ) : (
        <LazyLoadingList
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          hasMore={hasMore}
          isEmpty={isEmpty}
          isFirstLoad={isFirstLoad}
          onRetry={refresh}
          sentinelRef={sentinelRef}
          spacing="space-y-4"
        >
          {items.map(renderItem)}
        </LazyLoadingList>
      )}

      {/* Stats */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Loading Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Items Loaded:</span>
            <span className="ml-2 font-medium">{items.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Has More:</span>
            <span className="ml-2 font-medium">{hasMore ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="text-gray-600">Loading:</span>
            <span className="ml-2 font-medium">{loading ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="text-gray-600">Loading More:</span>
            <span className="ml-2 font-medium">{loadingMore ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LazyLoadingDemo;
