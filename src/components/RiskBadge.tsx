type Risk = 'Low' | 'Medium' | 'High';

const config: Record<Risk, { bg: string; text: string; dot: string }> = {
  Low:    { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  Medium: { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  High:   { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'    },
};

export default function RiskBadge({ risk, size = 'sm' }: { risk: Risk; size?: 'sm' | 'md' }) {
  const c = config[risk];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-medium ${c.bg} ${c.text} ${size === 'md' ? 'text-xs' : 'text-xs'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />
      {risk} Risk
    </span>
  );
}
