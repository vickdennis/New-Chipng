import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { db, getUserByUsername, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, updateDoc, increment 
} from 'firebase/firestore';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Share2, QrCode, X, Check, 
  Link as LinkIcon, AlertCircle,
  Mail, MessageSquare, ChevronLeft,
  Image as ImageIcon,
  Plus, AtSign
} from 'lucide-react';
import Logo from '../components/Logo';
import { toast } from 'sonner';
import { User, Link as LinkType } from '../types';
import { Helmet } from 'react-helmet-async';

import { BrandIcons } from '../components/icons/BrandIcons';

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<User | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shouts' | 'media'>('shouts');
  const [showContactForm, setShowContactForm] = useState(false);
  const [copied, setCopied] = useState(false);

  // Scroll animations
  const { scrollY } = useScroll();
  const coverOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const headerOpacity = useTransform(scrollY, [150, 200], [0, 1]);
  const avatarScale = useTransform(scrollY, [0, 200], [1, 0.8]);
  const avatarY = useTransform(scrollY, [0, 200], [0, 0]); // Keep it centered relative to container

  useEffect(() => {
    if (!username) return;

    let unsubProfile: () => void = () => {};
    let unsubLinks: () => void = () => {};

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

        // Track profile view
        updateDoc(profileRef, {
          totalClicks: increment(1)
        }).catch(err => console.error('Failed to track view:', err));

        unsubProfile = onSnapshot(profileRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as User);
          } else {
            setError('Profile no longer exists');
          }
        });

        const q = query(
          collection(db, 'links'), 
          where('userId', '==', userId),
          orderBy('position', 'asc')
        );
        unsubLinks = onSnapshot(q, (snapshot) => {
          const allLinks = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as LinkType))
            .filter(link => link.active);
          setLinks(allLinks);
          setLoading(false);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-6">
      <AlertCircle className="w-16 h-16 text-zinc-100 mb-6" />
      <h1 className="text-2xl font-black mb-2">Profile Not Found</h1>
      <p className="text-zinc-500 mb-8 text-center max-w-sm">The user @{username} doesn't exist on Chip NG yet.</p>
      <RouterLink to="/" className="bg-[#A3E635] text-white px-8 py-3 rounded-xl font-bold transition-transform hover:scale-105">
        Back Home
      </RouterLink>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black selection:bg-[#A3E635] selection:text-white font-sans">
      <Helmet>
        <title>{profile.displayName || profile.username} (@{profile.username}) | Chip NG</title>
      </Helmet>

      {/* Sticky Header */}
      <motion.header 
        style={{ opacity: headerOpacity }}
        className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-zinc-100 px-6 h-16 flex items-center justify-between pointer-events-auto"
      >
        <RouterLink to="/" className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
        </RouterLink>
        <h1 className="text-[18px] font-bold tracking-tight absolute left-1/2 -translate-x-1/2">
          {profile.displayName || profile.username}
        </h1>
        <button className="p-2 -mr-2" onClick={copyLink}>
          {copied ? <Check className="w-5 h-5 text-[#A3E635]" /> : <Share2 className="w-5 h-5" />}
        </button>
      </motion.header>

      {/* Main Scrollable Content */}
      <main className="relative w-full max-w-[390px] mx-auto min-h-screen">
        {/* Cover Image Area */}
        <div className="relative h-[220px] w-full overflow-hidden bg-zinc-100">
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
              <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300" />
            )}
            {/* Identity Overlay on Cover */}
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-x-0 bottom-12 px-6 flex flex-col items-center pointer-events-none">
              <h1 className="text-[22px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-white/70 text-[14px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                @{profile.username}
              </p>
              <p className="text-white/80 text-[12px] mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] line-clamp-1">
                {profile.bio || 'Your short bio here'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Profile Info & Avatar */}
        <div className="px-6 relative -mt-[48px] flex flex-col items-center">
          <motion.div 
            style={{ scale: avatarScale, y: avatarY }}
            className="w-[96px] h-[96px] rounded-full border-[3px] border-white shadow-lg bg-zinc-100 overflow-hidden z-10"
          >
            {profile.photoURL ? (
              <img 
                src={profile.photoURL} 
                alt={profile.username} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-300 font-bold text-2xl uppercase">
                {profile.username.substring(0, 2)}
              </div>
            )}
          </motion.div>

          {/* Compact Info Section */}
          <div className="mt-4 w-full flex flex-col items-center gap-4">
            {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-4 py-2">
                {Object.entries(profile.socialLinks).map(([id, url]) => {
                  const Icon = BrandIcons[id as keyof typeof BrandIcons];
                  if (!Icon && id === 'threads') {
                    return (
                      <a key={id} href={url} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors">
                        <AtSign className="w-5 h-5 text-zinc-900" />
                      </a>
                    );
                  }
                  if (!Icon) return null;
                  return (
                    <a key={id} href={url} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors">
                      <Icon className="w-5 h-5 text-zinc-900" />
                    </a>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-2 text-zinc-900 font-medium">
              <Mail className="w-4 h-4 text-[#A3E635]" />
              <span className="text-[14px]">{profile.contactEmail || profile.email || 'your@email.com'}</span>
            </div>

            <button 
              onClick={() => setShowContactForm(true)}
              className="w-full h-11 bg-[#A3E635] text-white rounded-xl font-bold text-[15px] shadow-lg shadow-lime-100/50 active:scale-[0.98] transition-all"
            >
              Connect with me
            </button>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="mt-8 border-b border-zinc-100 flex items-center">
          <button 
            onClick={() => setActiveTab('shouts')}
            className={`flex-1 flex flex-col items-center py-3 relative transition-colors ${activeTab === 'shouts' ? 'text-black' : 'text-[#6B7280]'}`}
          >
            <span className="text-[14px] font-bold">Shouts</span>
            {activeTab === 'shouts' && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 inset-x-0 h-[2px] bg-[#A3E635]" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('media')}
            className={`flex-1 flex flex-col items-center py-3 relative transition-colors ${activeTab === 'media' ? 'text-black' : 'text-[#6B7280]'}`}
          >
            <span className="text-[14px] font-bold">Media</span>
            {activeTab === 'media' && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 inset-x-0 h-[2px] bg-[#A3E635]" />
            )}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="mt-4 pb-32">
          <AnimatePresence mode="wait">
            {activeTab === 'shouts' ? (
              <motion.div 
                key="shouts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-6 py-12 flex flex-col items-center text-center gap-2"
              >
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-2">
                  <MessageSquare className="w-8 h-8 text-[#D1D5DB]" />
                </div>
                <h3 className="text-[16px] font-bold">No Shouts yet!</h3>
                <p className="text-[14px] text-[#6B7280]">
                  Shouts posted by {profile.displayName || profile.username} will appear here
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="media"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-6 py-12 flex flex-col items-center text-center gap-2"
              >
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-2">
                  <ImageIcon className="w-8 h-8 text-[#D1D5DB]" />
                </div>
                <h3 className="text-[16px] font-bold">No Media yet!</h3>
                <p className="text-[14px] text-[#6B7280]">
                  Photos and videos will appear here once shared
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-4 bg-[#F3F4F6] w-full" />

          {/* Featured Links / Merch */}
          <div className="px-6 py-8 space-y-4">
            {links.map((link) => (
              <a 
                key={link.id} 
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm hover:border-[#A3E635] transition-all group"
              >
                <div className="flex items-center gap-4">
                  {link.icon ? (
                    <img src={link.icon} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                      <LinkIcon className="w-5 h-5 transition-colors group-hover:text-[#A3E635]" />
                    </div>
                  )}
                  <span className="flex-1 text-[14px] font-bold group-hover:text-[#A3E635] transition-colors">{link.title}</span>
                  <ChevronLeft className="w-4 h-4 text-zinc-300 rotate-180" />
                </div>
              </a>
            ))}

            <RouterLink 
              to="/"
              className="block p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm group hover:border-[#A3E635] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F0FFE6] rounded-xl flex items-center justify-center">
                  <Logo size="sm" variant="icon-only" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold">Create Your Profile On chipng.com</p>
                  <p className="text-[12px] text-[#6B7280]">Join today and start making money</p>
                </div>
              </div>
            </RouterLink>

            <RouterLink 
              to="/"
              className="block p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm group hover:border-[#A3E635] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-lime-50 rounded-xl flex items-center justify-center text-[#A3E635] font-black text-xs">
                  me
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold group-hover:text-[#A3E635]">chipng.com – Join today and start making money</p>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-12 flex flex-col items-center gap-2">
            <Logo size="sm" variant="icon-only" className="grayscale opacity-50" />
            <span className="text-[12px] font-medium text-[#6B7280]">Powered by chipng.com</span>
        </footer>
      </main>

      {/* QR Floating Button */}
      <button 
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl z-50 active:scale-95 transition-transform"
        onClick={() => toast.info("QR Code coming soon")}
      >
        <QrCode className="w-6 h-6" />
      </button>

      {/* Contact Form Modal */}
      <AnimatePresence>
        {showContactForm && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContactForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 pb-12 shadow-2xl overflow-hidden"
            >
              <div className="w-12 h-1.5 bg-zinc-100 rounded-full mx-auto mb-8 sm:hidden" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black">Contact {profile.displayName || profile.username}</h2>
                  <p className="text-[#6B7280] text-sm mt-1">Send a direct message or inquiry.</p>
                </div>
                <button onClick={() => setShowContactForm(false)} className="p-2 bg-zinc-50 rounded-full">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Message sent!"); setShowContactForm(false); }}>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Your Name</label>
                  <input type="text" required className="w-full h-12 bg-zinc-50 border-none rounded-xl px-4 focus:ring-2 focus:ring-[#A3E635] transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Your Email</label>
                  <input type="email" required className="w-full h-12 bg-zinc-50 border-none rounded-xl px-4 focus:ring-2 focus:ring-[#A3E635] transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Message</label>
                  <textarea required rows={4} className="w-full bg-zinc-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-[#A3E635] transition-all resize-none" />
                </div>
                <button className="w-full h-14 bg-[#A3E635] text-white rounded-2xl font-black uppercase tracking-widest text-sm mt-4 shadow-lg shadow-lime-100">
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
