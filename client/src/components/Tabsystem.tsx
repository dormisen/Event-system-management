import { Children, ReactElement, cloneElement } from 'react';

interface TabSystemProps {
  children: ReactElement[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabSystem = ({ children, activeTab, setActiveTab }: TabSystemProps) => (
  <div className="flex gap-4 mb-8 border-b border-gray-200">
    {Children.map(children, (child) => cloneElement(child, {
      isActive: activeTab === (child as ReactElement<TabProps>).props.tabId,
      onClick: () => setActiveTab((child as ReactElement<TabProps>).props.tabId)
    } as Partial<TabProps>))}
  </div>
);

interface TabProps {
  tabId: string;
  isActive?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Tab = ({ tabId, isActive, onClick, children }: TabProps) => (
  <button
    role="tab"
    id={tabId}
    aria-selected={isActive}
    onClick={onClick}
    className={`px-6 py-3 rounded-t-lg font-medium ${
      isActive
        ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white'
        : 'text-gray-600 hover:bg-blue-50'
    }`}
  >
    {children}
  </button>
);

export default TabSystem;