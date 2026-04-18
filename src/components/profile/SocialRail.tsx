import React from 'react';
import { motion } from 'motion/react';
import { User } from '../../types';
import { 
  Instagram, Twitter, Linkedin, Youtube, Facebook, MessageCircle,
  Music2, MessageSquare, Disc, Send, Pin, Music, Apple, Cloud, 
  AtSign, Hash, Github, Twitch, Ghost, Mail 
} from 'lucide-react';

interface SocialRailProps {
  profile: User;
}

export const SocialRail: React.FC<SocialRailProps> = ({ profile }) => {
  const socialIcons = [
    { id: 'instagram', icon: Instagram, color: 'hover:text-[#E4405F]', url: (val: string) => val.startsWith('http') ? val : `https://instagram.com/${val}` },
    { id: 'twitter', icon: Twitter, color: 'hover:text-[#1DA1F2]', url: (val: string) => val.startsWith('http') ? val : `https://twitter.com/${val}` },
    { id: 'linkedin', icon: Linkedin, color: 'hover:text-[#0077B5]', url: (val: string) => val.startsWith('http') ? val : `https://linkedin.com/in/${val}` },
    { id: 'youtube', icon: Youtube, color: 'hover:text-[#FF0000]', url: (val: string) => val.startsWith('http') ? val : `https://youtube.com/@${val}` },
    { id: 'facebook', icon: Facebook, color: 'hover:text-[#1877F2]', url: (val: string) => val.startsWith('http') ? val : `https://facebook.com/${val}` },
    { id: 'whatsapp', icon: MessageCircle, color: 'hover:text-[#25D366]', url: (val: string) => val.startsWith('http') ? val : `https://wa.me/${val}` },
    { id: 'tiktok', icon: Music2, color: 'hover:text-white', url: (val: string) => val.startsWith('http') ? val : `https://tiktok.com/@${val}` },
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
