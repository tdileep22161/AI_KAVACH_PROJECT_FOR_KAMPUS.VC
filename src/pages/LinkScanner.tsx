import { useState } from 'react';
import {
  ScanSearch, Loader2, AlertTriangle, ShieldCheck, ShieldAlert,
  Link2, Sparkles, CheckCircle2, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { analyzeThreat } from '@/lib/threatAnalysis';

interface ScanResult {
  url: string;
  risk_score: number;
  threat_level: 'safe' | 'suspicious' | 'malicious';
  analysis: string;
  is_fake: boolean;
}

export default function LinkScanner() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleScan() {
    if (!url.trim()) return;
    setScanning(true);
    setResult(null);
    setError(null);
    setSaved(false);

    setTimeout(() => {
      const analysis = analyzeThreat(url, 'link', '');
      const isFake = analysis.risk_score >= 60;

      setResult({
        url,
        risk_score: analysis.risk_score,
        threat_level: analysis.threat_level,
        analysis: analysis.analysis,
        is_fake: isFake,
      });
      setScanning(false);
    }, 1500);
  }

  async function handleSaveAndBlock() {
    if (!result) return;
    setError(null);

    const { error: insertError } = await supabase.from('threats').insert({
      title: `Scanned URL: ${result.url.substring(0, 60)}`,
      content_type: 'link',
      content_value: result.url,
      threat_level: result.threat_level,
      status: result.is_fake ? 'blocked' : 'pending',
      source: 'web',
      description: 'Detected via Link Scanner',
      ai_analysis: result.analysis,
      risk_score: result.risk_score,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (result.is_fake) {
      const { error: blockError } = await supabase.from('blocked_items').insert({
        content_value: result.url,
        content_type: 'link',
      });
      if (blockError) {
        setError(blockError.message);
        return;
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleClear() {
    setUrl('');
    setResult(null);
    setError(null);
    setSaved(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Link Scanner</h1>
        <p className="text-slate-400 mt-2">
          Paste any link below. AI KAVASH will instantly analyze it and tell you if it's fake or real.
        </p>
      </div>

      {/* Scanner input */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="relative">
          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder="https://suspicious-link.com or any URL..."
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleScan}
            disabled={!url.trim() || scanning}
            className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl py-3.5 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {scanning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Scanning...
              </>
            ) : (
              <>
                <ScanSearch className="w-5 h-5" /> Scan Link
              </>
            )}
          </button>
          {result && (
            <button
              onClick={handleClear}
              className="px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all flex items-center gap-2"
            >
              <X className="w-5 h-5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Scanning animation */}
      {scanning && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 mb-4">
            <ScanSearch className="w-8 h-8 text-sky-400 animate-pulse" />
          </div>
          <p className="text-white font-semibold text-lg">AI KAVASH is analyzing this link...</p>
          <p className="text-slate-500 text-sm mt-2">Checking for phishing patterns, suspicious domains, and malicious indicators</p>
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-sky-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && !scanning && (
        <div className="space-y-5 animate-in">
          {/* Verdict banner */}
          <div className={`rounded-2xl p-8 border-2 ${
            result.is_fake
              ? 'bg-red-500/10 border-red-500/30'
              : result.threat_level === 'suspicious'
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                result.is_fake
                  ? 'bg-red-500/20 text-red-400'
                  : result.threat_level === 'suspicious'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {result.is_fake ? (
                  <AlertTriangle className="w-9 h-9" />
                ) : result.threat_level === 'suspicious' ? (
                  <ShieldAlert className="w-9 h-9" />
                ) : (
                  <ShieldCheck className="w-9 h-9" />
                )}
              </div>

              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${
                  result.is_fake
                    ? 'text-red-400'
                    : result.threat_level === 'suspicious'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {result.is_fake ? 'FAKE — Malicious Link Detected' : result.threat_level === 'suspicious' ? 'SUSPICIOUS — Use Caution' : 'REAL — Link Appears Safe'}
                </h2>
                <p className="text-slate-400 text-sm mt-1 break-all">{result.url}</p>
              </div>

              <div className="text-center flex-shrink-0">
                <div className={`text-4xl font-bold ${
                  result.risk_score >= 60 ? 'text-red-400' : result.risk_score >= 25 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {result.risk_score}
                </div>
                <div className="text-xs text-slate-500">Risk Score</div>
              </div>
            </div>

            {/* Risk bar */}
            <div className="mt-6">
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    result.risk_score >= 60
                      ? 'bg-gradient-to-r from-red-500 to-rose-600'
                      : result.risk_score >= 25
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                      : 'bg-gradient-to-r from-emerald-500 to-green-600'
                  }`}
                  style={{ width: `${result.risk_score}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-600 mt-2">
                <span>Safe (0)</span>
                <span>Suspicious (25)</span>
                <span>Malicious (60+)</span>
              </div>
            </div>
          </div>

          {/* AI Analysis details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-semibold text-white">AI Analysis Report</h3>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {result.analysis}
              </pre>
            </div>
          </div>

          {/* Actions */}
          {saved && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {result.is_fake
                ? 'Threat saved and link added to blocklist successfully.'
                : 'Scan result saved to threat feed successfully.'}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleSaveAndBlock}
            disabled={saved}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl py-3.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {result.is_fake ? (
              <>
                <ShieldAlert className="w-5 h-5 text-red-400" /> Save & Add to Blocklist
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Save Scan Result
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!result && !scanning && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <ScanSearch className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">Paste a link above and click Scan to check if it's fake or real.</p>
        </div>
      )}
    </div>
  );
}
