class EmbeddingService {
  constructor(openaiClient) {
    this.openai = openaiClient;
  }

  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
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

  async generateEmbeddings(texts) {
    try {
      const response = await this.openai.embeddings.create({
        model: 'gemini-embedding-001',
        input: texts,
        encoding_format: 'float',
        dimentions: 1536
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      throw new Error(`Embeddings generation failed: ${error.message}`);
    }
  }
}

module.exports = EmbeddingService;