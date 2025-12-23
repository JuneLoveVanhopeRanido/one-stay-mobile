import { apiRequest, authenticatedApiRequest } from '../utils/api';

export interface Reservation {
  _id: string;
  user_id: string;
  // room_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  reason:string;
  room_id?: {
    _id: string;
    room_type: string;
    capacity: number;
    price_per_night: number;
    room_number:number;
    resort_id: {
      _id: string;
      resort_name: string;
      location: {
        address: string;
        latitude: number;
        longitude: number;
      };
      image?: string;
    };

  };
  user_id_populated?: {
    _id: string;
    username: string;
    email: string;
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalReservations: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export interface FilterInfo {
  status: string;
  search: string;
  startDate: string | null;
  endDate: string | null;
  sortBy: string;
  sortOrder: string;
}

export interface OwnerReservationsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface OwnerReservationsResponse {
  reservations: Reservation[];
  pagination: PaginationInfo;
  filters: FilterInfo;
}

export interface AvailabilityCheck {
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

export interface BookedDates {
  room_id: string;
  booked_dates: string[];
}

export interface ReservationFormData {
  room_id: string;
  start_date: string;
  end_date: string;
}

export const reservationAPI = {
  // Check room availability for specific dates
  checkAvailability: async (
    roomId: string,
    startDate: string,
    endDate: string
  ): Promise<AvailabilityCheck> => {
    try {
      const response = await apiRequest(
        `/reservation/availability/${roomId}?start_date=${startDate}&end_date=${endDate}`
      );
      return response;
    } catch (error: any) {
      console.error('Error checking availability:', error);
      
      // Provide user-friendly error messages based on backend error codes
      if (error.status === 404) {
        throw new Error('Room not found. It may have been removed or is no longer available.');
      }
      if (error.status === 400) {
        throw new Error('Invalid room ID or date format. Please try again.');
      }
      
      throw new Error(error.message || 'Failed to check room availability. Please try again later.');
    }
  },

  // Get booked dates for a room (for calendar display)
  getBookedDates: async (roomId: string): Promise<BookedDates> => {
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
  },

  // Create a new reservation
  createReservation: async (reservationData: ReservationFormData): Promise<{ 
    message: string; 
    reservation: Reservation 
  }> => {
    try {
      const response = await authenticatedApiRequest('/reservation', {
        method: 'POST',
        body: JSON.stringify(reservationData)
      });
      return response;
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      
      // Provide user-friendly error messages
      if (error.status === 404) {
        throw new Error('Room or resort not found. Please try selecting a different room.');
      }
      if (error.status === 409) {
        throw new Error('Room is no longer available for the selected dates. Please choose different dates.');
      }
      if (error.status === 400) {
        throw new Error('Invalid booking information. Please check your dates and try again.');
      }
      if (error.status === 401) {
        throw new Error('Please log in to make a reservation.');
      }
      
      throw new Error(error.message || 'Failed to create reservation. Please try again later.');
    }
  },

  // Get user's reservations
  getUserReservations: async (status?: string): Promise<{ reservations: Reservation[] }> => {
    try {
      const url = status 
        ? `/reservation/my-reservations?status=${status}`
        : '/reservation/my-reservations';
      const response = await authenticatedApiRequest(url);

      return response;
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      throw error;
    }
  },

  // Get owner's reservations with search, filtering, and pagination
  getOwnerReservations: async (params?: OwnerReservationsParams): Promise<OwnerReservationsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.status && params.status !== 'all') {
        queryParams.append('status', params.status);
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      if (params?.sortOrder) {
        queryParams.append('sortOrder', params.sortOrder);
      }
      if (params?.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      if (params?.endDate) {
        queryParams.append('endDate', params.endDate);
      }

      const url = `/reservation/owner-reservations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await authenticatedApiRequest(url);
      return response;
    } catch (error) {
      console.error('Error fetching owner reservations:', error);
      throw error;
    }
  },

  // Update reservation status (owner only)
  updateReservationStatus: async (
    reservationId: string, 
    status: 'approved' | 'rejected'
  ): Promise<{ message: string; reservation: Reservation }> => {
    try {
      const response = await authenticatedApiRequest(`/reservation/${reservationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      return response;
    } catch (error) {
      console.error('Error updating reservation status:', error);
      throw error;
    }
  },

  // Cancel reservation (customer only)
cancelReservation: async (reservationId: string, reason: string): Promise<{ message: string }> => {
  try {
    const response = await authenticatedApiRequest(`/reservation/${reservationId}`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })  // MUST be an object
    });
    
          console.log('cancelled@@@@@@@',response);
    return response;
    
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    throw error;
  }
},


