// components/EventFilters.tsx
import { EventFiltersProps } from '../assets/types';
import  { useState } from 'react';
const EventFilters: React.FC<EventFiltersProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    priceRange: '',
    category: '',
    location: '',
    sort: 'date-asc'
  });

  const handleFilterChange = (name: string, value: string) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Categories</option>
          <option value="music">Music</option>
          <option value="sports">Sports</option>
          <option value="tech">Technology</option>
        </select>
        <input
          type="date"
          value={filters.date}
          onChange={(e) => handleFilterChange('date', e.target.value)}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
        />

        <select
        
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
          <option value="date-asc">Date: Earliest First</option>
          <option value="date-desc">Date: Latest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
};

export default EventFilters;