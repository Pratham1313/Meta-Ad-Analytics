import React, { useState } from 'react';
import torLogo from "../assets/torLogo.png"
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useCredentialStore } from "../state/credentialState";
import { Navigate, useNavigate } from 'react-router-dom';

const Credentials = () => {
  const { businessId, accessToken, submitCredentials } = useCredentialStore();
  const [localFormData, setLocalFormData] = useState({
    businessId: businessId,
    accessToken: accessToken
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const url = `https://graph.facebook.com/v22.0/act_${localFormData.businessId}?access_token=${localFormData.accessToken}`;
    axios.get(url)
      .then(response => {
        toast.success('Successfully connected to Facebook');
        submitCredentials(localFormData.businessId, localFormData.accessToken);
        navigate("/dashboard");
        setLoading(false);
      })
      .catch(error => {
        toast.error('Failed to connect to Facebook');
        setLoading(false);
      });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (businessId && accessToken) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
        <Navigate to="/analytics" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-100 py-6 overflow-hidden">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <p className="text-gray-600 mt-4">Enter your credentials to access your analytics</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="businessId" className="block text-sm font-medium text-gray-700 mb-1">
              Business ID
            </label>
            <input
              type="text"
              id="businessId"
              name="businessId"
              value={localFormData.businessId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent"
              placeholder="Enter your Business ID"
              required
            />
          </div>

          <div className='select-none'>
            <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-1">
              Access Token
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="accessToken"
                name="accessToken"
                value={localFormData.accessToken}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent pr-10 select-all"
                placeholder="Enter your Access Token"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full h-10 bg-[#1877F2] select-none cursor-pointer text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              aria-busy={loading}
              aria-label="Submit credentials"
            >
              <div className="h-5 min-w-[1.25rem] flex items-center justify-center">
                {loading ? (
                  <div 
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                    role="status"
                    aria-label="Loading"
                  />
                ) : (
                  <span>Submit</span>
                )}
              </div>
            </button>
          </div>
        </form>

                

        <div className="mt-6 border-t border-gray-200 pt-5">
          <div className="flex items-center justify-center">
            <img 
              src={torLogo} 
              alt="Tor.ai Logo"
              className="h-6 w-auto mr-2"
            />
            <span className="text-gray-500 font-medium">Tor.ai Analytics Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credentials;
