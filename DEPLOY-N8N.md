# n8n Railway Deployment - Quick Setup

## Ready to Deploy! 🚀

Your Hunter AI GraphRAG system now has complete n8n integration ready to deploy. Here's what to do:

## 1. Deploy n8n Service to Railway

### Step 1: Create New Service
1. Go to your Railway dashboard: [railway.app](https://railway.app)
2. Open your existing Hunter AI GraphRAG project
3. Click **"New Service"**
4. Select **"Deploy from GitHub repo"**
5. Choose: `epaulson2/hunter-ai-graphrag`
6. Service name: `hunter-ai-n8n`

### Step 2: Configure Build Settings
In the n8n service settings:
- **Builder**: `DOCKERFILE`
- **Dockerfile Path**: `n8n/Dockerfile`
- **Root Directory**: `/`
- **Port**: `5678`

### Step 3: Set Environment Variables
Copy these into Railway (update the marked values):

```bash
# Core n8n Configuration
N8N_PORT=5678
N8N_HOST=0.0.0.0
N8N_PROTOCOL=https
N8N_METRICS=true
EXECUTIONS_PROCESS=main
EXECUTIONS_MODE=regular
GENERIC_TIMEZONE=America/New_York
N8N_SECURE_COOKIE=true

# Authentication - CHANGE THESE!
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# Database Configuration - UPDATE PASSWORD!
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=db.yknfbokdogitccextpuh.supabase.co
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=YOUR_SUPABASE_PASSWORD
DB_POSTGRESDB_SCHEMA=n8n

# Security - GENERATE RANDOM 32-CHAR KEY!
N8N_ENCRYPTION_KEY=YOUR_32_CHARACTER_ENCRYPTION_KEY

# Integration URLs - UPDATE AFTER DEPLOYMENT!
WEBHOOK_URL=https://your-n8n-domain.railway.app
N8N_HOST=your-n8n-domain.railway.app
HUNTER_API_BASE_URL=https://hunter-ai-graphrag-production.up.railway.app

# External API Keys - ADD YOUR KEYS!
SUPABASE_URL=https://yknfbokdogitccextpuh.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY
```

## 2. Setup Database Schema

After n8n deploys, run this in Supabase SQL Editor:

```sql
-- Create n8n schema
CREATE SCHEMA IF NOT EXISTS n8n;

-- Grant permissions
GRANT USAGE ON SCHEMA n8n TO postgres;
GRANT CREATE ON SCHEMA n8n TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA n8n TO postgres;

-- Allow n8n to create tables
ALTER DEFAULT PRIVILEGES IN SCHEMA n8n GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA n8n GRANT ALL ON SEQUENCES TO postgres;
```

## 3. Generate Domain & Update URLs

1. **Generate Domain** in Railway for the n8n service
2. **Copy the domain** (e.g., `hunter-ai-n8n-production.up.railway.app`)
3. **Update these environment variables**:
   - `WEBHOOK_URL=https://your-new-domain.railway.app`
   - `N8N_HOST=your-new-domain.railway.app`

## 4. Test the Deployment

1. **Visit your n8n URL**
2. **Login** with your admin credentials
3. **You should see the n8n interface!**

## 5. Import Pre-Built Workflows

In n8n interface:
1. Go to **"Workflows"**
2. Click **"Import from file"**
3. Import these files from the repository:
   - `workflows/content-aggregation.json`
   - `workflows/article-generation.json`
   - `workflows/business-mentions.json`

## 6. Configure API Credentials

In n8n:
1. Go to **"Credentials"**
2. Add credentials for:
   - **OpenAI API** (API Key)
   - **Anthropic API** (API Key)
   - **Hunter API** (HTTP Header Auth)

## What You'll Have After Deployment

### Two Railway Services:
1. **Main API**: `https://hunter-ai-graphrag-production.up.railway.app`
   - All your existing API endpoints
   - New webhook endpoints for n8n
   - Content queue management

2. **n8n Workflows**: `https://your-n8n-domain.railway.app`
   - Visual workflow editor
   - Pre-built content pipelines
   - Automated article generation

### Complete Content Pipeline:
```
RSS Feeds → n8n Content Aggregation → Content Queue → 
n8n Article Generation → Hunter API → Published Articles
```

## Next Steps After Deployment

1. **Test the workflows** with sample data
2. **Configure RSS feed URLs** in the content aggregation workflow
3. **Set up scheduling** for automatic content processing
4. **Monitor executions** in n8n dashboard

## Need Help?

Check the detailed deployment guide: `docs/railway-n8n-deployment.md`

---

**Ready to deploy? Let's get your workflow engine running!** 🎯