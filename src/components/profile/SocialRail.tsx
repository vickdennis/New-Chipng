import React from 'react';
import { motion } from 'motion/react';
import { User } from '../../types';
import { 
  Instagram, Twitter, Linkedin, Youtube, Facebook, MessageCircle,
  Music2, MessageSquare, Disc, Send, Pin, Music, Apple, Cloud, 
  AtSign, Hash, Github, Twitch, Ghost, Mail 
} from 'lucide-react';

// Official Brand Icons (SVGs)
const BrandIcons = {
  facebook: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-8.74h-2.94v-3.403h2.94v-2.511c0-2.91 1.777-4.495 4.375-4.495 1.243 0 2.314.092 2.625.134v3.041l-1.8.001c-1.412 0-1.685.671-1.685 1.655v2.17h3.367l-.438 3.403h-2.929v8.74h6.021c.731 0 1.325-.593 1.325-1.324v-21.351c0-.732-.593-1.325-1.325-1.325z" />
    </svg>
  ),
  instagram: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4.001 1.791 4.001 4c0 2.21-1.791 4-4.001 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  x: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zM17.61 20.644h2.039L6.486 3.24H4.298l13.312 17.404z" />
    </svg>
  ),
  linkedin: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  tiktok: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.89-.39-2.82-.14-.95.22-1.82.78-2.42 1.55-.6.76-.92 1.72-.92 2.68.01.96.34 1.91.95 2.66.61.76 1.48 1.3 2.43 1.5 1.49.33 3.17-.12 4.26-1.18.95-1.04 1.39-2.46 1.39-3.85V.02z" />
    </svg>
  ),
  youtube: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  whatsapp: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
};

interface SocialRailProps {
  profile: User;
}

export const SocialRail: React.FC<SocialRailProps> = ({ profile }) => {
  const socialIcons = [
    { id: 'instagram', icon: BrandIcons.instagram, color: 'hover:text-[#E4405F]', url: (val: string) => val.startsWith('http') ? val : `https://instagram.com/${val}` },
    { id: 'twitter', icon: BrandIcons.x, color: 'hover:text-white', url: (val: string) => val.startsWith('http') ? val : `https://twitter.com/${val}` },
    { id: 'linkedin', icon: BrandIcons.linkedin, color: 'hover:text-[#0077B5]', url: (val: string) => val.startsWith('http') ? val : `https://linkedin.com/in/${val}` },
    { id: 'youtube', icon: BrandIcons.youtube, color: 'hover:text-[#FF0000]', url: (val: string) => val.startsWith('http') ? val : `https://youtube.com/@${val}` },
    { id: 'facebook', icon: BrandIcons.facebook, color: 'hover:text-[#1877F2]', url: (val: string) => val.startsWith('http') ? val : `https://facebook.com/${val}` },
    { id: 'whatsapp', icon: BrandIcons.whatsapp, color: 'hover:text-[#25D366]', url: (val: string) => val.startsWith('http') ? val : `https://wa.me/${val}` },
    { id: 'tiktok', icon: BrandIcons.tiktok, color: 'hover:text-white', url: (val: string) => val.startsWith('http') ? val : `https://tiktok.com/@${val}` },
    { id: 'reddit', icon: MessageSquare, color: 'hover:text-[#FF4500]', url: (val: string) => val.startsWith('http') ? val : `https://reddit.com/u/${val}` },
    { id: 'discord', icon: Disc, color: 'hover:text-[#5865F2]', url: (val: string) => val.startsWith('http') ? val : `https://discord.gg/${val}` },
    { id: 'telegram', icon: Send, color: 'hover:text-[#26A5E4]', url: (val: string) => val.startsWith('http') ? val : `https://t.me/${val}` },
    { id: 'pinterest', icon: Pin, color: 'hover:text-[#BD081C]', url: (val: string) => val.startsWith('http') ? val : `https://pinterest.com/${val}` },
    { id: 'spotify', icon: Music, color: 'hover:text-[#1DB954]', url: (val: string) => val.startsWith('http') ? val : `https://open.spotify.com/user/${val}` },
    { id: 'applemusic', icon: Apple, color: 'hover:text-[#FA243C]', url: (val: string) => val.startsWith('http') ? val : `https://music.apple.com/profile/${val}` },
    { id: 'soundcloud', icon: Cloud, color: 'hover:text-[#FF3300]', url: (val: string) => val.startsWith('http') ? val : `https://soundcloud.com/${val}` },
    { id: 'threads', icon: AtSign, color: 'hover:text-white', url: (val: string) => val.startsWith('http') ? val : `https://threads.net/@${val}` },
    { id: 'mastodon', icon: Hash, color: 'hover:text-[#6364FF]', url: (val: string) => val.startsWith('http') ? val : `https://mastodon.social/@${val}` },
    { id: 'github', icon: Github, color: 'hover:text-white', url: (val: string) => val.startsWith('http') ? val : `https://github.com/${val}` },
    { id: 'twitch', icon: Twitch, color: 'hover:text-[#9146FF]', url: (val: string) => val.startsWith('http') ? val : `https://twitch.tv/${val}` },
    { id: 'snapchat', icon: Ghost, color: 'hover:text-[#FFFC00]', url: (val: string) => val.startsWith('http') ? val : `https://snapchat.com/add/${val}` },
    { id: 'mail', icon: Mail, color: 'hover:text-[#D44638]', url: (val: string) => val.startsWith('mailto:') ? val : `mailto:${val}` }
  ];

  const activeSocials = socialIcons.filter(s => profile.socialLinks?.[s.id as keyof typeof profile.socialLinks]);

  if (activeSocials.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mb-10 px-2"
    >
      <div className="flex flex-wrap justify-center items-center gap-2 p-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full shadow-2xl">
        {activeSocials.map((social) => {
          const value = profile.socialLinks?.[social.id as keyof typeof profile.socialLinks];
          if (!value) return null;
          
          return (
            <motion.a 
              key={social.id}
              href={social.url(value)}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.9 }}
              className={`p-3 text-white/50 transition-colors duration-300 ${social.color} bg-white/5 hover:bg-white/10 rounded-full`}
            >
              <social.icon className="w-5 h-5" />
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
};
