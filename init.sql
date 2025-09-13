CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS news_chunks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  published TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(url, chunk_index)
);

CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  sources JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON news_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON news_chunks (url, chunk_index);