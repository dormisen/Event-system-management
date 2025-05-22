// components/AttendeeList.tsx
import { FC } from 'react';
import { EventType } from '../../assets/types';
import { Card } from './Card';

interface AttendeeListProps {
  event: EventType;
}

export const AttendeeList: FC<AttendeeListProps> = ({ event }) => (
  <Card className="p-4 shadow-lg">
    <h3 className="text-lg font-semibold mb-4 text-purple-700">Attendees ({event.attendees.length})</h3>
    <div className="space-y-2">
      {event.attendees.map(attendee => (
        <div 
          key={attendee._id} 
          className="flex justify-between items-center p-3 hover:bg-purple-50 rounded-lg transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-medium">
                  {attendee.user.name[0].toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-800">{attendee.user.name}</p>
              <p className="text-sm text-gray-500 truncate">{attendee.user.email}</p>
            </div>
          </div>
          <span className="text-purple-600 font-semibold">
            ${attendee.pricePaid.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  </Card>
);