const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * @route POST /api/webhooks/trigger-article-generation
 * @desc Webhook endpoint to trigger article generation workflow
 * @access Public
 */
router.post('/trigger-article-generation', async (req, res) => {
  try {
    const { content_id } = req.body;
    
    if (!content_id) {
      return res.status(400).json({
        error: 'content_id is required'
      });
    }
    
    logger.info(`Article generation triggered for content: ${content_id}`);
    
    // In a real implementation, this would trigger the n8n workflow
    // For now, we'll just log and return success
    // The n8n workflow will handle the actual article generation
    
    res.json({
      message: 'Article generation workflow triggered',
      content_id,
      status: 'triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in trigger-article-generation webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/webhooks/trigger-business-mentions
 * @desc Webhook endpoint to trigger business mentions extraction workflow
 * @access Public
 */
router.post('/trigger-business-mentions', async (req, res) => {
  try {
    const { article_id } = req.body;
    
    if (!article_id) {
      return res.status(400).json({
        error: 'article_id is required'
      });
    }
    
    logger.info(`Business mentions extraction triggered for article: ${article_id}`);
    
    // In a real implementation, this would trigger the n8n workflow
    // For now, we'll just log and return success
    // The n8n workflow will handle the actual business mention extraction
    
    res.json({
      message: 'Business mentions workflow triggered',
      article_id,
      status: 'triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in trigger-business-mentions webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/webhooks/n8n-health
 * @desc Health check endpoint for n8n workflows
 * @access Public
 */
router.post('/n8n-health', async (req, res) => {
  try {
    const { workflow_name, execution_id, status } = req.body;
    
    logger.info(`n8n workflow health check: ${workflow_name} - ${status}`);
    
    res.json({
      message: 'Health check received',
      workflow_name,
      execution_id,
      status,
      api_status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in n8n-health webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/webhooks/article-published
 * @desc Webhook to handle article publication events
 * @access Public
 */
router.post('/article-published', async (req, res) => {
  try {
    const { article_id, publication_url, published_at } = req.body;
    
    if (!article_id) {
      return res.status(400).json({
        error: 'article_id is required'
      });
    }
    
    logger.info(`Article published: ${article_id} at ${publication_url}`);
    
    // Here you could trigger additional workflows:
    // - Social media posting
    // - Analytics tracking
    // - Partner notifications
    
    res.json({
      message: 'Article publication processed',
      article_id,
      publication_url,
      published_at,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in article-published webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;