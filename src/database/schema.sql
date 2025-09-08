-- Hunter AI Enhanced GraphRAG System Database Schema
-- Based on functional specification document

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Create custom types
CREATE TYPE article_status AS ENUM ('draft', 'pending_review', 'approved', 'published', 'archived');
CREATE TYPE article_category AS ENUM ('breaking_news', 'community_events', 'business', 'government', 'schools', 'development', 'lifestyle', 'weather', 'traffic');
CREATE TYPE entity_type AS ENUM ('person', 'business', 'location', 'event', 'organization', 'service', 'infrastructure', 'historical_site', 'natural_feature');
CREATE TYPE relationship_type AS ENUM ('owns', 'works_at', 'partners_with', 'competes_with', 'supplies_to', 'located_in', 'serves', 'sponsors', 'organizes', 'attends', 'related_to', 'depends_on', 'impacts', 'historical_connection');
CREATE TYPE partnership_tier AS ENUM ('bronze', 'silver', 'gold');
CREATE TYPE partner_status AS ENUM ('active', 'paused', 'cancelled', 'pending');
CREATE TYPE mention_type AS ENUM ('natural', 'sponsored', 'promotional', 'informational');

-- Articles table
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    hunter_voice_score DECIMAL(3,2) DEFAULT 0.00,
    quality_score DECIMAL(3,2) DEFAULT 0.00,
    relevance_score DECIMAL(3,2) DEFAULT 0.00,
    status article_status DEFAULT 'draft',
    source_url TEXT,
    source_title TEXT,
    source_description TEXT,
    image_url TEXT,
    image_alt_text TEXT,
    category article_category,
    tags TEXT[],
    word_count INTEGER,
    engagement_potential DECIMAL(3,2),
    published_at TIMESTAMP WITH TIME ZONE,
    app_published BOOLEAN DEFAULT FALSE,
    app_published_at TIMESTAMP WITH TIME ZONE,
    social_media_posted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Knowledge Base Entities
CREATE TABLE kb_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type entity_type NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '{}',
    embedding VECTOR(1536), -- OpenAI embedding dimension
    confidence_score DECIMAL(3,2) DEFAULT 0.00,
    last_verified TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Entity Relationships
CREATE TABLE kb_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_entity_id UUID NOT NULL REFERENCES kb_entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES kb_entities(id) ON DELETE CASCADE,
    relationship_type relationship_type NOT NULL,
    strength DECIMAL(3,2) DEFAULT 0.50,
    context TEXT,
    temporal_start DATE,
    temporal_end DATE,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_entity_id, target_entity_id, relationship_type)
);

-- Business Partners
CREATE TABLE business_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES kb_entities(id),
    business_name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    partnership_tier partnership_tier DEFAULT 'bronze',
    monthly_fee DECIMAL(10,2),
    mention_credits_total INTEGER DEFAULT 0,
    mention_credits_used INTEGER DEFAULT 0,
    mention_credits_remaining INTEGER GENERATED ALWAYS AS (mention_credits_total - mention_credits_used) STORED,
    contract_start_date DATE,
    contract_end_date DATE,
    auto_renewal BOOLEAN DEFAULT TRUE,
    status partner_status DEFAULT 'active',
    billing_address JSONB,
    payment_method JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article Business Mentions
CREATE TABLE article_business_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    business_partner_id UUID NOT NULL REFERENCES business_partners(id) ON DELETE CASCADE,
    mention_type mention_type DEFAULT 'natural',
    relevance_score DECIMAL(3,2),
    context_snippet TEXT,
    credits_used INTEGER DEFAULT 1,
    approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Queue (for workflow processing)
CREATE TABLE content_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    source_url TEXT,
    relevance_score DECIMAL(3,2),
    local_connections JSONB DEFAULT '[]',
    business_opportunities JSONB DEFAULT '[]',
    status TEXT DEFAULT 'pending_processing',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
-- Articles
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_quality_score ON articles(quality_score DESC);

-- Knowledge Base
CREATE INDEX idx_kb_entities_embedding ON kb_entities USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_kb_entities_type ON kb_entities(type);
CREATE INDEX idx_kb_entities_confidence ON kb_entities(confidence_score DESC);

-- Relationships
CREATE INDEX idx_kb_relationships_source ON kb_relationships(source_entity_id);
CREATE INDEX idx_kb_relationships_target ON kb_relationships(target_entity_id);
CREATE INDEX idx_kb_relationships_type ON kb_relationships(relationship_type);
CREATE INDEX idx_kb_relationships_strength ON kb_relationships(strength DESC);

-- Business Partners
CREATE INDEX idx_business_partners_tier ON business_partners(partnership_tier);
CREATE INDEX idx_business_partners_status ON business_partners(status);
CREATE INDEX idx_business_partners_credits ON business_partners(mention_credits_remaining DESC);

-- Mentions
CREATE INDEX idx_mentions_article ON article_business_mentions(article_id);
CREATE INDEX idx_mentions_business ON article_business_mentions(business_partner_id);
CREATE INDEX idx_mentions_approved ON article_business_mentions(approved);

-- Content Queue
CREATE INDEX idx_content_queue_status ON content_queue(status);
CREATE INDEX idx_content_queue_relevance ON content_queue(relevance_score DESC);
CREATE INDEX idx_content_queue_created ON content_queue(created_at);

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_business_mentions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (to be expanded based on user roles)
CREATE POLICY "Articles are viewable by authenticated users" ON articles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Articles are editable by content managers" ON articles
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'content_manager', 'editor')
    );
