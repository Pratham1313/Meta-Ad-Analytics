import React, { useState, useEffect } from 'react';
import { useCredentialStore } from '../state/credentialState';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Doughnut } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const AdsetAnalytics = () => {
  const { businessId, accessToken } = useCredentialStore();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [demographicData, setDemographicData] = useState(null);
  const [demographicLoading, setDemographicLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState('age');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedAdset, setSelectedAdset] = useState('all');
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [activeAdsets, setActiveAdsets] = useState([]);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Add sort state
  const [sortField, setSortField] = useState('impressions');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Date selection states - updated default to last30Days
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateOption, setSelectedDateOption] = useState('last30Days');

  // Add new state for campaigns
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  // Add sort state for demographics section
  const [demoSortField, setDemoSortField] = useState('impressions');
  const [demoSortDirection, setDemoSortDirection] = useState('desc');

  // Helper functions for default dates - updated for last 30 days
  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Last 30 days instead of last month
    return date.toISOString().split('T')[0];
  }

  function getDefaultEndDate() {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }

  // Apply active filter when toggle changes
  useEffect(() => {
    let filteredCampaigns = [...allCampaigns];
    
    filteredCampaigns.sort((a, b) => {
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;
      return 0;
    });
    
    if (showOnlyActive) {
      filteredCampaigns = filteredCampaigns.filter(campaign => campaign.status === 'ACTIVE');
    }
    
    setCampaigns(filteredCampaigns);
  }, [showOnlyActive, allCampaigns]);

  // Format date in MM-DD-YYYY format for display
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
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
        // Default to this month
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
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

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (!num) return '0';
    return parseFloat(num).toLocaleString();
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  // Helper function to format percentage
  const formatPercentage = (value) => {
    if (!value) return '0%';
    return `${(parseFloat(value) * 100).toFixed(2)}%`;
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

  // Function to handle column sorting for demographics
  const handleDemoSort = (field) => {
    if (demoSortField === field) {
      // Toggle direction if clicking the same field
      setDemoSortDirection(demoSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setDemoSortField(field);
      setDemoSortDirection('desc');
    }
  };

  // Fetch campaigns first
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
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
              console.log("Setting initial ACTIVE campaign:", firstActiveCampaign.id);
              setSelectedCampaign(firstActiveCampaign.id);
            } else {
              // If no active campaign found, fall back to the first campaign
              console.log("No active campaigns, setting first campaign:", fetchedCampaigns[0].id);
              setSelectedCampaign(fetchedCampaigns[0].id);
            }
            
            setIsInitialLoad(false);
          }
        }
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        toast.error('Failed to fetch campaigns');
      }
    };

    fetchCampaigns();
  }, [businessId, accessToken, isInitialLoad]);

  // Now fetch adset data when selectedCampaign changes
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!selectedCampaign) return; // Don't fetch if no campaign selected
      
      console.log("Fetching analytics for campaign:", selectedCampaign);
      
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        
        const token = accessToken;
        const accountId = businessId;
        
        const timeRange = JSON.stringify({
          "since": startDate,
          "until": endDate
        });
        
        const fields = 'adset_name,adset_id,impressions,reach,clicks,spend,actions,ctr,cpc,cpm,unique_clicks,frequency,account_name,inline_link_clicks,inline_post_engagement,unique_actions,cost_per_unique_click,action_values,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions,video_play_actions,outbound_clicks,outbound_clicks_ctr,cost_per_outbound_click,cost_per_thruplay,website_purchase_roas,purchase_roas,quality_ranking,engagement_rate_ranking,conversion_rate_ranking,objective,cost_per_action_type,cost_per_inline_link_click,cost_per_inline_post_engagement,cost_per_unique_outbound_click,estimated_ad_recall_rate,full_view_impressions,full_view_reach';
        
        // Build URL with campaign filter
        let url = `https://graph.facebook.com/v18.0/act_${accountId}/insights?access_token=${token}&time_range=${timeRange}&level=adset&fields=${fields}`;
        url += `&filtering=[{"field":"campaign.id","operator":"EQUAL","value":"${selectedCampaign}"}]`;
        
        const response = await axios.get(url);
        console.log('Insights data:', response.data);
        
        if (response.data && response.data.data) {
          // Get adset IDs from insights data
          const adsetIds = response.data.data.map(adset => adset.adset_id);
          
          // Extract adset names from insights data and create adsets list
          const adsetsList = response.data.data.map(adset => ({
            id: adset.adset_id,
            name: adset.adset_name
          }));
          
          // Fetch actual adset status information
          try {
            // Create a comma-separated list of adset IDs for the batch request
            const adsetIdsParam = adsetIds.join(',');
            
            // Fetch adset status information
            const adsetStatusUrl = `https://graph.facebook.com/v18.0/?ids=${adsetIdsParam}&access_token=${token}&fields=status`;
            const statusResponse = await axios.get(adsetStatusUrl);
            console.log('Adset status data:', statusResponse.data);
            
            // Create a map of adset ID to status
            const adsetStatusMap = {};
            if (statusResponse.data) {
              Object.entries(statusResponse.data).forEach(([adsetId, adsetData]) => {
                adsetStatusMap[adsetId] = adsetData.status || 'UNKNOWN';
              });
            }
            
            // Add status to analytics data
            response.data.data.forEach(adset => {
              adset.status = adsetStatusMap[adset.adset_id] || 'UNKNOWN';
            });
          } catch (err) {
            console.error('Error fetching adset status:', err);
            // If status fetch fails, default to 'UNKNOWN'
            response.data.data.forEach(adset => {
              adset.status = 'UNKNOWN';
            });
          }
          
          // Update active adsets list
          setActiveAdsets(adsetsList);
          setAnalyticsData(response.data.data);
        } else {
          setAnalyticsData([]);
          setActiveAdsets([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err.response?.data?.error?.message || 'Failed to fetch analytics data');
        setLoading(false);
        toast.error('Failed to fetch analytics data');
      }
    };

    fetchAnalyticsData();
  }, [businessId, accessToken, startDate, endDate, selectedCampaign]);

  // Fetch demographic data when selectedBreakdown or selectedAdset changes
  useEffect(() => {
    const fetchDemographicData = async () => {
      if (!analyticsData || analyticsData.length === 0) return;
      
      try {
        setDemographicLoading(true);
        
        const token = accessToken;
        const accountId = businessId;
        
        const timeRange = JSON.stringify({
          "since": startDate,
          "until": endDate
        });
        
        const fields = 'adset_name,adset_id,impressions,reach,clicks,spend';

        let url = `https://graph.facebook.com/v18.0/act_${accountId}/insights?access_token=${token}&time_range=${timeRange}&level=adset&fields=${fields}&breakdowns=${selectedBreakdown}`;
        
        // Add filtering for selected adset
        if (selectedAdset !== 'all') {
          url += `&filtering=[{"field":"adset.id","operator":"EQUAL","value":"${selectedAdset}"}]`;
        } else if (selectedCampaign !== 'all') {
          url += `&filtering=[{"field":"campaign.id","operator":"EQUAL","value":"${selectedCampaign}"}]`;
        }
        
        const response = await axios.get(url);
        setDemographicData(response.data.data);
        setDemographicLoading(false);
      } catch (err) {
        console.error('Error fetching demographic data:', err);
        setDemographicData(null);
        setDemographicLoading(false);
        toast.error('Failed to fetch demographic data');
      }
    };

    if (selectedBreakdown) {
      fetchDemographicData();
    }
  }, [selectedBreakdown, selectedAdset, selectedCampaign, analyticsData, businessId, accessToken, startDate, endDate]);

  // Extract active campaigns when analyticsData changes
  useEffect(() => {
    if (analyticsData && analyticsData.length > 0) {
      const campaigns = [...new Set(analyticsData.map(adset => adset.campaign_id))]
        .map(campaignId => {
          const adset = analyticsData.find(a => a.campaign_id === campaignId);
          return {
            id: campaignId,
            name: adset.campaign_name
          };
        });
      setActiveCampaigns(campaigns);
    }
  }, [analyticsData]);

  // Calculate Engagement Rate
  const calculateEngagementRate = (adset) => {
    const postEngagements = parseInt(adset.inline_post_engagement) || 0;
    const impressions = parseInt(adset.impressions) || 0;
    
    if (impressions === 0) return '0%';
    return `${((postEngagements / impressions) * 100).toFixed(2)}%`;
  };

  // Process demographic data for visualization
  const processDemographicData = () => {
    if (!demographicData || demographicData.length === 0) return null;
    
    const groupedData = demographicData.reduce((acc, item) => {
      const key = item[selectedBreakdown];
      
      if (!acc[key]) {
        acc[key] = {
          impressions: 0,
          reach: 0,
          clicks: 0,
          spend: 0
        };
      }
      
      acc[key].impressions += parseInt(item.impressions) || 0;
      acc[key].reach += parseInt(item.reach) || 0;
      acc[key].clicks += parseInt(item.clicks) || 0;
      acc[key].spend += parseFloat(item.spend) || 0;
      
      return acc;
    }, {});
    
    // Convert to array and sort by impressions in descending order by default
    return Object.entries(groupedData)
      .map(([key, value]) => ({
        label: key,
        ...value,
        ctr: value.clicks / value.impressions || 0,
        cpc: value.spend / value.clicks || 0
      }));
  };

  const processedDemographicData = processDemographicData();
  
  // Add these visualization functions for demographic data
  const getAgeChartData = () => {
    if (!processedDemographicData || selectedBreakdown !== 'age') {
      return {
        labels: [],
        datasets: [
          {
            label: 'Reach',
            data: [],
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
              '#8AC24A'
            ],
            hoverOffset: 4
          },
          {
            label: 'Clicks',
            data: [],
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
              '#8AC24A'
            ],
            hoverOffset: 4
          }
        ]
      };
    }
    
    const labels = processedDemographicData.map(item => item.label);
    const reachData = processedDemographicData.map(item => item.reach);
    const clicksData = processedDemographicData.map(item => item.clicks);
    
    return {
      labels,
      datasets: [
        {
          label: 'Reach',
          data: reachData,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#8AC24A'
          ],
          hoverOffset: 4
        }
      ]
    };
  };

  const getGenderChartData = () => {
    if (!processedDemographicData || selectedBreakdown !== 'gender') {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56'
          ],
          hoverOffset: 4
        }]
      };
    }
    
    const labels = processedDemographicData.map(item => item.label);
    const data = processedDemographicData.map(item => item.impressions);
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56'
        ],
        hoverOffset: 4
      }]
    };
  };

  const getCountryChartData = () => {
    if (!processedDemographicData || selectedBreakdown !== 'country') {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40'
          ],
          hoverOffset: 4
        }]
      };
    }
    
    // Sort countries by impressions and take top 5
    const sortedData = [...processedDemographicData].sort((a, b) => b.impressions - a.impressions);
    const topCountries = sortedData.slice(0, 5);
    const others = sortedData.slice(5).reduce((sum, item) => sum + item.impressions, 0);
    
    const labels = [...topCountries.map(item => item.label), 'Others'];
    const data = [...topCountries.map(item => item.impressions), others];
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ],
        hoverOffset: 4
      }]
    };
  };

  const getDeviceChartData = () => {
    if (!processedDemographicData || selectedBreakdown !== 'device_platform') {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0'
          ],
          hoverOffset: 4
        }]
      };
    }
    
    const labels = processedDemographicData.map(item => item.label);
    const data = processedDemographicData.map(item => item.impressions);
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0'
        ],
        hoverOffset: 4
      }]
    };
  };

  // Calculate audience age metrics
  const calculateAudienceAgeMetrics = () => {
    if (!processedDemographicData || selectedBreakdown !== 'age') return null;
    
    // Define age ranges and their midpoints for estimation
    const ageRanges = {
      '13-17': 15,
      '18-24': 21,
      '25-34': 29.5,
      '35-44': 39.5,
      '45-54': 49.5,
      '55-64': 59.5,
      '65+': 70 // Estimation for 65+
    };
    
    let totalImpressions = 0;
    let weightedAgeSum = 0;
    
    processedDemographicData.forEach(data => {
      const impressions = parseInt(data.impressions) || 0;
      const ageRange = data.label;
      const ageMidpoint = ageRanges[ageRange] || 0;
      
      totalImpressions += impressions;
      weightedAgeSum += ageMidpoint * impressions;
    });
    
    if (totalImpressions === 0) return null;
    
    const averageAge = weightedAgeSum / totalImpressions;
    
    return {
      averageAge: averageAge.toFixed(1),
      totalImpressions
    };
  };

  // Calculate gender distribution
  const calculateGenderDistribution = () => {
    if (!processedDemographicData || selectedBreakdown !== 'gender') return null;
    
    let maleImpressions = 0;
    let femaleImpressions = 0;
    let unknownImpressions = 0;
    
    processedDemographicData.forEach(data => {
      const impressions = parseInt(data.impressions) || 0;
      const gender = data.label;
      
      if (gender === 'male') {
        maleImpressions += impressions;
      } else if (gender === 'female') {
        femaleImpressions += impressions;
      } else {
        unknownImpressions += impressions;
      }
    });
    
    const totalImpressions = maleImpressions + femaleImpressions + unknownImpressions;
    
    if (totalImpressions === 0) return null;
    
    return {
      male: {
        impressions: maleImpressions,
        percentage: ((maleImpressions / totalImpressions) * 100).toFixed(1)
      },
      female: {
        impressions: femaleImpressions,
        percentage: ((femaleImpressions / totalImpressions) * 100).toFixed(1)
      },
      unknown: {
        impressions: unknownImpressions,
        percentage: ((unknownImpressions / totalImpressions) * 100).toFixed(1)
      },
      totalImpressions
    };
  };
  
  const ageMetrics = calculateAudienceAgeMetrics();
  const genderDistribution = calculateGenderDistribution();

  // Get a friendly name for the breakdown
  const getBreakdownLabel = () => {
    const labels = {
      'age': 'Age Group',
      'gender': 'Gender',
      'country': 'Country',
      'region': 'Region',
      'device_platform': 'Device'
    };
    return labels[selectedBreakdown] || selectedBreakdown;
  };

  // Function to get sorted data
  const getSortedData = (data) => {
    if (!data) return [];
    
    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'engagement_rate') {
        aValue = parseFloat(calculateEngagementRate(a).replace('%', ''));
        bValue = parseFloat(calculateEngagementRate(b).replace('%', ''));
      }
      
      if (typeof aValue === 'string' && !isNaN(parseFloat(aValue))) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  // Function to get sorted demographic data
  const getSortedDemographicData = () => {
    if (!processedDemographicData) return [];
    
    return [...processedDemographicData].sort((a, b) => {
      let aValue = a[demoSortField];
      let bValue = b[demoSortField];
      
      // Parse numbers for numeric fields
      if (typeof aValue === 'string' && !isNaN(parseFloat(aValue))) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      // String comparison for labels
      if (demoSortField === 'label') {
        return demoSortDirection === 'asc' 
          ? a.label.localeCompare(b.label) 
          : b.label.localeCompare(a.label);
      }
      
      // Number comparison
      return demoSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  const sortedAnalyticsData = getSortedData(analyticsData);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Adset Analytics Dashboard</h1>
        <p className="text-gray-600">View performance metrics for your Meta Ad Sets</p>
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

      {/* Campaign Selection */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Campaign</label>
        
        <div className="flex items-center justify-left gap-8 mb-2">
        <select 
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {campaigns.map(campaign => (
            <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
          ))}
        </select>
          <div className="flex items-center">
          <span className="ml-3 text-sm font-medium text-gray-700 mr-2.5">Show Only Active</span>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={showOnlyActive} 
                onChange={() => setShowOnlyActive(!showOnlyActive)} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : analyticsData && analyticsData.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Adset Performance</h2>
            
            {/* Metrics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Impression & Reach */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Impressions & Reach</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-blue-600">Impressions</p>
                    <p className="text-xl font-bold text-blue-800">
                      {formatNumber(analyticsData?.reduce((sum, adset) => sum + parseInt(adset.impressions || 0), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Reach</p>
                    <p className="text-xl font-bold text-blue-800">
                      {formatNumber(analyticsData?.reduce((sum, adset) => sum + parseInt(adset.reach || 0), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Frequency</p>
                    <p className="text-xl font-bold text-blue-800">
                      {(analyticsData?.reduce((sum, adset) => sum + parseInt(adset.impressions || 0), 0) / 
                        Math.max(1, analyticsData?.reduce((sum, adset) => sum + parseInt(adset.reach || 0), 0))).toFixed(2)}
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
                      {formatNumber(analyticsData?.reduce((sum, adset) => sum + parseInt(adset.clicks || 0), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600">CTR</p>
                    <p className="text-xl font-bold text-green-800">
                      {((analyticsData?.reduce((sum, adset) => sum + parseInt(adset.clicks || 0), 0) /
                        Math.max(1, analyticsData?.reduce((sum, adset) => sum + parseInt(adset.impressions || 0), 0))) * 100).toFixed(2)}%
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
                      {formatCurrency(analyticsData?.reduce((sum, adset) => sum + parseFloat(adset.spend || 0), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600">CPC</p>
                    <p className="text-xl font-bold text-purple-800">
                      {formatCurrency(
                        analyticsData?.reduce((sum, adset) => sum + parseFloat(adset.spend || 0), 0) /
                        Math.max(1, analyticsData?.reduce((sum, adset) => sum + parseInt(adset.clicks || 0), 0))
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600">CPM</p>
                    <p className="text-xl font-bold text-purple-800">
                      {formatCurrency(
                        (analyticsData?.reduce((sum, adset) => sum + parseFloat(adset.spend || 0), 0) * 1000) /
                        Math.max(1, analyticsData?.reduce((sum, adset) => sum + parseInt(adset.impressions || 0), 0))
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-md font-medium text-gray-700">Adset Details</h3>
              <div className="text-sm text-gray-500">
                {analyticsData?.filter(a => a.status === 'ACTIVE').length || 0} Active Adsets
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('adset_name')}
                    >
                      <div className="flex items-center">
                        ADSET NAME
                        {sortField === 'adset_name' && (
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
                      onClick={() => handleSort('frequency')}
                    >
                      <div className="flex items-center justify-center">
                        FREQUENCY
                        {sortField === 'frequency' && (
                          <span className="ml-1 font-bold text-blue-600">
                            {sortDirection === 'asc' ? '▼' : '▲'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('engagement_rate')}
                    >
                      <div className="flex items-center justify-center">
                        ENGAGEMENT RATE
                        {sortField === 'engagement_rate' && (
                          <span className="ml-1 font-bold text-blue-600">
                            {sortDirection === 'asc' ? '▼' : '▲'}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedAnalyticsData.map((adset, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900">{adset.adset_name}</td>
                      
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{formatNumber(adset.impressions)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{formatNumber(adset.reach)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{formatNumber(adset.clicks)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{formatCurrency(adset.spend)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{parseFloat(adset.ctr).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{formatCurrency(adset.cpc)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{formatCurrency(adset.cpm)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{parseFloat(adset.frequency || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{calculateEngagementRate(adset)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500">No data available</p>
        </div>
      )}

      {/* Separate Demographics Section */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Audience Demographics</h2>
        
        {/* Adset Selection for Demographics */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Adset for Demographics</label>
          <select 
            value={selectedAdset}
            onChange={(e) => setSelectedAdset(e.target.value)}
            className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {activeAdsets.map(adset => (
              <option key={adset.id} value={adset.id}>{adset.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            onClick={() => setSelectedBreakdown('age')}
            className={`px-3 py-1 rounded text-sm ${selectedBreakdown === 'age' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Age
          </button>
          <button 
            onClick={() => setSelectedBreakdown('gender')}
            className={`px-3 py-1 rounded text-sm ${selectedBreakdown === 'gender' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Gender
          </button>
          <button 
            onClick={() => setSelectedBreakdown('country')}
            className={`px-3 py-1 rounded text-sm ${selectedBreakdown === 'country' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Country
          </button>
          <button 
            onClick={() => setSelectedBreakdown('region')}
            className={`px-3 py-1 rounded text-sm ${selectedBreakdown === 'region' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Region
          </button>
          <button 
            onClick={() => setSelectedBreakdown('device_platform')}
            className={`px-3 py-1 rounded text-sm ${selectedBreakdown === 'device_platform' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Device
          </button>
        </div>

        {demographicLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Data Table */}
            {/* Add special metrics panels for age and gender */}
            {selectedBreakdown === 'age' && ageMetrics && (
              <div className="bg-blue-50 p-3 mb-4 rounded-lg">
                <p className="text-blue-800 font-medium">Average audience age: {ageMetrics.averageAge} years old</p>
                <p className="text-blue-600 text-sm">Based on {formatNumber(ageMetrics.totalImpressions)} impressions</p>
              </div>
            )}

            {selectedBreakdown === 'gender' && genderDistribution && (
              <div className="bg-blue-50 p-3 mb-4 rounded-lg flex flex-wrap gap-4">
                <div className="text-center">
                  <div className="text-blue-800 font-medium">Male</div>
                  <div className="text-xl font-bold">{genderDistribution.male.percentage}%</div>
                  <div className="text-blue-600 text-xs">{formatNumber(genderDistribution.male.impressions)} impressions</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-800 font-medium">Female</div>
                  <div className="text-xl font-bold">{genderDistribution.female.percentage}%</div>
                  <div className="text-blue-600 text-xs">{formatNumber(genderDistribution.female.impressions)} impressions</div>
                </div>
                {genderDistribution.unknown.impressions > 0 && (
                  <div className="text-center">
                    <div className="text-blue-800 font-medium">Unknown</div>
                    <div className="text-xl font-bold">{genderDistribution.unknown.percentage}%</div>
                    <div className="text-blue-600 text-xs">{formatNumber(genderDistribution.unknown.impressions)} impressions</div>
                  </div>
                )}
              </div>
            )}
            {processedDemographicData && processedDemographicData.length > 0 ? (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleDemoSort('label')}
                      >
                        <div className="flex items-center">
                          {getBreakdownLabel()}
                          {demoSortField === 'label' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {demoSortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleDemoSort('impressions')}
                      >
                        <div className="flex items-center justify-end">
                          Impressions
                          {demoSortField === 'impressions' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {demoSortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleDemoSort('reach')}
                      >
                        <div className="flex items-center justify-end">
                          Reach
                          {demoSortField === 'reach' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {demoSortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleDemoSort('clicks')}
                      >
                        <div className="flex items-center justify-end">
                          Clicks
                          {demoSortField === 'clicks' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {demoSortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleDemoSort('spend')}
                      >
                        <div className="flex items-center justify-end">
                          Spend
                          {demoSortField === 'spend' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {demoSortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleDemoSort('ctr')}
                      >
                        <div className="flex items-center justify-end">
                          CTR
                          {demoSortField === 'ctr' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {demoSortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleDemoSort('cpc')}
                      >
                        <div className="flex items-center justify-end">
                          CPC
                          {demoSortField === 'cpc' && (
                            <span className="ml-1 font-bold text-blue-600">
                              {demoSortDirection === 'asc' ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getSortedDemographicData().map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.label}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatNumber(item.impressions)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatNumber(item.reach)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatNumber(item.clicks)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatCurrency(item.spend)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatPercentage(item.ctr)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatCurrency(item.cpc) == "₹Infinity" ? "₹0.00" : formatCurrency(item.cpc)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-blue-700">Select a demographic breakdown to view audience data.</p>
                <p className="text-sm text-blue-600 mt-2">Note: This feature uses the Facebook API's breakdown parameter to segment your audience data.</p>
              </div>
            )}

            

            {/* Visualizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age Visualization */}
              {selectedBreakdown === 'age' && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Age Distribution</h3>
                  <div className="h-64">
                    {processedDemographicData && processedDemographicData.length > 0 ? (
                      <Doughnut 
                        data={getAgeChartData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No age data available
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Gender Visualization */}
              {selectedBreakdown === 'gender' && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
                  <div className="h-64">
                    {processedDemographicData && processedDemographicData.length > 0 ? (
                      <Pie 
                        data={getGenderChartData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No gender data available
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Country Visualization */}
              {selectedBreakdown === 'country' && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Top Countries</h3>
                  <div className="h-64">
                    {processedDemographicData && processedDemographicData.length > 0 ? (
                      <Pie 
                        data={getCountryChartData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No country data available
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Region Visualization */}
              {selectedBreakdown === 'region' && (
                <div className="bg-white p-4 rounded-lg shadow col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Regional Distribution</h3>
                  <div className="h-96">
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Regional data is available in the table above</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Device Visualization */}
              {selectedBreakdown === 'device_platform' && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Device Distribution</h3>
                  <div className="h-64">
                    {processedDemographicData && processedDemographicData.length > 0 ? (
                      <Pie 
                        data={getDeviceChartData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No device data available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdsetAnalytics;
