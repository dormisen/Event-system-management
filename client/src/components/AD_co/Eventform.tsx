// components/EventForm.tsx
import { FC, useState } from 'react';
import { Card } from './Card';
import { EventType } from '../../assets/types';

interface EventFormProps {
  onSubmit: (eventData: Partial<EventType>) => void;
  initialData?: Partial<EventType>;
}

export const EventForm: FC<EventFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<EventType>>(initialData || {
    title: '',
    description: '',
    date: '',
    location: '',
    tickets: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-purple-700">Create New Event</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Event Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Event Date</label>
          <input
            type="datetime-local"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          />
        </div>

        <div className="mt-4">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-600 transition-all transform hover:scale-[1.02] shadow-md"
          >
            Save Event
          </button>
        </div>
      </form>
    </Card>
  );
};