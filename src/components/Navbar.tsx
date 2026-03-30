import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { motion, AnimatePresence } from 'motion/react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: 'Pricing', path: '/pricing' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-900 py-4' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="sm" className="!flex-row !gap-3" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-all hover:text-zinc-950 dark:hover:text-white ${
                isActive(link.path) ? 'text-lime-500 dark:text-lime-400 font-bold' : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link to="/login" className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors">
            Login
          </Link>
          <ThemeToggle />
          <Link 
            to="/signup"
            className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-6 py-2.5 rounded-full font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all text-sm"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <ThemeToggle />
          <button 
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-lg font-bold transition-all ${
                    isActive(link.path) ? 'text-lime-500 dark:text-lime-400' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-zinc-200 dark:border-zinc-900" />
              <Link 
                to="/login" 
                className="text-lg font-bold text-zinc-500 dark:text-zinc-400"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/signup"
                className="bg-lime-400 text-zinc-950 px-6 py-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                Get Started
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
