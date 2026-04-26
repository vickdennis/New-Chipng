export type UserRole = 'user' | 'admin';
export type ThemeType = 'minimal' | 'neon' | 'glassmorphism' | 'dark' | 'sunset' | 'ocean' | 'forest' | 'royal' | 'coffee' | 'midnight' | 'lavender' | 'emerald' | 'cyberpunk' | 'retro' | 'nordic' | 'sakura' | 'gold' | 'brutalist' | 'clay' | 'matrix' | 'vibrant' | 'pastel' | 'monochrome' | 'deepsea' | 'minimalist-dark' | 'desert' | 'galaxy' | 'candy' | 'industrial' | 'vintage' | 'aqua' | 'midnight-purple' | 'ocean-deep' | 'sunset-vibe' | 'minimalist-light' | 'cyber-pink' | 'nature-green' | 'royal-gold' | 'stealth-black';
export type ButtonStyle = 'rounded' | 'pill' | 'square';
export type BackgroundType = 'solid' | 'gradient' | 'image';
export type PlanType = 'basic' | 'pro' | 'business';
export type LayoutType = 'list' | 'grid' | 'cards' | 'featured';
export type FontType = 'sans' | 'serif' | 'mono' | 'display' | 'modern' | 'elegant' | 'bold';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  active: boolean;
  createdAt: string;
}

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
  onboardingCompleted?: boolean;
  phone?: string;
  address?: string;
  contactEmail?: string;
  emailContactEnabled?: boolean;
  profileLayout?: LayoutType;
  profileFont?: FontType;
  textColor?: string;
  brandColor?: string;
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

