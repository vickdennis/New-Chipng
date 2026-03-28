import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, getDoc, updateDoc, increment, getDocs 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Share2, QrCode, X, Copy, Check, 
  ExternalLink, Link as LinkIcon, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { Profile, Link, THEMES, ThemeType, ButtonStyle } from '../types';
import { Helmet } from 'react-helmet-async';

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!username) return;

    const fetchProfile = async () => {
      try {
        const usernameDoc = await getDoc(doc(db, 'profiles_by_username', username.toLowerCase()));
        if (!usernameDoc.exists()) {
          setError('Profile not found');
          setLoading(false);
          return;
        }

        const userId = usernameDoc.data().userId;
        
        // Track profile view
        await updateDoc(doc(db, 'profiles', userId), {
          totalClicks: increment(1)
        });

        const unsubProfile = onSnapshot(doc(db, 'profiles', userId), (doc) => {
          if (doc.exists()) setProfile(doc.data() as Profile);
        });

        const q = query(
          collection(db, 'links'), 
          where('userId', '==', userId), 
          where('active', '==', true),
          orderBy('position', 'asc')
        );
        const unsubLinks = onSnapshot(q, (snapshot) => {
          setLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Link)));
          setLoading(false);
        });

        return () => {
          unsubProfile();
          unsubLinks();
        };
      } catch (err) {
        console.error(err);
        setError('Something went wrong');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const handleLinkClick = async (linkId: string, url: string) => {
    try {
      await updateDoc(doc(db, 'links', linkId), {
        clicks: increment(1)
      });
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
      <AlertCircle className="w-16 h-16 text-zinc-800 mb-6" />
      <h1 className="text-4xl font-bold tracking-tighter mb-4">{error || 'Profile not found'}</h1>
      <p className="text-zinc-500 mb-8 text-center max-w-md">
        The profile you are looking for doesn't exist or has been removed.
      </p>
      <RouterLink to="/" className="bg-white text-zinc-950 px-8 py-3 rounded-2xl font-bold hover:bg-zinc-200 transition-all">
        Go Home
      </RouterLink>
    </div>
  );

  const theme = THEMES[profile.theme];
  const btnStyle = profile.buttonStyle === 'rounded' ? 'rounded-2xl' : profile.buttonStyle === 'pill' ? 'rounded-full' : 'rounded-none';

  return (
    <div className={`min-h-screen ${theme.background} ${theme.text} selection:bg-white selection:text-black`}>
      <Helmet>
        <title>{profile.displayName || profile.username} | Chip NG</title>
        <meta name="description" content={profile.bio || `Check out ${profile.username}'s links on Chip NG.`} />
        <meta property="og:title" content={`${profile.displayName || profile.username} | Chip NG`} />
        <meta property="og:description" content={profile.bio || `Check out ${profile.username}'s links on Chip NG.`} />
        {profile.photoURL && <meta property="og:image" content={profile.photoURL} />}
      </Helmet>

      <div className="max-w-2xl mx-auto px-6 py-20 flex flex-col items-center">
        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-12"
        >
          <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl mb-6">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <LinkIcon className="w-10 h-10" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">@{profile.username}</h1>
          {profile.displayName && <h2 className="text-lg opacity-80 mb-4">{profile.displayName}</h2>}
          {profile.bio && <p className="text-base opacity-70 max-w-sm leading-relaxed">{profile.bio}</p>}
        </motion.div>

        {/* Links List */}
        <div className="w-full space-y-4">
          {links.map((link, i) => (
            <motion.button
              key={link.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleLinkClick(link.id, link.url)}
              className={`w-full p-5 ${theme.button} ${theme.buttonText} ${btnStyle} font-bold text-lg transition-all flex items-center justify-between group relative overflow-hidden`}
            >
              <span className="flex-1 text-center">{link.title}</span>
              <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-5" />
            </motion.button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/20 backdrop-blur-xl border border-white/10 p-2 rounded-full">
          <button 
            onClick={() => setShowQR(true)}
            className="p-3 hover:bg-white/10 rounded-full transition-colors"
          >
            <QrCode className="w-6 h-6" />
          </button>
          <button 
            onClick={copyLink}
            className="p-3 hover:bg-white/10 rounded-full transition-colors"
          >
            {copied ? <Check className="w-6 h-6 text-lime-400" /> : <Share2 className="w-6 h-6" />}
          </button>
        </div>

        {/* Branding */}
        <RouterLink to="/" className="mt-20 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
            <LinkIcon className="text-black w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tighter">Chip NG</span>
        </RouterLink>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 rounded-[2.5rem] max-w-sm w-full flex flex-col items-center gap-8 relative"
            >
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full text-zinc-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">Scan to visit</h3>
                <p className="text-zinc-500 text-sm">@{profile.username}'s Chip NG profile</p>
              </div>

              <div className="p-4 bg-zinc-50 rounded-3xl border border-zinc-100">
                <QRCodeSVG 
                  value={window.location.href} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <button 
                onClick={copyLink}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all"
              >
                Copy Profile Link
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicProfile;
