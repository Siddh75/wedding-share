# 🚀 WeddingShare Deployment Guide

This guide will walk you through deploying WeddingShare to Vercel with all the necessary configurations.

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] A GitHub/GitLab account
- [ ] A Vercel account
- [ ] A Supabase project set up
- [ ] A Cloudinary account
- [ ] Google OAuth credentials (optional)

## 🔧 Step 1: Prepare Your Repository

1. **Push your code to GitHub/GitLab**
```bash
   git add .
   git commit -m "Initial commit for WeddingShare"
   git push origin main
   ```

2. **Ensure all environment variables are documented**
   - Check `.env.local.example` is up to date
   - Verify all required variables are listed

## 🌐 Step 2: Set Up Supabase

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization and region
   - Wait for the project to be ready

2. **Run the database schema**
   - Go to SQL Editor in your Supabase dashboard
   - Copy the contents of `database/schema.sql`
   - Paste and run the SQL commands
   - Verify all tables are created

3. **Get your Supabase credentials**
   - Go to Settings > API
   - Copy your Project URL and anon key
   - Copy your service_role key (keep this secret!)

## ☁️ Step 3: Set Up Cloudinary

1. **Create a Cloudinary account**
   - Go to [cloudinary.com](https://cloudinary.com)
   - Sign up for a free account

2. **Get your credentials**
   - Go to Dashboard
   - Copy your Cloud Name, API Key, and API Secret

3. **Configure upload presets (optional)**
   - Go to Settings > Upload
   - Create upload presets for image optimization

## 🔑 Step 4: Set Up Google OAuth (Optional)

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project or select existing

2. **Enable Google+ API**
   - Go to APIs & Services > Library
   - Search for "Google+ API" and enable it

3. **Create OAuth credentials**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.vercel.app/api/auth/callback/google` (production)

## 🚀 Step 5: Deploy to Vercel

1. **Connect your repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub/GitLab repository
   - Select the repository

2. **Configure project settings**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `.next` (should auto-detect)
   - **Install Command**: `npm install` (should auto-detect)

3. **Set environment variables**
   Add these in the Vercel dashboard:

   ```env
   # NextAuth Configuration
   NEXTAUTH_URL=https://yourdomain.vercel.app
   NEXTAUTH_SECRET=your-super-secret-key-here
   
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   
   # Google OAuth (if using)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be available at `https://yourproject.vercel.app`

## 🔒 Step 6: Security Configuration

1. **Update Google OAuth redirect URIs**
   - Go back to Google Cloud Console
   - Update the production redirect URI with your Vercel domain

2. **Verify Supabase RLS policies**
   - Check that Row Level Security is enabled
   - Verify all policies are working correctly

3. **Test authentication flow**
   - Try signing up/signing in
   - Verify Google OAuth works in production

## 🌍 Step 7: Custom Domain (Optional)

1. **Add custom domain in Vercel**
   - Go to your project settings
   - Click "Domains"
   - Add your custom domain

2. **Update environment variables**
   - Change `NEXTAUTH_URL` to your custom domain
   - Update Google OAuth redirect URIs

3. **Configure DNS**
   - Add the required DNS records as shown in Vercel
   - Wait for DNS propagation

## 📱 Step 8: Testing Your Deployment

1. **Test core functionality**
   - [ ] Home page loads correctly
   - [ ] Authentication works (sign up/sign in)
   - [ ] Wedding creation works
   - [ ] Photo uploads work
   - [ ] Guest access works

2. **Test on different devices**
   - [ ] Desktop browsers
   - [ ] Mobile devices
   - [ ] Different screen sizes

3. **Performance testing**
   - [ ] Page load times
   - [ ] Image optimization
   - [ ] API response times

## 🚨 Troubleshooting

### Common Issues

1. **Build fails**
   - Check Node.js version (should be 18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Environment variables not working**
   - Ensure variables are set in Vercel dashboard
   - Check variable names match exactly
   - Redeploy after adding variables

3. **Authentication issues**
   - Verify OAuth redirect URIs are correct
   - Check NEXTAUTH_URL matches your domain
   - Ensure NEXTAUTH_SECRET is set

4. **Database connection issues**
   - Verify Supabase credentials
   - Check if database is accessible
   - Verify RLS policies are correct

### Getting Help

- Check the [README.md](README.md) for detailed setup instructions
- Review Vercel deployment logs for specific errors
- Check Supabase logs for database issues
- Open GitHub issues for bugs or questions

## 🔄 Step 9: Continuous Deployment

1. **Automatic deployments**
   - Vercel automatically deploys on push to main branch
   - Each commit triggers a new deployment

2. **Preview deployments**
   - Pull requests get preview deployments
   - Test changes before merging

3. **Rollback if needed**
   - Go to Deployments in Vercel
   - Click the three dots on any deployment
   - Select "Promote to Production"

## 📊 Monitoring

1. **Vercel Analytics**
   - Enable in project settings
   - Monitor performance and usage

2. **Supabase Monitoring**
   - Check database performance
   - Monitor API usage

3. **Error tracking**
   - Set up error monitoring (e.g., Sentry)
   - Monitor for production issues

## 🎉 Congratulations!

Your WeddingShare application is now deployed and ready to use! 

- **Production URL**: `https://yourdomain.vercel.app`
- **Dashboard**: Access via Vercel dashboard
- **Updates**: Push to main branch for automatic deployment

## 🔮 Next Steps

- Set up monitoring and analytics
- Configure backup strategies
- Plan for scaling as you grow
- Consider setting up staging environments
- Implement CI/CD pipelines if needed

---

**Need help? Check the main [README.md](README.md) or open an issue on GitHub!**
