module.exports = {
    port: parseInt(process.env.PORT || '4000'),
    env: process.env.NODE_ENV || 'development',
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        sessionTtl: parseInt(process.env.SESSION_TTL_SECONDS || '86400'),
        cacheTtl: parseInt(process.env.RETRIEVAL_CACHE_TTL || '60')
    },
    postgres: {
        url: process.env.POSTGRES_URL || 'postgresql://user:pass@localhost:5432/news_rag'
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        embeddingModel: process.env.EMBEDDING_MODEL || 'gemini-embedding-001',
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/"
    },
    retrieval: {
        similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7'),
        defaultK: parseInt(process.env.DEFAULT_K || '5'),
        maxPromptTokens: parseInt(process.env.MAX_PROMPT_TOKENS || '4000')
    }
};