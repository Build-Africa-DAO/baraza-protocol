import { useState } from "react";
import { Reveal, REVEAL_STAGGER } from "@/components/landing/motion";
import { toTitleCase } from "@/lib/utils";

const faqs = [
  {
    question: toTitleCase("How Do I Sign In?"),
    answer:
      "Use a phone number or an email. Google works too. You do not need a separate money app to join.",
  },
  {
    question: toTitleCase("How Do Members Pay?"),
    answer:
      "In Kenya, dues go out as an M-Pesa prompt on the member's phone. The join page shows the amount before they pay. If the group charges nothing to join, that step is skipped.",
  },
  {
    question: toTitleCase("What Does It Cost to Start?"),
    answer:
      "The group sets what members pay to join, including nothing. If opening a group has a setup charge, you see that amount on the last step, before you pay.",
  },
  {
    question: toTitleCase("Can a SACCO Use This?"),
    answer:
      "Yes. Dues, votes, and payouts work the same as a chama. Officers add a license in settings. Lending tools stay off until that review is done.",
  },
  {
    question: toTitleCase("Who Can Send Money Out?"),
    answer:
      "Money leaves after a vote passes. An officer sends the payout. Every member can open the receipt on the group page.",
  },
  {
    question: toTitleCase("How Do I Start?"),
    answer:
      "Start a group, set dues, and share the link. If you are joining instead, browse groups that are already collecting and pay with your phone.",
  },
];

export default function FaqSection() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(faqs[0].question);

  return (
    <section className="scroll-mt-20 py-12 lg:py-[3.75rem]" id="faq">
      <div className="page-shell">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Questions
          </p>
        </Reveal>
        <Reveal delay={REVEAL_STAGGER}>
          <h2 className="mx-auto mt-3 text-center font-display text-3xl font-black leading-tight text-foreground md:text-4xl">
            {toTitleCase("Common Questions")}
          </h2>
        </Reveal>
        <div className="mx-auto mt-10 max-w-5xl divide-y divide-border border-t border-border">
          {faqs.map((faq, index) => (
            <Reveal key={faq.question} delay={index * REVEAL_STAGGER}>
            <details
              className="group py-5"
              open={openQuestion === faq.question}
              onToggle={(event) => {
                if (event.currentTarget.open) {
                  setOpenQuestion(faq.question);
                } else if (openQuestion === faq.question) {
                  setOpenQuestion(null);
                }
              }}
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left font-display text-lg font-bold text-foreground">
                {faq.question}
                <span className="mt-1 shrink-0 text-primary transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-base leading-8 text-muted-foreground">{faq.answer}</p>
            </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
