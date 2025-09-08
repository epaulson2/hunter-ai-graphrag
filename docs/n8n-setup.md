# n8n Workflow Engine Setup

## Overview
n8n serves as the orchestration layer for Hunter AI GraphRAG, managing the entire content pipeline from RSS ingestion to article publication.

## Deployment on Railway

### 1. Deploy n8n Service
1. In Railway dashboard, create a new service
2. Connect to this GitHub repository
3. Set the service to use the `n8n/` directory
4. Railway will automatically detect the Dockerfile

### 2. Environment Variables
Set these in Railway for the n8n service:

```bash
# Authentication
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password

# Database (Supabase)
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=db.yknfbokdogitccextpuh.supabase.co
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=your_supabase_password
DB_POSTGRESDB_SCHEMA=n8n

# Webhooks & Host
WEBHOOK_URL=https://your-n8n-domain.railway.app
N8N_HOST=your-n8n-domain.railway.app
N8N_PORT=5678
N8N_PROTOCOL=https

# Security
N8N_ENCRYPTION_KEY=generate_a_random_32_character_key
N8N_SECURE_COOKIE=true

# Integration APIs
HUNTER_API_BASE_URL=https://hunter-ai-graphrag-production.up.railway.app
SUPABASE_URL=https://yknfbokdogitccextpuh.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### 3. Database Schema Setup
After deployment, create the n8n schema in Supabase:

```sql
-- Create n8n schema
CREATE SCHEMA IF NOT EXISTS n8n;

-- Grant permissions
GRANT USAGE ON SCHEMA n8n TO postgres;
GRANT CREATE ON SCHEMA n8n TO postgres;
```

## Key Workflows

### 1. Content Aggregation Workflow
- **Trigger**: Schedule (every 2 hours)
- **Steps**:
  1. Fetch RSS feeds
  2. Parse and filter content
  3. Store in content_queue table
  4. Trigger article generation

### 2. Article Generation Workflow
- **Trigger**: New content in queue
- **Steps**:
  1. Analyze content with OpenAI
  2. Generate article with Anthropic Claude
  3. Extract business mentions
  4. Store article and entities
  5. Update knowledge graph

### 3. Business Mention Workflow
- **Trigger**: New article created
- **Steps**:
  1. Scan for business mentions
  2. Update business_partners table
  3. Create relationships
  4. Calculate relevance scores

## Access
- **URL**: Your Railway-assigned domain
- **Login**: admin / your_secure_password
- **Port**: 5678 (internally)

## Integration with Hunter API
Workflows will call these endpoints:
- `POST /api/articles` - Create new articles
- `POST /api/knowledge-graph/entities` - Add entities
- `POST /api/business-partners` - Update business data
- `GET /api/analytics` - System metrics

## Workflow Templates
Pre-built workflows will be stored in:
- `workflows/content-aggregation.json`
- `workflows/article-generation.json`
- `workflows/business-mentions.json`

## Monitoring
- n8n includes built-in execution monitoring
- Failed executions are logged and can be retried
- Integration with Winston logger for detailed tracking