import axios from 'axios';
import { API_BASE_URL, authenticatedApiRequest } from '../utils/api';

// Enhanced resort interface with customer data
export interface EnhancedResort {
  _id: string;
  resort_name: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  description?: string;
  image?: string;
  rating: number;
  reviews: number;
  price_per_night: number;
  available_rooms: number;
  createdAt: string;
}

export interface BasicResort {
  _id: string;
  resort_name: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  description?: string;
  image?: string;
  createdAt: string;
}

const customerResortAPI = {
  // Get all resorts (basic data)
  getAllResorts: async (): Promise<BasicResort[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/resort`);
      return response.data;
    } catch (error) {
      console.error('Error fetching resorts:', error);
      throw error;
    }
  },

  // Get featured resorts with enhanced data (rating, reviews, price)
  getFeaturedResorts: async (): Promise<EnhancedResort[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/resort/featured`);
      return response.data;
    } catch (error) {
      console.error('Error fetching featured resorts:', error);
      throw error;
    }
  },
    getAvailableResorts: async (payload: {
      startDate: string;
      endDate: string;
    }): Promise<{ resortIds: string[] }> => {
      const res = await authenticatedApiRequest("/resort/available", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      return res; // { resortIds: string[] }
    },

  

  // Get resort by ID
  getResortById: async (resortId: string): Promise<BasicResort> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/resort/${resortId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching resort:', error);
      throw error;
    }
  },

  // Search resorts by keyword
  searchResorts: async (query: string): Promise<BasicResort[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/resort/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching resorts:', error);
      throw error;
    }
  },
};

export default customerResortAPI;
