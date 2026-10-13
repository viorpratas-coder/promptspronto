-- ==============================================================================
-- VIOOR PROMPTS — CATÁLOGO DE EDIÇÕES COM IA (CHATGPT & GEMINI)
-- SCRIPT DE CRIAÇÃO COMPLETO PARA O SUPABASE SQL EDITOR
-- ==============================================================================
-- Instruções:
-- 1. Abra o painel do seu projeto no Supabase (https://supabase.com).
-- 2. Vá até a aba "SQL Editor" no menu lateral esquerdo.
-- 3. Cole todo este código e clique no botão verde "Run".
-- 4. Suas tabelas, políticas, bucket de fotos e dados iniciais serão criados!
-- ==============================================================================

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CRIAÇÃO DAS TABELAS PRINCIPAIS
-- ==============================================================================

-- 2.1. TABELA: categories (Categorias de Estilos Fotográficos)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Sparkles',
    cover_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2. TABELA: collections (Coleções Temáticas)
CREATE TABLE IF NOT EXISTS public.collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    cover_image TEXT NOT NULL,
    is_published BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3. TABELA: prompts (Prompts de Edição para ChatGPT, Gemini e Chats)
CREATE TABLE IF NOT EXISTS public.prompts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    prompt_text TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    original_image TEXT,
    image_alt TEXT,
    category_id TEXT REFERENCES public.categories(id) ON DELETE RESTRICT,
    tags TEXT[] DEFAULT '{}',
    tool_name TEXT NOT NULL DEFAULT 'ChatGPT & Gemini',
    instructions TEXT,
    collection_id TEXT REFERENCES public.collections(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    copies_count INTEGER DEFAULT 0,
    aspect_ratio TEXT DEFAULT '4:5',
    parameters JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4. TABELA: favorites (Favoritos persistentes opcionais)
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'public_client',
    prompt_id TEXT NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, prompt_id)
);

-- ==============================================================================
-- 3. ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_prompts_slug ON public.prompts(slug);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON public.prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_collection_id ON public.prompts(collection_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_published ON public.prompts(is_published);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);

