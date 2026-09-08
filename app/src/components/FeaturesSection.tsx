const steps = [
  {
    title: "Collect Dues",
    detail: "Members pay with M-Pesa. The group page shows who has paid this month.",
    image: "/steps/collect-dues.jpg",
    imageFirst: true,
  },
  {
    title: "Vote First",
    detail: "Spending waits for a vote. The treasurer cannot send the money alone.",
    image: "/steps/vote-first.jpg",
    imageFirst: false,
  },
  {
    title: "Send After the Vote",
    detail: "When the vote passes, an officer sends the payout. The receipt stays on the group page.",
    image: "/steps/release-by-rule.jpg",
    imageFirst: true,
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 pt-14 pb-8 lg:pt-16 lg:pb-10">
      <div className="page-shell">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          How a Group Runs
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => {
            const visual = (
              <div className="relative min-h-[18rem] flex-1 overflow-hidden">
                <img
                  src={step.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
              </div>
            );

            return (
              <article
                key={step.title}
                className="group flex min-h-[36rem] flex-col overflow-hidden rounded-xl bg-primary text-left text-primary-foreground transition-colors duration-300 hover:bg-foreground hover:text-background"
              >
                {step.imageFirst && visual}
                <div className="p-6">
                  <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    0{index + 1}. {step.title}
                  </h2>
                  <p className="mt-3 max-w-prose text-sm leading-6 opacity-85 sm:text-base sm:leading-7">{step.detail}</p>
                </div>
                {!step.imageFirst && visual}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
