interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, trend, trendValue, accent }: StatCardProps) {
  return (
    <div className={`rounded border p-4 ${accent ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white border-[#E5E7EB]'}`}>
      <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${accent ? 'text-blue-200' : 'text-[#6B7280]'}`}>{label}</p>
      <p className={`text-2xl font-semibold leading-none mb-1 ${accent ? 'text-white' : 'text-[#111827]'}`}>{value}</p>
      {(sub || trendValue) && (
        <div className="flex items-center gap-2 mt-1.5">
          {trendValue && (
            <span className={`text-xs font-medium ${
              trend === 'up' ? 'text-green-600' :
              trend === 'down' ? 'text-red-500' :
              accent ? 'text-blue-200' : 'text-[#6B7280]'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendValue}
            </span>
          )}
          {sub && <span className={`text-xs ${accent ? 'text-blue-200' : 'text-[#9CA3AF]'}`}>{sub}</span>}
        </div>
      )}
    </div>
  );
}
