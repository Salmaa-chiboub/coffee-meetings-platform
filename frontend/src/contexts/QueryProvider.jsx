import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Lazy load devtools only in development
const ReactQueryDevtools = process.env.NODE_ENV === 'development'
  ? React.lazy(() => import('@tanstack/react-query-devtools').then(module => ({ default: module.ReactQueryDevtools })))
  : null;

// Create an optimized client with better caching strategies
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Aggressive caching for better performance
      staleTime: 10 * 60 * 1000, // 10 minutes - data is considered fresh
      cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
      // Background refetch for better UX
      refetchInterval: false, // Disable automatic background refetch
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 1,
      // Optimistic updates for better UX
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development and lazy load them */}
      {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtools
            initialIsOpen={false}
            position="bottom-right"
          />
        </React.Suspense>
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider;
