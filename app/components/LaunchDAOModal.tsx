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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Kikundi kimeundwa!</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
            <strong>{form.name}</strong> iko tayari. Shiriki na jamii yako.
          </p>
          <button
            onClick={onClose}
            className="min-h-[44px] bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Imekamilika
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
      <p className="text-xs text-gray-400 mb-5">Hatua {step + 1} kati ya {STEPS.length} — <span className="text-gray-700 font-medium">{STEPS[step]}</span></p>

      {/* Step 0: Basics */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-900">Tuambie kuhusu kikundi chako</h2>
          <Field label="Jina la kikundi" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="mf. Kibera Youth Collective"
              className="input"
            />
          </Field>
          <Field label="Maelezo mafupi">
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="Kikundi chako kinafanya nini?"
              className="input"
            />
          </Field>
        </div>
      )}

      {/* Step 1: Decisions */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <h2 className="text-lg font-bold text-gray-900">Jinsi maamuzi yanavyofanywa</h2>
          <p className="text-sm text-gray-500 -mt-3">Kikundi chako kitafanya maamuzi vipi?</p>

          <div className="flex flex-col gap-2">
            {GOV_MODELS.map((m) => (
              <label
                key={m.id}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors min-h-[44px] ${
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
                Kiwango cha idhini
                <Tooltip text="Sehemu ndogo ya kura ambazo lazima ziseme 'Ndiyo' kwa uamuzi kupita. Kwa 60%, angalau kura 6 kati ya 10 zinahitajika." />
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
              {form.threshold <= 51 ? "Wingi rahisi — haraka lakini hatari kidogo."
                : form.threshold <= 66 ? "Wingi mkubwa — usawa mzuri wa kasi na usalama."
                : "Makubaliano ya juu — vigumu zaidi kupita chochote, lakini salama sana."}
            </p>
          </Field>

          <Field
            label={
              <span className="flex items-center">
                Quorum
                <Tooltip text="Idadi ndogo ya wanachama ambao lazima wapige kura kabla matokeo hayajahesabiwa. Hii inazuia kundi dogo kupitisha maamuzi wanachama wengi hawashiriki." />
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
                Muda wa kupiga kura
                <Tooltip text="Idadi ya siku uamuzi unabaki wazi kwa wanachama kupiga kura. Siku 5–7 zinafanya kazi vizuri kwa vikundi vingi." />
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
              <span className="text-sm text-gray-500">siku</span>
            </div>
          </Field>
        </div>
      )}

      {/* Step 2: Shared fund */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1">
              Usanidi wa mfuko wa pamoja
              <Tooltip text="Mfuko wa pamoja ni wa jamii yako peke yake — si wa Baraza. Kila mwanachama anaweza kuona salio na historia ya miamala. Hakuna mtu mmoja anayeweza kusogeza fedha peke yake; kura za jamii yako zinaamu kila matumizi." />
            </h2>
            <p className="text-sm text-gray-500 mt-1">Jamii yako inashikilia mfuko wake. Baraza haishikili, haisimamii, wala hana ufikiaji wake.</p>
          </div>

          {/*
            Goal 5 (UX pass): We no longer ask the user to paste a wallet
            address. That pattern is crypto-native and unsuitable for the
            target user. Connecting an existing member-controlled account is
            a follow-up infra task (full passkey/multisig kit integration).
            For now we confirm the user wants a new member-controlled fund.
          */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-semibold text-amber-900 mb-1 text-sm">Mfuko mpya wa wanachama</p>
            <p className="text-amber-800 text-xs leading-relaxed">
              Tutaunda akaunti inayomilikiwa na wanachama wote. Hakuna mtu mmoja anayeshikilia ufunguo — wote wanakubaliana kwa kura ndipo fedha zinasogea.
            </p>
          </div>

          {/* KES as the single display currency — no crypto amounts shown */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-gray-800 mb-1">Sarafu: KSh (shilingi ya Kenya)</p>
            <p className="text-gray-500 text-xs">Michango yote na malipo yataonyeshwa kwa KSh.</p>
          </div>

          {/* Shared fund explainer card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-amber-900 mb-1">Jinsi mfuko wa pamoja unavyofanya kazi</p>
            <ul className="text-amber-800 text-xs space-y-1 leading-relaxed list-none">
              <li>→ Wanachama wanaokoa kwenye akaunti ya jamii — si ya Baraza</li>
              <li>→ Yeyote anaweza kupendekeza jinsi ya kutumia au kusogeza fedha</li>
              <li>→ Matumizi yanafanyika tu baada ya kura kupita</li>
              <li>→ Kila muamala unaonekana kwa wanachama wote</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-900">Kagua kikundi chako</h2>
          <div className="bg-gray-50 rounded-2xl divide-y divide-gray-200 border border-gray-200 text-sm">
            <Row label="Jina" value={form.name || "—"} />
            <Row label="Mtandao" value="Stellar" />
            <Row label="Mfumo wa maamuzi" value={GOV_MODELS.find((m) => m.id === form.govModel)?.label ?? "—"} />
            <Row label="Kiwango cha idhini" value={`${form.threshold}% ya kura`} />
            <Row label="Quorum" value={`${form.quorum}% lazima wapige kura`} />
            <Row label="Muda wa kupiga kura" value={`siku ${form.votingPeriod}`} />
            <Row label="Mfuko wa pamoja" value="Akaunti mpya inayomilikiwa na wanachama" />
            <Row label="Sarafu" value="KSh" />
          </div>
          <p className="text-xs text-gray-400">Kwa kuanzisha unakubali kwamba mfuko wa jamii yako unashikiliwa na kudhibitiwa na wanachama wake — si na Baraza. Ada za muamala zinatumika kwenye Stellar.</p>
        </div>
      )}

      {/* Footer buttons */}
      <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
        <button
          type="button"
          onClick={step === 0 ? onClose : back}
          className="min-h-[44px] text-sm text-gray-500 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {step === 0 ? "Ghairi" : "← Nyuma"}
        </button>
        <button
          type="button"
          onClick={step === STEPS.length - 1 ? submit : next}
          disabled={step === 0 && !form.name.trim()}
          className="min-h-[44px] bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2 rounded-xl transition-colors"
        >
          {step === STEPS.length - 1 ? "Anza kikundi" : "Endelea →"}
        </button>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
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
