import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Calendar, 
  Camera, 
  Plus, 
  Search, 
  Check, 
  Copy, 
  X, 
  Eye, 
  Share2,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { safeWrite } from '../services/backupService';
import { toast } from 'sonner';

// --- Types ---
type AccountType = 'creator' | 'business' | 'personal' | 'agency';
type Screen = 1 | 2 | 3 | 4 | 5 | 6;

// --- Components ---

const ScreenWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-full max-w-[390px] h-[844px] bg-white overflow-hidden relative shadow-2xl rounded-[3rem] border-[8px] border-zinc-900 mx-auto my-4 flex flex-col font-sans">
    {/* Status Bar Mock */}
    <div className="h-12 flex items-center justify-between px-8 text-[12px] font-bold">
      <span>9:41</span>
      <div className="flex gap-1.5 items-center">
        <div className="w-4 h-4 rounded-full border border-black" />
        <div className="w-4 h-2.5 rounded-sm border border-black" />
        <div className="w-5 h-2.5 rounded-sm bg-black" />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
      {children}
    </div>
  </div>
);

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="w-full h-1 bg-[#E5E7EB]">
    <div 
      className="h-full bg-[#A3E635] transition-all duration-300" 
      style={{ width: `${progress}%` }} 
    />
  </div>
);

// --- Main Component ---

