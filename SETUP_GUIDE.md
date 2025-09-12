# WeddingShare Setup Guide

## 🗄️ Database Setup

### Step 1: Add Application Admin Role
Run this SQL in your Supabase SQL Editor to add the missing role:

```sql
ALTER TYPE user_role ADD VALUE 'application_admin';
```

### Step 2: Create Users Table
Run the complete `supabase_auth_setup.sql` file in your Supabase SQL Editor.

### Step 3: Verify Setup
Check that your enum now has all 4 roles:
```sql
SELECT unnest(enum_range(NULL::user_role));
```
Should return: `guest`, `admin`, `super_admin`, `application_admin`

## 👥 User Roles & Test Accounts

### Application Admin (Platform Owner)
- **Email**: `admin@weddingshare.com`
- **Password**: `admin123`
- **Access**: `/admin/*` pages
- **Capabilities**: Manage plans, approve super admins, platform analytics

### Super Admin (Venues/Studios)
- **Email**: `super@venue.com`
- **Password**: `super123`
- **Access**: Wedding management, media upload
- **Capabilities**: Create weddings, manage wedding admins, upload media

### Wedding Admin (Couples)
- **Email**: `couple@wedding.com`
- **Password**: `couple123`
- **Access**: Single wedding management
- **Capabilities**: Manage media, questionnaires, guest lists

### Guest
- **Access**: Join via wedding codes/links
- **Capabilities**: Upload media (plan-restricted), view gallery

## 🧪 Testing Flow

1. **Test Application Admin**:
   - Login with `admin@weddingshare.com` / `admin123`
   - Visit `/admin` - should work
   - Visit `/admin/approvals` - should work
   - Visit `/admin/plans` - should work

2. **Test Super Admin**:
   - Login with `super@venue.com` / `super123`
   - Visit `/dashboard` - should show wedding management
   - Visit `/admin` - should redirect to login

3. **Test Wedding Admin**:
   - Login with `couple@wedding.com` / `couple123`
   - Visit `/dashboard` - should show single wedding access
   - Visit `/admin` - should redirect to login

## 🔧 Troubleshooting

If you get enum errors:
1. Check existing enum values: `SELECT unnest(enum_range(NULL::user_role));`
2. Add missing values: `ALTER TYPE user_role ADD VALUE 'application_admin';`
3. Re-run the setup SQL

If admin pages don't work:
1. Verify you're logged in with `admin@weddingshare.com`
2. Check browser console for errors
3. Verify the user exists in the `users` table




