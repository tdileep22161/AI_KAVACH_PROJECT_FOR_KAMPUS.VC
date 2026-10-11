import { useEffect, useState } from 'react';
import {
  AlertTriangle, ShieldCheck, ShieldAlert, Search, Ban,
  Loader2, ChevronRight, X, Trash2, Clock,
} from 'lucide-react';
import { supabase, type Threat, type ThreatLevel, type ThreatStatus } from '@/lib/supabase';

export default function ThreatFeed() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<ThreatLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ThreatStatus | 'all'>('all');
  const [selected, setSelected] = useState<Threat | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadThreats() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from('threats')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setThreats([]);
      setLoadError(true);
    } else {
      setThreats((data as Threat[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadThreats();
  }, []);

  async function updateStatus(threat: Threat, status: ThreatStatus) {
    setStatusUpdating(true);
    setActionError(null);

    const { error } = await supabase.from('threats').update({ status }).eq('id', threat.id);
    if (error) {
      setActionError(error.message);
      setStatusUpdating(false);
      return;
    }

    if (status === 'blocked' && threat.content_value) {
      const { error: blockError } = await supabase.from('blocked_items').insert({
        content_value: threat.content_value,
        content_type: threat.content_type,
        threat_id: threat.id,
      });
      if (blockError) {
        setActionError(blockError.message);
        setStatusUpdating(false);
        return;
      }
    }

    await loadThreats();
    setSelected((prev) => prev && prev.id === threat.id ? { ...threat, status } : prev);
    setStatusUpdating(false);
  }

  async function deleteThreat(threat: Threat) {
    setDeleting(true);
    setActionError(null);

    const { error } = await supabase.from('threats').delete().eq('id', threat.id);
    if (error) {
      setActionError(error.message);
      setDeleting(false);
      return;
    }

    setSelected(null);
    await loadThreats();
    setDeleting(false);
  }

  const filtered = threats.filter((t) => {
    if (search &&
        !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !(t.content_value || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterLevel !== 'all' && t.threat_level !== filterLevel) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const levelIcon = (level: ThreatLevel) => {
    if (level === 'malicious') return <AlertTriangle className="w-5 h-5" />;
    if (level === 'suspicious') return <ShieldAlert className="w-5 h-5" />;
    return <ShieldCheck className="w-5 h-5" />;
  };

  const levelClass = (level: ThreatLevel) =>
    level === 'malicious'
      ? 'bg-red-500/15 text-red-400 border-red-500/20'
      : level === 'suspicious'
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';

  const statusClass = (status: ThreatStatus) =>
    status === 'blocked'
      ? 'bg-red-500/10 text-red-400'
      : status === 'investigating'
      ? 'bg-amber-500/10 text-amber-400'
      : status === 'resolved'
      ? 'bg-emerald-500/10 text-emerald-400'
      : 'bg-slate-700/50 text-slate-400';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Threat Feed</h1>
        <p className="text-slate-400 mt-2">All reported threats with AI analysis results.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search threats..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>

        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value as ThreatLevel | 'all')}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-all cursor-pointer"
        >
          <option value="all">All Levels</option>
          <option value="malicious">Malicious</option>
          <option value="suspicious">Suspicious</option>
          <option value="safe">Safe</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ThreatStatus | 'all')}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-all cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="investigating">Investigating</option>
          <option value="blocked">Blocked</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : loadError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-semibold">Failed to load threats</p>
          <p className="text-slate-500 text-sm mt-2">Please check your connection and try again.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">
            {threats.length === 0 ? 'No threats reported yet. Use the Report Threat page to get started.' : 'No threats match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((threat) => (
            <button
              key={threat.id}
              onClick={() => { setSelected(threat); setActionError(null); }}
              className="w-full flex items-center gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all text-left group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${levelClass(threat.threat_level)}`}>
                {levelIcon(threat.threat_level)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{threat.title}</p>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {threat.content_type} • {threat.source} • {new Date(threat.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <div className={`text-lg font-bold ${
                    threat.risk_score >= 60 ? 'text-red-400' : threat.risk_score >= 25 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {threat.risk_score}
                  </div>
                  <div className="text-xs text-slate-600">risk</div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${statusClass(threat.status)}`}>
                  {threat.status}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !statusUpdating && !deleting && setSelected(null)} />

          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${levelClass(selected.threat_level)}`}>
                  {levelIcon(selected.threat_level)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{selected.title}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {selected.content_type} • {selected.source} • {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                disabled={statusUpdating || deleting}
                className="text-slate-500 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Risk score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Risk Score</span>
                  <span className={`text-2xl font-bold ${
                    selected.risk_score >= 60 ? 'text-red-400' : selected.risk_score >= 25 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {selected.risk_score}/100
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selected.risk_score >= 60
                        ? 'bg-gradient-to-r from-red-500 to-rose-600'
                        : selected.risk_score >= 25
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                        : 'bg-gradient-to-r from-emerald-500 to-green-600'
                    }`}
                    style={{ width: `${selected.risk_score}%` }}
                  />
                </div>
              </div>

              {/* Content value */}
              {selected.content_value && (
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-2">Content</p>
                  <div className="bg-slate-800/50 rounded-xl p-4 break-all text-sm text-slate-300">
                    {selected.content_value}
                  </div>
                </div>
              )}

              {/* Description */}
              {selected.description && (
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-2">Description</p>
                  <p className="text-sm text-slate-400">{selected.description}</p>
                </div>
              )}

              {/* AI Analysis */}
              {selected.ai_analysis && (
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-2">AI Analysis</p>
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {selected.ai_analysis}
                    </pre>
                  </div>
                </div>
              )}

              {actionError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                  {actionError}
                </div>
              )}

              {/* Status actions */}
              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'investigating', 'blocked', 'resolved'] as ThreatStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(selected, status)}
                      disabled={statusUpdating || deleting}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all flex items-center gap-2 disabled:opacity-50 ${
                        selected.status === status
                          ? statusClass(status) + ' border border-current'
                          : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      {status === 'blocked' && <Ban className="w-4 h-4" />}
                      {status === 'pending' && <Clock className="w-4 h-4" />}
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete */}
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => deleteThreat(selected)}
                  disabled={statusUpdating || deleting}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete this threat report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
