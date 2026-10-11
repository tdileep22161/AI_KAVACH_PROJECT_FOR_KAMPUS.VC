import { useEffect, useState } from 'react';
import { BarChart3, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase, type Threat } from '@/lib/supabase';

export default function Analytics() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('threats')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setThreats((data as Threat[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  // Threats by type
  const byType = threats.reduce((acc, t) => {
    acc[t.content_type] = (acc[t.content_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const maxType = Math.max(...typeEntries.map((e) => e[1]), 1);

  // Threats by source
  const bySource = threats.reduce((acc, t) => {
    acc[t.source] = (acc[t.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sourceEntries = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(...sourceEntries.map((e) => e[1]), 1);

  // Threats by status
  const byStatus = threats.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Last 7 days trend
  const last7Days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    const count = threats.filter((t) => new Date(t.created_at).toDateString() === dateStr).length;
    last7Days.push({ label: date.toLocaleDateString('en', { weekday: 'short' }), count });
  }
  const maxDay = Math.max(...last7Days.map((d) => d.count), 1);

  // Average risk score
  const avgRisk = threats.length > 0
    ? Math.round(threats.reduce((sum, t) => sum + t.risk_score, 0) / threats.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 mt-2">Threat intelligence insights and trends.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: threats.length, icon: BarChart3, color: 'text-sky-400 bg-sky-500/10' },
          { label: 'Avg Risk Score', value: avgRisk, icon: TrendingUp, color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Malicious', value: threats.filter((t) => t.threat_level === 'malicious').length, icon: AlertTriangle, color: 'text-red-400 bg-red-500/10' },
          { label: 'Blocked', value: byStatus['blocked'] || 0, icon: AlertTriangle, color: 'text-orange-400 bg-orange-500/10' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* 7-day trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Threats — Last 7 Days</h2>
        <div className="flex items-end justify-between gap-2 sm:gap-4 h-48">
          {last7Days.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full bg-gradient-to-t from-sky-600 to-sky-400 rounded-lg transition-all duration-700 hover:from-sky-500 hover:to-sky-300 relative group"
                  style={{ height: `${(day.count / maxDay) * 100}%`, minHeight: '4px' }}
                >
                  {day.count > 0 && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.count}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-500">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By content type */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">By Content Type</h2>
          {typeEntries.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No data yet.</p>
          ) : (
            <div className="space-y-4">
              {typeEntries.map(([type, count]) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300 capitalize">{type}</span>
                    <span className="text-sm font-semibold text-white">{count}</span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${(count / maxType) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By source */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">By Source Channel</h2>
          {sourceEntries.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No data yet.</p>
          ) : (
            <div className="space-y-4">
              {sourceEntries.map(([source, count]) => (
                <div key={source}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300 capitalize">{source}</span>
                    <span className="text-sm font-semibold text-white">{count}</span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-700"
                      style={{ width: `${(count / maxSource) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Status Distribution</h2>
        {threats.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No data yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(['pending', 'investigating', 'blocked', 'resolved'] as const).map((status) => {
              const count = byStatus[status] || 0;
              const pct = threats.length > 0 ? (count / threats.length) * 100 : 0;
              return (
                <div key={status} className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgb(30,41,59)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke={
                          status === 'blocked' ? 'rgb(239,68,68)' :
                          status === 'investigating' ? 'rgb(245,158,11)' :
                          status === 'resolved' ? 'rgb(16,185,129)' :
                          'rgb(100,116,139)'
                        }
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(pct / 100) * 251.2} 251.2`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">{count}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 capitalize">{status}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
