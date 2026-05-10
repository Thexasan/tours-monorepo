import type { LocalizedText, LocalizedList } from "./common";

export type MealPlan = "ALL_INCLUSIVE" | "HALF_BOARD" | "BREAKFAST" | "NO_MEALS";

export interface Tour {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  programIncluded: LocalizedList;
  programExcluded: LocalizedList;
  country: string;
  city: string | null;
  hotelName: string | null;
  hotelStars: number;
  mealPlan: MealPlan;
  durationDays: number;
  priceUsd: number;
  coverImage: string;
  images: string[];
  isActive: boolean;
  isHot: boolean;
  referralThreshold: number;
  avgRating: number;
  reviewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TourListQuery {
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  hotelStars?: number;
  mealPlan?: MealPlan;
  isHot?: boolean;
  search?: string;
  sort?: "price_asc" | "price_desc" | "popular" | "newest";
  page?: number;
  pageSize?: number;
}

export interface TourCreateInput {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  programIncluded?: LocalizedList;
  programExcluded?: LocalizedList;
  country: string;
  city?: string;
  hotelName?: string;
  hotelStars?: number;
  mealPlan?: MealPlan;
  durationDays?: number;
  priceUsd: number;
  coverImage: string;
  images?: string[];
  isHot?: boolean;
  referralThreshold?: number;
}

export type TourUpdateInput = Partial<TourCreateInput> & { isActive?: boolean };
