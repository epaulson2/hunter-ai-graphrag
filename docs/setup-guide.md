# Hunter AI GraphRAG System - Development Setup Guide

## Overview

This guide walks through setting up the Hunter AI Enhanced GraphRAG System from the ground up, following the specifications in the Functional Specification Document and Product Requirements Document.

## Prerequisites

### Required Accounts
1. **Supabase** - Database and authentication
2. **Railway** - Hosting and deployment
3. **OpenAI** - GPT-4o-mini for content filtering
4. **Anthropic** - Claude 3.5 Sonnet for article generation
5. **Retool** - Admin dashboard (Team Plan)
6. **RSS.app** - Content aggregation
7. **GitHub** - Version control and CI/CD

### Local Development
- Node.js 18+
- Docker (for n8n)
- Git
- Code editor (VS Code recommended)

## Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/epaulson2/hunter-ai-graphrag.git
cd hunter-ai-graphrag
npm install
cp .env.example .env
```

### 2. Environment Configuration
Edit `.env` with your credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
# ... other configurations
```

### 3. Database Setup
1. Create new Supabase project
2. Run the schema in Supabase SQL Editor:
   ```sql
   -- Copy contents from src/database/schema.sql
   ```
3. Enable pgvector extension for embeddings

### 4. Start Development Server
```bash
npm run dev
```
Visit http://localhost:3000/health to verify setup.

## Implementation Phases

### Phase 1: Foundation (Current) ✅
- [x] GitHub repository setup
- [x] Basic Express.js API structure
- [x] Database schema design
- [x] Environment configuration
- [x] Core route definitions

### Phase 2: Core Services (Next)
- [ ] Supabase integration
- [ ] OpenAI/Anthropic API connections
- [ ] n8n workflow setup
- [ ] Basic article generation
- [ ] Content aggregation service

### Phase 3: Intelligence Layer
- [ ] GraphRAG knowledge graph
- [ ] Entity relationship modeling
- [ ] Cross-domain content connections
- [ ] Business integration logic

### Phase 4: Admin Dashboard
- [ ] Retool dashboard setup
- [ ] Knowledge base management
- [ ] Business partner management
- [ ] Content operations center

## Architecture Overview

```
Hunter AI System
├── Content Sources (RSS.app, Local feeds)
├── AI Processing (GPT-4o-mini + Claude 3.5 Sonnet)
├── Knowledge Graph (Graphiti + pgvector)
├── Business Logic (Partnership & Credit Management)
├── Admin Dashboard (Retool)
└── Content Delivery (API + GoodBarber app)
```

## Key Features to Implement

### 1. Enhanced Article Generation
- 3-5 daily articles in Hunter's voice
- 95%+ voice consistency score
- <$0.50 per article cost
- Natural business mentions

### 2. GraphRAG Knowledge System
- 7 core knowledge bases
- Vector embeddings for similarity
- Temporal relationship tracking
- Cross-domain intelligence

### 3. Business Partnership Integration
- Bronze/Silver/Gold tiers
- Credit-based mention system
- ROI tracking and analytics
- Natural integration scoring

## Development Workflow

### Testing
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Linting
```bash
npm run lint         # Check code style
npm run lint:fix     # Auto-fix issues
```

### Database Operations
```bash
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
npm run db:reset     # Reset database
```

### Deployment
```bash
npm run deploy:staging    # Deploy to staging
npm run deploy:production # Deploy to production
```

## API Endpoints

### Articles
- `GET /api/articles` - List published articles
- `GET /api/articles/:id` - Get specific article
- `POST /api/articles` - Create article (admin)

### Knowledge Graph
- `GET /api/knowledge-graph/entities` - List entities
- `GET /api/knowledge-graph/relationships` - List relationships
- `POST /api/knowledge-graph/entities` - Create entity

### Business Partners
- `GET /api/business-partners` - List partners
- `GET /api/business-partners/:id/credits` - Credit usage
- `POST /api/business-partners` - Create partner

### Workflows
- `GET /api/workflows/status` - Workflow status
- `POST /api/workflows/:id/trigger` - Trigger workflow

### Analytics
- `GET /api/analytics/overview` - System overview
- `GET /api/analytics/articles` - Article metrics

## Success Metrics

### Technical
- 99.5%+ system uptime
- <30 minutes article generation
- <$0.50 per article cost
- 95%+ Hunter voice consistency

### Business
- $10,000+ monthly revenue by Month 6
- 90%+ partner retention rate
- 85%+ article engagement rate
- 2,000+ daily active users

## Next Steps

1. **Week 1**: Complete Supabase integration and basic API endpoints
2. **Week 2**: Implement content aggregation and n8n workflows
3. **Week 3**: Build article generation with Claude integration
4. **Week 4**: Add basic knowledge graph and entity management

## Resources

- [Functional Specification](../docs/functional-spec.md)
- [Product Requirements](../docs/product-requirements.md)
- [API Documentation](../docs/api/)
- [Contributing Guidelines](../CONTRIBUTING.md)

## Support

For setup questions:
1. Check this guide and documentation
2. Review GitHub issues
3. Contact the development team
