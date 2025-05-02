import { create } from 'zustand';

export const useCredentialStore = create((set) => ({
  businessId: localStorage.getItem('businessId') || '',
  accessToken: localStorage.getItem('accessToken') || '',

  submitCredentials: (businessId,accessToken) => {
    localStorage.setItem('businessId', businessId);
    localStorage.setItem('accessToken', accessToken);
    set({ businessId, accessToken });
  },

  logout: () => {
    localStorage.removeItem('businessId');
    localStorage.removeItem('accessToken');
    set({ businessId: '', accessToken: '' });
  }

}));
