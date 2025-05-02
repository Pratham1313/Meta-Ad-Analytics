import React, { useState } from 'react';

const Sidebar = ({ setActiveComponent, activeComponent }) => {
  const [expanded, setExpanded] = useState(true);

  const navItems = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: "Account Overview",
      id: "account"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Campaign Analytics",
      id: "campaignAnalytics"
      },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5z" />
        </svg>
      ),
      title: "Adset Analytics",
      id: "adsetAnalytics"
    } ,
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5z" />
        </svg>
      ),
      title: "Creative Analytics",
      id: "adAnalytics"
    }
  ];

  return (
    <div className={`bg-white h-full shadow-lg transition-all duration-300 flex flex-col ${expanded ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <h2 className={`text-[#1877F2] font-semibold ${expanded ? 'block' : 'hidden'}`}>Meta Ad Manager</h2>
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="text-gray-500 hover:text-[#1877F2] focus:outline-none"
        >
          {expanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      <div className="py-4 flex-grow">
        <p className={`px-4 text-xs font-medium text-gray-400 uppercase mb-2 ${expanded ? 'block' : 'hidden'}`}>Menu</p>
        <nav className="mt-2">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveComponent(item.id)}
              className={`flex items-center px-4 py-3 w-full text-left ${
                activeComponent === item.id
                  ? 'bg-blue-50 text-[#1877F2] border-r-4 border-[#1877F2]'
                  : 'text-gray-600 hover:bg-gray-100'
              } transition-colors duration-200`}
            >
              <span className="inline-flex items-center justify-center h-8 w-8">
                {item.icon}
              </span>
              {expanded && <span className="ml-3">{item.title}</span>}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;