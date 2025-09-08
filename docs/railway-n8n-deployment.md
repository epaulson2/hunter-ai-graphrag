# Railway n8n Deployment Guide

## Deploy n8n as Separate Service in Railway

### Step 1: Create New Service in Railway

1. **Login to Railway Dashboard**
   - Go to your existing Hunter AI GraphRAG project
   - Click "New Service"

2. **Connect GitHub Repository**
   - Select "Deploy from GitHub repo"
   - Choose: `epaulson2/hunter-ai-graphrag`
   - **Important**: Set the root directory to `/` (not `/n8n`)

3. **Configure Service**
   - Service Name: `hunter-ai-n8n`
   - Keep it in the same project as your main API

### Step 2: Environment Variables

Add these environment variables in Railway for the n8n service:

#### Core n8n Configuration
```bash
N8N_PORT=5678
N8N_HOST=0.0.0.0
N8N_PROTOCOL=https
N8N_METRICS=true
EXECUTIONS_PROCESS=main
EXECUTIONS_MODE=regular
GENERIC_TIMEZONE=America/New_York
N8N_SECURE_COOKIE=true
```

#### Authentication (Change These!)
```bash
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password_here
```

#### Database Configuration
```bash
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=db.yknfbokdogitccextpuh.supabase.co
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=your_supabase_password
DB_POSTGRESDB_SCHEMA=n8n
```

#### Security (Generate Random Key!)
```bash
N8N_ENCRYPTION_KEY=generate_a_random_32_character_key
```

#### Integration URLs (Update After Deployment)
```bash
WEBHOOK_URL=https://your-n8n-domain.railway.app
N8N_HOST=your-n8n-domain.railway.app
HUNTER_API_BASE_URL=https://hunter-ai-graphrag-production.up.railway.app
```

#### External API Keys
```bash
SUPABASE_URL=https://yknfbokdogitccextpuh.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Step 3: Configure Build

In Railway service settings:

1. **Build Configuration**
   - Builder: `DOCKERFILE`
   - Dockerfile Path: `n8n/Dockerfile`
   - Root Directory: `/`

2. **Deploy Configuration**
   - Start Command: `n8n`
   - Port: `5678`

### Step 4: Database Schema Setup

After n8n deploys, create the schema in Supabase:

1. **Go to Supabase SQL Editor**
2. **Run this SQL**:
```sql
-- Create n8n schema
CREATE SCHEMA IF NOT EXISTS n8n;

-- Grant permissions to the postgres user
GRANT USAGE ON SCHEMA n8n TO postgres;
GRANT CREATE ON SCHEMA n8n TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA n8n TO postgres;

-- Allow n8n to create tables
ALTER DEFAULT PRIVILEGES IN SCHEMA n8n GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA n8n GRANT ALL ON SEQUENCES TO postgres;
```

### Step 5: Generate Domain and Test

1. **Generate Domain**
   - In Railway, go to your n8n service
   - Click "Settings" → "Domains"
   - Click "Generate Domain"
   - Copy the domain (e.g., `hunter-ai-n8n-production.up.railway.app`)

2. **Update Environment Variables**
   - Update `WEBHOOK_URL` with your new domain
   - Update `N8N_HOST` with your new domain

3. **Test Access**
   - Go to your n8n domain
   - Login with your admin credentials
   - You should see the n8n interface

### Step 6: Import Workflows

1. **Access n8n**
   - Login to your n8n instance
   - Go to "Workflows"

2. **Import Templates**
   - Click "+ Add workflow"
   - Select "Import from file"
   - Import these files from the repository:
     - `workflows/content-aggregation.json`
     - `workflows/article-generation.json`
     - `workflows/business-mentions.json`

3. **Configure Credentials**
   - Go to "Credentials"
   - Add credentials for:
     - OpenAI API
     - Anthropic API
     - Hunter API (HTTP Header Auth)

### Step 7: Test Workflows

1. **Test Content Aggregation**
   - Open the content aggregation workflow
   - Click "Execute Workflow"
   - Check that it connects to RSS feeds

2. **Test Article Generation**
   - Manually trigger with test data
   - Verify it calls Hunter API endpoints

3. **Test Business Mentions**
   - Use a sample article
   - Verify business extraction works

## Service URLs

After deployment, you'll have:
- **Main API**: `https://hunter-ai-graphrag-production.up.railway.app`
- **n8n Workflows**: `https://your-n8n-domain.railway.app`

## Monitoring

- **Railway Logs**: Check both services in Railway dashboard
- **n8n Executions**: Monitor workflow executions in n8n interface
- **API Health**: Monitor main API health endpoints

## Security Notes

1. **Change Default Password**: Update `N8N_BASIC_AUTH_PASSWORD`
2. **Generate Encryption Key**: Create a strong 32-character key
3. **API Keys**: Use environment variables, never hardcode
4. **Database Access**: Use schema isolation for n8n

## Troubleshooting

### n8n Won't Start
- Check Railway logs for errors
- Verify Dockerfile path is correct
- Ensure environment variables are set

### Database Connection Issues
- Verify Supabase credentials
- Check if n8n schema exists
- Test database connectivity from Railway logs

### Workflow Failures
- Check n8n execution logs
- Verify API endpoints are accessible
- Test credentials in n8n settings

### API Integration Issues
- Verify Hunter API is responding
- Check API key permissions
- Test webhook endpoints manually