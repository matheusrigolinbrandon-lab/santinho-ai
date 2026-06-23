// scripts/generate-embeddings.ts
// Gera embeddings para produtos e knowledge_base no Supabase (pgvector)
// Requer: migration 003 rodada + OPENAI_API_KEY + SUPABASE vars no .env.local
//
// Uso:
//   npx tsx scripts/generate-embeddings.ts
//   # ou
//   npx ts-node --project tsconfig.json scripts/generate-embeddings.ts

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// ── CONFIG ────────────────────────────────────────────────────
const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_API_KEY  = process.env.OPENAI_API_KEY!
const EMBEDDING_MODEL = 'text-embedding-3-small'  // 1536 dims, barato e eficaz
const BATCH_DELAY_MS  = 250                        // delay entre requests (rate limit)

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!OPENAI_API_KEY) {
  console.error('❌ Configure OPENAI_API_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── EMBEDDING VIA OPENAI ──────────────────────────────────────
async function embed(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.substring(0, 8000),  // limite seguro
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI embeddings error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.data[0].embedding as number[]
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── PRODUTOS ──────────────────────────────────────────────────
async function embedProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, category, description, material, price_base, finishes, tags')
    .is('embedding', null)

  if (error) throw error
  if (!products?.length) {
    console.log('📦 Todos os produtos já têm embedding.')
    return
  }

  console.log(`📦 Gerando embeddings para ${products.length} produto(s)...`)

  for (const p of products) {
    const text = [
      `Produto: ${p.name}`,
      `Categoria: ${p.category}`,
      p.description ? `Descrição: ${p.description}` : '',
      `Material: ${p.material}`,
      p.price_base   ? `Preço: R$${p.price_base}`         : 'Preço: consultar',
      p.finishes?.length ? `Acabamentos: ${p.finishes.join(', ')}` : '',
      p.tags?.length     ? `Tags: ${p.tags.join(', ')}`            : '',
    ].filter(Boolean).join('\n')

    try {
      const embedding = await embed(text)
      const { error: upErr } = await supabase
        .from('products')
        .update({
          embedding:            JSON.stringify(embedding),
          embedding_text:       text,
          embedding_updated_at: new Date().toISOString(),
        })
        .eq('id', p.id)

      if (upErr) throw upErr
      console.log(`  ✅ ${p.name}`)
    } catch (e) {
      console.error(`  ❌ ${p.name}: ${e instanceof Error ? e.message : e}`)
    }

    await sleep(BATCH_DELAY_MS)
  }
}

// ── KNOWLEDGE BASE ────────────────────────────────────────────
async function embedKnowledge() {
  const { data: docs, error } = await supabase
    .from('knowledge_base')
    .select('id, title, content')
    .is('embedding', null)

  if (error) throw error
  if (!docs?.length) {
    console.log('📚 Todos os documentos já têm embedding.')
    return
  }

  console.log(`\n📚 Gerando embeddings para ${docs.length} documento(s) KB...`)

  for (const d of docs) {
    const text = `${d.title}\n\n${d.content}`
    try {
      const embedding = await embed(text)
      const { error: upErr } = await supabase
        .from('knowledge_base')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', d.id)

      if (upErr) throw upErr
      console.log(`  ✅ ${d.title}`)
    } catch (e) {
      console.error(`  ❌ ${d.title}: ${e instanceof Error ? e.message : e}`)
    }

    await sleep(BATCH_DELAY_MS)
  }
}

// ── CRIAR ÍNDICES APÓS EMBEDDINGS ────────────────────────────
async function createIndexes() {
  console.log('\n🔍 Criando índices vetoriais no pgvector...')

  const queries = [
    `CREATE INDEX IF NOT EXISTS idx_products_emb ON products
     USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50)`,
    `CREATE INDEX IF NOT EXISTS idx_kb_emb ON knowledge_base
     USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50)`,
  ]

  for (const sql of queries) {
    const { error } = await supabase.rpc('exec_sql', { sql }).catch(() => ({ error: 'rpc não disponível' }))
    if (error) {
      console.log(`  ⚠️  Rode manualmente no SQL Editor do Supabase:\n  ${sql}`)
    } else {
      console.log('  ✅ Índice criado')
    }
  }
}

// ── MAIN ──────────────────────────────────────────────────────
async function main() {
  console.log('🔥 Santinho AI — Generate Embeddings')
  console.log(`   Modelo: ${EMBEDDING_MODEL}`)
  console.log(`   Supabase: ${SUPABASE_URL}\n`)

  try {
    await embedProducts()
    await embedKnowledge()
    await createIndexes()
    console.log('\n✅ Processo concluído! O RAG está pronto para uso.')
  } catch (err) {
    console.error('\n❌ Erro fatal:', err)
    process.exit(1)
  }
}

main()
