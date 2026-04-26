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
  Mail, MessageSquare, ChevronLeft,
  Image as ImageIcon,
  Plus, AtSign, UserPlus
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
      const linkRef = doc(db, 'links', linkId);
      await updateDoc(linkRef, {
        clicks: increment(1)
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
      <main className="relative w-full max-w-md mx-auto min-h-screen bg-white">
        {/* Cover Image Area */}
        <div className="relative h-[250px] w-full overflow-hidden bg-zinc-100 sm:rounded-b-[2.5rem]">
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
            {/* Blending Gradient at the bottom to match background */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
            
            <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center px-6">
               <div className="flex items-center gap-1.5 mb-1 justify-center">
                 <h1 className="text-[32px] font-black text-black leading-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">
                   {profile.displayName || profile.username}
                 </h1>
                 {profile.isVerified && (
                   <BadgeCheck className="w-8 h-8 text-[#1D9BF0] fill-[#1D9BF0] stroke-white stroke-1 mt-1" />
                 )}
               </div>
               <p className="text-zinc-600 text-[18px] font-bold">
                 @{profile.username}
               </p>
            </div>
          </motion.div>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* Bio if exists */}
          {profile.bio && (
            <p className="text-zinc-500 text-[15px] leading-relaxed text-center px-6">
              {profile.bio}
            </p>
          )}

          {/* Social Platforms Row - Display Platform Names in a row with horizontal scroll */}
          {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2 px-6 -mx-6 justify-center">
              {Object.entries(profile.socialLinks).map(([id, url]) => {
                const Icon = BrandIcons[id as keyof typeof BrandIcons];
                const platformName = id === 'x' ? 'X' : id.charAt(0).toUpperCase() + id.slice(1);
                
                return (
                  <a 
                    key={id} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex flex-col items-center gap-2 flex-shrink-0 group"
                  >
                    <div 
                      className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 hover:bg-zinc-100 transition-all active:scale-90"
                      style={{ color: profile.brandColor || '#18181b' }}
                    >
                      {Icon ? <Icon className="w-7 h-7 transition-colors" /> : <AtSign className="w-7 h-7" />}
                    </div>
                    <span className="text-[11px] font-black text-zinc-400 group-hover:text-zinc-900 transition-colors uppercase tracking-wider">{platformName}</span>
                  </a>
                );
              })}
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex gap-3">
            <button 
              onClick={() => setShowContactForm(true)}
              className="flex-[2] h-14 text-white rounded-2xl font-black text-[16px] shadow-lg shadow-lime-100/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: profile.brandColor || '#A3E635' }}
            >
              <Mail className="w-5 h-5" />
              Connect
            </button>
            <button 
              onClick={handleSaveContact}
              className="flex-1 h-14 bg-zinc-100 text-zinc-900 rounded-2xl font-black text-[16px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Save
            </button>
          </div>

          {/* Shouts/Media Tabs Slider Section */}
          <div className="pt-4">
            <div className="flex bg-zinc-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setActiveTab('shouts')}
                className={`flex-1 py-3 rounded-xl text-[14px] font-black transition-all ${activeTab === 'shouts' ? 'bg-white shadow-sm' : 'text-zinc-500'}`}
                style={{ color: activeTab === 'shouts' ? (profile.brandColor || '#000000') : undefined }}
              >
                Shouts
              </button>
              <button 
                onClick={() => setActiveTab('media')}
                className={`flex-1 py-3 rounded-xl text-[14px] font-black transition-all ${activeTab === 'media' ? 'bg-white shadow-sm' : 'text-zinc-500'}`}
                style={{ color: activeTab === 'media' ? (profile.brandColor || '#000000') : undefined }}
              >
                Media
              </button>
            </div>

            <div className="mt-4">
              <AnimatePresence mode="wait">
                {activeTab === 'shouts' ? (
                  <motion.div 
                    key="shouts"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="py-12 flex flex-col items-center text-center gap-2 bg-zinc-50 rounded-3xl"
                  >
                    <MessageSquare className="w-10 h-10 text-zinc-200" />
                    <h3 className="text-[16px] font-black">No Shouts yet</h3>
                    <p className="text-[14px] text-zinc-400 px-10 leading-snug">
                      Check back later for updates from {profile.displayName || profile.username}.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="media"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="py-12 flex flex-col items-center text-center gap-2 bg-zinc-50 rounded-3xl"
                  >
                    <ImageIcon className="w-10 h-10 text-zinc-200" />
                    <h3 className="text-[16px] font-black">No Media yet</h3>
                    <p className="text-[14px] text-zinc-400 px-10 leading-snug">
                      Photos and highlights will be displayed here soon.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Links Section */}
          <div className="space-y-4 pt-8">
            <h3 className="text-[18px] font-black px-1">Featured</h3>
            {links.map((link) => (
              <a 
                key={link.id} 
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link.id)}
                className="block p-5 bg-white border border-zinc-100 rounded-3xl shadow-sm hover:border-zinc-300 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {link.icon ? (
                    <img src={link.icon} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300">
                      <LinkIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="block text-[15px] font-black">{link.title}</span>
                    <span className="block text-[11px] text-zinc-400 truncate max-w-[200px]">{link.url.replace('https://', '')}</span>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: (profile.brandColor || '#A3E635') + '10', color: profile.brandColor || '#A3E635' }}
                  >
                    <ChevronLeft className="w-5 h-5 rotate-180" />
                  </div>
                </div>
              </a>
            ))}

            {/* Standard Branding Links */}
            <RouterLink 
              to="/"
              className="block p-5 bg-[#F9FAFB] rounded-3xl group transition-all mt-10"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <Logo size="sm" variant="icon-only" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-black">Create Your Chip NG Profile</p>
                  <p className="text-[12px] text-zinc-500">Join the creator economy today.</p>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-20 flex flex-col items-center gap-3">
            <Logo size="sm" variant="icon-only" className="grayscale opacity-20" />
            <span className="text-[13px] font-bold text-zinc-400 tracking-tight">Verified by chipng.com</span>
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
