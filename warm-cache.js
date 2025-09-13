require('dotenv').config();
const { createClient } = require('redis');
const { Pool } = require('pg');

const config = require('./utils/config');
const logger = require('./utils/logger');
const RetrievalService = require('./services/RetrievalService');

const openai = require('./utils/openai');
const redisClient = createClient({ url: config.redis.url });
const pool = new Pool({ connectionString: config.postgres.url });

const commonQuestions = [
  "What are the latest developments in technology?",
  "What's happening in politics today?",
  "What are the top business news stories?",
  "What sports events are happening this week?",
  "What's new in science and health?",
  "What are the current entertainment news?",
  "What's the latest international news?",
  "What are the trending topics today?"
];

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'gemini-embedding-001',
      input: text,
      encoding_format: 'float',
      dimensions: 1536
    });

    return response.data[0].embedding;
  } catch (error) {
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

async function warmCache() {
  try {
    await redisClient.connect();
    const retrievalService = new RetrievalService(pool, redisClient, config.retrieval.similarityThreshold, config.redis.cacheTtl);

    logger.info('Starting cache warming process');

    for (const question of commonQuestions) {
      try {
        logger.info(`Warming cache for: ${question}`);
        const embedding = await generateEmbedding(question);
        await retrievalService.retrieveRelevantChunks(question, embedding, 5);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Failed to warm cache for question: ${question}`, { error: error.message });
      }
    }

    logger.info('Cache warming completed');
  } catch (error) {
    logger.error('Cache warming failed', { error: error.message });
    process.exit(1);
  } finally {
    await redisClient.quit();
    await pool.end();
  }
}

warmCache();