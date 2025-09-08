const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const supabaseService = require('../services/supabase');

// GET /api/articles - Get published articles
router.get('/', async (req, res) => {
  try {
    const {
      limit = 20,
      page = 1,
      category,
      status = 'published',
      published = true,
      sortBy = 'published_at',
      sortOrder = 'desc'
    } = req.query;

    logger.info('Fetching articles', { 
      limit: parseInt(limit), 
      page: parseInt(page), 
      category, 
      status,
      published
    });

    const filters = {
      limit: parseInt(limit),
      page: parseInt(page),
      category,
      status,
      published: published === 'true',
      sortBy,
      sortOrder
    };

    const result = await supabaseService.getArticles(filters);

    if (!result.success) {
      logger.error('Failed to fetch articles:', result.error);
      return res.status(500).json({ 
        error: 'Failed to fetch articles',
        details: result.error 
      });
    }

    res.json({
      success: true,
      articles: result.data || [],
      pagination: result.pagination,
      total: result.pagination?.total || 0,
      has_more: result.pagination ? result.pagination.page < result.pagination.pages : false
    });

  } catch (error) {
    logger.error('Error fetching articles:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /api/articles/:id - Get specific article
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('Fetching article', { id });

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: 'Invalid article ID format',
        message: 'Article ID must be a valid UUID'
      });
    }

    const result = await supabaseService.getArticleById(id);

    if (!result.success) {
      if (result.error.includes('No rows returned')) {
        return res.status(404).json({
          error: 'Article not found',
          message: `No article found with ID: ${id}`
        });
      }
      
      logger.error('Failed to fetch article:', result.error);
      return res.status(500).json({ 
        error: 'Failed to fetch article',
        details: result.error 
      });
    }

    res.json({
      success: true,
      article: result.data
    });

  } catch (error) {
    logger.error('Error fetching article:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// POST /api/articles - Create article (admin only)
router.post('/', async (req, res) => {
  try {
    const articleData = req.body;
    
    // Basic validation
    if (!articleData.title || !articleData.content) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title and content are required'
      });
    }

    // Validate category if provided
    const validCategories = [
      'breaking_news', 'community_events', 'business', 'government', 
      'schools', 'development', 'lifestyle', 'weather', 'traffic'
    ];
    
    if (articleData.category && !validCategories.includes(articleData.category)) {
      return res.status(400).json({
        error: 'Invalid category',
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    // Calculate word count if not provided
    if (!articleData.word_count && articleData.content) {
      articleData.word_count = articleData.content.trim().split(/\s+/).length;
    }

    logger.info('Creating article', { 
      title: articleData.title,
      category: articleData.category,
      word_count: articleData.word_count
    });

    const result = await supabaseService.createArticle(articleData);

    if (!result.success) {
      logger.error('Failed to create article:', result.error);
      return res.status(500).json({ 
        error: 'Failed to create article',
        details: result.error 
      });
    }

    logger.info('Article created successfully', { 
      articleId: result.data.id,
      title: result.data.title 
    });

    res.status(201).json({
      success: true,
      article: result.data,
      message: 'Article created successfully'
    });

  } catch (error) {
    logger.error('Error creating article:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// PUT /api/articles/:id - Update article (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: 'Invalid article ID format',
        message: 'Article ID must be a valid UUID'
      });
    }

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;

    // Update word count if content changed
    if (updates.content && !updates.word_count) {
      updates.word_count = updates.content.trim().split(/\s+/).length;
    }

    logger.info('Updating article', { id, updates: Object.keys(updates) });

    const result = await supabaseService.updateArticle(id, updates);

    if (!result.success) {
      if (result.error.includes('No rows returned')) {
        return res.status(404).json({
          error: 'Article not found',
          message: `No article found with ID: ${id}`
        });
      }
      
      logger.error('Failed to update article:', result.error);
      return res.status(500).json({ 
        error: 'Failed to update article',
        details: result.error 
      });
    }

    res.json({
      success: true,
      article: result.data,
      message: 'Article updated successfully'
    });

  } catch (error) {
    logger.error('Error updating article:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /api/articles/stats - Get article statistics
router.get('/stats/overview', async (req, res) => {
  try {
    logger.info('Fetching article statistics');

    const result = await supabaseService.getStats();

    if (!result.success) {
      logger.error('Failed to fetch statistics:', result.error);
      return res.status(500).json({ 
        error: 'Failed to fetch statistics',
        details: result.error 
      });
    }

    res.json({
      success: true,
      stats: result.data
    });

  } catch (error) {
    logger.error('Error fetching statistics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;
