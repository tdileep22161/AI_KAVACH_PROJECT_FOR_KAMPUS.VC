import { useEffect, useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Clock, Ban, TrendingUp,
  ArrowUpRight, AlertTriangle,
} from 'lucide-react';
import { supabase, type Threat } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function Dashboard() {
  const { profile } = useAuth();
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    supabase
      .from('threats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) {
          setLoadError(true);
        } else {
          setThreats((data as Threat[]) ?? []);
        }
        setLoading(false);
      });
  }, []);

  const malicious = threats.filter((t) => t.threat_level === 'malicious').length;
  const suspicious = threats.filter((t) => t.threat_level === 'suspicious').length;
  const blocked = threats.filter((t) => t.status === 'blocked').length;
  const pending = threats.filter((t) => t.status === 'pending').length;
  const recent = threats.slice(0, 5);

  const stats = [
    {
      label: 'Total Threats',
      value: threats.length,
      icon: ShieldAlert,
      color: 'from-sky-500 to-blue-600',
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
    },
    {
      label: 'Malicious',
      value: malicious,
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-600',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
    },
    {
      label: 'Blocked',
      value: blocked,
      icon: Ban,
      color: 'from-orange-500 to-amber-600',
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
    },
    {
      label: 'Pending Review',
      value: pending,
      icon: Clock,
      color: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 font-semibold">Failed to load threat data</p>
        <p className="text-slate-500 text-sm mt-2">Please check your connection and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back{profile?.company_name ? `, ${profile.company_name}` : ''}
        </h1>
        <p className="text-slate-400 mt-2">Here's your threat intelligence overview.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${stat.text}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk distribution + Recent threats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Risk Distribution</h2>
          <div className="space-y-5">
            {[
              { label: 'Malicious', count: malicious, color: 'bg-red-500', text: 'text-red-400' },
              { label: 'Suspicious', count: suspicious, color: 'bg-amber-500', text: 'text-amber-400' },
              { label: 'Safe', count: threats.length - malicious - suspicious, color: 'bg-emerald-500', text: 'text-emerald-400' },
            ].map((item) => {
              const pct = threats.length > 0 ? (item.count / threats.length) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <span className={`text-sm font-semibold ${item.text}`}>{item.count}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {threats.length === 0 && (
            <p className="text-slate-500 text-sm text-center mt-4">No threats reported yet.</p>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-slate-300">Protection Status</span>
              </div>
              <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                Active <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            </div>
          </div>
        </div>

        {/* Recent threats */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Threats</h2>
            {threats.length > 0 && (
              <span className="text-sm text-sky-400 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Live feed
              </span>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-12">
              <ShieldAlert className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No threats reported yet. Use the Report Threat page to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((threat) => (
                <div
                  key={threat.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-800"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    threat.threat_level === 'malicious'
                      ? 'bg-red-500/15 text-red-400'
                      : threat.threat_level === 'suspicious'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    {threat.threat_level === 'malicious' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : threat.threat_level === 'suspicious' ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{threat.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {threat.content_type} • {threat.source} • {new Date(threat.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        threat.risk_score >= 60 ? 'text-red-400' : threat.risk_score >= 25 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {threat.risk_score}
                      </div>
                      <div className="text-xs text-slate-600">risk</div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      threat.status === 'blocked'
                        ? 'bg-red-500/10 text-red-400'
                        : threat.status === 'investigating'
                        ? 'bg-amber-500/10 text-amber-400'
                        : threat.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {threat.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
