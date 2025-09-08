/**
 * Supabase Database Service
 * Handles all database operations for the Hunter AI GraphRAG system
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Public client for authenticated operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Service client for admin operations (bypasses RLS)
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

class SupabaseService {
  constructor() {
    this.client = supabase;
    this.adminClient = supabaseAdmin;
  }

  // ==================== ARTICLES ====================

  /**
   * Create a new article
   */
  async createArticle(articleData) {
    try {
      const { data, error } = await this.client
        .from('articles')
        .insert([{
          title: articleData.title,
          content: articleData.content,
          hunter_voice_score: articleData.hunter_voice_score || 0,
          quality_score: articleData.quality_score || 0,
          relevance_score: articleData.relevance_score || 0,
          status: articleData.status || 'draft',
          source_url: articleData.source_url,
          source_title: articleData.source_title,
          source_description: articleData.source_description,
          image_url: articleData.image_url,
          image_alt_text: articleData.image_alt_text,
          category: articleData.category,
          tags: articleData.tags || [],
          word_count: articleData.word_count,
          engagement_potential: articleData.engagement_potential
        }])
        .select()
        .single();

      if (error) throw error;
      
      logger.info('Article created successfully', { articleId: data.id });
      return { success: true, data };
    } catch (error) {
      logger.error('Error creating article:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get articles with filtering and pagination
   */
  async getArticles(filters = {}) {
    try {
      let query = this.client
        .from('articles')
        .select(`
          id,
          title,
          content,
          hunter_voice_score,
          quality_score,
          relevance_score,
          status,
          source_url,
          source_title,
          image_url,
          image_alt_text,
          category,
          tags,
          word_count,
          engagement_potential,
          published_at,
          app_published,
          app_published_at,
          social_media_posted,
          created_at,
          updated_at
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.published) {
        query = query.eq('app_published', filters.published);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const offset = (page - 1) * limit;
      
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching articles:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a single article by ID
   */
  async getArticleById(articleId) {
    try {
      const { data, error } = await this.client
        .from('articles')
        .select(`
          *,
          article_business_mentions (
            id,
            mention_type,
            relevance_score,
            context_snippet,
            credits_used,
            approved,
            business_partners (
              id,
              business_name,
              partnership_tier
            )
          )
        `)
        .eq('id', articleId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      logger.error('Error fetching article:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an article
   */
  async updateArticle(articleId, updates) {
    try {
      const { data, error } = await this.client
        .from('articles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Article updated successfully', { articleId });
      return { success: true, data };
    } catch (error) {
      logger.error('Error updating article:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== KNOWLEDGE GRAPH ====================

  /**
   * Create a new entity
   */
  async createEntity(entityData) {
    try {
      const { data, error } = await this.client
        .from('kb_entities')
        .insert([{
          name: entityData.name,
          type: entityData.type,
          description: entityData.description,
          attributes: entityData.attributes || {},
          embedding: entityData.embedding,
          confidence_score: entityData.confidence_score || 0
        }])
        .select()
        .single();

      if (error) throw error;

      logger.info('Entity created successfully', { entityId: data.id });
      return { success: true, data };
    } catch (error) {
      logger.error('Error creating entity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get entities with filtering and search
   */
  async getEntities(filters = {}) {
    try {
      let query = this.client
        .from('kb_entities')
        .select('*');

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      // Vector similarity search if embedding provided
      if (filters.embedding) {
        query = query.rpc('match_entities', {
          query_embedding: filters.embedding,
          match_threshold: filters.threshold || 0.8,
          match_count: filters.limit || 10
        });
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      logger.error('Error fetching entities:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a relationship between entities
   */
  async createRelationship(relationshipData) {
    try {
      const { data, error } = await this.client
        .from('kb_relationships')
        .insert([{
          source_entity_id: relationshipData.source_entity_id,
          target_entity_id: relationshipData.target_entity_id,
          relationship_type: relationshipData.relationship_type,
          strength: relationshipData.strength || 0.5,
          context: relationshipData.context,
          temporal_start: relationshipData.temporal_start,
          temporal_end: relationshipData.temporal_end,
          attributes: relationshipData.attributes || {}
        }])
        .select()
        .single();

      if (error) throw error;

      logger.info('Relationship created successfully', { relationshipId: data.id });
      return { success: true, data };
    } catch (error) {
      logger.error('Error creating relationship:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get relationships for an entity
   */
  async getEntityRelationships(entityId) {
    try {
      const { data, error } = await this.client
        .from('kb_relationships')
        .select(`
          *,
          source_entity:kb_entities!source_entity_id(id, name, type),
          target_entity:kb_entities!target_entity_id(id, name, type)
        `)
        .or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`);

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      logger.error('Error fetching entity relationships:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== BUSINESS PARTNERS ====================

  /**
   * Create a new business partner
   */
  async createBusinessPartner(partnerData) {
    try {
      const { data, error } = await this.client
        .from('business_partners')
        .insert([{
          entity_id: partnerData.entity_id,
          business_name: partnerData.business_name,
          contact_name: partnerData.contact_name,
          contact_email: partnerData.contact_email,
          contact_phone: partnerData.contact_phone,
          partnership_tier: partnerData.partnership_tier || 'bronze',
          monthly_fee: partnerData.monthly_fee,
          mention_credits_total: partnerData.mention_credits_total || 0,
          contract_start_date: partnerData.contract_start_date,
          contract_end_date: partnerData.contract_end_date,
          auto_renewal: partnerData.auto_renewal !== undefined ? partnerData.auto_renewal : true,
          status: partnerData.status || 'active',
          billing_address: partnerData.billing_address || {},
          payment_method: partnerData.payment_method || {},
          notes: partnerData.notes
        }])
        .select()
        .single();

      if (error) throw error;

      logger.info('Business partner created successfully', { partnerId: data.id });
      return { success: true, data };
    } catch (error) {
      logger.error('Error creating business partner:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get business partners with filtering
   */
  async getBusinessPartners(filters = {}) {
    try {
      let query = this.client
        .from('business_partners')
        .select(`
          *,
          kb_entities(id, name, type, description)
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.tier) {
        query = query.eq('partnership_tier', filters.tier);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      logger.error('Error fetching business partners:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update business partner credits
   */
  async updatePartnerCredits(partnerId, creditsUsed) {
    try {
      const { data, error } = await this.client
        .from('business_partners')
        .update({
          mention_credits_used: creditsUsed,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      logger.error('Error updating partner credits:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== CONTENT QUEUE ====================

  /**
   * Add content to processing queue
   */
  async addToContentQueue(contentData) {
    try {
      const { data, error } = await this.client
        .from('content_queue')
        .insert([{
          title: contentData.title,
          description: contentData.description,
          source_url: contentData.source_url,
          relevance_score: contentData.relevance_score,
          local_connections: contentData.local_connections || [],
          business_opportunities: contentData.business_opportunities || []
        }])
        .select()
        .single();

      if (error) throw error;

      logger.info('Content added to queue successfully', { queueId: data.id });
      return { success: true, data };
    } catch (error) {
      logger.error('Error adding content to queue:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending content from queue
   */
  async getPendingContent(limit = 10) {
    try {
      const { data, error } = await this.client
        .from('content_queue')
        .select('*')
        .eq('status', 'pending_processing')
        .order('relevance_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      logger.error('Error fetching pending content:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Health check - test database connection
   */
  async healthCheck() {
    try {
      const { data, error } = await this.client
        .from('articles')
        .select('count', { count: 'exact', head: true });

      if (error) throw error;

      return { success: true, message: 'Database connection healthy' };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const [articles, entities, partners] = await Promise.all([
        this.client.from('articles').select('count', { count: 'exact', head: true }),
        this.client.from('kb_entities').select('count', { count: 'exact', head: true }),
        this.client.from('business_partners').select('count', { count: 'exact', head: true })
      ]);

      return {
        success: true,
        data: {
          articles: articles.count,
          entities: entities.count,
          partners: partners.count,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error fetching database stats:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SupabaseService();
