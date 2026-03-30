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
  Share2, QrCode, X, Copy, Check, 
  ExternalLink, Link as LinkIcon, AlertCircle,
  CheckCircle2, Youtube, Music2,
  Instagram, Twitter, Linkedin, Facebook, MessageCircle,
  MapPin, Calendar, Clock, ChevronRight, Github, Twitch, Mail, Ghost, MessageSquare
} from 'lucide-react';
import Logo from '../components/Logo';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { User, Link, THEMES, ThemeType, ButtonStyle } from '../types';
import { Helmet } from 'react-helmet-async';

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
          where('active', '==', true),
          orderBy('position', 'asc')
        );
        unsubLinks = onSnapshot(q, (snapshot) => {
          const allLinks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Link));
          
          // Filter by scheduling
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 transition-colors duration-300">
      <div className="w-12 h-12 border-4 border-lime-500 dark:border-lime-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white p-6 transition-colors duration-300">
      <AlertCircle className="w-16 h-16 text-zinc-200 dark:text-zinc-800 mb-6" />
      <h1 className="text-4xl font-bold tracking-tighter mb-4 text-zinc-950 dark:text-white">{error || 'Profile not found'}</h1>
      <p className="text-zinc-500 mb-8 text-center max-w-md">
        The profile you are looking for doesn't exist or has been removed.
      </p>
      <RouterLink to="/" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-8 py-3 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
        Go Home
      </RouterLink>
    </div>
  );

  const theme = THEMES[profile.theme];
  const btnStyle = profile.buttonStyle === 'rounded' ? 'rounded-2xl' : profile.buttonStyle === 'pill' ? 'rounded-full' : 'rounded-none';

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {
      return null;
    }
  };

  const socialIcons = [
    { id: 'instagram', icon: Instagram, url: (val: string) => val.startsWith('http') ? val : `https://instagram.com/${val}` },
    { id: 'twitter', icon: Twitter, url: (val: string) => val.startsWith('http') ? val : `https://twitter.com/${val}` },
    { id: 'linkedin', icon: Linkedin, url: (val: string) => val.startsWith('http') ? val : `https://linkedin.com/in/${val}` },
    { id: 'youtube', icon: Youtube, url: (val: string) => val.startsWith('http') ? val : `https://youtube.com/@${val}` },
    { id: 'facebook', icon: Facebook, url: (val: string) => val.startsWith('http') ? val : `https://facebook.com/${val}` },
    { id: 'whatsapp', icon: MessageCircle, url: (val: string) => val.startsWith('http') ? val : `https://wa.me/${val}` },
    { id: 'tiktok', icon: Music2, url: (val: string) => val.startsWith('http') ? val : `https://tiktok.com/@${val}` },
    { id: 'reddit', icon: MessageSquare, url: (val: string) => val.startsWith('http') ? val : `https://reddit.com/u/${val}` },
    { id: 'github', icon: Github, url: (val: string) => val.startsWith('http') ? val : `https://github.com/${val}` },
    { id: 'twitch', icon: Twitch, url: (val: string) => val.startsWith('http') ? val : `https://twitch.tv/${val}` },
    { id: 'snapchat', icon: Ghost, url: (val: string) => val.startsWith('http') ? val : `https://snapchat.com/add/${val}` },
    { id: 'mail', icon: Mail, url: (val: string) => val.startsWith('mailto:') ? val : `mailto:${val}` }
  ];

  return (
    <div className={`min-h-screen relative ${theme.background} ${theme.text} selection:bg-white selection:text-black`}>
      {/* Custom Background Image */}
      {profile.backgroundType === 'image' && profile.backgroundImage && (
        <div 
          className="fixed inset-0 z-0 opacity-40 pointer-events-none"
          style={{ 
            backgroundImage: `url(${profile.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)'
          }}
        />
      )}
      
      <Helmet>
        <title>{profile.displayName || profile.username} | Chip NG</title>
        <meta name="description" content={profile.bio || `Check out ${profile.username}'s links on Chip NG.`} />
        <meta property="og:title" content={`${profile.displayName || profile.username} | Chip NG`} />
        <meta property="og:description" content={profile.bio || `Check out ${profile.username}'s links on Chip NG.`} />
        {profile.photoURL && <meta property="og:image" content={profile.photoURL} />}
      </Helmet>

      <div className="max-w-2xl mx-auto px-6 py-20 flex flex-col items-center relative z-10">
        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-12 w-full"
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
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">@{profile.username}</h1>
            {profile.isVerified && (
              <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/10" />
            )}
          </div>
          {profile.displayName && <h2 className="text-lg opacity-80 mb-4">{profile.displayName}</h2>}
          {profile.bio && <p className="text-base opacity-70 max-w-sm leading-relaxed mb-8">{profile.bio}</p>}

          {/* Social Icons */}
          {profile.socialLinks && Object.values(profile.socialLinks).some(v => v) && (
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {socialIcons.map(social => {
                const value = profile.socialLinks?.[social.id as keyof typeof profile.socialLinks];
                if (!value) return null;
                return (
                  <a 
                    key={social.id}
                    href={social.url(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all hover:scale-110"
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Links List */}
        <div className="w-full space-y-4">
          {links.map((link, i) => {
            if (link.type === 'youtube') {
              const videoId = link.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
              if (videoId) {
                return (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`w-full overflow-hidden ${theme.button} ${btnStyle} border border-white/10`}
                  >
                    <div className="aspect-video w-full">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        className="w-full h-full"
                        allowFullScreen
                        title={link.title}
                      />
                    </div>
                    <div className={`p-4 font-bold text-center ${theme.buttonText}`}>
                      {link.title}
                    </div>
                  </motion.div>
                );
              }
            }

            if (link.type === 'tiktok') {
              return (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleLinkClick(link.id, link.url)}
                  className={`w-full p-5 ${theme.button} ${theme.buttonText} ${btnStyle} font-bold text-lg transition-all flex items-center justify-between group relative overflow-hidden border border-white/10`}
                >
                  <div className="flex items-center gap-3">
                    <Music2 className="w-5 h-5" />
                    <span>{link.title}</span>
                  </div>
                  <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              );
            }

            return (
              <motion.button
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleLinkClick(link.id, link.url)}
                className={`w-full p-5 ${theme.button} ${theme.buttonText} ${btnStyle} font-bold text-lg transition-all flex items-center justify-between group relative overflow-hidden border border-white/10`}
              >
                <div className="flex items-center gap-4 w-full">
                  {(link.icon || getFavicon(link.url)) && (
                    <img 
                      src={link.icon || getFavicon(link.url)!} 
                      alt="" 
                      className="w-6 h-6 rounded-md object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className="flex-1 text-center pr-6">{link.title}</span>
                </div>
                <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-5" />
              </motion.button>
            );
          })}
        </div>

        {/* Business Features: Location & Appointments */}
        <div className="w-full mt-12 space-y-12">
          {/* Google Maps */}
          {profile.location?.lat && profile.location?.lng && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`w-full p-6 bg-white/10 backdrop-blur-md border border-white/10 ${btnStyle} overflow-hidden`}
            >
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-lime-400" />
                <h3 className="font-bold">Our Location</h3>
              </div>
              <div className="aspect-video w-full rounded-xl overflow-hidden mb-4">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.VITE_GOOGLE_MAPS_API_KEY}&q=${profile.location.lat},${profile.location.lng}`}
                  allowFullScreen
                />
              </div>
              {profile.location.address && (
                <p className="text-sm opacity-70">{profile.location.address}</p>
              )}
            </motion.div>
          )}

          {/* Appointments */}
          {profile.appointmentsEnabled && profile.appointments && profile.appointments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-lime-400" />
                <h3 className="font-bold text-xl">Book an Appointment</h3>
              </div>
              <div className="grid gap-4">
                {profile.appointments.map((apt, idx) => (
                  <a
                    key={idx}
                    href={apt.contactLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 ${btnStyle} transition-all group flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-lime-400/20 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-lime-400" />
                      </div>
                      <div>
                        <h4 className="font-bold">{apt.title}</h4>
                        <p className="text-sm opacity-60">
                          {format(new Date(apt.dateTime), 'PPP p')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}
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
        <RouterLink to="/" className="mt-20 opacity-50 hover:opacity-100 transition-opacity">
          <Logo size="sm" className="!flex-row !gap-3" />
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
