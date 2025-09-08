-- Hunter AI Conditional Foundation Schema
-- Creates only missing tables, works with existing schema

-- Create businesses table only if it doesn't exist
CREATE TABLE IF NOT EXISTS businesses (
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

-- Create events table only if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
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

-- Skip articles table since it already exists

-- Create content_queue table only if it doesn't exist
CREATE TABLE IF NOT EXISTS content_queue (
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

-- Add indexes only if they don't exist (PostgreSQL will skip if they exist)
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses (category);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses (active);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_events_type_date ON events (event_type, start_date);
CREATE INDEX IF NOT EXISTS idx_events_active_date ON events (active, start_date);

CREATE INDEX IF NOT EXISTS idx_articles_type_status ON articles (article_type, status);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles (published_at);

CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue (status, priority);
CREATE INDEX IF NOT EXISTS idx_content_queue_scheduled ON content_queue (scheduled_for);

-- Insert sample data only if tables are empty
INSERT INTO businesses (name, category, description, address, active) 
SELECT * FROM (VALUES 
  ('Main Street Diner', 'restaurant', 'Family-owned diner serving classic American fare', '123 Main St, Huntersville, NC', true),
  ('Lake Norman Brewing', 'restaurant', 'Local brewery with craft beers and outdoor seating', '456 Brewery Ln, Huntersville, NC', true),
  ('Huntersville Hardware', 'retail', 'Local hardware store serving the community since 1985', '789 Commerce Dr, Huntersville, NC', true),
  ('Quiet Corner Café', 'restaurant', 'Cozy coffee shop perfect for reading and meetings', '321 Oak St, Huntersville, NC', true),
  ('Town Center Fitness', 'service', 'Full-service gym with personal training', '654 Fitness Way, Huntersville, NC', true)
) AS t(name, category, description, address, active)
WHERE NOT EXISTS (SELECT 1 FROM businesses LIMIT 1);

INSERT INTO events (name, description, event_type, start_date, end_date, location, organizer, active) 
SELECT * FROM (VALUES 
  ('Fall Festival', 'Annual autumn celebration with food, music, and family activities', 'festival', '2025-10-15 10:00:00'::timestamp, '2025-10-15 22:00:00'::timestamp, 'Town Square', 'Huntersville Parks & Recreation', true),
  ('Town Council Meeting', 'Monthly public meeting', 'meeting', '2025-09-20 19:00:00'::timestamp, '2025-09-20 21:00:00'::timestamp, 'Town Hall', 'Huntersville Town Council', true),
  ('Community 5K Run', 'Annual charity run benefiting local schools', 'sports', '2025-11-02 08:00:00'::timestamp, '2025-11-02 12:00:00'::timestamp, 'Community Park', 'Huntersville Running Club', true)
) AS t(name, description, event_type, start_date, end_date, location, organizer, active)
WHERE NOT EXISTS (SELECT 1 FROM events LIMIT 1);

-- Sample content queue entries
INSERT INTO content_queue (title, content_preview, source_type, priority, status) 
SELECT * FROM (VALUES 
  ('Local Business Spotlight: Main Street Diner', 'Feature story about the history and community impact of Main Street Diner', 'manual', 7, 'pending'),
  ('Fall Festival Preview: What to Expect', 'Guide to the upcoming Fall Festival including vendors, activities, and parking', 'manual', 8, 'pending'),
  ('New Development Update', 'Progress report on the new residential development near Town Center', 'manual', 6, 'pending')
) AS t(title, content_preview, source_type, priority, status)
WHERE NOT EXISTS (SELECT 1 FROM content_queue LIMIT 1);