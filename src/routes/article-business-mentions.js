const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabase');
const logger = require('../utils/logger');

/**
 * @route GET /api/article-business-mentions
 * @desc Get all article-business mention relationships
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { article_id, business_partner_id, limit = 50, offset = 0 } = req.query;
    
    let query = supabaseService.supabase
      .from('article_business_mentions')
      .select(`
        *,
        articles:article_id(id, title, created_at),
        business_partners:business_partner_id(id, name, business_type)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (article_id) {
      query = query.eq('article_id', article_id);
    }
    
    if (business_partner_id) {
      query = query.eq('business_partner_id', business_partner_id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Error fetching article-business mentions:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    logger.error('Error in article-business mentions GET:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/article-business-mentions
 * @desc Create new article-business mention relationship
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    const {
      article_id,
      business_partner_id,
      mention_context,
      relevance_score = 0.5,
      mention_type = 'standard'
    } = req.body;
    
    // Validation
    if (!article_id || !business_partner_id) {
      return res.status(400).json({
        error: 'article_id and business_partner_id are required'
      });
    }
    
    // Check if relationship already exists
    const { data: existing } = await supabaseService.supabase
      .from('article_business_mentions')
      .select('id')
      .eq('article_id', article_id)
      .eq('business_partner_id', business_partner_id)
      .single();
    
    if (existing) {
      return res.status(409).json({
        error: 'Relationship already exists'
      });
    }
    
    const mentionData = {
      article_id,
      business_partner_id,
      mention_context: mention_context?.trim(),
      relevance_score: Math.max(0, Math.min(1, relevance_score)), // Clamp between 0 and 1
      mention_type,
      metadata: {
        created_by: 'n8n-workflow',
        extraction_method: 'ai'
      }
    };
    
    const { data, error } = await supabaseService.supabase
      .from('article_business_mentions')
      .insert([mentionData])
      .select(`
        *,
        articles:article_id(id, title),
        business_partners:business_partner_id(id, name, business_type)
      `)
      .single();
    
    if (error) {
      logger.error('Error creating article-business mention:', error);
      return res.status(400).json({ error: error.message });
    }
    
    logger.info(`New article-business mention created: ${data.id}`);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error in article-business mentions POST:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route PUT /api/article-business-mentions/:id
 * @desc Update article-business mention relationship
 * @access Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      mention_context,
      relevance_score,
      mention_type,
      verified
    } = req.body;
    
    const updateData = {};
    if (mention_context !== undefined) updateData.mention_context = mention_context.trim();
    if (relevance_score !== undefined) {
      updateData.relevance_score = Math.max(0, Math.min(1, relevance_score));
    }
    if (mention_type !== undefined) updateData.mention_type = mention_type;
    if (verified !== undefined) updateData.verified = verified;
    
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabaseService.supabase
      .from('article_business_mentions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        articles:article_id(id, title),
        business_partners:business_partner_id(id, name, business_type)
      `)
      .single();
    
    if (error) {
      logger.error('Error updating article-business mention:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    logger.error('Error in article-business mentions PUT:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route DELETE /api/article-business-mentions/:id
 * @desc Delete article-business mention relationship
 * @access Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseService.supabase
      .from('article_business_mentions')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Error deleting article-business mention:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error in article-business mentions DELETE:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/article-business-mentions/stats
 * @desc Get statistics about article-business mentions
 * @access Public
 */
router.get('/stats', async (req, res) => {
  try {
    // Get total mentions
    const { count: totalMentions } = await supabaseService.supabase
      .from('article_business_mentions')
      .select('*', { count: 'exact', head: true });
    
    // Get mentions by business type
    const { data: mentionsByType } = await supabaseService.supabase
      .from('article_business_mentions')
      .select(`
        business_partners!inner(business_type),
        relevance_score
      `);
    
    // Calculate averages by business type
    const typeStats = {};
    mentionsByType.forEach(mention => {
      const type = mention.business_partners.business_type;
      if (!typeStats[type]) {
        typeStats[type] = { count: 0, totalScore: 0 };
      }
      typeStats[type].count++;
      typeStats[type].totalScore += mention.relevance_score;
    });
    
    // Calculate average scores
    Object.keys(typeStats).forEach(type => {
      typeStats[type].averageScore = typeStats[type].totalScore / typeStats[type].count;
    });
    
    res.json({
      totalMentions,
      mentionsByBusinessType: typeStats,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in article-business mentions stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;