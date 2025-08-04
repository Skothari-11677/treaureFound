# 🚀 Netlify Deployment Guide - Treasure in the Shell

## 📋 **Prerequisites**

1. ✅ GitHub account
2. ✅ Netlify account (free tier works)
3. ✅ Supabase database set up and running
4. ✅ Your code pushed to a GitHub repository

---

## **Step 1: Prepare Your Repository**

### 1.1 Install Netlify Functions Dependency
```bash
npm install @netlify/functions
```

### 1.2 Build Your Application Locally (Test)
```bash
npm run build
```
Make sure this completes without errors.

### 1.3 Push to GitHub
```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

---

## **Step 2: Deploy to Netlify**

### 2.1 Connect Repository
1. Go to [netlify.app](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub
5. Select your repository: `treasure-in-the-shell`

### 2.2 Configure Build Settings
Netlify should auto-detect your settings, but verify:

- **Branch to deploy**: `main`
- **Build command**: `npm run build`
- **Publish directory**: `dist/spa`
- **Functions directory**: `netlify/functions`

### 2.3 Deploy
1. Click **"Deploy site"**
2. Wait 2-3 minutes for the build to complete
3. Your site will get a random URL like: `https://amazing-cupcake-123456.netlify.app`

---

## **Step 3: Configure Custom Domain (Optional)**

### 3.1 Set Site Name
1. Go to **Site settings** → **General** → **Site details**
2. Click **"Change site name"**
3. Enter: `treasure-in-the-shell-[your-name]`
4. Your URL becomes: `https://treasure-in-the-shell-[your-name].netlify.app`

### 3.2 Custom Domain (If You Have One)
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain and follow DNS setup instructions

---

## **Step 4: Test Your Deployment**

### 4.1 Test Main Features
1. **Submission Form**: Visit your site URL
2. **Admin Panel**: Visit `your-site-url/admin`
3. **Test Page**: Visit `your-site-url/test`

### 4.2 Test API Functions
1. Submit a test entry from the form
2. Check if it appears in admin panel
3. Verify database connection in test page

### 4.3 Test Real-time Updates
1. Open admin panel in one browser tab
2. Submit entry from another tab
3. Should see update within 3 seconds

---

## **Step 5: Troubleshooting Common Issues**

### 🔴 **Build Fails**
**Error**: `npm run build` fails
**Solution**: 
1. Check your local build: `npm run build`
2. Fix any TypeScript errors
3. Push fixes and redeploy

### 🔴 **API Functions Don't Work**
**Error**: 404 on `/api/submissions`
**Solution**:
1. Check **Functions** tab in Netlify dashboard
2. Verify `netlify/functions/submissions.ts` exists
3. Check function logs for errors

### 🔴 **Database Connection Fails**
**Error**: Supabase connection issues
**Solution**:
1. Verify Supabase credentials in function
2. Check CORS settings in Supabase
3. Test database connection from test page

### 🔴 **Routing Issues**
**Error**: 404 on `/admin` or `/test`
**Solution**:
1. Verify `netlify.toml` has correct redirects
2. Check that `dist/spa` contains `index.html`

---

## **Step 6: Production Optimization**

### 6.1 Environment Variables (If Needed)
1. Go to **Site settings** → **Environment variables**
2. Add any sensitive configuration
3. Update your code to use `process.env.VARIABLE_NAME`

### 6.2 Performance Monitoring
1. Check **Site overview** for deploy times
2. Monitor **Functions** tab for API performance
3. Use **Analytics** for traffic insights

### 6.3 Custom Headers (Already Configured)
Your `netlify.toml` includes:
- CORS headers for API routes
- SPA routing support
- Function configuration

---

## **Step 7: Event Day Setup**

### 7.1 Pre-Event Checklist
- [ ] Site is live and accessible
- [ ] Admin panel loads correctly
- [ ] Test submissions work
- [ ] Polling updates every 3 seconds
- [ ] All 60 teams (101-160) in dropdown
- [ ] Password validation works for all levels

### 7.2 During Event
1. **Monitor**: Keep admin panel open
2. **Backup URL**: Save admin panel URL for quick access
3. **Mobile**: Test on mobile devices for participants
4. **Refresh**: Use manual refresh if needed

### 7.3 Emergency Actions
If site goes down:
1. Check **Deploys** tab for recent changes
2. **Rollback** to previous working deploy
3. Check **Functions** logs for errors
4. Contact Netlify support if needed

---

## **📱 URLs for Your Event**

After deployment, you'll have:

- **Main Site**: `https://your-site-name.netlify.app`
- **Submission Form**: `https://your-site-name.netlify.app/`
- **Admin Panel**: `https://your-site-name.netlify.app/admin`
- **Test Page**: `https://your-site-name.netlify.app/test`

---

## **🎯 Final Deployment Commands**

```bash
# 1. Install dependencies
npm install @netlify/functions

# 2. Test build locally
npm run build

# 3. Push to GitHub
git add .
git commit -m "Ready for Netlify deployment"
git push origin main

# 4. Deploy on Netlify (through web interface)
# 5. Test your live site!
```

---

## **🆘 Emergency Contact**

If you encounter issues during deployment:
1. Check Netlify's status page
2. Review build logs in Netlify dashboard
3. Test database connection from test page
4. Check browser console for JavaScript errors

**Your application is now ready for the Treasure in the Shell event! 🎉**
