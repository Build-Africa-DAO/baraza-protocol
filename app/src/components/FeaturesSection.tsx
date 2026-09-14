import LogoMarquee from "@/components/LogoMarquee";
import { ParallaxPhoto, Reveal, REVEAL_STAGGER } from "@/components/landing/motion";

const steps = [
  {
    title: "Create the Group",
    detail: "Name it, pick the type, and set dues and the voting rule. People see that before they join.",
    image: "/gallery/gallery-plan.jpg",
    imageFirst: true,
  },
  {
    title: "Collect Dues",
    detail: "Members pay with M-Pesa. The group page shows who has paid this month.",
    image: "/steps/collect-dues.jpg",
    imageFirst: false,
  },
  {
    title: "Vote First",
    detail: "Spending waits for a vote. The treasurer cannot send the money alone.",
    image: "/steps/vote-first.jpg",
    imageFirst: true,
  },
  {
    title: "Send After the Vote",
    detail: "When the vote passes, an officer sends the payout. The receipt stays on the group page.",
    image: "/steps/release-by-rule.jpg",
    imageFirst: false,
  },
];

export default function FeaturesSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-12 lg:py-[3.75rem]">
      <div className="page-shell">
        <div className="relative">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:sticky lg:top-16 lg:z-20 lg:bg-background/95 lg:py-3 lg:pointer-events-none">
            How it works
          </p>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => {
              const visual = (
                <ParallaxPhoto
                  src={step.image}
                  alt=""
                  className="relative min-h-[18rem] flex-1"
                  imgClassName="absolute inset-0 h-full w-full object-center"
                />
              );

              return (
                <Reveal key={step.title} delay={index * REVEAL_STAGGER} className="h-full">
                  <article className="group flex h-full min-h-[36rem] flex-col overflow-hidden rounded-xl bg-primary text-left text-primary-foreground transition-colors duration-300 hover:bg-foreground hover:text-background">
                    {step.imageFirst && visual}
                    <div className="p-6">
                      <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                        0{index + 1}. {step.title}
                      </h2>
                      <p className="mt-3 max-w-prose text-sm leading-6 opacity-85 sm:text-base sm:leading-7">{step.detail}</p>
                    </div>
                    {!step.imageFirst && visual}
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>

        <Reveal>
          <LogoMarquee />
        </Reveal>
      </div>
    </section>
  );
}
