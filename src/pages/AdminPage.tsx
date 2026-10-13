import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Lock,
  LogOut,
  Sparkles,
  Layers,
  Upload,
  Check,
  X,
  Search,
  FolderPlus,
  ExternalLink,
  Camera,
  Film,
  Crown,
  User,
  Shirt,
  Compass,
  Eye,
  EyeOff,
  Mountain,
  Clock,
  Zap,
  Database,
  CheckCircle2,
  AlertCircle,
  Key,
  Globe,
  RefreshCw,
  Unplug,
  UploadCloud,
} from 'lucide-react';
import { Category, Prompt } from '../types';
import { promptService } from '../services/promptService';
import { storageService } from '../services/storageService';
import {
  checkSupabaseConnection,
  getActiveCredentials,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseCredentials,
  syncLocalDataToSupabase,
  ConnectionStatus,
} from '../services/supabase';

interface AdminPageProps {
  categories: Category[];
  prompts: Prompt[];
  onRefreshData: () => void;
  onNavigatePublic: (tab: string) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const AVAILABLE_ICONS = [
  'Sparkles',
  'Camera',
  'Film',
  'Crown',
  'User',
  'Shirt',
  'Compass',
  'Eye',
  'Mountain',
  'Clock',
  'Zap',
  'Layers',
];

export const AdminPage: React.FC<AdminPageProps> = ({
  categories,
  prompts,
  onRefreshData,
  onNavigatePublic,
  onNotify,
}) => {
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => storageService.isAdminLoggedIn());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'prompts' | 'categories' | 'database'>('prompts');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  // Prompt Modal State
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Partial<Prompt> | null>(null);
  const [promptDeleteId, setPromptDeleteId] = useState<string | null>(null);

  // Prompt Form fields
  const [pTitle, setPTitle] = useState('');
  const [pCategoryId, setPCategoryId] = useState('');
  const [pCoverImage, setPCoverImage] = useState('');
  const [pOriginalImage, setPOriginalImage] = useState('');
  const [pPromptText, setPPromptText] = useState('');
  const [pToolName, setPToolName] = useState('ChatGPT & Gemini');
  const [pInstructions, setPInstructions] = useState('');
  const [pTags, setPTags] = useState('');
  const [pUploading, setPUploading] = useState(false);
  const [pSubmitting, setPSubmitting] = useState(false);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [categoryDeleteId, setCategoryDeleteId] = useState<string | null>(null);

  // Category Form fields
  const [cName, setCName] = useState('');
  const [cDescription, setCDescription] = useState('');
  const [cIcon, setCIcon] = useState('Sparkles');
  const [cCoverImage, setCCoverImage] = useState('');
  const [cSubmitting, setCSubmitting] = useState(false);

