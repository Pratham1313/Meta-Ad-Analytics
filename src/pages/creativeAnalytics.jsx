import React, { useState, useEffect } from 'react';
import { useCredentialStore } from '../state/credentialState';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreativeAnalytics = () => {
  const { businessId, accessToken } = useCredentialStore();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedAdset, setSelectedAdset] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [adsets, setAdsets] = useState([]);
  const [ads, setAds] = useState([]);
  
  // Date state
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  
  // Helper functions for default dates
  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  function getDefaultEndDate() {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }
  
  // Format numbers for display
  const formatNumber = (num) => {
    if (!num) return '0';
    return parseFloat(num).toLocaleString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  // Fetch campaigns first
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const token = accessToken;
        const accountId = businessId;
        
        const url = `https://graph.facebook.com/v18.0/act_${accountId}/campaigns?access_token=${token}&fields=id,name,status`;
        const response = await axios.get(url);
        
        if (response.data.data && response.data.data.length > 0) {
          const activeCampaigns = response.data.data.filter(campaign => campaign.status === 'ACTIVE');
          const allCampaigns = response.data.data.map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status
          }));
          
          setCampaigns(allCampaigns);
          
          // Set first campaign as selected
          if (allCampaigns.length > 0 && !selectedCampaign) {
            setSelectedCampaign(allCampaigns[0].id);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        toast.error('Failed to fetch campaigns');
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [businessId, accessToken]);

  // Fetch adsets when campaign is selected
  useEffect(() => {
    const fetchAdsets = async () => {
      if (!selectedCampaign) return;
      
      try {
        setLoading(true);
        const token = accessToken;
        const accountId = businessId;
        
        const url = `https://graph.facebook.com/v18.0/${selectedCampaign}/adsets?access_token=${token}&fields=id,name,status`;
        const response = await axios.get(url);
        
        if (response.data.data && response.data.data.length > 0) {
          const fetchedAdsets = response.data.data.map(adset => ({
            id: adset.id,
            name: adset.name,
            status: adset.status
          }));
          
          setAdsets(fetchedAdsets);
          
          // Set first adset as selected
          if (fetchedAdsets.length > 0) {
            setSelectedAdset(fetchedAdsets[0].id);
          }
        } else {
          setAdsets([]);
          setSelectedAdset(null);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching adsets:', err);
        toast.error('Failed to fetch adsets');
        setLoading(false);
      }
    };

    fetchAdsets();
  }, [selectedCampaign, businessId, accessToken]);

  // Fetch ads when adset is selected
  useEffect(() => {
    const fetchAds = async () => {
      if (!selectedAdset) return;
      
      try {
        setLoading(true);
        const token = accessToken;
        
        const url = `https://graph.facebook.com/v18.0/${selectedAdset}/ads?access_token=${token}&fields=id,name,status,creative{id,name,thumbnail_url,effective_object_story_id,object_story_spec}`;
        const response = await axios.get(url);
        
        if (response.data.data && response.data.data.length > 0) {
          setAds(response.data.data);
          
          // Now fetch performance data for these ads
          await fetchAdAnalytics(response.data.data.map(ad => ad.id));
        } else {
          setAds([]);
          setAnalyticsData(null);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ads:', err);
        toast.error('Failed to fetch ads');
        setLoading(false);
      }
    };

    fetchAds();
  }, [selectedAdset, accessToken]);

  // Fetch analytics data for ads
  const fetchAdAnalytics = async (adIds) => {
    if (!adIds || adIds.length === 0) return;
    
    try {
      const token = accessToken;
      const accountId = businessId;
      
      const timeRange = JSON.stringify({
        "since": startDate,
        "until": endDate
      });
      
      const fields = 'ad_id,ad_name,impressions,reach,clicks,spend,actions,ctr,cpc,cpm';
      
      const adIdsParam = adIds.join(',');
      const url = `https://graph.facebook.com/v18.0/act_${accountId}/insights?access_token=${token}&time_range=${timeRange}&level=ad&fields=${fields}&filtering=[{"field":"ad.id","operator":"IN","value":[${adIdsParam}]}]`;
      
      const response = await axios.get(url);
      
      if (response.data && response.data.data) {
        setAnalyticsData(response.data.data);
      } else {
        setAnalyticsData([]);
      }
    } catch (err) {
      console.error('Error fetching ad analytics:', err);
      toast.error('Failed to fetch ad analytics');
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Creative Analytics</h1>
        <p className="text-gray-600">View performance metrics for your ad creatives</p>
      </div>

      {/* Campaign & Adset Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
          <select 
            value={selectedCampaign || ''}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="">Select Campaign</option>
            {campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} {campaign.status !== 'ACTIVE' ? `(${campaign.status})` : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ad Set</label>
          <select 
            value={selectedAdset || ''}
            onChange={(e) => setSelectedAdset(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading || adsets.length === 0}
          >
            <option value="">Select Ad Set</option>
            {adsets.map(adset => (
              <option key={adset.id} value={adset.id}>
                {adset.name} {adset.status !== 'ACTIVE' ? `(${adset.status})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {ads.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Creative Performance</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ads.map(ad => {
                  // Find analytics data for this ad
                  const adData = analyticsData?.find(data => data.ad_id === ad.id) || {};
                  
                  return (
                    <div key={ad.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 p-4 border-b">
                        <h3 className="font-medium">{ad.name}</h3>
                        <p className={`text-sm ${ad.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-500'}`}>
                          Status: {ad.status}
                        </p>
                      </div>
                      
                      <div className="p-4">
                        {/* Creative preview - if available */}
                        {ad.creative?.thumbnail_url ? (
                          <div className="mb-4">
                            <img 
                              src={ad.creative.thumbnail_url} 
                              alt="Ad Creative Preview" 
                              className="rounded-md max-h-48 mx-auto"
                            />
                          </div>
                        ) : (
                          <div className="bg-gray-100 h-40 flex items-center justify-center rounded-md mb-4">
                            <p className="text-gray-500">Creative Preview Not Available</p>
                          </div>
                        )}
                        
                        {/* Performance metrics */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">Impressions</p>
                            <p className="font-semibold">{formatNumber(adData.impressions)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Reach</p>
                            <p className="font-semibold">{formatNumber(adData.reach)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Clicks</p>
                            <p className="font-semibold">{formatNumber(adData.clicks)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">CTR</p>
                            <p className="font-semibold">
                              {adData.ctr ? parseFloat(adData.ctr).toFixed(2) + '%' : '0%'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Spend</p>
                            <p className="font-semibold">{formatCurrency(adData.spend)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">CPC</p>
                            <p className="font-semibold">{formatCurrency(adData.cpc)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500">
                {selectedAdset 
                  ? "No ads found for the selected ad set."
                  : "Please select a campaign and ad set to view creatives."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CreativeAnalytics;
    