export interface Transaction {
  id: string;
  userId: string;
  reference: string;
  amount: number;
  plan: string;
  status: 'success' | 'failed' | 'pending';
  createdAt: string;
  metadata?: any;
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
    background: 'bg-black',
    text: 'text-[#39FF14]',
    button: 'bg-black border-2 border-[#39FF14] hover:bg-[#39FF14] hover:text-black shadow-[0_0_15px_#39FF14]',
    buttonText: 'text-[#39FF14] font-bold',
    accent: 'bg-[#39FF14]',
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
    background: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    text: 'text-white',
    button: 'bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30',
    buttonText: 'text-white',
    accent: 'bg-cyan-200',
  },
  forest: {
    name: 'forest',
    background: 'bg-gradient-to-br from-emerald-600 to-teal-800',
    text: 'text-white',
    button: 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20',
    buttonText: 'text-white',
    accent: 'bg-emerald-200',
  },
  royal: {
    name: 'royal',
    background: 'bg-gradient-to-br from-amber-400 to-amber-600',
    text: 'text-zinc-900',
    button: 'bg-zinc-900/10 backdrop-blur-md border border-zinc-900/20 hover:bg-zinc-900/20',
    buttonText: 'text-zinc-900',
    accent: 'bg-amber-900',
  },
  coffee: {
    name: 'coffee',
    background: 'bg-gradient-to-br from-stone-700 to-stone-900',
    text: 'text-stone-100',
    button: 'bg-stone-800 border border-stone-600 hover:bg-stone-700',
    buttonText: 'text-stone-100',
    accent: 'bg-orange-200',
  },
  midnight: {
    name: 'midnight',
    background: 'bg-zinc-950',
    text: 'text-zinc-100',
    button: 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700',
    buttonText: 'text-zinc-100',
    accent: 'bg-blue-500',
  },
  lavender: {
    name: 'lavender',
    background: 'bg-gradient-to-br from-purple-100 to-indigo-200',
    text: 'text-indigo-900',
    button: 'bg-white/50 backdrop-blur-sm border border-indigo-300 hover:bg-white/80',
    buttonText: 'text-indigo-900',
    accent: 'bg-indigo-500',
  },
  emerald: {
    name: 'emerald',
    background: 'bg-emerald-900',
    text: 'text-emerald-50',
    button: 'bg-emerald-800 border border-emerald-700 hover:bg-emerald-700',
    buttonText: 'text-emerald-50',
    accent: 'bg-lime-400',
  },
  cyberpunk: {
    name: 'cyberpunk',
    background: 'bg-black',
    text: 'text-yellow-400',
    button: 'bg-black border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black',
    buttonText: 'text-yellow-400',
    accent: 'bg-fuchsia-500',
  },
  retro: {
    name: 'retro',
    background: 'bg-[#f4ebd0]',
    text: 'text-[#b68d40]',
    button: 'bg-[#d6ad60] border-2 border-[#b68d40] hover:bg-[#b68d40] hover:text-[#f4ebd0]',
    buttonText: 'text-[#f4ebd0]',
    accent: 'bg-[#122620]',
  },
  nordic: {
    name: 'nordic',
    background: 'bg-[#2e3440]',
    text: 'text-[#eceff4]',
    button: 'bg-[#4c566a] hover:bg-[#5e81ac]',
    buttonText: 'text-[#eceff4]',
    accent: 'bg-[#88c0d0]',
  },
  sakura: {
    name: 'sakura',
    background: 'bg-gradient-to-br from-pink-100 to-rose-200',
    text: 'text-rose-900',
    button: 'bg-white/60 backdrop-blur-sm border border-rose-300 hover:bg-rose-100',
    buttonText: 'text-rose-900',
    accent: 'bg-rose-400',
  },
  gold: {
    name: 'gold',
    background: 'bg-zinc-950',
    text: 'text-amber-200',
    button: 'bg-zinc-900 border border-amber-500/50 hover:border-amber-500 hover:bg-amber-500/10',
    buttonText: 'text-amber-500',
    accent: 'bg-amber-500',
  },
  brutalist: {
    name: 'brutalist',
    background: 'bg-[#ffde03]',
    text: 'text-black',
    button: 'bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all',
    buttonText: 'text-black font-black italic',
    accent: 'bg-[#0336ff]',
  },
  clay: {
    name: 'clay',
    background: 'bg-[#e0e5ec]',
    text: 'text-zinc-600',
    button: 'bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl hover:shadow-[inset_9px_9px_16px_rgb(163,177,198,0.6),inset_-9px_-9px_16px_rgba(255,255,255,0.5)]',
    buttonText: 'text-zinc-600',
    accent: 'bg-blue-400',
  },
  matrix: {
    name: 'matrix',
    background: 'bg-black',
    text: 'text-[#00FF41]',
    button: 'bg-black border border-[#00FF41] hover:bg-[#00FF41]/10 shadow-[0_0_10px_#00FF41]',
    buttonText: 'text-[#00FF41] font-mono',
    accent: 'bg-[#003B00]',
  },
  vibrant: {
    name: 'vibrant',
    background: 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500',
    text: 'text-white',
    button: 'bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all',
    buttonText: 'text-white font-bold',
    accent: 'bg-yellow-400',
  },
  pastel: {
    name: 'pastel',
    background: 'bg-[#fdfcf0]',
    text: 'text-zinc-800',
    button: 'bg-[#ff9aa2] hover:bg-[#ffb7b2] rounded-2xl shadow-lg shadow-rose-200/50',
    buttonText: 'text-white font-medium',
    accent: 'bg-[#b2e2f2]',
  },
  monochrome: {
    name: 'monochrome',
    background: 'bg-zinc-100',
    text: 'text-zinc-900',
    button: 'bg-zinc-900 hover:bg-zinc-800 rounded-none border-b-4 border-zinc-500 active:border-b-0 active:translate-y-1 transition-all',
    buttonText: 'text-white uppercase tracking-widest font-black',
    accent: 'bg-zinc-400',
  },
  deepsea: {
    name: 'deepsea',
    background: 'bg-[#001219]',
    text: 'text-[#94d2bd]',
    button: 'bg-[#005f73] hover:bg-[#0a9396] border border-[#94d2bd]/30',
    buttonText: 'text-[#e9d8a6]',
    accent: 'bg-[#ee9b00]',
  },
  'minimalist-dark': {
    name: 'minimalist-dark',
    background: 'bg-[#121212]',
    text: 'text-zinc-400',
    button: 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors',
    buttonText: 'text-zinc-100',
    accent: 'bg-white',
  },
  desert: {
    name: 'desert',
    background: 'bg-[#f3e5ab]',
    text: 'text-[#8b4513]',
    button: 'bg-[#d2b48c] hover:bg-[#c19a6b] rounded-full shadow-md',
    buttonText: 'text-[#5d2e0a] font-bold',
    accent: 'bg-[#cd853f]',
  },
  galaxy: {
    name: 'galaxy',
    background: 'bg-gradient-to-br from-[#000000] via-[#1a1a2e] to-[#16213e]',
    text: 'text-[#e94560]',
    button: 'bg-[#0f3460] border border-[#e94560]/50 hover:border-[#e94560] shadow-[0_0_15px_rgba(233,69,96,0.3)]',
    buttonText: 'text-white',
    accent: 'bg-[#e94560]',
  },
  candy: {
    name: 'candy',
    background: 'bg-gradient-to-br from-[#ff9a9e] to-[#fecfef]',
    text: 'text-[#ff4d6d]',
    button: 'bg-white/80 hover:bg-white rounded-full shadow-lg shadow-pink-200/50',
    buttonText: 'text-[#ff4d6d] font-black',
    accent: 'bg-[#ff4d6d]',
  },
  industrial: {
    name: 'industrial',
    background: 'bg-[#2c3e50]',
    text: 'text-[#bdc3c7]',
    button: 'bg-[#34495e] border-b-4 border-[#2c3e50] hover:border-b-2 hover:translate-y-[2px] active:border-b-0 active:translate-y-[4px]',
    buttonText: 'text-white font-mono uppercase',
    accent: 'bg-[#e74c3c]',
  },
  vintage: {
    name: 'vintage',
    background: 'bg-[#fdf5e6]',
    text: 'text-[#5d4037]',
    button: 'bg-[#8d6e63] hover:bg-[#795548] rounded-sm shadow-[4px_4px_0px_#5d4037]',
    buttonText: 'text-[#fdf5e6] font-serif',
    accent: 'bg-[#5d4037]',
  },
  aqua: {
    name: 'aqua',
    background: 'bg-gradient-to-b from-[#e0f7fa] to-[#80deea]',
    text: 'text-[#006064]',
    button: 'bg-[#00acc1] hover:bg-[#0097a7] rounded-3xl shadow-inner',
    buttonText: 'text-white',
    accent: 'bg-[#006064]',
  },
  'midnight-purple': {
    name: 'midnight-purple',
    background: 'bg-gradient-to-br from-[#120458] to-[#000000]',
    text: 'text-[#ff00ff]',
    button: 'bg-[#7a04eb] hover:bg-[#ff00ff] hover:text-white border border-[#ff00ff]/50 shadow-[0_0_15px_rgba(122,4,235,0.4)]',
    buttonText: 'text-white font-bold',
    accent: 'bg-[#ff00ff]',
  },
  'ocean-deep': {
    name: 'ocean-deep',
    background: 'bg-[#000b18]',
    text: 'text-[#00d4ff]',
    button: 'bg-[#002b5b] border border-[#00d4ff]/30 hover:border-[#00d4ff] hover:bg-[#003b7b]',
    buttonText: 'text-[#00d4ff]',
    accent: 'bg-[#00d4ff]',
  },
  'sunset-vibe': {
    name: 'sunset-vibe',
    background: 'bg-gradient-to-tr from-[#ff512f] to-[#dd2476]',
    text: 'text-white',
    button: 'bg-white/20 backdrop-blur-md border border-white/40 hover:bg-white/30',
    buttonText: 'text-white font-black',
    accent: 'bg-yellow-400',
  },
  'minimalist-light': {
    name: 'minimalist-light',
    background: 'bg-[#fafafa]',
    text: 'text-zinc-400',
    button: 'bg-white border border-zinc-200 hover:border-zinc-400 transition-colors',
    buttonText: 'text-zinc-800',
    accent: 'bg-zinc-800',
  },
  'cyber-pink': {
    name: 'cyber-pink',
    background: 'bg-[#1a1a1a]',
    text: 'text-[#ff006e]',
    button: 'bg-[#ff006e] text-white hover:bg-[#ff006e]/80 shadow-[0_0_20px_rgba(255,0,110,0.5)]',
    buttonText: 'text-white font-black',
    accent: 'bg-[#3a86ff]',
  },
  'nature-green': {
    name: 'nature-green',
    background: 'bg-[#f0f4f0]',
    text: 'text-[#2d5a27]',
    button: 'bg-[#2d5a27] text-white hover:bg-[#3d7a35] rounded-full',
    buttonText: 'text-white',
    accent: 'bg-[#8ab6d6]',
  },
  'royal-gold': {
    name: 'royal-gold',
    background: 'bg-[#1c1c1c]',
    text: 'text-[#d4af37]',
    button: 'bg-[#d4af37] text-black hover:bg-[#f1c40f] border-2 border-[#d4af37]',
    buttonText: 'text-black font-serif font-bold',
    accent: 'bg-[#d4af37]',
  },
  'stealth-black': {
    name: 'stealth-black',
    background: 'bg-black',
    text: 'text-zinc-600',
    button: 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800',
    buttonText: 'text-zinc-400',
    accent: 'bg-white',
  },
};
