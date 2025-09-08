-- Hunter AI Foundation Schema
-- Run this FIRST to create the base tables needed for the agentic RAG system

-- Core businesses table
CREATE TABLE businesses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  address TEXT,
  phone VARCHAR(20),
  website VARCHAR(255),
  location POINT, -- For geospatial queries
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table for community events
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(100), -- 'festival', 'meeting', 'sports', etc.
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  organizer VARCHAR(255),
  website VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles table for content management
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  article_type VARCHAR(100), -- 'news', 'event', 'business_spotlight'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  author VARCHAR(255),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content queue for RSS and workflow management
CREATE TABLE content_queue (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500),
  source_url VARCHAR(1000),
  content_preview TEXT,
  source_type VARCHAR(100), -- 'rss', 'manual', 'scheduled'
  priority INTEGER DEFAULT 5, -- 1-10, higher = more urgent
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  scheduled_for TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX ON businesses (category);
CREATE INDEX ON businesses (active);
CREATE INDEX ON businesses USING GIST (location);

CREATE INDEX ON events (event_type, start_date);
CREATE INDEX ON events (active, start_date);

CREATE INDEX ON articles (article_type, status);
CREATE INDEX ON articles (published_at);

CREATE INDEX ON content_queue (status, priority);
CREATE INDEX ON content_queue (scheduled_for);

-- Insert sample data for testing
INSERT INTO businesses (name, category, description, address, active) VALUES
('Main Street Diner', 'restaurant', 'Family-owned diner serving classic American fare', '123 Main St, Huntersville, NC', true),
('Lake Norman Brewing', 'restaurant', 'Local brewery with craft beers and outdoor seating', '456 Brewery Ln, Huntersville, NC', true),
('Huntersville Hardware', 'retail', 'Local hardware store serving the community since 1985', '789 Commerce Dr, Huntersville, NC', true),
('Quiet Corner Café', 'restaurant', 'Cozy coffee shop perfect for reading and meetings', '321 Oak St, Huntersville, NC', true),
('Town Center Fitness', 'service', 'Full-service gym with personal training', '654 Fitness Way, Huntersville, NC', true);

INSERT INTO events (name, description, event_type, start_date, end_date, location, organizer, active) VALUES
('Fall Festival', 'Annual autumn celebration with food, music, and family activities', 'festival', '2025-10-15 10:00:00', '2025-10-15 22:00:00', 'Town Square', 'Huntersville Parks & Recreation', true),
('Town Council Meeting', 'Monthly public meeting', 'meeting', '2025-09-20 19:00:00', '2025-09-20 21:00:00', 'Town Hall', 'Huntersville Town Council', true),
('Community 5K Run', 'Annual charity run benefiting local schools', 'sports', '2025-11-02 08:00:00', '2025-11-02 12:00:00', 'Community Park', 'Huntersville Running Club', true);

-- Sample content queue entries
INSERT INTO content_queue (title, content_preview, source_type, priority, status) VALUES
('Local Business Spotlight: Main Street Diner', 'Feature story about the history and community impact of Main Street Diner', 'manual', 7, 'pending'),
('Fall Festival Preview: What to Expect', 'Guide to the upcoming Fall Festival including vendors, activities, and parking', 'manual', 8, 'pending'),
('New Development Update', 'Progress report on the new residential development near Town Center', 'manual', 6, 'pending');