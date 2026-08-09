# Phil Trades Journal — Setup Guide

## 1. Database (Local Mac)

```bash
# Connect with your MySQL password
mysql -u root -p

# Then run:
source /Users/phil/okay/phil-trades-journal/lib/db/schema.sql
```

## 2. Environment Variables

Copy `.env.local` and fill in:

```bash
# Generate a NextAuth secret:
openssl rand -base64 32

# Google OAuth:
# 1. Go to https://console.developers.google.com
# 2. Create OAuth 2.0 credentials
# 3. Add http://localhost:3000/api/auth/callback/google as Authorized redirect URI
# 4. Paste Client ID and Client Secret into .env.local
```

## 3. Screenshot Folder

```bash
mkdir -p ~/trading-screenshots
# Update SCREENSHOT_STORAGE_PATH in .env.local to this path
```

## 4. Run Locally

```bash
cd /Users/phil/okay/phil-trades-journal
npm run dev
# Open http://localhost:3000
```

## 5. Deploy to Vercel

```bash
npm i -g vercel
vercel

# Set environment variables in Vercel dashboard:
# NEXTAUTH_URL=https://your-app.vercel.app
# NEXTAUTH_SECRET=...
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# DB_HOST / DB_USER / DB_PASSWORD / DB_NAME (use PlanetScale or Railway for MySQL)
# Or switch to MongoDB: implement the repository interfaces in lib/db/repositories/
```

## MongoDB Migration

The data layer uses repository interfaces (`ITradeRepository`, `IAccountRepository`, etc. in `lib/db/types.ts`).

To migrate to MongoDB:
1. Install `mongodb` or `mongoose`
2. Create `lib/db/repositories/mongo/` with MongoDB implementations of each interface
3. Swap the imports in your API routes — no UI changes needed
