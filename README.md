# Santinho AI MVP — Fundição Tropical
## Maringá/PR · Tradição há mais de 40 anos

Stack: **Next.js 15 · TypeScript · Tailwind · Supabase · Claude Sonnet**

---

## Estrutura de pastas (correta)

```
santinho-mvp/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts          ← Chat + WhatsApp webhook
│   │   │   ├── leads/route.ts         ← CRUD de leads
│   │   │   └── dashboard/route.ts     ← Métricas agregadas
│   │   ├── crm/page.tsx
│   │   └── dashboard/page.tsx
│   ├── components/
│   │   ├── crm/CRMKanban.tsx
│   │   └── shared/
│   │       ├── Sidebar.tsx
│   │       └── SantinhoWidget.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              ← Browser client
│   │   │   └── server.ts              ← Admin client (service role)
│   │   └── ai/
│   │       └── santinho.ts            ← KB local + Claude hook
│   └── types/index.ts
├── supabase/
│   └── migrations/
│       ├── 001_base_schema.sql        ← Rodar primeiro
│       ├── 002_products_kb.sql        ← Rodar segundo
│       └── 003_rag_embeddings.sql     ← Rodar depois (opcional)
├── scripts/
│   └── generate-embeddings.ts         ← OpenAI embeddings (opcional)
├── .env.example
├── package.json
└── README.md
```

---

## Checklist de produção — do zero ao ar

### PASSO 1 — Clonar e instalar

```bash
git clone https://github.com/SEU_USUARIO/santinho-ai.git
cd santinho-ai
npm install
```

**Verificar:** `node_modules` criado sem erros. Node >= 18.

---

### PASSO 2 — Criar projeto no Supabase

1. Acesse https://supabase.com e crie um novo projeto
2. Escolha região **South America (São Paulo)**
3. Anote a senha do banco
4. Aguarde ~2 minutos até o projeto ficar pronto

---

### PASSO 3 — Rodar as migrations

No Supabase, vá em **SQL Editor** e execute nesta ordem:

**Migration 001** — schema base (leads, conversas, mensagens)
```sql
-- Copie o conteúdo de supabase/migrations/001_base_schema.sql
-- Cole no SQL Editor e clique em Run
```

**Migration 002** — produtos e knowledge base
```sql
-- Copie o conteúdo de supabase/migrations/002_products_kb.sql
-- Cole no SQL Editor e clique em Run
```

**Verificar:** Vá em Table Editor. Deve ver as tabelas:
`leads`, `lead_activities`, `conversations`, `chat_messages`, `products`, `knowledge_base`, `unanswered_questions`

**Migration 003** — apenas se for usar RAG com embeddings (opcional para MVP)
```sql
-- Só rodar se tiver OPENAI_API_KEY configurada
-- supabase/migrations/003_rag_embeddings.sql
```

---

### PASSO 4 — Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
# Supabase — pegar em Settings > API no painel do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Anthropic — opcional no MVP (sem esta chave usa respostas locais)
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-sonnet-4-6

# OpenAI — apenas para RAG com embeddings
# OPENAI_API_KEY=sk-proj-...

# Empresa
NEXT_PUBLIC_COMPANY_NAME=Fundição Tropical
NEXT_PUBLIC_COMPANY_CITY=Maringá
NEXT_PUBLIC_COMPANY_STATE=PR
NEXT_PUBLIC_WHATSAPP_NUMBER=5544999999999
```

**Onde achar as chaves Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` → Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Settings > API > anon public
- `SUPABASE_SERVICE_ROLE_KEY` → Settings > API > service_role (manter secreto)

---

### PASSO 5 — Rodar localmente

```bash
npm run dev
```

Abrir: http://localhost:3000

**Verificar:**
- Página carrega sem erro
- Console sem erros de variável de ambiente
- http://localhost:3000/dashboard abre o painel

---

### PASSO 6 — Testar a API de chat

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá, quero saber sobre churrasqueiras",
    "session_id": "teste-001"
  }'
```

**Resposta esperada:**
```json
{
  "message": "Para churrasco temos...",
  "conversation_id": "uuid-aqui",
  "lead_id": null,
  "lead_created": false,
  "is_low_confidence": false
}
```

---

### PASSO 7 — Testar criação de lead

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Teste",
    "phone": "44999999999",
    "city": "Maringá",
    "source": "site",
    "interested_in": ["grelhas", "espetos"]
  }'
```

