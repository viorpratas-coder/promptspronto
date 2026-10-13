import { Category, Collection, FilterOptions, Prompt, Profile } from '../types';
import { DEMO_CATEGORIES, DEMO_COLLECTIONS, DEMO_PROMPTS } from '../data/demoData';
import { supabase, isSupabaseConfigured } from './supabase';
import { storageService } from './storageService';

export const promptService = {
  // Get all active categories
  async getCategories(): Promise<Category[]> {
    const deletedCatIds = storageService.getDeletedCategoryIds();
    const localCats = storageService.getLocalCategories();

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        if (!error && data && data.length > 0) {
          return data as Category[];
        }
      } catch (e) {
        console.warn('Falling back to demo categories:', e);
      }
    }

    // Merge demo with local categories
    const map = new Map<string, Category>();
    DEMO_CATEGORIES.forEach((c) => {
      if (!deletedCatIds.includes(c.id)) {
        map.set(c.id, c);
      }
    });
    localCats.forEach((c) => {
      if (!deletedCatIds.includes(c.id)) {
        map.set(c.id, c);
      }
    });

    return Array.from(map.values());
  },

  // Save or edit a category
  async saveCategory(catData: Partial<Category>): Promise<{ success: boolean; category?: Category; error?: string }> {
    if (!catData.name) {
      return { success: false, error: 'O nome da categoria é obrigatório.' };
    }

    const slug = catData.slug || catData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const categoryRecord: Category = {
      id: catData.id || `cat-${slug}-${Date.now().toString().slice(-4)}`,
      name: catData.name.trim(),
      slug,
      description: catData.description || `Edições fotográficas da categoria ${catData.name}.`,
      icon: catData.icon || 'Sparkles',
      cover_image: catData.cover_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('categories').upsert(categoryRecord, { onConflict: 'id' });
        if (error) {
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        return { success: false, error: e.message || 'Falha ao salvar no Supabase' };
      }
    } else {
      storageService.saveLocalCategory(categoryRecord);
    }

    return { success: true, category: categoryRecord };
  },

  // Delete a category
  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) {
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    } else {
      storageService.deleteLocalCategory(id);
    }
    return { success: true };
  },

  // Get collections
  async getCollections(): Promise<Collection[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Collection[];
        }
      } catch (e) {
        console.warn('Falling back to demo collections:', e);
      }
    }
    return DEMO_COLLECTIONS;
  },

  // Get single collection by slug
  async getCollectionBySlug(slug: string): Promise<Collection | null> {
    const collections = await this.getCollections();
    return collections.find(c => c.slug === slug) || null;
  },

  // Get all prompts (combines Supabase or Demo + locally created, filtering deleted)
  async getAllRawPrompts(): Promise<Prompt[]> {
    const localCreated = storageService.getLocalCreatedPrompts();
    const deletedPromptIds = storageService.getDeletedPromptIds();

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('prompts')
          .select('*, categories(name), collections(name)')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((item: any) => ({
            ...item,
            category_name: item.categories?.name || 'Geral',
            collection_name: item.collections?.name || undefined,
          })) as Prompt[];
        }
      } catch (e) {
        console.warn('Supabase error, returning fallback dataset:', e);
      }
    }

    // Merge demo prompts with locally created ones
    const combined = [...localCreated];
    for (const demo of DEMO_PROMPTS) {
      if (!combined.some(p => p.id === demo.id) && !deletedPromptIds.includes(demo.id)) {
        combined.push(demo);
      }
    }
    return combined.filter(p => !deletedPromptIds.includes(p.id));
  },

  // Filter, sort and paginate prompts
  async getPrompts(
    filters: Partial<FilterOptions> = {},
    options: { includeUnpublished?: boolean } = {}
  ): Promise<{ prompts: Prompt[]; total: number }> {
    let list = await this.getAllRawPrompts();

    // Unless admin requested, only show published
    if (!options.includeUnpublished) {
      list = list.filter(p => p.is_published !== false);
    }

    // Search query: title, description, category, tags, tool
    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim().toLowerCase();
      list = list.filter(p => {
        const titleMatch = p.title.toLowerCase().includes(term);
        const descMatch = p.description.toLowerCase().includes(term);
        const catMatch = (p.category_name || '').toLowerCase().includes(term);
        const toolMatch = (p.tool_name || '').toLowerCase().includes(term);
        const tagMatch = p.tags && p.tags.some(t => t.toLowerCase().includes(term));
        return titleMatch || descMatch || catMatch || toolMatch || tagMatch;
      });
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      const selectedCat = filters.category.toLowerCase();
      list = list.filter(p => 
        p.category_id === filters.category || 
        p.category_name?.toLowerCase() === selectedCat
      );
    }

    // Collection filter
    if (filters.collection && filters.collection !== 'all') {
      list = list.filter(p => p.collection_id === filters.collection);
    }

    // Tool filter
    if (filters.tool && filters.tool !== 'all') {
      list = list.filter(p => p.tool_name.toLowerCase().includes(filters.tool!.toLowerCase()));
    }

    // Access filter (free / premium)
    if (filters.access === 'free') {
      list = list.filter(p => !p.is_premium);
    } else if (filters.access === 'premium') {
      list = list.filter(p => p.is_premium);
    }

    // Sorting
    if (filters.sortBy === 'popular') {
      list.sort((a, b) => (b.copies_count + b.views_count) - (a.copies_count + a.views_count));
    } else if (filters.sortBy === 'alpha') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Recent (default)
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return {
      prompts: list,
      total: list.length,
    };
  },

  // Get prompt by slug
  async getPromptBySlug(slug: string): Promise<Prompt | null> {
    const list = await this.getAllRawPrompts();
    return list.find(p => p.slug === slug || p.id === slug) || null;
  },

  // Get related prompts
  async getRelatedPrompts(currentId: string, categoryId: string, limit = 4): Promise<Prompt[]> {
    const list = await this.getAllRawPrompts();
    const filtered = list
      .filter(p => p.id !== currentId && p.is_published !== false)
      .sort((a, b) => (a.category_id === categoryId ? -1 : 1))
      .slice(0, limit);
    return filtered;
  },

  // Get saved favorite prompts
  async getFavoritePrompts(): Promise<Prompt[]> {
    const favoriteIds = storageService.getLocalFavoriteIds();
    if (favoriteIds.length === 0) return [];

    const all = await this.getAllRawPrompts();
    return all.filter(p => favoriteIds.includes(p.id));
  },

  // Track copy count
  async recordCopy(promptId: string): Promise<void> {
    // 1. Dispatch custom event for telemetry/UI
    window.dispatchEvent(new CustomEvent('prompt-copied', { detail: { promptId } }));

    // 2. Increment in Supabase if connected
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.rpc('increment_copies_count', { target_prompt_id: promptId });
      } catch (err) {
        // Fallback silently if RPC is not present
      }
    }
  },

  // Track view count
  async recordView(promptId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.rpc('increment_views_count', { target_prompt_id: promptId });
      } catch (err) {
        // Ignore
      }
    }
  },

  // Quick Save or Update Prompt (Instant public visibility)
  async savePrompt(promptData: Partial<Prompt>, adminProfile?: Profile | null): Promise<{ success: boolean; prompt?: Prompt; error?: string }> {
    if (!promptData.title || !promptData.prompt_text || !promptData.cover_image) {
      return { success: false, error: 'Título, texto do prompt e imagem de referência são obrigatórios.' };
    }

    const slug = promptData.slug || promptData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const now = new Date().toISOString();
    const promptRecord: Prompt = {
      id: promptData.id || `prompt-${Date.now()}`,
      title: promptData.title,
      slug,
      description: promptData.description || '',
      prompt_text: promptData.prompt_text,
      cover_image: promptData.cover_image,
      original_image: promptData.original_image || '',
      image_alt: promptData.image_alt || promptData.title,
      category_id: promptData.category_id || 'cat-retratos',
      tags: promptData.tags || ['Fotografia', 'IA'],
      tool_name: promptData.tool_name || 'Midjourney v6',
      instructions: promptData.instructions || 'Utilize no software de geração mantendo a imagem de referência.',
      collection_id: promptData.collection_id || undefined,
      is_published: promptData.is_published ?? true,
      is_premium: promptData.is_premium ?? false,
      views_count: promptData.views_count || 0,
      copies_count: promptData.copies_count || 0,
      aspect_ratio: promptData.aspect_ratio || '4:5',
      created_at: promptData.created_at || now,
      updated_at: now,
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('prompts')
          .upsert(promptRecord, { onConflict: 'id' });
        
        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Falha ao salvar no Supabase' };
      }
    } else {
      // Store locally so admin changes persist immediately in browser
      storageService.saveLocalCreatedPrompt(promptRecord);
    }

    return { success: true, prompt: promptRecord };
  },

  // Delete Prompt
  async deletePrompt(id: string, adminProfile?: Profile | null): Promise<{ success: boolean; error?: string }> {

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('prompts').delete().eq('id', id);
        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Falha ao excluir no Supabase' };
      }
    } else {
      storageService.deleteLocalCreatedPrompt(id);
    }

    return { success: true };
  },

  // Upload image to Supabase Storage or convert to preview URL
  async uploadImage(file: File, folder = 'covers'): Promise<{ success: boolean; url?: string; error?: string }> {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Formato inválido. Aceito apenas JPEG, PNG e WebP.' };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'Arquivo muito pesado. O tamanho máximo permitido é 5MB.' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('prompts')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (uploadError) {
          return { success: false, error: uploadError.message };
        }

        const { data: { publicUrl } } = supabase.storage
          .from('prompts')
          .getPublicUrl(fileName);

        return { success: true, url: publicUrl };
      } catch (err: any) {
        return { success: false, error: err.message || 'Falha no upload do Supabase Storage.' };
      }
    }

    // Local fallback using FileReader base64/object URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({ success: true, url: e.target?.result as string });
      };
      reader.onerror = () => {
        resolve({ success: false, error: 'Erro ao processar imagem localmente.' });
      };
      reader.readAsDataURL(file);
    });
  }
};
