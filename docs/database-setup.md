# Database Integration Setup Guide

## Prerequisites Complete ✅
- [x] Supabase service created (`src/services/supabase.js`)
- [x] Article routes connected to database (`src/routes/articles.js`) 
- [x] Health check endpoints with database testing
- [x] Database schema ready for deployment

## Quick Setup Steps

### 1. Clone and Install
```bash
git clone https://github.com/epaulson2/hunter-ai-graphrag.git
cd hunter-ai-graphrag
npm install
```

### 2. Set Up Supabase Project
1. Go to https://supabase.com and create a new project
2. Name it "hunter-ai-graphrag"
3. Choose a strong database password
4. Wait for project creation (2-3 minutes)

### 3. Apply Database Schema
1. In your Supabase dashboard, go to SQL Editor
2. Copy the entire contents of `src/database/schema.sql`
3. Paste and run in SQL Editor
4. Verify tables were created in Table Editor

### 4. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
# Get these from Supabase Dashboard > Settings > API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Development settings
NODE_ENV=development
LOG_LEVEL=debug
```

### 5. Test the Integration
```bash
npm run dev
```

#### Test Database Connection
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-08T02:15:00.000Z",
  "version": "0.1.0",
  "environment": "development",
  "services": {
    "api": "healthy",
    "database": "healthy"
  }
}
```

#### Test Article Creation
```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article - Database Integration Working!",
    "content": "This is a test article to verify our Supabase integration is working correctly. Hunter the Otter would be proud!",
    "category": "community_events",
    "status": "draft",
    "hunter_voice_score": 0.95,
    "quality_score": 0.88,
    "relevance_score": 0.92
  }'
```

#### Test Article Retrieval
```bash
curl http://localhost:3000/api/articles
```

#### Get Database Statistics
```bash
curl http://localhost:3000/health/detailed
```

## What's Working Now ✅

### Database Operations
- ✅ **Article CRUD**: Create, read, update articles
- ✅ **Filtering & Pagination**: Category, status, published filters
- ✅ **Validation**: UUID validation, required fields, category validation
- ✅ **Error Handling**: Proper HTTP status codes and error messages
- ✅ **Logging**: Structured logging for all operations

### API Endpoints Ready
- `GET /health` - Basic health check with DB connectivity
- `GET /health/detailed` - Detailed health check with DB stats
- `GET /api/articles` - List articles with filtering and pagination
- `GET /api/articles/:id` - Get specific article with business mentions
- `POST /api/articles` - Create new article with validation
- `PUT /api/articles/:id` - Update existing article
- `GET /api/articles/stats/overview` - Get database statistics

### Database Features
- **Vector Embeddings**: Ready for semantic search (pgvector enabled)
- **Row Level Security**: Security policies configured
- **Relationships**: Article-entity-business partner relationships
- **Temporal Data**: Support for time-based relationships
- **Credit Tracking**: Business partner mention credit system

## Troubleshooting

### Common Issues

#### "Missing Supabase environment variables"
- Check your `.env` file exists and has correct Supabase URLs/keys
- Verify keys are copied correctly from Supabase dashboard

#### "Database connection failed"
- Verify your Supabase project is running (not paused)
- Check if you're on the correct billing plan (free plan has limitations)
- Confirm database schema was applied successfully

#### "No rows returned" when creating articles
- Check if RLS (Row Level Security) policies are blocking operations
- Verify the user context in your requests

#### Connection timeout errors
- Ensure your Supabase project region is close to your location
- Check if your IP is allowlisted (if using database restrictions)

### Debugging Commands

Check database connection:
```bash
# Should show healthy status
curl http://localhost:3000/health
```

View application logs:
```bash
# Run with debug logging
LOG_LEVEL=debug npm run dev
```

Test specific database operations:
```bash
# Test article creation
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -d '{"title":"Debug Test","content":"Testing database connection"}'

# Test article retrieval  
curl http://localhost:3000/api/articles?limit=5

# Test statistics
curl http://localhost:3000/health/detailed
```

## Next Steps After Database Integration

Once your database integration is working:

1. **AI Service Integration** (`src/services/openai.js`, `src/services/anthropic.js`)
2. **Content Aggregation** (`src/services/content-aggregator.js`)
3. **n8n Workflow Engine** (deploy to Railway)
4. **Knowledge Graph Operations** (update knowledge-graph routes)
5. **Business Partner Management** (update business-partners routes)

## Verification Checklist

Before moving to Phase 2, verify:

- [ ] Health check shows database as "healthy"
- [ ] Can create articles via POST /api/articles
- [ ] Can retrieve articles via GET /api/articles
- [ ] Can get specific articles via GET /api/articles/:id
- [ ] Database statistics endpoint works
- [ ] Application logs show successful database operations
- [ ] No error messages in Supabase dashboard logs

## Support

If you run into issues:
1. Check the application logs for error details
2. Verify your Supabase dashboard for connection errors
3. Ensure all environment variables are correctly set
4. Test the health check endpoints first before trying complex operations

The database integration provides a solid foundation for the rest of the Hunter AI system!
