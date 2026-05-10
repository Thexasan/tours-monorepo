import type { LocalizedText } from "./common";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReviewAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface Review {
  id: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  author: ReviewAuthor;
  tourId: string;
  tourTitle: LocalizedText;
  bookingId: string | null;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCreateInput {
  tourId: string;
  bookingId?: string;
  rating: number;
  text: string;
  photoUrls?: string[];
}
