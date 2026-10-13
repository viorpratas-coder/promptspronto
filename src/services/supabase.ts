import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Category, Prompt } from '../types';

export const SUPABASE_CREDENTIALS_STORAGE_KEY = 'vioor_supabase_credentials_v1';

export interface StoredCredentials {
  url: string;
  anonKey: string;
  updatedAt?: string;
}

export interface ConnectionStatus {
  isConfigured: boolean;
  isConnected: boolean;
  hasSchema?: boolean;
  message: string;
  source?: 'stored' | 'env' | 'none';
  url?: string;
}

// Retrieve custom credentials saved in localStorage
export function getStoredCredentials(): StoredCredentials | null {
  try {
    const raw = localStorage.getItem(SUPABASE_CREDENTIALS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.url === 'string' && typeof parsed.anonKey === 'string') {
      return {
        url: parsed.url.trim(),
        anonKey: parsed.anonKey.trim(),
        updatedAt: parsed.updatedAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Retrieve active credentials (stored first, then env fallback)
export function getActiveCredentials(): { url: string; anonKey: string; source: 'stored' | 'env' | 'none' } {
  const stored = getStoredCredentials();
  if (stored && stored.url && stored.anonKey) {
    return {
      url: stored.url,
      anonKey: stored.anonKey,
      source: 'stored',
    };
  }

  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (
    envUrl &&
    envKey &&
    envUrl !== 'https://your-project.supabase.co' &&
    envUrl !== 'https://seu-projeto.supabase.co' &&
    envKey !== 'your-anon-key' &&
    envKey !== 'sua-chave-anon-publica'
  ) {
    return {
      url: envUrl,
      anonKey: envKey,
      source: 'env',
    };
  }

  return {
    url: '',
    anonKey: '',
    source: 'none',
  };
}

// Check if valid credentials exist
export const isSupabaseConfigured = (): boolean => {
  const active = getActiveCredentials();
  return Boolean(
    active.url &&
    active.anonKey &&
    active.url.startsWith('http')
  );
};

// Initialize Supabase Client dynamically
function createSupabaseInstance(): SupabaseClient | null {
  const active = getActiveCredentials();
  if (!active.url || !active.anonKey) return null;
  try {
    return createClient(active.url, active.anonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Exported client with live binding
export let supabase: SupabaseClient | null = createSupabaseInstance();

export function getSupabase(): SupabaseClient | null {
  return supabase;
}

// Test credentials before saving
export async function testSupabaseCredentials(
  urlInput: string,
  keyInput: string
): Promise<ConnectionStatus> {
  const url = (urlInput || '').trim().replace(/\/+$/, '');
  const anonKey = (keyInput || '').trim();

  if (!url || !anonKey) {
    return {
      isConfigured: false,
      isConnected: false,
      message: 'Informe a URL do Projeto e a Chave Pública Anon.',
    };
  }

  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return {
      isConfigured: false,
      isConnected: false,
      message: 'A URL do Supabase deve iniciar com https:// (ex: https://xyz.supabase.co)',
    };
  }

  try {
    const tempClient = createClient(url, anonKey);

    // Test a basic select on prompts table
    const { error } = await tempClient
      .from('prompts')
      .select('id', { count: 'exact', head: true });

    if (!error) {
      return {
        isConfigured: true,
        isConnected: true,
        hasSchema: true,
        message: 'Conexão realizada com sucesso! As tabelas do catálogo estão prontas no Supabase.',
        url,
      };
    }

    const errCode = (error as any).code || '';
    const errMsg = error.message || '';

    // Check if table missing (PGRST204, 42P01) or RLS
    if (
      errCode === '42P01' ||
      errCode === 'PGRST204' ||
      errMsg.includes('relation "public.prompts" does not exist') ||
      errMsg.includes('relation "prompts" does not exist') ||
      errMsg.includes('does not exist')
    ) {
      return {
        isConfigured: true,
        isConnected: true,
        hasSchema: false,
        message: 'Credenciais válidas e servidor conectado! Porém a tabela "prompts" ainda não existe. Execute o Script SQL no SQL Editor.',
        url,
      };
    }

    // Invalid API key
    if (errMsg.includes('Invalid API key') || errMsg.includes('JWT') || error.code === 'PGRST301') {
      return {
        isConfigured: true,
        isConnected: false,
        message: 'Chave de API Anon inválida ou expirada. Verifique no painel do Supabase.',
        url,
      };
    }

    // Other Supabase response (could be permission or RLS, but credentials are alive)
    return {
      isConfigured: true,
      isConnected: true,
      hasSchema: true,
      message: `Conectado ao Supabase (${errMsg || 'Acesso permitido'})`,
      url,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      isConfigured: false,
      isConnected: false,
      message: `Erro ao tentar conectar: ${msg}`,
    };
  }
}

// Save credentials in localStorage and reload client
export async function saveSupabaseConfig(
  urlInput: string,
  keyInput: string
): Promise<ConnectionStatus> {
  const url = (urlInput || '').trim().replace(/\/+$/, '');
  const anonKey = (keyInput || '').trim();

  const testResult = await testSupabaseCredentials(url, anonKey);

  // Store in localStorage
  const toStore: StoredCredentials = {
    url,
    anonKey,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(SUPABASE_CREDENTIALS_STORAGE_KEY, JSON.stringify(toStore));

  // Re-create active client
  supabase = createSupabaseInstance();

  // Notify system of credentials change
  window.dispatchEvent(new CustomEvent('supabase-config-changed'));

  return testResult;
}

// Clear custom credentials and return to default
export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem(SUPABASE_CREDENTIALS_STORAGE_KEY);
    supabase = createSupabaseInstance();
    window.dispatchEvent(new CustomEvent('supabase-config-changed'));
  } catch (err) {
    console.error('Error clearing Supabase config:', err);
  }
}

// Check status of currently active connection
export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  const active = getActiveCredentials();

  if (!isSupabaseConfigured() || !supabase) {
    return {
      isConfigured: false,
      isConnected: false,
      hasSchema: false,
      source: active.source,
      message: 'Supabase não configurado. Utilizando catálogo demonstrativo local de alta fidelidade.',
    };
  }

  try {
    const { error } = await supabase.from('prompts').select('id', { count: 'exact', head: true });
    
    if (error) {
      const errCode = (error as any).code || '';
      const errMsg = error.message || '';

      if (
        errCode === '42P01' ||
        errCode === 'PGRST204' ||
        errMsg.includes('relation "prompts" does not exist') ||
        errMsg.includes('does not exist')
      ) {
        return {
          isConfigured: true,
          isConnected: true,
          hasSchema: false,
          source: active.source,
          url: active.url,
          message: 'Conectado ao Supabase, mas as tabelas ainda não foram criadas no SQL Editor.',
        };
      }

      return {
        isConfigured: true,
        isConnected: false,
        source: active.source,
        url: active.url,
        message: `Erro na conexão: ${error.message}`,
      };
    }

    return {
      isConfigured: true,
      isConnected: true,
      hasSchema: true,
      source: active.source,
      url: active.url,
      message: 'Conectado com sucesso ao banco de dados Supabase.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      isConfigured: true,
      isConnected: false,
      source: active.source,
      url: active.url,
      message: `Falha na conexão: ${errorMsg}`,
    };
  }
}

// Bulk sync local prompts and categories to Supabase
export async function syncLocalDataToSupabase(
  categories: Category[],
  prompts: Prompt[]
): Promise<{ success: boolean; categoriesCount: number; promptsCount: number; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      categoriesCount: 0,
      promptsCount: 0,
      error: 'Supabase não está configurado. Conecte o banco primeiro.',
    };
  }

  try {
    let catSuccess = 0;
    let promptSuccess = 0;

    // 1. Sync Categories
    if (categories.length > 0) {
      const catRows = categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || null,
        icon: c.icon || 'Sparkles',
        cover_image: c.cover_image || null,
      }));

      const { error: catErr } = await supabase
        .from('categories')
        .upsert(catRows, { onConflict: 'id' });

      if (catErr) {
        return {
          success: false,
          categoriesCount: 0,
          promptsCount: 0,
          error: `Erro ao sincronizar categorias: ${catErr.message}`,
        };
      }
      catSuccess = catRows.length;
    }

    // 2. Sync Prompts
    if (prompts.length > 0) {
      const promptRows = prompts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description || null,
        prompt_text: p.prompt_text,
        cover_image: p.cover_image,
        original_image: p.original_image || null,
        image_alt: p.image_alt || null,
        category_id: p.category_id,
        tags: p.tags || [],
        tool_name: p.tool_name || 'ChatGPT & Gemini',
        instructions: p.instructions || null,
        collection_id: p.collection_id || null,
        is_published: p.is_published ?? true,
        is_premium: p.is_premium ?? false,
        views_count: p.views_count || 0,
        copies_count: p.copies_count || 0,
        aspect_ratio: p.aspect_ratio || '4:5',
      }));

      const { error: promptErr } = await supabase
        .from('prompts')
        .upsert(promptRows, { onConflict: 'id' });

      if (promptErr) {
        return {
          success: false,
          categoriesCount: catSuccess,
          promptsCount: 0,
          error: `Erro ao sincronizar prompts: ${promptErr.message}`,
        };
      }
      promptSuccess = promptRows.length;
    }

    return {
      success: true,
      categoriesCount: catSuccess,
      promptsCount: promptSuccess,
    };
  } catch (err: any) {
    return {
      success: false,
      categoriesCount: 0,
      promptsCount: 0,
      error: err.message || 'Falha na sincronização dos dados com o Supabase.',
    };
  }
}
