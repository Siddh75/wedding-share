# WeddingShare Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [Environment Variables](#environment-variables)
5. [Authentication System](#authentication-system)
6. [User Roles & Permissions](#user-roles--permissions)
7. [API Routes](#api-routes)
8. [Database Schema](#database-schema)
9. [Email System](#email-system)
10. [File Upload System](#file-upload-system)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

WeddingShare is a comprehensive wedding management platform that allows users to:
- Create and manage wedding galleries
- Upload and organize wedding photos/videos
- Manage guest lists and invitations
- Handle wedding events and timelines
- Provide guest questionnaires and RSVPs

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Custom cookie-based authentication
- **File Storage**: Cloudinary
- **Email Service**: Resend
- **Deployment**: Vercel

---

## Architecture

### Directory Structure
```
wedding-share-vercel/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── weddings/          # Wedding management
│   │   ├── media/             # File upload/management
│   │   ├── guests/            # Guest management
│   │   └── test/              # Diagnostic endpoints
│   ├── components/            # Reusable React components
│   ├── lib/                   # Utility functions
│   ├── auth/                  # Authentication pages
│   ├── admin/                 # Application admin pages
│   ├── superadmin/            # Super admin pages
│   └── weddings/              # Wedding-specific pages
├── database/                  # SQL scripts
└── docs/                      # Documentation
```

### Key Components
- **AuthProvider**: Custom authentication context
- **Header**: Navigation component with role-based menus
- **MediaUpload**: Drag-and-drop file upload
- **MediaGallery**: Photo/video display grid
- **GuestManagement**: Guest list management
- **CreateWeddingForm**: Wedding creation form

---

## Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Cloudinary account
- Resend account (for emails)

### Installation Steps

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd wedding-share-vercel
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Copy example environment file
   cp "env.local copy.example" .env.local
   
   # Edit .env.local with your credentials
   nano .env.local
   ```

3. **Database Setup**
   ```bash
   # Run the complete database setup script in Supabase SQL editor
   # File: complete_database_setup.sql
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## Environment Variables

### Required Variables

```bash
# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Resend Configuration
RESEND_API_KEY=your-resend-api-key-here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_DEV_EMAIL=your-test-email@example.com  # For development only

# NextAuth Configuration (legacy)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here
```

### Development Email Setup
- Set `RESEND_DEV_EMAIL` to your test email address
- All emails will be sent to this address during development
- User accounts are still created with original email addresses
- Email content shows intended recipient information

---

## Authentication System

### Overview
Custom cookie-based authentication system replacing NextAuth.js due to Next.js 14 compatibility issues.

### Components
- **AuthProvider**: React context for authentication state
- **Session Management**: Cookie-based session tokens
- **Login/Logout**: Custom API endpoints

### Authentication Flow
1. User submits login credentials
2. Server validates against Supabase
3. Session token created and stored in cookie
4. User state managed via React context
5. Protected routes check session validity

### API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration (with wedding invitation support)
- `GET /api/auth/session` - Check current session
- `POST /api/auth/logout` - User logout

---

## User Roles & Permissions

### Role Hierarchy
1. **application_admin** (Platform Owner)
   - Manage subscription plans
   - Approve super admin applications
   - Platform-wide analytics

2. **super_admin** (Venue/Service Provider)
   - Create and manage multiple weddings
   - Assign wedding admins
   - Access to all weddings they create

3. **admin** (Wedding Admin)
   - Manage specific wedding details
   - Upload media
   - Manage guest lists
   - Access to assigned wedding only

4. **guest** (Wedding Guest)
   - View wedding gallery
   - Submit RSVPs
   - Answer questionnaires

### Role-Based Access Control
- Navigation menus filtered by role
- API endpoints protected by role checks
- UI components conditionally rendered
- Database queries filtered by user permissions

---

## API Routes

### Authentication
```typescript
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/session
```

### Wedding Management
```typescript
GET    /api/weddings           # List weddings (role-based)
POST   /api/weddings           # Create wedding (super_admin only)
GET    /api/weddings/[id]      # Get wedding details
PUT    /api/weddings/[id]      # Update wedding
DELETE /api/weddings/[id]      # Delete wedding
```

### Media Management
```typescript
POST   /api/media/upload       # Upload media files
GET    /api/media              # List media (wedding-specific)
DELETE /api/media/[id]         # Delete media item
```

### Guest Management
```typescript
GET    /api/guests             # List guests
POST   /api/guests             # Add guest
PUT    /api/guests/[id]        # Update guest
DELETE /api/guests/[id]        # Remove guest
```

### Diagnostic Endpoints
```typescript
GET /api/test/env              # Check environment variables
GET /api/test/auth             # Test authentication
GET /api/test/weddings          # Test wedding operations
POST /api/test/email           # Test email sending
```

---

## Database Schema

### Core Tables

#### users
```sql
- id (UUID, Primary Key)
- email (String, Unique)
- name (String)
- role (Enum: guest, admin, super_admin, application_admin)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### weddings
```sql
- id (UUID, Primary Key)
- name (String)
- date (Date)
- location (String)
- description (Text)
- code (String, Unique)
- super_admin_id (UUID, Foreign Key)
- wedding_admin_ids (UUID Array)
- subscription_plan_id (UUID, Foreign Key)
- status (Enum: draft, active, completed)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### media
```sql
- id (UUID, Primary Key)
- wedding_id (UUID, Foreign Key)
- file_name (String)
- file_type (String)
- file_size (Integer)
- cloudinary_public_id (String)
- cloudinary_url (String)
- description (Text)
- uploaded_by (UUID, Foreign Key)
- status (Enum: pending, approved, rejected)
- created_at (Timestamp)
```

#### guests
```sql
- id (UUID, Primary Key)
- wedding_id (UUID, Foreign Key)
- name (String)
- email (String)
- phone (String)
- plus_one_name (String)
- rsvp_status (Enum: pending, attending, declined)
- dietary_restrictions (Text)
- created_at (Timestamp)
```

#### wedding_invitations
```sql
- id (UUID, Primary Key)
- wedding_id (UUID, Foreign Key)
- email (String)
- role (String)
- status (Enum: pending, accepted, expired)
- created_at (Timestamp)
- expires_at (Timestamp)
- accepted_at (Timestamp)
- accepted_by (UUID, Foreign Key)
```

### Relationships
- **users** → **weddings** (super_admin_id)
- **users** → **weddings** (wedding_admin_ids array)
- **weddings** → **media** (wedding_id)
- **weddings** → **guests** (wedding_id)
- **users** → **media** (uploaded_by)
- **weddings** → **wedding_invitations** (wedding_id)
- **users** → **wedding_invitations** (accepted_by)

---

## Email System

### Overview
Resend-based email system with development mode support.

### Features
- **Wedding Invitations**: Sent to wedding admins
- **Welcome Emails**: Sent to new users
- **Development Mode**: All emails sent to single test address
- **HTML Templates**: Professional email designs

### Invitation Flow
1. **Super Admin creates wedding** with admin email
2. **Invitation stored** in `wedding_invitations` table (no user created yet)
3. **Invitation email sent** with signup link containing wedding details and email
4. **User clicks signup link** - email field is prefilled and locked
5. **System verifies invitation** - checks if invitation exists, is pending, and not expired
6. **User completes signup** - user created with proper role, linked to wedding, invitation marked as accepted
7. **User redirected** to wedding management page

### Security Features
- **No premature user creation** - users only created when they actually signup
- **Invitation verification** - validates invitation exists, is pending, and not expired
- **Time-limited invitations** - invitations expire after 7 days
- **Role enforcement** - users get the role specified in the invitation
- **Audit trail** - tracks when invitations were accepted and by whom

### Email Templates
- **Wedding Invitation**: Includes wedding details and login link
- **Welcome Email**: Account creation confirmation

### Development Setup
```bash
# Set in .env.local
RESEND_DEV_EMAIL=your-test-email@example.com
```

### Production Setup
```bash
# Remove RESEND_DEV_EMAIL for production
# Emails will be sent to actual recipients
```

---

## File Upload System

### Overview
Cloudinary integration for media file storage and management.

### Supported Formats
- **Images**: JPEG, PNG, GIF, WebP
- **Videos**: MP4, MOV, AVI
- **File Size**: Up to 100MB per file

### Upload Process
1. File selected via drag-and-drop interface
2. File uploaded to Cloudinary
3. Metadata stored in Supabase
4. Gallery updated in real-time

### Security
- File type validation
- Size limits enforced
- User authentication required
- Wedding-specific access control

---

## Deployment

### Vercel Deployment
1. **Connect Repository**: Link GitHub repository to Vercel
2. **Environment Variables**: Add all required environment variables
3. **Build Settings**: Next.js framework automatically detected
4. **Deploy**: Automatic deployment on push to main branch

### Environment Variables for Production
```bash
# Remove development-specific variables
# RESEND_DEV_EMAIL should not be set in production
```

### Database Migration
- Run `complete_database_setup.sql` in Supabase production instance
- Ensure all tables and relationships are created

---

## Troubleshooting

### Common Issues

#### Authentication Issues
- **Session not persisting**: Check cookie settings and domain
- **Login redirects**: Verify NEXTAUTH_URL environment variable
- **Role not loading**: Check database user role assignment

#### File Upload Issues
- **Upload fails**: Verify Cloudinary credentials and file size limits
- **Images not displaying**: Check Cloudinary URL format and permissions
- **Unauthorized errors**: Ensure user is authenticated and has wedding access

#### Email Issues
- **Emails not sending**: Check Resend API key and from email
- **Development emails**: Verify RESEND_DEV_EMAIL is set correctly
- **Template errors**: Check HTML template syntax

#### Database Issues
- **Connection errors**: Verify Supabase URL and API keys
- **Missing tables**: Run database setup scripts
- **Permission errors**: Check user role assignments

### Debug Endpoints
- `/api/test/env` - Check environment variables
- `/api/test/auth` - Test authentication status
- `/api/test/weddings` - Test wedding operations
- `/api/test/email` - Test email functionality

### Logs
- **Server logs**: Check Vercel function logs
- **Client logs**: Browser console for frontend issues
- **Database logs**: Supabase dashboard for query issues

---

## Recent Updates

### Latest Features Added
- ✅ **Email System**: Resend integration with development mode
- ✅ **Signup System**: Invitation-based signup with automatic wedding admin assignment
- ✅ **Input Field Styling**: Consistent styling across all forms
- ✅ **Wedding Management**: Dedicated edit page for wedding details
- ✅ **Navigation Updates**: Removed Gallery/Guests from top nav
- ✅ **Wedding Gallery**: Dynamic wedding name display
- ✅ **Admin Invitations**: Email-based wedding admin invitations with signup links
- ✅ **Prefilled Email**: Email field automatically prefilled and locked in invitation signup
- ✅ **Secure Invitation System**: No premature user creation, invitation verification, time-limited invitations

### Known Issues
- None currently documented

### Planned Features
- Guest RSVP system
- Event timeline management
- Questionnaire system
- Advanced media organization
- Guest photo uploads

---

*Last Updated: [Current Date]*
*Version: 1.0.0*