  // Get reservation by ID
  getReservationById: async (reservationId: string): Promise<{ reservation: Reservation }> => {
    try {
      const response = await authenticatedApiRequest(`/reservation/${reservationId}`);
      return response;
    } catch (error) {
      console.error('Error fetching reservation by ID:', error);
      throw error;
    }
  },

  // Mark reservation as completed (owner only)
  completeReservation: async (reservationId: string): Promise<{ message: string; reservation: Reservation; feedbackEligible: boolean }> => {
    try {
      const response = await authenticatedApiRequest(`/reservation/${reservationId}/complete`, {
        method: 'PUT'
      });
      return response;
    } catch (error) {
      console.error('Error completing reservation:', error);
      throw error;
    }
  },

  // Auto-complete reservations (system/admin)
  autoCompleteReservations: async (): Promise<{ message: string; completedCount: number; completedReservationIds: string[] }> => {
    try {
      const response = await authenticatedApiRequest('/reservation/auto-complete', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error auto-completing reservations:', error);
      throw error;
    }
  }
};

// Feedback interfaces and service
export interface FeedbackRequest {
  reservation_id: string;
  rating: number; // 1-5
  comment?: string;
  feedback_type: 'customer_to_owner' | 'owner_to_customer';
}

export interface Feedback {
  _id: string;
  from_user_id: string;
  to_user_id: string;
  room_id: string;
  reservation_id: string;
  feedback_type: 'customer_to_owner' | 'owner_to_customer';
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  from_user_id_populated?: {
    _id: string;
    username: string;
    email: string;
  };
  to_user_id_populated?: {
    _id: string;
    username: string;
    email: string;
  };
}

export interface FeedbackEligibility {
  canGiveFeedback: boolean;
  feedbackType: string | null;
  alreadySubmitted: boolean;
  reservationStatus: string;
  mutualFeedback: {
    customerFeedbackGiven: boolean;
    ownerFeedbackGiven: boolean;
    bothCompleted: boolean;
  };
}

export const feedbackAPI = {
  // Create feedback
  createFeedback: async (feedbackData: FeedbackRequest): Promise<{ message: string; feedback: Feedback }> => {
    try {
      const response = await authenticatedApiRequest('/feedback', {
        method: 'POST',
        body: JSON.stringify(feedbackData)
      });
      return response;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  },

  // Get feedback eligibility for a reservation
  getFeedbackEligibility: async (reservationId: string): Promise<FeedbackEligibility> => {
    try {
      const response = await authenticatedApiRequest(`/feedback/eligibility/${reservationId}`);
      return response;
    } catch (error) {
      console.error('Error checking feedback eligibility:', error);
      throw error;
    }
  },

  // Get user's feedback summary
  getUserFeedbackSummary: async (userId: string): Promise<any> => {
    try {
      const response = await authenticatedApiRequest(`/feedback/user/${userId}`);
      return response;
    } catch (error) {
      console.error('Error getting user feedback summary:', error);
      throw error;
    }
  },

  // Get feedbacks for a room (public reviews)
  getRoomFeedbacks: async (roomId: string, page = 1, limit = 10): Promise<any> => {
    try {
      const response = await apiRequest(`/feedback/room/${roomId}?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error getting room feedbacks:', error);
      throw error;
    }
  },

  // Update feedback
  updateFeedback: async (feedbackId: string, updateData: { rating?: number; comment?: string }): Promise<{ message: string; feedback: Feedback }> => {
    try {
      const response = await authenticatedApiRequest(`/feedback/${feedbackId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      return response;
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  },

  // Delete feedback
  deleteFeedback: async (feedbackId: string): Promise<{ message: string }> => {
    try {
      const response = await authenticatedApiRequest(`/feedback/${feedbackId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  }
};