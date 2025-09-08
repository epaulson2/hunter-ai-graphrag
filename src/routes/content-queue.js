const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabase');
const logger = require('../utils/logger');

/**
 * @route GET /api/content-queue
 * @desc Get all content queue items
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = supabaseService.supabase
      .from('content_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Error fetching content queue:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    logger.error('Error in content queue GET:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/content-queue/:id
 * @desc Get specific content queue item
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseService.supabase
      .from('content_queue')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error('Error fetching content queue item:', error);
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json(data);
  } catch (error) {
    logger.error('Error in content queue GET by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/content-queue
 * @desc Add new content to queue
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      content,
      source_url,
      source_type = 'rss',
      priority = 'medium',
      scheduled_for = null
    } = req.body;
    
    // Validation
    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required'
      });
    }
    
    const contentData = {
      title: title.trim(),
      content: content.trim(),
      source_url,
      source_type,
      priority,
      status: 'pending',
      scheduled_for,
      metadata: {
        word_count: content.trim().split(/\s+/).length,
        added_by: 'n8n-workflow'
      }
    };
    
    const { data, error } = await supabaseService.supabase
      .from('content_queue')
      .insert([contentData])
      .select()
      .single();
    
    if (error) {
      logger.error('Error creating content queue item:', error);
      return res.status(400).json({ error: error.message });
    }
    
    logger.info(`New content added to queue: ${data.id}`);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error in content queue POST:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route PUT /api/content-queue/:id
 * @desc Update content queue item
 * @access Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, scheduled_for, processed_at } = req.body;
    
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (scheduled_for !== undefined) updateData.scheduled_for = scheduled_for;
    if (processed_at !== undefined) updateData.processed_at = processed_at;
    
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabaseService.supabase
      .from('content_queue')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating content queue item:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    logger.error('Error in content queue PUT:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route DELETE /api/content-queue/:id
 * @desc Delete content queue item
 * @access Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseService.supabase
      .from('content_queue')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Error deleting content queue item:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error in content queue DELETE:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;