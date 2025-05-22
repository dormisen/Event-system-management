// components/RevenueChart.tsx
import { FC } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { EventType } from '../../assets/types';
import { Card } from '@mui/material';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueChartProps {
  events: EventType[];
}

export const RevenueChart: FC<RevenueChartProps> = ({ events }) => {
  const data = {
    labels: events.map(event => new Date(event.date).toLocaleDateString()),
    datasets: [{
      label: 'Revenue',
      data: events.map(event => 
        event.attendees.reduce((sum, attendee) => sum + (attendee.pricePaid || 0), 0)
      ),
      borderColor: '#7c3aed',
      tension: 0.1,
      pointRadius: 4,
      pointBackgroundColor: '#7c3aed',
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#4B5563',
          font: {
            weight: '600'
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#E5E7EB' },
        ticks: { 
          color: '#6B7280',
          callback: (value: number | string) => `$${value}`
        }
      },
      x: {
        grid: { color: '#E5E7EB' },
        ticks: { color: '#6B7280' }
      }
    }
  };

  return (
    <Card className="p-4 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-purple-700">Revenue Overview</h3>
      <div className="relative h-72">
        <Line 
          data={data}
          options={options}
          redraw={true}
        />
      </div>
    </Card>
  );
};