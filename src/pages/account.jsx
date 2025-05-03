import React, { useState, useEffect } from 'react';
import { useCredentialStore } from '../state/credentialState';
import axios from 'axios';
import toast from 'react-hot-toast';

const Account = () => {
  const { businessId, accessToken } = useCredentialStore();
  const [loading, setLoading] = useState(true);
  const [adAccountData, setAdAccountData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdAccountData = async () => {
      try {
        setLoading(true);
        const url = `https://graph.facebook.com/v22.0/act_${businessId}?fields=name,currency,timezone_name,amount_spent,business,account_status&access_token=${accessToken}`;
        
        const response = await axios.get(url);
        console.log(response)
        setAdAccountData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching ad account data:', error);
        setError('Failed to load account data. Please check your credentials.');
        toast.error('Failed to load account data');
        setLoading(false);
      }
    };

    fetchAdAccountData();
  }, [businessId, accessToken]);

  // Helper function to format account status
  const getAccountStatus = (status) => {
    switch (status) {
      case 1: return { text: 'Active', color: 'text-green-600', bg: 'bg-green-100' };
      case 2: return { text: 'Disabled', color: 'text-red-600', bg: 'bg-red-100' };
      case 3: return { text: 'Unsettled', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 7: return { text: 'Pending Review', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 9: return { text: 'In Grace Period', color: 'text-orange-600', bg: 'bg-orange-100' };
      default: return { text: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Account Overview</h1>
        <p className="text-gray-600">View your Meta Ad Account details</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : adAccountData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Account Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6 col-span-full">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{adAccountData.name}</h2>
                <p className="text-gray-500">Account ID: {businessId}</p>
              </div>
              {adAccountData.account_status && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAccountStatus(adAccountData.account_status).bg} ${getAccountStatus(adAccountData.account_status).color}`}>
                  {getAccountStatus(adAccountData.account_status).text}
                </span>
              )}
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Currency</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-800">{adAccountData.currency}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Timezone</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-800">{adAccountData.timezone_name}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Amount Spent</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-800">
              {adAccountData.amount_spent ? (
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: adAccountData.currency || 'USD'
                }).format(adAccountData.amount_spent / 100)
              ) : (
                'N/A'
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
};

export default Account; 