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
  status: 'READ' | 'TO_READ' | 'ON_SHELF';
  userId: string;
}

export type BookStatus = Book['status'];

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
