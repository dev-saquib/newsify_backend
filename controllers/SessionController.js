// src/controllers/SessionController.js
const { v4: uuidv4 } = require('uuid');
const { querySchema, sessionSchema } = require('../utils/validation');

async function createSession(req, res) {
  try {
    const sessionService = req.app.get('sessionService');
    const { sessionId } = await sessionService.createSession();
    res.status(201).json({ id });
  } catch (error) {
    const logger = req.app.get('logger');
    logger.error('Session creation failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getSessionHistory(req, res) {
  try {
    const { id } = req.params;
    const { error } = sessionSchema.validate({ id });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const sessionService = req.app.get('sessionService');
    const history = await sessionService.getSessionHistory(id);
    res.json({ history });
  } catch (error) {
    const logger = req.app.get('logger');
    logger.error('History retrieval failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function postQuery(req, res) {
  try {
    const { id } = req.params;
    const { query, k = 5 } = req.body;
    
    // Input validation
    const { error } = querySchema.validate({ query, k });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const queryService = req.app.get('queryService');
    const result = await queryService.handleQuery(id, query, k);
    
    res.json({
      messageId: result.messageId,
      response: result.response,
      sources: result.sources
    });
  } catch (error) {
    const logger = req.app.get('logger');
    logger.error('Query processing failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteSession(req, res) {
  try {
    const { id } = req.params;
    const { error } = sessionSchema.validate({ id });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const sessionService = req.app.get('sessionService');
    await sessionService.clearSession(id);

    res.send({
      message: 'Session deleted successfully'
    });
  } catch (error) {
    const logger = req.app.get('logger');
    logger.error('Session deletion failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { createSession, getSessionHistory, postQuery, deleteSession };