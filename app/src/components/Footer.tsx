import { Link } from "react-router-dom";
import { Github, Globe, Twitter } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const links = {
  Product: [
    { label: "Browse Communities", to: "/communities" },
    { label: "Start a Group", to: "/create" },
    { label: "Dashboard", to: "/dashboard/1" },
    { label: "Workflow", to: "/#features" },
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
    <footer className="border-t border-border/60 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <BrandLogo size="md" className="mb-4" />
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A product-led treasury layer for groups that collect dues, vote on proposals,
              and move funds with shared visibility.
            </p>
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/40 text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="mb-4 font-display text-[11px] font-semibold uppercase tracking-wider text-foreground">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 sm:flex-row">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Baraza Protocol. All rights reserved.
            </p>
            <div className="hidden h-3 w-px bg-border sm:block" />
            <p className="text-xs text-muted-foreground">Built on Solana</p>
          </div>
          <p className="text-xs text-muted-foreground">Built for communities in Africa</p>
        </div>
      </div>
    </footer>
  );
}
