import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/lib/support";
import { toTitleCase, cn } from "@/lib/utils";

const columns = [
  {
    title: toTitleCase("Product"),
    linkColumns: 2,
    links: [
      { label: toTitleCase("Browse Groups"), to: "/communities" },
      { label: toTitleCase("Start a Group"), to: "/create/purpose" },
      { label: toTitleCase("How It Works"), to: "/#how-it-works" },
      { label: toTitleCase("Features"), to: "/#features" },
      { label: toTitleCase("Pricing"), to: "/#pricing" },
      { label: toTitleCase("FAQ"), to: "/#faq" },
      { label: toTitleCase("Contact"), to: "/#contact" },
    ],
  },
  {
    title: toTitleCase("For Groups"),
    links: [
      { label: "Chamas", to: "/create?type=savings" },
      { label: "SACCOs", to: "/create?type=sacco" },
      { label: toTitleCase("Cooperatives"), to: "/create?type=cooperative" },
      { label: toTitleCase("Who It's For"), to: "/#who-its-for" },
    ],
  },
  {
    title: toTitleCase("Company"),
    links: [
      { label: toTitleCase("Evaluate a Group"), to: "/evaluate" },
      { label: toTitleCase("System status"), to: "/status" },
      { label: "GitHub", href: "https://github.com/Build-Africa-DAO/baraza-protocol" },
      { label: toTitleCase("Sign In"), to: "/profile" },
    ],
  },
] as const;

export default function Footer() {
  const [joined, setJoined] = useState(false);

  function handleNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email) return;
    const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Newsletter")}&body=${encodeURIComponent(`Please add this email to the Baraza newsletter.\n\n${email}`)}`;
    window.location.href = href;
    setJoined(true);
  }

  return (
    <footer className="audience-band w-full rounded-t-[2rem] bg-primary text-foreground lg:rounded-t-[2.75rem]">
      <div className="page-shell py-16">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1.5fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex" aria-label="Baraza Protocol home">
              <BrandLogo
                size="md"
                showIcon={false}
                lockup="protocol"
                className="mb-4 [&_span]:text-foreground"
              />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed opacity-85">
              Group money for chamas, SACCOs, and cooperatives. Members pay dues, vote on spending,
              and open the same record. You sign in with a phone number.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider">
                {column.title}
              </h4>
              <ul
                className={cn(
                  "gap-x-8 gap-y-2.5",
                  "linkColumns" in column && column.linkColumns === 2
                    ? "grid grid-cols-2"
                    : "flex flex-col",
                )}
              >
                {column.links.map((link) => (
                  <li key={link.label}>
                    {"href" in link ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm opacity-80 transition-opacity hover:opacity-100"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-sm opacity-80 transition-opacity hover:opacity-100"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center">
          {joined ? (
            <p className="max-w-sm text-sm opacity-85">
              Your email app should open. If it does not, write to {SUPPORT_EMAIL}.
            </p>
          ) : (
            <form
              className="flex w-full max-w-xl flex-wrap items-center gap-x-3 gap-y-2 sm:w-auto"
              onSubmit={handleNewsletter}
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider">
                Join Our Newsletter
              </h4>
              <label className="sr-only" htmlFor="footer-newsletter-email">
                Email
              </label>
              <input
                id="footer-newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@email.com"
                className="h-10 w-44 min-w-0 rounded-full border border-black/15 bg-white px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-500 focus:border-black focus:ring-2 focus:ring-black/20"
              />
              <Button type="submit" size="sm" className="shrink-0">
                Join
              </Button>
            </form>
          )}
          <p className="shrink-0 text-xs opacity-80 sm:ml-auto">
            &copy; {new Date().getFullYear()} Baraza Protocol. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

