const purposeCopy: Record<string, string> = {
  savings: 'For members who save regularly, support one another, and decide together how shared money is used.',
  sacco: 'For a member savings society, including SACCOs supervised by SASRA where applicable.',
  cooperative: 'For a cooperative society operating under the applicable Cooperative Societies law.',
  ngo: 'For a nonprofit or community organization registered with the relevant NGO authority.',
  alumni: 'For alumni who coordinate contributions, events, welfare, and shared projects.',
  professional: 'For members who share opportunities, welfare support, events, or professional resources.',
};

const commonPurposeValues = new Set(['savings', 'sacco', 'cooperative', 'ngo', 'alumni', 'professional']);

interface CommunityPurposeProps {
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}

export default function CommunityPurpose({ value, onChange, options }: CommunityPurposeProps) {
  const commonOptions = options.filter((option) => commonPurposeValues.has(option.value));
  const otherOptions = options.filter((option) => !commonPurposeValues.has(option.value));
  const selectedOther = otherOptions.some((option) => option.value === value);

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold text-foreground">
        What kind of group is this?
      </legend>
      <div className="grid gap-2 sm:grid-cols-2" aria-label="Common group types">
        {commonOptions.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            aria-pressed={value === type.value}
            className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
              value === type.value
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-background text-foreground hover:border-primary/50'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
      <details className="mt-3 rounded-lg border border-border/70 bg-background" open={selectedOther || undefined}>
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-foreground">
          {selectedOther ? 'Other group type selected' : 'More group types'}
        </summary>
        <div className="border-t border-border/70 p-3">
          <label htmlFor="community-type" className="sr-only">Choose another group type</label>
          <select
            id="community-type"
            value={selectedOther ? value : ''}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="" disabled>Choose another group type</option>
            {otherOptions.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </details>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {value
          ? purposeCopy[value] ?? 'Choose the closest description. You can adjust the group rules before finishing.'
          : 'This gives you sensible starting rules. It does not change what your group is allowed to do.'}
      </p>
    </fieldset>
  );
}
