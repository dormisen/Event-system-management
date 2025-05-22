import { useParams } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import { useState, useEffect } from 'react';
import API from '../api/axios';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

export default function ODashboard() {
  const { eventId } = useParams();
  const { } = useAuth();
  const [eventData, setEventData] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const [eventRes, attendeesRes] = await Promise.all([
          API.get(`/events/${eventId}`),
          API.get(`/events/${eventId}/attendees`)
        ]);
        setEventData(eventRes.data);
        setAttendees(attendeesRes.data);
      } catch (error) {
        console.error('Error fetching event data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId) fetchEventData();
  }, [eventId]);

  const chartOptions: ApexOptions = {
    chart: {
      type: 'donut' as const,
    },
    labels: ['Available', 'Sold'],
    colors: ['#3B82F6', '#10B981']
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {loading ? "Loading..." : `${eventData?.title} Management`}
      </h1>
      
      {!loading && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Ticket Sales</h2>
            <Chart
              options={chartOptions}
              series={[eventData?.totalTickets - eventData?.ticketsSold, eventData?.ticketsSold]}
              type="donut"
              width="100%"
            />
            <div className="mt-4 space-y-2">
              <p>Total Revenue: ${eventData?.revenue?.toFixed(2)}</p>
              <p>Tickets Available: {eventData?.totalTickets - eventData?.ticketsSold}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Attendees ({attendees.length})</h2>
            <div className="max-h-96 overflow-y-auto">
              {attendees.map(attendee => (
                <div key={attendee.id} className="py-2 border-b">
                  <p className="font-medium">{attendee.name}</p>
                  <p className="text-sm text-gray-600">{attendee.email}</p>
                  <p className="text-sm text-gray-500">
                    Purchased: {new Date(attendee.purchaseDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Management Tools</h2>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                Export Attendee List (CSV)
              </button>
              <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
                Send Event Updates
              </button>
              <button className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700">
                Cancel Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}