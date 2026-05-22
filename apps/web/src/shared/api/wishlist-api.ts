import { apiClient } from "./apiClient";

export interface WishlistTour {
  id: string;
  slug: string;
  title: Record<string, string>;
  country: string;
  city: string | null;
  coverImage: string;
  priceUsd: number;
  durationDays: number;
  hotelStars: number;
  avgRating: number;
  reviewsCount: number;
  isHot: boolean;
}

export interface WishlistItem {
  id: string;
  tourId: string;
  priceAtSave: number;
  priceDrop: boolean;
  createdAt: string;
  tour: WishlistTour;
}

export interface WishlistListResponse {
  items: WishlistItem[];
  total: number;
}

export const wishlistApi = {
  async toggle(tourId: string): Promise<{ wishlisted: boolean }> {
    const { data } = await apiClient.post<{ wishlisted: boolean }>(`/wishlists/${tourId}`);
    return data;
  },

  async status(tourId: string): Promise<{ wishlisted: boolean }> {
    const { data } = await apiClient.get<{ wishlisted: boolean }>(`/wishlists/${tourId}/status`);
    return data;
  },

  async listMy(): Promise<WishlistListResponse> {
    const { data } = await apiClient.get<WishlistListResponse>("/wishlists/my");
    return data;
  },
};