**Resposta esperada:**
```json
{
  "lead_id": "uuid-aqui",
  "created": true
}
```

**Verificar no Supabase:** Table Editor > leads — deve aparecer o registro.

---

### PASSO 8 — Testar pergunta sem resposta (unanswered)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Vocês fazem peças em titânio?",
    "session_id": "teste-002"
  }'
```

**Verificar:** `is_low_confidence: true` na resposta. No Supabase, conferir tabela `unanswered_questions`.

---

### PASSO 9 — Deploy na Vercel

```bash
npm install -g vercel
vercel login
vercel
```

Quando perguntar "Set up and deploy?" → Yes
Quando perguntar "Which scope?" → sua conta
Quando perguntar "Link to existing project?" → No
Nome do projeto: `santinho-ai`

Após o deploy, configure as variáveis de ambiente na Vercel:
1. Acesse https://vercel.com/SEU_USUARIO/santinho-ai/settings/environment-variables
2. Adicione todas as variáveis do `.env.local`
3. Faça redeploy: `vercel --prod`

---

### PASSO 10 — Ativar Claude (de MVP para produção)

O sistema detecta automaticamente se `ANTHROPIC_API_KEY` está configurada.

```env
# Adicionar no .env.local e na Vercel
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-sonnet-4-6
```

Após adicionar a chave, o Santinho passa a usar Claude Sonnet automaticamente.
As respostas locais continuam como fallback em caso de erro da API.

---

### PASSO 11 — Ativar RAG com embeddings (opcional — fase 2)

Só necessário após o MVP estar estável em produção.

**Pré-requisitos:**
- Migration 003 rodada no Supabase
- `OPENAI_API_KEY` configurada

```bash
# Gera embeddings para todos os produtos e documentos KB
npm run embeddings
```

O script indexa ~37 itens (23 produtos + 14 docs KB) no pgvector.
Custo estimado: ~$0.001 (praticamente gratuito).

---

## Configuração do widget no site existente

Cole este trecho antes do `</body>` no HTML do site atual da Fundição Tropical:

```html
<!-- Santinho AI Widget -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.x/dist/tabler-icons.min.css">
<script>
  window.SANTINHO_CONFIG = {
    apiUrl:  'https://santinho-ai.vercel.app/api/chat',
    company: 'Fundição Tropical',
    city:    'Maringá/PR',
    whatsapp:'5544999999999',
    color:   '#C9A84C',
  };
</script>
<script src="https://santinho-ai.vercel.app/widget.js" defer></script>
```

---

## Ativar integração WhatsApp (fase futura)

A API já está pronta. Quando quiser ativar:

1. Criar conta no Meta Business Manager
2. Criar app do tipo "Business"
3. Adicionar produto "WhatsApp"
4. Configurar webhook:
   - URL: `https://santinho-ai.vercel.app/api/chat`
   - Token: valor de `WHATSAPP_VERIFY_TOKEN`
5. Adicionar ao `.env`:
   ```env
   WHATSAPP_VERIFY_TOKEN=seu_token_secreto
   WHATSAPP_TOKEN=EAAxxxxxx
   WHATSAPP_PHONE_NUMBER_ID=123456789
   ```

---

## Estimativa de custo mensal

| Componente         | Volume           | Custo/mês  |
|--------------------|------------------|------------|
| Supabase (free)    | até 500 MB       | R$ 0       |
| Vercel (hobby)     | deploy gratuito  | R$ 0       |
| Claude Sonnet      | 1.000 mensagens  | ~R$ 8      |
| Claude Sonnet      | 5.000 mensagens  | ~R$ 40     |
| OpenAI Embeddings  | geração inicial  | ~R$ 0,05   |

**MVP sem Claude:** R$ 0/mês (apenas infraestrutura gratuita).
**Com Claude ativo:** ~R$ 8 para 1.000 mensagens (~R$ 0,008/msg).

---

## Contexto institucional correto

| Campo        | Valor                              |
|--------------|------------------------------------|
| Empresa      | Fundição Tropical                  |
| Cidade       | Maringá, Paraná                    |
| Proprietário | Santo                              |
| Tradição     | Mais de 40 anos                    |
| Canais       | WhatsApp, site, Instagram          |
| Entrega      | Todo o Brasil                      |

> ⚠️ Nenhuma referência a São Paulo, José Alves ou 1987 no sistema.
> Todo o contexto institucional está em `src/lib/ai/santinho.ts` (constante `COMPANY_CONTEXT`).
