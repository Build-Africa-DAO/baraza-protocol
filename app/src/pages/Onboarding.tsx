import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getPhoneAuthSession, savePhoneSession } from '@/lib/phoneAuth';
import { sendSms } from '@/lib/notifications/sms';
import PhoneEntry from '@/components/onboarding/PhoneEntry';
import OtpVerify from '@/components/onboarding/OtpVerify';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';

type OnboardingStep = 'phone' | 'otp' | 'welcome';

function generateOtp(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

const stepVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -16 },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    const session = getPhoneAuthSession();
    if (session.phone) {
      navigate('/communities', { replace: true });
    }
  }, [navigate]);

  async function handlePhoneSubmit(e164: string) {
    const code = generateOtp();
    setOtpCode(code);
    setPhone(e164);

    try {
      await sendSms({ to: e164, message: `Your Baraza code: ${code}` });
    } catch {
      // SMS disabled in dev — user can still complete flow with the dev bypass
    }

    setStep('otp');
  }

  async function handleResend() {
    const code = generateOtp();
    setOtpCode(code);

    try {
      await sendSms({ to: phone, message: `Your Baraza code: ${code}` });
    } catch {
      // no-op in dev
    }
  }

  function handleVerified() {
    savePhoneSession(phone);
    setStep('welcome');
  }

  function handleContinue() {
    navigate('/communities');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-primary/5 px-4 py-12">
      <AnimatePresence mode="wait">
        {step === 'phone' && (
          <motion.div
            key="phone"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full"
          >
            <PhoneEntry onSubmit={handlePhoneSubmit} />
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div
            key="otp"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full"
          >
            <OtpVerify
              phone={phone}
              expectedCode={otpCode}
              onVerified={handleVerified}
              onBack={() => setStep('phone')}
              onResend={() => void handleResend()}
            />
          </motion.div>
        )}

        {step === 'welcome' && (
          <motion.div
            key="welcome"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full"
          >
            <WelcomeScreen phone={phone} onContinue={handleContinue} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
