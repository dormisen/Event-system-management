import { useEffect, useState } from 'react';
import { Card } from '../components/AD_co/Card';
import { Tabs, Tab } from '../components/AD_co/tabs';
import { EventType } from '../assets/types';
import API from '../api/axios';
interface StatCardProps {
  title: string;
  value: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Event {
  _id: string;
  title: string;
  date: string;
  status: string;
}

const EventTable = ({ events }: { events: Event[] }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {events.map(event => (
          <tr key={event._id}>
            <td className="px-6 py-4">{event.title}</td>
            <td className="px-6 py-4">{new Date(event.date).toLocaleDateString()}</td>
            <td className="px-6 py-4 capitalize">{event.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StatCard = ({ title, value }: StatCardProps) => (
  <Card className="p-4 text-center">
    <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
    <p className="text-3xl font-bold text-purple-600">{value}</p>
  </Card>
);

const UserTable = ({ users, onDelete }: { users: User[], onDelete: (userId: string) => void }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {users.map(user => (
          <tr key={user._id}>
            <td className="px-6 py-4">{user.name}</td>
            <td className="px-6 py-4">{user.email}</td>
            <td className="px-6 py-4 capitalize">{user.role}</td>
            <td className="px-6 py-4">
              <button
                onClick={() => onDelete(user._id)}
                className="text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface AdminDashboardProps {
  onDeleteUser: (userId: string) => Promise<void>;
  onUpdateUser: (userData: any) => Promise<void>;
}

export default function AdminDashboard({ onDeleteUser }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [stats, setStats] = useState({ users: 0, events: 0, organizers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
  const [statsRes, usersRes, eventsRes] = await Promise.all([
  API.get('/auth/admin/stats'), 
  API.get('/auth/admin/users'),
  API.get('/auth/admin/events')  
]);

  if (statsRes.status !== 200 || usersRes.status !== 200 || eventsRes.status !== 200) {
    throw new Error('Failed to fetch data');
  }

  setStats(statsRes.data);
  setUsers(usersRes.data);
  setEvents(eventsRes.data);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to load admin data');
} finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    try {
      await onDeleteUser(userId);
      const userToDelete = users.find(user => user._id === userId);
      const wasOrganizer = userToDelete?.role === 'organizer';

      setUsers(prev => prev.filter(user => user._id !== userId));
      setStats(prev => ({
        ...prev,
        users: prev.users - 1,
        organizers: wasOrganizer ? prev.organizers - 1 : prev.organizers
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Users" value={stats.users} />
        <StatCard title="Total Events" value={stats.events} />
        <StatCard title="Organizers" value={stats.organizers} />
      </div>

      <Tabs>
        <Tab label="Users">
          <UserTable
            users={users}
            onDelete={handleDeleteUser}
          />
        </Tab>
        <Tab label="Organizers">
          <UserTable
            users={users.filter(user => user.role === 'organizer')}
            onDelete={handleDeleteUser}
          />
        </Tab>
        <Tab label="Events">
          <EventTable events={events.map(event => ({
            _id: event._id,
            title: event.title,
            date: event.date,
            status: event.status
          }))} />
        </Tab>
      </Tabs>
    </div>
  );
}