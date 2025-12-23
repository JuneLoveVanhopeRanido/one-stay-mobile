import { apiRequest, getAuthHeaders } from "../utils/api";

export interface FavoriteResponse {
  message: string;
  favorites?: string[];
  isFavorite?: boolean;
}

export const customerFavoriteAPI = {
  add: async (resortId: string): Promise<FavoriteResponse> => {
    const headers = await getAuthHeaders();
    const response = await apiRequest(`/favorites/add`, {
      method: "POST",
      headers,
      body: JSON.stringify({ resortId }),
    });
    return response;
  },

  remove: async (resortId: string): Promise<FavoriteResponse> => {
    const headers = await getAuthHeaders();
    const response = await apiRequest(`/favorites/remove`, {
      method: "POST",
      headers,
      body: JSON.stringify({ resortId }),
    });
    return response;
  },

  isFavorite: async (resortId: string): Promise<{ isFavorite: boolean }> => {
    const headers = await getAuthHeaders();
    const response = await apiRequest(`/favorites/isFavorite/${resortId}`, {
      method: "GET",
      headers,
    });
    return response;
  },

  getMyFavorites: async (userId: string) => {
    const headers = await getAuthHeaders();
    const response = await apiRequest(`/favorites/user/${userId}`, {
      method: "GET",
      headers,
    });
    return response; // expected: array of resorts or IDs
  },
};
