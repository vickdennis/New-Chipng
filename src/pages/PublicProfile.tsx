import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { db, getUserByUsername, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc 
} from 'firebase/firestore';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Share2, QrCode, X, Check, BadgeCheck,
  Link as LinkIcon, AlertCircle,
  Mail, MessageSquare, ChevronLeft, ChevronRight,
  Image as ImageIcon,
  Plus, AtSign, User as UserIcon, UserPlus, Megaphone, Calendar,
  CheckCircle2, ArrowUpRight, Send, Camera, MapPin,
  Instagram, Twitter, Facebook, Youtube, Github, Linkedin, Globe
} from 'lucide-react';
import Logo from '../components/Logo';
import SocialIconComponent from '../components/SocialIcon';
import { BrandIcons } from '../components/icons/BrandIcons';
import { toast } from 'sonner';
import { User, Link as LinkType, Shout, Media } from '../types';
import SEO from '../components/SEO';
import { format } from 'date-fns';
import { BASE_URL } from '../constants';
import { THEMES } from '../types';
import { cn } from '../lib/utils';



const getFavicon = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://icon.horse/icon/${domain}?size=large`;
  } catch (e) {
    return null;
  }
};

const formatDate = (date: any, formatStr: string) => {
  if (!date) return 'Recently';
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return 'Recently';
    return format(d, formatStr);
  } catch (e) {
    return 'Recently';
  }
};

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<User | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [shouts, setShouts] = useState<Shout[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shouts' | 'media'>('shouts');
  const [showContactForm, setShowContactForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBottomBar, setShowBottomBar] = useState(true);

  const handleSaveContact = () => {
    // Priority: contactEmail > email, phone
    const email = profile?.contactEmail || profile?.email || '';
    const phone = profile?.phone || '';
    const displayName = profile?.displayName || profile?.username || '';
    
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${displayName}
N:${displayName};;;;
TEL;TYPE=CELL:${phone}
EMAIL;TYPE=INTERNET;TYPE=WORK:${email}
NOTE:${profile?.bio || ''}
URL:${window.location.protocol}//${window.location.host}/${profile?.username}
END:VCARD`;
    
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${profile?.username}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Contact vCard downloaded!');
  };

  const handleLinkClick = async (linkId: string) => {
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: 'links', id: linkId, field: 'clicks' })
      });
    } catch (err) {
      console.error('Failed to track link click:', err);
    }
  };

  // Scroll animations
  const { scrollY } = useScroll();
  const coverOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const headerOpacity = useTransform(scrollY, [150, 200], [0, 1]);
  const avatarScale = useTransform(scrollY, [0, 200], [1, 0.8]);
  const avatarY = useTransform(scrollY, [0, 200], [0, 0]); // Keep it centered relative to container

  useEffect(() => {
    if (!username) return;
    setLoading(true);

    let unsubProfile: () => void = () => {};
    let unsubLinks: () => void = () => {};
    let unsubShouts: () => void = () => {};
    let unsubMedia: () => void = () => {};
    let unsubBlogs: () => void = () => {};
    let unsubProducts: () => void = () => {};

    const fetchProfile = async () => {
      try {
        const userData = await getUserByUsername(username.toLowerCase());
        
        if (!userData) {
          setError('Profile not found');
          setLoading(false);
          return;
        }

        const userId = userData.uid;
        const profileRef = doc(db, 'users', userId);

        // Track profile view
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collection: 'users', id: userId, field: 'totalClicks' })
        }).catch(err => console.error('Failed to track view:', err));

        unsubProfile = onSnapshot(profileRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as User);
          } else {
            setError('Profile no longer exists');
            setLoading(false);
          }
        }, (error) => {
          console.error("Profile snapshot error:", error);
          setError('Failed to load profile');
          setLoading(false);
        });

        const qLinks = query(
          collection(db, 'links'), 
          where('userId', '==', userId),
          where('active', '==', true),
          orderBy('position', 'asc')
        );
        unsubLinks = onSnapshot(qLinks, (snapshot) => {
          const allLinks = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as LinkType))
            .filter(link => link.active && !(link as any).isDeleted);
          setLinks(allLinks);
          setLoading(false);
        }, (error) => {
          console.error("Links snapshot error:", error);
          // If index is missing, try without orderBy for graceful degradation
          if (error.message.includes('index')) {
            const fallbackQ = query(collection(db, 'links'), where('userId', '==', userId));
            onSnapshot(fallbackQ, (snapshot) => {
              const allLinks = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as LinkType))
                .filter(link => link.active && !(link as any).isDeleted)
                .sort((a, b) => (a.position || 0) - (b.position || 0));
              setLinks(allLinks);
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        });

        const qShouts = query(collection(db, 'shouts'), where('userId', '==', userId));
        unsubShouts = onSnapshot(qShouts, (snapshot) => {
          const sortedShouts = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Shout))
            .filter(s => !(s as any).isDeleted)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setShouts(sortedShouts);
        }, (err) => console.error("Shouts error:", err));

        const qMedia = query(collection(db, 'media'), where('userId', '==', userId));
        unsubMedia = onSnapshot(qMedia, (snapshot) => {
          const sortedMedia = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Media))
            .filter(m => !(m as any).isDeleted)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setMedia(sortedMedia);
        }, (err) => console.error("Media error:", err));

        const qBlogs = query(collection(db, 'blogs'), where('userId', '==', userId), where('published', '==', true));
        unsubBlogs = onSnapshot(qBlogs, (snapshot) => {
          setBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qProducts = query(collection(db, 'products'), where('userId', '==', userId), where('active', '==', true));
        unsubProducts = onSnapshot(qProducts, (snapshot) => {
          setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
      } catch (err) {
        console.error(err);
        setError('Something went wrong');
        setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      unsubProfile();
      unsubLinks();
      unsubShouts();
      unsubMedia();
      unsubBlogs();
      unsubProducts();
    };
  }, [username]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied');
  };

  if (loading) return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-lg mx-auto space-y-8 pt-20">
        <div className="flex flex-col items-center gap-6">
          <div className="w-28 h-28 bg-zinc-900 rounded-[2.2rem] animate-pulse" />
          <div className="space-y-3 flex flex-col items-center">
            <div className="h-10 w-48 bg-zinc-900 rounded-xl animate-pulse" />
            <div className="h-4 w-32 bg-zinc-900 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 w-full bg-zinc-900 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
      <AlertCircle className="w-16 h-16 text-zinc-800 mb-6" />
      <h1 className="text-2xl font-black mb-2">Profile Not Found</h1>
      <p className="text-zinc-500 mb-8 text-center max-w-sm">The user @{username} doesn't exist on Chip NG yet.</p>
      <RouterLink to="/" className="bg-[#A020F0] text-white px-8 py-3 rounded-xl font-bold transition-transform hover:scale-105">
        Back Home
      </RouterLink>
    </div>
  );
  
  const theme = profile ? (THEMES[profile.theme] || THEMES.minimal) : THEMES.minimal;
  const brandColor = profile?.brandColor || '#A3E635';

  return (
    <div className={cn(
      "min-h-screen font-sans overflow-x-hidden transition-colors duration-700",
      (profile.backgroundType === 'solid' || profile.backgroundType === 'image') ? '' : theme.background,
      !profile.textColor && theme.text
    )}
    style={{ 
      ['--selection-bg' as any]: brandColor,
      ['--accent-color' as any]: brandColor,
      color: profile.textColor || undefined,
      backgroundColor: profile.backgroundType === 'solid' ? profile.backgroundColor : undefined,
      backgroundImage: profile.backgroundType === 'image' && profile.backgroundImage ? `url(${profile.backgroundImage})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <style>{`
        ::selection {
          background-color: ${brandColor};
          color: white;
        }
      `}</style>
      <SEO 
        title={`${profile.displayName || profile.username} (@${profile.username})`}
        description={profile.bio || `Check out ${profile.displayName || profile.username}'s profile on Chip NG.`}
        image={profile.photoURL || profile.coverImage}
        url={`${BASE_URL}/${profile.username}`}
        type="profile"
      />

      {/* Top Fixed Header */}
      <motion.div 
        style={{ opacity: headerOpacity }}
        className={cn(
          "fixed top-0 left-0 right-0 z-[60] backdrop-blur-xl border-b px-6 h-20 flex items-center justify-between transition-colors",
          theme.background === 'bg-white' ? 'bg-white/80 border-black/5' : 'bg-black/80 border-white/5'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:scale-105 transition-transform">
             {profile.photoURL ? (
               <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-zinc-700">
                 <UserIcon className="w-5 h-5" />
               </div>
             )}
          </div>
          <div className="flex flex-col -space-y-1">
             <span className="font-black text-sm truncate max-w-[120px]">{profile.displayName || profile.username}</span>
             <span className={cn("text-[10px] font-bold italic", theme.background === 'bg-white' ? 'text-zinc-500' : 'text-lime-400')}>@{profile.username}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button onClick={copyLink} className="p-2.5 bg-white/10 rounded-xl border border-white/5 active:scale-95 transition-transform">
             <Share2 className="w-4 h-4" />
           </button>
           <button 
             onClick={handleSaveContact} 
             className={cn(
               "px-5 py-2.5 font-black rounded-xl text-xs active:scale-95 transition-transform",
               theme.button, theme.buttonText
             )}
           >
             Save Contact
           </button>
        </div>
      </motion.div>

      {/* Initial Transparent Header */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 h-20 flex items-center justify-between pointer-events-none">
        <RouterLink to="/" className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl pointer-events-auto border border-white/5 active:scale-95 transition-transform">
          <Logo size="sm" variant="favicon" color="neon" />
        </RouterLink>
        
        <button 
          onClick={handleSaveContact}
          className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl pointer-events-auto border border-white/5 active:scale-95 transition-transform flex items-center gap-2 group"
        >
          <div className="relative">
            <UserPlus className="w-6 h-6 text-white group-hover:text-[var(--accent-color)] transition-colors" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--accent-color)] rounded-full border-2 border-black" />
          </div>
        </button>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-lg mx-auto pb-48">
        {/* Banner Section */}
        {(profile?.plan === 'pro' || profile?.plan === 'business') && (
          <div className="relative h-[25vh] min-h-[200px] w-full overflow-hidden">
            <motion.div 
              style={{ opacity: coverOpacity }}
              className="w-full h-full relative"
            >
              {profile.coverImage ? (
                <img 
                  src={profile.coverImage} 
                  alt="" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={cn("w-full h-full relative", theme.background === 'bg-white' ? 'bg-zinc-100' : 'bg-zinc-900')}>
                   <div className="absolute inset-0 bg-lime-400/5 blur-3xl rounded-full translate-y-1/2" />
                </div>
              )}
              <div className={cn(
                "absolute inset-x-0 bottom-0 h-full z-10",
                theme.background === 'bg-white' 
                  ? "bg-gradient-to-t from-white via-white/95 via-white/20 to-transparent" 
                  : theme.background === 'bg-black' || theme.background.includes('zinc-950')
                    ? "bg-gradient-to-t from-black via-black/95 via-black/20 to-transparent"
                    : "bg-gradient-to-t from-zinc-900 via-zinc-900/95 via-zinc-900/20 to-transparent"
              )} 
              style={{
                background: profile.backgroundType === 'solid' 
                  ? `linear-gradient(to top, ${profile.backgroundColor} 0%, ${profile.backgroundColor}F2 20%, ${profile.backgroundColor}33 60%, transparent 100%)`
                  : undefined
              }}
              />
            </motion.div>
          </div>
        )}

        {/* Profile Info Section */}
        <div className="relative z-10 px-6 -mt-20 flex flex-col items-center">
          {/* Avatar */}
          <motion.div 
            style={{ scale: avatarScale, y: avatarY }}
            className="relative group mb-6"
          >
            <div className={cn(
              "w-32 h-32 rounded-[2.8rem] bg-zinc-900 border-[6px] shadow-2xl overflow-hidden relative z-10",
              theme.background === 'bg-white' ? 'border-white' : 'border-black'
            )}
            style={{ 
              borderColor: profile.backgroundType === 'solid' ? profile.backgroundColor : undefined 
            }}>
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-900">
                  <UserIcon className="w-12 h-12" />
                </div>
              )}
            </div>
            {/* Glow effect behind avatar */}
            <div className="absolute inset-0 bg-[var(--accent-color)] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full scale-125" />
          </motion.div>

          {/* Identity */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-4xl font-black tracking-tight leading-none flex items-center justify-center gap-2">
              {profile.displayName || profile.username}
              {profile.isVerified && (
                <BadgeCheck className="w-7 h-7 text-[#1D9BF0] fill-[#1D9BF0] stroke-white stroke-[1.5px]" />
              )}
            </h1>
            <div className="flex items-center justify-center gap-2">
              <span className={cn("font-black text-lg", theme.background === 'bg-white' ? 'text-zinc-400' : 'text-lime-400')}>@{profile.username}</span>
            </div>
          </div>

          {/* Social Icons Row */}
          {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <div className="flex flex-row items-center justify-center gap-4 mb-12 px-6 w-full max-w-full overflow-x-auto no-scrollbar py-2">
              {Object.entries(profile.socialLinks).slice(0, 10).map(([platform, username]) => (
                <SocialIconComponent 
                  key={platform} 
                  platform={platform} 
                  username={username as string} 
                  style={profile.iconStyle || 'colored'}
                  className="shrink-0 transition-transform hover:translate-y-[-4px]" 
                />
              ))}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className={cn(
              "text-center text-sm leading-relaxed max-w-sm font-medium mb-12 px-6 opacity-80",
            )}>
              {profile.bio}
            </p>
          )}

          {/* Contact Actions */}
          <div className="w-full grid grid-cols-1 gap-4 mb-16">
            <button 
              onClick={() => setShowContactForm(true)}
              className={cn(
                "w-full h-16 font-black rounded-[2rem] text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98] shadow-2xl",
                theme.button, theme.buttonText
              )}
            >
              Contact Details
            </button>
            <button 
              onClick={handleSaveContact}
              className="w-full h-16 bg-white/5 backdrop-blur-sm text-inherit font-black rounded-[2rem] border border-white/10 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-white/10"
              style={{ borderColor: `${brandColor}40` }}
            >
              <UserPlus className="w-4 h-4" /> Add to Contacts
            </button>
          </div>
        </div>

        {/* Links & Content Section */}
        <div className="px-6 space-y-16">

          {/* Featured Content Group */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black tracking-tighter">Spotlight</h2>
              <div className="flex-1 h-px bg-white/10 ml-6" />
            </div>

            <div className="grid grid-cols-1 gap-6">
              {links.filter(l => l.active).map((link, idx) => {
                const isBig = link.type === 'youtube' || link.type === 'tiktok' || idx === 0;
                
                if (isBig) {
                  return (
                    <motion.a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleLinkClick(link.id)}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className={cn(
                        "group relative block rounded-[2.8rem] overflow-hidden shadow-2xl transition-all active:scale-[0.98] border",
                        theme.button,
                        "hover:border-lime-400/50"
                      )}
                    >
                      <div className="aspect-[16/10] relative overflow-hidden">
                        {link.type && link.type !== 'standard' && !link.thumbnail ? (
                          <div className="w-full h-full p-12 bg-zinc-950 flex items-center justify-center">
                            <SocialIconComponent 
                              platform={link.type} 
                              username={link.url.split('/').pop() || ''} 
                              style={profile.iconStyle || 'colored'}
                              asLink={false}
                              className="w-32 h-32"
                            />
                          </div>
                        ) : (link.thumbnail || link.icon || getFavicon(link.url)) ? (
                          <img 
                            src={link.thumbnail || link.icon || getFavicon(link.url)!} 
                            alt={link.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
                            <LinkIcon className="w-16 h-16 text-zinc-800" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent group-hover:opacity-20 transition-opacity" />
                        
                        <div className="absolute inset-0 p-8 flex flex-col justify-end">
                           <div className="inline-flex py-1 px-3 bg-lime-400 text-black text-[10px] font-black uppercase tracking-widest rounded-full self-start mb-3">Featured</div>
                           <h3 className="text-3xl font-black leading-tight text-white group-hover:text-lime-400 transition-colors">{link.title}</h3>
                           <p className="text-white/60 text-sm font-medium mt-1 truncate group-hover:text-white transition-colors">{link.url.replace(/^https?:\/\//, '')}</p>
                        </div>
                        
                        <div className="absolute top-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 border border-white/20">
                          <ArrowUpRight className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </motion.a>
                  );
                }

                return (
                  <motion.a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkClick(link.id)}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className={cn(
                      "flex items-center gap-5 p-5 rounded-[2rem] transition-all active:scale-[0.98] group",
                      theme.button,
                      "hover:scale-[1.02]"
                    )}
                  >
                    <div className="w-16 h-16 rounded-[1.2rem] bg-white/10 flex items-center justify-center overflow-hidden border border-white/5 shadow-inner p-1">
                       {link.type && link.type !== 'standard' && !link.thumbnail ? (
                         <SocialIconComponent 
                           platform={link.type} 
                           username={link.url.split('/').pop() || ''} 
                           style={profile.iconStyle || 'colored'}
                           asLink={false}
                           className="w-full h-full"
                         />
                       ) : (link.thumbnail || link.icon || getFavicon(link.url)) ? (
                         <img src={link.thumbnail || link.icon || getFavicon(link.url)!} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                       ) : (
                         <LinkIcon className="w-6 h-6" />
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h3 className={cn("font-bold text-lg transition-colors truncate", theme.buttonText || "text-inherit")}>{link.title}</h3>
                       <p className="text-[11px] opacity-60 font-bold tracking-tight truncate uppercase">{link.url.replace(/^https?:\/\//, '')}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-lime-400 transition-all group-hover:rotate-12">
                       <ArrowUpRight className="w-5 h-5 group-hover:text-black transition-colors" />
                    </div>
                  </motion.a>
                );
              })}
            </div>
          </section>


          {/* Shouts Section - Horizontal Scroll */}
          {shouts.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black tracking-tighter">Public Shouts</h2>
                <div className="flex-1 h-px bg-zinc-900 ml-6" />
              </div>
              
              <div className="flex overflow-x-auto no-scrollbar gap-5 px-1 pb-6 -mx-6 px-6">
                {shouts.map(shout => (
                  <motion.div 
                    key={shout.id}
                    whileHover={{ y: -6 }}
                    className="min-w-[300px] w-[300px] bg-zinc-900/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 relative shadow-2xl flex flex-col"
                  >
                    <div className="absolute -top-3 -right-3 p-3 bg-[#A3E635] text-black rounded-2xl shadow-xl rotate-[8deg]">
                      <Megaphone className="w-5 h-5 font-black" />
                    </div>
                    
                    <div className="flex-1 mb-6">
                      <p className="text-[16px] font-medium text-white/90 leading-relaxed italic">"{shout.content}"</p>
                    </div>

                    {shout.image && (
                      <div className="aspect-square rounded-[1.8rem] overflow-hidden mb-6 border border-white/10 shadow-lg">
                        <img src={shout.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                            <Logo variant="favicon" size="sm" color="neon" />
                         </div>
                         <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A3E635]">Verified Shout</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase text-zinc-600 tracking-widest">
                        {formatDate(shout.createdAt, 'MMM d')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Media Discovery - Bento Grid Style */}
          {media.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black tracking-tighter">Lifestyle</h2>
                <div className="flex-1 h-px bg-zinc-900 ml-6" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {media.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className={`rounded-[2.2rem] overflow-hidden group cursor-pointer relative shadow-2xl bg-zinc-900 ${i % 3 === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
                    ) : (
                      <video src={item.url} className="w-full h-full object-cover" loop muted playsInline />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                       <span className="text-[10px] font-black uppercase text-[#A3E635] tracking-widest">Snapshot • {formatDate(item.createdAt, 'yyyy')}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Shop Section */}
          {products.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black tracking-tighter">Shop</h2>
                <div className="flex-1 h-px bg-zinc-900 ml-6" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden group shadow-2xl"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute top-4 right-4 bg-[#A3E635] text-black px-4 py-2 rounded-xl font-black text-sm shadow-xl">
                        ₦{product.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold mb-2 group-hover:text-[#A3E635] transition-colors">{product.name}</h3>
                      <p className="text-zinc-500 text-xs line-clamp-2 mb-6">{product.description}</p>
                      <button className="w-full py-4 bg-zinc-800 hover:bg-white hover:text-black transition-all rounded-2xl font-black text-xs uppercase tracking-widest">
                        Purchase Now
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Blog Section */}
          {blogs.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black tracking-tighter">Insights</h2>
                <div className="flex-1 h-px bg-zinc-900 ml-6" />
              </div>

              <div className="space-y-6">
                {blogs.slice(0, 3).map((blog) => (
                  <motion.div
                    key={blog.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                  >
                    <RouterLink
                      to={`/blog/${blog.slug}`}
                      className="group flex gap-6 p-6 bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] hover:border-[#A3E635]/30 transition-all"
                    >
                      <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/5">
                        <img src={blog.coverImage} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <div className="text-[10px] font-black text-[#A3E635] uppercase tracking-widest mb-1">
                          {formatDate(blog.createdAt, 'MMM d, yyyy')}
                        </div>
                        <h3 className="font-bold text-lg group-hover:text-[#A3E635] transition-colors line-clamp-1">{blog.title}</h3>
                        <p className="text-zinc-500 text-xs line-clamp-1 mt-1 font-medium">{blog.excerpt}</p>
                      </div>
                    </RouterLink>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Business Section (Pro/Business Plan Gated) */}
          {((profile.appointmentsEnabled && (profile.plan === 'pro' || profile.plan === 'business')) || 
            (profile.address && profile.mapEnabled && (profile.plan === 'pro' || profile.plan === 'business'))) && (
            <section className="space-y-10 py-12">
               {profile.appointmentsEnabled && (profile.plan === 'pro' || profile.plan === 'business') && profile.appointments && profile.appointments.length > 0 && (
                 <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                      <div className="w-12 h-12 bg-[#A3E635]/10 rounded-2xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-[#A3E635]" />
                      </div>
                      <h2 className="text-3xl font-black tracking-tighter">Book an Appointment</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {profile.appointments.map(appt => (
                        <motion.a
                          key={appt.id}
                          href={appt.contactLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ x: 10 }}
                          className="flex items-center justify-between p-6 bg-zinc-900 border border-white/5 rounded-[2.5rem] group"
                        >
                          <div className="space-y-1">
                            <h4 className="text-lg font-bold group-hover:text-[#A3E635] transition-colors">{appt.title}</h4>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{appt.dateTime}</p>
                          </div>
                          <div className="px-6 py-2 bg-zinc-800 group-hover:bg-[#A3E635] text-white group-hover:text-black rounded-xl text-xs font-black transition-all">
                            Book
                          </div>
                        </motion.a>
                      ))}
                    </div>
                 </div>
               )}

               {profile.address && profile.mapEnabled && (profile.plan === 'pro' || profile.plan === 'business') && (
                 <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                       <div className="w-12 h-12 bg-[#A3E635]/10 rounded-2xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-[#A3E635]" />
                      </div>
                      <h2 className="text-3xl font-black tracking-tighter">Find Us</h2>
                    </div>

                    <div className="rounded-[3rem] overflow-hidden border border-white/5 bg-zinc-900 shadow-2xl">
                       <div className="aspect-[16/10] bg-zinc-800 relative">
                          {/* Map using API Key from environment or fallback */}
                          <iframe
                            src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSy...fallback'}&q=${encodeURIComponent(profile.address)}`}
                            className="w-full h-full border-0 grayscale invert opacity-70 contrast-125"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          ></iframe>
                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-zinc-950 via-transparent to-transparent text-white p-8 flex flex-col justify-end">
                             <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Physical Presence</span>
                             </div>
                             <p className="text-xl font-bold max-w-xs leading-snug">{profile.address}</p>
                             <a 
                               href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="mt-6 flex items-center justify-center gap-2 py-4 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all pointer-events-auto"
                             >
                               Get Directions <ArrowUpRight className="w-4 h-4" />
                             </a>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </section>
          )}
        </div>

        <footer className="py-24 flex flex-col items-center gap-3 opacity-30 select-none">
           <div className="p-2 bg-zinc-900/50 rounded-xl border border-white/5 mb-1 group cursor-pointer hover:border-[#A3E635]/30 transition-colors scale-75">
              <Logo size="sm" variant="icon-only" color="neon" className="grayscale contrast-125 opacity-50" />
           </div>
           <div className="flex flex-col items-center gap-0">
             <span className="text-[8px] font-black tracking-[0.4em] uppercase text-zinc-800">Powered by</span>
             <span className="text-[12px] font-black text-zinc-600 italic">Chip NG <span className="text-[#A3E635]/40 italic not-italic">Verified</span></span>
           </div>
        </footer>
      </main>

      {/* High-End Glass Floating CTA Bar */}
      <AnimatePresence>
        {showBottomBar && (
          <motion.div 
            initial={{ y: 150 }}
            animate={{ y: 0 }}
            exit={{ y: 150 }}
            className="fixed bottom-0 left-0 right-0 z-[100] px-6 sm:px-8 pb-8 sm:pb-12 pointer-events-none"
          >
            <div className="max-w-xl mx-auto w-full bg-white/5 backdrop-blur-[40px] rounded-[2.5rem] sm:rounded-[3.5rem] p-3 sm:p-4 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-3 pl-4 sm:pl-6">
                  <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center p-1.5 border border-white/5">
                     <Logo variant="favicon" size="sm" color="neon" className="grayscale opacity-50" />
                  </div>
                  <div className="flex flex-col -space-y-1">
                     <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">Built with</span>
                     <span className="text-sm font-black text-white/50 leading-none">Chip <span className="text-[#A3E635]/60">NG</span></span>
                  </div>
              </div>
              
              <RouterLink to="/signup" className="group px-8 sm:px-10 h-14 hover:bg-opacity-90 text-black font-black rounded-[1.8rem] sm:rounded-[2.2rem] text-sm flex items-center gap-3 transition-all active:scale-95 shadow-2xl" style={{ backgroundColor: brandColor }}>
                 Claim Yours <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </RouterLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern High-End Contact Modal */}
      <AnimatePresence>
        {showContactForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContactForm(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-950 rounded-[3rem] p-10 shadow-3xl border border-white/5 overflow-hidden"
            >
              {/* Modal Background Detail */}
              <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: `${brandColor}20` }} />
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="space-y-1">
                  <h2 className="text-4xl font-black tracking-tighter text-white">Direct Message</h2>
                  <p className="text-zinc-500 font-medium">Inquiry for @{profile.username}</p>
                </div>
                <button onClick={() => setShowContactForm(false)} className="p-3 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors border border-white/5">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <form className="space-y-6 relative z-10" onSubmit={(e) => { e.preventDefault(); toast.success("Message deliverd!"); setShowContactForm(false); }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Your Alias</label>
                    <input type="text" required placeholder="Alex" className="w-full h-14 bg-zinc-900 border border-white/5 rounded-2xl px-6 text-white focus:border-[#A3E635]/40 outline-none transition-all placeholder:text-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Email</label>
                    <input type="email" required placeholder="alex@me.com" className="w-full h-14 bg-zinc-900 border border-white/5 rounded-2xl px-6 text-white focus:border-[#A3E635]/40 outline-none transition-all placeholder:text-zinc-800" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Context</label>
                  <textarea required rows={4} placeholder="Let's collaborate..." className="w-full bg-zinc-900 border border-white/5 rounded-[2rem] p-6 text-white focus:border-[#A3E635]/40 outline-none transition-all resize-none placeholder:text-zinc-800" />
                </div>
                <button 
                  className="w-full h-16 text-black rounded-[2rem] font-black uppercase tracking-widest text-sm mt-4 shadow-2xl transition-all flex items-center justify-center gap-3 group"
                  style={{ backgroundColor: brandColor, boxShadow: `0 20px 40px -10px ${brandColor}40` }}
                >
                  Send Inquiry <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicProfile;
