// src/types/index.ts

export type LeadStatus =
  | 'novo' | 'contato_realizado' | 'qualificado'
  | 'orcamento_enviado' | 'negociacao' | 'venda_fechada'
  | 'producao' | 'entregue' | 'pos_venda' | 'perdido'

export type LeadSource =
  | 'whatsapp' | 'instagram' | 'facebook'
  | 'indicacao' | 'site' | 'google' | 'outros'

export type ProductCategory =
  | 'cemiterio' | 'sacro' | 'churrasqueira'
  | 'grelha' | 'espeto' | 'aplique_movel'
  | 'artesanal' | 'sob_medida'

export type ProductMaterial =
  | 'aluminio' | 'ferro_fundido' | 'bronze' | 'latao' | 'inox'

// ── ENTITIES ──────────────────────────────────────────────────

export interface Lead {
  id: string
  name: string
  phone?: string
  email?: string
  city?: string
  state?: string
  company?: string
  status: LeadStatus
  source: LeadSource
  opportunity_value?: number
  assigned_agent: string
  interested_in: string[]
  next_action?: string
  next_action_at?: string
  lost_reason?: string
  tags: string[]
  notes?: string
  created_at: string
  updated_at: string
  // relations
  activities?: LeadActivity[]
  conversations?: Conversation[]
}

export interface LeadActivity {
  id: string
  lead_id: string
  type: 'status_change' | 'note' | 'call' | 'message' | 'quote' | 'system'
  title: string
  description?: string
  old_value?: string
  new_value?: string
  agent: string
  created_at: string
}

export interface Conversation {
  id: string
  lead_id?: string
  channel: string
  session_id: string
  phone?: string
  status: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  messages?: ChatMessage[]
}

export interface ChatMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, unknown>
  tokens_used?: number
  created_at: string
}

export interface Product {
  id: string
  sku?: string
  name: string
  description?: string
  category: ProductCategory
  material: ProductMaterial
  width_cm?: number
  height_cm?: number
  depth_cm?: number
  weight_kg?: number
  price_base?: number
  price_min?: number
  price_max?: number
  unit: string
  stock_qty: number
  lead_time_days: number
  images: string[]
  finishes: string[]
  tags: string[]
  active: boolean
  created_at: string
}

export interface KnowledgeDoc {
  id: string
  title: string
  content: string
  category: string
  source?: string
  active: boolean
  created_at: string
}

export interface UnansweredQuestion {
  id: string
  conversation_id?: string
  question: string
  context?: string
  channel: string
  resolved: boolean
  resolution?: string
  created_at: string
}

// ── API INPUTS ────────────────────────────────────────────────

export interface CreateLeadInput {
  name: string
  phone?: string
  email?: string
  city?: string
  state?: string
  source?: LeadSource
  interested_in?: string[]
  notes?: string
  tags?: string[]
  session_id?: string
  conversation_summary?: string
}

export interface UpdateLeadInput {
  name?: string
  phone?: string
  city?: string
  status?: LeadStatus
  opportunity_value?: number
  interested_in?: string[]
  next_action?: string
  lost_reason?: string
  notes?: string
  tags?: string[]
}

export interface ChatRequest {
  message: string
  session_id: string
  phone?: string
  channel?: 'widget' | 'whatsapp' | 'instagram' | 'api'
  // WhatsApp extras
  wa_id?: string
  profile_name?: string
}

export interface ChatResponse {
  message: string
  conversation_id: string
  lead_id: string | null
  lead_created: boolean
  sources?: {
    products_found: number
    knowledge_found: number
  }
  is_low_confidence: boolean
}

// ── UI CONFIG ─────────────────────────────────────────────────

export const LEAD_STATUS_CONFIG: Record<LeadStatus, {
  label: string; color: string; bgColor: string; icon: string; order: number
}> = {
  novo:              { label: 'Novo Lead',        color: '#C9A84C', bgColor: 'rgba(201,168,76,.1)', icon: 'ti-user-plus',       order: 0 },
  contato_realizado: { label: 'Contato Realizado',color: '#0984e3', bgColor: 'rgba(9,132,227,.1)', icon: 'ti-phone',            order: 1 },
  qualificado:       { label: 'Qualificado',      color: '#00CEC9', bgColor: 'rgba(0,206,201,.1)', icon: 'ti-check',            order: 2 },
  orcamento_enviado: { label: 'Orçamento',        color: '#a29bfe', bgColor: 'rgba(162,155,254,.2)',icon: 'ti-file-invoice',    order: 3 },
  negociacao:        { label: 'Negociação',       color: '#E17055', bgColor: 'rgba(225,112,85,.1)', icon: 'ti-arrows-exchange', order: 4 },
  venda_fechada:     { label: 'Fechado',          color: '#00b894', bgColor: 'rgba(0,184,148,.1)', icon: 'ti-trophy',           order: 5 },
  producao:          { label: 'Produção',         color: '#6C5CE7', bgColor: 'rgba(108,92,231,.1)', icon: 'ti-building-factory',order: 6 },
  entregue:          { label: 'Entregue',         color: '#55efc4', bgColor: 'rgba(85,239,196,.2)', icon: 'ti-truck-delivery',  order: 7 },
  pos_venda:         { label: 'Pós-venda',        color: '#fd79a8', bgColor: 'rgba(253,121,168,.2)',icon: 'ti-heart',           order: 8 },
  perdido:           { label: 'Perdido',          color: '#636e72', bgColor: 'rgba(99,110,114,.1)', icon: 'ti-x',               order: 9 },
}

export const CATEGORY_CONFIG: Record<ProductCategory, { label: string; emoji: string }> = {
  cemiterio:     { label: 'Cemitério',       emoji: '✝️' },
  sacro:         { label: 'Sacro',           emoji: '🕊️' },
  churrasqueira: { label: 'Churrasqueira',   emoji: '🔥' },
  grelha:        { label: 'Grelhas',         emoji: '⊞'  },
  espeto:        { label: 'Espetos',         emoji: '🍖' },
  aplique_movel: { label: 'Apliques/Móveis', emoji: '🪑' },
  artesanal:     { label: 'Artesanal',       emoji: '🎨' },
  sob_medida:    { label: 'Sob Medida',      emoji: '📐' },
}
