# News RAG Chatbot Backend

A production-ready backend for a Retrieval-Augmented Generation chatbot that answers questions about recent news.

## Architecture Overview

- **Web Framework**: Express.js with JavaScript
- **Vector Database**: PostgreSQL with pgvector extension
- **Session Storage**: Redis with configurable TTL
- **Embeddings**: GEMINI gemini-embedding-001
- **LLM**: Google Gemini API

## Quick Start

1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd newsify_backend
   cp .env.example .env
   # Edit .env with your API keys