'use client';

import { useState, useRef, KeyboardEvent } from 'react';

export interface TabConfig {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabContainerProps {
  tabs: TabConfig[];
  defaultActiveTab?: string;
  className?: string;
}

export function TabContainer({ tabs, defaultActiveTab, className = '' }: TabContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab || tabs[0]?.id || '');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tabIndex: number) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const prevIndex = tabIndex > 0 ? tabIndex - 1 : tabs.length - 1;
      tabRefs.current[prevIndex]?.focus();
      setActiveTab(tabs[prevIndex].id);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      const nextIndex = tabIndex < tabs.length - 1 ? tabIndex + 1 : 0;
      tabRefs.current[nextIndex]?.focus();
      setActiveTab(tabs[nextIndex].id);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveTab(tabs[tabIndex].id);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs" role="tablist">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`whitespace-nowrap py-3 px-2 sm:px-1 border-b-2 font-medium text-sm min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              role="tab"
              tabIndex={activeTab === tab.id ? 0 : -1}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div 
        className="mt-6 bg-white border border-gray-200 rounded-lg p-4 sm:p-6"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        <div 
          key={activeTab}
          className="animate-in fade-in-0 duration-200"
        >
          {activeTabContent}
        </div>
      </div>
    </div>
  );
}