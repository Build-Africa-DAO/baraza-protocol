const purposeCopy: Record<string, string> = {
  savings: 'For members who save regularly, support one another, and decide together how shared money is used.',
  sacco: 'For a member savings society, including SACCOs supervised by SASRA where applicable.',
  cooperative: 'For a cooperative society operating under the applicable Cooperative Societies law.',
  ngo: 'For a nonprofit or community organization registered with the relevant NGO authority.',
  alumni: 'For alumni who coordinate contributions, events, welfare, and shared projects.',
  professional: 'For members who share opportunities, welfare support, events, or professional resources.',
};

interface CommunityPurposeProps {
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}

export default function CommunityPurpose({ value, onChange, options }: CommunityPurposeProps) {
  return (
    <div>
      <label htmlFor="community-type" className="mb-2 block text-sm font-semibold text-foreground">
        What kind of group is this?
      </label>
      <select
        id="community-type"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <option value="" disabled>Choose the closest match</option>
        {options.map((type) => (
          <option key={type.value} value={type.value}>{type.label}</option>
        ))}
      </select>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {value
          ? purposeCopy[value] ?? 'Choose the closest description. You can adjust the group rules before finishing.'
          : 'This gives you sensible starting rules. It does not change what your group is allowed to do.'}
      </p>
    </div>
  );
}