-- ==============================================================================
-- 4. FUNÇÕES RPC PARA MÉTRICAS DE CONTADORES SEGUROS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.increment_copies_count(target_prompt_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.prompts
    SET copies_count = COALESCE(copies_count, 0) + 1
    WHERE id = target_prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_views_count(target_prompt_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.prompts
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = target_prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 5. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 5.1. Categorias: Leitura aberta a todos, operações de gerenciamento liberadas
DROP POLICY IF EXISTS "Leitura de Categorias" ON public.categories;
CREATE POLICY "Leitura de Categorias" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gerenciamento de Categorias" ON public.categories;
CREATE POLICY "Gerenciamento de Categorias" ON public.categories FOR ALL USING (true);

-- 5.2. Coleções: Leitura aberta a todos, operações liberadas
DROP POLICY IF EXISTS "Leitura de Coleções" ON public.collections;
CREATE POLICY "Leitura de Coleções" ON public.collections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gerenciamento de Coleções" ON public.collections;
CREATE POLICY "Gerenciamento de Coleções" ON public.collections FOR ALL USING (true);

-- 5.3. Prompts: Leitura pública, gerenciamento pelo painel
DROP POLICY IF EXISTS "Leitura de Prompts" ON public.prompts;
CREATE POLICY "Leitura de Prompts" ON public.prompts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gerenciamento de Prompts" ON public.prompts;
CREATE POLICY "Gerenciamento de Prompts" ON public.prompts FOR ALL USING (true);

-- 5.4. Favoritos: Acesso permitido
DROP POLICY IF EXISTS "Acesso a Favoritos" ON public.favorites;
CREATE POLICY "Acesso a Favoritos" ON public.favorites FOR ALL USING (true);

-- ==============================================================================
-- 6. STORAGE BUCKET PARA UPLOAD DE FOTOS (CAPAS E ORIGINAIS)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('prompts', 'prompts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas no Storage: leitura pública para todos e upload liberado
DROP POLICY IF EXISTS "Visualização Pública de Imagens" ON storage.objects;
CREATE POLICY "Visualização Pública de Imagens" ON storage.objects
    FOR SELECT USING (bucket_id = 'prompts');

DROP POLICY IF EXISTS "Upload de Imagens" ON storage.objects;
CREATE POLICY "Upload de Imagens" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'prompts');

DROP POLICY IF EXISTS "Atualização e Exclusão de Imagens" ON storage.objects;
CREATE POLICY "Atualização e Exclusão de Imagens" ON storage.objects
    FOR ALL USING (bucket_id = 'prompts');

-- ==============================================================================
-- 7. CARGA DE DADOS INICIAIS (SEED DATA DO VIOOR PROMPTS)
-- ==============================================================================

-- 7.1. Inserir Categorias
INSERT INTO public.categories (id, name, slug, description, icon, cover_image) VALUES
('cat-retratos', 'Retratos', 'retratos', 'Retratos artísticos e expressões humanas com iluminação calculada e nitidez óptica.', 'User', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'),
('cat-cinematografico', 'Cinematográfico', 'cinematografico', 'Composições anamórficas com color grading digno de Hollywood em 35mm e Panavision.', 'Film', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'),
('cat-luxo', 'Luxo', 'luxo', 'Estética de alta joalheria, iates, arquitetura brutalista e acabamentos sofisticados.', 'Crown', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80'),
('cat-old-money', 'Old Money', 'old-money', 'Elegância atemporal, linho europeu, clubes de tênis e iates na Riviera Italiana.', 'Sparkles', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'),
('cat-streetwear', 'Streetwear', 'streetwear', 'Fotografia de rua contemporânea, alta moda urbana e atmosferas cosmopolitas.', 'Shirt', 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80'),
('cat-lifestyle', 'Lifestyle', 'lifestyle', 'Momentos espontâneos de viagens, café da manhã em vilas e rotina estética.', 'Compass', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'),
('cat-moda', 'Moda', 'moda', 'Editoriais de alta costura, campanhas para revistas de moda e poses esculturais.', 'Glasses', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80'),
('cat-beleza', 'Beleza', 'beleza', 'Close-ups extremos de maquiagem, textura de pele natural e iluminação de estúdio.', 'Eye', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'),
('cat-paisagens', 'Paisagens', 'paisagens', 'Cenários naturais de tirar o fôlego, horizontes dramáticos e névoa matinal.', 'Mountain', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'),
('cat-fotografia-profissional', 'Fotografia Profissional', 'fotografia-profissional', 'Iluminação três pontos, fundos neutros impecáveis e headshots corporativos.', 'Camera', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'),
('cat-vintage', 'Vintage', 'vintage', 'Grão Kodak Portra 400, aberrações cromáticas nostálgicas dos anos 70, 80 e 90.', 'Clock', 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?auto=format&fit=crop&w=800&q=80'),
('cat-cyberpunk', 'Cyberpunk', 'cyberpunk', 'Ruas noturnas molhadas de Tóquio, luzes de neon azul e magenta com fumaça e reflexos.', 'Zap', 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80'),
('cat-flash-photography', 'Flash Photography', 'flash-photography', 'Flash frontal direto, estética de festa noturna de paparazzi e sombras recortadas.', 'CameraOff', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'),
('cat-preto-e-branco', 'Preto e Branco', 'preto-e-branco', 'Alto contraste em prata, sombras profundas e composição geométrica clássica.', 'Layers', 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- 7.2. Inserir Coleções
INSERT INTO public.collections (id, name, slug, description, cover_image, is_published, is_premium, category_id) VALUES
('col-cinematic', 'Cinematic Collection', 'cinematic-collection', 'Iluminação dramática com proporção 2.39:1 inspirada em diretores renomados de cinema.', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1000&q=80', true, false, 'cat-cinematografico'),
('col-luxury', 'Luxury Portraits', 'luxury-portraits', 'Retratos sofisticados com texturas ricas de seda, ouro e arquiteturas de alto padrão.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80', true, false, 'cat-luxo'),
('col-urban-flash', 'Urban Flash', 'urban-flash', 'Estética de editorial de moda noturna com flash direto em cenários urbanos vibrantes.', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80', true, false, 'cat-flash-photography'),
('col-old-money', 'Old Money', 'old-money-aesthetic', 'Elegância discreta e herança aristocrática fotografada em dias amenos na Toscana.', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80', true, false, 'cat-old-money'),
('col-vintage-memories', 'Vintage Memories', 'vintage-memories', 'Cores quentes e grão analógico dos filmes Kodak e Fujifilm dos anos 80 e 90.', 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?auto=format&fit=crop&w=1000&q=80', true, false, 'cat-vintage'),
('col-ai-studio-pro', 'AI Studio Pro', 'ai-studio-pro', 'Setups complexos de estúdio para fotografia comercial e e-commerce de alto nível.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80', true, false, 'cat-fotografia-profissional'),
('col-editorial-fashion', 'Editorial Fashion', 'editorial-fashion', 'Campanhas de vanguarda com styling arrojado e ângulos de câmera dinâmicos.', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80', true, false, 'cat-moda'),
('col-creative-landscapes', 'Creative Landscapes', 'creative-landscapes', 'Fusão de geografia monumental com atmosfera onírica e iluminação épica.', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80', true, false, 'cat-paisagens')
ON CONFLICT (id) DO NOTHING;

-- 7.3. Inserir Prompts Iniciais
INSERT INTO public.prompts (id, title, slug, description, prompt_text, cover_image, original_image, image_alt, category_id, tags, tool_name, instructions, collection_id, is_published, is_premium, views_count, copies_count, aspect_ratio, parameters) VALUES
(
  'prompt-1',
  'Retrato Cinematográfico em 35mm',
  'retrato-cinematografico-35mm',
  'Transformação de selfie amadora em cena cinematográfica com profundidade de campo f/1.4, bokeh suave e luz lateral de janela.',
  'Cinematic portrait shot on 35mm Panavision lens, shallow depth of field f/1.4, natural chiaroscuro sidelight from high-contrast window, subtle film grain, Kodak 5219 color grade, hyper-realistic skin texture, expressive gaze, moody teal and warm amber shadows, photorealistic, 8k resolution --ar 4:5 --v 6.0 --style raw',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80',
  'Comparação antes e depois: retrato amador transformado em cena de cinema 35mm',
  'cat-cinematografico',
  ARRAY['Cinema', '35mm', 'Iluminação Suave', 'Profundidade', 'Retrato'],
  'ChatGPT & Gemini',
  '1. Abra o ChatGPT (Plus/GPT-4o) ou Google Gemini no celular ou computador.\n2. Clique no ícone de anexo (+) e envie a sua foto de referência.\n3. Cole o prompt acima no campo de mensagem e envie.\n4. O chat de IA gerará a nova imagem aplicando o enquadramento cinematográfico de 35mm e iluminação de janela, mantendo a fisionomia original!',
  'col-cinematic',
  true,
  false,
  1420,
  534,
  '4:5',
  '{"Compatibilidade": "ChatGPT, Gemini, Copilot", "Modo": "Edição de foto enviada", "Proporção": "4:5 (Feed Instagram)", "Lente": "35mm f/1.4 Panavision"}'::jsonb
),
(
  'prompt-2',
  'Luxury Editorial Portrait',
  'luxury-editorial-portrait',
  'Estética de alta joalheria com reflexos dourados, tecido acetinado, maquiagem impecável e iluminação de estúdio de luxo.',
  'High-end luxury editorial portrait for Vogue, model adorned with delicate 18k gold fine jewelry, structured black silk trench coat, immaculate skin finish with authentic micro-pores, soft Broncolor studio softbox lighting, pristine dark slate background, warm champagne accents, elegant high-fashion pose, ultra-sharp detail --ar 4:5 --stylize 250 --v 6.0',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=80',
  'Comparação antes e depois de editorial de alta joalheria e moda de luxo',
  'cat-luxo',
  ARRAY['Alta Joalheria', 'Ouro', 'Vogue', 'Estúdio', 'Alta Costura'],
  'ChatGPT & Gemini',
  '1. Abra o ChatGPT ou Gemini e anexe a foto de rosto/busto.\n2. Cole: "Edite esta foto adicionando iluminação suave de estúdio Broncolor, tons dourados discretos de alta joalheria e acabamento de pele de capa de revista, mantendo o rosto exatamente igual ao original."\n3. Envie a mensagem e aguarde a foto editada em alta resolução.',
  'col-luxury',
  true,
  false,
  2180,
  789,
  '4:5',
  '{"Compatibilidade": "ChatGPT (GPT-4o), Gemini, Copilot", "Ação": "Retoque e iluminação de luxo", "Proporção": "4:5"}'::jsonb
),
(
  'prompt-3',
  'Urban Flash Photography',
  'urban-flash-photography',
  'Fotografia com flash direto noturno em metrópole, sombras recortadas e clima cru de paparazzi de celebridade.',
  'Direct on-camera flash street photography at 2am, candid motion, 90s party paparazzi aesthetic, crisp hard shadows behind subject, damp asphalt reflecting street lights, authentic casual streetwear, slight motion blur in background, vibrant authentic colors, flash bounced harsh realism --ar 4:5',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
  'Urban flash photography de rua à noite com flash direto e sombras recortadas',
  'cat-flash-photography',
  ARRAY['Flash Direto', 'Paparazzi', 'Noite Urbana', '90s', 'Festa'],
  'ChatGPT & Gemini',
  '1. No ChatGPT ou Gemini, anexe uma foto casual de festa ou look de rua.\n2. Cole o prompt solicitando estética de flash direto noturno com sombra marcada.\n3. O chat transformará a imagem em uma foto de paparazzi de alta vibração!',
  'col-urban-flash',
  true,
  false,
  1890,
  620,
  '4:5',
  '{"Compatibilidade": "Qualquer Chat de IA", "Estilo": "Paparazzi 90s com Flash", "Iluminação": "Flash Direto"}'::jsonb
),
(
  'prompt-4',
  'Old Money Riviera Portrait',
  'old-money-riviera-portrait',
  'Estética clássica aristocrática italiana, camisa de linho branco, óculos tartaruga e luz natural de fim de tarde na marina.',
  'Old money aesthetic portrait aboard a classic wooden Riva yacht in Portofino, wearing crisp white linen shirt unbuttoned at collar, tortoiseshell vintage sunglasses, sun-kissed skin, relaxed aristocratic composure, golden hour Mediterranean soft sunlight, hazy coastal hills in background, Kodachrome film tones, timeless luxury --ar 4:5',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80',
  'Retrato masculino estilo old money em iate clássico na Riviera',
  'cat-old-money',
  ARRAY['Old Money', 'Linho', 'Riviera', 'Iate', 'Golden Hour'],
  'ChatGPT & Gemini',
  '1. No chat (ChatGPT/Gemini/Copilot), anexe a foto da pessoa.\n2. Cole este comando pedindo para ambientar a pessoa em um iate clássico com linho branco e luz mediterrânea.\n3. A IA preservará a identidade facial e criará o cenário completo.',
  'col-old-money',
  true,
  false,
  3100,
  1140,
  '4:5',
  '{"Compatibilidade": "ChatGPT, Gemini, Copilot", "Estilo": "Quiet Luxury Riviera", "Cores": "Kodachrome 64"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
