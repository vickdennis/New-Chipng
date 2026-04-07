export type UserRole = 'user' | 'admin';
export type ThemeType = 'minimal' | 'neon' | 'glassmorphism' | 'dark' | 'sunset' | 'ocean' | 'forest' | 'royal' | 'coffee' | 'lavender' | 'midnight' | 'retro';
export type ButtonStyle = 'rounded' | 'pill' | 'square';
export type BackgroundType = 'solid' | 'gradient' | 'image';
export type PlanType = 'basic' | 'pro' | 'business';

export interface Appointment {
  id: string;
  title: string;
  dateTime: string;
  contactLink: string; // WhatsApp or email
}

export interface User {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  photoURL?: string;
  coverImageUrl?: string;
  role: UserRole;
  createdAt: string;
  status: 'active' | 'suspended';
  isPremium?: boolean;
  premiumUntil?: string;
  theme: ThemeType;
  buttonStyle: ButtonStyle;
  backgroundType: BackgroundType;
  backgroundColor?: string;
  backgroundImage?: string;
  totalClicks?: number;
  isVerified?: boolean;
  plan: PlanType;
  subscriptionStatus: 'active' | 'inactive';
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  appointmentsEnabled?: boolean;
  appointments?: Appointment[];
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    facebook?: string;
    whatsapp?: string;
    tiktok?: string;
    reddit?: string;
    discord?: string;
    telegram?: string;
    pinterest?: string;
    spotify?: string;
    applemusic?: string;
    soundcloud?: string;
    threads?: string;
    mastodon?: string;
    github?: string;
    twitch?: string;
    snapchat?: string;
    mail?: string;
  };
}

export interface Link {
  id: string;
  userId: string;
  title: string;
  url: string;
  icon?: string;
  active: boolean;
  position: number;
  clicks?: number;
  scheduledStart?: string;
  scheduledEnd?: string;
  type?: 'standard' | 'youtube' | 'tiktok';
}

export interface ThemeConfig {
  name: ThemeType;
  background: string;
  text: string;
  button: string;
  buttonText: string;
  accent: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  tags?: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  views?: number;
}

export const THEMES: Record<ThemeType, ThemeConfig> = {
  minimal: {
    name: 'minimal',
    background: 'bg-white',
    text: 'text-zinc-900',
    button: 'bg-zinc-100 hover:bg-zinc-200',
    buttonText: 'text-zinc-900',
    accent: 'bg-zinc-900',
  },
  neon: {
    name: 'neon',
    background: 'bg-zinc-950',
    text: 'text-white',
    button: 'bg-zinc-900 border border-lime-400 hover:bg-lime-400/10',
    buttonText: 'text-lime-400',
    accent: 'bg-lime-400',
  },
  glassmorphism: {
    name: 'glassmorphism',
    background: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
    text: 'text-white',
    button: 'bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30',
    buttonText: 'text-white',
    accent: 'bg-white',
  },
  dark: {
    name: 'dark',
    background: 'bg-zinc-900',
    text: 'text-zinc-100',
    button: 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700',
    buttonText: 'text-zinc-100',
    accent: 'bg-white',
  },
  sunset: {
    name: 'sunset',
    background: 'bg-gradient-to-b from-orange-400 to-rose-500',
    text: 'text-white',
    button: 'bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20',
    buttonText: 'text-white',
    accent: 'bg-orange-200',
  },
  ocean: {
    name: 'ocean',
    background: 'bg-gradient-to-br from-blue-600 to-cyan-500',
    text: 'text-white',
    button: 'bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40',
    buttonText: 'text-white',
    accent: 'bg-cyan-300',
  },
  forest: {
    name: 'forest',
    background: 'bg-gradient-to-br from-emerald-600 to-teal-700',
    text: 'text-white',
    button: 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20',
    buttonText: 'text-white',
    accent: 'bg-emerald-400',
  },
  royal: {
    name: 'royal',
    background: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900',
    text: 'text-white',
    button: 'bg-amber-400/10 border border-amber-400/50 hover:bg-amber-400/20',
    buttonText: 'text-amber-400',
    accent: 'bg-amber-400',
  },
  coffee: {
    name: 'coffee',
    background: 'bg-gradient-to-br from-stone-800 to-stone-900',
    text: 'text-stone-100',
    button: 'bg-stone-700 hover:bg-stone-600 border border-stone-600',
    buttonText: 'text-stone-100',
    accent: 'bg-orange-200',
  },
  lavender: {
    name: 'lavender',
    background: 'bg-gradient-to-br from-violet-200 to-pink-200',
    text: 'text-violet-900',
    button: 'bg-white/50 backdrop-blur-md border border-violet-300 hover:bg-white/70',
    buttonText: 'text-violet-900',
    accent: 'bg-violet-400',
  },
  midnight: {
    name: 'midnight',
    background: 'bg-zinc-950',
    text: 'text-zinc-100',
    button: 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700',
    buttonText: 'text-zinc-100',
    accent: 'bg-indigo-500',
  },
  retro: {
    name: 'retro',
    background: 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600',
    text: 'text-white',
    button: 'bg-black/20 backdrop-blur-md border border-black/30 hover:bg-black/40',
    buttonText: 'text-white',
    accent: 'bg-yellow-200',
  },
};
