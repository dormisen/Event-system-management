
import { useAuth } from '../context/Authcontext';
import { Link, Navigate } from 'react-router-dom';
import { EventType } from '../assets/types';
import { useEffect, useState } from 'react';
import API from '../api/axios';
import { toast } from 'react-hot-toast';
import EventCard from '../components/EventCard';
import EventFilters from '../components/EventFilters';
import ConfirmationDialog from '../components/ConfirmationDialog';
import LoadingSpinner from '../components/AD_co/LoadingSpinner';
import { FiPlus, FiSettings, FiAlertTriangle, FiDollarSign, FiUsers, FiCalendar } from 'react-icons/fi';
import { Tabs, Tab } from '../components/AD_co/tabs';
import { RevenueChart } from '../components/AD_co/Revnuecard';
import { AttendeeList } from '../components/AD_co/attlist';
import { InvoiceGenerator } from '../components/AD_co/invoice';
import { WalletDashboard } from '../components/PAY/WalletDashboard';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<EventType[]>([]);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    sort: 'date-asc',
    priceRange: '',
    category: '',
    location: ''
  });

  const handleSetupPayments = async () => {
    if (!user?.organizerInfo?.verified) {
      toast.error('Complete organizer verification first');
      return;
    }

    try {
      const { data } = await API.get('/connect/onboard-organizer');
      window.location.href = data.url;
    } catch (error) {
      toast.error('Failed to setup payments');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await API.delete(`/events/${eventId}`);
      setEvents(prev => prev.filter(event => event._id !== eventId));
      toast.success('Event deleted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete event');
    } finally {
      setDeleteCandidate(null);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await API.get('/events', { params: filters });
        setEvents(res.data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'organizer' && user?.organizerInfo?.verified) {
      fetchEvents();
    }
  }, [user, filters]);

  if (user?.role !== 'organizer') {
    return <Navigate to="/" replace />;
  }

  if (!user?.organizerInfo?.verified) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-center gap-3">
            <FiAlertTriangle className="w-6 h-6 text-yellow-600" />
            <h2 className="text-lg font-semibold">Your organizer account is pending verification</h2>
          </div>
        </div>
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all"
        >
          Back to Profile
        </Link>
      </div>
    );
  }

  // Stats calculations
  const totalRevenue = events.reduce((sum, event) =>
    sum + event.attendees.reduce((a, b) => a + (b.pricePaid || 0), 0), 0
  );
  const totalAttendees = events.reduce((sum, event) => sum + event.attendees.length, 0);
  const [showStripeAlert, setShowStripeAlert] = useState(true);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">

      {/* Payment Gateway Status*/}
    
      {showStripeAlert && user?.organizerInfo.stripeAccountId &&
        user?.organizerInfo?.stripeAccountStatus === 'verified' && (
          <div
            className="p-4 mb-4 bg-green-50 border-2 border-green-400 rounded-lg shadow-lg animate-slideIn cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => setShowStripeAlert(false)}
          >
            <div className="flex items-center gap-3 text-green-800">
              <span className="animate-jump animate-once">🎉</span>
              <div>
                <p className="font-medium text-lg">Payment Gateway Active!</p>
                <p className="text-sm mt-1">
                  Your Stripe account is verified and ready to process payments.
                  Payouts will follow your Stripe schedule automatically.
                </p>
              </div>
            </div>
            <div className="text-right mt-2 text-green-600 text-sm">
              Click anywhere to dismiss
            </div>
          </div>
        )}


      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
          <p className="text-gray-600 mt-2">Manage your events and track performance</p>
        </div>

        {!user?.organizerInfo.stripeAccountId && user?.organizerInfo?.stripeAccountStatus === 'verified' && (
          <button
            onClick={handleSetupPayments}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl hover:from-green-700 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
          >
            <FiSettings className="w-5 h-5" />
            Complete Payment Setup
          </button>
        )}

      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiCalendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Attendees</p>
              <p className="text-2xl font-bold text-gray-900">{totalAttendees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs>
        <Tab label="Events Management">
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <EventFilters
                filters={filters}
                onFilterChange={setFilters}
                organizerView
              />
              <Link
                to="/create-event"
                className="flex items-center px-6 py-3 h-20 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl hover:from-purple-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
              >
                <FiPlus className="w-5 h-5" />
                Create New Event
              </Link>
            </div>

            {/* Events List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold mb-4">No events found</h2>
                <p className="text-gray-600 mb-6">Get started by creating your first event</p>
                <Link
                  to="/create-event"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl hover:from-purple-700 hover:to-blue-600 transition-all"
                >
                  <FiPlus className="w-5 h-5" />
                  Create Event
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    variant="organizer"
                    onDelete={async (eventId: string) => setDeleteCandidate(eventId)}
                  />
                ))}
              </div>
            )}
          </div>
        </Tab>

        <Tab label="Wallet & Payments">
          <div className="space-y-6">
            <WalletDashboard />
            {user?.organizerInfo.stripeAccountId && user?.organizerInfo?.stripeAccountStatus === 'pending' && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-700">
                  Complete Stripe onboarding to enable payouts
                </p>
              </div>
            )}
          </div>
        </Tab>
        <Tab label="Event Analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart events={events} />
            <div className="space-y-6">
              <InvoiceGenerator events={events} />
              {events.length > 0 && (
                <AttendeeList event={events[0]} />
              )}
            </div>
          </div>
        </Tab>
      </Tabs>

      <ConfirmationDialog
        isOpen={!!deleteCandidate}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        onConfirm={() => deleteCandidate && handleDeleteEvent(deleteCandidate)}
        onCancel={() => setDeleteCandidate(null)}
      />

      {user?.organizerInfo.stripeAccountId && user?.organizerInfo?.stripeAccountStatus === 'pending' && (
        <div className="bg-yellow-100 p-4 rounded-lg mb-6">
          <p className="text-yellow-800">
            Stripe onboarding incomplete!
            <button
              onClick={handleSetupPayments}
              className="text-blue-600 hover:underline"
            >
              Complete setup here
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;