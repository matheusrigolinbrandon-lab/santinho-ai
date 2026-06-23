-- ═══════════════════════════════════════════════════════════
-- SANTINHO AI MVP — Migration 001: Schema base
-- Fundição Tropical · Maringá / PR
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── ENUMS ────────────────────────────────────────────────────
CREATE TYPE lead_status AS ENUM (
  'novo', 'contato_realizado', 'qualificado',
  'orcamento_enviado', 'negociacao',
  'venda_fechada', 'producao', 'entregue', 'pos_venda', 'perdido'
);

CREATE TYPE lead_source AS ENUM (
  'whatsapp', 'instagram', 'facebook',
  'indicacao', 'site', 'google', 'outros'
);

-- ── LEADS ────────────────────────────────────────────────────
CREATE TABLE leads (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  phone            TEXT,
  email            TEXT,
  city             TEXT,
  state            TEXT DEFAULT 'PR',
  company          TEXT,
  status           lead_status NOT NULL DEFAULT 'novo',
  source           lead_source NOT NULL DEFAULT 'site',
  opportunity_value NUMERIC(12,2),
  assigned_agent   TEXT DEFAULT 'Santinho IA',
  interested_in    TEXT[] DEFAULT '{}',
  next_action      TEXT,
  next_action_at   TIMESTAMP WITH TIME ZONE,
  lost_reason      TEXT,
  tags             TEXT[] DEFAULT '{}',
  notes            TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leads_status    ON leads(status);
CREATE INDEX idx_leads_phone     ON leads(phone);
CREATE INDEX idx_leads_created   ON leads(created_at DESC);
CREATE INDEX idx_leads_name      ON leads USING gin(name gin_trgm_ops);

-- ── LEAD ACTIVITIES (timeline) ───────────────────────────────
CREATE TABLE lead_activities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  old_value   TEXT,
  new_value   TEXT,
  agent       TEXT DEFAULT 'Santinho IA',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activities_lead ON lead_activities(lead_id, created_at DESC);

-- ── CONVERSATIONS ────────────────────────────────────────────
CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID REFERENCES leads(id) ON DELETE SET NULL,
  channel     TEXT NOT NULL DEFAULT 'widget',
  session_id  TEXT UNIQUE NOT NULL,
  phone       TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conv_session ON conversations(session_id);
CREATE INDEX idx_conv_phone   ON conversations(phone);
CREATE INDEX idx_conv_lead    ON conversations(lead_id);

-- ── CHAT MESSAGES ────────────────────────────────────────────
CREATE TABLE chat_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content         TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}',
  tokens_used     INTEGER,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_msgs_conv ON chat_messages(conversation_id, created_at ASC);

-- ── UNANSWERED QUESTIONS ─────────────────────────────────────
CREATE TABLE unanswered_questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  question        TEXT NOT NULL,
  context         TEXT,
  channel         TEXT DEFAULT 'widget',
  resolved        BOOLEAN DEFAULT false,
  resolution      TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── AUTO-UPDATE updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leads_ts BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_conv_ts BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- Auto-bump conversation when message arrives
CREATE OR REPLACE FUNCTION fn_bump_conv()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_msg_bump AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION fn_bump_conv();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE leads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE unanswered_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "srv_leads"    ON leads                FOR ALL TO service_role USING (true);
CREATE POLICY "srv_acts"     ON lead_activities      FOR ALL TO service_role USING (true);
CREATE POLICY "srv_convs"    ON conversations        FOR ALL TO service_role USING (true);
CREATE POLICY "srv_msgs"     ON chat_messages        FOR ALL TO service_role USING (true);
CREATE POLICY "srv_unanswrd" ON unanswered_questions FOR ALL TO service_role USING (true);
