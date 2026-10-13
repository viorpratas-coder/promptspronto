export type ToolName = 
  | 'ChatGPT (GPT-4o)'
  | 'Google Gemini'
  | 'Microsoft Copilot'
  | 'Midjourney v6' 
  | 'Flux.1' 
  | 'Qualquer Chat de IA';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  cover_image?: string;
  created_at?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  cover_image: string;
  prompt_count?: number;
  is_published: boolean;
  is_premium: boolean;
  category_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Prompt {
  id: string;
  title: string;
  slug: string;
  description: string;
  prompt_text: string;
  cover_image: string;
  original_image?: string;
  image_alt: string;
  category_id: string;
  category_name?: string;
  tags: string[];
  tool_name: ToolName | string;
  instructions: string;
  collection_id?: string;
  collection_name?: string;
  is_published: boolean;
  is_premium: boolean;
  views_count: number;
  copies_count: number;
  aspect_ratio?: string;
  parameters?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  role: 'admin' | 'user';
  email?: string;
  created_at: string;
}

export interface FilterOptions {
  search: string;
  category: string;
  tool: string;
  access: 'all' | 'free' | 'premium';
  sortBy: 'recent' | 'popular' | 'alpha';
  collection?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}
