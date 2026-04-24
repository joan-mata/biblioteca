export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  photoUrl: string | null;
  summary: string | null;
  personalReview: string | null;
  rating: number | null;
  status: 'WANT_TO_READ' | 'READING' | 'READ';
  purchaseDate: string | null;
  isOwned: boolean;
  ownershipStatus: 'OWNED' | 'WISHLIST' | 'NONE';
  startedAt: string | null;
  finishedAt: string | null;
  readingHours: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type BookStatus = Book['status'];

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
