import { Link } from "react-router-dom";
import { Github, Globe, Twitter } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

type FooterLink =
  | { label: string; to: string }
  | { label: string; href: string; external: true }
  | { label: string; soon: true };

const links: Record<string, FooterLink[]> = {
  Product: [
    { label: "Browse Community DAOs", to: "/communities" },
    { label: "Evaluate Best Practice", to: "/evaluate" },
    { label: "Launch a DAO", to: "/create" },
    { label: "How it Works", to: "/#features" },
  ],
};

function FooterLinkItem({ link }: { link: FooterLink }) {
  if ("to" in link) {
    return (
      <Link
        to={link.to}
        className="text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
      >
        {link.label}
      </Link>
    );
  }
  if ("external" in link) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
      >
        {link.label}
      </a>
    );
  }
  return (
    <span
      aria-disabled="true"
      title="Coming soon"
      className="cursor-not-allowed text-sm text-muted-foreground/60"
    >
      {link.label}
      <span className="ml-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/50">
        Soon
      </span>
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <BrandLogo size="md" className="mb-4" />
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A treasury layer for groups that collect dues, vote on proposals,
              and move funds with shared on-chain visibility.
            </p>
            <div className="flex items-center gap-2">
              {[
                { icon: Twitter, label: "Twitter" },
                { icon: Github, label: "GitHub" },
                { icon: Globe, label: "Website" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  aria-label={`${label} (coming soon)`}
                  aria-disabled="true"
                  title="Coming soon"
                  className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-border/40 bg-background/30 text-muted-foreground/50"
                >
                  <Icon className="h-4 w-4" />
                </span>
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
                    <FooterLinkItem link={item} />
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
