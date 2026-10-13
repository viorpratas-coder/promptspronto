/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Category,
  Collection,
  FilterOptions,
  Profile,
  Prompt,
  ToastMessage,
} from './types';
import { promptService } from './services/promptService';
import { storageService } from './services/storageService';
import { authService, AuthState } from './services/authService';
import { isSupabaseConfigured, checkSupabaseConnection } from './services/supabase';

// Components
import { Navbar } from './components/Navbar';
import { BottomNavigation } from './components/BottomNavigation';
import { Toast } from './components/Toast';
import { LoadingSkeletonGrid } from './components/LoadingSkeleton';

// Pages
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { PromptDetailPage } from './pages/PromptDetailPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { CollectionDetailPage } from './pages/CollectionDetailPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

type ViewMode =
  | 'home'
  | 'explore'
  | 'prompt-detail'
  | 'collections'
  | 'collection-detail'
  | 'favorites'
  | 'profile'
  | 'admin';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewMode>('home');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [favoritePrompts, setFavoritePrompts] = useState<Prompt[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Auth & Connection
  const [authState, setAuthState] = useState<AuthState>(authService.getEmptyState());
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(isSupabaseConfigured());

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Search & Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: 'all',
    tool: 'all',
    access: 'all',
    sortBy: 'recent',
  });

  const notify = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial load
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, cols, promptResult, currentAuth, connStatus] = await Promise.all([
        promptService.getCategories(),
        promptService.getCollections(),
        promptService.getPrompts({}),
        authService.getCurrentState(),
        checkSupabaseConnection(),
      ]);

      setCategories(cats);
      setCollections(cols);
      setAllPrompts(promptResult.prompts);
      setFilteredPrompts(promptResult.prompts);
      setAuthState(currentAuth);
      setIsSupabaseActive(connStatus.isConnected);

      // Load favorites
      const favList = storageService.getLocalFavoriteIds();
      setFavoriteIds(favList);
      setFavoritesCount(favList.length);
      const favs = promptResult.prompts.filter((p) => favList.includes(p.id));
      setFavoritePrompts(favs);

      // URL Routing check on boot (e.g. /prompt/:slug or direct link from Instagram bio)
      const path = window.location.pathname;
      if (path.startsWith('/prompt/')) {
        const slug = path.replace('/prompt/', '');
        const found = promptResult.prompts.find((p) => p.slug === slug || p.id === slug);
        if (found) {
          setSelectedPrompt(found);
          setCurrentTab('prompt-detail');
        }
      } else if (path === '/explorar') {
        setCurrentTab('explore');
      } else if (path === '/favoritos') {
        setCurrentTab('favorites');
      } else if (path === '/admin') {
        setCurrentTab('admin');
      }
    } catch (e) {
      console.error('Failed to load application data:', e);
      notify('error', 'Erro ao carregar dados', 'Verifique sua conexão');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadInitialData();

    // Listen for custom global events
    const handleFavUpdated = () => {
      const ids = storageService.getLocalFavoriteIds();
      setFavoriteIds(ids);
      setFavoritesCount(ids.length);
      promptService.getFavoritePrompts().then(setFavoritePrompts);
    };

    const handleAuthChanged = () => {
      authService.getCurrentState().then(setAuthState);
    };

    window.addEventListener('favorites-updated', handleFavUpdated);
    window.addEventListener('auth-changed', handleAuthChanged);

    const handleSupabaseConfigChanged = () => {
      loadInitialData();
    };
    window.addEventListener('supabase-config-changed', handleSupabaseConfigChanged);

    // Browser navigation (back/forward button)
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setCurrentTab(e.state.tab);
        if (e.state.prompt) setSelectedPrompt(e.state.prompt);
        if (e.state.collection) setSelectedCollection(e.state.collection);
      } else {
        setCurrentTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('favorites-updated', handleFavUpdated);
      window.removeEventListener('auth-changed', handleAuthChanged);
      window.removeEventListener('supabase-config-changed', handleSupabaseConfigChanged);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [loadInitialData]);

  // Synchronize filtered prompts when filters change
  useEffect(() => {
    let active = true;
    promptService.getPrompts(filters).then((res) => {
      if (active) {
        setFilteredPrompts(res.prompts);
      }
    });
    return () => {
      active = false;
    };
  }, [filters]);

  // Navigation controller
  const navigateTo = (tab: ViewMode, param?: any) => {
    if (tab === 'explore') {
      setFilters((prev) => ({
        ...prev,
        category: param?.category !== undefined ? param.category : (param?.sortBy ? 'all' : prev.category),
        sortBy: param?.sortBy !== undefined ? param.sortBy : prev.sortBy,
      }));
    }

    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Push state to browser history
    let newPath = '/';
    if (tab === 'explore') newPath = '/explorar';
    else if (tab === 'collections') newPath = '/colecoes';
    else if (tab === 'favorites') newPath = '/favoritos';
    else if (tab === 'profile') newPath = '/perfil';
    else if (tab === 'admin') newPath = '/admin';

    window.history.pushState({ tab }, '', newPath);
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setCurrentTab('prompt-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.pushState({ tab: 'prompt-detail', prompt }, '', `/prompt/${prompt.slug}`);
  };

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setCurrentTab('collection-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.pushState({ tab: 'collection-detail', collection }, '', `/colecao/${collection.slug}`);
  };

  const handlePromptCopiedToast = () => {
    notify('success', 'Prompt copiado!', 'Cole no ChatGPT, Google Gemini ou chat de IA com a foto.');
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-[#f3f4f6] flex flex-col selection:bg-[#d4af37]/30 selection:text-amber-200">
      {/* Toast feedback system */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navigation */}
      {currentTab !== 'admin' && (
        <Navbar
          currentTab={currentTab}
          onNavigate={(tab) => navigateTo(tab as ViewMode)}
          favoritesCount={favoritesCount}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-safe-nav">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
            <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
            <LoadingSkeletonGrid count={8} />
          </div>
        ) : (
          <>
            {currentTab === 'home' && (() => {
              // Apenas prompts marcados como favorito pelo usuário
              const popularList = allPrompts.filter((p) => favoriteIds.includes(p.id));
              const recentList = [...allPrompts].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );

              return (
                <HomePage
                  popularPrompts={popularList}
                  recentPrompts={recentList}
                  favoriteIds={favoriteIds}
                  onNavigate={(t, p) => navigateTo(t as ViewMode, p)}
                  onSelectPrompt={handleSelectPrompt}
                  onCopiedToast={handlePromptCopiedToast}
                />
              );
            })()}

            {currentTab === 'explore' && (
              <ExplorePage
                categories={categories}
                prompts={filteredPrompts}
                filters={filters}
                onFilterChange={setFilters}
                onResetFilters={() =>
                  setFilters({
                    search: '',
                    category: 'all',
                    tool: 'all',
                    access: 'all',
                    sortBy: 'recent',
                  })
                }
                onSelectPrompt={handleSelectPrompt}
                onCopiedToast={handlePromptCopiedToast}
              />
            )}

            {currentTab === 'prompt-detail' && selectedPrompt && (
              <PromptDetailPage
                prompt={selectedPrompt}
                relatedPrompts={allPrompts.filter(
                  (p) => p.id !== selectedPrompt.id && p.category_id === selectedPrompt.category_id
                )}
                onBack={() => navigateTo('home')}
                onSelectPrompt={handleSelectPrompt}
                onCopiedToast={handlePromptCopiedToast}
              />
            )}

            {currentTab === 'collections' && (
              <CollectionsPage
                collections={collections}
                onSelectCollection={handleSelectCollection}
              />
            )}

            {currentTab === 'collection-detail' && selectedCollection && (
              <CollectionDetailPage
                collection={selectedCollection}
                prompts={allPrompts.filter(
                  (p) => p.collection_id === selectedCollection.id || p.category_id === selectedCollection.category_id
                )}
                onBack={() => navigateTo('collections')}
                onSelectPrompt={handleSelectPrompt}
                onCopiedToast={handlePromptCopiedToast}
              />
            )}

            {currentTab === 'favorites' && (
              <FavoritesPage
                favoritePrompts={favoritePrompts}
                onSelectPrompt={handleSelectPrompt}
                onNavigate={(t) => navigateTo(t as ViewMode)}
                onRefreshFavorites={() => {
                  const ids = storageService.getLocalFavoriteIds();
                  setFavoriteIds(ids);
                  setFavoritesCount(ids.length);
                  promptService.getFavoritePrompts().then(setFavoritePrompts);
                }}
                onCopiedToast={handlePromptCopiedToast}
              />
            )}

            {currentTab === 'profile' && (
              <ProfilePage
                userProfile={authState.profile}
                onProfileUpdated={() => {
                  authService.getCurrentState().then(setAuthState);
                }}
                onNavigate={(t) => navigateTo(t as ViewMode)}
                favoritesCount={favoritesCount}
              />
            )}

            {currentTab === 'admin' && (
              <AdminPage
                categories={categories}
                prompts={allPrompts}
                onRefreshData={loadInitialData}
                onNavigatePublic={(t) => navigateTo(t as ViewMode)}
                onNotify={notify}
              />
            )}
          </>
        )}
      </main>

      {/* Discreet Footer for public pages */}
      {currentTab !== 'admin' && (
        <footer className="py-6 border-t border-white/5 text-center text-xs text-gray-500 pb-20 md:pb-6">
          <p>© 2026 VIOOR PROMPTS • Catálogo de Prompts para ChatGPT & Gemini</p>
        </footer>
      )}

      {/* Mobile Bottom Navigation (only on public view) */}
      {currentTab !== 'admin' && (
        <BottomNavigation
          currentTab={currentTab}
          onNavigate={(tab) => navigateTo(tab as ViewMode)}
          favoritesCount={favoritesCount}
        />
      )}
    </div>
  );
}
