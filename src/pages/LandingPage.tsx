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
import { DISPLAY_DOMAIN } from '../constants';

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
            className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.9]"
          >
            Everything you are. <br />
            <span className="text-zinc-400 dark:text-zinc-500">In one simple link.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-2xl"
          >
            Chip NG is the powerful link-in-bio tool for creators, entrepreneurs, and businesses. 
            Build your professional page in seconds.
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

        {/* Bento Grid Features */}
        <div className="mt-40">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">Powerful from the ground up.</h2>
            <p className="text-zinc-500 text-lg">Every feature built with precision for Nigerian creators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[800px]">
             {/* Big Feature 1 */}
             <motion.div 
               whileHover={{ y: -5 }}
               className="md:col-span-2 md:row-span-2 bg-zinc-900 rounded-[3rem] p-12 flex flex-col justify-between overflow-hidden relative group"
             >
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-lime-400 rounded-2xl flex items-center justify-center mb-8">
                    <Smartphone className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-4xl font-black text-white mb-4 tracking-tight leading-none">The Digital <br /> Business Card.</h3>
                  <p className="text-zinc-400 text-lg max-w-xs">Share your entire world with a single tap. The only card you'll ever need.</p>
                </div>
                
                {/* Visual element */}
                <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                   <div className="absolute top-1/2 left-1/2 -translate-y-1/4 w-[400px] h-[600px] bg-lime-400 blur-[100px] rounded-full" />
                </div>

                <div className="relative z-10 mt-12">
                   <div className="flex gap-4">
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10 uppercase tracking-widest">NFC Ready</div>
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10 uppercase tracking-widest">QR Integrated</div>
                   </div>
                </div>
             </motion.div>

             {/* Small Feature 1 */}
             <motion.div 
               whileHover={{ y: -5 }}
               className="md:col-span-2 bg-lime-400 rounded-[3rem] p-10 flex items-center justify-between overflow-hidden relative group"
             >
                <div className="relative z-10">
                   <h3 className="text-3xl font-black text-black tracking-tight mb-2">Shop Manager</h3>
                   <p className="text-black/60 font-medium max-w-[200px]">Sell anything, anywhere. Integrated payments ready.</p>
                </div>
                <div className="w-32 h-32 bg-black/10 rounded-[2rem] flex items-center justify-center rotate-12 -mr-4 group-hover:rotate-0 transition-transform">
                   <Zap className="w-16 h-16 text-black" />
                </div>
             </motion.div>

             {/* Small Feature 2 */}
             <motion.div 
               whileHover={{ y: -5 }}
               className="bg-zinc-100 dark:bg-zinc-900 rounded-[3rem] p-8 flex flex-col justify-center border border-zinc-200 dark:border-zinc-800"
             >
                <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                   <Shield className="w-6 h-6 text-lime-500" />
                </div>
                <h4 className="text-xl font-bold mb-2">Secure Payouts</h4>
                <p className="text-sm text-zinc-500">Your earnings are protected and paid out on time, every time.</p>
             </motion.div>

             {/* Small Feature 3 */}
             <motion.div 
               whileHover={{ y: -5 }}
               className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 flex flex-col justify-center shadow-2xl shadow-zinc-200/50 dark:shadow-none"
             >
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                   <ArrowRight className="w-6 h-6 text-zinc-400" />
                </div>
                <h4 className="text-xl font-bold mb-2">Cloud Synced</h4>
                <p className="text-sm text-zinc-500">Update your links once, it reflects everywhere instantly.</p>
             </motion.div>
          </div>
        </div>

        {/* Traditional Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-40">
          {[
            { icon: Zap, title: "Lightning Fast", desc: "Optimized for speed. Your profile loads in milliseconds." },
            { icon: Smartphone, title: "Mobile First", desc: "Designed to look stunning on every device." },
            { icon: Shield, title: "Secure & Reliable", desc: "Built on enterprise-grade infrastructure." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
            >
              <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
                <feature.icon className="text-lime-600 dark:text-lime-400 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Blog Section */}
      <BlogSection />

      {/* CTA Section */}
      <section className="py-32 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-lime-400 rounded-[3rem] p-12 md:p-24 text-zinc-950 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-7xl font-bold tracking-tighter mb-8 leading-none">
                Ready to claim your <br />
                digital identity?
              </h2>
              <p className="text-zinc-900 text-xl mb-12 max-w-xl mx-auto font-medium">
                Join thousands of creators and businesses who use Chip NG to share their world.
              </p>
              <Link 
                to="/signup"
                className="inline-flex items-center gap-2 bg-zinc-950 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-2xl shadow-zinc-950/20"
              >
                Get Started for Free
                <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl -ml-32 -mb-32" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
