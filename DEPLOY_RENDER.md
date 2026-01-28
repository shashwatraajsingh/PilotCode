# PilotCode - Render Deployment Guide

Complete step-by-step guide to deploy PilotCode backend on Render.com with PostgreSQL, Redis, and all required services.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Environment Variables](#environment-variables)
5. [Troubleshooting](#troubleshooting)
6. [Post-Deployment](#post-deployment)

---

## 🎯 Prerequisites

Before you begin, ensure you have:

- ✅ GitHub repository with your PilotCode code
- ✅ Render.com account ([Sign up free](https://dashboard.render.com/register))
- ✅ OpenAI or Anthropic API key (for AI features)
- ✅ GitHub Personal Access Token (for repo integration)
- ✅ Frontend deployed on Vercel ✅

**Cost Estimate**:
- PostgreSQL: $7/month (Starter) or Free (limited)
- Redis: $10/month (Upstash Starter) or Free (limited)
- Backend: $7/month (Starter) or Free (with sleep)
- **Total**: ~$24/month (production) or $0/month (testing)

---

## 🏗️ Architecture Overview

```
Frontend (Vercel) ──HTTPS/WSS──> Backend (Render)
                                      │
                        ┌─────────────┼─────────────┐
                        │             │             │
                   PostgreSQL      Redis        GitHub API
                    (Render)     (Upstash)
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Create PostgreSQL Database

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Click **"New +"** → **"PostgreSQL"**

2. **Configure Database**
   ```
   Name: pilotcode-db
   Database: pilotcode_prod
   User: pilotcode_user
   Region: Oregon (US West) - or closest to you
   PostgreSQL Version: 16
   Plan: Starter ($7/mo) or Free
   ```

3. **Create Database**
   - Click **"Create Database"**
   - Wait ~2 minutes for provisioning

4. **Copy Connection String**
   - Go to database → **"Info"** tab
   - Copy **"Internal Database URL"** (starts with `postgresql://`)
   - Format: `postgresql://user:password@dpg-xxxxx/dbname`
   - ⚠️ **Save this** - you'll need it in Step 4

**Why Internal URL?** Better performance, no external data charges, faster connections.

---

### Step 2: Create Redis Instance (Upstash)

1. **Sign up for Upstash**
   - Visit: https://console.upstash.com/
   - Create account (free)

2. **Create Redis Database**
   - Click **"Create Database"**
   - Configure:
     ```
     Name: pilotcode-redis
     Type: Regional
     Region: us-west-1 (match Render region)
     ```
   - Click **"Create"**

3. **Copy Connection Details**
   - Click on your database
   - Copy **"UPSTASH_REDIS_REST_URL"**
   - Format: `redis://default:password@region.upstash.io:6379`
   - ⚠️ **Save this** - you'll need it in Step 4

**Free Tier**: 10,000 commands/day (plenty for testing)

---

### Step 3: Deploy Backend to Render

1. **Create Web Service**
   - Go to Render Dashboard
   - Click **"New +"** → **"Web Service"**

2. **Connect Repository**
   - Choose **"Build and deploy from a Git repository"**
   - Click **"Connect account"** (GitHub)
   - Select your **PilotCode** repository
   - Click **"Connect"**

3. **Configure Service**

   **Basic Settings:**
   ```
   Name: pilotcode-backend
   Region: Oregon (US West) - match database region
   Branch: main
   Root Directory: apps/backend
   Runtime: Node
   ```

   **Build & Start Commands:**
   ```
   Build Command:
   npm install && npx prisma generate && npm run build

   Start Command:
   npx prisma migrate deploy && npm run start:prod
   ```

   **Instance Type:**
   ```
   Free (for testing) or Starter $7/mo (production)
   ```

4. **Click "Create Web Service"** (Don't deploy yet - we need environment variables first!)

---

### Step 4: Configure Environment Variables

1. **Go to Service Settings**
   - Your service → **"Environment"** tab
   - Click **"Add Environment Variable"**

2. **Add Required Variables**

   Copy these one by one:

   ```bash
   # Database (from Step 1)
   DATABASE_URL
   <paste your Internal PostgreSQL URL>

   # Redis (from Step 2)
   REDIS_URL
   <paste your Upstash Redis URL>

   # JWT Secret
   JWT_SECRET
   <generate using command below>

   JWT_EXPIRES_IN
   7d

   REFRESH_TOKEN_EXPIRES_IN
   30d

   # Server Config
   NODE_ENV
   production

   PORT
   3001

   # Kafka (disable for now)
   KAFKA_BROKERS
   localhost:9092
   ```

3. **Generate JWT Secret**
   
   Run this locally:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and paste as `JWT_SECRET` value.

4. **Optional: Add AI Provider Keys**
   
   If you want default AI keys (users can still use BYOK):
   ```bash
   OPENAI_API_KEY
   sk-...

   ANTHROPIC_API_KEY
   sk-ant-...

   GITHUB_TOKEN
   ghp_...
   ```

5. **Save All Variables**
   - Click **"Save Changes"**

---

### Step 5: Deploy!

1. **Manual Deploy**
   - Click **"Manual Deploy"** → **"Deploy latest commit"**

2. **Watch Build Logs**
   - Go to **"Logs"** tab
   - Watch the build process:
     - Installing dependencies ✅
     - Generating Prisma Client ✅
     - Building application ✅
     - Running migrations ✅
     - Starting server ✅

3. **Wait for Success**
   - First deploy: ~5-10 minutes
   - You'll see: **"Your service is live 🎉"**

4. **Copy Service URL**
   - You'll get a URL like: `https://pilotcode-backend.onrender.com`
   - ⚠️ **Save this** - you'll need it for frontend

---

### Step 6: Verify Deployment

#### Test Health Endpoint

```bash
curl https://pilotcode-backend.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "db": "connected",
  "redis": "connected"
}
```

#### Test API Docs

Visit in browser:
```
https://pilotcode-backend.onrender.com/api
```

You should see **Swagger UI** with all API endpoints.

#### Test Authentication

```bash
# Register a test user
curl -X POST https://pilotcode-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "name": "Test User"
  },
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci..."
}
```

---

### Step 7: Connect Frontend to Backend

1. **Go to Vercel**
   - Open your project
   - Go to **Settings** → **Environment Variables**

2. **Update API URL**
   - Find `NEXT_PUBLIC_API_URL`
   - Change value to: `https://pilotcode-backend.onrender.com`
   - Click **"Save"**

3. **Redeploy Frontend**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment → **"Redeploy"**

4. **Test Full Stack**
   - Visit your frontend: `https://your-app.vercel.app`
   - Try creating a task
   - Check real-time updates

---

## 🔐 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host/db` |
| `REDIS_URL` | Redis connection | `redis://default:pass@host:6379` |
| `JWT_SECRET` | 32-byte random string | `abc123...` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3001` |

### Optional Variables

| Variable | Description | Note |
|----------|-------------|------|
| `OPENAI_API_KEY` | OpenAI API key | Users can provide via BYOK |
| `ANTHROPIC_API_KEY` | Anthropic API key | Users can provide via BYOK |
| `GITHUB_TOKEN` | GitHub PAT | Users can provide via BYOK |
| `KAFKA_BROKERS` | Kafka brokers | Set to `localhost:9092` to disable |

---

## 🐛 Troubleshooting

### Issue: Database Connection Fails

**Error**: `P1001: Can't reach database server`

**Solutions:**
1. ✅ Use **Internal Database URL**, not External
2. ✅ Verify both services are in same region
3. ✅ Check database is running (Render dashboard)
4. ✅ Copy-paste URL carefully (no extra spaces)

---

### Issue: Redis Connection Timeout

**Error**: `ECONNREFUSED` or `Connection timeout`

**Solutions:**
1. ✅ Verify `REDIS_URL` format is correct
2. ✅ Check Upstash dashboard shows "Active"
3. ✅ Test locally:
   ```bash
   redis-cli -h your-host -p 6379 -a your-password ping
   ```

---

### Issue: Build Fails

**Error**: `npm install failed`

**Solutions:**
1. ✅ Check `package.json` exists in `apps/backend`
2. ✅ Verify Root Directory is set to `apps/backend`
3. ✅ Check Node version (should be 18+)

---

### Issue: Migrations Fail

**Error**: `Database schema is not in sync`

**Solution:**
```bash
# Go to Render → Shell tab
npx prisma migrate reset --force
npx prisma migrate deploy
```

---

### Issue: App Goes to Sleep (Free Tier)

**Behavior**: 15-minute inactivity → service sleeps

**Solutions:**
1. Upgrade to Starter plan ($7/mo) - no sleep
2. Use a ping service: https://uptimerobot.com/
3. Accept 30-second cold start on first request

---

### Issue: Out of Memory

**Error**: `JavaScript heap out of memory`

**Solutions:**
1. Upgrade instance type (Starter → Standard)
2. Add environment variable:
   ```
   NODE_OPTIONS=--max-old-space-size=2048
   ```
3. Optimize Prisma queries

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] Health endpoint returns 200 OK
- [ ] API documentation loads at `/api`
- [ ] Can register new user
- [ ] Can log in and get token
- [ ] Can create a task
- [ ] Database has tables
- [ ] Redis connection works
- [ ] Frontend connects to backend
- [ ] WebSocket connection works
- [ ] Environment variables secured
- [ ] Logs accessible
- [ ] Custom domain configured (optional)

---

## 📊 Monitoring & Maintenance

### View Logs

1. Go to your service → **"Logs"** tab
2. Filter by:
   - **Deploy Logs**: Build and migration logs
   - **Service Logs**: Runtime application logs

### Set Up Alerts

1. Go to **"Settings"** → **"Alerts"**
2. Enable:
   - Failed deployment alerts
   - High CPU/memory usage
   - Service down alerts

### Database Backups

**Automatic Backups** (Starter plan and above):
- Daily backups retained for 7 days
- Go to database → **"Backups"** tab

**Manual Backup:**
```bash
# In Render Shell
pg_dump $DATABASE_URL > backup.sql
```

---

## 💰 Cost Breakdown

### Free Tier (Testing)
```
PostgreSQL Free:     $0/month (sleeps after inactivity)
Redis (Upstash):     $0/month (10K commands/day)
Backend Free:        $0/month (sleeps after 15 min)
────────────────────────────────
Total:               $0/month
```

**Limitations:**
- Services sleep after inactivity
- Database: 1GB storage
- Cold starts: 30 seconds

### Starter Tier (Production)
```
PostgreSQL Starter:  $7/month (always on, 10GB)
Redis (Upstash):    $10/month (higher limits)
Backend Starter:     $7/month (always on)
────────────────────────────────
Total:              $24/month
```

**Benefits:**
- No sleep
- Better performance
- Auto backups
- More resources

---

## 🔒 Security Best Practices

Before going live:

1. **Change Secrets**
   - [ ] Generate new `JWT_SECRET`
   - [ ] Don't commit `.env` files
   - [ ] Use different keys for dev/prod

2. **Enable CORS**
   - [ ] Only allow your frontend domain
   - [ ] No wildcards (`*`) in production

3. **Rate Limiting**
   - [ ] Already configured in NestJS
   - [ ] Monitor for abuse

4. **Database Security**
   - [ ] Use Internal URL only
   - [ ] Enable SSL (Render does this)
   - [ ] Regular backups

5. **Monitoring**
   - [ ] Set up error tracking (Sentry)
   - [ ] Enable alerts
   - [ ] Monitor logs daily

---

## 🌐 Custom Domain (Optional)

1. **Purchase Domain**
   - Namecheap, Google Domains, etc.

2. **Add to Render**
   - Service → **"Settings"** → **"Custom Domains"**
   - Add: `api.pilotcode.dev`

3. **Configure DNS**
   ```
   Type: CNAME
   Name: api
   Value: pilotcode-backend.onrender.com
   TTL: 3600
   ```

4. **SSL Certificate**
   - Render auto-provisions Let's Encrypt SSL
   - Wait ~10 minutes for activation

---

## 🆘 Getting Help

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **PilotCode Issues**: GitHub Issues
- **Status Page**: https://status.render.com

---

## 📚 Next Steps

After deployment:

1. **Monitor Performance**
   - Check response times
   - Monitor error rates
   - Track resource usage

2. **Optimize**
   - Enable caching
   - Add database indexes
   - Optimize queries

3. **Scale**
   - Add read replicas
   - Enable auto-scaling
   - Use CDN for static assets

4. **Secure**
   - Add WAF (Web Application Firewall)
   - Enable DDoS protection
   - Regular security audits

---

**🎉 Congratulations!** Your PilotCode backend is now live on Render!

**Last Updated**: November 24, 2025  
**Platform**: Render.com  
**Status**: ✅ Production Ready
