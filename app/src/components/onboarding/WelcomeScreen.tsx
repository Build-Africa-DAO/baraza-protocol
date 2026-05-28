import { CheckCircle, Vote, CreditCard, Award } from 'lucide-react';

interface WelcomeScreenProps {
  phone: string;
  onContinue: () => void;
}

function maskPhone(phone: string): string {
  if (phone.length <= 7) return phone;
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

const VALUE_PROPS = [
  { icon: Vote,       text: 'Vote on group decisions' },
  { icon: CreditCard, text: 'Pay dues via M-Pesa' },
  { icon: Award,      text: 'Earn RAZA for participation' },
] as const;

export default function WelcomeScreen({ phone, onContinue }: WelcomeScreenProps) {
  return (
    <div className="w-full max-w-sm mx-auto text-center">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-green-500/10">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h1 className="font-display text-2xl font-bold">Welcome to Baraza!</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Verified as{' '}
          <span className="font-semibold text-foreground">{maskPhone(phone)}</span>
        </p>
      </div>

      <ul className="mb-8 space-y-3 text-left">
        {VALUE_PROPS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{text}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onContinue}
        className="btn-warm w-full justify-center py-3 text-sm font-bold"
      >
        Explore Communities
      </button>
    </div>
  );
}
