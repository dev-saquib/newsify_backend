// src/app.js
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const logger = require('./utils/logger');

const config = require('./utils/config');
const SessionService = require('./services/SessionService');
const QueryService = require('./services/QueryService');
const EmbeddingService = require('./services/EmbeddingService');
const RetrievalService = require('./services/RetrievalService');
const GeminiService = require('./services/GeminiService');
const { createSession, getSessionHistory, postQuery, deleteSession } = require('./controllers/SessionController');
const { healthCheck } = require('./controllers/HealthController');

const app = express();

// Middleware
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
async function initializeServices() {
  const redisClient = createClient({ url: config.redis.url });
  await redisClient.connect();
  
  const pool = new Pool({ connectionString: config.postgres.url });
  
  const openai = require('./utils/openai');
  
  const embeddingService = new EmbeddingService(openai);
  const geminiService = new GeminiService(openai);
  const sessionService = new SessionService(redisClient, config.redis.sessionTtl);
  const retrievalService = new RetrievalService(pool, redisClient, config.retrieval.similarityThreshold, config.redis.cacheTtl);
  const queryService = new QueryService(embeddingService, retrievalService, geminiService, sessionService);
  
  // Attach services to app for access in controllers
  app.set('redisClient', redisClient);
  app.set('pool', pool);
  app.set('sessionService', sessionService);
  app.set('queryService', queryService);
  app.set('logger', logger);
  
  return { redisClient, pool };
}

// Routes
app.post('/session', createSession);
app.get('/session/:id/history', getSessionHistory);
app.post('/session/:id/query', postQuery);
app.delete('/session/:id', deleteSession);
app.get('/health', healthCheck);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = { app, initializeServices };