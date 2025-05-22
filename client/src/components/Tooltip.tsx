import React from 'react';
import { FiInfo } from 'react-icons/fi';
interface TooltipProps {
  message: string;
  children: React.ReactNode;
}
export default function Tooltip({ message, children }: TooltipProps): React.ReactElement {
  return (
  <div className="group relative inline-block">
    {children}
    <FiInfo className="ml-1 h-4 w-4 text-gray-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-700 text-white text-xs rounded-lg p-2 z-10">
      {message}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-solid border-transparent border-t-gray-700"> {message}</div>
    </div>
  </div>
  );
}