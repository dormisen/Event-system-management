import { EventType } from '../assets/types';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'; // Changed port to 5000

export const fetchUserEvents = async (): Promise<EventType[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
      credentials: 'include' // Sends cookies
    });

    if (response.status === 401) {
      throw new Error('Unauthorized - Please login again');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/event/${eventId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (response.status === 403) {
      throw new Error('You are not authorized to delete this event');
    }

    if (!response.ok) {
      throw new Error(`Failed to delete event: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};


export const createEvent = async (eventData: Omit<EventType, '_id' | 'organizer'>): Promise<EventType> => {
  try {
    const response = await fetch(`${API_BASE_URL}/events`, { 
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData), 
    });

    if (!response.ok) {
      throw new Error(`Event creation failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const getEventDetails = async (eventId: string): Promise<EventType> => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/event/${eventId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch event details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw error;
  }
};
export async function updateUser(userData: any) {
  const response = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error('Failed to update user profile');
  return response.json();
}