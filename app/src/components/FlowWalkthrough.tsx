import { toTitleCase } from "@/lib/utils";

const services = [
  {
    title: toTitleCase("Create the Group"),
    detail:
      "Name it, pick the type, and set dues and the voting rule. People see that before they join.",
  },
  {
    title: toTitleCase("Join and Pay"),
    detail:
      "Share a link. Members sign in with a phone number and pay the dues, or join free if you charge nothing.",
  },
  {
    title: toTitleCase("Vote on Spending"),
    detail:
      "Someone asks to spend. Members vote. You see if enough people took part before any payout.",
  },
  {
    title: toTitleCase("Send After the Vote"),
    detail:
      "If the vote passes, an officer sends the money. The receipt shows up for everyone on the group page.",
  },
];

function stepLabel(index: number) {
  return String(index + 1).padStart(2, "0");
}

function StepCopy({
  index,
  title,
  detail,
}: {
  index: number;
  title: string;
  detail: string;
}) {
  return (
    <article className="text-center">
      <p className="font-display text-3xl font-black leading-none text-primary">{stepLabel(index)}</p>
      <h3 className="mt-3 font-display text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{detail}</p>
    </article>
  );
}

function Stem() {
  return <div className="h-14 w-px bg-primary" aria-hidden="true" />;
}

function Node() {
  return (
    <span
      className="relative z-10 block h-3 w-3 rounded-full bg-primary ring-4 ring-background"
      aria-hidden="true"
    />
  );
}

export default function FlowWalkthrough() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-border py-20">
      <div className="page-shell">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Features
        </p>
        <h2 className="mx-auto mt-3 max-w-3xl text-center font-display text-3xl font-black leading-tight text-foreground md:text-4xl">
          {toTitleCase("From a New Group to the First Payout")}
        </h2>

        {/* Desktop: horizontal spine, odd steps up, even steps down */}
        <div className="mt-16 hidden lg:block">
          <div className="grid grid-cols-4 items-end">
            {services.map((service, index) => (
              <div key={`${service.title}-top`} className="flex flex-col items-center px-4">
                {index % 2 === 0 ? (
                  <>
                    <StepCopy index={index} title={service.title} detail={service.detail} />
                    <div className="mt-6">
                      <Stem />
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>

          <div className="relative flex h-3 items-center">
            <div className="absolute left-[12.5%] right-[12.5%] top-1/2 h-px -translate-y-1/2 bg-primary" />
            <div className="grid w-full grid-cols-4">
              {services.map((service) => (
                <div key={`${service.title}-node`} className="flex justify-center">
                  <Node />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start">
            {services.map((service, index) => (
              <div key={`${service.title}-bottom`} className="flex flex-col items-center px-4">
                {index % 2 === 1 ? (
                  <>
                    <div className="mb-6">
                      <Stem />
                    </div>
                    <StepCopy index={index} title={service.title} detail={service.detail} />
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile / tablet: vertical spine, odd steps left, even steps right */}
        <ol className="relative mt-14 lg:hidden">
          <div className="absolute bottom-2 left-1/2 top-2 w-px -translate-x-1/2 bg-primary" aria-hidden="true" />
          {services.map((service, index) => {
            const above = index % 2 === 0;
            return (
              <li key={service.title} className="relative grid grid-cols-2 items-start py-6 first:pt-0">
                <div className={`px-2 ${above ? "col-start-1 text-center" : "col-start-2 text-center"}`}>
                  <p className="font-display text-3xl font-black leading-none text-primary">
                    {stepLabel(index)}
                  </p>
                  <h3 className="mt-3 font-display text-lg font-bold text-foreground">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.detail}</p>
                </div>
                <span
                  className={`absolute top-8 h-px w-6 bg-primary ${above ? "right-1/2" : "left-1/2"}`}
                  aria-hidden="true"
                />
                <span
                  className="absolute left-1/2 top-7 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background"
                  aria-hidden="true"
                />
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
