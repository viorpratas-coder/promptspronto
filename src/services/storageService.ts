import { Prompt } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const FAVORITES_STORAGE_KEY = 'aiprompts_favorites_v1';
const LOCAL_PROMPTS_KEY = 'vioor_local_prompts_v1';
const LOCAL_CATEGORIES_KEY = 'vioor_local_categories_v1';
const DELETED_PROMPTS_KEY = 'vioor_deleted_prompts_v1';
const DELETED_CATEGORIES_KEY = 'vioor_deleted_categories_v1';
const ADMIN_SESSION_KEY = 'vioor_admin_session_v1';

export const storageService = {
  // Get all favorited prompt IDs from localStorage (clean, deduplicated)
  getLocalFavoriteIds(): string[] {
    try {
      const data = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      const ids: string[] = [];
      for (const item of parsed) {
        const id = typeof item === 'string' ? item.trim() : (typeof item?.id === 'string' ? item.id.trim() : '');
        if (id && !ids.includes(id)) {
          ids.push(id);
        }
      }
      return ids;
    } catch {
      return [];
    }
  },

  // Check if a prompt is favorited
  isFavorite(promptId: string): boolean {
    if (!promptId) return false;
    const cleanId = String(promptId).trim();
    const list = this.getLocalFavoriteIds();
    return list.includes(cleanId);
  },

  // Toggle favorite status
  async toggleFavorite(promptId: string, userId?: string | null): Promise<boolean> {
    if (!promptId) return false;
    const cleanId = String(promptId).trim();
    const currentList = this.getLocalFavoriteIds();
    const isCurrentlyFav = currentList.includes(cleanId);
    let updatedList: string[];
    let isNowFavorite: boolean;

    if (isCurrentlyFav) {
      // Remove all occurrences
      updatedList = currentList.filter((id) => id !== cleanId);
      isNowFavorite = false;
    } else {
      // Add to front
      updatedList = [cleanId, ...currentList.filter((id) => id !== cleanId)];
      isNowFavorite = true;
    }

    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage:', e);
    }

    // Dispatch event immediately so all components react synchronously
    window.dispatchEvent(
      new CustomEvent('favorites-updated', {
        detail: { promptId: cleanId, isFavorite: isNowFavorite },
      })
    );

    // If user is authenticated and Supabase is configured, sync to database asynchronously
    if (userId && isSupabaseConfigured() && supabase) {
      try {
        if (isNowFavorite) {
          await supabase.from('favorites').upsert(
            { user_id: userId, prompt_id: cleanId },
            { onConflict: 'user_id,prompt_id' }
          );
        } else {
          await supabase.from('favorites').delete().match({ user_id: userId, prompt_id: cleanId });
        }
      } catch (e) {
        console.warn('Failed to sync favorite with Supabase:', e);
      }
    }

    return isNowFavorite;
  },

  // Clear all favorites
  clearFavorites(): void {
    try {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('favorites-updated', { detail: {} }));
    } catch {
      // Ignore
    }
  },

  // Local prompts created/edited via Admin Panel
  getLocalCreatedPrompts(): Prompt[] {
    try {
      const data = localStorage.getItem(LOCAL_PROMPTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveLocalCreatedPrompt(prompt: Prompt): void {
    try {
      const current = this.getLocalCreatedPrompts();
      const existingIdx = current.findIndex(p => p.id === prompt.id);
      if (existingIdx > -1) {
        current[existingIdx] = prompt;
      } else {
        current.unshift(prompt);
      }
      localStorage.setItem(LOCAL_PROMPTS_KEY, JSON.stringify(current));
    } catch {
      // Storage quota
    }
  },

  deleteLocalCreatedPrompt(promptId: string): void {
    try {
      const current = this.getLocalCreatedPrompts().filter(p => p.id !== promptId);
      localStorage.setItem(LOCAL_PROMPTS_KEY, JSON.stringify(current));

      // Also track deleted IDs to hide default demo prompts if deleted
      const deleted = this.getDeletedPromptIds();
      if (!deleted.includes(promptId)) {
        deleted.push(promptId);
        localStorage.setItem(DELETED_PROMPTS_KEY, JSON.stringify(deleted));
      }
    } catch {
      // Ignore
    }
  },

  getDeletedPromptIds(): string[] {
    try {
      const data = localStorage.getItem(DELETED_PROMPTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Category management
  getLocalCategories(): any[] {
    try {
      const data = localStorage.getItem(LOCAL_CATEGORIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveLocalCategory(category: any): void {
    try {
      const current = this.getLocalCategories();
      const existingIdx = current.findIndex(c => c.id === category.id);
      if (existingIdx > -1) {
        current[existingIdx] = category;
      } else {
        current.push(category);
      }
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(current));
    } catch {
      // Ignore
    }
  },

  deleteLocalCategory(categoryId: string): void {
    try {
      const current = this.getLocalCategories().filter(c => c.id !== categoryId);
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(current));

      const deleted = this.getDeletedCategoryIds();
      if (!deleted.includes(categoryId)) {
        deleted.push(categoryId);
        localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(deleted));
      }
    } catch {
      // Ignore
    }
  },

  getDeletedCategoryIds(): string[] {
    try {
      const data = localStorage.getItem(DELETED_CATEGORIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Admin authentication session
  isAdminLoggedIn(): boolean {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  },

  setAdminLoggedIn(val: boolean): void {
    try {
      if (val) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }
      window.dispatchEvent(new CustomEvent('admin-auth-changed'));
    } catch {
      // Ignore
    }
  }
};
