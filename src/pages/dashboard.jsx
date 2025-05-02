import React, { useState } from 'react';
import { useCredentialStore } from '../state/credentialState';
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/sidebar/sidebar';
import Account from './account';
import Analytics from './analytics';
import AdsetAnalytics from './adsetAnalytics';
import CreativeAnalytics from './creativeAnalytics';

const Dashboard = () => {
  const { businessId, accessToken } = useCredentialStore();
  const [activeComponent, setActiveComponent] = useState('campaignAnalytics');
  
  const renderComponent = () => {
    switch (activeComponent) {
      case 'campaignAnalytics':
            return <Analytics />;
      case 'account':
        return <Account />;
      case 'adsetAnalytics':
        return <AdsetAnalytics />;
      case 'adAnalytics':
        return <CreativeAnalytics />;
    }
  };
  
  if(!businessId || !accessToken){
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
        <Navigate to="/" />
      </div>
    );
  }
  
  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      <div className="h-[calc(100vh-64px)] sticky top-0">
        <Sidebar setActiveComponent={setActiveComponent} activeComponent={activeComponent} />
      </div>
      
      <main className="flex-1 overflow-auto p-6">
        {renderComponent()}
        
      </main>
    </div>
  );
};

export default Dashboard;