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
    console.log({response})
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

    // return chunks with only similarity > 0.7
    return {
      messageId: assistantMessage.messageId,
      response: response,
      sources: relevantChunks.filter(chunk => chunk.similarity >= 0.7).map(({ chunk }) => ({
        title: chunk.title,
        url: chunk.url,
        chunkIndex: chunk.chunkIndex
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
console.log({context})
    return `
  You are Newsify, a friendly and helpful AI news support agent. Your job is to assist users in finding the news they want, answer their questions in a conversational and supportive way, and make the experience enjoyable. Always be polite, approachable, and helpful.


CONTEXT FROM RECENT NEWS:
${context}

CONVERSATION HISTORY:
${chatHistory.map(msg => `${msg.type}: ${msg.content}`).join('\n')}

USER QUESTION: ${query}

INSTRUCTIONS:
   - Answer the user's question based on the provided news context, and help them find the news they are looking for.
   - Never give RSS feeds raw links, or just URLs with the news response.
   - For general or casual questions (e.g., "hi", "how are you"), respond in a warm, friendly, and conversational manner, without referencing news context.
   - Always cite sources using the provided URL and title when referencing news articles.
   - If the context does not contain relevant information, respond with "I'm sorry, I couldn't find any news related to <your question >right now."
   - Make your responses clear, supportive, and easy to understand.
   - Current date: ${new Date().toISOString().split('T')[0]}
    `;
  }
}

module.exports = QueryService;