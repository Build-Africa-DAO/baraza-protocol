import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Reveal, REVEAL_STAGGER } from "@/components/landing/motion";
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

function stepWindow(index: number) {
  const start = 0.06 + index * 0.2;
  return { start, end: start + 0.22 };
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

function PaintedStem({
  progress,
  index,
  from,
  reduce,
}: {
  progress: MotionValue<number>;
  index: number;
  from: "spine" | "copy";
  reduce: boolean | null;
}) {
  const { start, end } = stepWindow(index);
  const scaleY = useTransform(progress, [start, end], [0, 1]);

  return (
    <motion.div
      aria-hidden="true"
      className={from === "spine" ? "h-14 w-px origin-top bg-primary" : "h-14 w-px origin-bottom bg-primary"}
      style={reduce ? undefined : { scaleY }}
    />
  );
}

function PaintedNode({
  progress,
  index,
  reduce,
}: {
  progress: MotionValue<number>;
  index: number;
  reduce: boolean | null;
}) {
  const { start } = stepWindow(index);
  const scale = useTransform(progress, [start, start + 0.12], [0, 1]);

  return (
    <motion.span
      className="relative z-10 block h-3 w-3 rounded-full bg-primary ring-4 ring-background"
      aria-hidden="true"
      style={reduce ? undefined : { scale }}
    />
  );
}

function DesktopStep({
  service,
  index,
  progress,
  reduce,
  side,
}: {
  service: (typeof services)[number];
  index: number;
  progress: MotionValue<number>;
  reduce: boolean | null;
  side: "top" | "bottom";
}) {
  const { start, end } = stepWindow(index);
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [index % 2 === 0 ? -28 : 28, 0]);
  const style = reduce ? undefined : { opacity, y };
  const above = side === "top";

  return (
    <motion.div className="flex flex-col items-center px-4" style={style}>
      {above ? (
        <>
          <StepCopy index={index} title={service.title} detail={service.detail} />
          <div className="mt-6">
            <PaintedStem progress={progress} index={index} from="copy" reduce={reduce} />
          </div>
        </>
      ) : (
        <>
          <div className="mb-6">
            <PaintedStem progress={progress} index={index} from="spine" reduce={reduce} />
          </div>
          <StepCopy index={index} title={service.title} detail={service.detail} />
        </>
      )}
    </motion.div>
  );
}

function MobileStep({
  service,
  index,
  progress,
  reduce,
}: {
  service: (typeof services)[number];
  index: number;
  progress: MotionValue<number>;
  reduce: boolean | null;
}) {
  const above = index % 2 === 0;
  const { start, end } = stepWindow(index);
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [above ? -24 : 28, 0]);
  const tickScale = useTransform(progress, [start, end], [0, 1]);
  const nodeScale = useTransform(progress, [start, start + 0.12], [0, 1]);

  return (
    <li className="relative grid grid-cols-2 items-start py-6 first:pt-0">
      <motion.div
        className={`px-2 ${above ? "col-start-1 text-center" : "col-start-2 text-center"}`}
        style={reduce ? undefined : { opacity, y }}
      >
        <p className="font-display text-3xl font-black leading-none text-primary">
          {stepLabel(index)}
        </p>
        <h3 className="mt-3 font-display text-lg font-bold text-foreground">{service.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.detail}</p>
      </motion.div>
      <motion.span
        className={`absolute top-8 h-px w-6 bg-primary ${above ? "right-1/2 origin-right" : "left-1/2 origin-left"}`}
        aria-hidden="true"
        style={reduce ? undefined : { scaleX: tickScale }}
      />
      <motion.span
        className="absolute left-1/2 top-7 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background"
        aria-hidden="true"
        style={reduce ? undefined : { scale: nodeScale }}
      />
    </li>
  );
}

export default function FlowWalkthrough() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.72", "end 0.48"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 0.62], [0, 1]);

  return (
    <section ref={ref} id="features" className="scroll-mt-20 py-12 lg:py-[3.75rem]">
      <div className="page-shell">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Features
          </p>
        </Reveal>
        <Reveal delay={REVEAL_STAGGER}>
          <h2 className="mx-auto mt-3 max-w-3xl text-center font-display text-3xl font-black leading-tight text-foreground md:text-4xl">
            {toTitleCase("From a New Group to the First Payout")}
          </h2>
        </Reveal>

        <div className="mt-16 hidden lg:block">
          <div className="grid grid-cols-4 items-end">
            {services.map((service, index) => (
              <div key={`${service.title}-top`}>
                {index % 2 === 0 ? (
                  <DesktopStep
                    service={service}
                    index={index}
                    progress={scrollYProgress}
                    reduce={reduce}
                    side="top"
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="relative flex h-3 items-center">
            <div
              className="absolute left-[12.5%] right-[12.5%] top-1/2 h-px -translate-y-1/2 bg-primary/25"
              aria-hidden="true"
            />
            <motion.div
              className="absolute left-[12.5%] right-[12.5%] top-1/2 h-px origin-left -translate-y-1/2 bg-primary"
              aria-hidden="true"
              style={reduce ? undefined : { scaleX: lineScale }}
            />
            <div className="grid w-full grid-cols-4">
              {services.map((service, index) => (
                <div key={`${service.title}-node`} className="flex justify-center">
                  <PaintedNode progress={scrollYProgress} index={index} reduce={reduce} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start">
            {services.map((service, index) => (
              <div key={`${service.title}-bottom`}>
                {index % 2 === 1 ? (
                  <DesktopStep
                    service={service}
                    index={index}
                    progress={scrollYProgress}
                    reduce={reduce}
                    side="bottom"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <ol className="relative mt-14 lg:hidden">
          <div
            className="absolute bottom-2 left-1/2 top-2 w-px -translate-x-1/2 bg-primary/25"
            aria-hidden="true"
          />
          <motion.div
            className="absolute bottom-2 left-1/2 top-2 w-px origin-top -translate-x-1/2 bg-primary"
            aria-hidden="true"
            style={reduce ? undefined : { scaleY: lineScale }}
          />
          {services.map((service, index) => (
            <MobileStep
              key={service.title}
              service={service}
              index={index}
              progress={scrollYProgress}
              reduce={reduce}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
