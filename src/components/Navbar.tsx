import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, CreditCard, Home, LogOut, User, Menu, X, Mail, HelpCircle, FileText, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { motion, AnimatePresence } from "motion/react";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { profile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    navigate("/");
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" onClick={closeMenu}>
          <Logo />
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 text-sm font-medium transition-colors">
            <Home size={18} />
            Home
          </Link>
          <Link to="/pricing" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 text-sm font-medium transition-colors">
            <CreditCard size={18} />
            Pricing
          </Link>
          <Link to="/contact" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 text-sm font-medium transition-colors">
            <Mail size={18} />
            Contact
          </Link>
          <Link to="/faq" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 text-sm font-medium transition-colors">
            <HelpCircle size={18} />
            FAQ
          </Link>
          <Link to="/blog" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 text-sm font-medium transition-colors">
            <FileText size={18} />
            Blog
          </Link>
          
          {profile ? (
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-full transition-colors group"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                    <img 
                      src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.display_name}&background=random`} 
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white max-w-[100px] truncate">
                    {profile.username}
                  </span>
                  <ChevronDown size={16} className={`text-zinc-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Account</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{profile.display_name}</p>
                      </div>
                      
                      <Link 
                        to="/dashboard" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <LayoutDashboard size={18} />
                        Dashboard
                      </Link>
                      
                      <Link 
                        to={`/p/${profile.username}`} 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <User size={18} />
                        My Page
                      </Link>

                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut size={18} />
                        Log Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/login" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm font-bold transition-colors">
                Log In
              </Link>
              <Link to="/signup" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-full text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-4">
          <ThemeToggle />
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-zinc-900 dark:text-white p-2"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-4">
              <Link to="/" onClick={closeMenu} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-900 dark:text-white font-bold transition-colors">
                <Home size={20} />
                Home
              </Link>
              <Link to="/pricing" onClick={closeMenu} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-900 dark:text-white font-bold transition-colors">
                <CreditCard size={20} />
                Pricing
              </Link>
              <Link to="/contact" onClick={closeMenu} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-900 dark:text-white font-bold transition-colors">
                <Mail size={20} />
                Contact
              </Link>
              <Link to="/faq" onClick={closeMenu} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-900 dark:text-white font-bold transition-colors">
                <HelpCircle size={20} />
                FAQ
              </Link>
              <Link to="/blog" onClick={closeMenu} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-900 dark:text-white font-bold transition-colors">
                <FileText size={20} />
                Blog
              </Link>
              
              {profile ? (
                <>
                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />
                  <Link to="/dashboard" onClick={closeMenu} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-900 dark:text-white font-bold transition-colors">
                    <LayoutDashboard size={20} />
                    Dashboard
                  </Link>
                  <Link to={`/p/${profile.username}`} onClick={closeMenu} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold transition-colors">
                    <User size={20} />
                    My Page
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-3 rounded-xl text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <Link to="/login" onClick={closeMenu} className="w-full text-center py-3 rounded-xl text-zinc-900 dark:text-white font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                    Log In
                  </Link>
                  <Link to="/signup" onClick={closeMenu} className="w-full text-center py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
