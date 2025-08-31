# 🚀 Deploy to Vercel - Simple Guide

## Step 1: Push to GitHub

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/wedding-share.git

# Push
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. **Important**: Leave Root Directory empty (or set to `/`)
6. Click "Deploy"

## Step 3: Set Environment Variables

After deployment, go to:
- Settings → Environment Variables
- Add the variables from `env.local.example`

## Step 4: Test

Your app will be live at: `https://your-project.vercel.app`

---

**That's it! Your WeddingShare app is now live on Vercel! 🎉**
