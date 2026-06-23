-- ═══════════════════════════════════════════════════════════
-- SANTINHO AI MVP — Migration 002: Produtos e KB
-- Contexto real: Fundição Tropical · Maringá/PR
-- ═══════════════════════════════════════════════════════════

-- ── PRODUCTS ─────────────────────────────────────────────────
CREATE TYPE product_category AS ENUM (
  'cemiterio', 'sacro', 'churrasqueira',
  'grelha', 'espeto', 'aplique_movel',
  'artesanal', 'sob_medida'
);

CREATE TYPE product_material AS ENUM (
  'aluminio', 'ferro_fundido', 'bronze', 'latao', 'inox'
);

CREATE TABLE products (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku            TEXT UNIQUE,
  name           TEXT NOT NULL,
  description    TEXT,
  category       product_category NOT NULL,
  material       product_material DEFAULT 'aluminio',
  width_cm       NUMERIC(8,2),
  height_cm      NUMERIC(8,2),
  depth_cm       NUMERIC(8,2),
  weight_kg      NUMERIC(8,3),
  price_base     NUMERIC(10,2),
  price_min      NUMERIC(10,2),
  price_max      NUMERIC(10,2),
  unit           TEXT DEFAULT 'unidade',
  stock_qty      INTEGER DEFAULT 0,
  lead_time_days INTEGER DEFAULT 15,
  images         TEXT[] DEFAULT '{}',
  finishes       TEXT[] DEFAULT '{}',
  tags           TEXT[] DEFAULT '{}',
  active         BOOLEAN DEFAULT true,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active    ON products(active);
CREATE INDEX idx_products_name      ON products USING gin(name gin_trgm_ops);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "srv_products" ON products FOR ALL TO service_role USING (true);
CREATE POLICY "anon_read"    ON products FOR SELECT TO anon    USING (active = true);

-- ── KNOWLEDGE BASE (sem embeddings no MVP) ───────────────────
CREATE TABLE knowledge_base (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'geral',
  source     TEXT,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kb_category ON knowledge_base(category);
CREATE INDEX idx_kb_title    ON knowledge_base USING gin(title gin_trgm_ops);
CREATE INDEX idx_kb_content  ON knowledge_base USING gin(content gin_trgm_ops);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "srv_kb" ON knowledge_base FOR ALL TO service_role USING (true);

-- ── SEED: CATÁLOGO FUNDIÇÃO TROPICAL ─────────────────────────
INSERT INTO products (sku,name,description,category,material,width_cm,height_cm,price_base,price_min,price_max,unit,stock_qty,lead_time_days,finishes,tags) VALUES
-- Cemitério
('CEM-001','Cruz Latina Grande','Cruz tradicional para túmulo em alumínio fundido. Resistente às intempéries.','cemiterio','aluminio',40,80,280,250,350,'unidade',12,10,ARRAY['natural','pintado','patinado'],ARRAY['cruz','tumulo','cemiterio','sepultura']),
('CEM-002','Cruz Latina Média','Cruz para túmulo tamanho médio em alumínio.','cemiterio','aluminio',28,55,180,160,220,'unidade',20,7,ARRAY['natural','pintado','patinado'],ARRAY['cruz','tumulo','cemiterio']),
('CEM-003','Anjo Chorão','Escultura de anjo com asas abertas. Peça de alto valor estético.','cemiterio','aluminio',35,65,680,600,850,'unidade',4,20,ARRAY['natural','pintado','patinado'],ARRAY['anjo','tumulo','escultura','cemiterio']),
('CEM-004','Placa Memoriam','Placa comemorativa com espaço para texto personalizado. 30x20cm.','cemiterio','aluminio',30,20,95,80,130,'unidade',30,5,ARRAY['natural','pintado'],ARRAY['placa','memorial','cemiterio','personalizavel']),
('CEM-005','Letras Tumulares','Letras avulsas em alumínio para identificação de túmulo. 8cm. Preço por unidade.','cemiterio','aluminio',8,8,12,10,18,'unidade',200,3,ARRAY['natural','pintado'],ARRAY['letras','tumulo','cemiterio']),
('CEM-006','Coroa Fúnebre','Coroa decorativa em alumínio para féretro ou túmulo.','cemiterio','aluminio',50,50,220,190,280,'unidade',8,10,ARRAY['natural','pintado'],ARRAY['coroa','feretro','cemiterio']),
-- Sacro
('SAC-001','N. Sra. Aparecida 60cm','Imagem com detalhes em alto relevo. 60cm.','sacro','aluminio',20,60,450,400,580,'unidade',6,15,ARRAY['natural','pintado','patinado'],ARRAY['nossa senhora','aparecida','religioso','sacro']),
('SAC-002','São Francisco 50cm','São Francisco de Assis com pássaros. 50cm.','sacro','aluminio',18,50,380,340,480,'unidade',5,15,ARRAY['natural','pintado','patinado'],ARRAY['sao francisco','religioso','sacro']),
('SAC-003','Cristo Redentor 30cm','Miniatura do Cristo Redentor. Ideal para presente.','sacro','aluminio',14,30,180,160,240,'unidade',15,10,ARRAY['natural','pintado'],ARRAY['cristo','redentor','religioso','sacro','presente']),
('SAC-004','Crucifixo Parede 80cm','Para igrejas e capelas. 40x80cm.','sacro','aluminio',40,80,520,460,680,'unidade',3,20,ARRAY['natural','pintado','patinado'],ARRAY['crucifixo','parede','igreja','sacro']),
-- Churrasqueiras
('CHU-001','Grelha Ferro 60x40','Grelha de ferro fundido. Alta resistência ao calor.','churrasqueira','ferro_fundido',60,40,185,165,220,'unidade',25,7,ARRAY['natural'],ARRAY['grelha','churrasqueira','churrasco','ferro']),
('CHU-002','Grelha Ferro 80x50','Grelha profissional de ferro fundido.','churrasqueira','ferro_fundido',80,50,265,240,320,'unidade',18,7,ARRAY['natural'],ARRAY['grelha','churrasqueira','profissional']),
('CHU-003','Tampa Oval Alumínio','Tampa para churrasqueira embutida. 70x45cm.','churrasqueira','aluminio',70,45,320,290,390,'unidade',10,10,ARRAY['natural','pintado'],ARRAY['tampa','churrasqueira']),
-- Espetos
('ESP-001','Espeto Giratório Inox 120cm','Giratório, capacidade 15kg. Inox alimentício.','espeto','inox',120,2,145,130,180,'unidade',35,5,ARRAY['polido'],ARRAY['espeto','churrasco','giratorio','inox']),
('ESP-002','Espeto Fixo 90cm c/ Cabo','Com cabo de madeira torneada.','espeto','inox',90,2,85,75,110,'unidade',50,3,ARRAY['polido'],ARRAY['espeto','churrasco','cabo']),
('ESP-003','Kit Espeto+Garfo+Faca','Kit completo para churrasco em inox.','espeto','inox',100,3,195,175,240,'conjunto',25,5,ARRAY['polido'],ARRAY['espeto','kit','churrasco','presente']),
-- Apliques
('APL-001','Puxador Colonial (par)','Par de puxadores estilo colonial. 15cm.','aplique_movel','aluminio',15,4,35,28,48,'par',80,3,ARRAY['natural','pintado','patinado'],ARRAY['puxador','colonial','movel']),
('APL-002','Puxador Art Nouveau (par)','Par com arabescos. 20cm.','aplique_movel','aluminio',20,5,48,40,65,'par',60,3,ARRAY['natural','patinado'],ARRAY['puxador','art nouveau','decorativo']),
('APL-003','Cantoneiras Decorativas (c/4)','Conjunto de 4 cantoneiras. 8x8cm cada.','aplique_movel','aluminio',8,8,52,44,70,'conjunto',100,3,ARRAY['natural','pintado','patinado'],ARRAY['cantoneira','decorativa','movel']),
-- Artesanal
('ART-001','Mascarão Leão','Para portão ou parede. 35x25cm.','artesanal','aluminio',35,25,285,250,380,'unidade',8,15,ARRAY['natural','pintado','patinado'],ARRAY['leao','mascara','portao','decorativo']),
('ART-002','Pomba da Paz','Para jardins e fachadas. 30cm.','artesanal','aluminio',30,20,195,170,260,'unidade',12,10,ARRAY['natural','pintado'],ARRAY['pomba','jardim','decorativo']),
('ART-003','Placa de Endereço','Com números fundidos. 25x15cm. Personalizável.','artesanal','aluminio',25,15,85,70,120,'unidade',25,7,ARRAY['natural','pintado'],ARRAY['placa','endereco','numero','personalizavel']),
-- Sob medida
('SOB-001','Peça Sob Medida','Fabricamos conforme seu projeto. Envie foto e medidas para orçamento.','sob_medida','aluminio',NULL,NULL,NULL,NULL,NULL,'unidade',0,21,ARRAY['natural','pintado','patinado','polido'],ARRAY['sob medida','personalizado']);

-- ── SEED: KNOWLEDGE BASE ─────────────────────────────────────
INSERT INTO knowledge_base (title, content, category) VALUES
('Sobre a Fundição Tropical','A Fundição Tropical é uma empresa familiar localizada em Maringá, Paraná. Com mais de 40 anos de tradição na fabricação artesanal de peças em alumínio, ferro fundido e inox. Atendemos todo o Brasil com entrega pelos Correios e transportadoras. Somos especializados em peças para cemitério, imagens sacras, churrasqueiras, apliques decorativos e peças sob medida.','historia'),
('Prazo de entrega','Peças em estoque: 3 a 7 dias úteis. Peças sob medida: 15 a 21 dias úteis. Peças sacras e artesanais complexas: 10 a 20 dias úteis. Para pedidos acima de 10 unidades do mesmo produto consulte. Após pagamento confirmado iniciamos imediatamente.','frete'),
('Frete e envio','Enviamos para todo o Brasil. Correios PAC (econômico), Sedex (rápido) e transportadora para peças pesadas. Calculamos pelo CEP de destino. Frete grátis acima de R$1.500 para Maringá e região do Paraná. Retirada grátis na fábrica em Maringá/PR.','frete'),
('Formas de pagamento','PIX com 5% de desconto. Boleto bancário (vence em 3 dias úteis). Cartão de crédito em até 12x com juros. Transferência bancária (mesmo desconto do PIX). Faturamento para CNPJ para pedidos recorrentes acima de R$3.000.','pagamento'),
('Materiais utilizados','Alumínio fundido: leve, não enferruja, ideal para uso externo, mantém detalhes riquíssimos. Ferro fundido: pesado e resistente, ideal para grelhas. Aço inox AISI 304: alimentício, para espetos. Bronze e latão: decorativo premium, consulte prazo.','produto'),
('Acabamentos disponíveis','Natural: alumínio puro, tom prateado claro. Pintado: esmalte sintético em qualquer cor. Patinado: efeito envelhecido estilo bronze/cobre, muito usado em cemitério. Polido: brilho espelhado. Patinado e polido têm acréscimo de 15% a 25%.','produto'),
('Peças sob medida','Envie: foto ou referência visual, medidas em cm (Largura x Altura x Profundidade), material, acabamento e quantidade. Orçamento em até 24h úteis. Prazo de produção 15 a 21 dias após pagamento.','processo'),
('Garantia e trocas','12 meses contra defeitos de fabricação. Inclui falhas na fundição e defeitos de acabamento. Não cobre danos por manuseio, corrosão por químicos ou impactos. Para acionar: fotografe o defeito e entre em contato. Substituímos sem custo incluindo frete de retorno.','politica'),
('Descontos por volume','5 a 9 unidades: 5% de desconto. 10 a 24 unidades: 10%. 25 a 49 unidades: 15%. 50 ou mais: 20% mais frete especial. Aplica ao mesmo produto e tamanho.','politica'),
('Como solicitar orçamento','Informe: produto desejado, quantidade, acabamento e cidade de destino. Orçamento em até 4 horas úteis, válido por 7 dias. Para sob medida também envie foto e medidas.','faq'),
('Processo de fundição','Etapas: 1) Modelagem do molde em areia. 2) Fundição do alumínio. 3) Vazamento. 4) Resfriamento. 5) Desmoldagem e rebarbação. 6) Acabamento. 7) Controle de qualidade. Cada peça feita artesanalmente.','processo'),
('Cuidados com as peças','Limpeza com água e sabão neutro. Evite produtos ácidos ou abrasivos. Peças pintadas externas: verniz automotivo a cada 2 anos. Patinadas: cera de carnaúba. Grelhas de ferro: limpar quente com escova e aplicar óleo vegetal após uso.','produto'),
('Localização e retirada','Estamos em Maringá, Paraná. Aceitamos retirada na fábrica sem custo de frete. Agendamento pelo WhatsApp. Atendemos de segunda a sexta das 8h às 18h e sábado das 8h às 12h.','faq'),
('Pedidos para revendas','Programa para revendas: tabela especial 30% a 40% abaixo do varejo, prazo de pagamento após análise, catálogo completo em alta resolução, amostras para showroom. Pedido mínimo mensal R$1.500. Entre em contato para cadastro.','politica');
