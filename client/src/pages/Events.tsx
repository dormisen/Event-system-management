import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import API from '../api/axios';
import { EventType } from '../assets/types';
import EventCard from '../components/EventCard';
import Skeleton from '../components/Skeleton';
import EventFilters from '../components/EventFilters';

const ErrorBanner = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-8">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <p className="text-red-700">{message}</p>
      </div>
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <h3 className="mt-4 text-xl font-medium text-gray-900">No events found</h3>
    <p className="mt-2 text-gray-600">{message}</p>
  </div>
);

interface EventGridProps {
  events: EventType[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  totalEvents: number;
}

const EventGrid = ({ events, loading, hasMore, onLoadMore }: EventGridProps) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event._id} event={event} variant="user" />
      ))}

      {loading && [...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-96 rounded-2xl" />
      ))}
    </div>

    {hasMore && !loading && events.length > 0 && (
      <button
        onClick={onLoadMore}
        className="mt-8 w-full py-3 px-4 text-center bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        Load More Events
      </button>
    )}

    {!loading && events.length === 0 && (
      <EmptyState message="Try adjusting your filters or search query" />
    )}
  </>
);

const Events = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 500);
  const [totalEvents, setTotalEvents] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    date: '',
    sort: 'date-asc',
    priceRange: '',
    location: '',
  });

  const fetchEvents = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError('');
      
      // Parse price range
      let minPrice, maxPrice;
      if (filters.priceRange) {
        [minPrice, maxPrice] = filters.priceRange.split('-').map(Number);
      }

      const response = await API.get('/events/public/events', {
        params: { 
          page: reset ? 1 : page,
          search: debouncedQuery,
          upcomingOnly: true,
          category: filters.category,
          date: filters.date,
          minPrice,
          maxPrice,
          sort: filters.sort
        }
      });
      
      if (reset) {
        setEvents(response.data.events);
      } else {
        setEvents(prev => [...prev, ...response.data.events]);
      }
      setTotalEvents(response.data.total);
      setHasMore(response.data.page < response.data.pages);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, filters]);

  useEffect(() => {
    fetchEvents(true);
    setPage(1);
  }, [debouncedQuery, filters, fetchEvents]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Discover Events
        </h1>
        
        <div className="max-w-2xl mx-auto mb-8">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm"
          />
        </div>

        <EventFilters 
          filters={filters}
          onFilterChange={setFilters}
        />
      </div>

      {error && <ErrorBanner message={error} onRetry={() => fetchEvents(true)} />}

      <EventGrid
        events={events}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={() => setPage(prev => prev + 1)}
        totalEvents={totalEvents}
      />
    </div>
  );
};

export default Events;