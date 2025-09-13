const { v4: uuidv4 } = require('uuid');

class QueryService {
  constructor(embeddingService, retrievalService, geminiService, sessionService) {
    this.embeddingService = embeddingService;
    this.retrievalService = retrievalService;
    this.geminiService = geminiService;
    this.sessionService = sessionService;
  }

  async handleQuery(sessionId, query, k = 5) {
    // Add user query to session history
    const userMessage = {
      type: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    await this.sessionService.addMessageToHistory(sessionId, userMessage);

    // Generate embedding for the query
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    // Retrieve relevant chunks
    const relevantChunks = await this.retrievalService.retrieveRelevantChunks(query, queryEmbedding, k);

    // Get session history for context
    const history = await this.sessionService.getSessionHistory(sessionId);

    // Construct prompt
    const prompt = this.constructRAGPrompt(query, relevantChunks, history);

    // Generate response using Gemini
    const response = await this.geminiService.generateResponse(prompt);

    // Add assistant response to session history
    const assistantMessage = {
      type: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      messageId: uuidv4()
    };

    await this.sessionService.addMessageToHistory(sessionId, assistantMessage);

    // Persist to PostgreSQL if needed (optional)
    // await this.persistTranscript(sessionId, query, response, relevantChunks);

    return {
      messageId: assistantMessage.messageId,
      response: response,
      sources: relevantChunks.map(chunk => ({
        title: chunk.chunk.title,
        url: chunk.chunk.url,
        similarity: chunk.similarity
      }))
    };
  }

  constructRAGPrompt(query, retrievedChunks, chatHistory = []) {
    console.log({ retrievedChunks })
    const context = retrievedChunks.map(({ chunk, similarity }) => `
SOURCE: ${chunk.title} (${chunk.url}, chunk ${chunk.chunkIndex})
RELEVANCE: ${(similarity * 100).toFixed(1)}%
CONTENT: ${chunk.content}
    `).join('\n\n');

    return `
You are a news assistant helping users answer questions based on recent news.

CONTEXT FROM RECENT NEWS:
${context}

CONVERSATION HISTORY:
${chatHistory.map(msg => `${msg.type}: ${msg.content}`).join('\n')}

USER QUESTION: ${query}

INSTRUCTIONS:
- Answer the question based only on the provided context
- If the context doesn't contain relevant information, say so
- Always cite sources using the provided URL and title
- Current date: ${new Date().toISOString().split('T')[0]}
    `;
  }
}

module.exports = QueryService;