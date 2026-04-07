import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { name: 'Features', path: '/#features' },
        { name: 'Pricing', path: '/pricing' },
        { name: 'Blog', path: '/blog' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', path: '/#about' },
        { name: 'Contact', path: '/#contact' },
        { name: 'Privacy', path: '/privacy' },
      ],
    },
    {
      title: 'Social',
      links: [
        { name: 'X (Twitter)', path: 'https://x.com/chipng_app' },
        { name: 'Instagram', path: 'https://instagram.com/Chipng_app' },
        { name: 'TikTok', path: 'https://tiktok.com/@chipng_app' },
        { name: 'WhatsApp', path: 'https://wa.me/2348100764154' },
      ],
    },
  ];

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 pt-20 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="lg:col-span-1">
            <Logo size="sm" className="!flex-row !gap-3 mb-6" />
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
              Chip NG is the powerful link-in-bio tool for creators, entrepreneurs, and businesses. 
              Build your professional page in seconds.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-zinc-950 dark:text-white font-bold mb-6 text-sm uppercase tracking-widest">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {link.path.startsWith('http') ? (
                      <a 
                        href={link.path} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors text-sm font-medium"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link 
                        to={link.path}
                        className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors text-sm font-medium"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-zinc-600 text-xs font-medium">
            © {currentYear} Chip NG. All rights reserved. Built for the next generation of creators.
          </p>
          <div className="flex items-center gap-8">
            <Link to="/privacy" className="text-zinc-600 hover:text-zinc-950 dark:hover:text-white transition-colors text-xs font-medium">Privacy Policy</Link>
            <Link to="/terms" className="text-zinc-600 hover:text-zinc-950 dark:hover:text-white transition-colors text-xs font-medium">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
