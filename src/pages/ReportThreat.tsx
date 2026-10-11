import { useState, type FormEvent } from 'react';
import {
  FileWarning, Loader2, Sparkles, AlertTriangle, ShieldCheck,
  ShieldAlert, CheckCircle2, Link2, MessageSquare, Mail,
  FileText, Send,
} from 'lucide-react';
import { supabase, type ContentType, type ThreatSource } from '@/lib/supabase';
import { analyzeThreat } from '@/lib/threatAnalysis';
import { useAuth } from '@/context/AuthContext';

const contentTypes: { value: ContentType; label: string; icon: typeof Link2 }[] = [
  { value: 'link', label: 'Link / URL', icon: Link2 },
  { value: 'message', label: 'Message', icon: MessageSquare },
  { value: 'poster', label: 'Poster / Image', icon: FileText },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'other', label: 'Other', icon: FileWarning },
];

const sources: ThreatSource[] = ['email', 'social', 'web', 'sms', 'other'];

export default function ReportThreat() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<ContentType>('link');
  const [contentValue, setContentValue] = useState('');
  const [source, setSource] = useState<ThreatSource>('email');
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    risk_score: number;
    threat_level: string;
    analysis: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAnalyze() {
    if (!contentValue.trim()) return;
    setAnalyzing(true);
    setAnalysisResult(null);

    setTimeout(() => {
      const result = analyzeThreat(contentValue, contentType, description);
      setAnalysisResult(result);
      setAnalyzing(false);
    }, 1200);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !analysisResult) return;

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('threats').insert({
      title,
      content_type: contentType,
      content_value: contentValue,
      threat_level: analysisResult.threat_level,
      status: 'pending',
      source,
      description,
      ai_analysis: analysisResult.analysis,
      risk_score: analysisResult.risk_score,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    if (analysisResult.threat_level === 'malicious') {
      const { error: blockError } = await supabase.from('blocked_items').insert({
        content_value: contentValue,
        content_type: contentType,
      });
      if (blockError) {
        setError(blockError.message);
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    setSuccess(true);

    setTimeout(() => {
      setTitle('');
      setContentValue('');
      setDescription('');
      setAnalysisResult(null);
      setSuccess(false);
    }, 2500);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Report a Threat</h1>
        <p className="text-slate-400 mt-2">
          Submit suspicious content for AI-powered analysis. Our engine scans for phishing patterns, malicious URLs, and fraudulent indicators.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-center gap-3 animate-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-400 font-semibold">Threat report submitted successfully</p>
            <p className="text-emerald-400/70 text-sm">The content has been analyzed and added to your threat feed.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content type selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <label className="block text-sm font-medium text-slate-300 mb-4">Content Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {contentTypes.map((ct) => {
              const Icon = ct.icon;
              const active = contentType === ct.value;
              return (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setContentType(ct.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    active
                      ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{ct.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form fields */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Threat Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fake PayPal login page targeting customers"
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {contentType === 'link' ? 'URL / Link' : contentType === 'message' || contentType === 'email' ? 'Content Text' : 'Content Description'}
            </label>
            <textarea
              required
              value={contentValue}
              onChange={(e) => setContentValue(e.target.value)}
              placeholder={
                contentType === 'link'
                  ? 'https://suspicious-site.com/login'
                  : 'Paste the suspicious content here...'
              }
              rows={3}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Source Channel</label>
            <div className="flex flex-wrap gap-2">
              {sources.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    source === s
                      ? 'bg-sky-500/15 border border-sky-500/40 text-sky-400'
                      : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Additional Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any context about where this was found, who reported it, etc."
              rows={2}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all resize-none"
            />
          </div>

          {/* AI Analysis button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!contentValue.trim() || analyzing}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl py-3 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Analyzing with AI KAVASH...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Run AI Analysis
              </>
            )}
          </button>
        </div>

        {/* Analysis result */}
        {analysisResult && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-in">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                analysisResult.threat_level === 'malicious'
                  ? 'bg-red-500/15 text-red-400'
                  : analysisResult.threat_level === 'suspicious'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {analysisResult.threat_level === 'malicious' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : analysisResult.threat_level === 'suspicious' ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">AI Analysis Complete</h3>
                <p className={`text-sm font-medium capitalize ${
                  analysisResult.threat_level === 'malicious'
                    ? 'text-red-400'
                    : analysisResult.threat_level === 'suspicious'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {analysisResult.threat_level} • Risk Score: {analysisResult.risk_score}/100
                </p>
              </div>
            </div>

            {/* Risk score bar */}
            <div className="mb-5">
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    analysisResult.risk_score >= 60
                      ? 'bg-gradient-to-r from-red-500 to-rose-600'
                      : analysisResult.risk_score >= 25
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                      : 'bg-gradient-to-r from-emerald-500 to-green-600'
                  }`}
                  style={{ width: `${analysisResult.risk_score}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {analysisResult.analysis}
              </pre>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!analysisResult || submitting}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl py-4 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" /> Submit Threat Report
            </>
          )}
        </button>
      </form>
    </div>
  );
}
