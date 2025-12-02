import { apiRequest, authenticatedApiRequest } from '../utils/api';

export interface Room {
  _id: string;
  resort_id: string;
  room_type: string;
  capacity: number;
  price_per_night: number;
  status: string;
  deleted: boolean;
  createdAt: string;
  resort_id_populated?: {
    _id: string;
    resort_name: string;
    location: {
      address: string;
      latitude: number;
      longitude: number;
    };
    image?: string;
  };
  booked_dates?: string[];
}

export interface RoomAvailability {
  available: boolean;
  room: {
    id: string;
    type: string;
    capacity: number;
    price_per_night: number;
    resort: any;
  };
  booking_details: {
    start_date: string;
    end_date: string;
    total_price: number;
    nights: number;
  };
}

export interface RoomFormData {
  resort_id: string;
  room_type: string;
  capacity: number;
  price_per_night: number;
  status: string;
}

export const roomAPI = {
  createRoom: async (roomData: RoomFormData): Promise<Room> => {
    try {
      const response = await authenticatedApiRequest('/room', {
        method: 'POST',
        body: JSON.stringify(roomData)
      });
      return response;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  getRoomsByResort: async (resortId: string): Promise<{ resort: any; rooms: Room[] }> => {
    try {
      const response = await apiRequest(`/room/resort/${resortId}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching rooms by resort:', error);
      
      // Provide user-friendly error messages
      if (error.status === 404) {
        throw new Error('Resort not found or no rooms available.');
      }
      if (error.status === 400) {
        throw new Error('Invalid resort ID. Please try again.');
      }
      
      throw new Error(error.message || 'Failed to load resort rooms. Please try again later.');
    }
  },

  getAvailableRooms: async (resortId: string,startDate:string,endDate:string): Promise<{ resort: any; rooms: Room[] }> => {
    try {
      const response = await apiRequest(`/room/resort/available-rooms/${resortId}/${startDate}/${endDate}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching rooms by resort:', error);
      
      // Provide user-friendly error messages
      if (error.status === 404) {
        throw new Error('Resort not found or no rooms available.');
      }
      if (error.status === 400) {
        throw new Error('Invalid resort ID. Please try again.');
      }
      
      throw new Error(error.message || 'Failed to load resort rooms. Please try again later.');
    }
  },

  getRoomById: async (roomId: string): Promise<Room> => {
    try {
      const response = await apiRequest(`/room/${roomId}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching room by ID:', error);
      
      // Provide user-friendly error messages
      if (error.status === 404) {
        throw new Error('Room not found. It may have been removed or is no longer available.');
      }
      if (error.status === 400) {
        throw new Error('Invalid room ID. Please try again.');
      }
      
      throw new Error(error.message || 'Failed to load room details. Please try again later.');
    }
  },

  checkRoomAvailability: async (
    roomId: string, 
    startDate: string, 
    endDate: string
  ): Promise<RoomAvailability> => {
    try {
      const response = await apiRequest(
        `/reservation/availability/${roomId}?start_date=${startDate}&end_date=${endDate}`
      );
      return response;
    } catch (error) {
      console.error('Error checking room availability:', error);
      throw error;
    }
  },

  getBookedDates: async (roomId: string): Promise<{ room_id: string; booked_dates: string[] }> => {
    try {
      const response = await apiRequest(`/reservation/booked-dates/${roomId}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching booked dates:', error);
      
      // Return empty booked dates as fallback instead of failing
      if (error.status === 404 || error.status === 400) {
        console.warn('Room not found or invalid ID, returning empty booked dates');
        return {
          room_id: roomId,
          booked_dates: []
        };
      }
      
      // For server errors, also return empty array as fallback
      console.warn('Server error fetching booked dates, returning empty array as fallback');
      return {
        room_id: roomId,
        booked_dates: []
      };
    }
  }
};