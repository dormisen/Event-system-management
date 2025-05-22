// components/InvoiceGenerator.tsx
import { FC } from 'react';
import { Card } from '@mui/material';
import { EventType } from '../../assets/types';

interface InvoiceGeneratorProps {
  events: EventType[];
}

export const InvoiceGenerator: FC<InvoiceGeneratorProps> = ({ events }) => (
  <Card className="p-4 shadow-lg">
    <h3 className="text-lg font-semibold mb-4 text-purple-700">Generate Invoices</h3>
    <div className="space-y-2">
      {events.map(event => (
        <div key={event._id} className="flex justify-between items-center p-2 border-b">
          <span className="font-medium text-gray-700">{event.title}</span>
          <button 
            className="bg-gradient-to-r from-purple-500 to-blue-400 text-white px-4 py-2 rounded-xl font-medium hover:from-purple-600 hover:to-blue-500 transition-all flex items-center gap-2 shadow-md"
            onClick={() => window.print()}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M6 19H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2zm0-2v-1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1h2V9H4v8h2zM8 4v3h8V4H8z"/>
            </svg>
            Download Invoice
          </button>
        </div>
      ))}
    </div>
  </Card>
);