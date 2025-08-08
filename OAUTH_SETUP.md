# 🔐 OAuth Provider Setup Guide

## 🚨 IMPORTANT: You need to configure OAuth providers in Supabase Dashboard first!

### **Step 1: Setup Google OAuth in Supabase**

1. **Go to Supabase Dashboard** → **Authentication** → **Providers**
2. **Find Google** and click **Enable**
3. **Add your Google credentials:**
   - **Client ID**: `YOUR_GOOGLE_CLIENT_ID`
   - **Client Secret**: `YOUR_GOOGLE_CLIENT_SECRET`
4. **Set Redirect URL to**: `https://YOUR_SUPABASE_URL.supabase.co/auth/v1/callback`

### **Step 2: Setup GitHub OAuth in Supabase**

1. **Stay in Authentication** → **Providers**
2. **Find GitHub** and click **Enable**
3. **Add your GitHub credentials:**
   - **Client ID**: `YOUR_GITHUB_CLIENT_ID`
   - **Client Secret**: `YOUR_GITHUB_CLIENT_SECRET`
4. **Set Redirect URL to**: `https://YOUR_SUPABASE_URL.supabase.co/auth/v1/callback`

### **Step 3: Update OAuth App Settings (if needed)**

**For Google Cloud Console:**
- **Authorized JavaScript origins**: `http://localhost:3000`, `https://your-domain.com`
- **Authorized redirect URIs**: `https://YOUR_SUPABASE_URL.supabase.co/auth/v1/callback`

**For GitHub App Settings:**
- **Authorization callback URL**: `https://YOUR_SUPABASE_URL.supabase.co/auth/v1/callback`

### **Step 4: Test OAuth**

1. **Go to**: http://localhost:3000/register or http://localhost:3000/login
2. **Click "Continue with Google"** or **"Continue with GitHub"**
3. **You should be redirected** to the OAuth provider
4. **After approval, you'll be redirected back** to your app dashboard

### **🎯 What happens now:**

- ✅ **OAuth buttons are connected** to Supabase auth functions
- ✅ **Loading states** show "Connecting..." when clicked
- ✅ **Error handling** shows toast notifications
- ✅ **Automatic redirect** to dashboard on success
- ✅ **User profile** automatically created via trigger

Once you enable the providers in Supabase Dashboard, the OAuth buttons will work perfectly! 🚀
