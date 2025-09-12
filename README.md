# WeddingShare 🎭💍

A modern, serverless wedding photo sharing platform built with Next.js 14, designed for Vercel deployment. Create beautiful, private photo galleries for your wedding and invite guests to share memories together.

## ✨ Features

### 🏗️ **Multi-tenant Architecture**
- Support multiple weddings with isolated galleries
- Secure access control and privacy
- Scalable cloud infrastructure

### 👥 **Guest Access System**
- Wedding invitation codes for secure access
- Invite links with expiration dates
- Restricted access based on user roles

### 📸 **Media Management**
- Photo and video uploads with drag & drop
- Automatic image optimization and compression
- Approval system for content moderation
- Event-based organization
- Tagging and categorization

### 🔐 **User Roles & Permissions**
- **Guest**: Upload photos, view approved content
- **Admin**: Manage wedding, approve content, manage events
- **Super Admin**: Platform-wide management

### 📝 **Questionnaire System**
- Custom questions for wedding guests
- Multiple question types (text, multiple choice, rating, date)
- Required/optional question support
- Progress tracking

### 📅 **Event Management**
- Create and manage wedding events
- Organize photos by event
- Timeline-based gallery views

### 🔑 **Authentication & Security**
- Google OAuth integration
- JWT-based sessions
- Row-level security with Supabase
- Encrypted file storage

## 🚀 Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL with Row Level Security
- **File Storage**: Cloudinary
- **Authentication**: NextAuth.js with Google OAuth
- **UI Components**: Lucide React icons, React Hook Form
- **Notifications**: React Hot Toast
- **Deployment**: Vercel (optimized)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Cloudinary account
- Google OAuth credentials (optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wedding-share-vercel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.local.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key-here
   
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   
   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql`
   - Configure Row Level Security policies

5. **Set up Cloudinary**
   - Create a Cloudinary account
   - Get your cloud name, API key, and secret
   - Configure upload presets for optimization

6. **Run the development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

The application uses Supabase with the following key tables:

- **users**: User accounts and roles
- **weddings**: Wedding information and settings
- **wedding_members**: User-wedding relationships
- **media**: Photo/video files and metadata
- **events**: Wedding events for organization
- **questions**: Custom questionnaire questions
- **answers**: Guest responses to questions
- **invite_links**: Wedding invitation links

Run the complete schema from `database/schema.sql` to set up all tables and policies.

## 🔧 Configuration

### Supabase RLS Policies

The application includes Row Level Security policies for:
- Users can only access their own profile
- Wedding members can access wedding content
- Media access based on wedding membership
- Event access based on wedding membership

### Cloudinary Configuration

Configure upload transformations for:
- Image optimization (max 1920x1080)
- Quality optimization (auto:good)
- Folder organization by wedding ID

## 📱 Usage

### Creating a Wedding

1. Sign up/sign in to your account
2. Click "Create Wedding" from the dashboard
3. Fill in wedding details (name, date, location)
4. Get your unique wedding code
5. Share the code with guests

### Joining a Wedding

1. Go to `/join` page
2. Enter the wedding code
3. Sign in with Google or create account
4. Access the wedding gallery

### Uploading Media

1. Navigate to the wedding gallery
2. Click "Share Photos" button
3. Drag & drop files or click to select
4. Add tags and select event (optional)
5. Upload and wait for approval

### Managing Content

- **Admins**: Approve/reject uploaded content
- **Guests**: View approved content only
- **Event organization**: Group photos by wedding events

## 🚀 Deployment

### Vercel Deployment

1. **Connect your repository to Vercel**
   - Push your code to GitHub/GitLab
   - Import project in Vercel dashboard

2. **Configure environment variables**
   - Add all environment variables in Vercel dashboard
   - Ensure production URLs are correct

3. **Deploy**
   - Vercel will automatically deploy on push
   - Configure custom domain if needed

### Environment Variables for Production

```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **JWT Authentication**: Secure session management
- **File Validation**: Type and size restrictions
- **Role-based Access**: Granular permission system
- **Encrypted Storage**: Secure file storage with Cloudinary

## 📊 Performance Optimizations

- **Image Optimization**: Automatic compression and resizing
- **Lazy Loading**: Progressive image loading
- **CDN**: Global content delivery with Cloudinary
- **Serverless**: Scalable Vercel deployment
- **Database Indexing**: Optimized Supabase queries

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Build for production
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

## 🔮 Roadmap

- [ ] Real-time notifications
- [ ] Advanced photo editing
- [ ] Wedding timeline features
- [ ] Guest RSVP system
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] AI-powered photo organization
- [ ] Social sharing integration

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- File storage by [Cloudinary](https://cloudinary.com/)
- Authentication with [NextAuth.js](https://next-auth.js.org/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ for couples to share their special moments**






