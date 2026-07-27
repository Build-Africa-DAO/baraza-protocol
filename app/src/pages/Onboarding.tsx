import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import OnboardingFooterActions from '@/components/onboarding/OnboardingFooterActions';
import OnboardingQuestionBlock from '@/components/onboarding/OnboardingQuestionBlock';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import PurposeOptionGrid from '@/components/onboarding/PurposeOptionGrid';
import { getPhoneAuthSession, savePhoneSession } from '@/lib/phoneAuth';
import { sendSms } from '@/lib/notifications/sms';
import PhoneEntry from '@/components/onboarding/PhoneEntry';
import OtpVerify from '@/components/onboarding/OtpVerify';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import {
  PURPOSE_OPTIONS,
  type CommunityPurpose,
} from '@/components/onboarding/purposeOptions';

type OnboardingStep = 'purpose' | 'phone' | 'otp' | 'welcome';

const STEP_PROGRESS: Record<OnboardingStep, number> = {
  purpose: 25,
  phone: 50,
  otp: 75,
  welcome: 100,
};

function generateOtp(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

const stepVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>('purpose');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [selectedPurposes, setSelectedPurposes] = useState<CommunityPurpose[]>([]);

  const canContinue = selectedPurposes.length > 0;

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
      // SMS disabled in dev - user can still complete flow with the dev bypass
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
    navigate('/create', {
      state: {
        onboarding: {
          selectedPurposes,
        },
      },
    });
  }

  function handleSkip() {
    // TODO(product): Confirm the non-onboarding destination for members who skip community setup.
    navigate('/communities');
  }

  function handlePurposeToggle(value: CommunityPurpose) {
    setSelectedPurposes((current) =>
      current.includes(value)
        ? current.filter((purpose) => purpose !== value)
        : [...current, value]
    );
  }

  function handlePurposeBack() {
    navigate(-1);
  }

  function handlePurposeContinue() {
    if (!canContinue) return;
    setStep('phone');
  }

  return (
    <OnboardingShell
      progressValue={STEP_PROGRESS[step]}
      onSkip={handleSkip}
      showSkip={step !== 'welcome'}
      footer={
        step === 'purpose' ? (
          <OnboardingFooterActions
            note="You can select multiple options that apply to your circle."
            onBack={handlePurposeBack}
            onContinue={handlePurposeContinue}
            canContinue={canContinue}
          />
        ) : undefined
      }
    >
      <div className="flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          {step === 'purpose' && (
            <motion.section
              key="purpose"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full pb-28 md:pb-20"
            >
              <OnboardingQuestionBlock
                title="What does your group do together?"
                description="Tell us about your community's focus so we can tailor your setup experience."
              />
              <PurposeOptionGrid
                options={PURPOSE_OPTIONS}
                selectedPurposes={selectedPurposes}
                onToggle={handlePurposeToggle}
              />
            </motion.section>
          )}

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
              <WelcomeScreen
                phone={phone}
                onContinue={handleContinue}
                ctaLabel="Set up your community"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </OnboardingShell>
  );
}
