import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import metaLogo from "../../assets/metaLogo.png"
import torLogo from "../../assets/torLogo.png"
import { useCredentialStore } from '../../state/credentialState'
import toast from 'react-hot-toast';

const Navbar = () => {
  const { logout } = useCredentialStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className='w-full h-16 bg-[#1877F2] text-white shadow-md select-none'>
      <div className='container mx-auto h-full px-4 flex items-center justify-between'>
        <div className='flex items-center'>
          <img 
            src={metaLogo}
            alt="Meta Logo" 
            className="h-6 w-auto object-contain mr-3" 
          />
          <span className='hidden md:block font-semibold text-xl tracking-tight'>
            Meta Ads Analytics
          </span>
        </div>
        
        <div className='flex items-center space-x-4'>
          { !isHomePage && (  <div className="flex items-center">
            <img 
              src={torLogo}
              alt="User Avatar"
              className="h-8 w-8 rounded-full mr-2"
            />
            <span className="font-medium">Tor.ai</span>
          </div>)}
          {!isHomePage && (
            <button className='p-2 rounded-full hover:bg-blue-600 transition-colors' onClick={() => {
              logout();
              const user = confirm("Do you want to logout?")
              if (user) {
                 toast.success("Logged Out");
              navigate("/");
              }
             
             }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
         
        </div>
      </div>
    </div>
  );
};

export default Navbar;
