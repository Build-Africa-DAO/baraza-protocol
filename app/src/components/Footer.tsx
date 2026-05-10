import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/50 bg-background/80">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-display text-sm font-bold text-primary-foreground">B</span>
              </div>
              <span className="font-display text-lg font-bold text-foreground">Baraza</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering communities to make decisions together, manage funds transparently, and grow stronger.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { to: '/communities', label: 'Browse Communities' },
                { to: '/create', label: 'Start a Group' },
                { to: '/dashboard/1', label: 'Dashboard' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
              Support
            </h4>
            <ul className="space-y-2">
              {['Help Centre', 'Community Guidelines', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
              Get in Touch
            </h4>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">hello@baraza.community</li>
              <li className="text-sm text-muted-foreground">+254 700 123 456</li>
              <li className="text-sm text-muted-foreground">Nairobi, Kenya</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Baraza. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-accent fill-accent" /> for communities everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
