import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { db, getUserByUsername, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, updateDoc, increment 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Share2, QrCode, X, Check, 
  Link as LinkIcon, AlertCircle,
  Youtube, Music2, UserPlus,
  Instagram, Twitter, Linkedin, Facebook, MessageCircle,
  MapPin, Mail, Ghost, MessageSquare,
  Disc, Send, Pin, Music, Apple, Cloud, AtSign, Hash, Github, Twitch
} from 'lucide-react';
import Logo from '../components/Logo';
import { toast } from 'sonner';
import { User, Link, THEMES } from '../types';
import { Helmet } from 'react-helmet-async';
import { isAfter, isBefore } from 'date-fns';

// New Components
import { ProfileBackground } from '../components/profile/ProfileBackground';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { LinkCard } from '../components/profile/LinkCard';
import { ExtraSections } from '../components/profile/ExtraSections';
import { SocialRail } from '../components/profile/SocialRail';

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

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
        }).catch(err => {
          console.error('Failed to track profile view:', err);
        });

        unsubProfile = onSnapshot(profileRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as User);
          } else {
            setError('Profile no longer exists');
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, profileRef.path);
        });

        const q = query(
          collection(db, 'links'), 
          where('userId', '==', userId),
          orderBy('position', 'asc')
        );
        unsubLinks = onSnapshot(q, (snapshot) => {
          const allLinks = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Link))
            .filter(link => link.active); // Filter active in memory to avoid composite index requirement
          
          const now = new Date();
          const filteredLinks = allLinks.filter(link => {
            if (!link.scheduledStart && !link.scheduledEnd) return true;
            const start = link.scheduledStart ? new Date(link.scheduledStart) : null;
            const end = link.scheduledEnd ? new Date(link.scheduledEnd) : null;
            if (start && isBefore(now, start)) return false;
            if (end && isAfter(now, end)) return false;
            return true;
          });

          setLinks(filteredLinks);
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'links');
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

  const handleLinkClick = async (linkId: string, url: string) => {
    try {
      updateDoc(doc(db, 'links', linkId), {
        clicks: increment(1)
      }).catch(err => console.error('Failed to track click:', err));
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error(err);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied to clipboard');
  };

  const saveContact = () => {
    if (!profile) return;
    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${profile.displayName || profile.username}`,
      `N:;${profile.displayName || profile.username};;;`,
      profile.email ? `EMAIL;TYPE=INTERNET:${profile.email}` : '',
      profile.bio ? `NOTE:${profile.bio}` : '',
      `URL:${window.location.href}`,
    ];
    if (profile.socialLinks?.whatsapp) {
      const phone = profile.socialLinks.whatsapp.replace(/\D/g, '');
      if (phone) vcardLines.push(`TEL;TYPE=CELL:${phone}`);
    }
    vcardLines.push('END:VCARD');
    const vcard = vcardLines.join('\n');
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${profile.username || 'contact'}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Contact file downloaded');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Logo size="lg" variant="icon-only" />
      </motion.div>
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
      <AlertCircle className="w-16 h-16 text-zinc-800 mb-6" />
      <h1 className="text-4xl font-black mb-4">{error || 'Profile Not Found'}</h1>
      <p className="text-zinc-500 mb-8 text-center max-w-md">
        The profile you are looking for doesn't exist or has been removed.
      </p>
      <RouterLink to="/" className="bg-lime-400 text-black px-8 py-3 rounded-full font-black uppercase tracking-tighter hover:scale-105 transition-transform">
        Back Home
      </RouterLink>
    </div>
  );

  const theme = THEMES[profile.theme];


  return (
    <div className={`min-h-screen relative overflow-x-hidden ${theme.text} selection:bg-lime-400 selection:text-black`}>
      <Helmet>
        <title>{profile.displayName || profile.username} | Premium Mini Profile</title>
        <meta name="description" content={profile.bio || `Explore ${profile.displayName}'s exclusive content and links.`} />
        <meta property="og:title" content={`${profile.displayName || profile.username} | Link Hub`} />
        {profile.photoURL && <meta property="og:image" content={profile.photoURL} />}
      </Helmet>

      {/* Background System */}
      <ProfileBackground profile={profile} />

      <div className="relative z-50 w-full max-w-[480px] mx-auto pt-16 pb-32 px-6 flex flex-col items-center min-h-screen">
        {/* Profile Header */}
        <ProfileHeader profile={profile} />

        {/* Global Social Links Horizontal Rail */}
        <SocialRail profile={profile} />

        {/* Dynamic Links Layout */}
        <div className={`w-full ${
          profile.profileLayout === 'grid' 
            ? 'grid grid-cols-2 gap-4' 
            : profile.profileLayout === 'cards'
            ? 'space-y-6'
            : 'space-y-4'
        }`}>
          {links.map((link, i) => {
            const isFeatured = profile.profileLayout === 'featured' && i === 0;
            return (
              <div key={link.id} className={isFeatured ? 'col-span-full' : ''}>
                <LinkCard 
                  link={link}
                  profile={profile}
                  index={i}
                  onClick={handleLinkClick}
                  variant={isFeatured ? 'featured' : profile.profileLayout === 'cards' ? 'card' : 'standard'}
                />
              </div>
            );
          })}
        </div>

        {/* Extra Sections (Map, Bookings) */}
        <ExtraSections profile={profile} />

        {/* Footer / Branding */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-auto pt-20 flex flex-col items-center gap-4"
        >
          <RouterLink 
            to="/" 
            className="group flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-all duration-500"
          >
            <Logo size="sm" variant="icon-only" className="grayscale group-hover:grayscale-0 transition-all opacity-50 group-hover:opacity-100" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
              Created with Chip NG
            </span>
          </RouterLink>
        </motion.div>
      </div>

      {/* Floating Modern Action Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]"
      >
        <div className="flex items-center gap-1.5 p-2 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
           <button 
            onClick={() => setShowQR(true)}
            className="p-3.5 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all hover:-translate-y-1 active:scale-95"
            title="Scan QR"
          >
            <QrCode className="w-5 h-5 shadow-sm" />
          </button>
          
          <button 
            onClick={saveContact}
            className="flex items-center gap-2 px-6 h-12 bg-lime-400 hover:bg-lime-300 text-black rounded-full font-black text-xs uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Save Contact</span>
          </button>

          <button 
            onClick={copyLink}
            className="p-3.5 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all hover:-translate-y-1 active:scale-95"
            title="Share Profile"
          >
            {copied ? <Check className="w-5 h-5 text-lime-400" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-0">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowQR(false)}
               className="absolute inset-0 bg-black/90 backdrop-blur-xl"
             />
             
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-zinc-900 overflow-hidden border border-white/10 rounded-[2.5rem] max-w-sm w-full flex flex-col items-center gap-8 p-10 shadow-3xl"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lime-400 to-emerald-500" />
              
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center">
                <div className="relative inline-block mb-2">
                  <div className="absolute -inset-1 bg-lime-400/20 blur-lg rounded-full" />
                  <h3 className="relative text-2xl font-black text-white italic tracking-tight">Scan Profile</h3>
                </div>
                <p className="text-white/40 text-sm font-medium">@{profile.username} on Chip NG</p>
              </div>

              <div className="relative group p-4 bg-white rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <QRCodeSVG 
                  value={window.location.href} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <button 
                onClick={copyLink}
                className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                Copy Profile URL
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicProfile;
