import { Link } from "react-router-dom";
import { Heart, Github, Twitter, Globe } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const links = {
  Product: [
    { label: "Browse Communities", to: "/communities" },
    { label: "Start a Group", to: "/create" },
    { label: "Dashboard", to: "/dashboard/1" },
    { label: "Features", to: "/#features" },
  ],
  Support: [
    { label: "Help Centre", to: "#" },
    { label: "Community Guidelines", to: "#" },
    { label: "Privacy Policy", to: "#" },
    { label: "Terms of Service", to: "#" },
  ],
  Developers: [
    { label: "Smart Contracts", to: "#" },
    { label: "API Docs", to: "#" },
    { label: "GitHub", to: "#" },
    { label: "Changelog", to: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <BrandLogo size="md" className="mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-5">
              Empowering African communities to manage funds, make decisions, and grow stronger —
              transparently, on-chain.
            </p>
            {/* Social */}
            <div className="flex items-center gap-2">
              {[
                { icon: Twitter, label: "Twitter" },
                { icon: Github, label: "GitHub" },
                { icon: Globe, label: "Website" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-surface border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="font-display text-[11px] font-semibold text-foreground uppercase tracking-wider mb-4">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Baraza Protocol. All rights reserved.
            </p>
            <div className="hidden sm:block w-px h-3 bg-border" />
            <p className="text-xs text-muted-foreground">Built on Solana</p>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-accent fill-accent" /> for communities in Africa
          </p>
        </div>
      </div>
    </footer>
  );
}
