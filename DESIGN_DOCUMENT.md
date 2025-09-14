# WeddingShare - Design Document

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Application Overview](#application-overview)
3. [System Architecture](#system-architecture)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Database Design](#database-design)
6. [API Design](#api-design)
7. [Authentication & Security](#authentication--security)
8. [Frontend Architecture](#frontend-architecture)
9. [Media Management System](#media-management-system)
10. [Deployment & Infrastructure](#deployment--infrastructure)
11. [Performance Considerations](#performance-considerations)
12. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**WeddingShare** is a modern, serverless wedding photo sharing platform built with Next.js 14, designed for Vercel deployment. The application enables couples, wedding venues, and photography studios to create private, secure photo galleries for wedding events, allowing guests to contribute and view memories in a controlled, organized environment.

### Key Value Propositions
- **Multi-tenant Architecture**: Support multiple weddings with isolated galleries
- **Role-based Access Control**: Granular permissions for different user types
- **Content Moderation**: Built-in approval system for uploaded media
- **Event Organization**: Timeline-based photo organization by wedding events
- **Guest Collaboration**: Secure invitation system for guest participation
- **Cloud-native**: Serverless architecture with automatic scaling

---

## Application Overview

### Core Features

#### 1. **Multi-tenant Wedding Management**
- Create and manage multiple wedding galleries
- Isolated data and access control per wedding
- Wedding-specific settings and configurations

#### 2. **Media Upload & Management**
- Drag-and-drop photo/video uploads
- Automatic image optimization and compression
- Cloudinary integration for CDN delivery
- Approval workflow for content moderation

#### 3. **Guest Access System**
- Wedding invitation codes for secure access
- Time-limited invitation links
- Role-based permissions for different user types

#### 4. **Event Organization**
- Create and manage wedding events (ceremony, reception, etc.)
- Organize photos by event timeline
- Event-based filtering and browsing

#### 5. **Questionnaire System**
- Custom questions for wedding guests
- Multiple question types (text, multiple choice, rating, date)
- Progress tracking and response management

#### 6. **Admin Dashboard**
- Wedding management interface
- Content approval workflows
- Guest management tools
- Analytics and reporting

#### 7. **Subdomain Management**
- Custom subdomains for each wedding (e.g., `sarah-michael.weddingshare.com`)
- Automatic subdomain generation from wedding names
- Subdomain validation and uniqueness checks
- Easy sharing with memorable URLs

### Target Users

1. **Application Admins**: Platform owners managing the entire system
2. **Super Admins**: Venues, photography studios, event planners managing multiple weddings
3. **Wedding Admins**: Couples managing their specific wedding
4. **Guests**: Wedding attendees contributing and viewing photos


---

## System Architecture

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React icons, React Hook Form
- **State Management**: React Context (AuthProvider)
- **Notifications**: React Hot Toast

#### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom cookie-based sessions
- **File Storage**: Cloudinary
- **Email Service**: Resend

#### Infrastructure
- **Deployment**: Vercel
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **CDN**: Cloudinary
- **Monitoring**: Built-in Vercel analytics

### Architecture Diagram

`
+-----------------+    +-----------------+    +-----------------+
�   Frontend      �    �   Next.js API   �    �   Supabase      �
�   (Next.js 14)  �?--?�   Routes        �?--?�   (PostgreSQL)  �
+-----------------+    +-----------------+    +-----------------+
         �                       �
         �                       �
         ?                       ?
+-----------------+    +-----------------+
�   Cloudinary    �    �   Resend        �
�   (File Storage)�    �   (Email)       �
+-----------------+    +-----------------+
`

### Key Architectural Decisions

1. **Serverless Architecture**: Leverages Vercel's serverless functions for automatic scaling
2. **Row Level Security**: Database-level access control using Supabase RLS
3. **Cookie-based Authentication**: Custom session management for better control
4. **CDN Integration**: Cloudinary for optimized media delivery
5. **Type Safety**: Full TypeScript implementation across frontend and backend

---

## User Roles & Permissions

### Role Hierarchy

#### 1. **Application Admin** (application_admin)
**Platform Owner**
- Manage subscription plans and pricing
- Approve super admin applications
- Access platform-wide analytics
- Manage system-wide settings

**Access Level**: Global platform access
**Key Capabilities**:
- View all weddings and users
- Manage subscription plans
- Approve/reject super admin applications
- Access admin dashboard (/admin/*)

#### 2. **Super Admin** (super_admin)
**Venues, Photography Studios, Event Planners**
- Create and manage multiple weddings
- Assign wedding admins
- Upload and manage media
- Access all weddings they create

**Access Level**: Multi-wedding management
**Key Capabilities**:
- Create new weddings
- Assign wedding admins
- Upload media to any of their weddings
- Manage wedding settings and events
- Access wedding management dashboard

#### 3. **Wedding Admin** (admin)
**Couples, Wedding Coordinators**
- Manage specific wedding details
- Upload and approve media
- Manage guest lists and invitations
- Create and manage events
- Access assigned wedding only

**Access Level**: Single wedding management
**Key Capabilities**:
- Manage wedding details and settings
- Upload and approve/reject media
- Manage guest invitations
- Create and manage wedding events
- Access wedding-specific dashboard

#### 4. **Guest** (guest)
**Wedding Attendees**
- View approved wedding gallery
- Upload photos (with approval workflow)
- Answer wedding questionnaires
- Access via invitation codes

**Access Level**: Wedding-specific, read-mostly
**Key Capabilities**:
- Join weddings via invitation codes
- Upload photos and videos
- View approved media gallery
- Answer wedding questionnaires
- Limited to specific wedding access

### Permission Matrix

| Action | Application Admin | Super Admin | Wedding Admin | Guest |
|--------|------------------|-------------|---------------|-------|
| Create Wedding | ? | ? | ? | ? |
| Manage Wedding Settings | ? | ? (own) | ? (assigned) | ? |
| Upload Media | ? | ? (own weddings) | ? (assigned) | ? (with approval) |
| Approve Media | ? | ? (own weddings) | ? (assigned) | ? |
| Manage Guests | ? | ? (own weddings) | ? (assigned) | ? |
| View All Weddings | ? | ? | ? | ? |
| Manage Subscription Plans | ? | ? | ? | ? |
| Approve Super Admin Apps | ? | ? | ? | ? |


---

## Database Design

### Core Tables

#### 1. **Users Table**
`sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  role user_role DEFAULT 'guest',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`

#### 2. **Weddings Table**
`sql
CREATE TABLE weddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE,
  description TEXT,
  date DATE NOT NULL,
  location TEXT,
  cover_image TEXT,
  super_admin_id UUID NOT NULL REFERENCES users(id),
  wedding_admin_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  subscription_plan_id UUID REFERENCES subscription_plans(id),
  features JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`

#### 3. **Media Table**
`sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id),
  uploaded_by UUID REFERENCES users(id),
  type media_type NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  filename TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  event_id UUID REFERENCES events(id),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`

### Database Relationships

`
users (1) --? (many) weddings (super_admin_id)
users (1) --? (many) weddings (wedding_admin_ids[])
weddings (1) --? (many) wedding_invitations
weddings (1) --? (many) media
weddings (1) --? (many) events
weddings (1) --? (many) questions
users (1) --? (many) media (uploaded_by)
users (1) --? (many) answers
questions (1) --? (many) answers
events (1) --? (many) media (event_id)
`

### Row Level Security (RLS)

The application implements comprehensive RLS policies to ensure data isolation:

- **Users**: Can only access their own profile
- **Weddings**: Access based on membership in wedding_members table
- **Media**: Access based on wedding membership and approval status
- **Events**: Access based on wedding membership
- **Questions/Answers**: Access based on wedding membership


---

## API Design

### Authentication Endpoints

#### POST /api/auth/login
**Purpose**: User authentication
**Request Body**: JSON with email and password
**Response**: JSON with success status and user data

#### POST /api/auth/signup
**Purpose**: User registration with wedding invitation support
**Request Body**: JSON with user details and wedding code
**Response**: JSON with success status and user data

### Wedding Management Endpoints

#### GET /api/weddings
**Purpose**: List weddings based on user role
**Query Parameters**:
- role: Filter by user role
- status: Filter by wedding status

#### POST /api/weddings
**Purpose**: Create new wedding (super_admin only)
**Request Body**: JSON with wedding details and admin emails

### Media Management Endpoints

#### POST /api/media/upload
**Purpose**: Upload media files
**Request**: Multipart form data
**Fields**:
- file: Media file
- weddingId: Target wedding ID
- description: File description
- eventId: Optional event ID
- tags: Optional tags array

#### GET /api/media/upload
**Purpose**: List media for wedding
**Query Parameters**:
- weddingId: Wedding ID
- status: Filter by approval status
- eventId: Filter by event
- type: Filter by media type

---

## Authentication and Security

### Authentication Flow

1. **User Login**: Submit credentials via /api/auth/login
2. **Session Creation**: Server validates credentials and creates session token
3. **Cookie Storage**: Session token stored in HTTP-only cookie
4. **Session Validation**: Each API request validates session token
5. **User Context**: Frontend maintains user state via AuthProvider

### Security Features

#### 1. **Row Level Security (RLS)**
- Database-level access control
- Prevents unauthorized data access
- Policy-based permissions per table

#### 2. **Session Management**
- HTTP-only cookies prevent XSS attacks
- Secure session tokens with expiration
- Automatic session validation

#### 3. **File Upload Security**
- File type validation
- Size limits and restrictions
- Cloudinary integration for secure storage

#### 4. **API Security**
- Role-based endpoint protection
- Request validation and sanitization
- CORS configuration

---

## Frontend Architecture

### Component Structure

`
app/
+-- components/
�   +-- AuthProvider.tsx          # Authentication context
�   +-- CreateWeddingForm.tsx     # Wedding creation form
�   +-- GuestManagement.tsx       # Guest management interface
�   +-- Header.tsx               # Navigation header
�   +-- Hero.tsx                 # Landing page hero
�   +-- MediaGallery.tsx         # Photo/video gallery
�   +-- MediaUpload.tsx          # File upload component
+-- auth/                        # Authentication pages
+-- admin/                       # Admin dashboard pages
+-- weddings/                    # Wedding management pages
+-- api/                         # API routes
`

### State Management

#### AuthProvider Context
`	ypescript
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (data: SignupData) => Promise<void>
}
`

### Routing Structure

- / - Landing page
- /auth/signin - User login
- /auth/signup - User registration
- /dashboard - User dashboard (role-based)
- /admin/* - Application admin pages
- /weddings/[id] - Wedding gallery
- /weddings/[id]/manage - Wedding management
- /weddings/[id]/subdomain - Subdomain management
- /subdomain/[subdomain] - Subdomain-specific wedding pages
- /join - Join wedding via code

---

## Media Management System

### Upload Flow

1. **File Selection**: Drag-and-drop or click to select files
2. **Validation**: Check file type, size, and format
3. **Upload to Cloudinary**: Direct upload with optimization
4. **Database Record**: Create media record in database
5. **Approval Workflow**: Pending approval for non-admin users

### Cloudinary Integration

#### Upload Configuration
`javascript
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  upload_preset: 'wedding_photos'
}
`

#### Image Optimization
- **Max Resolution**: 1920x1080
- **Quality**: Auto-optimized
- **Format**: WebP with fallback
- **Folder Organization**: By wedding ID

### Media Approval Workflow

1. **Upload**: Guest uploads photo/video
2. **Pending Status**: Media marked as pending approval
3. **Admin Review**: Wedding admin reviews uploaded content
4. **Approval/Rejection**: Admin approves or rejects media
5. **Gallery Update**: Approved media appears in public gallery


---

## Deployment and Infrastructure

### Vercel Deployment

#### Environment Variables
`env
# NextAuth Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
`

#### Deployment Steps
1. **Repository Setup**: Connect GitHub repository to Vercel
2. **Environment Configuration**: Set all required environment variables
3. **Database Setup**: Configure Supabase with RLS policies
4. **Cloudinary Setup**: Configure upload presets and transformations
5. **Deploy**: Automatic deployment on git push

---

## Performance Considerations

### Frontend Optimizations

1. **Image Optimization**: Next.js automatic image optimization
2. **Lazy Loading**: Progressive image loading in galleries
3. **Code Splitting**: Route-based code splitting
4. **CDN**: Cloudinary CDN for media delivery

### Backend Optimizations

1. **Database Indexing**: Optimized queries with proper indexes
2. **Connection Pooling**: Supabase connection management
3. **Caching**: API response caching where appropriate
4. **File Compression**: Automatic image/video compression

### Scalability Features

1. **Serverless Architecture**: Automatic scaling with Vercel
2. **Database Scaling**: Supabase automatic scaling
3. **CDN Distribution**: Global content delivery
4. **Rate Limiting**: API rate limiting for abuse prevention

---

## Future Enhancements

### Planned Features

#### 1. **Real-time Features**
- Live photo uploads with WebSocket
- Real-time notifications
- Live collaboration features

#### 2. **Advanced Media Features**
- AI-powered photo organization
- Automatic face recognition and tagging
- Photo editing tools
- Video trimming and editing

#### 3. **Enhanced Guest Experience**
- Mobile app (React Native)
- Offline photo viewing
- Social sharing integration
- Guest photo contests

#### 4. **Analytics and Reporting**
- Wedding analytics dashboard
- Guest engagement metrics
- Photo popularity tracking
- Export capabilities

#### 5. **Business Features**
- Subscription management
- Payment processing
- White-label solutions
- API for third-party integrations

### Technical Improvements

1. **Performance**: Advanced caching strategies
2. **Security**: Enhanced security measures
3. **Monitoring**: Comprehensive logging and monitoring
4. **Testing**: Automated testing suite
5. **Documentation**: API documentation with OpenAPI

---

## Conclusion

WeddingShare represents a modern, scalable solution for wedding photo sharing with a focus on security, user experience, and multi-tenant architecture. The application leverages cutting-edge technologies to provide a robust platform that can scale from small intimate weddings to large commercial operations.

The design emphasizes:
- **Security**: Comprehensive access control and data protection
- **Scalability**: Serverless architecture with automatic scaling
- **User Experience**: Intuitive interfaces for all user types
- **Flexibility**: Multi-tenant architecture supporting various use cases
- **Performance**: Optimized for fast loading and smooth interactions

This design document serves as the foundation for development, deployment, and future enhancements of the WeddingShare platform.
