import { useState, useEffect } from 'react';
import { useAuth } from '../context/Authcontext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationType {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface TicketType {
  name: string;
  price: string;
  quantity: string;
  description: string;
}

export default function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: {
      address: '',
      coordinates: { lat: 0, lng: 0 }
    } as LocationType,
    tickets: [] as TicketType[],
    media: [] as string[],
  });

  useEffect(() => {
    if (user && (!user.organizerInfo?.verified || user.role !== 'organizer')) {
      navigate('/register-organization');
    } else if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleImageUpload = async (files: FileList) => {
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'your_upload_preset'); // Cloudinary preset

      try {
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/your_cloud_name/image/upload`,
          formData
        );
        uploadedUrls.push(res.data.secure_url);
      } catch (error) {
        toast.error('Failed to upload image');
      }
    }
    setFormData(prev => ({ ...prev, media: [...prev.media, ...uploadedUrls] }));
  };

  const handleGeocodeAddress = async () => {
    if (!formData.location.address) return;
    setIsGeocoding(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location.address)}`
      );
      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: { lat: parseFloat(lat), lng: parseFloat(lon) }
          }
        }));
      }
    } catch (error) {
      toast.error('Could not find location');
    }
    setIsGeocoding(false);
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: { lat: e.latlng.lat, lng: e.latlng.lng }
          }
        }));
      },
    });
    return null;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location.coordinates.lat || !formData.location.coordinates.lng) {
      return toast.error('Please select a location on the map');
    }

    setIsSubmitting(true);
    try {
      const eventData = {
        ...formData,
        location: formData.location.address,
        coordinates: formData.location.coordinates,
        date: new Date(formData.date).toISOString(),
        tickets: formData.tickets.map(ticket => ({
          ...ticket,
          price: parseFloat(ticket.price),
          quantity: parseInt(ticket.quantity)
        }))
      };

      await API.post('/events', eventData);
      toast.success('Event created successfully!');
      navigate('/organizer/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.msg || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Create New Event</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title & Description */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>

        {/* Location & Map */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Location <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Search address..."
                value={formData.location.address}
                onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
              />
              <button
                type="button"
                onClick={handleGeocodeAddress}
                disabled={isGeocoding}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isGeocoding ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {formData.location.coordinates.lat !== 0 && (
            <div className="h-96 rounded-lg overflow-hidden">
              <MapContainer
                center={[formData.location.coordinates.lat, formData.location.coordinates.lng]}
                zoom={13}
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[formData.location.coordinates.lat, formData.location.coordinates.lng]} />
                <MapClickHandler />
              </MapContainer>
            </div>
          )}
        </div>

        {/* Media Upload */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Event Photos</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-600 rounded-lg border-2 border-dashed border-blue-400 cursor-pointer hover:border-blue-600">
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Drag images or click to upload</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {formData.media.map((url, index) => (
              <div key={index} className="relative group">
                <img src={url} alt="" className="h-32 w-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, media: prev.media.filter((_, i) => i !== index) }))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">Tickets</label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({
                ...prev,
                tickets: [...prev.tickets, { name: '', price: '', quantity: '', description: '' }]
              }))}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Ticket Type
            </button>
          </div>

          {formData.tickets.map((ticket, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between">
                <h4 className="font-medium">Ticket Type #{index + 1}</h4>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    tickets: prev.tickets.filter((_, i) => i !== index)
                  }))}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Ticket Name"
                  value={ticket.name}
                  onChange={e => {
                    const newTickets = [...formData.tickets];
                    newTickets[index] = { ...ticket, name: e.target.value };
                    setFormData({ ...formData, tickets: newTickets });
                  }}
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={ticket.price}
                  onChange={e => {
                    const newTickets = [...formData.tickets];
                    newTickets[index] = { ...ticket, price: e.target.value };
                    setFormData({ ...formData, tickets: newTickets });
                  }}
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={ticket.quantity}
                  onChange={e => {
                    const newTickets = [...formData.tickets];
                    newTickets[index] = { ...ticket, quantity: e.target.value };
                    setFormData({ ...formData, tickets: newTickets });
                  }}
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={ticket.description}
                  onChange={e => {
                    const newTickets = [...formData.tickets];
                    newTickets[index] = { ...ticket, description: e.target.value };
                    setFormData({ ...formData, tickets: newTickets });
                  }}
                  className="p-2 border rounded"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
        >
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}