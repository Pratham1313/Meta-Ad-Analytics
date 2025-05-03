import React, { useState, useEffect } from 'react';
import { useCredentialStore } from '../state/credentialState';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Doughnut } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Analytics = () => {
  const { businessId, accessToken } = useCredentialStore();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [demographicData, setDemographicData] = useState(null);
  const [demographicLoading, setDemographicLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState('age');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  
  // Add sort state
  const [sortField, setSortField] = useState('impressions');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Date selection states - updated default to last30Days
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateOption, setSelectedDateOption] = useState('last30Days');

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

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Use the provided access token or the one from store
        const token = accessToken || 'EAAbeITReusgBO5Vjx7ZCEZCuYXxB6ZAoUxXXNvP1GC8MjIC3iczxJnWI1PGOuvMQYy8tqltTKYZB87JOL4ZBSW0uMqL17ZABaPHuilkuPNoqVmfWmgwZCOfoEQYlvOZAqVhjckKI4fqcWGd4ZBiD5StsgZAacrZAkg397tnRZC6RrTh3A5ekhB7YvyqEY0CNRMuVw7AZCp0segTId';
        const accountId = businessId || 'act_412059718609144';
        
        // Use selected dates for time range
        const timeRange = JSON.stringify({
          "since": startDate,
          "until": endDate
        });
        
        // Fixed duplicate cost_per_thruplay field
        const fields = 'campaign_name,campaign_id,impressions,reach,clicks,spend,actions,ctr,cpc,cpm,unique_clicks,frequency,account_name,inline_link_clicks,inline_post_engagement,unique_actions,cost_per_unique_click,action_values,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions,video_play_actions,outbound_clicks,outbound_clicks_ctr,cost_per_outbound_click,cost_per_thruplay,website_purchase_roas,purchase_roas,quality_ranking,engagement_rate_ranking,conversion_rate_ranking,objective,cost_per_action_type,cost_per_inline_link_click,cost_per_inline_post_engagement,cost_per_unique_outbound_click,estimated_ad_recall_rate,full_view_impressions,full_view_reach';
        
        // Added additional parameters to get targeting information
        const url = `https://graph.facebook.com/v18.0/act_${accountId}/insights?access_token=${token}&time_range=${timeRange}&level=campaign&fields=${fields}&include_headers=false`;
        
        const response = await axios.get(url);
        console.log("mera bhai",response.data.data);
        
        // Fetch campaign data to get status
        try {
          const campaignsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/campaigns?access_token=${token}&fields=id,name,status`;
          const campaignsResponse = await axios.get(campaignsUrl);
          
          // Create a map of campaign ID to status
          const campaignStatusMap = {};
          if (campaignsResponse.data.data) {
            campaignsResponse.data.data.forEach(campaign => {
              campaignStatusMap[campaign.id] = campaign.status;
            });
          }
          
          // Add status to analytics data
          if (response.data.data) {
            response.data.data.forEach(campaign => {
              if (campaign.campaign_id) {
                campaign.status = campaignStatusMap[campaign.campaign_id] || 'UNKNOWN';
              }
            });
          }
        } catch (err) {
          console.error('Error fetching campaign status:', err);
        }
        
        // Fetch ad set data to get targeting information
        if (response.data.data && response.data.data.length > 0) {
          const campaignData = response.data.data;
          
          // Fetch ad sets for these campaigns to get targeting info
          try {
            const adSetsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/adsets?access_token=${token}&fields=campaign_id,targeting&limit=500`;
            const adSetsResponse = await axios.get(adSetsUrl);
            
            // Map targeting info to campaigns
            if (adSetsResponse.data.data && adSetsResponse.data.data.length > 0) {
              const adSetsMap = {};
              
              adSetsResponse.data.data.forEach(adSet => {
                if (adSet.campaign_id && adSet.targeting) {
                  if (!adSetsMap[adSet.campaign_id]) {
                    adSetsMap[adSet.campaign_id] = [];
                  }
                  adSetsMap[adSet.campaign_id].push(adSet.targeting);
                }
              });
              
              // Add targeting info to campaign data
              campaignData.forEach(campaign => {
                const campaignId = campaign.campaign_id;
                if (campaignId && adSetsMap[campaignId]) {
                  // Get age and gender targeting from the first ad set
                  const targeting = adSetsMap[campaignId][0];
                  if (targeting) {
                    campaign.age_targeting = targeting.age_min && targeting.age_max ? 
                      `${targeting.age_min}-${targeting.age_max}` : 'All Ages';
                    campaign.gender_targeting = targeting.genders ? 
                      (targeting.genders.includes(1) ? 'Men' : 'Women') : 
                      (targeting.genders && targeting.genders.includes(1) && targeting.genders.includes(2) ? 'All Genders' : 'All Genders');
                  }
                }
              });
            }
          } catch (err) {
            console.error('Error fetching ad sets:', err);
            // Continue with the campaign data we have
          }
          
          setAnalyticsData(campaignData);
        } else {
          setAnalyticsData(response.data.data);
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
  }, [businessId, accessToken, startDate, endDate]);

  // Fetch demographic data when selectedBreakdown or selectedCampaign changes
  useEffect(() => {
    const fetchDemographicData = async () => {
      if (!analyticsData || analyticsData.length === 0) return;
      
      try {
        setDemographicLoading(true);
        
        const token = accessToken || 'EAAbeITReusgBO5Vjx7ZCEZCuYXxB6ZAoUxXXNvP1GC8MjIC3iczxJnWI1PGOuvMQYy8tqltTKYZB87JOL4ZBSW0uMqL17ZABaPHuilkuPNoqVmfWmgwZCOfoEQYlvOZAqVhjckKI4fqcWGd4ZBiD5StsgZAacrZAkg397tnRZC6RrTh3A5ekhB7YvyqEY0CNRMuVw7AZCp0segTId';
        const accountId = businessId || 'act_412059718609144';
        
        // Use selected dates for time range
        const timeRange = JSON.stringify({
          "since": startDate,
          "until": endDate
        });
        
        const fields = 'campaign_name,campaign_id,impressions,reach,clicks,spend';

        // Add campaign filtering if a specific campaign is selected
        let url = `https://graph.facebook.com/v18.0/act_${accountId}/insights?access_token=${token}&time_range=${timeRange}&level=campaign&fields=${fields}&breakdowns=${selectedBreakdown}`;
        
        if (selectedCampaign !== 'all') {
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
  }, [selectedBreakdown, selectedCampaign, analyticsData, businessId, accessToken, startDate, endDate]);

  // Extract active campaigns when analyticsData changes
  useEffect(() => {
    if (analyticsData && analyticsData.length > 0) {
      const campaigns = analyticsData
        .filter(campaign => campaign.status === 'ACTIVE')
        .map(campaign => ({
          id: campaign.campaign_id,
          name: campaign.campaign_name
        }));
      setActiveCampaigns(campaigns);
      
      // Set first active campaign as default selected campaign if we haven't selected one yet
      if (selectedCampaign === 'all' && campaigns.length > 0) {
        setSelectedCampaign(campaigns[0].id);
      }
    }
  }, [analyticsData, selectedCampaign]);

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

  // Helper function to extract specific action values
  const getActionValue = (actions, actionType) => {
    if (!actions) return '0';
    const action = actions.find(a => a.action_type === actionType);
    return action ? action.value : '0';
  };

  // Calculate ROAS (Return on Ad Spend)
  const calculateROAS = (campaign) => {
    // Using the official ROAS metric if available
    if (campaign.website_purchase_roas && campaign.website_purchase_roas.length > 0) {
      return parseFloat(campaign.website_purchase_roas[0].value).toFixed(2);
    }
    
    if (campaign.purchase_roas && campaign.purchase_roas.length > 0) {
      return parseFloat(campaign.purchase_roas[0].value).toFixed(2);
    }
    
    // Fallback calculation if ROAS metrics aren't available
    if (!campaign.action_values || !campaign.spend) return '0';
    
    // Find purchase value from action_values if available
    const purchaseValue = campaign.action_values?.find(a => a.action_type === 'purchase')?.value || 0;
    // Find lead value from action_values if available
    const leadValue = campaign.action_values?.find(a => a.action_type === 'lead')?.value || 0;
    
    // For demonstration, we'll assign an estimated value per lead ($50) if actual values aren't available
    const leadCount = parseInt(getActionValue(campaign.actions, 'lead')) || 0;
    const estimatedLeadValue = leadCount * 50;
    
    const totalValue = parseFloat(purchaseValue) || estimatedLeadValue;
    const spend = parseFloat(campaign.spend);
    
    if (spend === 0) return '0';
    return (totalValue / spend).toFixed(2);
  };

  // Calculate Cost per Action (for leads)
  const calculateCPA = (campaign) => {
    const leadCount = parseInt(getActionValue(campaign.actions, 'lead')) || 0;
    const spend = parseFloat(campaign.spend) || 0;
    
    if (leadCount === 0) return formatCurrency(0);
    return formatCurrency(spend / leadCount);
  };

  // Calculate Conversion Rate
  const calculateConversionRate = (campaign) => {
    const leadCount = parseInt(getActionValue(campaign.actions, 'lead')) || 0;
    const clicks = parseInt(campaign.clicks) || 0;
    
    if (clicks === 0) return '0%';
    return `${((leadCount / clicks) * 100).toFixed(2)}%`;
  };

  // Calculate Video Completion Rate
  const calculateVideoCompletionRate = (campaign) => {
    // Using valid video completion metrics from the API
    if (!campaign.video_p100_watched_actions) return 'N/A';
    
    const completedViews = getActionValue(campaign.video_p100_watched_actions, 'video_view') || 0;
    const startedViews = getActionValue(campaign.video_play_actions, 'video_view') || 1; // Avoid division by zero
    
    if (startedViews === 0) return '0%';
    return `${((completedViews / startedViews) * 100).toFixed(2)}%`;
  };

  // Calculate Engagement Rate
  const calculateEngagementRate = (campaign) => {
    const postEngagements = parseInt(campaign.inline_post_engagement) || 0;
    const impressions = parseInt(campaign.impressions) || 0;
    
    if (impressions === 0) return '0%';
    return `${((postEngagements / impressions) * 100).toFixed(2)}%`;
  };

  // No direct relevance_score field, so adjusted method
  const getQualityScore = (campaign) => {
    // Facebook removed explicit relevance score, so this is an estimate
    const ctr = parseFloat(campaign.ctr) || 0;
    const freqRatio = 1 / (parseFloat(campaign.frequency) || 1);
    
    // Simplified quality estimation based on CTR and frequency
    // Higher CTR and lower frequency often correlate with higher quality
    const estimatedScore = ((ctr * 100) * freqRatio).toFixed(1);
    
    return estimatedScore > 10 ? '10.0' : estimatedScore < 1 ? '1.0' : estimatedScore;
  };

  // Process demographic data for visualization
  const processDemographicData = () => {
    if (!demographicData || demographicData.length === 0) return null;
    
    // Group data by the demographic breakdown value
    const groupedData = demographicData.reduce((acc, item) => {
      const key = item[selectedBreakdown]; // e.g., "18-24", "male", "US", etc.
      
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
    
    // Convert to array for easier rendering and sort by impressions in descending order
    return Object.entries(groupedData)
      .map(([key, value]) => ({
        label: key,
        ...value,
        ctr: value.clicks / value.impressions || 0,
        cpc: value.spend / value.clicks || 0
      }))
      .sort((a, b) => b.impressions - a.impressions); // Always sort by impressions in descending order
  };

  const processedDemographicData = processDemographicData();

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

  // Helper to get conversions count from actions
  const getConversions = (campaign) => {
    const conversions = getActionValue(campaign.actions, 'offsite_conversion.fb_pixel_purchase') || 
                       getActionValue(campaign.actions, 'onsite_conversion.purchase') ||
                       getActionValue(campaign.actions, 'purchase');
    return conversions;
  };

  // Helper to format ranking values
  const formatRanking = (ranking) => {
    if (!ranking) return 'Unknown';
    
    const rankMap = {
      'BELOW_AVERAGE': '⭐ Below Average',
      'AVERAGE': '⭐⭐ Average',
      'ABOVE_AVERAGE': '⭐⭐⭐ Above Average',
      'TOP': '⭐⭐⭐⭐ Top Ranking'
    };
    
    return rankMap[ranking] || ranking;
  };

  // Helper to format objective
  const formatObjective = (objective) => {
    if (!objective) return 'Unknown';
    
    // Replace underscores with spaces and capitalize each word
    return objective
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Function to calculate average age of audience 
  const calculateAudienceAgeMetrics = () => {
    if (!demographicData || demographicData.length === 0 || selectedBreakdown !== 'age') return null;
    
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
    
    demographicData.forEach(data => {
      const impressions = parseInt(data.impressions) || 0;
      const ageRange = data.age;
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
  
  // Function to calculate gender distribution
  const calculateGenderDistribution = () => {
    if (!demographicData || demographicData.length === 0 || selectedBreakdown !== 'gender') return null;
    
    let maleImpressions = 0;
    let femaleImpressions = 0;
    let unknownImpressions = 0;
    
    demographicData.forEach(data => {
      const impressions = parseInt(data.impressions) || 0;
      const gender = data.gender;
      
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
  
  // Function to get sorted data
  const getSortedData = (data) => {
    if (!data) return [];
    
    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle special calculated fields
      if (sortField === 'engagement_rate') {
        aValue = parseFloat(calculateEngagementRate(a).replace('%', ''));
        bValue = parseFloat(calculateEngagementRate(b).replace('%', ''));
      }
      
      // Parse numbers for numeric fields
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
      
      // Number comparison
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };
  
  // Get sorted demographic data
  const getSortedDemographicData = () => {
    if (!processedDemographicData) return [];
    
    return [...processedDemographicData].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Parse numbers for numeric fields
      if (typeof aValue === 'string' && !isNaN(parseFloat(aValue))) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      // String comparison for labels
      if (sortField === 'label') {
        return sortDirection === 'asc' 
          ? a.label.localeCompare(b.label) 
          : b.label.localeCompare(a.label);
      }
      
      // Number comparison
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  // Sort the data before rendering
  const sortedAnalyticsData = getSortedData(analyticsData);
  const sortedDemographicData = getSortedDemographicData();

  // Add these new functions before the return statement
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
        },
        {
          label: 'Clicks',
          data: clicksData,
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

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
        <p className="text-gray-600">View performance metrics for your Meta Ad Campaigns</p>
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
                    
                    {/* Calendar UI can be added here if needed */}
                    
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
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : analyticsData && analyticsData.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Campaign Performance</h2>
            
            {/* Metrics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Impression & Reach */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Impressions & Reach</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-blue-600">Impressions</p>
                    <p className="text-xl font-bold text-blue-800">
                      {formatNumber(analyticsData?.reduce((sum, campaign) => sum + parseInt(campaign.impressions || 0), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Reach</p>
                    <p className="text-xl font-bold text-blue-800">
                      {formatNumber(analyticsData?.reduce((sum, campaign) => sum + parseInt(campaign.reach || 0), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Frequency</p>
                    <p className="text-xl font-bold text-blue-800">
                      {(analyticsData?.reduce((sum, campaign) => sum + parseInt(campaign.impressions || 0), 0) / 
                        Math.max(1, analyticsData?.reduce((sum, campaign) => sum + parseInt(campaign.reach || 0), 0))).toFixed(2)}
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
                      {formatNumber(analyticsData?.reduce((sum, campaign) => sum + parseInt(campaign.clicks || 0), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600">CTR</p>
                    <p className="text-xl font-bold text-green-800">
                      {((analyticsData?.reduce((sum, campaign) => sum + parseInt(campaign.clicks || 0), 0) /
                        Math.max(1, analyticsData?.reduce((sum, campaign) => sum + parseInt(campaign.impressions || 0), 0))) * 100).toFixed(2)}%
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
                      {formatCurrency(analyticsData?.reduce((sum, campaign) => sum + parseFloat(campaign.spend || 0), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600">CPC</p>
                    <p className="text-xl font-bold text-purple-800">
                      {formatCurrency(
                        analyticsData?.reduce((sum, campaign) => sum + parseFloat(campaign.spend || 0), 0) /
                        Math.max(1, analyticsData?.reduce((sum, campaign) => sum + parseInt(campaign.clicks || 0), 0))
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600">CPM</p>
                    <p className="text-xl font-bold text-purple-800">
                      {formatCurrency(
                        (analyticsData?.reduce((sum, campaign) => sum + parseFloat(campaign.spend || 0), 0) * 1000) /
                        Math.max(1, analyticsData?.reduce((sum, campaign) => sum + parseInt(campaign.impressions || 0), 0))
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-md font-medium text-gray-700">Campaign Details</h3>
              <div className="text-sm text-gray-500">
                {analyticsData?.filter(c => c.status === 'ACTIVE').length || 0} Active Campaigns
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('campaign_name')}
                    >
                      <div className="flex items-center">
                        CAMPAIGN NAME
                        {sortField === 'campaign_name' && (
                          <span className="ml-1 font-bold text-blue-600">
                            {sortDirection === 'asc' ? '▼' : '▲'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center justify-center">
                        STATUS
                        {sortField === 'status' && (
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
                  {sortedAnalyticsData.map((campaign, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900">{campaign.campaign_name}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                          campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {campaign.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{formatNumber(campaign.impressions)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{formatNumber(campaign.reach)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{formatNumber(campaign.clicks)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{formatCurrency(campaign.spend)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{parseFloat(campaign.ctr).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{formatCurrency(campaign.cpc)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{formatCurrency(campaign.cpm)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{parseFloat(campaign.frequency || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{calculateEngagementRate(campaign)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Advanced Analytics Section */}
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Campaign Insights</h2>
             
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-md font-medium text-gray-800 mb-3">High Engagement Campaigns</h3>
              <div className="mt-2 space-y-2">
                {analyticsData && analyticsData.length > 0 
                  ? [...analyticsData]
                      .sort((a, b) => {
                        const aRate = parseFloat(calculateEngagementRate(a).replace('%', '')) || 0;
                        const bRate = parseFloat(calculateEngagementRate(b).replace('%', '')) || 0;
                        return bRate - aRate;
                      })
                      .slice(0, 5)
                      .map((campaign, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-white rounded border border-gray-100">
                          <div className="text-sm font-medium truncate max-w-[60%]">{campaign.campaign_name}</div>
                          <div className="text-sm font-bold text-blue-600">{calculateEngagementRate(campaign)} Eng. Rate</div>
                        </div>
                      ))
                  : <div className="text-gray-500 text-sm">No data available</div>
                }
              </div>
            </div>
          </div>
          
          {/* Audience Demographics Section */}
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Audience Demographics</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Campaign</label>
              <select 
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {activeCampaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
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

            {demographicLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Data Table */}
                {processedDemographicData && processedDemographicData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('label')}
                          >
                            {getBreakdownLabel()}
                            {sortField === 'label' && (
                              <span className="ml-1 font-bold text-blue-600">
                                {sortDirection === 'asc' ? '▼' : '▲'}
                              </span>
                            )}
                          </th>
                          <th 
                            className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('impressions')}
                          >
                            Impressions
                            {sortField === 'impressions' && (
                              <span className="ml-1 font-bold text-blue-600">
                                {sortDirection === 'asc' ? '▼' : '▲'}
                              </span>
                            )}
                          </th>
                          <th 
                            className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('reach')}
                          >
                            Reach
                            {sortField === 'reach' && (
                              <span className="ml-1 font-bold text-blue-600">
                                {sortDirection === 'asc' ? '▼' : '▲'}
                              </span>
                            )}
                          </th>
                          <th 
                            className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('clicks')}
                          >
                            Clicks
                            {sortField === 'clicks' && (
                              <span className="ml-1 font-bold text-blue-600">
                                {sortDirection === 'asc' ? '▼' : '▲'}
                              </span>
                            )}
                          </th>
                          <th 
                            className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('spend')}
                          >
                            Spend
                            {sortField === 'spend' && (
                              <span className="ml-1 font-bold text-blue-600">
                                {sortDirection === 'asc' ? '▼' : '▲'}
                              </span>
                            )}
                          </th>
                          <th 
                            className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('ctr')}
                          >
                            CTR
                            {sortField === 'ctr' && (
                              <span className="ml-1 font-bold text-blue-600">
                                {sortDirection === 'asc' ? '▼' : '▲'}
                              </span>
                            )}
                          </th>
                          <th 
                            className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('cpc')}
                          >
                            CPC
                            {sortField === 'cpc' && (
                              <span className="ml-1 font-bold text-blue-600">
                                {sortDirection === 'asc' ? '▼' : '▲'}
                              </span>
                            )}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sortedDemographicData.map((item, index) => (
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
                        {processedDemographicData && processedDemographicData.length > 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">Regional data is available in the table below</p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            No region data available
                          </div>
                        )}
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
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
};

export default Analytics; 