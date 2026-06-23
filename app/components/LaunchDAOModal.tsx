"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 text-[10px] font-bold flex items-center justify-center transition-colors"
        aria-label="More info"
      >
        ?
      </button>
      {show && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-6 w-64 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 leading-relaxed shadow-xl z-50 pointer-events-none">
          {text}
          <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}

const GOV_MODELS = [
  { id: "token", label: "Badge vote", desc: "Members vote with their membership badges" },
  { id: "multisig", label: "Council approval", desc: "A fixed set of council members approve decisions" },
  { id: "simple", label: "Simple majority", desc: "One member, one vote — majority wins" },
];

const STEPS = ["Basics", "Decisions", "Shared fund", "Review"];

export default function LaunchDAOModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    govModel: "simple",
    threshold: 60,
    quorum: 30,
    votingPeriod: 7,
    fundNew: true,
    fundAddress: "",
    fundCurrency: "USDC",
  });
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function next() { setStep((s) => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }
  function submit() { setSubmitted(true); }

  if (submitted) {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center py-8 px-6">
          <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-3xl mx-auto mb-5">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Group created!</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
            <strong>{form.name}</strong> is live on Stellar. Share it with your community.
          </p>
          <button
            onClick={onClose}
            className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
              i < step ? "bg-green-500 text-white" :
              i === step ? "bg-orange-500 text-white" :
              "bg-gray-100 text-gray-400"
            }`}>
              {i < step ? "✓" : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 transition-colors ${i < step ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-5">Step {step + 1} of {STEPS.length} — <span className="text-gray-700 font-medium">{STEPS[step]}</span></p>

      {/* Step 0: Basics */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-900">Tell us about your group</h2>
          <Field label="Group name" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Kibera Youth Collective"
              className="input"
            />
          </Field>
          <Field label="One-line description">
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="What does your group do?"
              className="input"
            />
          </Field>
        </div>
      )}

      {/* Step 1: Decisions */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <h2 className="text-lg font-bold text-gray-900">How decisions are made</h2>
          <p className="text-sm text-gray-500 -mt-3">How will your group make decisions?</p>

          <div className="flex flex-col gap-2">
            {GOV_MODELS.map((m) => (
              <label
                key={m.id}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  form.govModel === m.id
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="govModel"
                  value={m.id}
                  checked={form.govModel === m.id}
                  onChange={() => set("govModel", m.id)}
                  className="mt-0.5 accent-orange-500"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <Field
            label={
              <span className="flex items-center">
                Approval threshold
                <Tooltip text="The minimum share of votes that must say 'Yes' for a decision to pass. At 60%, at least 6 out of every 10 voters need to approve before anything happens with the group's shared fund or rules." />
              </span>
            }
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={50} max={90} step={5}
                value={form.threshold}
                onChange={(e) => set("threshold", Number(e.target.value))}
                className="flex-1 accent-orange-500"
              />
              <span className="text-sm font-bold text-gray-900 w-12 text-right">{form.threshold}%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {form.threshold <= 51 ? "Simple majority — fast but less protection against bad decisions."
                : form.threshold <= 66 ? "Supermajority — a good balance of speed and security."
                : "High consensus — harder to pass anything, but very secure."}
            </p>
          </Field>

          <Field
            label={
              <span className="flex items-center">
                Quorum
                <Tooltip text="The minimum number of members who must vote before the result counts at all. This stops a tiny group from passing decisions when most members aren't paying attention. Example: with 20% quorum and 100 members, at least 20 people need to vote." />
              </span>
            }
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10} max={60} step={5}
                value={form.quorum}
                onChange={(e) => set("quorum", Number(e.target.value))}
                className="flex-1 accent-orange-500"
              />
              <span className="text-sm font-bold text-gray-900 w-12 text-right">{form.quorum}%</span>
            </div>
          </Field>

          <Field
            label={
              <span className="flex items-center">
                Voting period
                <Tooltip text="How many days a decision stays open for members to vote. Too short and members miss it — too long and decisions are slow. 5–7 days works well for most groups." />
              </span>
            }
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1} max={30}
                value={form.votingPeriod}
                onChange={(e) => set("votingPeriod", Number(e.target.value))}
                className="input w-24"
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
          </Field>
        </div>
      )}

      {/* Step 2: Shared fund */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1">
              Shared fund setup
              <Tooltip text="The shared fund belongs entirely to your community — not to Baraza. Every member can see the balance and transaction history. No single person can move funds alone; your community's own votes decide every spend." />
            </h2>
            <p className="text-sm text-gray-500 mt-1">Your community holds its own fund. Baraza does not hold, manage, or access it.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${form.fundNew ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
              <input
                type="radio"
                checked={form.fundNew}
                onChange={() => set("fundNew", true)}
                className="mt-0.5 accent-orange-500"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">Create a new shared fund</p>
                <p className="text-xs text-gray-500 mt-0.5">A member-controlled account on Stellar. Members control it together by vote — no single person holds the keys. Baraza has no access.</p>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${!form.fundNew ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
              <input
                type="radio"
                checked={!form.fundNew}
                onChange={() => set("fundNew", false)}
                className="mt-0.5 accent-orange-500"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">Connect an existing account</p>
                <p className="text-xs text-gray-500 mt-0.5">Already have a member-controlled account? Paste its address below.</p>
              </div>
            </label>
          </div>

          {!form.fundNew && (
            <Field label="Account address">
              <input
                type="text"
                value={form.fundAddress}
                onChange={(e) => set("fundAddress", e.target.value)}
                placeholder="Stellar address"
                className="input font-mono text-sm"
              />
            </Field>
          )}

          <Field
            label={
              <span className="flex items-center">
                Primary currency
                <Tooltip text="The currency your group will mainly use for contributions and payouts. USDC is a stablecoin — its value stays close to 1 US Dollar, making it easier to budget and plan." />
              </span>
            }
          >
            <select value={form.fundCurrency} onChange={(e) => set("fundCurrency", e.target.value)} className="input">
              <option>USDC</option>
              <option>USDT</option>
              <option>XLM</option>
            </select>
          </Field>

          {/* Shared fund explainer card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-amber-900 mb-1">How the shared fund works</p>
            <ul className="text-amber-800 text-xs space-y-1 leading-relaxed list-none">
              <li>→ Members save into the community&apos;s own account — not Baraza&apos;s</li>
              <li>→ Anyone can raise how to spend or move funds</li>
              <li>→ Spending only happens after a vote passes</li>
              <li>→ Every transaction is visible to all members</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-900">Review your group</h2>
          <div className="bg-gray-50 rounded-2xl divide-y divide-gray-200 border border-gray-200 text-sm">
            <Row label="Name" value={form.name || "—"} />
            <Row label="Network" value="Stellar" />
            <Row label="Decision model" value={GOV_MODELS.find((m) => m.id === form.govModel)?.label ?? "—"} />
            <Row label="Threshold" value={`${form.threshold}% approval`} />
            <Row label="Quorum" value={`${form.quorum}% must vote`} />
            <Row label="Voting period" value={`${form.votingPeriod} days`} />
            <Row label="Shared fund" value={form.fundNew ? "New member-controlled account" : form.fundAddress || "—"} />
            <Row label="Currency" value={form.fundCurrency} />
          </div>
          <p className="text-xs text-gray-400">By launching you agree that your community&apos;s fund is held and controlled by its members — not by Baraza. Transaction fees apply on Stellar.</p>
        </div>
      )}

      {/* Footer buttons */}
      <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
        <button
          type="button"
          onClick={step === 0 ? onClose : back}
          className="text-sm text-gray-500 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {step === 0 ? "Cancel" : "← Back"}
        </button>
        <button
          type="button"
          onClick={step === STEPS.length - 1 ? submit : next}
          disabled={step === 0 && !form.name.trim()}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2 rounded-xl transition-colors"
        >
          {step === STEPS.length - 1 ? "Start group" : "Continue →"}
        </button>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700 flex items-center">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
