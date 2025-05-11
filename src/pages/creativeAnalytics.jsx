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
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [adsets, setAdsets] = useState([]);
  const [ads, setAds] = useState([]);
  const [platformData, setPlatformData] = useState([]);
  const [selectedCreativeType, setSelectedCreativeType] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  
  // Add sort state
  const [sortField, setSortField] = useState('impressions');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Add platform sort state
  const [platformSortField, setPlatformSortField] = useState('impressions');
  const [platformSortDirection, setPlatformSortDirection] = useState('desc');
  
  // Date state with updated defaults and date picker variables
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateOption, setSelectedDateOption] = useState('last30Days');
  
  // Helper functions for default dates
  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Last 30 days
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

  // Set date range based on predefined options
  const setDateRange = (option) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    
    setSelectedDateOption(option);
    
    switch (option) {
      case 'today':
        // Start and end are both today
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'last7Days':
        start.setDate(today.getDate() - 7);
        break;
      case 'last14Days':
        start.setDate(today.getDate() - 14);
        break;
      case 'last30Days':
        start.setDate(today.getDate() - 30);
        break;
      case 'thisWeek':
        start.setDate(today.getDate() - today.getDay());
        break;
      case 'lastWeek':
        start.setDate(today.getDate() - today.getDay() - 7);
        end.setDate(today.getDate() - today.getDay() - 1);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        // Default to last 30 days
        start.setDate(today.getDate() - 30);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Update date display for the dropdown button
  const getDateRangeDisplay = () => {
    const formattedStart = new Date(startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedEnd = new Date(endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    
    if (selectedDateOption === 'last30Days') {
      return `Last 30 days: ${formattedStart} - ${formattedEnd}`;
    }
    
    return `${formattedStart} - ${formattedEnd}`;
  };

  // Function to handle column sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Function to handle platform column sorting
  const handlePlatformSort = (field) => {
    if (platformSortField === field) {
      // Toggle direction if clicking the same field
      setPlatformSortDirection(platformSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setPlatformSortField(field);
      setPlatformSortDirection('desc');
    }
  };

  // Function to get sorted data
  const getSortedAds = () => {
    if (!ads || !analyticsData) return [];
    
    // Create a combined array with analytics data
    const adsWithData = ads.map(ad => {
      const adData = analyticsData.find(data => data.ad_id === ad.id) || {};
      return { ...ad, ...adData };
    });
    
    return [...adsWithData].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle special cases
      if (sortField === 'creative') {
        aValue = a.name || '';
        bValue = b.name || '';
      } else if (sortField === 'format') {
        aValue = getAdType(a);
        bValue = getAdType(b);
      }
      
      // Handle numeric strings
      if (typeof aValue === 'string' && !isNaN(parseFloat(aValue))) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Number comparison (default)
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  // Function to get sorted platform data
  const getSortedPlatforms = (platforms) => {
    if (!platforms || platforms.length === 0) return [];
    
    return [...platforms].sort((a, b) => {
      let aValue = a[platformSortField];
      let bValue = b[platformSortField];
      
      // Handle numeric strings
      if (typeof aValue === 'string' && !isNaN(parseFloat(aValue))) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      // String comparison for platform
      if (platformSortField === 'platform') {
        const aFullString = `${a.platform} - ${a.position}`;
        const bFullString = `${b.platform} - ${b.position}`;
        return platformSortDirection === 'asc' 
          ? aFullString.localeCompare(bFullString) 
          : bFullString.localeCompare(aFullString);
      }
      
      // Number comparison (default)
      return platformSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  // Sort campaigns to show active first
  useEffect(() => {
    let filteredCampaigns = [...allCampaigns];
    
    // Sort to show active campaigns first
    filteredCampaigns.sort((a, b) => {
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;
      return 0;
    });
    
    setCampaigns(filteredCampaigns);
  }, [allCampaigns]);

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
          const fetchedCampaigns = response.data.data.map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status
          }));
          
          // Store all campaigns
          setAllCampaigns(fetchedCampaigns);
          
          // If initial load or no campaign selected, select the first ACTIVE campaign
          if ((!selectedCampaign || isInitialLoad) && fetchedCampaigns.length > 0) {
            // First try to find an active campaign
            const firstActiveCampaign = fetchedCampaigns.find(campaign => campaign.status === 'ACTIVE');
            
            if (firstActiveCampaign) {
              setSelectedCampaign(firstActiveCampaign.id);
            } else {
              // If no active campaign found, fall back to the first campaign
              setSelectedCampaign(fetchedCampaigns[0].id);
            }
            
            setIsInitialLoad(false);
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
  }, [businessId, accessToken, isInitialLoad]);

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
        
        // Add more fields to get detailed creative info and placement data
        const url = `https://graph.facebook.com/v18.0/${selectedAdset}/ads?access_token=${token}&fields=id,name,status,creative{id,name,thumbnail_url,effective_object_story_id,object_story_spec,asset_feed_spec,image_url,video_id,body,link_url,title,image_hash,object_type},adlabels,adset_spec,recommendations`;
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
      
      // Enhanced fields to get more detailed metrics
      const fields = 'ad_id,ad_name,impressions,reach,clicks,spend,actions,ctr,cpc,cpm,frequency,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions,video_avg_time_watched_actions,cost_per_inline_post_engagement,inline_post_engagement';
      
      // First get the basic metrics
      const adIdsParam = adIds.join(',');
      let url = `https://graph.facebook.com/v18.0/act_${accountId}/insights?access_token=${token}&time_range=${timeRange}&level=ad&fields=${fields}&filtering=[{"field":"ad.id","operator":"IN","value":[${adIdsParam}]}]`;
      
      const response = await axios.get(url);
      setAnalyticsData(response.data.data || []);
      
      // Now get platform breakdown
      const platformUrl = `https://graph.facebook.com/v18.0/act_${accountId}/insights?access_token=${token}&time_range=${timeRange}&level=ad&fields=${fields}&breakdowns=publisher_platform,platform_position,impression_device&filtering=[{"field":"ad.id","operator":"IN","value":[${adIdsParam}]}]`;
      
      try {
        const platformResponse = await axios.get(platformUrl);
        if (platformResponse.data && platformResponse.data.data) {
          // Process platform data
          setPlatformData(platformResponse.data.data);
        }
      } catch (err) {
        console.error('Error fetching platform breakdown:', err);
      }
    } catch (err) {
      console.error('Error fetching ad analytics:', err);
      toast.error('Failed to fetch ad analytics');
    }
  };

  // Helper function to determine ad type
  const getAdType = (ad) => {
    if (!ad.creative) return 'unknown';
    
    const creative = ad.creative;
    
    if (creative.object_story_spec?.video_data) {
      return 'video';
    } else if (creative.asset_feed_spec?.images && creative.asset_feed_spec.images.length > 1) {
      return 'carousel';
    } else if (creative.image_url || creative.image_hash) {
      return 'image';
    } else if (creative.object_type === 'SHARE') {
      return 'link';
    } else if (creative.object_story_spec?.instagram_actor_id) {
      return 'instagram';
    } else {
      return 'other';
    }
  };
  
  // Get platforms for this ad
  const getAdPlatforms = (adId) => {
    if (!platformData || platformData.length === 0) return [];
    
    const platforms = platformData
      .filter(item => item.ad_id === adId)
      .map(item => ({
        platform: item.publisher_platform,
        position: item.platform_position,
        device: item.impression_device,
        impressions: parseInt(item.impressions) || 0,
        clicks: parseInt(item.clicks) || 0,
        spend: parseFloat(item.spend) || 0,
        ctr: parseFloat(item.ctr) || 0,
        cpc: parseFloat(item.cpc) || 0,
        cpm: parseFloat(item.cpm) || 0
      }));
    
    return platforms;
  };
  
  // Get detailed platform breakdown
  const getPlatformBreakdown = (adId) => {
    if (!platformData || platformData.length === 0) return [];
    
    // Filter to this ad's data
    const adPlatformData = platformData.filter(item => item.ad_id === adId);
    
    // Group by platform + position combination
    const groupedData = adPlatformData.reduce((acc, item) => {
      const key = `${item.publisher_platform} - ${item.platform_position}`;
      
      if (!acc[key]) {
        acc[key] = {
          platform: item.publisher_platform,
          position: item.platform_position,
          impressions: 0,
          clicks: 0,
          spend: 0,
          reach: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
          frequency: 0,
          outbound_clicks: 0,
          outbound_ctr: 0,
          video_p25_watched: 0,
          video_p50_watched: 0,
          video_p75_watched: 0,
          video_p100_watched: 0,
          post_engagement: 0,
          post_reactions: 0,
          conversions: 0,
          conversion_rate: 0,
          cost_per_conversion: 0,
          relevance_score: 0
        };
      }
      
      acc[key].impressions += parseInt(item.impressions) || 0;
      acc[key].clicks += parseInt(item.clicks) || 0;
      acc[key].spend += parseFloat(item.spend) || 0;
      acc[key].reach += parseInt(item.reach) || 0;
      
      // Add video metrics if available
      if (item.video_p25_watched_actions) {
        acc[key].video_p25_watched += parseInt(item.video_p25_watched_actions[0]?.value) || 0;
      }
      if (item.video_p50_watched_actions) {
        acc[key].video_p50_watched += parseInt(item.video_p50_watched_actions[0]?.value) || 0;
      }
      if (item.video_p75_watched_actions) {
        acc[key].video_p75_watched += parseInt(item.video_p75_watched_actions[0]?.value) || 0;
      }
      if (item.video_p100_watched_actions) {
        acc[key].video_p100_watched += parseInt(item.video_p100_watched_actions[0]?.value) || 0;
      }
      
      // Add engagement metrics if available
      if (item.inline_post_engagement) {
        acc[key].post_engagement += parseInt(item.inline_post_engagement) || 0;
      }
      
      // Add conversion metrics if available
      if (item.actions && item.actions.length > 0) {
        const conversionActions = item.actions.filter(action => 
          action.action_type === 'offsite_conversion' || 
          action.action_type === 'lead' || 
          action.action_type === 'purchase'
        );
        
        conversionActions.forEach(action => {
          acc[key].conversions += parseInt(action.value) || 0;
        });
      }
      
      // Add outbound clicks if available
      if (item.outbound_clicks && item.outbound_clicks.length > 0) {
        acc[key].outbound_clicks += parseInt(item.outbound_clicks[0]?.value) || 0;
      }
      
      return acc;
    }, {});
    
    // Convert to array and calculate derived metrics
    return Object.values(groupedData).map(item => {
      const ctr = item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0;
      const cpc = item.clicks > 0 ? item.spend / item.clicks : 0;
      const cpm = item.impressions > 0 ? (item.spend / item.impressions) * 1000 : 0;
      const frequency = item.reach > 0 ? item.impressions / item.reach : 0;
      const outbound_ctr = item.impressions > 0 ? (item.outbound_clicks / item.impressions) * 100 : 0;
      const conversion_rate = item.clicks > 0 ? (item.conversions / item.clicks) * 100 : 0;
      const cost_per_conversion = item.conversions > 0 ? item.spend / item.conversions : 0;
      
      return {
        ...item,
        ctr,
        cpc,
        cpm,
        frequency,
        outbound_ctr,
        conversion_rate,
        cost_per_conversion
      };
    }).sort((a, b) => b.impressions - a.impressions);
  };
  
  // Filter ads based on selected type and platform
  const filteredAds = ads.filter(ad => {
    // Filter by creative type
    if (selectedCreativeType !== 'all' && getAdType(ad) !== selectedCreativeType) {
      return false;
    }
    
    // Filter by platform
    if (selectedPlatform !== 'all') {
      const platforms = getAdPlatforms(ad.id);
      if (!platforms.some(p => p.platform === selectedPlatform)) {
        return false;
      }
    }
    
    return true;
  });

  // Get sorted ads
  const sortedAds = getSortedAds();

  // Refetch data when date range changes
  useEffect(() => {
    if (ads && ads.length > 0) {
      fetchAdAnalytics(ads.map(ad => ad.id));
    }
  }, [startDate, endDate]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Creative Analytics</h1>
        <p className="text-gray-600">View performance metrics for your ad creatives</p>
      </div>

      {/* Campaign Selection */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
          <div className="relative" style={{ minHeight: "70px" }}>
            <select 
              value={selectedCampaign || ''}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              style={{ 
                appearance: 'menulist-button', 
                position: 'relative',
                zIndex: 10
              }}
            >
              <option value="">Select Campaign</option>
              {campaigns.filter(campaign => ['ACTIVE', 'PAUSED'].includes(campaign.status)).map(campaign => {
                const isActive = campaign.status === 'ACTIVE';
                return (
                  <option 
                    key={campaign.id} 
                    value={campaign.id}
                    className={isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}
                    style={{
                      padding: '8px',
                      margin: '4px 0'
                    }}
                  >
                    {campaign.name} - {campaign.status}
                  </option>
                );
              })}
            </select>
            <div className="block text-xs absolute right-10 top-3">
              {campaigns.find(c => c.id === selectedCampaign)?.status === 'ACTIVE' ? (
                <span className="rounded-full px-2 py-1 bg-green-100 text-green-800">Active</span>
              ) : campaigns.find(c => c.id === selectedCampaign)?.status === 'PAUSED' ? (
                <span className="rounded-full px-2 py-1 bg-red-100 text-red-800">Paused</span>
              ) : selectedCampaign ? (
                <span className="rounded-full px-2 py-1 bg-gray-100 text-gray-800">
                  {campaigns.find(c => c.id === selectedCampaign)?.status}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        
        <div className="relative flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ad Set</label>
          <div className="relative" style={{ minHeight: "70px" }}>
            <select 
              value={selectedAdset || ''}
              onChange={(e) => setSelectedAdset(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || adsets.length === 0}
              style={{ 
                appearance: 'menulist-button',
                position: 'relative',
                zIndex: 9
              }}
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
      </div>

      {/* Date Range Selector */}
      <div className="flex justify-end mb-5">
        <div className="relative">
          <button
            className="flex items-center bg-gray-100 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <span className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
              </svg>
            </span>
            {getDateRangeDisplay()}
            <span className="ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
              </svg>
            </span>
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 z-50 bg-white shadow-lg rounded-md border border-gray-200 w-[600px]">
              <div className="p-4">
                <div className="flex">
                  {/* Left side - Date range options */}
                  <div className="w-1/3 border-r border-gray-200 pr-4">
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input 
                          type="radio" 
                          name="dateOption" 
                          checked={selectedDateOption === 'today'} 
                          onChange={() => {
                            setDateRange('today'); 
                            setShowDatePicker(!showDatePicker);
                          }}
                          className="mr-2"
                        />
                        Today
                      </label>
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input 
                          type="radio" 
                          name="dateOption" 
                          checked={selectedDateOption === 'yesterday'} 
                          onChange={() => {
                            setDateRange('yesterday'); 
                            setShowDatePicker(!showDatePicker);
                          }}
                          className="mr-2"
                        />
                        Yesterday
                      </label>
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input 
                          type="radio" 
                          name="dateOption" 
                          checked={selectedDateOption === 'last7Days'} 
                          onChange={() => {
                            setDateRange('last7Days'); 
                            setShowDatePicker(!showDatePicker);
                          }}
                          className="mr-2"
                        />
                        Last 7 days
                      </label>
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input 
                          type="radio" 
                          name="dateOption" 
                          checked={selectedDateOption === 'last14Days'} 
                          onChange={() => {
                            setDateRange('last14Days');
                            setShowDatePicker(!showDatePicker);
                          }}
                          className="mr-2"
                        />
                        Last 14 days
                      </label>
                      <label className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input 
                          type="radio" 
                          name="dateOption" 
                          checked={selectedDateOption === 'last30Days'} 
                          onChange={() => {
                            setDateRange('last30Days'); 
                            setShowDatePicker(!showDatePicker);
                          }}
                          className="mr-2"
                        />
                        Last 30 days
                      </label>
                    </div>
                  </div>
                  
                  {/* Right side - Custom date inputs */}
                  <div className="w-2/3 pl-4">
                    <div className="mb-4">
                      <div className="flex gap-2 items-center">
                        <input
                          type="date"
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setSelectedDateOption('custom');
                          }}
                        />
                        <span>-</span>
                        <input
                          type="date"
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setSelectedDateOption('custom');
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-auto text-right pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">
                        Data from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                          onClick={() => setShowDatePicker(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          onClick={() => setShowDatePicker(false)}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Creative Performance</h2>
              
              {/* Metrics Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Impression & Reach */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Impressions & Reach</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-blue-600">Impressions</p>
                      <p className="text-xl font-bold text-blue-800">
                        {formatNumber(analyticsData?.reduce((sum, ad) => sum + parseInt(ad.impressions || 0), 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">Reach</p>
                      <p className="text-xl font-bold text-blue-800">
                        {formatNumber(analyticsData?.reduce((sum, ad) => sum + parseInt(ad.reach || 0), 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">Frequency</p>
                      <p className="text-xl font-bold text-blue-800">
                        {(analyticsData?.reduce((sum, ad) => sum + parseInt(ad.impressions || 0), 0) / 
                          Math.max(1, analyticsData?.reduce((sum, ad) => sum + parseInt(ad.reach || 0), 0))).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Results */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <h3 className="text-sm font-medium text-green-800 mb-2">Results</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-green-600">Clicks</p>
                      <p className="text-xl font-bold text-green-800">
                        {formatNumber(analyticsData?.reduce((sum, ad) => sum + parseInt(ad.clicks || 0), 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">CTR</p>
                      <p className="text-xl font-bold text-green-800">
                        {((analyticsData?.reduce((sum, ad) => sum + parseInt(ad.clicks || 0), 0) /
                          Math.max(1, analyticsData?.reduce((sum, ad) => sum + parseInt(ad.impressions || 0), 0))) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Cost Metrics */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <h3 className="text-sm font-medium text-purple-800 mb-2">Cost Metrics</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-purple-600">Spend</p>
                      <p className="text-xl font-bold text-purple-800">
                        {formatCurrency(analyticsData?.reduce((sum, ad) => sum + parseFloat(ad.spend || 0), 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600">CPC</p>
                      <p className="text-xl font-bold text-purple-800">
                        {formatCurrency(
                          analyticsData?.reduce((sum, ad) => sum + parseFloat(ad.spend || 0), 0) /
                          Math.max(1, analyticsData?.reduce((sum, ad) => sum + parseInt(ad.clicks || 0), 0))
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600">CPM</p>
                      <p className="text-xl font-bold text-purple-800">
                        {formatCurrency(
                          (analyticsData?.reduce((sum, ad) => sum + parseFloat(ad.spend || 0), 0) * 1000) /
                          Math.max(1, analyticsData?.reduce((sum, ad) => sum + parseInt(ad.impressions || 0), 0))
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-md font-medium text-gray-700">Creative Details</h3>
                <div className="text-sm text-gray-500">
                  {ads?.filter(a => a.status === 'ACTIVE').length || 0} Active Ads
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('creative')}
                      >
                        <div className="flex items-center">
                          CREATIVE
                          {sortField === 'creative' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {sortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('format')}
                      >
                        <div className="flex items-center">
                          FORMAT & PLATFORM
                          {sortField === 'format' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {sortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('impressions')}
                      >
                        <div className="flex items-center justify-center">
                          IMPRESSIONS
                          {sortField === 'impressions' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {sortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('reach')}
                      >
                        <div className="flex items-center justify-center">
                          REACH
                          {sortField === 'reach' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {sortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('clicks')}
                      >
                        <div className="flex items-center justify-center">
                          CLICKS
                          {sortField === 'clicks' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {sortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('ctr')}
                      >
                        <div className="flex items-center justify-center">
                          CTR
                          {sortField === 'ctr' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {sortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('cpc')}
                      >
                        <div className="flex items-center justify-center">
                          CPC
                          {sortField === 'cpc' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {sortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('cpm')}
                      >
                        <div className="flex items-center justify-center">
                          CPM
                          {sortField === 'cpm' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {sortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('spend')}
                      >
                        <div className="flex items-center justify-center">
                          SPEND
                          {sortField === 'spend' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {sortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedAds.map((ad, adIndex) => {
                      const adData = analyticsData?.find(data => data.ad_id === ad.id) || {};
                      const adType = getAdType(ad);
                      const platforms = getPlatformBreakdown(ad.id);
                      
                      return (
                        <React.Fragment key={ad.id}>
                          {/* Main ad row */}
                          <tr className={adIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-4">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 h-20 w-20 mr-3 relative">
                                  {adType === 'carousel' && ad.creative?.asset_feed_spec?.images ? (
                                    <div className="h-full w-full overflow-hidden">
                                      {ad.creative.asset_feed_spec.images[0]?.url && (
                                        <img
                                          src={ad.creative.asset_feed_spec.images[0].url}
                                          alt="Carousel"
                                          className="h-full w-full object-cover rounded-md"
                                        />
                                      )}
                                      <span className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded-tl-md">
                                        +{ad.creative.asset_feed_spec.images.length - 1}
                                      </span>
                                    </div>
                                  ) : adType === 'video' && ad.creative?.thumbnail_url ? (
                                    <div className="h-full w-full relative">
                                      <img
                                        src={ad.creative.thumbnail_url}
                                        alt="Video"
                                        className="h-full w-full object-cover rounded-md"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="bg-black bg-opacity-50 rounded-full p-1 text-white">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                          </svg>
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <img 
                                      src={ad.creative?.thumbnail_url || ad.creative?.image_url || 'https://via.placeholder.com/80?text=Ad'} 
                                      alt="Ad"
                                      className="h-full w-full object-cover rounded-md"
                                    />
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <h4 className="text-sm font-medium text-gray-900">{ad.name}</h4>
                                  <p className={`text-xs mt-1 ${ad.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-500'}`}>
                                    {ad.status}
                                  </p>
                                  {ad.creative?.body && (
                                    <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                      {ad.creative.body}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 mb-2">
                                  {adType.charAt(0).toUpperCase() + adType.slice(1)}
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {platforms.slice(0, 3).map((platform, pIndex) => (
                                    <span key={pIndex} className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                                      {platform.platform.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                      {platform.impressions > 0 && <span className="ml-1 text-xs text-gray-500">({formatNumber(platform.impressions)})</span>}
                                    </span>
                                  ))}
                                  {platforms.length > 3 && (
                                    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                                      +{platforms.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-center text-gray-500">{formatNumber(adData.impressions)}</td>
                            <td className="px-4 py-4 text-sm text-center text-gray-500">{formatNumber(adData.reach)}</td>
                            <td className="px-4 py-4 text-sm text-center text-gray-500">{formatNumber(adData.clicks)}</td>
                            <td className="px-4 py-4 text-sm text-center text-gray-500">{adData.ctr ? parseFloat(adData.ctr).toFixed(2) + '%' : '0%'}</td>
                            <td className="px-4 py-4 text-sm text-center text-gray-500">{formatCurrency(adData.cpc)}</td>
                            <td className="px-4 py-4 text-sm text-center text-gray-500">
                              {adData.spend && adData.impressions 
                                ? formatCurrency((parseFloat(adData.spend) / parseInt(adData.impressions)) * 1000)
                                : formatCurrency(0)}
                            </td>
                            <td className="px-4 py-4 text-sm text-center text-gray-500">{formatCurrency(adData.spend)}</td>
                          </tr>
                          
                          {/* Platform breakdown rows - styled exactly like the campaign table */}
                          {platforms.length > 0 && (
                            <tr>
                              <td colSpan="9" className="px-4 py-4">
                                <div className="text-base font-medium text-gray-800 mb-2">Platform & Placement Breakdown</div>
                                
                                <div className="overflow-x-auto">
                                  <table className="min-w-full">
                                    {/* Header row */}
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-gray-200">
                                        <th 
                                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                          onClick={() => handlePlatformSort('platform')}
                                        >
                                          <div className="flex items-center">
                                            PLATFORM
                                            {platformSortField === 'platform' && (
                                              <span className="ml-1 font-bold text-blue-600">
                                                {platformSortDirection === 'asc' ? '▼' : '▲'}
                                              </span>
                                            )}
                                          </div>
                                        </th>
                                        <th 
                                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                          onClick={() => handlePlatformSort('impressions')}
                                        >
                                          <div className="flex items-center justify-center">
                                            IMPRESSIONS
                                            {platformSortField === 'impressions' && (
                                              <span className="ml-1 font-bold text-blue-600">
                                                {platformSortDirection === 'asc' ? '▼' : '▲'}
                                              </span>
                                            )}
                                          </div>
                                        </th>
                                        <th 
                                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                          onClick={() => handlePlatformSort('reach')}
                                        >
                                          <div className="flex items-center justify-center">
                                            REACH
                                            {platformSortField === 'reach' && (
                                              <span className="ml-1 font-bold text-blue-600">
                                                {platformSortDirection === 'asc' ? '▼' : '▲'}
                                              </span>
                                            )}
                                          </div>
                                        </th>
                                        <th 
                                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                          onClick={() => handlePlatformSort('frequency')}
                                        >
                                          <div className="flex items-center justify-center">
                                            FREQ
                                            {platformSortField === 'frequency' && (
                                              <span className="ml-1 font-bold text-blue-600">
                                                {platformSortDirection === 'asc' ? '▼' : '▲'}
                                              </span>
                                            )}
                                          </div>
                                        </th>
                                        <th 
                                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                          onClick={() => handlePlatformSort('clicks')}
                                        >
                                          <div className="flex items-center justify-center">
                                            CLICKS
                                            {platformSortField === 'clicks' && (
                                              <span className="ml-1 font-bold text-blue-600">
                                                {platformSortDirection === 'asc' ? '▼' : '▲'}
                                              </span>
                                            )}
                                          </div>
                                        </th>
                                        <th 
                                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                          onClick={() => handlePlatformSort('outbound_clicks')}
                                        >
                                          <div className="flex items-center justify-center">
                                            OUTB. CLICKS
                                            {platformSortField === 'outbound_clicks' && (
                                              <span className="ml-1 font-bold text-blue-600">
                                                {platformSortDirection === 'asc' ? '▼' : '▲'}
                                              </span>
                                            )}
                                          </div>
                                        </th>
                                        <th 
                                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                          onClick={() => handlePlatformSort('ctr')}
                                        >
                                          <div className="flex items-center justify-center">
                                            CTR
                                            {platformSortField === 'ctr' && (
                                              <span className="ml-1 font-bold text-blue-600">
                                                {platformSortDirection === 'asc' ? '▼' : '▲'}
                                              </span>
                                            )}
                                          </div>
                                        </th>
                                        <th 
                                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                          onClick={() => handlePlatformSort('cpm')}
                                        >
                                          <div className="flex items-center justify-center">
                                            CPM
                                            {platformSortField === 'cpm' && (
                                              <span className="ml-1 font-bold text-blue-600">
                                                {platformSortDirection === 'asc' ? '▼' : '▲'}
                                              </span>
                                            )}
                                          </div>
                                        </th>
                                        <th 
                                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                          onClick={() => handlePlatformSort('conversions')}
                                        >
                                          <div className="flex items-center justify-center">
                                            CONV.
                                            {platformSortField === 'conversions' && (
                                              <span className="ml-1 font-bold text-blue-600">
                                                {platformSortDirection === 'asc' ? '▼' : '▲'}
                                              </span>
                                            )}
                                          </div>
                                        </th>
                                        <th 
                                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                          onClick={() => handlePlatformSort('spend')}
                                        >
                                          <div className="flex items-center justify-center">
                                            SPEND
                                            {platformSortField === 'spend' && (
                                              <span className="ml-1 font-bold text-blue-600">
                                                {platformSortDirection === 'asc' ? '▼' : '▲'}
                                              </span>
                                            )}
                                          </div>
                                        </th>
                                      </tr>
                                    </thead>
                                  
                                    {/* Data rows */}
                                    <tbody>
                                      {getSortedPlatforms(platforms).map((platform, pIndex) => (
                                        <tr 
                                          key={pIndex} 
                                          className={`border-b border-gray-200 ${pIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                        >
                                          <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                                            {`${platform.platform} - ${platform.position}`}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-center text-gray-500">
                                            {formatNumber(platform.impressions)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-center text-gray-500">
                                            {formatNumber(platform.reach)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-center text-gray-500">
                                            {platform.frequency.toFixed(2)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-center text-gray-500">
                                            {formatNumber(platform.clicks)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-center text-gray-500">
                                            {formatNumber(platform.outbound_clicks)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-center text-gray-500">
                                            {platform.ctr.toFixed(1)}%
                                          </td>
                                          <td className="px-4 py-3 text-sm text-center text-gray-500">
                                            {formatCurrency(platform.cpm)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-center text-gray-500">
                                            {formatNumber(platform.conversions)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-center text-gray-500">
                                            {formatCurrency(platform.spend)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                          
                          {/* Creative Performance Metrics Section */}
                          <tr>
                            <td colSpan="9" className="px-4 py-4">
                              <div className="text-base font-medium text-gray-800 mb-2">Creative Performance Metrics</div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                {/* Video Metrics */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                  <h3 className="text-sm font-medium text-gray-700 mb-2">Video Performance</h3>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-xs text-gray-600">25% Watched</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {formatNumber(adData.video_p25_watched_actions?.[0]?.value || 0)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600">50% Watched</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {formatNumber(adData.video_p50_watched_actions?.[0]?.value || 0)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600">75% Watched</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {formatNumber(adData.video_p75_watched_actions?.[0]?.value || 0)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600">100% Watched</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {formatNumber(adData.video_p100_watched_actions?.[0]?.value || 0)}
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-xs text-gray-600">Avg. Watch Time</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {adData.video_avg_time_watched_actions?.[0]?.value 
                                          ? `${(parseFloat(adData.video_avg_time_watched_actions[0].value)).toFixed(1)}s` 
                                          : 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Engagement Metrics */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                  <h3 className="text-sm font-medium text-gray-700 mb-2">Engagement Metrics</h3>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-xs text-gray-600">Post Engagement</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {formatNumber(adData.inline_post_engagement || 0)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600">Link Clicks</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {formatNumber(adData.inline_link_clicks || adData.clicks || 0)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600">Outbound Clicks</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {formatNumber(adData.outbound_clicks?.[0]?.value || 0)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600">Click-Through Rate</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {adData.ctr ? `${parseFloat(adData.ctr).toFixed(2)}%` : '0%'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600">Cost Per Engagement</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {formatCurrency(adData.inline_post_engagement && parseFloat(adData.spend) > 0
                                          ? parseFloat(adData.spend) / parseInt(adData.inline_post_engagement)
                                          : 0)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Ad Quality Indicators */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                  <h3 className="text-sm font-medium text-gray-700 mb-2">Ad Quality</h3>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-xs text-gray-600">Relevance Score</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {adData.relevance_score?.score || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600">Frequency</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {adData.impressions && adData.reach
                                          ? (parseInt(adData.impressions) / parseInt(adData.reach)).toFixed(2)
                                          : 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600">Conversion Rate</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {adData.actions && adData.clicks
                                          ? `${((adData.actions.reduce((sum, action) => {
                                              if (['offsite_conversion', 'lead', 'purchase'].includes(action.action_type)) {
                                                return sum + parseInt(action.value);
                                              }
                                              return sum;
                                            }, 0) / parseInt(adData.clicks)) * 100).toFixed(2)}%`
                                          : 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600">Cost Per Conversion</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {adData.actions && adData.spend
                                          ? formatCurrency(parseFloat(adData.spend) / 
                                              adData.actions.reduce((sum, action) => {
                                                if (['offsite_conversion', 'lead', 'purchase'].includes(action.action_type)) {
                                                  return sum + parseInt(action.value);
                                                }
                                                return sum;
                                              }, 0))
                                          : 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Special metrics for video ads */}
                          {adType === 'video' && adData.video_p25_watched_actions && (
                            <tr className="bg-gray-50">
                              <td colSpan="9" className="px-4 py-3">
                                <div className="flex flex-wrap gap-8">
                                  <div>
                                    <div className="text-xs font-medium text-gray-700 mb-1">Video Completion Rates</div>
                                    <div className="flex gap-4">
                                      <div className="text-sm">
                                        <span className="text-gray-500">25%:</span> {formatNumber(adData.video_p25_watched_actions?.[0]?.value || 0)}
                                      </div>
                                      <div className="text-sm">
                                        <span className="text-gray-500">50%:</span> {formatNumber(adData.video_p50_watched_actions?.[0]?.value || 0)}
                                      </div>
                                      <div className="text-sm">
                                        <span className="text-gray-500">75%:</span> {formatNumber(adData.video_p75_watched_actions?.[0]?.value || 0)}
                                      </div>
                                      <div className="text-sm">
                                        <span className="text-gray-500">100%:</span> {formatNumber(adData.video_p100_watched_actions?.[0]?.value || 0)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
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
    