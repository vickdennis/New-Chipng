export type UserRole = 'user' | 'admin';
export type ThemeType = 'minimal' | 'neon' | 'glassmorphism' | 'dark' | 'sunset';
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
  coverImage?: string;
  website?: string;
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
    website?: string;
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
};
