import { format } from 'date-fns';
import { EventType } from '../assets/types';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiCalendar, FiInfo, FiHeart, FiShare2 } from 'react-icons/fi';
import LazyLoad from 'react-lazyload';

const defaultImages = [
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1621609764095-b32bbe3792f1?auto=format&fit=crop&w=800&q=80',
// Concert/音乐节
  'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=800&q=80',
  
  // Conference/会议
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  
  // Party/派对
  'https://images.unsplash.com/photo-1514525253160-7e3202118098?auto=format&fit=crop&w=800&q=80',
  
  // Sports/体育
  'https://images.unsplash.com/photo-1541250628459-d8e1fdde1457?auto=format&fit=crop&w=800&q=80',
  
  // Festival/节日
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
  
  // Theater/剧院
  'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?auto=format&fit=crop&w=800&q=80',
  
  // Food Event/美食活动
  'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80',
  
  // Art Exhibition/艺术展
  'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80',
  
  // Networking/社交活动
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
  
  // Outdoor Adventure/户外活动
  'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80'
];

interface EventCardProps {
  event: EventType;
  variant?: 'user' | 'organizer';
  onDelete?: (eventId: string) => Promise<void>;
}

export default function EventCard({ event, variant = 'user' }: EventCardProps) {
  const navigate = useNavigate();
  const imageUrl = event.image || defaultImages[Math.floor(Math.random() * defaultImages.length)];

  return (
    <div className="relative group rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-out bg-white">
      <div className="relative aspect-video overflow-hidden">
        <LazyLoad height={200} offset={100}>
          <img 
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </LazyLoad>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
        
        <div className="absolute top-3 right-3 flex gap-2">
          <button className="p-2 backdrop-blur-sm bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <FiHeart className="w-5 h-5 text-white" />
          </button>
          <button className="p-2 backdrop-blur-sm bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <FiShare2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <h3 
            className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors cursor-pointer"
            onClick={() => navigate(`/event/${event._id}`)}
          >
            {event.title}
          </h3>
          
          <div className="flex flex-col gap-2 text-gray-600">
            <div className="flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span className="text-sm">
                {format(new Date(event.date), 'MMM do, yyyy - h:mm a')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiMapPin className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span className="text-sm line-clamp-1">{event.location}</span>
            </div>
          </div>
        </div>

        {event.description && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <FiInfo className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span className="text-sm font-medium">Description</span>
            </div>
            <p className="text-gray-600 text-sm line-clamp-3">
              {event.description}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          {event.tickets?.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                ${Math.min(...event.tickets.map(t => t.price))}+
              </span>
              <span className="text-sm text-gray-500">
                {event.tickets.length} ticket option{event.tickets.length > 1 && 's'}
              </span>
            </div>
          )}
          <button 
            onClick={() => navigate(`/event/${event._id}`)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all flex items-center gap-2"
          >
            <span>View Details</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>

      {variant === 'organizer' && (
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-indigo-600 shadow-sm">
          Your Event
        </div>
      )}
    </div>
  );
}