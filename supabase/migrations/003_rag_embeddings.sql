-- ═══════════════════════════════════════════════════════════
-- SANTINHO AI — Migration 003: Embeddings RAG (opcional)
-- Rodar APÓS 001 e 002. Só necessário para IA com RAG.
-- ═══════════════════════════════════════════════════════════

-- Habilita pgvector (requer Supabase com extensão ativa)
CREATE EXTENSION IF NOT EXISTS vector;

-- Adiciona coluna de embedding em products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS embedding          vector(1536),
  ADD COLUMN IF NOT EXISTS embedding_text     TEXT,
  ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP WITH TIME ZONE;

-- Adiciona coluna de embedding em knowledge_base
ALTER TABLE knowledge_base
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Índices vetoriais (criados após gerar embeddings)
-- Só rodar após generate-embeddings.ts popular os vetores
-- CREATE INDEX idx_products_emb ON products
--   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
-- CREATE INDEX idx_kb_emb ON knowledge_base
--   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- Funções de busca semântica
CREATE OR REPLACE FUNCTION search_products_semantic(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.60,
  match_count     INT   DEFAULT 5
)
RETURNS TABLE (
  id          UUID,
  name        TEXT,
  category    product_category,
  description TEXT,
  material    product_material,
  price_base  NUMERIC,
  unit        TEXT,
  finishes    TEXT[],
  similarity  FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.category, p.description,
         p.material, p.price_base, p.unit, p.finishes,
         1 - (p.embedding <=> query_embedding) AS similarity
  FROM products p
  WHERE p.active = true
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_knowledge_semantic(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.55,
  match_count     INT   DEFAULT 4
)
RETURNS TABLE (
  id         UUID,
  title      TEXT,
  content    TEXT,
  category   TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT k.id, k.title, k.content, k.category,
         1 - (k.embedding <=> query_embedding) AS similarity
  FROM knowledge_base k
  WHERE k.active = true
    AND k.embedding IS NOT NULL
    AND 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
