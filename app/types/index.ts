export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: 'guest' | 'admin' | 'super_admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Wedding {
  id: string;
  name: string;
  code: string;
  description?: string;
  date: Date;
  location?: string;
  coverImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WeddingMember {
  id: string;
  weddingId: string;
  userId: string;
  role: 'guest' | 'admin';
  invitedAt: Date;
  joinedAt?: Date;
  isActive: boolean;
}

export interface Media {
  id: string;
  weddingId: string;
  uploadedBy: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  mimeType: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  eventId?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  weddingId: string;
  name: string;
  description?: string;
  date: Date;
  location?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  weddingId: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'date';
  options?: string[];
  isRequired: boolean;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  weddingId: string;
  value: string;
  createdAt: Date;
}

export interface InviteLink {
  id: string;
  weddingId: string;
  code: string;
  maxUses?: number;
  currentUses: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  weddingId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface SearchFilters {
  query?: string;
  type?: 'image' | 'video';
  eventId?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  isApproved?: boolean;
}

export interface WeddingStats {
  totalPhotos: number;
  totalVideos: number;
  totalGuests: number;
  totalEvents: number;
  recentUploads: Media[];
  popularTags: { tag: string; count: number }[];
}

