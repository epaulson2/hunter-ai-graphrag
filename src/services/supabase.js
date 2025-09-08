// src/services/supabase.js
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class SupabaseService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    // Client for general operations (respects RLS)
    this.client = createClient(this.supabaseUrl, this.supabaseAnonKey);
    
    // Admin client for service operations (bypasses RLS)
    this.adminClient = this.supabaseServiceKey 
      ? createClient(this.supabaseUrl, this.supabaseServiceKey)
      : this.client;

    logger.info('Supabase service initialized');
  }

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await this.client
        .from('articles')
        .select('count', { count: 'exact', head: true });
      
      if (error) throw error;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('Supabase health check failed:', error);
      throw new Error('Supabase connection failed');
    }
  }

  // ==================== ARTICLES ====================
  
  async getArticles(filters = {}) {
    try {
      let query = this.client
        .from('articles')
        .select(`
          id,
          title,
          content,
          summary,
          publication_status,
          hunter_voice_score,
          quality_score,
          publication_date,
          view_count,
          engagement_score,
          created_at,
          updated_at
        `)
        .eq('publication_status', 'published')
        .order('publication_date', { ascending: false });

      // Apply filters
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.search) {
        query = query.textSearch('title,content', filters.search);
      }
      
      if (filters.minScore) {
        query = query.gte('hunter_voice_score', filters.minScore);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      logger.info(`Retrieved ${data.length} articles`);
      return data;
    } catch (error) {
      logger.error('Error fetching articles:', error);
      throw error;
    }
  }

  async getArticleById(id) {
    try {
      const { data, error } = await this.client
        .from('articles')
        .select(`
          *,
          article_business_mentions (
            id,
            mention_text,
            relevance_score,
            credits_used,
            business_partners (
              id,
              business_name,
              partnership_tier
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Article not found');

      // Increment view count
      await this.incrementViewCount(id);

      logger.info(`Retrieved article ${id}`);
      return data;
    } catch (error) {
      logger.error(`Error fetching article ${id}:`, error);
      throw error;
    }
  }

  async createArticle(articleData) {
    try {
      const { data, error } = await this.adminClient
        .from('articles')
        .insert([{
          title: articleData.title,
          content: articleData.content,
          summary: articleData.summary,
          publication_status: articleData.publication_status || 'draft',
          hunter_voice_score: articleData.hunter_voice_score || 0,
          quality_score: articleData.quality_score || 0,
          publication_date: articleData.publication_date,
          metadata: articleData.metadata || {}
        }])
        .select()
        .single();

      if (error) throw error;

      logger.info(`Created article: ${data.id}`);
      return data;
    } catch (error) {
      logger.error('Error creating article:', error);
      throw error;
    }
  }

  async updateArticle(id, updates) {
    try {
      const { data, error } = await this.adminClient
        .from('articles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logger.info(`Updated article: ${id}`);
      return data;
    } catch (error) {
      logger.error(`Error updating article ${id}:`, error);
      throw error;
    }
  }

  async incrementViewCount(articleId) {
    try {
      const { error } = await this.client
        .from('articles')
        .update({ 
          view_count: this.client.raw('view_count + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId);

      if (error) throw error;
    } catch (error) {
      logger.error(`Error incrementing view count for article ${articleId}:`, error);
      // Don't throw - this is a non-critical operation
    }
  }

  // ==================== KNOWLEDGE GRAPH ====================

  async getEntities(filters = {}) {
    try {
      let query = this.client
        .from('kb_entities')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.type) {
        query = query.eq('entity_type', filters.type);
      }
      
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      logger.info(`Retrieved ${data.length} entities`);
      return data;
    } catch (error) {
      logger.error('Error fetching entities:', error);
      throw error;
    }
  }

  async createEntity(entityData) {
    try {
      const { data, error } = await this.adminClient
        .from('kb_entities')
        .insert([{
          name: entityData.name,
          entity_type: entityData.entity_type,
          description: entityData.description,
          properties: entityData.properties || {},
          embedding: entityData.embedding
        }])
        .select()
        .single();

      if (error) throw error;

      logger.info(`Created entity: ${data.id} (${data.name})`);
      return data;
    } catch (error) {
      logger.error('Error creating entity:', error);
      throw error;
    }
  }

  async getRelationships(entityId = null) {
    try {
      let query = this.client
        .from('kb_relationships')
        .select(`
          *,
          source_entity:source_entity_id(id, name, entity_type),
          target_entity:target_entity_id(id, name, entity_type)
        `);

      if (entityId) {
        query = query.or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      logger.info(`Retrieved ${data.length} relationships`);
      return data;
    } catch (error) {
      logger.error('Error fetching relationships:', error);
      throw error;
    }
  }

  // ==================== BUSINESS PARTNERS ====================

  async getBusinessPartners(filters = {}) {
    try {
      let query = this.client
        .from('business_partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.tier) {
        query = query.eq('partnership_tier', filters.tier);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      logger.info(`Retrieved ${data.length} business partners`);
      return data;
    } catch (error) {
      logger.error('Error fetching business partners:', error);
      throw error;
    }
  }

  async getPartnerCredits(partnerId) {
    try {
      const { data, error } = await this.client
        .from('business_partners')
        .select('credits_remaining, credits_purchased, monthly_allowance')
        .eq('id', partnerId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Partner not found');

      logger.info(`Retrieved credits for partner ${partnerId}`);
      return data;
    } catch (error) {
      logger.error(`Error fetching partner credits ${partnerId}:`, error);
      throw error;
    }
  }

  async deductPartnerCredits(partnerId, amount, description) {
    try {
      const { data, error } = await this.adminClient
        .from('business_partners')
        .update({ 
          credits_remaining: this.adminClient.raw(`credits_remaining - ${amount}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId)
        .select()
        .single();

      if (error) throw error;

      // Log the credit usage
      await this.logCreditUsage(partnerId, amount, description);

      logger.info(`Deducted ${amount} credits from partner ${partnerId}`);
      return data;
    } catch (error) {
      logger.error(`Error deducting credits for partner ${partnerId}:`, error);
      throw error;
    }
  }

  async logCreditUsage(partnerId, amount, description) {
    try {
      const { error } = await this.adminClient
        .from('credit_usage_log')
        .insert([{
          partner_id: partnerId,
          credits_used: amount,
          description: description,
          timestamp: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      logger.error('Error logging credit usage:', error);
      // Don't throw - this is logging only
    }
  }

  // ==================== ANALYTICS ====================

  async getSystemMetrics() {
    try {
      const [articlesResult, partnersResult, entitiesResult] = await Promise.all([
        this.client.from('articles').select('count', { count: 'exact', head: true }),
        this.client.from('business_partners').select('count', { count: 'exact', head: true }),
        this.client.from('kb_entities').select('count', { count: 'exact', head: true })
      ]);

      const metrics = {
        total_articles: articlesResult.count || 0,
        total_partners: partnersResult.count || 0,
        total_entities: entitiesResult.count || 0,
        timestamp: new Date().toISOString()
      };

      logger.info('Retrieved system metrics');
      return metrics;
    } catch (error) {
      logger.error('Error fetching system metrics:', error);
      throw error;
    }
  }

  async getArticleAnalytics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.client
        .from('articles')
        .select('hunter_voice_score, quality_score, view_count, engagement_score, publication_date')
        .gte('publication_date', startDate.toISOString())
        .eq('publication_status', 'published');

      if (error) throw error;

      const analytics = {
        total_articles: data.length,
        avg_hunter_score: data.reduce((sum, a) => sum + (a.hunter_voice_score || 0), 0) / data.length || 0,
        avg_quality_score: data.reduce((sum, a) => sum + (a.quality_score || 0), 0) / data.length || 0,
        total_views: data.reduce((sum, a) => sum + (a.view_count || 0), 0),
        avg_engagement: data.reduce((sum, a) => sum + (a.engagement_score || 0), 0) / data.length || 0,
        period_days: days
      };

      logger.info(`Retrieved analytics for ${days} days`);
      return analytics;
    } catch (error) {
      logger.error('Error fetching article analytics:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseService();