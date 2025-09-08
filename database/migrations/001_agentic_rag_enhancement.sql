-- Hunter AI Agentic RAG Schema Enhancement
-- Adds vector search, tool selection tracking, and business intelligence
-- Run this in your Supabase SQL editor

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enhanced knowledge storage with embeddings
CREATE TABLE hunter_knowledge_chunks (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- text-embedding-3-small dimensions
  source_type VARCHAR(50) NOT NULL, -- 'article', 'business', 'event', 'historical'
  source_id INTEGER,
  chunk_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tool selection and usage tracking
CREATE TABLE rag_query_logs (
  id BIGSERIAL PRIMARY KEY,
  query_text TEXT NOT NULL,
  query_intent VARCHAR(100), -- 'business_info', 'local_context', 'historical', etc.
  tool_selected VARCHAR(100), -- 'vector_search', 'business_intelligence', etc.
  model_used VARCHAR(50), -- 'gpt-4o-mini', 'claude-3.5-sonnet'
  execution_time_ms INTEGER,
  token_count INTEGER,
  cost_usd DECIMAL(8,4),
  quality_score FLOAT CHECK (quality_score >= 0 AND quality_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business intelligence enhanced
CREATE TABLE business_partnerships_enhanced (
  id BIGSERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  partnership_tier VARCHAR(50) NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum'
  mention_credits INTEGER DEFAULT 0,
  monthly_fee DECIMAL(10,2),
  mention_cost_per_credit DECIMAL(6,2) DEFAULT 5.00,
  relevance_categories TEXT[] DEFAULT '{}', -- ['restaurant', 'retail', 'service']
  active BOOLEAN DEFAULT true,
  contract_start DATE,
  contract_end DATE,
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article generation with business mention tracking
CREATE TABLE article_generation_logs (
  id BIGSERIAL PRIMARY KEY,
  article_id INTEGER,
  generation_type VARCHAR(100), -- 'news', 'event_preview', 'business_spotlight'
  tools_used TEXT[] DEFAULT '{}',
  business_mentions JSONB DEFAULT '[]', -- Array of mention objects
  total_generation_cost DECIMAL(8,4),
  mention_revenue DECIMAL(8,2),
  net_value DECIMAL(8,2),
  quality_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Local knowledge categories for better organization
CREATE TABLE knowledge_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  priority_level INTEGER DEFAULT 5, -- 1-10, higher = more important
  tool_preference VARCHAR(50), -- 'vector_search', 'sql_query', 'full_document'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Entity relationships for cross-document analysis
CREATE TABLE entity_relationships (
  id BIGSERIAL PRIMARY KEY,
  entity_1_type VARCHAR(50) NOT NULL, -- 'business', 'person', 'event', 'location'
  entity_1_id INTEGER NOT NULL,
  entity_2_type VARCHAR(50) NOT NULL,
  entity_2_id INTEGER NOT NULL,
  relationship_type VARCHAR(100), -- 'sponsors', 'located_near', 'partners_with'
  strength_score FLOAT CHECK (strength_score >= 0 AND strength_score <= 1),
  context_data JSONB DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_1_type, entity_1_id, entity_2_type, entity_2_id, relationship_type)
);

-- Indexes for performance
CREATE INDEX ON hunter_knowledge_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON hunter_knowledge_chunks (source_type, source_id);
CREATE INDEX ON hunter_knowledge_chunks USING GIN (to_tsvector('english', content));

CREATE INDEX ON rag_query_logs (query_intent, created_at);
CREATE INDEX ON rag_query_logs (tool_selected, created_at);
CREATE INDEX ON rag_query_logs (cost_usd, created_at);

CREATE INDEX ON business_partnerships_enhanced (active, partnership_tier);
CREATE INDEX ON business_partnerships_enhanced USING GIN (relevance_categories);

CREATE INDEX ON entity_relationships (entity_1_type, entity_1_id);
CREATE INDEX ON entity_relationships (entity_2_type, entity_2_id);
CREATE INDEX ON entity_relationships (relationship_type, strength_score);

-- Insert default knowledge categories
INSERT INTO knowledge_categories (category_name, description, priority_level, tool_preference) VALUES
('local_business', 'Information about Huntersville businesses', 9, 'sql_query'),
('community_events', 'Upcoming and past community events', 8, 'vector_search'),
('local_government', 'Town council, policies, public services', 7, 'full_document'),
('education', 'Schools, educational programs, youth activities', 8, 'vector_search'),
('recreation', 'Parks, sports, outdoor activities', 6, 'vector_search'),
('real_estate', 'Housing market, development, neighborhoods', 7, 'sql_query'),
('transportation', 'Roads, public transit, traffic updates', 5, 'vector_search'),
('weather_seasonal', 'Weather impacts, seasonal considerations', 4, 'vector_search'),
('historical_context', 'Local history, heritage, traditions', 6, 'full_document'),
('emergency_services', 'Police, fire, medical, safety information', 10, 'full_document');

-- Views for easy querying
CREATE OR REPLACE VIEW active_business_partners AS
SELECT 
  bp.*,
  b.name,
  b.category,
  b.location
FROM business_partnerships_enhanced bp
JOIN businesses b ON bp.business_id = b.id
WHERE bp.active = true AND bp.mention_credits > 0;

CREATE OR REPLACE VIEW rag_performance_summary AS
SELECT 
  DATE(created_at) as date,
  tool_selected,
  COUNT(*) as query_count,
  AVG(execution_time_ms) as avg_execution_time,
  AVG(cost_usd) as avg_cost,
  AVG(quality_score) as avg_quality
FROM rag_query_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), tool_selected
ORDER BY date DESC, query_count DESC;