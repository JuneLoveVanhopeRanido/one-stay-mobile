import { API_BASE_URL, apiRequest, authenticatedApiRequest } from '../utils/api';


export interface ResortFeedback {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;

  from_user: {
    _id: string;
    username: string;
  };

  to_user: {
    _id: string;
    username: string;
  };

  room: {
    _id: string;
    room_type: string;
    room_number?: number;
  };
}

export interface ResortData {
  resort_name: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  description?: string;
  image?: string;
  
}

export interface ResortFormData {
  resort_name: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  description?: string;
  imageUri?: string; // For file upload
}

export interface Resort {
  _id: string;
  owner_id: string;
  resort_name: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  description?: string;
  image?: string;
  createdAt: string;
  deleted: boolean;
  
  feedbacks?: ResortFeedback[];
}

export const resortAPI = {
  createResort: async (resortData: ResortData, token: string): Promise<Resort> => {
    try {
      const response = await authenticatedApiRequest('/resort', {
        method: 'POST',
        body: JSON.stringify(resortData),
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create resort');
    }
  },

  createResortWithImage: async (resortData: ResortFormData, token: string): Promise<Resort> => {
    try {
      const formData = new FormData();
      
      formData.append('resort_name', resortData.resort_name);
      formData.append('location', JSON.stringify(resortData.location));
      
      if (resortData.description) {
        formData.append('description', resortData.description);
      }
      
      if (resortData.imageUri) {
        const imageFile = {
          uri: resortData.imageUri,
          type: 'image/jpeg',
          name: `resort-${Date.now()}.jpg`,
        } as any;
        formData.append('image', imageFile);
      }

      // Debug logging
      console.log('FormData being sent:');
      console.log('- resort_name:', resortData.resort_name);
      console.log('- location (stringified):', JSON.stringify(resortData.location));
      console.log('- description:', resortData.description);
      console.log('- imageUri:', resortData.imageUri ? 'Present' : 'Not present');

      const response = await fetch(`${API_BASE_URL}/resort`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create resort');
    }
  },

  updateResort: async (resortId: string, resortData: Partial<ResortFormData>, token: string): Promise<Resort> => {
    try {
      const formData = new FormData();
      
      if (resortData.resort_name) {
        formData.append('resort_name', resortData.resort_name);
      }
      
      if (resortData.location) {
        formData.append('location', JSON.stringify(resortData.location));
      }
      
      if (resortData.description !== undefined) {
        formData.append('description', resortData.description);
      }

      if (resortData.imageUri) {
        const imageFile = {
          uri: resortData.imageUri,
          type: 'image/jpeg',
          name: `resort-${Date.now()}.jpg`,
        } as any;
        formData.append('image', imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/resort/${resortId}`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update resort');
    }
  },

  updateResortImage: async (resortId: string, imageUri: string, token: string): Promise<Resort> => {
    try {
      const formData = new FormData();
      
      const imageFile = {
        uri: imageUri,
        type: 'image/jpeg',
        name: `resort-${Date.now()}.jpg`,
      } as any;
      formData.append('image', imageFile);

      const response = await fetch(`${API_BASE_URL}/resort/${resortId}/image`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      return responseData.resort;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update resort image');
    }
  },

  getAllResorts: async (): Promise<Resort[]> => {
    try {
      const response = await apiRequest('/resort', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch resorts');
    }
  },

  searchResorts: async (query: string): Promise<Resort[]> => {
    try {
      const response = await apiRequest(`/resort/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to search resorts');
    }
  },

  getResortById: async (id: string): Promise<Resort | null> => {
    try {
      const response = await apiRequest(`/resort/${id}`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.warn(`Resort with ID ${id} not found or failed to fetch:`, error);
      return null;
    }
  },

  getResortsByOwner: async (ownerId: string, token: string): Promise<Resort[]> => {
    try {
      const response = await authenticatedApiRequest(`/resort/owner/${ownerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch owner resorts');
    }
  },
};
