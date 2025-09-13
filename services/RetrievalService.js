class RetrievalService {
  constructor(pool, redisClient, similarityThreshold, cacheTtl) {
    this.pool = pool;
    this.redisClient = redisClient;
    this.similarityThreshold = similarityThreshold;
    this.cacheTtl = cacheTtl;
  }
  
  async retrieveRelevantChunks(query, queryEmbedding, k) {
    // Check cache first
    const cacheKey = `retrieval:${this.hashQuery(query)}`;
    const cached = await this.redisClient.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Perform vector search
    const results = await this.querySimilarVectors(queryEmbedding, k, this.similarityThreshold);
    
    // Cache results
    await this.redisClient.setEx(cacheKey, this.cacheTtl, JSON.stringify(results));
    
    return results;
  }
  
  async querySimilarVectors(embedding, k, threshold) {
    const query = `
      SELECT 
        id, title, content, url, chunk_index,
        1 - (embedding <=> $1) as similarity
      FROM news_chunks
      WHERE 1 - (embedding <=> $1) > $2
      ORDER BY similarity DESC
      LIMIT $3
    `;
    
    const result = await this.pool.query(query, [
      JSON.stringify(embedding),
      threshold,
      k
    ]);
    
    return result.rows.map(row => ({
      chunk: {
        id: row.id,
        title: row.title,
        content: row.content,
        url: row.url,
        chunkIndex: row.chunk_index
      },
      similarity: row.similarity
    }));
  }
  
  hashQuery(query) {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
}

module.exports = RetrievalService;