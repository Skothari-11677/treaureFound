# ✅ Netlify Deployment Checklist

## **Before Deploying**

- [x] Supabase credentials updated
- [x] Netlify Functions created
- [x] Build tested locally (`npm run build` ✅)
- [x] All dependencies installed
- [ ] Code pushed to GitHub

## **Deployment Steps**

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Deploy on Netlify**:

   - Go to [netlify.app](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub repository
   - Verify build settings:
     - Build command: `npm run build`
     - Publish directory: `dist/spa`
   - Click "Deploy site"

3. **After Deployment**:
   - [ ] Test submission form
   - [ ] Test admin panel
   - [ ] Verify API functions work
   - [ ] Check real-time polling (3-second updates)

## **Your URLs After Deployment**

- **Main App**: `https://[your-site].netlify.app/`
- **Admin Panel**: `https://[your-site].netlify.app/admin`
- **Test Page**: `https://[your-site].netlify.app/test`

## **Event Day Checklist**

- [ ] Admin panel loads on projector
- [ ] Teams can access submission form
- [ ] All 100 teams (101-200) in dropdown
- [ ] Password validation works
- [ ] Live updates working (3-second polling)

## **Emergency Backup Plan**

- Keep admin panel URL bookmarked
- Test manual refresh if auto-polling fails
- Have test page URL ready for troubleshooting

**🎯 Ready for "Treasure in the Shell" event!**