  // Supabase Database Connection State
  const [dbUrl, setDbUrl] = useState(() => getActiveCredentials().url);
  const [dbAnonKey, setDbAnonKey] = useState(() => getActiveCredentials().anonKey);
  const [showDbKey, setShowDbKey] = useState(false);
  const [dbStatus, setDbStatus] = useState<ConnectionStatus | null>(null);
  const [dbTesting, setDbTesting] = useState(false);
  const [dbSaving, setDbSaving] = useState(false);
  const [dbSyncing, setDbSyncing] = useState(false);
  const [dbTestMessage, setDbTestMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Monitor database connection status
  useEffect(() => {
    checkSupabaseConnection().then(setDbStatus);
  }, []);

  useEffect(() => {
    if (activeTab === 'database') {
      const creds = getActiveCredentials();
      setDbUrl(creds.url);
      setDbAnonKey(creds.anonKey);
      checkSupabaseConnection().then(setDbStatus);
    }
  }, [activeTab]);

  const handleTestDbConnection = async () => {
    setDbTesting(true);
    setDbTestMessage(null);
    try {
      const res = await testSupabaseCredentials(dbUrl, dbAnonKey);
      if (!res.isConfigured) {
        setDbTestMessage({ type: 'error', text: res.message });
        onNotify('error', 'Credenciais inválidas', res.message);
      } else if (res.isConnected && res.hasSchema === false) {
        setDbTestMessage({
          type: 'warning',
          text: 'Conexão validada com sucesso! Porém a tabela "prompts" não foi encontrada. Execute o script SQL no Supabase SQL Editor.',
        });
        onNotify('info', 'Servidor conectado', 'Execute o script SQL para criar as tabelas.');
      } else if (res.isConnected) {
        setDbTestMessage({
          type: 'success',
          text: 'Conexão estabelecida com sucesso! O banco de dados e as tabelas estão prontos.',
        });
        onNotify('success', 'Conexão confirmada!', 'Supabase respondendo normalmente.');
      } else {
        setDbTestMessage({ type: 'error', text: res.message });
        onNotify('error', 'Falha ao conectar', res.message);
      }
    } catch (err: any) {
      setDbTestMessage({ type: 'error', text: err.message || 'Erro inesperado ao testar conexão.' });
      onNotify('error', 'Erro ao testar', err.message);
    } finally {
      setDbTesting(false);
    }
  };

  const handleSaveDbConnection = async () => {
    if (!dbUrl.trim() || !dbAnonKey.trim()) {
      onNotify('error', 'Campos incompletos', 'Preencha a URL e a Chave Anon do Supabase.');
      return;
    }
    setDbSaving(true);
    setDbTestMessage(null);
    try {
      const res = await saveSupabaseConfig(dbUrl, dbAnonKey);
      const newStatus = await checkSupabaseConnection();
      setDbStatus(newStatus);
      if (newStatus.isConnected) {
        onNotify('success', 'Supabase Conectado!', 'Credenciais salvas com sucesso. O sistema agora está integrado com seu banco na nuvem.');
        setDbTestMessage({
          type: newStatus.hasSchema === false ? 'warning' : 'success',
          text: newStatus.message,
        });
        onRefreshData();
      } else {
        onNotify('error', 'Erro na conexão', newStatus.message);
        setDbTestMessage({ type: 'error', text: newStatus.message });
      }
    } catch (err: any) {
      onNotify('error', 'Falha ao salvar', err.message || 'Erro desconhecido');
      setDbTestMessage({ type: 'error', text: err.message });
    } finally {
      setDbSaving(false);
    }
  };

  const handleDisconnectDb = () => {
    clearSupabaseConfig();
    setDbUrl('');
    setDbAnonKey('');
    setDbTestMessage(null);
    checkSupabaseConnection().then(setDbStatus);
    onNotify('info', 'Supabase desconectado', 'Retornado ao modo catálogo local demonstrativo.');
    onRefreshData();
  };

  const handleSyncDataToSupabase = async () => {
    setDbSyncing(true);
    try {
      const res = await syncLocalDataToSupabase(categories, prompts);
      if (res.success) {
        onNotify(
          'success',
          'Dados sincronizados!',
          `${res.categoriesCount} categorias e ${res.promptsCount} prompts salvos no Supabase.`
        );
        setDbTestMessage({
          type: 'success',
          text: `Sincronização concluída com sucesso! ${res.categoriesCount} categorias e ${res.promptsCount} prompts foram gravados no banco de dados.`,
        });
        onRefreshData();
      } else {
        onNotify('error', 'Erro ao sincronizar', res.error || 'Falha ao enviar registros');
        setDbTestMessage({
          type: 'error',
          text: res.error || 'Não foi possível sincronizar os dados locais com o Supabase.',
        });
      }
    } catch (err: any) {
      onNotify('error', 'Erro na sincronização', err.message);
    } finally {
      setDbSyncing(false);
    }
  };

  // Check login session
  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(storageService.isAdminLoggedIn());
    };
    window.addEventListener('admin-auth-changed', handleAuthChange);
    return () => window.removeEventListener('admin-auth-changed', handleAuthChange);
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple secure check (Default: admin / admin123 or vior / vior2026)
    const validUsers = ['admin', 'vior', 'viorpratas'];
    const validPasses = ['admin123', 'vior2026', 'vioradmin'];

