import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { db, getUserByUsername, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, updateDoc, increment 
} from 'firebase/firestore';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Share2, QrCode, X, Check, BadgeCheck,
  Link as LinkIcon, AlertCircle,
  Mail, MessageSquare, ChevronLeft, ChevronRight,
  Image as ImageIcon,
  Plus, AtSign, User as UserIcon, UserPlus, Megaphone
} from 'lucide-react';
import Logo from '../components/Logo';
import { toast } from 'sonner';
import { User, Link as LinkType, Shout, Media } from '../types';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';

import { BrandIcons } from '../components/icons/BrandIcons';

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<User | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [shouts, setShouts] = useState<Shout[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shouts' | 'media'>('shouts');
  const [showContactForm, setShowContactForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSaveContact = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile?.displayName || profile?.username}
N:${profile?.displayName || profile?.username};;;;
EMAIL;TYPE=INTERNET;TYPE=WORK:${profile?.contactEmail || profile?.email}
NOTE:${profile?.bio || ''}
URL:${window.location.host}/${profile?.username}
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

    const fetchProfile = async () => {
      try {
        const userData = await getUserByUsername(username);
        
        if (!userData) {
          setError('Profile not found');
          setLoading(false);
          return;
        }

        const userId = userData.uid;
        const profileRef = doc(db, 'users', userId);

        unsubProfile = onSnapshot(profileRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as User);
          } else {
            setError('Profile no longer exists');
          }
        });

        const qLinks = query(
          collection(db, 'links'), 
          where('userId', '==', userId),
          orderBy('position', 'asc')
        );
        unsubLinks = onSnapshot(qLinks, (snapshot) => {
          const allLinks = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as LinkType))
            .filter(link => link.active);
          setLinks(allLinks);
          setLoading(false);
        });

        const qShouts = query(collection(db, 'shouts'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
        unsubShouts = onSnapshot(qShouts, (snapshot) => {
          setShouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shout)));
        });

        const qMedia = query(collection(db, 'media'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
        unsubMedia = onSnapshot(qMedia, (snapshot) => {
          setMedia(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Media)));
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
    };
  }, [username]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Logo size="lg" variant="icon-only" />
      </motion.div>
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
  
  const [showBottomBar, setShowBottomBar] = useState(true);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#A020F0] selection:text-white font-sans overflow-x-hidden">
      <Helmet>
        <title>{profile.displayName || profile.username} (@{profile.username}) | Chip NG</title>
      </Helmet>

      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 h-20 flex items-center justify-between pointer-events-none">
        <RouterLink to="/" className="p-3 bg-black/20 backdrop-blur-xl rounded-2xl pointer-events-auto border border-white/5 active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6 text-white" />
        </RouterLink>
        
        <button 
          onClick={handleSaveContact}
          className="p-3 bg-black/20 backdrop-blur-xl rounded-2xl pointer-events-auto border border-white/5 active:scale-95 transition-transform flex items-center gap-2 group"
        >
          <div className="relative">
            <UserPlus className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#A020F0] rounded-full border-2 border-black" />
          </div>
        </button>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-lg mx-auto pb-32">
        {/* Hero Section */}
        <div className="relative h-[40vh] min-h-[350px] w-full overflow-hidden">
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
              <div className="w-full h-full bg-[#1a0f0a]" />
            )}
            
            {/* Visual Gradients & Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
            
            {/* Centered Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-20 px-6 text-center">
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-1"
               >
                 <div className="flex items-center gap-2 justify-center">
                   <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-2xl">
                     {profile.displayName || profile.username}
                   </h1>
                   {profile.isVerified && (
                     <BadgeCheck className="w-8 h-8 text-[#A020F0] fill-white mt-1" />
                   )}
                 </div>
                 <p className="text-white/80 text-xl font-medium tracking-tight">
                   @{profile.username}
                 </p>
               </motion.div>

               {/* Social Connections Under Handle */}
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.2 }}
                 className="flex items-center gap-4 mt-6"
               >
                 {profile.socialLinks && Object.entries(profile.socialLinks).slice(0, 4).map(([id, url]) => {
                   const Icon = BrandIcons[id as keyof typeof BrandIcons];
                   return (
                     <a 
                       key={id} 
                       href={url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all hover:scale-110 active:scale-90"
                     >
                       {Icon ? <Icon className="w-5 h-5 text-white" /> : <AtSign className="w-5 h-5 text-white" />}
                     </a>
                   );
                 })}
                 
                 {/* Custom 'Me' Icon */}
                 <div className="w-10 h-10 bg-[#A020F0]/20 backdrop-blur-md rounded-full flex items-center justify-center border border-[#A020F0]/30 cursor-pointer hover:bg-[#A020F0]/30 transition-all">
                    <span className="text-[10px] font-black text-[#A020F0] uppercase tracking-tighter">me</span>
                 </div>
               </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bio Section */}
        <div className="px-8 -mt-6 relative z-10 space-y-10">
          {profile.bio && (
            <p className="text-white/60 text-lg leading-relaxed text-center font-medium">
              {profile.bio}
            </p>
          )}

          {/* Lead Capture Horizontal Bar */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#A020F0] to-[#E4405F] rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition-opacity" />
            <div className="relative flex items-center bg-white rounded-[2rem] p-1.5 h-16 shadow-2xl overflow-hidden">
              <input 
                type="email" 
                placeholder="your@email.com"
                className="flex-1 bg-transparent px-6 text-zinc-900 font-medium outline-none placeholder:text-zinc-400"
              />
              <button className="h-full bg-zinc-900 text-white pl-6 pr-4 rounded-[1.8rem] flex items-center gap-3 active:scale-95 transition-transform">
                <span className="font-bold text-sm">Connect with</span>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-zinc-500" />
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 pt-4">
            {/* Tabs */}
            <div className="flex items-center justify-center gap-12 border-b border-white/5 pb-4">
              <button 
                onClick={() => setActiveTab('shouts')}
                className={`text-sm font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'shouts' ? 'text-white' : 'text-zinc-600'}`}
              >
                Shouts
                {activeTab === 'shouts' && (
                  <motion.div layoutId="activeTab" className="absolute -bottom-4 left-0 right-0 h-1 bg-[#A020F0] rounded-full" />
                )}
              </button>
              <button 
                onClick={() => setActiveTab('media')}
                className={`text-sm font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'media' ? 'text-white' : 'text-zinc-600'}`}
              >
                Media
                {activeTab === 'media' && (
                  <motion.div layoutId="activeTab" className="absolute -bottom-4 left-0 right-0 h-1 bg-[#A020F0] rounded-full" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
              <AnimatePresence mode="wait">
                {activeTab === 'shouts' ? (
                  <motion.div 
                    key="shouts"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 flex flex-col items-center"
                  >
                    {shouts.filter(s => !(s as any).isDeleted).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="relative mb-8 group cursor-default">
                          <div className="absolute inset-0 bg-[#A020F0]/20 blur-3xl rounded-full scale-150 animate-pulse" />
                          <div className="relative transform hover:scale-110 transition-transform duration-500 rotate-12">
                            <div className="bg-gradient-to-br from-[#A020F0] to-[#601090] p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(160,32,240,0.3)] border border-white/10">
                              <Megaphone className="w-16 h-16 text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]" />
                            </div>
                            <div className="absolute top-2 left-2 inset-0 border border-white/20 rounded-[2rem] pointer-events-none" />
                          </div>
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">No Shouts yet!</h2>
                        <p className="text-zinc-500 font-medium">Shouts posted by {profile.displayName || profile.username} will appear here</p>
                      </div>
                    ) : (
                      shouts.filter(s => !(s as any).isDeleted).map(shout => (
                        <div key={shout.id} className="w-full bg-zinc-900/40 backdrop-blur-sm border border-white/5 p-6 rounded-[2rem] space-y-4">
                           <p className="text-lg text-white/90 font-medium leading-relaxed">{shout.content}</p>
                           {shout.image && (
                             <img src={shout.image} alt="" className="w-full rounded-2xl object-cover max-h-96" referrerPolicy="no-referrer" />
                           )}
                           <div className="flex items-center justify-between pt-2">
                             <div className="flex items-center gap-2">
                               <Logo size="sm" variant="icon-only" className="opacity-50" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-[#A020F0]">Chip Shout</span>
                             </div>
                             <span className="text-[10px] text-white/30 font-bold uppercase">{format(new Date(shout.createdAt), 'MMM d, yyyy')}</span>
                           </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="media"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {media.filter(m => !(m as any).isDeleted).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5">
                          <ImageIcon className="w-10 h-10 text-zinc-700" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">Gallery is empty</h2>
                        <p className="text-zinc-500 font-medium">Check back later for photos and videos.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {media.filter(m => !(m as any).isDeleted).map(m => (
                          <div key={m.id} className="aspect-square rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/5 group relative">
                            {m.type === 'image' ? (
                              <img src={m.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                            ) : (
                              <video src={m.url} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Plus className="w-8 h-8 text-white/50" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Links / Featured Section (Optional but kept for functionality) */}
            {links.length > 0 && (
              <div className="space-y-4 pt-12">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Featured Links</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                {links.map((link) => (
                  <motion.a 
                    key={link.id} 
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkClick(link.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="block p-4 bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl hover:bg-zinc-900 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {link.icon ? (
                        <img src={link.icon} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-700">
                          <LinkIcon className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1">
                        <span className="block text-[15px] font-bold text-white group-hover:text-[#A3E635] transition-colors">{link.title}</span>
                        <span className="block text-[11px] text-zinc-500 truncate max-w-[200px]">{link.url.replace('https://', '')}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-white transition-colors" />
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="py-20 flex flex-col items-center gap-4 opacity-30">
          <Logo size="sm" variant="icon-only" className="grayscale" />
          <span className="text-[11px] font-black tracking-[0.2em] uppercase">Verified Chip NG profile</span>
        </footer>
      </main>

      {/* Persistent Bottom Bar */}
      <AnimatePresence>
        {showBottomBar && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
          >
            <div className="max-w-xl mx-auto bg-white rounded-2xl sm:rounded-[2rem] px-6 h-16 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3">
                <Logo size="sm" />
                <div className="h-4 w-px bg-zinc-200" />
                <span className="text-[#A020F0] font-black italic">NG</span>
              </div>
              
              <p className="hidden sm:block text-zinc-900 font-bold text-sm">
                Join today and start making money
              </p>
              <p className="sm:hidden text-zinc-900 font-bold text-[12px]">
                Join today & earn
              </p>

              <div className="flex items-center gap-4">
                <RouterLink to="/signup" className="hidden sm:block px-6 py-2 bg-black text-white rounded-full text-sm font-black active:scale-95 transition-transform">
                  Sign Up
                </RouterLink>
                <button 
                  onClick={() => setShowBottomBar(false)}
                  className="p-1 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Form Modal */}
      <AnimatePresence>
        {showContactForm && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContactForm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-[#0a0a0a] rounded-t-[2.5rem] sm:rounded-[3rem] p-8 pb-12 shadow-2xl border border-white/5"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 sm:hidden" />
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white">Contact {profile.displayName || profile.username}</h2>
                  <p className="text-white/40 text-sm mt-2">Send a direct message or inquiry.</p>
                </div>
                <button onClick={() => setShowContactForm(false)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); toast.success("Message sent!"); setShowContactForm(false); }}>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Your Name</label>
                  <input type="text" required className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-5 text-white focus:border-[#A020F0]/50 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Your Email</label>
                  <input type="email" required className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-5 text-white focus:border-[#A020F0]/50 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Message</label>
                  <textarea required rows={4} className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-white focus:border-[#A020F0]/50 outline-none transition-all resize-none" />
                </div>
                <button className="w-full h-16 bg-[#A020F0] text-white rounded-[2rem] font-black uppercase tracking-widest text-sm mt-6 shadow-2xl shadow-[#A020F0]/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Send Message
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
