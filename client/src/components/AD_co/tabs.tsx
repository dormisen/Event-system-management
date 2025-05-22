// components/ui/tabs.tsx
import { FC, ReactNode, useState } from 'react';

interface TabProps {
  label: string;
  children: ReactNode;
}

interface TabsProps {
  children: ReactNode[];
}

export const Tabs: FC<TabsProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="border-b border-gray-200">
      <div className="flex space-x-4">
        {children.map((child, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`pb-3 px-4 font-medium text-sm relative transition-colors duration-200 ${
              activeTab === index
                ? 'text-purple-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-purple-500 after:rounded-full'
                : 'text-gray-500 hover:text-gray-700 hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:w-full hover:after:h-1 hover:after:bg-gray-200'
            }`}
          >
            {(child as React.ReactElement<TabProps>).props.label}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {children[activeTab]}
      </div>
    </div>
  );
};

export const Tab: FC<TabProps> = ({ children }) => <>{children}</>;