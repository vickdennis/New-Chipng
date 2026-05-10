import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Smartphone, Zap, Shield } from 'lucide-react';
import Logo from '../components/Logo';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BlogSection from '../components/BlogSection';
import SEO from '../components/SEO';
import NFCBusinessCard from '../components/NFCBusinessCard';
import HowItWorks from '../components/HowItWorks';
import { DISPLAY_DOMAIN } from '../constants';
import { Mail, MessageCircle } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [username, setUsername] = React.useState('');
  const [placeholderIndex, setPlaceholderIndex] = React.useState(0);
  const placeholders = ['yourname', 'yourbrand', 'yourlink', 'yourbusiness'];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white selection:bg-lime-400 selection:text-zinc-950 transition-colors duration-300">
      <SEO 
        title="Chip NG | The Ultimate Link-in-Bio for Creators"
        description="Build your professional digital identity in seconds. Chip NG is the powerful link-in-bio tool for creators, entrepreneurs, and businesses in Nigeria."
      />
      
      <Navbar />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-40 pb-32">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-full text-sm text-zinc-500 dark:text-zinc-400 mb-8"
          >
            <span className="w-2 h-2 bg-lime-500 dark:bg-lime-400 rounded-full animate-pulse" />
            Join 10,000+ creators in Nigeria
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl font-display font-black tracking-tighter mb-8 leading-[0.9] text-zinc-950 dark:text-white"
          >
            Everything you are. <br />
            <span className="text-zinc-400 dark:text-zinc-700">In one simple link.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-zinc-500 font-medium mb-12 max-w-2xl leading-relaxed"
          >
            Chip NG is the powerful link-in-bio tool for creators, entrepreneurs, and businesses. 
            Build your professional identity in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center gap-6 w-full max-w-md"
          >
            <div className="group relative w-full">
              {/* Focus Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
              
              <div className="relative flex items-center w-full h-16 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 transition-all duration-300 group-focus-within:border-lime-500/50 dark:group-focus-within:border-lime-400/50 group-focus-within:bg-white dark:group-focus-within:bg-zinc-900/80 backdrop-blur-sm">
                <span className="text-zinc-500 font-medium select-none whitespace-nowrap text-lg">{DISPLAY_DOMAIN}/</span>
                <div className="relative flex-1 h-full flex items-center ml-1">
                  {!username && (
                    <motion.span
                      key={placeholderIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="absolute text-zinc-400 dark:text-zinc-700 pointer-events-none text-lg"
                    >
                      {placeholders[placeholderIndex]}
                    </motion.span>
                  )}
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-zinc-950 dark:text-white font-bold text-lg"
                  />
                </div>
              </div>
            </div>

            <Link 
              to={`/signup?username=${username}`} 
              className="group relative w-full h-16 bg-lime-400 text-zinc-950 rounded-2xl font-bold flex items-center justify-center gap-2 overflow-hidden transition-all duration-300 hover:bg-lime-300 hover:shadow-[0_0_30px_rgba(163,230,53,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-2 text-lg">
                Claim Link <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Shine effect */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine"></div>
            </Link>
          </motion.div>

          {/* 3D Card Section */}
          <NFCBusinessCard />
        </div>
      </main>

      {/* How it Works - Scroll Animations */}
      <HowItWorks />

      <main className="max-w-7xl mx-auto px-6">
        <div className="mt-40">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-7xl font-display font-black tracking-tighter mb-4 text-zinc-950 dark:text-white leading-none">Powerful from the <br className="hidden md:block" /> ground up.</h2>
            <p className="text-zinc-500 text-lg font-medium">Every feature built with precision for Nigerian creators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-6 h-auto md:h-[750px] mb-20">
             {/* Main Hero Card - Spans 3 cols, 2 rows */}
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               whileHover={{ y: -8, shadow: "0 20px 40px rgba(0,0,0,0.1)" }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
               className="md:col-span-3 md:row-span-2 bg-zinc-950 rounded-[3rem] p-12 flex flex-col justify-between overflow-hidden relative group border border-zinc-800/50 shadow-2xl"
             >
                <div className="relative z-10 h-full flex flex-col gap-6">
                  <div className="w-16 h-16 bg-lime-400 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(163,230,53,0.3)] group-hover:rotate-[10deg] transition-transform duration-500">
                    <Smartphone className="w-8 h-8 text-black" />
                  </div>
                  <div className="flex-1 space-y-6">
                    <h3 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-[0.85]">
                      The Next Gen <br /> 
                      <span className="text-zinc-600">Digital Card.</span>
                    </h3>
                    <p className="text-zinc-400 text-lg max-w-sm leading-relaxed font-medium">
                      Beyond a simple link. It's a high-performance ecosystem for modern creators to share, monetize, and scale globally.
                    </p>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex flex-wrap gap-3">
                      {['NFC Enabled', 'Instant Pay', 'SEO Ready'].map(tag => (
                        <span key={tag} className="px-5 py-2.5 bg-white/5 backdrop-blur-xl rounded-2xl text-[10px] font-black text-zinc-300 border border-white/10 uppercase tracking-[0.2em] shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(163,230,53,0.1),transparent_60%)] pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-lime-400/5 blur-[120px] rounded-full group-hover:bg-lime-400/10 transition-colors duration-700" />
             </motion.div>

             {/* Commerce Studio Card - Spans 3 cols, 1 row */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               whileHover={{ y: -8 }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
               className="md:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[3rem] p-12 flex items-center justify-between overflow-hidden relative group shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]"
             >
                <div className="relative z-10 space-y-4">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                     Live in Nigeria
                   </div>
                   <h3 className="text-3xl font-black text-zinc-950 dark:text-white tracking-tighter leading-none">Commerce Studio</h3>
                   <p className="text-zinc-500 font-medium max-w-[280px] text-sm leading-relaxed italic">"Convert followers into loyal customers with 1-click checkout."</p>
                </div>
                <div className="relative w-32 h-32 flex-shrink-0">
                  <div className="absolute inset-0 bg-lime-400/10 dark:bg-lime-400/5 rounded-[2.5rem] rotate-12 group-hover:rotate-0 transition-transform duration-700 blur-sm" />
                  <div className="w-full h-full bg-white dark:bg-zinc-800 rounded-[2.5rem] flex items-center justify-center border border-zinc-100 dark:border-zinc-700 shadow-xl relative z-10 group-hover:scale-110 transition-transform">
                     <Zap className="w-14 h-14 text-lime-500 fill-lime-500/20" strokeWidth={1.5} />
                  </div>
                </div>
             </motion.div>

             {/* Security Card */}
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               whileHover={{ y: -8 }}
               className="md:col-span-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[3rem] p-10 flex flex-col justify-end gap-4 shadow-sm"
             >
                <div className="w-14 h-14 bg-white dark:bg-zinc-950 rounded-[1.5rem] flex items-center justify-center mb-4 shadow-lg border border-zinc-100 dark:border-zinc-800">
                   <Shield className="w-7 h-7 text-lime-500" />
                </div>
                <div>
                   <h4 className="text-xl font-black tracking-tight text-zinc-950 dark:text-white leading-none mb-2">Vault Security</h4>
                   <p className="text-xs text-zinc-500 font-medium leading-relaxed">Enterprise-grade protection for your brand and data.</p>
                </div>
             </motion.div>

             {/* Speed Card */}
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               whileHover={{ y: -8 }}
               className="md:col-span-1.5 bg-lime-400 rounded-[3rem] p-10 flex flex-col justify-end gap-4 shadow-2xl shadow-lime-400/20"
             >
                <div className="w-14 h-14 bg-zinc-950 rounded-[1.5rem] flex items-center justify-center mb-4 shadow-2xl">
                   <Zap className="w-7 h-7 text-lime-400 fill-lime-400" />
                </div>
                <div>
                   <h4 className="text-xl font-black tracking-tight text-black leading-none mb-2">Vortex Engine</h4>
                   <p className="text-xs text-zinc-950/60 font-black leading-relaxed">Sub-100ms load times globally. Guaranteed.</p>
                </div>
             </motion.div>
          </div>
        </div>

        {/* Traditional Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-40">
          {[
            { icon: Zap, title: "Optimized Performance", desc: "Engineered for speed. Your profile loads in milliseconds, ensuring you never miss a connection." },
            { icon: Smartphone, title: "Adaptive Experience", desc: "A fluid interface that feels native on every screen, from mobile to ultra-wide displays." },
            { icon: Shield, title: "Data Integrity", desc: "Built with military-grade encryption and real-time backups to keep your digital identity safe." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 p-10 rounded-[2.5rem] hover:border-lime-500/30 dark:hover:border-lime-400/30 transition-all duration-500 group"
            >
              <div className="w-14 h-14 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-zinc-100 dark:border-zinc-800 group-hover:scale-110 transition-transform">
                <feature.icon className="text-lime-500 w-7 h-7" />
              </div>
              <h3 className="text-xl font-black tracking-tight mb-4 text-zinc-950 dark:text-white uppercase tracking-wider">{feature.title}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Blog Section */}
      <BlogSection />

      {/* CTA Section */}
      <section className="py-32 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-lime-400 rounded-[3rem] p-12 md:p-32 text-zinc-950 text-center relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(163,230,53,0.3)]">
            <div className="relative z-10">
              <h2 className="text-5xl md:text-8xl font-display font-black tracking-tighter mb-8 leading-[0.8]">
                Ready to claim <br />
                your identity?
              </h2>
              <p className="text-zinc-900 text-xl md:text-2xl mb-12 max-w-xl mx-auto font-bold tracking-tight">
                Join 10,000+ creators and professional businesses scaling with Chip NG.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  to="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-950 text-white px-10 py-6 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-2xl"
                >
                  Get Started for Free
                  <ArrowRight className="w-6 h-6" />
                </Link>
                <Link 
                  to="/pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/40 backdrop-blur-md text-zinc-950 px-10 py-6 rounded-2xl font-black text-lg hover:bg-white/60 transition-all"
                >
                  View Pricing
                </Link>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -ml-48 -mb-48" />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-zinc-50/50 dark:bg-zinc-900/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-12 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group">
            <div className="max-w-md relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-lime-400 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-full mb-6">
                Direct Support
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-none text-zinc-950 dark:text-white">
                Questions? <br />
                <span className="text-zinc-400 dark:text-zinc-600">Built for relationships.</span>
              </h2>
              <p className="text-zinc-500 font-medium mb-10 leading-relaxed">
                Connect with our dedicated support team. We're here to help you build your digital legacy.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-black uppercase tracking-widest">
                    <Mail className="w-4 h-4" /> Email
                  </div>
                  <div className="text-zinc-950 dark:text-white font-bold group-hover:text-lime-500 transition-colors">admin@chipng.com</div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-black uppercase tracking-widest">
                    <MessageCircle className="w-4 h-4" /> Social
                  </div>
                  <div className="text-zinc-950 dark:text-white font-bold">@chipng</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 w-full md:w-auto relative z-10">
              <a 
                href="mailto:admin@chipng.com"
                className="px-10 py-6 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black text-center hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-2xl"
              >
                Start a Conversation <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Response in &lt; 2 hours</p>
              </div>
            </div>

            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_center,rgba(163,230,53,0.03),transparent_70%)] pointer-events-none" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
