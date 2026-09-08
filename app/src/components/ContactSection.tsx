import { FormEvent, useState } from 'react';
import { Mail, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_E164 } from '@/lib/support';
import { toTitleCase } from '@/lib/utils';

const inputClass =
  'w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/40';
const fieldClass = `h-12 ${inputClass}`;
const labelClass = 'grid gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground';

export default function ContactSection() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get('firstName') ?? '').trim();
    const lastName = String(data.get('lastName') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const body = [
      `Name: ${firstName} ${lastName}`.trim(),
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      '',
      message,
    ]
      .filter((line) => line !== null)
      .join('\n');
    const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Baraza question')}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    setSent(true);
  }

  return (
    <section id="contact" className="relative z-10 scroll-mt-20 bg-background pb-36 pt-8 text-foreground lg:pb-48">
      <div className="page-shell">
        <h2 className="text-center font-display text-3xl font-black leading-tight md:text-5xl">
          Get in <span className="text-primary">Touch</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-7 text-muted-foreground sm:text-base">
          Questions about dues, a vote, or starting a group. Write here or use the details below.
        </p>
        <div className="mx-auto mt-6 flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row sm:gap-8">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary"
          >
            <Mail className="h-4 w-4 shrink-0 text-primary" />
            {SUPPORT_EMAIL}
          </a>
          <a
            href={`tel:${SUPPORT_PHONE_E164}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary"
          >
            <Phone className="h-4 w-4 shrink-0 text-primary" />
            {SUPPORT_PHONE_DISPLAY}
          </a>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card lg:grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <h3 className="font-display text-2xl font-bold text-foreground">{toTitleCase('Send a Message')}</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Tell us the group name if you have one. We reply by email.
            </p>

            {sent ? (
              <p className="mt-8 rounded-xl border border-border bg-surface px-4 py-6 text-sm leading-6 text-foreground">
                Your email app should open with the message filled in. If it does not, write to{' '}
                <a className="font-semibold text-primary underline-offset-4 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            ) : (
              <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    First Name
                    <input className={fieldClass} name="firstName" type="text" autoComplete="given-name" required placeholder="Amina" />
                  </label>
                  <label className={labelClass}>
                    Last Name
                    <input className={fieldClass} name="lastName" type="text" autoComplete="family-name" required placeholder="Otieno" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    Email
                    <input className={fieldClass} name="email" type="email" autoComplete="email" required placeholder="you@email.com" />
                  </label>
                  <label className={labelClass}>
                    Phone Number
                    <input className={fieldClass} name="phone" type="tel" autoComplete="tel" placeholder="+254 7xx xxx xxx" />
                  </label>
                </div>
                <label className={labelClass}>
                  Message
                  <textarea
                    className={`${inputClass} h-32 resize-y py-3`}
                    name="message"
                    required
                    minLength={8}
                    placeholder="How can we help your group?"
                  />
                </label>
                <Button type="submit" size="lg" className="mt-2 h-12 w-full gap-2">
                  Send Message
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>

          <div className="relative min-h-[22rem] lg:min-h-full">
            <img
              src="/contact/group.jpg"
              alt="Four chama members around a table, checking a payment on their phones"
              className="absolute inset-0 h-full w-full object-cover"
              width={1024}
              height={1024}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <h3 className="font-display text-2xl font-bold text-foreground">{toTitleCase('A Person Reads This')}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Replies go to the email you type. If this is about a payout, add the group name.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
