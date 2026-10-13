import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'https://your-project.supabase.co' && 
    supabaseAnonKey !== 'your-anon-key'
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface ConnectionStatus {
  isConfigured: boolean;
  isConnected: boolean;
  message: string;
}

export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      isConfigured: false,
      isConnected: false,
      message: 'Supabase não configurado. Utilizando catálogo demonstrativo local de alta fidelidade.',
    };
  }

  try {
    const { error } = await supabase.from('prompts').select('id', { count: 'exact', head: true });
    if (error) {
      return {
        isConfigured: true,
        isConnected: false,
        message: `Erro ao conectar com o Supabase: ${error.message}`,
      };
    }
    return {
      isConfigured: true,
      isConnected: true,
      message: 'Conectado com sucesso ao banco de dados Supabase.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      isConfigured: true,
      isConnected: false,
      message: `Falha na conexão: ${errorMsg}`,
    };
  }
}