    if (
      validUsers.includes(username.trim().toLowerCase()) &&
      validPasses.includes(password.trim())
    ) {
      storageService.setAdminLoggedIn(true);
      setIsLoggedIn(true);
      setLoginError('');
      onNotify('success', 'Acesso autorizado!', 'Bem-vindo ao painel administrativo.');
    } else {
      setLoginError('Nome de usuário ou senha incorretos.');
    }
  };

  const handleLogout = () => {
    storageService.setAdminLoggedIn(false);
    setIsLoggedIn(false);
    onNotify('info', 'Sessão encerrada.');
  };

  // --- PROMPTS CRUD ---
  const openNewPromptModal = () => {
    setEditingPrompt(null);
    setPTitle('');
    setPCategoryId(categories[0]?.id || 'cat-retratos');
    setPCoverImage('');
    setPOriginalImage('');
    setPPromptText('');
    setPToolName('ChatGPT & Gemini');
    setPInstructions('');
    setPTags('Retrato, ChatGPT, Gemini');
    setIsPromptModalOpen(true);
  };

  const openEditPromptModal = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setPTitle(prompt.title);
    setPCategoryId(prompt.category_id);
    setPCoverImage(prompt.cover_image);
    setPOriginalImage(prompt.original_image || '');
    setPPromptText(prompt.prompt_text);
    setPToolName(prompt.tool_name || 'ChatGPT & Gemini');
    setPInstructions(prompt.instructions || '');
    setPTags(prompt.tags ? prompt.tags.join(', ') : '');
    setIsPromptModalOpen(true);
  };

  const handlePromptUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'original') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPUploading(true);
    const res = await promptService.uploadImage(file, target === 'cover' ? 'covers' : 'originals');
    setPUploading(false);

    if (res.success && res.url) {
      if (target === 'cover') setPCoverImage(res.url);
      else setPOriginalImage(res.url);
      onNotify('success', 'Imagem carregada com sucesso!');
    } else {
      onNotify('error', 'Falha no upload', res.error);
    }
  };

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle.trim() || !pCoverImage.trim() || !pPromptText.trim()) {
      onNotify('error', 'Campos obrigatórios', 'Preencha o título, a imagem e o texto do prompt.');
      return;
    }

    setPSubmitting(true);
    const selectedCat = categories.find((c) => c.id === pCategoryId);

    const tagsArray = pTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const promptData: Partial<Prompt> = {
      ...(editingPrompt?.id ? { id: editingPrompt.id } : {}),
      title: pTitle.trim(),
      slug:
        editingPrompt?.slug ||
        pTitle
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
      description: `Edição em estilo ${selectedCat?.name || 'IA'} para ChatGPT e Gemini.`,
      prompt_text: pPromptText.trim(),
      cover_image: pCoverImage.trim(),
      original_image: pOriginalImage.trim() || undefined,
      category_id: pCategoryId,
      category_name: selectedCat?.name || 'Geral',
      tags: tagsArray.length > 0 ? tagsArray : ['ChatGPT', 'Gemini'],
      tool_name: pToolName,
      instructions:
        pInstructions.trim() ||
        '1. Abra o ChatGPT ou Gemini.\n2. Anexe sua foto.\n3. Cole o prompt copiado e envie.',
      is_published: true,
      is_premium: false,
      aspect_ratio: '4:5',
    };

    const res = await promptService.savePrompt(promptData);
    setPSubmitting(false);

    if (res.success) {
      setIsPromptModalOpen(false);
      onNotify('success', editingPrompt ? 'Prompt atualizado!' : 'Novo prompt cadastrado!');
      onRefreshData();
    } else {
      onNotify('error', 'Falha ao salvar', res.error);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    const res = await promptService.deletePrompt(id);
    setPromptDeleteId(null);
    if (res.success) {
      onNotify('success', 'Prompt excluído com sucesso!');
      onRefreshData();
    } else {
      onNotify('error', 'Erro ao excluir', res.error);
    }
  };

  // --- CATEGORIES CRUD ---
  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCName('');
    setCDescription('');
    setCIcon('Sparkles');
    setCCoverImage('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCName(cat.name);
    setCDescription(cat.description || '');
    setCIcon(cat.icon || 'Sparkles');
    setCCoverImage(cat.cover_image || '');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) {
      onNotify('error', 'Nome obrigatório', 'Informe o nome da categoria.');
      return;
    }

    setCSubmitting(true);
    const catData: Partial<Category> = {
      ...(editingCategory?.id ? { id: editingCategory.id } : {}),
      name: cName.trim(),
      description: cDescription.trim(),
      icon: cIcon,
      cover_image: cCoverImage.trim() || undefined,
    };

    const res = await promptService.saveCategory(catData);
    setCSubmitting(false);

    if (res.success) {
      setIsCategoryModalOpen(false);
      onNotify('success', editingCategory ? 'Categoria atualizada!' : 'Categoria cadastrada!');
      onRefreshData();
    } else {
      onNotify('error', 'Erro ao salvar', res.error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await promptService.deleteCategory(id);
    setCategoryDeleteId(null);
    if (res.success) {
      onNotify('success', 'Categoria removida com sucesso!');
      onRefreshData();
    } else {
      onNotify('error', 'Erro ao excluir categoria', res.error);
    }
  };

  // Filtered items
  const filteredPrompts = prompts.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.title.toLowerCase().includes(term) ||
      (p.category_name || '').toLowerCase().includes(term) ||
      (p.prompt_text || '').toLowerCase().includes(term)
    );
  });

  const filteredCategories = categories.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term);
  });

  // 1. LOGIN SCREEN (If not authenticated)
  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0f111a] border border-white/10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1c1f2e] to-[#0c0d14] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] mx-auto shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Acesso ao Painel VIOOR
            </h1>
            <p className="text-xs text-gray-400">
              Digite seu usuário e senha para gerenciar prompts e categorias
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Nome de Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: admin"
                required
                autoFocus
                className="w-full px-3.5 py-3 rounded-xl bg-[#141724] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-3 rounded-xl bg-[#141724] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/20">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e5c35b] text-slate-950 font-bold text-xs tracking-wider uppercase hover:brightness-110 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] active:scale-[0.98]"
            >
              ENTRAR NO PAINEL
            </button>
          </form>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
            <span>Usuário padrão: <strong className="text-gray-300 font-mono">admin</strong></span>
            <span>Senha: <strong className="text-gray-300 font-mono">admin123</strong></span>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => onNavigatePublic('home')}
              className="text-xs text-[#d4af37] hover:underline"
            >
              Voltar ao Catálogo Público
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. LOGGED-IN ADMIN DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Shield className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Painel Integrado VIOOR
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37] text-slate-950">
              Admin
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Gerencie prompts, edições e categorias do catálogo público em um só lugar
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigatePublic('home')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white border border-white/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Ver Catálogo</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs between Prompts, Categories & Database */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-[#12141e] rounded-xl border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('prompts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'prompts'
                ? 'bg-[#d4af37] text-slate-950 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prompts ({prompts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-[#d4af37] text-slate-950 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Categorias ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'database'
                ? 'bg-[#d4af37] text-slate-950 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Banco de Dados (Supabase)</span>
            {dbStatus?.isConnected ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Conectado ao Supabase"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400/80 shrink-0" title="Modo Local Demonstrativo"></span>
            )}
          </button>
        </div>

        {/* Action Button for current tab */}
        <div>
          {activeTab === 'prompts' ? (
            <button
              type="button"
              onClick={openNewPromptModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e5c35b] text-slate-950 font-bold text-xs tracking-wide hover:brightness-110 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>ADICIONAR PROMPT</span>
            </button>
          ) : activeTab === 'categories' ? (
            <button
              type="button"
              onClick={openNewCategoryModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e5c35b] text-slate-950 font-bold text-xs tracking-wide hover:brightness-110 transition-all shadow-md active:scale-95"
            >
              <FolderPlus className="w-4 h-4 stroke-[2.5]" />
              <span>NOVA CATEGORIA</span>
            </button>
          ) : (
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#12141e] border border-white/10 text-gray-300 hover:text-white font-bold text-xs tracking-wide hover:border-[#d4af37]/50 transition-all shadow-md active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>ABRIR SUPABASE DASHBOARD</span>
            </a>
          )}
        </div>
      </div>

      {/* Search Input for Admin Table (only on prompts/categories) */}
      {activeTab !== 'database' && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'prompts'
                ? 'Buscar prompts por título, categoria ou comando...'
                : 'Buscar categorias por nome ou descrição...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12141e] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#d4af37]"
          />
        </div>
      )}

      {/* --- TAB 1: PROMPTS TABLE --- */}
      {activeTab === 'prompts' && (
        <div className="rounded-2xl bg-[#12141e] border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#171a27] text-gray-400 text-[11px] uppercase tracking-wider border-b border-white/8">
                <tr>
                  <th className="py-3 px-4">Referência</th>
                  <th className="py-3 px-4">Título do Prompt</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Compatibilidade</th>
                  <th className="py-3 px-4">Antes / Depois</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPrompts.length > 0 ? (
                  filteredPrompts.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-12 h-14 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0">
                          <img
                            src={p.cover_image}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-bold text-white truncate">{p.title}</p>
                        <p className="text-[11px] text-gray-400 font-mono truncate line-clamp-1 mt-0.5">
                          {p.prompt_text}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#d4af37]/15 text-amber-200 border border-[#d4af37]/30 text-[11px] font-medium">
                          {p.category_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-gray-300 font-mono text-[11px]">
                          {p.tool_name || 'ChatGPT & Gemini'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {p.original_image ? (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            ✓ Comparador Ativo
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500">
                            Apenas resultado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditPromptModal(p)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-[#d4af37]/20 text-gray-300 hover:text-amber-200 transition-colors"
                            title="Editar Prompt"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {promptDeleteId === p.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-950 p-1 rounded-lg border border-rose-500/50">
                              <button
                                type="button"
                                onClick={() => handleDeletePrompt(p.id)}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                              >
                                Excluir
                              </button>
                              <button
                                type="button"
                                onClick={() => setPromptDeleteId(null)}
                                className="p-0.5 text-gray-400 hover:text-white"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPromptDeleteId(p.id)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 transition-colors"
                              title="Excluir Prompt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Nenhum prompt encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: CATEGORIES LIST & EDIT --- */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded-2xl bg-[#12141e] border border-white/10 flex flex-col justify-between gap-3 shadow-md hover:border-[#d4af37]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1a1e2e] border border-white/10 flex items-center justify-center text-[#d4af37] shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                    <p className="text-[10px] text-gray-500 font-mono">slug: {cat.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditCategoryModal(cat)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-[#d4af37]/20 text-gray-300 hover:text-amber-200 transition-colors"
                    title="Editar Categoria"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  {categoryDeleteId === cat.id ? (
                    <div className="inline-flex items-center gap-1 bg-rose-950 p-1 rounded-lg border border-rose-500/50">
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryDeleteId(null)}
                        className="p-0.5 text-gray-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCategoryDeleteId(cat.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 transition-colors"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-400 line-clamp-2">
                {cat.description || 'Sem descrição cadastrada.'}
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                <span>Prompts vinculados:</span>
                <span className="font-bold text-white">
                  {prompts.filter((p) => p.category_id === cat.id).length}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- TAB 3: SUPABASE DATABASE CONNECTION & SQL VIEWER --- */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Status Overview Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#12141e] border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37]">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Status da Conexão com o Supabase
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {dbStatus?.url
                      ? `Projeto ativo: ${dbStatus.url}`
                      : 'Nenhum banco de dados conectado (executando em modo catálogo local)'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {dbStatus?.isConnected && dbStatus?.hasSchema !== false ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Supabase Conectado (Produção)
                  </span>
                ) : dbStatus?.isConnected && dbStatus?.hasSchema === false ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    Conectado (Tabelas Pendentes)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 text-gray-300 border border-white/15">
                    <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                    Modo Local Demonstrativo
                  </span>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    setDbTesting(true);
                    const s = await checkSupabaseConnection();
                    setDbStatus(s);
                    setDbTesting(false);
                    onNotify(s.isConnected ? 'success' : 'info', 'Status atualizado', s.message);
                  }}
                  disabled={dbTesting}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
                  title="Atualizar Status de Conexão"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dbTesting ? 'animate-spin text-[#d4af37]' : ''}`} />
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              {dbStatus?.message ||
                'Configure abaixo a URL do Projeto e a Chave Pública Anon para que todas as fotos, prompts e categorias sejam sincronizados diretamente no seu banco de dados Supabase.'}
            </p>
          </div>

          {/* Supabase Credentials Configuration Form */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#12141e] border border-white/10 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5">
              <Key className="w-4 h-4 text-[#d4af37]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Configurar Credenciais do Banco Supabase
              </h3>
            </div>
            <p className="text-xs text-gray-400">
              Copie as credenciais do seu projeto no painel do Supabase em{' '}
              <strong className="text-gray-200">Project Settings → API</strong> e salve abaixo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field 1: Project URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                  <span>URL do Projeto (Project URL)</span>
                  <span className="text-[10px] text-gray-500 font-mono">https://*.supabase.co</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="url"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                    placeholder="https://seu-projeto.supabase.co"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0c13] border border-white/10 text-white placeholder-gray-600 text-xs font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Encontre em: <strong>Project Settings → API → Project URL</strong>
                </p>
              </div>

              {/* Field 2: Anon Public Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                  <span>Chave Pública Anon (anon public key)</span>
                  <span className="text-[10px] text-amber-400 font-mono">Chave de Acesso Pública</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showDbKey ? 'text' : 'password'}
                    value={dbAnonKey}
                    onChange={(e) => setDbAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0a0c13] border border-white/10 text-white placeholder-gray-600 text-xs font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDbKey(!showDbKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
                    title={showDbKey ? 'Ocultar chave' : 'Mostrar chave'}
                  >
                    {showDbKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Encontre em: <strong>Project Settings → API → Project API Keys → anon (public)</strong>
                </p>
              </div>
            </div>

            {/* Test or Save Feedback Alert */}
            {dbTestMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-start gap-3 border ${
                  dbTestMessage.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                    : dbTestMessage.type === 'warning'
                    ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                    : dbTestMessage.type === 'error'
                    ? 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                    : 'bg-blue-950/60 border-blue-500/30 text-blue-300'
                }`}
              >
                {dbTestMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                )}
                <div className="flex-1 leading-relaxed">
                  <p>{dbTestMessage.text}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestDbConnection}
                  disabled={dbTesting || dbSaving}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dbTesting ? 'animate-spin text-[#d4af37]' : ''}`} />
                  <span>{dbTesting ? 'TESTANDO CONEXÃO...' : 'TESTAR CONEXÃO'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveDbConnection}
                  disabled={dbSaving || dbTesting}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e5c35b] text-slate-950 text-xs font-bold hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{dbSaving ? 'SALVANDO & CONECTANDO...' : 'SALVAR & CONECTAR BANCO'}</span>
                </button>
              </div>

              {getActiveCredentials().source === 'stored' && (
                <button
                  type="button"
                  onClick={handleDisconnectDb}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
                >
                  <Unplug className="w-3.5 h-3.5 text-rose-400" />
                  <span>DESCONECTAR BANCO</span>
                </button>
              )}
            </div>
          </div>

          {/* Seed Database / Sync Local Data Tool */}
          {dbStatus?.isConnected && (
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#12141e] to-[#181525] border border-[#d4af37]/30 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37]">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Popular Banco com o Catálogo Atual (1-Clique)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Envie as {categories.length} categorias e os {prompts.length} prompts atuais diretamente para as tabelas do seu Supabase.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSyncDataToSupabase}
                  disabled={dbSyncing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c35b] text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0"
                >
                  <UploadCloud className={`w-4 h-4 ${dbSyncing ? 'animate-bounce' : ''}`} />
                  <span>{dbSyncing ? 'ENVIANDO REGISTROS...' : 'SINCRONIZAR TUDO NO SUPABASE'}</span>
                </button>
              </div>
            </div>
          )}

          {/* SQL Script Viewer and Instructions */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#12141e] border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#d4af37]" />
                  <h3 className="text-sm font-bold text-white">
                    Script de Criação do Banco de Dados (Supabase SQL Editor)
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mt-1 max-w-xl">
                  Execute este código completo no <strong>SQL Editor</strong> do seu Supabase para criar as tabelas (<code className="text-[#d4af37]">prompts</code>, <code className="text-[#d4af37]">categories</code>, <code className="text-[#d4af37]">collections</code>), o bucket de fotos e as permissões RLS.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const fullSql = `-- ==============================================================================
-- VIOOR PROMPTS — CATÁLOGO DE EDIÇÕES COM IA (CHATGPT & GEMINI)
-- SCRIPT DE CRIAÇÃO COMPLETO PARA O SUPABASE SQL EDITOR
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELA: categories
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Sparkles',
    cover_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA: collections
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

-- 3. TABELA: prompts
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

-- 4. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_prompts_slug ON public.prompts(slug);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON public.prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- 5. POLÍTICAS RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de Categorias" ON public.categories;
CREATE POLICY "Leitura de Categorias" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Gerenciamento de Categorias" ON public.categories;
CREATE POLICY "Gerenciamento de Categorias" ON public.categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Leitura de Prompts" ON public.prompts;
CREATE POLICY "Leitura de Prompts" ON public.prompts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Gerenciamento de Prompts" ON public.prompts;
CREATE POLICY "Gerenciamento de Prompts" ON public.prompts FOR ALL USING (true);

-- 6. STORAGE BUCKET PARA FOTOS
INSERT INTO storage.buckets (id, name, public) VALUES ('prompts', 'prompts', true) ON CONFLICT (id) DO UPDATE SET public = true;
DROP POLICY IF EXISTS "Visualização Pública de Imagens" ON storage.objects;
CREATE POLICY "Visualização Pública de Imagens" ON storage.objects FOR SELECT USING (bucket_id = 'prompts');
DROP POLICY IF EXISTS "Upload de Imagens" ON storage.objects;
CREATE POLICY "Upload de Imagens" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'prompts');
DROP POLICY IF EXISTS "Atualização e Exclusão de Imagens" ON storage.objects;
CREATE POLICY "Atualização e Exclusão de Imagens" ON storage.objects FOR ALL USING (bucket_id = 'prompts');`;

                  navigator.clipboard.writeText(fullSql);
                  setCopiedSql(true);
                  onNotify('success', 'Script SQL copiado com sucesso!', 'Cole no SQL Editor do seu projeto Supabase.');
                  setTimeout(() => setCopiedSql(false), 3000);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e5c35b] text-slate-950 font-bold text-xs tracking-wide hover:brightness-110 transition-all shadow-md active:scale-95 shrink-0"
              >
                {copiedSql ? <Check className="w-4 h-4 text-slate-950" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
                <span>{copiedSql ? 'SQL COPIADO!' : 'COPIAR SCRIPT SQL'}</span>
              </button>
            </div>

            {/* Instructions Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0a0c13] border border-white/5 space-y-1">
                <span className="font-bold text-[#d4af37]">Passo 1</span>
                <p className="text-gray-300">Acesse o <strong>Supabase</strong> e abra a aba <strong>SQL Editor</strong>.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0a0c13] border border-white/5 space-y-1">
                <span className="font-bold text-[#d4af37]">Passo 2</span>
                <p className="text-gray-300">Cole o código SQL gerado e clique em <strong>Run (Executar)</strong>.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0a0c13] border border-white/5 space-y-1">
                <span className="font-bold text-[#d4af37]">Passo 3</span>
                <p className="text-gray-300">Copie as credenciais em <strong>Settings &gt; API</strong> e salve no formulário acima.</p>
              </div>
            </div>

            {/* SQL Preview Box */}
            <div className="rounded-2xl bg-[#07080d] border border-white/10 p-4 font-mono text-[11px] text-gray-300 max-h-80 overflow-y-auto leading-relaxed select-all">
              <pre>
{`-- O script completo está salvo no arquivo /supabase/schema.sql
-- Inclui:
-- 1. Tabela categories (id, name, slug, description, icon, cover_image)
-- 2. Tabela collections (id, name, slug, description, cover_image)
-- 3. Tabela prompts (id, title, slug, prompt_text, cover_image, original_image, tool_name...)
-- 4. Funções e índices de performance
-- 5. Row Level Security habilitado com políticas permissivas
-- 6. Bucket 'prompts' configurado no Supabase Storage`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CREATE / EDIT PROMPT --- */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[92vh] bg-[#0e1018] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#131622]">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                {editingPrompt ? 'Editar Prompt de Edição' : 'Cadastrar Novo Prompt'}
              </h2>
              <button
                type="button"
                onClick={() => setIsPromptModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrompt} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1">
                  Título da Edição / Estilo *
                </label>
                <input
                  type="text"
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  placeholder="Ex: Retrato Cinematográfico 35mm"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#151825] border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Categoria & Compatibilidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={pCategoryId}
                    onChange={(e) => setPCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#151825] border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-1">
                    Compatibilidade
                  </label>
                  <select
                    value={pToolName}
                    onChange={(e) => setPToolName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#151825] border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="ChatGPT & Gemini">ChatGPT & Google Gemini</option>
                    <option value="ChatGPT (GPT-4o)">ChatGPT (GPT-4o)</option>
                    <option value="Google Gemini">Google Gemini</option>
                    <option value="Microsoft Copilot">Microsoft Copilot</option>
                    <option value="Midjourney v6">Midjourney v6</option>
                    <option value="Qualquer Chat de IA">Qualquer Chat de IA</option>
                  </select>
                </div>
              </div>

              {/* Imagem de Referência (Capa) */}
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1">
                  Foto de Referência (Resultado da Edição) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={pCoverImage}
                    onChange={(e) => setPCoverImage(e.target.value)}
                    placeholder="https://... URL da foto de resultado"
                    required
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#151825] border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                  <label className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-medium cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handlePromptUpload(e, 'cover')}
                      className="hidden"
                    />
                  </label>
                </div>
                {pCoverImage && (
                  <div className="mt-2 w-16 h-20 rounded-lg overflow-hidden border border-white/10 bg-black">
                    <img src={pCoverImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Imagem Original (Antes/Depois) */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Foto Original (Opcional — habilita comparador Antes/Depois)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={pOriginalImage}
                    onChange={(e) => setPOriginalImage(e.target.value)}
                    placeholder="https://... URL da foto original antes da edição"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#151825] border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                  <label className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-medium cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handlePromptUpload(e, 'original')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Prompt Text */}
              <div>
                <label className="block text-xs font-semibold text-[#d4af37] mb-1">
                  Prompt Integral de Comando para o Chat *
                </label>
                <textarea
                  value={pPromptText}
                  onChange={(e) => setPPromptText(e.target.value)}
                  placeholder="Cole o comando para enviar no chat com a foto..."
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08090e] border border-white/15 text-gray-100 font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Instruções */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Instruções Adicionais (Opcional)
                </label>
                <input
                  type="text"
                  value={pInstructions}
                  onChange={(e) => setPInstructions(e.target.value)}
                  placeholder="Ex: No ChatGPT, solicite 'mantenha a mesma pessoa'."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#151825] border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Tags (Separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={pTags}
                  onChange={(e) => setPTags(e.target.value)}
                  placeholder="Retrato, Iluminação, Vintage"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#151825] border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPromptModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pSubmitting || pUploading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e5c35b] text-slate-950 font-bold text-xs tracking-wide hover:brightness-110 transition-all shadow-md disabled:opacity-50"
                >
                  {pSubmitting ? 'SALVANDO...' : editingPrompt ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR PROMPT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CREATE / EDIT CATEGORY --- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0e1018] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#131622]">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#d4af37]" />
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="Ex: Fotografia Noturna"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#151825] border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1">
                  Descrição da Estética
                </label>
                <textarea
                  value={cDescription}
                  onChange={(e) => setCDescription(e.target.value)}
                  placeholder="Explique o tipo de fotos e edições agrupadas nesta categoria..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#151825] border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1">
                  Ícone Representativo
                </label>
                <select
                  value={cIcon}
                  onChange={(e) => setCIcon(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#151825] border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                >
                  {AVAILABLE_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1">
                  Foto de Capa (URL Opcional)
                </label>
                <input
                  type="url"
                  value={cCoverImage}
                  onChange={(e) => setCCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#151825] border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e5c35b] text-slate-950 font-bold text-xs tracking-wide hover:brightness-110 transition-all shadow-md disabled:opacity-50"
                >
                  {cSubmitting ? 'SALVANDO...' : editingCategory ? 'SALVAR ALTERAÇÕES' : 'CRIAR CATEGORIA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
