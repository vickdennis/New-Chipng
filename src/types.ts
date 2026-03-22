export interface User {
  id: string | number;
  username: string;
  email: string;
  plan: 'free' | 'pro' | 'business';
  role: 'user' | 'admin';
  subscription_status?: string;
  next_billing_date?: string | null;
  is_featured?: boolean | number;
  created_at?: any;
}

export interface Profile extends User {
  user_id: string | number;
  display_name: string;
  bio: string;
  avatar_url: string;
  theme: string;
  font_family: string;
  bg_image_url: string;
  // Contact Info
  contact_first_name?: string;
  contact_last_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_organization?: string;
  contact_job_title?: string;
  contact_website?: string;
}

export interface Link {
  id: string | number;
  user_id: string | number;
  title: string;
  url: string;
  icon: string;
  position: number;
  clicks: number;
  active: number | boolean;
  color?: string;
  price?: number;
  is_product?: number | boolean;
}

export interface SocialFeed {
  id: string | number;
  user_id: string | number;
  type: 'instagram' | 'twitter' | 'tiktok' | 'youtube';
  url: string;
  position: number;
  active: number | boolean;
}

export interface Theme {
  id: string;
  name: string;
  bg: string;
  text: string;
  card: string;
  button: string;
  buttonText: string;
  is_premium?: boolean;
}

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Classic White',
    bg: 'bg-white',
    text: 'text-zinc-900',
    card: 'bg-zinc-50',
    button: 'bg-zinc-900',
    buttonText: 'text-white',
    is_premium: false
  },
  {
    id: 'dark',
    name: 'Midnight',
    bg: 'bg-zinc-950',
    text: 'text-zinc-50',
    card: 'bg-zinc-900',
    button: 'bg-zinc-50',
    buttonText: 'text-zinc-950',
    is_premium: false
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    bg: 'bg-orange-50',
    text: 'text-orange-950',
    card: 'bg-orange-100',
    button: 'bg-orange-600',
    buttonText: 'text-white',
    is_premium: true
  },
  {
    id: 'forest',
    name: 'Deep Forest',
    bg: 'bg-emerald-950',
    text: 'text-emerald-50',
    card: 'bg-emerald-900',
    button: 'bg-emerald-500',
    buttonText: 'text-white',
    is_premium: true
  }
];

export interface Font {
  id: string;
  name: string;
  family: string;
  is_premium?: boolean;
}

export const FONTS: Font[] = [
  { id: 'sans', name: 'Modern Sans', family: 'font-sans', is_premium: false },
  { id: 'serif', name: 'Elegant Serif', family: 'font-serif', is_premium: true },
  { id: 'mono', name: 'Technical Mono', family: 'font-mono', is_premium: true },
  { id: 'display', name: 'Bold Display', family: 'font-display', is_premium: true },
];
