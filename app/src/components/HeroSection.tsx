import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The hero is the largest paint on the landing page, so nothing here waits on
 * the motion chunk: the copy renders in its final state and the polaroid
 * gallery, which carries framer-motion, streams in behind a same-size skeleton.
 */
const PolaroidGallery = lazy(() => import("@/components/PolaroidGallery"));

const GALLERY_SLOTS = 5;

function GallerySkeleton() {
  return (
    <div className="mt-14 overflow-x-auto pb-6 sm:mt-16 sm:overflow-visible" aria-hidden>
      <ul className="mx-auto flex w-max items-end justify-center px-6 sm:w-full sm:px-0">
        {Array.from({ length: GALLERY_SLOTS }, (_, index) => (
          <li
            key={index}
            className="relative w-[11.5rem] shrink-0 sm:w-[20%] sm:max-w-[17rem] lg:max-w-[18.5rem]"
            style={{ marginLeft: index === 0 ? 0 : "-1.75rem" }}
          >
            <div className="bg-white p-[0.5rem] shadow-[0_14px_32px_hsl(0_0%_0%/0.18)] dark:shadow-[0_18px_40px_hsl(0_0%_0%/0.6)] sm:p-[0.6rem]">
              <div className="aspect-square w-full bg-muted" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section id="home" className="relative overflow-x-clip scroll-mt-20 bg-background pt-10 pb-12 sm:pt-16 lg:pt-20 lg:pb-[3.75rem]">
      <div className="page-shell">
        <div className="mx-auto max-w-3xl text-center xl:max-w-5xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
            For chamas, SACCOs, and cooperatives
          </p>
          <h1 className="font-display text-[clamp(2.4rem,5.2vw,5.25rem)] font-black leading-[0.94] tracking-tight text-primary">
            Run the Chama Where Every Member Can See the Money.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Put the monthly collection on a page the whole group can open.
            Members sign in with a phone number.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="[--btn-cover:hsl(var(--foreground))] [--btn-fill:hsl(var(--primary))] [--btn-ink:hsl(var(--foreground))] [--btn-ink-hover:hsl(var(--background))]"
            >
              <Link to="/create">
                Start a Group
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/groups">Browse Groups</Link>
            </Button>
          </div>
        </div>

        <Suspense fallback={<GallerySkeleton />}>
          <PolaroidGallery />
        </Suspense>
      </div>
    </section>
  );
}