const OnboardingFlow: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState<Screen>(1);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [signupData, setSignupData] = useState({
    fullName: '',
    dob: '',
    username: '',
    agreed: false
  });
  const [profileStrength, setProfileStrength] = useState(5);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setSignupData({
        fullName: user.displayName || '',
        dob: '',
        username: user.username || '',
        agreed: true
      });
    }
  }, [user]);

  const nextScreen = () => {
    if (currentScreen === 2) {
      handleSaveBasicInfo();
    } else {
      setCurrentScreen((prev) => Math.min(prev + 1, 6) as Screen);
    }
  };

  const prevScreen = () => setCurrentScreen((prev) => Math.max(prev - 1, 1) as Screen);

  const handleSaveBasicInfo = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await safeWrite('users', user.uid, {
        displayName: signupData.fullName,
        username: signupData.username,
        onboardingCompleted: false // Still in progress
      }, 'update');
      setCurrentScreen(3);
    } catch (error) {
      toast.error('Failed to save info');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await safeWrite('users', user.uid, {
        onboardingCompleted: true
      }, 'update');
      toast.success('Onboarding complete!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to complete onboarding');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) {
    navigate('/login');
    return null;
  }

  // --- Screens ---

  const Screen1 = () => (
    <div className="px-6 flex flex-col h-full">
      <h2 className="text-[20px] font-semibold text-center mt-8 mb-10 text-[#000000]">
        Which of these best describes you?
      </h2>
      <div className="space-y-4 flex-1">
        {[
          { id: 'creator', label: 'Creator / Influencer' },
          { id: 'business', label: 'Business / Brand' },
          { id: 'personal', label: 'Personal / Professional' },
          { id: 'agency', label: 'Agency / Management' }
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setAccountType(type.id as AccountType)}
            className={`w-full flex items-center gap-4 px-6 py-5 rounded-[16px] transition-all border ${
              accountType === type.id 
                ? 'border-2 border-[#A3E635] bg-[#F0FFE6]' 
                : 'border-[#E5E7EB] bg-white'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex-shrink-0" />
            <span className="text-[16px] text-[#000000] font-medium">{type.label}</span>
          </button>
        ))}
      </div>
      <div className="pb-10 pt-4">
        <button
          onClick={nextScreen}
          disabled={!accountType}
          className={`w-full h-12 rounded-[12px] font-bold text-[16px] transition-all ${
            accountType ? 'bg-[#A3E635] text-white shadow-lg shadow-lime-200' : 'bg-[#D1D5DB] text-[#9CA3AF]'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );

  const Screen2 = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center px-4 h-14 border-b border-[#E5E7EB]/50">
        <button onClick={prevScreen} className="p-2">
          <ChevronLeft className="w-6 h-6 text-black" />
        </button>
        <h1 className="flex-1 text-center font-semibold text-[18px] text-black pr-10">Welcome to chipng.com</h1>
      </div>
      <div className="px-6 pt-6 flex flex-col flex-1">
        <p className="text-[#6B7280] text-[14px] text-center mb-10">Turn your followers into customers.</p>
        
        <div className="space-y-4 flex-1">
          <div className="space-y-1.5">
            <input 
              type="text" 
              placeholder="Victor Dennis"
              className="w-full h-12 rounded-[12px] border border-[#D1D5DB] px-4 text-[16px] outline-none focus:border-[#A3E635] transition-colors"
              value={signupData.fullName}
              onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
            />
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="MM/DD/YYYY"
              className="w-full h-12 rounded-[12px] border border-[#D1D5DB] px-4 text-[16px] outline-none focus:border-[#A3E635] transition-colors"
              value={signupData.dob}
              onChange={(e) => setSignupData({ ...signupData, dob: e.target.value })}
            />
            <Calendar className="absolute right-4 top-3.5 w-5 h-5 text-[#9CA3AF]" />
          </div>

          <div className="relative flex items-center border border-[#D1D5DB] rounded-[12px] px-4 h-12 focus-within:border-[#A3E635] transition-colors">
            <span className="text-[#6B7280] text-[16px] flex-shrink-0">chipng.com/</span>
            <input 
              type="text" 
              placeholder="username"
              className="w-full h-full bg-transparent outline-none text-[16px]"
              value={signupData.username}
              onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4 items-start">
            <button 
              onClick={() => setSignupData({ ...signupData, agreed: !signupData.agreed })}
              className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                signupData.agreed ? 'bg-[#A3E635] border-[#A3E635]' : 'border-[#D1D5DB]'
              }`}
            >
              {signupData.agreed && <Check className="w-4 h-4 text-white" />}
            </button>
            <p className="text-[14px] text-[#000000] leading-tight">
              I agree to the <span className="text-[#A3E635] underline cursor-pointer">Privacy Policy</span> and <span className="text-[#A3E635] underline cursor-pointer">Terms of Service</span>
            </p>
          </div>
        </div>

        <div className="pb-10 space-y-4">
          <button
            onClick={nextScreen}
            disabled={saving || !signupData.fullName || !signupData.username || !signupData.dob || !signupData.agreed}
            className={`w-full h-12 rounded-[12px] font-bold text-[16px] transition-all flex items-center justify-center ${
              (signupData.fullName && signupData.username && signupData.dob && signupData.agreed)
                ? 'bg-[#A3E635] text-white shadow-lg shadow-lime-200' 
                : 'bg-[#D1D5DB] text-[#9CA3AF]'
            }`}
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
          <p className="text-center text-[14px]">
            Have an account already? <span className="text-[#A3E635] font-bold cursor-pointer" onClick={() => navigate('/login')}>Log in</span>
          </p>
        </div>
      </div>
    </div>
  );

  const Screen3 = () => (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-6 h-14 bg-white z-10 sticky top-0">
        <button className="text-black font-medium" onClick={prevScreen}>Cancel</button>
        <h1 className="font-semibold text-[16px]">Edit Profile</h1>
        <button className="text-[#A3E635] font-bold text-[16px]" onClick={nextScreen}>Done</button>
      </div>

      <div className="px-6 flex flex-col items-center">
        <div className="mt-8 mb-6 relative">
          <div className="w-[100px] h-[100px] rounded-full bg-[#F3F4F6] flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-[#6B7280]" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#A3E635] text-white text-[10px] font-bold px-2 py-1.5 rounded-[12px] border-2 border-white">
            +25%
          </div>
        </div>

        <div className="w-full mb-8">
          <p className="text-[14px] text-[#6B7280] mb-2 font-medium">Profile Strength • {profileStrength}%</p>
          <ProgressBar progress={profileStrength} />
        </div>

        <div className="w-full space-y-0.5 mb-10 text-left">
          <div className="flex items-center justify-between py-4 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-lime-50 flex items-center justify-center text-[#A3E635]">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[15px] font-medium">Add Platforms</span>
            </div>
            <span className="bg-[#A3E635] text-white text-[12px] font-extrabold px-3 py-1.5 rounded-full">+20%</span>
          </div>

          <div className="py-4 border-b border-[#F3F4F6]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[15px] font-medium">Bio</span>
              <span className="text-[#A3E635] font-bold text-[13px]">+15%</span>
            </div>
            <p className="text-[#6B7280] text-[14px]">{user?.bio || 'Add bio to your profile'}</p>
          </div>

          <div className="py-4 border-b border-[#F3F4F6]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[15px] font-medium">Email Contact Form</span>
              <div className="w-12 h-6 bg-[#E5E7EB] rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm" />
              </div>
            </div>
            <p className="text-[#6B7280] text-[12px] leading-snug">Visitors can share their email with you through a contact form on your profile.</p>
          </div>
        </div>

        <div className="w-full text-left">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[18px]">Featured Links</h3>
            <span className="text-[#A3E635] font-bold text-[13px]">+15%</span>
          </div>
          
          <div className="space-y-4">
            <button className="w-full p-6 border-2 border-dashed border-[#D1D5DB] rounded-[16px] flex flex-col items-center gap-2 group hover:border-[#A3E635] transition-colors">
              <Plus className="w-8 h-8 text-[#A3E635]" />
              <span className="text-[14px] font-bold text-zinc-900">Add Big Thumbnail Link</span>
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button className="aspect-[4/3] border-2 border-dashed border-[#D1D5DB] rounded-[16px] flex flex-col items-center justify-center gap-2 group hover:border-[#A3E635] transition-colors">
                <Plus className="w-6 h-6 text-[#A3E635]" />
                <span className="text-[12px] font-bold text-zinc-900">Small Link</span>
              </button>
              <button className="aspect-[4/3] border-2 border-dashed border-[#D1D5DB] rounded-[16px] flex flex-col items-center justify-center gap-2 group hover:border-[#A3E635] transition-colors">
                <Plus className="w-6 h-6 text-[#A3E635]" />
                <span className="text-[12px] font-bold text-zinc-900">Small Link</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Screen4 = () => (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      <div className="flex items-center justify-between px-6 h-14 bg-white z-10 sticky top-0 border-b border-[#F3F4F6]">
        <button className="text-black font-medium" onClick={prevScreen}>Cancel</button>
        <h1 className="font-semibold text-[16px]">Edit Profile</h1>
        <button className="text-[#A3E635] font-bold text-[16px]" onClick={nextScreen}>Done</button>
      </div>

      <div className="px-6 pt-6 pb-20 space-y-10 text-left">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[16px]">Deep Link</span>
                <span className="bg-[#A3E635] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
              </div>
              <p className="text-[13px] text-[#6B7280] leading-snug">
                Send Instagram users straight to your chipng.com profile in their native browser.
              </p>
            </div>
            <div className="w-12 h-6 bg-[#E5E7EB] rounded-full relative flex-shrink-0">
               <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm" />
            </div>
          </div>

          <div className="pt-6 border-t border-[#F3F4F6] flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[16px]">Contact Info</span>
              </div>
              <p className="text-[14px] text-[#6B7280]">Add your email or phone number</p>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[#A3E635] font-bold text-[13px]">+5%</span>
               <Plus className="w-5 h-5 text-[#A3E635]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Screen5 = () => (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 pt-6">
        <button onClick={prevScreen} className="mb-4">
          <ChevronLeft className="w-7 h-7 text-black" />
        </button>
        <p className="text-[#6B7280] text-[13px] font-medium mb-1">@{user?.username || 'chipnguser'}</p>
        <h2 className="text-[28px] font-bold mb-8 text-left">Choose Your Style</h2>

        <div className="flex justify-between items-center mb-10">
          {[
            'from-coral-400 to-rose-500',
            'from-lime-400 to-emerald-500',
            'from-violet-400 to-purple-500',
            'from-amber-400 to-orange-500'
          ].map((gradient, idx) => (
            <button 
              key={idx}
              onClick={() => setSelectedTheme(idx)}
              className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} p-0.5 relative transition-transform active:scale-95`}
            >
              <div className="w-full h-full rounded-full border-2 border-white" />
              {selectedTheme === idx && (
                <div className="absolute inset-0 bg-lime-400/80 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-white stroke-[3px]" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center">
              <Search className="w-5 h-5 text-[#9CA3AF]" />
            </div>
            <input 
              type="text" 
              placeholder="Search for Platforms"
              className="w-full h-12 bg-[#F3F4F6] rounded-full pl-12 pr-4 outline-none placeholder-[#9CA3AF] text-[15px]"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {['Social', 'Business', 'Music', 'Payment', 'Entertainment', 'Lifestyle'].map((chip, idx) => (
              <button 
                key={chip}
                className={`px-6 py-2.5 rounded-full text-[14px] font-bold whitespace-nowrap border transition-all ${
                  idx === 0 ? 'bg-[#A3E635] text-white border-[#A3E635]' : 'border-[#E5E7EB] text-[#000000]'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="space-y-4 pb-10">
            <button className="w-full h-14 border-2 border-[#A3E635] text-[#A3E635] rounded-2xl font-bold transition-all active:scale-98">
              + Add Custom Link
            </button>
            <button className="w-full text-center font-bold text-[15px] py-2" onClick={nextScreen}>
              Request a Platform
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const Screen6 = () => (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-6 h-14 border-b border-[#F3F4F6]">
        <h1 className="font-semibold text-[16px]">Instagram Bio Link</h1>
        <button className="p-2" onClick={() => navigate('/dashboard')}>
          <X className="w-6 h-6 text-black" />
        </button>
      </div>

      <div className="flex-1 px-8 pt-10 flex flex-col items-center text-center">
        <div className="w-[72px] h-[72px] rounded-full bg-[#F3F4F6] mb-4 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
           {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#A3E635]/10 flex items-center justify-center">
                 <Heart className="w-8 h-8 text-[#A3E635] fill-current opacity-20" />
              </div>
            )}
        </div>
        <h2 className="text-[20px] font-bold mb-0.5">{signupData.fullName}</h2>
        <p className="text-[#6B7280] text-[14px] font-medium mb-8">@{signupData.username}</p>

        <p className="text-[#6B7280] text-[14px] leading-relaxed mb-10">
          This is your chipng.com bio link! You can copy and paste it into all your social media accounts to help increase your exposure and showcase your chipng.com profile.
        </p>

        <div className="w-full bg-white border border-[#E5E7EB] border-l-[6px] border-l-[#A3E635] rounded-xl flex items-center justify-between p-4 mb-2 shadow-sm">
          <span className="font-bold text-[16px] text-zinc-950">chipng.com/{signupData.username}</span>
          <Copy className="w-5 h-5 text-[#A3E635]" onClick={() => {
            navigator.clipboard.writeText(`chipng.com/${signupData.username}`);
            toast.success('Link copied!');
          }} />
        </div>
        <button className="text-[#A3E635] font-extrabold text-[14px] mb-12">Copy</button>

        <div className="w-full space-y-4">
          <button 
            onClick={handleComplete}
            disabled={saving}
            className="w-full h-14 bg-[#A3E635] text-white rounded-[16px] font-bold text-[16px] shadow-lg shadow-lime-200 transition-all active:scale-98"
          >
            {saving ? 'Finalizing...' : 'VIEW PUBLIC PROFILE'}
          </button>
          <button className="w-full h-14 bg-white border-2 border-[#A3E635] text-[#A3E635] rounded-[16px] font-bold text-[16px] transition-all active:scale-98 flex items-center justify-center gap-3">
            <Share2 className="w-5 h-5" />
            SHARE BIO LINK
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full text-[#6B7280] text-[14px] font-medium py-4 text-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center py-4 px-4 select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full flex justify-center"
        >
          <ScreenWrapper>
            {currentScreen === 1 && <Screen1 />}
            {currentScreen === 2 && <Screen2 />}
            {currentScreen === 3 && <Screen3 />}
            {currentScreen === 4 && <Screen4 />}
            {currentScreen === 5 && <Screen5 />}
            {currentScreen === 6 && <Screen6 />}
          </ScreenWrapper>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingFlow;
