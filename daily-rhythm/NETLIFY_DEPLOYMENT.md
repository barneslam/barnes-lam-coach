# Netlify Deployment Guide - Daily Operating Rhythm

## Prerequisites
- GitHub account with `barnes-lam-coach` repository pushed
- Netlify account (free tier works fine)
- Supabase project already set up with data

## Deployment Steps

### 1. Connect GitHub to Netlify
1. Go to https://app.netlify.com
2. Click **"New site from Git"**
3. Select **GitHub** as your Git provider
4. Find and authorize **barnes-lam-coach** repository
5. Netlify should auto-detect `netlify.toml` in daily-rhythm

### 2. Configure Build Settings
Netlify should auto-detect:
- **Base directory**: `daily-rhythm`
- **Build command**: `echo 'Dashboard ready for deployment'`
- **Publish directory**: `.` (current directory)

### 3. Set Environment Variables
Before deploying, add environment variables in Netlify dashboard:

**Settings → Build & deploy → Environment**

Add these variables:
```
SUPABASE_URL = https://qiwdgyilhwkndqkgqruf.supabase.co
SUPABASE_ANON_KEY = [your-key-here]
```

### 4. Deploy
Click **"Deploy site"** and Netlify will:
- Build the site (just copies files since no build step needed)
- Deploy dashboard.html as static site
- Deploy Netlify Functions in `functions/` directory
- Create automatic HTTPS + custom domain

### 5. Test the Deployment
Once deployed, visit your Netlify URL:
- `https://[your-site].netlify.app/` → Dashboard
- `https://[your-site].netlify.app/api/discovered-leads` → API endpoint
- `https://[your-site].netlify.app/api/outreach` → API endpoint

## Local Development

Run locally with Netlify CLI:
```bash
npm install -g netlify-cli
netlify dev
```

This starts dashboard-server.js on http://localhost:3001 with Netlify Functions support.

## Local 7am Lead Discovery

The **local Node.js server still runs the 7am automation** on your machine:
```bash
cd daily-rhythm
node dashboard-server.js
```

When it runs, it writes discovered leads to Supabase, which the Netlify dashboard reads from.

## Architecture

```
┌─────────────────────────────────────┐
│    Netlify (Static + Functions)    │
│  - dashboard.html                  │
│  - /api/discovered-leads (function)│
│  - /api/outreach (function)        │
└────────────┬────────────────────────┘
             │
        Reads from
             ↓
    ┌─────────────────┐
    │  Supabase DB    │
    │ - outreach_msgs │
    │ - discovered... │
    │ - tracker       │
    └────────┬────────┘
             ↑
        Written by
             │
    ┌────────────────────────────────┐
    │   Local Node.js Server (7am)   │
    │  - Runs on your machine        │
    │  - 7am daily lead discovery    │
    │  - Stores to Supabase         │
    └────────────────────────────────┘
```

## Troubleshooting

**Functions not working:**
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Netlify environment
- Check Netlify Functions logs in dashboard

**Old data showing:**
- Netlify caches static files; clear browser cache or do hard refresh (Ctrl+Shift+R)

**API timeouts:**
- Netlify Functions have 10s timeout; Supabase queries should be fast
- Check Supabase connection and query performance

## Next Steps

1. ✅ Push code to GitHub
2. ⏳ Connect GitHub to Netlify
3. ⏳ Set environment variables
4. ⏳ Deploy
5. ⏳ Monitor dashboard at Netlify URL
6. ⏳ Keep local Node.js server running for 7am automation

---

Questions? Check Netlify and Supabase docs for additional setup guidance.
