import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEventDetails } from '../api/Event';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { PaymentMethodSelector } from '../components/TicketSelector';
import { EventType } from '../assets/types';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import LoadingSpinner from '../components/AD_co/LoadingSpinner';
import { useAuth } from '../context/Authcontext';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import L from 'leaflet';
import { Helmet } from 'react-helmet';

// Fix leaflet marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, checkAuthStatus } = useAuth();
  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTickets, setSelectedTickets] = useState<{ [key: string]: number }>({});
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
useEffect(() => {
  if (!stripe || !elements) {
    setError('Payment system is initializing...');
    return;
  }
  setError('');
}, [stripe, elements]);
  useEffect(() => {
    let isMounted = true;
    const fetchEvent = async () => {
      try {
        const data = await getEventDetails(eventId!);
        await checkAuthStatus();
        if (isMounted) setEvent(data);
      } catch (err) {
        if (isMounted) setError('Failed to load event details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEvent();
    return () => { isMounted = false };
  }, [eventId]);

  const handleTicketChange = (ticketId: string, quantity: number) => {
    const ticket = event?.tickets.find(t => t._id === ticketId);
    if (!ticket) return;

    // Prevent quantity from going below 1
    quantity = Math.max(1, quantity);
    
    if (quantity > ticket.quantity) {
      setError(`Only ${ticket.quantity} tickets available for ${ticket.name}`);
      return;
    }

    setSelectedTickets(prev => ({ ...prev, [ticketId]: quantity }));
    setError('');
  };

  const calculateTotal = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketId, quantity]) => {
      const ticket = event?.tickets.find(t => t._id === ticketId);
      return total + (ticket?.price || 0) * quantity;
    }, 0);
  };

  const handlePayment = async () => {
    if (Object.values(selectedTickets).every(qty => qty === 0)) {
      setError('Please select at least one ticket');
      return;
    }
    try {
      setPaymentProcessing(true);
      if (!stripe || !elements || !user) {
        throw new Error('Payment system not ready');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const response = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.accessToken}`
        },
        body: JSON.stringify({
          eventId,
          tickets: Object.entries(selectedTickets).map(([id, quantity]) => ({ id, quantity }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement }
      });

      if (error) throw error;

      await fetch(`/api/payment/verify?session_id=${paymentIntent.id}`);
      navigate('/payment/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (!event?.organizer?.organizerInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Payment Not Ready</h2>
        <p className="text-gray-600 max-w-md">Please wait while we load the payment information.</p>
      </div>
    );
  }

  if (!event || !event.organizer.organizerInfo?.stripeAccountId || 
    event.organizer.organizerInfo.stripeAccountStatus !== 'verified') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Tickets Unavailable</h2>
        <p className="text-gray-600 max-w-md">The event organizer hasn't set up payment processing yet.</p>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <LoadingSpinner size="large" />
        <p className="text-gray-600">Loading event details...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Oops! Something went wrong</h2>
      <p className="text-gray-600 mb-4 max-w-md">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  if (!event) return <div className="text-center mt-8">Event not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600&display=swap" rel="stylesheet" />
      </Helmet>

      <button
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Events
      </button>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h1 
            className="text-4xl font-bold mb-4 text-gray-900"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {event.title}
          </h1>
          
          <div className="flex items-center gap-4 mb-6 text-gray-600">
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <CalendarIcon className="w-5 h-5" />
              <span className="text-sm font-medium">
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <MapPinIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{event.location}</span>
            </div>
          </div>

          {event.media && event.media.length > 0 ? (
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
              <Carousel
                showArrows={true}
                showThumbs={event.media.length > 1}
                showStatus={false}
                infiniteLoop={true}
                className="event-carousel"
              >
                {event.media.map((mediaUrl, index) => (
                  <div key={index} className="h-96 relative">
                    <img
                      src={mediaUrl}
                      alt={`Event media ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-white text-sm text-right">
                        Photo {index + 1} of {event.media?.length ?? 0}
                      </p>
                    </div>
                  </div>
                ))}
              </Carousel>
            </div>
          ) : (
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80"
                alt="Default event"
                className="w-full h-96 object-cover"
              />
            </div>
          )}

          <div className="prose max-w-none mb-8">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">About the Event</h3>
            <p className="text-gray-700 leading-relaxed text-lg">{event.description}</p>
          </div>

          {event.cordinates && (
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Event Location</h3>
              <div className="bg-gray-100 p-6 rounded-xl mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <MapPinIcon className="w-8 h-8 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-900">{event.location}</p>
                    <p className="text-sm text-gray-600">Exact location provided after purchase</p>
                  </div>
                </div>
                <div className="h-96 rounded-xl overflow-hidden shadow-lg relative">
                  <MapContainer
                    center={[event.cordinates.lat, event.cordinates.lng]}
                    zoom={15}
                    className="h-full w-full"
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[event.cordinates.lat, event.cordinates.lng]}>
                      <Popup className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-5 h-5 text-indigo-600" />
                          {event.location}
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                  <div className="absolute top-2 right-2 z-[1000] bg-white p-2 rounded-lg shadow-md">
                    <p className="text-xs text-gray-600">
                      {event.cordinates.lat.toFixed(4)}, {event.cordinates.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-1 sticky top-8 h-fit bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">Tickets</h3>

          {event.tickets?.map(ticket => (
            <div key={ticket._id} className="mb-4 p-4 border rounded-lg hover:border-indigo-200 transition-colors bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">{ticket.name}</h4>
                  <p className="text-xl font-bold text-indigo-600 mb-2">${ticket.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mb-3">
                    {ticket.quantity > 0 
                      ? `${ticket.quantity} tickets remaining`
                      : 'Sold out'}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTicketChange(ticket._id, (selectedTickets[ticket._id] || 1) - 1)}
                      className="px-3 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      disabled={(selectedTickets[ticket._id] || 1) <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-lg font-medium">
                      {selectedTickets[ticket._id] || 0}
                    </span>
                    <button
                      onClick={() => handleTicketChange(ticket._id, (selectedTickets[ticket._id] || 0) + 1)}
                      className="px-3 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                      disabled={(selectedTickets[ticket._id] || 0) >= ticket.quantity}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {Object.values(selectedTickets).some(qty => qty > 0) && (
            <div className="border-t pt-4 mt-4">
              <PaymentMethodSelector onMethodSelect={() => setShowPaymentForm(true)} />

              {showPaymentForm && (
                <div className="mt-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card details
                    </label>
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#1a1a1a',
                            '::placeholder': {
                              color: '#a0aec0',
                            },
                          },
                          invalid: {
                            color: '#e53e3e',
                          },
                        },
                      }}
                      className="p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <span className="font-semibold text-gray-700">Total:</span>
                    <span className="text-xl font-bold text-indigo-600">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={paymentProcessing || !stripe}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="small" />
                        Processing...
                      </span>
                    ) : 'Purchase Tickets'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

export default EventDetails;