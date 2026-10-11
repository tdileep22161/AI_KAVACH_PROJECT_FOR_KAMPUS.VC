import { useEffect, useRef, useState } from 'react';
import {
  Shield, Activity, AlertTriangle, Ban, Radar, ChevronDown,
  ChevronUp, Clock, X, TrendingDown, ScanLine,
} from 'lucide-react';
import { supabase, type Threat } from '@/lib/supabase';
import { analyzeThreat } from '@/lib/threatAnalysis';

export interface ScanActivity {
  id: string;
  timestamp: Date;
  target: string;
  status: 'scanning' | 'safe' | 'blocked';
  riskScore: number;
  threatLevel: 'safe' | 'suspicious' | 'malicious';
}

interface BackgroundScannerProps {
  onActivity?: (activity: ScanActivity) => void;
}

const SIMULATED_TARGETS = [
  'https://paypal-verify-account.tk/login',
  'https://amazon-secure-update.xyz/confirm',
  'https://bank-of-america-login.ml/verify',
  'https://google-accounts-recover.click/reset',
  'https://netflix-billing-update.cf/account',
  'https://microsoft-office365-secure.top/signin',
  'https://apple-id-verify-account.gq/login',
  'https://coinbase-wallet-secure.xyz/confirm',
  'https://fedex-package-tracking-verify.ml',
  'https://walmart-gift-card-claim.click/redeem',
  'https://linkedin-secure-login-verify.tk',
  'https://stripe-payment-verify-account.xyz',
  'https://usps-package-delay-notice.cf',
  'https://dropbox-file-share-secure.ga/login',
  'https://zoom-meeting-invite-secure.top',
  'https://dhl-shipping-redirect-verify.ml/track',
  'https://irs-tax-refund-claim-2026.click/submit',
  'https://crypto-wallet-recovery-secure.xyz/auth',
];

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default function BackgroundScanner({ onActivity }: BackgroundScannerProps) {
  const [isRunning, setIsRunning] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [safeCount, setSafeCount] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<ScanActivity | null>(null);
  const [recentActivity, setRecentActivity] = useState<ScanActivity[]>([]);
  const [blockPulse, setBlockPulse] = useState(false);
  const scanIndexRef = useRef(Math.floor(Math.random() * SIMULATED_TARGETS.length));
  const onActivityRef = useRef(onActivity);
  const startTimeRef = useRef(Date.now());
  onActivityRef.current = onActivity;

  // Uptime ticker — runs regardless of minimized/expanded state
  useEffect(() => {
    const timer = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Core scanning loop — runs in background even when minimized
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      const target = SIMULATED_TARGETS[scanIndexRef.current % SIMULATED_TARGETS.length];
      scanIndexRef.current++;

      const scanId = crypto.randomUUID();
      const activity: ScanActivity = {
        id: scanId,
        timestamp: new Date(),
        target,
        status: 'scanning',
        riskScore: 0,
        threatLevel: 'safe',
      };

      setCurrentActivity(activity);

      await new Promise((resolve) => setTimeout(resolve, 800));

      const analysis = analyzeThreat(target, 'link', '');
      const isMalicious = analysis.risk_score >= 60;
      const isSuspicious = analysis.risk_score >= 25 && analysis.risk_score < 60;

      const finalActivity: ScanActivity = {
        ...activity,
        status: isMalicious ? 'blocked' : 'safe',
        riskScore: analysis.risk_score,
        threatLevel: analysis.threat_level,
      };

      setCurrentActivity(finalActivity);
      setScannedCount((prev) => prev + 1);
      setRecentActivity((prev) => [finalActivity, ...prev].slice(0, 12));

      if (isMalicious) {
        setBlockedCount((prev) => prev + 1);
        setBlockPulse(true);
        setTimeout(() => setBlockPulse(false), 600);

        const { data } = await supabase.from('threats').insert({
          title: `Auto-Blocked: ${target.substring(0, 50)}`,
          content_type: 'link',
          content_value: target,
          threat_level: 'malicious',
          status: 'blocked',
          source: 'web',
          description: 'Automatically detected and blocked by AI KAVASH background scanner.',
          ai_analysis: analysis.analysis,
          risk_score: analysis.risk_score,
        }).select();

        if (data && data.length > 0) {
          const threat = data[0] as Threat;
          await supabase.from('blocked_items').insert({
            content_value: target,
            content_type: 'link',
            threat_id: threat.id,
          });
        }
      } else if (isSuspicious) {
        setSuspiciousCount((prev) => prev + 1);
      } else {
        setSafeCount((prev) => prev + 1);
      }

      onActivityRef.current?.(finalActivity);
    }, 5000);

    return () => clearInterval(interval);
  }, [isRunning]);

  function toggleScanner() {
    setIsRunning(!isRunning);
  }

  function toggleMinimize() {
    setIsMinimized(!isMinimized);
  }

  // Minimized floating badge — scanner keeps running in background
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={toggleMinimize}
          className="group relative flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-2xl pl-3 pr-4 py-3 shadow-2xl shadow-sky-500/20 hover:border-sky-500/50 transition-all"
        >
          <div className="relative">
            <Radar
              className={`w-6 h-6 ${isRunning ? 'text-sky-400 animate-spin' : 'text-slate-500'}`}
              style={{ animationDuration: '2.5s' }}
            />
            {isRunning && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-2 ring-slate-900" />
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs font-semibold text-white leading-none">Scanner Active</span>
            <span className="text-[10px] text-slate-400 mt-1">
              {scannedCount} scanned · {blockedCount} blocked
            </span>
          </div>
          {blockPulse && (
            <span className="absolute inset-0 rounded-2xl bg-red-500/20 animate-ping" />
          )}
          {blockPulse && (
            <AlertTriangle className="absolute -top-2 -right-1 w-4 h-4 text-red-400 bg-slate-900 rounded-full p-0.5 animate-bounce" />
          )}
        </button>
      </div>
    );
  }

  // Expanded panel
  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-sky-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Radar
                className={`w-5 h-5 ${isRunning ? 'text-sky-400 animate-spin' : 'text-slate-500'}`}
                style={{ animationDuration: '2.5s' }}
              />
              {isRunning && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Background Scanner</p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                {isRunning ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Running · {formatUptime(uptime)}
                  </>
                ) : (
                  'Paused'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleScanner}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                isRunning
                  ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                  : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
              }`}
            >
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={toggleMinimize}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all"
              title="Minimize — scanner keeps running"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats — 3-column grid with threat breakdown */}
        <div className="grid grid-cols-3 gap-px bg-slate-800">
          <div className="bg-slate-900 px-3 py-3">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Scanned</span>
            </div>
            <p className="text-lg font-bold text-white mt-1">{scannedCount}</p>
          </div>
          <div className="bg-slate-900 px-3 py-3">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Safe</span>
            </div>
            <p className="text-lg font-bold text-emerald-400 mt-1">{safeCount}</p>
          </div>
          <div className="bg-slate-900 px-3 py-3">
            <div className="flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Blocked</span>
            </div>
            <p className="text-lg font-bold text-red-400 mt-1">{blockedCount}</p>
          </div>
        </div>

        {/* Suspicious counter bar */}
        {suspiciousCount > 0 && (
          <div className="px-4 py-2 bg-amber-500/5 border-b border-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-400/80">
              {suspiciousCount} suspicious {suspiciousCount === 1 ? 'item' : 'items'} flagged for review
            </span>
          </div>
        )}

        {/* Protection status bar */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Protection</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${
              isRunning ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              {isRunning ? 'Active' : 'Paused'}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatUptime(uptime)}
            </span>
          </div>
        </div>

        {/* Current scan */}
        {currentActivity && (
          <div className={`px-4 py-3 border-t border-slate-800 transition-colors ${
            blockPulse ? 'bg-red-500/5' : ''
          }`}>
            {currentActivity.status === 'scanning' ? (
              <div className="flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-sky-400 animate-pulse flex-shrink-0" />
                <p className="text-xs text-slate-400 truncate">
                  Scanning: <span className="text-sky-300 font-medium">{currentActivity.target}</span>
                </p>
              </div>
            ) : (
              <div className={`flex items-center gap-2 ${
                currentActivity.status === 'blocked' ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {currentActivity.status === 'blocked' ? (
                  <Ban className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Shield className="w-4 h-4 flex-shrink-0" />
                )}
                <p className="text-xs truncate">
                  {currentActivity.status === 'blocked' ? 'Blocked' : 'Verified Safe'}:{' '}
                  <span className="text-slate-400">{currentActivity.target}</span>
                </p>
                <span className={`ml-auto text-xs font-bold flex-shrink-0 px-1.5 py-0.5 rounded ${
                  currentActivity.riskScore >= 60
                    ? 'bg-red-500/15 text-red-400'
                    : currentActivity.riskScore >= 25
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                }`}>
                  {currentActivity.riskScore}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Recent activity feed */}
        {recentActivity.length > 1 && (
          <div className="border-t border-slate-800 max-h-36 overflow-y-auto scrollbar-thin">
            {recentActivity.slice(1).map((act) => (
              <div
                key={act.id}
                className="px-4 py-2 border-b border-slate-800/50 last:border-0 flex items-center gap-2 hover:bg-slate-800/30 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  act.status === 'blocked' ? 'bg-red-400' : 'bg-emerald-400'
                }`} />
                <p className="text-xs text-slate-500 truncate flex-1">{act.target}</p>
                <span className={`text-xs font-bold flex-shrink-0 ${
                  act.riskScore >= 60 ? 'text-red-400' : act.riskScore >= 25 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {act.riskScore}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-600 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Auto-scans every 5s
          </span>
          <span className="text-[10px] text-slate-600">
            AI KAVASH Real-Time Protection
          </span>
        </div>
      </div>
    </div>
  );
}
