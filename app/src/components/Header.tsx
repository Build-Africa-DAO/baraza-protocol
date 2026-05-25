import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Moon, PlayCircle, Search, Sparkles, Sun, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import ChainSelector from "@/components/ChainSelector";
import { useAshaChat } from "@/hooks/useAshaChat";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/communities", label: "Explore" },
  { path: "/bounties", label: "Bounties" },
  { path: "/evaluate", label: "Evaluate" },
  { path: "/create", label: "Launch" },
  { path: "/profile", label: "Profile" },
];

const quickSearches = ["DAO", "chama", "SACCO", "co-operative", "governance"];

interface HeaderProps {
  walletSlot?: ReactNode;
}

export default function Header({ walletSlot }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { open: openAsha } = useAshaChat();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const submitSearch = (value = query) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setSearchOpen(false);
      return;
    }
    navigate(`/communities?q=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const openTutorial = () => {
    navigate("/#flow-walkthrough");
    setMobileOpen(false);
    window.setTimeout(() => {
      document.getElementById("flow-walkthrough")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const openAiGuide = () => {
    openAsha("Help me use Baraza for my DAO or chama");
    setMobileOpen(false);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-border/60 bg-background/88 shadow-[0_2px_20px_hsl(84_17%_2%/0.55)] backdrop-blur-xl"
          : "border-border/35 bg-background/82 backdrop-blur-xl",
      )}
    >
      <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link to="/" className="flex shrink-0 items-center" aria-label="Baraza home">
            <BrandLogo size="sm" />
          </Link>

          <nav className="hidden items-center gap-5 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                (link.path !== "/" && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative py-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
                    isActive
                      ? "text-foreground"
                      : "text-foreground/80 hover:text-foreground",
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={openTutorial}
              className="inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            >
              <PlayCircle className="h-4 w-4" />
              Tutorial
            </button>
            <button
              type="button"
              onClick={openAiGuide}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            >
              <Sparkles className="h-4 w-4" />
              AI Guide
            </button>
          </nav>
        </div>

        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            className="hidden items-center gap-2 rounded-md border border-border/70 bg-surface/70 px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 lg:inline-flex"
            aria-expanded={searchOpen}
            aria-controls="header-search-panel"
          >
            <Search className="h-4 w-4" />
            Search
          </button>

          <div className="hidden sm:block">
            <ChainSelector />
          </div>

          {walletSlot && <div className="hidden sm:block">{walletSlot}</div>}

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/70 bg-surface/70 text-muted-foreground transition-colors hover:border-primary/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div
          id="header-search-panel"
          className="absolute right-4 top-[calc(100%+0.5rem)] z-50 hidden w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-border/70 bg-card p-3 shadow-[var(--shadow-deep)] lg:block"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <label className="sr-only" htmlFor="global-search">Search Baraza</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="global-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search communities, SACCOs, M-Pesa..."
                className="w-full rounded-lg border border-border bg-background/70 py-3 pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                autoFocus
              />
            </div>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {quickSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => submitSearch(term)}
                className="rounded-full border border-border/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="animate-fade-in border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4" aria-label="Mobile navigation">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                (link.path !== "/" && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
                    isActive
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground/80 hover:bg-surface hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={openTutorial}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-foreground/80 transition-all hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            >
              <PlayCircle className="h-4 w-4" />
              Video tutorial
            </button>
            <button
              type="button"
              onClick={openAiGuide}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-primary transition-all hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            >
              <Sparkles className="h-4 w-4" />
              Ask Asha AI
            </button>
            <form
              className="relative mt-2"
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch();
              }}
            >
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search communities"
                className="w-full rounded-lg border border-border bg-background/70 py-3 pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary"
                aria-label="Search communities"
              />
            </form>
            <div className="mt-2 flex flex-col gap-2 border-t border-border/50 pt-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-foreground/80 transition-all hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <ChainSelector variant="mobile" />
              {walletSlot}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
