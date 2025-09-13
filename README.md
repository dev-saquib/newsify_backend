# News RAG Chatbot Backend

A production-ready backend for a Retrieval-Augmented Generation (RAG) chatbot that answers questions about recent news.

## Architecture Overview

- **Web Framework**: Express.js with JavaScript
- **Vector Database**: PostgreSQL with pgvector extension
- **Session Storage**: Redis with configurable TTL
- **Embeddings**: Gemini gemini-embedding-001
- **LLM**: Google Gemini API

## Quick Start

### 1. Clone and setup
```bash
git clone <repository>
cd newsify_backend
cp .env.example .env
# Edit .env with your API keys

### 2. Install dependencies

```bash
npm install
```

### 3. Set up databases

```bash
# Start Redis and PostgreSQL (requires Docker)
docker-compose up -d

# Initialize PostgreSQL tables
psql -h localhost -U user -d news_rag -f init.sql
```

### 4. Run ingestion

```bash
# Ingest RSS Feeds
npm run ingest
```

### 5. Start server

```bash
npm run dev
```

## API Endpoints

* `POST /session` - Create a new session
* `GET /session/:id/history` - Get session history
* `POST /session/:id/query` - Submit a query
* `DELETE /session/:id` - Clear session data
* `GET /health` - Health check

## Cache Warming

To warm the cache for frequently asked queries:

```bash
npm run warm-cache
```

This script will pre-compute embeddings for common questions and store retrieval results in Redis with a configurable TTL.

## Performance Tuning

* **Embedding Batch Size**: Adjust batch size in `ingest.js` (default: 10)
* **Similarity Threshold**: Adjust `SIMILARITY_THRESHOLD` in `.env` (default: 0.5)
* **Cache TTL**: Adjust `RETRIEVAL_CACHE_TTL` in `.env` (default: 60 seconds)

```

This is now a single, coherent `readme.md` file, ready to be used in your project. Let me know if you want to add environment variable details, troubleshooting tips, or any other sections.
```
