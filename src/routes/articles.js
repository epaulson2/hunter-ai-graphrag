const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// GET /api/articles - Get published articles
router.get('/', async (req, res) => {
  try {
    const {
      limit = 20,
      offset = 0,
      category,
      since
    } = req.query;

    // TODO: Implement Supabase query
    logger.info('Fetching articles', { limit, offset, category, since });
    
    res.json({
      articles: [],
      total: 0,
      has_more: false,
      message: 'Articles endpoint - implementation pending'
    });
  } catch (error) {
    logger.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// GET /api/articles/:id - Get specific article
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('Fetching article', { id });
    
    // TODO: Implement Supabase query
    res.json({
      article: null,
      message: 'Article detail endpoint - implementation pending'
    });
  } catch (error) {
    logger.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// POST /api/articles - Create article (admin only)
router.post('/', async (req, res) => {
  try {
    const articleData = req.body;
    
    logger.info('Creating article', { title: articleData.title });
    
    // TODO: Implement article creation logic
    res.status(201).json({
      article: null,
      message: 'Article creation endpoint - implementation pending'
    });
  } catch (error) {
    logger.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

module.exports = router;
