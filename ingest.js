require('dotenv').config();
const Parser = require('rss-parser');
const { Pool } = require('pg');
const { chunkText } = require('./utils/chunking');

const config = require('./utils/config');
const logger = require('./utils/logger');

const pool = new Pool({ connectionString: config.postgres.url });

const parser = new Parser();

async function fetchNewsFromRSS(rssUrls) {
  const newsItems = [];

  for (const url of rssUrls) {
    try {
      const feed = await parser.parseURL(url);

      for (const item of feed.items) {
        newsItems.push({
          title: item.title,
          content: item.contentSnippet || item.content || '',
          url: item.link,
          published: item.pubDate ? new Date(item.pubDate) : new Date()
        });
      }
    } catch (error) {
      logger.error(`Failed to fetch RSS from ${url}`, { error: error.message });
    }
  }

  return newsItems;
}

const openai = require('./utils/openai');
async function generateEmbeddings(texts) {
  try {
    const response = await openai.embeddings.create({
      model: 'gemini-embedding-001',
      input: texts,
      encoding_format: 'float',
      dimensions: 1536
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    throw new Error(`Embeddings generation failed: ${error.message}`);
  }
}

async function main() {
  logger.info('Starting news ingestion process');

  // 1. Fetch news from RSS feeds
  const rssUrls = [
    'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    'http://feeds.bbci.co.uk/news/rss.xml'
  ];

  const newsItems = await fetchNewsFromRSS(rssUrls);
  logger.info(`Fetched ${newsItems.length} news items`);

  // 2. Chunk articles into passages
  const chunkedNews = [];
  for (const item of newsItems) {
    const chunks = chunkText(item.content, {
      chunkSize: 500,
      overlap: 50
    });

    chunks.forEach((content, index) => {
      chunkedNews.push({
        title: item.title,
        content: content,
        url: item.url,
        chunkIndex: index,
        published: item.published
      });
    });
  }

  logger.info(`Created ${chunkedNews.length} chunks from news items`);

  // 3. Generate embeddings in batches
  const batchSize = 10;
  const batches = [];

  for (let i = 0; i < chunkedNews.length; i += batchSize) {
    batches.push(chunkedNews.slice(i, i + batchSize));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const texts = batch.map(chunk => chunk.content);

    logger.info(`Processing batch ${i + 1}/${batches.length}`);
    const embeddings = await generateEmbeddings(texts);

    // Add embeddings to chunks
    batch.forEach((chunk, index) => {
      chunk.embedding = embeddings[index];
    });
  }

  // 4. Store in vector database
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const chunk of chunkedNews) {
      await client.query(
        `INSERT INTO news_chunks (title, content, url, chunk_index, embedding, published)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (url, chunk_index) DO UPDATE SET
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           embedding = EXCLUDED.embedding,
           published = EXCLUDED.published`,
        [chunk.title, chunk.content, chunk.url, chunk.chunkIndex, JSON.stringify(chunk.embedding), chunk.published]
      );
    }

    await client.query('COMMIT');
    logger.info(`Ingestion completed: ${chunkedNews.length} chunks stored`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to store chunks in database', { error: error.message });
    throw error;
  } finally {
    client.release();
  }

  await pool.end();
}

main().catch(error => {
  logger.error('Ingestion failed', { error: error.message });
  process.exit(1);
});