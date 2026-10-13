import React, { useState } from 'react';
import {
  User,
  Shield,
  LogOut,
  LogIn,
  KeyRound,
  CheckCircle,
  Database,
  ExternalLink,
  Sparkles,
  Heart,
  Folder,
} from 'lucide-react';
import { Profile } from '../types';
import { authService } from '../services/authService';
import { isSupabaseConfigured, checkSupabaseConnection } from '../services/supabase';

interface ProfilePageProps {
  userProfile: Profile | null;
  onProfileUpdated: () => void;
  onNavigate: (tab: string) => void;
  favoritesCount: number;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userProfile,
  onProfileUpdated,
  onNavigate,
  favoritesCount,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setAuthLoading(true);
    setAuthError('');

    const res = await authService.signIn(email, password);
    setAuthLoading(false);

    if (res.success) {
      onProfileUpdated();
    } else {
      setAuthError(res.error || 'Erro ao realizar login.');
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    onProfileUpdated();
  };

  const handleTestRole = (role: 'admin' | 'user' | 'visitor') => {
    authService.setDemoModeRole(role);
    onProfileUpdated();
  };

  const handleTestSupabase = async () => {
    setSupabaseStatus('Verificando conexão...');
    const status = await checkSupabaseConnection();
    setSupabaseStatus(status.message);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-28">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-[#d4af37]" />
          Minha Conta & Configurações
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
          Gerenciamento de perfil, sincronização e status de conexão
        </p>
      </div>

      {/* Profile Card if Logged in */}
      {userProfile ? (
        <div className="p-6 rounded-2xl bg-[#12141e] border border-white/10 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1c1f2e] to-[#0c0d14] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-bold text-lg shadow-md overflow-hidden">
                {userProfile.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userProfile.display_name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{userProfile.display_name}</h3>
                  {userProfile.role === 'admin' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37] text-slate-950 flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" />
                      Administrador
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-gray-300">
                      Membro Gratuito
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{userProfile.email || 'Conta de demonstração'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-300 text-xs font-semibold border border-white/8 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da Conta</span>
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => onNavigate('favorites')}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-3 text-left transition-colors"
            >
              <Heart className="w-4 h-4 text-rose-400" />
              <div>
                <p className="text-xs font-semibold text-white">Favoritos</p>
                <p className="text-[10px] text-gray-400">{favoritesCount} itens salvos</p>
              </div>
            </button>

            {userProfile.role === 'admin' ? (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="p-3 rounded-xl bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/30 flex items-center gap-3 text-left transition-colors"
              >
                <Shield className="w-4 h-4 text-[#d4af37]" />
                <div>
                  <p className="text-xs font-semibold text-amber-200">Painel Admin</p>
                  <p className="text-[10px] text-gray-400">Gerenciar prompts e fotos</p>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('collections')}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-3 text-left transition-colors"
              >
                <Folder className="w-4 h-4 text-[#d4af37]" />
                <div>
                  <p className="text-xs font-semibold text-white">Coleções</p>
                  <p className="text-[10px] text-gray-400">Ver séries completas</p>
                </div>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Sign In / Sign Up Form */
        <div className="p-6 rounded-2xl bg-[#12141e] border border-white/10 space-y-5 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <LogIn className="w-4 h-4 text-[#d4af37]" />
              Entrar ou Criar Conta
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Acesso para sincronizar seus favoritos em múltiplos dispositivos ou gerenciar o catálogo.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0e15] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Senha {isConfigured ? '(Obrigatória no Supabase)' : '(Opcional em teste)'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0e15] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/20">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e5c35b] text-slate-950 font-bold text-xs tracking-wide hover:brightness-110 transition-all shadow-md disabled:opacity-50"
            >
              {authLoading ? 'CONECTANDO...' : 'ACESSAR CONTA'}
            </button>
          </form>
        </div>
      )}

      {/* Demo Switcher for fast evaluation */}
      <div className="p-5 rounded-2xl bg-[#12141e]/70 border border-white/8 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            Simulador de Perfis (Avaliação Rápida)
          </h4>
          <span className="text-[10px] text-gray-400">1-clique para testar</span>
        </div>
        <p className="text-xs text-gray-400">
          Você pode alternar instantaneamente entre perfis para testar o Painel Administrativo ou a experiência de Visitante:
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleTestRole('admin')}
            className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              userProfile?.role === 'admin'
                ? 'bg-[#d4af37]/20 border-[#d4af37] text-amber-200 shadow-sm'
                : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Perfil Administrador</span>
          </button>

          <button
            type="button"
            onClick={() => handleTestRole('visitor')}
            className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              !userProfile
                ? 'bg-[#d4af37]/20 border-[#d4af37] text-amber-200 shadow-sm'
                : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Perfil Visitante</span>
          </button>
        </div>
      </div>

      {/* Supabase Diagnostic & Configuration Status */}
      <div className="p-5 rounded-2xl bg-[#12141e]/50 border border-white/8 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#d4af37]" />
            Status da Conexão Supabase
          </h4>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              isConfigured
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}
          >
            {isConfigured ? 'Credenciais Inseridas' : 'Modo Catálogo Local'}
          </span>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          {isConfigured
            ? 'As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY foram detectadas no ambiente.'
            : 'O catálogo está funcionando com os dados demonstrativos locais e localStorage. Para sincronizar com seu projeto Supabase, basta definir VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env ou no painel de deploy do Netlify.'}
        </p>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleTestSupabase}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 hover:text-white transition-colors"
          >
            Testar Conectividade
          </button>
          {supabaseStatus && (
            <span className="text-xs text-gray-300">{supabaseStatus}</span>
          )}
        </div>
      </div>
    </div>
  );
};
