import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  Shield, Loader2, Lock, Mail, Building2, Eye, EyeOff,
  ArrowLeft, CheckCircle2, KeyRound, Fingerprint, Zap, Globe,
  Phone, MessageSquare, User, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Mode = 'signin' | 'signup' | 'forgot';
type SignInMethod = 'password' | 'email-otp' | 'phone-otp';

export default function AuthPage() {
  const {
    signIn, signUp, sendEmailOtp, verifyEmailOtp, sendPhoneOtp, verifyPhoneOtp,
    sendPasswordResetOtp, verifyPasswordResetOtp, updatePassword,
  } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [signInMethod, setSignInMethod] = useState<SignInMethod>('password');

  // Shared fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Auto-advance OTP inputs
  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
      setOtp(newOtp);
      if (pasted.length < 6) otpRefs.current[pasted.length]?.focus();
      else otpRefs.current[5]?.blur();
    }
  }

  function getOtpString() {
    return otp.join('');
  }

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setError(null);
    setInfoMsg(null);
    setOtpSent(false);
    setOtpVerified(false);
    setResetComplete(false);
    setOtp(['', '', '', '', '', '']);
  }

  function switchSignInMethod(method: SignInMethod) {
    setSignInMethod(method);
    setError(null);
    setInfoMsg(null);
    setOtpSent(false);
    setOtp(['', '', '', '', '', '']);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setLoading(true);

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, orgName);
      if (error) setError(error);
    } else if (mode === 'signin') {
      if (signInMethod === 'password') {
        const { error } = await signIn(email, password);
        if (error) setError(error);
      } else if (signInMethod === 'email-otp') {
        if (!otpSent) {
          const { error } = await sendEmailOtp(email);
          if (error) { setError(error); } else { setOtpSent(true); setInfoMsg('OTP sent to your email. Enter the 6-digit code below.'); }
        } else {
          const { error } = await verifyEmailOtp(email, getOtpString());
          if (error) setError(error);
        }
      } else if (signInMethod === 'phone-otp') {
        if (!otpSent) {
          const { error } = await sendPhoneOtp(phone);
          if (error) { setError(error); } else { setOtpSent(true); setInfoMsg('OTP sent to your phone. Enter the 6-digit code below.'); }
        } else {
          const { error } = await verifyPhoneOtp(phone, getOtpString());
          if (error) setError(error);
        }
      }
    } else if (mode === 'forgot') {
      if (!otpSent) {
        const { error } = await sendPasswordResetOtp(email);
        if (error) { setError(error); } else { setOtpSent(true); setInfoMsg('OTP sent to your email. Enter the 6-digit code to reset your password.'); }
      } else if (!otpVerified) {
        const { error } = await verifyPasswordResetOtp(email, getOtpString());
        if (error) { setError(error); } else { setOtpVerified(true); setInfoMsg('OTP verified! Set your new password below.'); }
      } else {
        if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
        const { error } = await updatePassword(newPassword);
        if (error) { setError(error); } else { setResetComplete(true); }
      }
    }
    setLoading(false);
  }

  const getButtonLabel = () => {
    if (mode === 'signup') return 'Create Account';
    if (mode === 'signin') {
      if (signInMethod === 'password') return 'Sign In';
      if (!otpSent) return 'Send OTP';
      return 'Verify & Sign In';
    }
    if (mode === 'forgot') {
      if (!otpSent) return 'Send OTP';
      if (!otpVerified) return 'Verify OTP';
      return 'Reset Password';
    }
    return 'Submit';
  };

  const showOtpField = (mode === 'forgot' && otpSent && !otpVerified) ||
    (mode === 'signin' && (signInMethod === 'email-otp' || signInMethod === 'phone-otp') && otpSent);

  const showNewPasswordField = mode === 'forgot' && otpVerified && !resetComplete;

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.15) 0%, transparent 40%), radial-gradient(circle at 60% 80%, rgba(34, 211, 238, 0.12) 0%, transparent 50%)',
        }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-20 right-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/40">
              <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white tracking-tight leading-none">AI KAVASH</span>
              <span className="text-xs text-sky-400/80 font-medium tracking-wider mt-1">THREAT PROTECTION SYSTEM</span>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium">
                <Zap className="w-3.5 h-3.5" /> AI-Powered Security
              </div>
              <h1 className="text-4xl font-bold text-white leading-tight">
                Detect. Analyze. Block.<br />
                <span className="bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Protect your organization.
                </span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-md">
                AI-powered threat intelligence platform that identifies fake links, malicious messages, fraudulent transactions, and security threats — automatically, in the background, 24/7.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md">
              {[
                { label: 'Threats Blocked', value: '12.4K+', icon: Shield },
                { label: 'Organizations', value: '500+', icon: Building2 },
                { label: 'Detection Rate', value: '99.2%', icon: Fingerprint },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <Icon className="w-5 h-5 text-sky-400 mb-2" />
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-400 flex-wrap">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" /> Link Scanner
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" /> SMS Alerts
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" /> Transaction Security
              </div>
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-sky-400" /> OTP Login
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-500">© 2026 AI KAVASH. Securing the digital frontier.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 lg:hidden" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.15) 0%, transparent 50%)',
        }} />

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white leading-none">AI KAVASH</span>
              <span className="text-[10px] text-sky-400/70 font-medium tracking-wider mt-0.5">THREAT PROTECTION</span>
            </div>
          </div>

          {mode === 'forgot' && (
            <button onClick={() => switchMode('signin')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          )}

          <h2 className="text-3xl font-bold text-white mb-2">
            {mode === 'signin' && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-slate-400 mb-6">
            {mode === 'signin' && 'Sign in to access your security dashboard.'}
            {mode === 'signup' && 'Create a manager account to protect your organization.'}
            {mode === 'forgot' && 'Verify with OTP to reset your password.'}
          </p>

          {/* Sign-in method tabs */}
          {mode === 'signin' && (
            <div className="flex gap-1 mb-6 bg-slate-900 rounded-xl p-1 border border-slate-800">
              {[
                { id: 'password' as SignInMethod, label: 'Password', icon: Lock },
                { id: 'email-otp' as SignInMethod, label: 'Email OTP', icon: Mail },
                { id: 'phone-otp' as SignInMethod, label: 'Phone OTP', icon: Phone },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = signInMethod === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => switchSignInMethod(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      active ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Info message */}
          {infoMsg && (
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl px-4 py-3 text-sm text-sky-300 mb-5">
              {infoMsg}
            </div>
          )}

          {/* Reset complete */}
          {resetComplete && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-4 text-sm text-emerald-400 flex items-start gap-3 mb-5">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Password reset successful!</p>
                <p className="text-emerald-400/70 mt-1">You can now sign in with your new password.</p>
                <button onClick={() => switchMode('signin')} className="text-emerald-400 font-semibold underline mt-2">
                  Go to Sign In
                </button>
              </div>
            </div>
          )}

          {!resetComplete && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Signup: org name */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Organization Name <span className="text-sky-400">(Manager Account)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Acme Organization"
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all" />
                  </div>
                </div>
              )}

              {/* Email field — for password, email-otp, signup, forgot */}
              {(mode === 'signup' || mode === 'forgot' || (mode === 'signin' && signInMethod !== 'phone-otp')) && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@organization.com" disabled={otpSent && mode === 'forgot'}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all disabled:opacity-50" />
                  </div>
                </div>
              )}

              {/* Phone field — for phone-otp */}
              {mode === 'signin' && signInMethod === 'phone-otp' && !otpSent && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 234 567 890"
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all" />
                  </div>
                </div>
              )}

              {/* Password field — password sign-in and signup */}
              {mode !== 'forgot' && signInMethod === 'password' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-300">Password</label>
                    {mode === 'signin' && (
                      <button type="button" onClick={() => switchMode('forgot')}
                        className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5" /> Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type={showPassword ? 'text' : 'password'} required minLength={6}
                      value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* OTP field */}
              {showOtpField && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Enter 6-Digit OTP Code</label>
                  <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold text-white bg-slate-800/60 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                      />
                    ))}
                  </div>
                  <p className="text-center text-xs text-slate-500 mt-3">
                    Didn't receive it?{' '}
                    <button type="button" onClick={() => { setOtpSent(false); setOtp(['', '', '', '', '', '']); }}
                      className="text-sky-400 hover:text-sky-300 font-medium">
                      Resend OTP
                    </button>
                  </p>
                </div>
              )}

              {/* New password field — after OTP verified in forgot mode */}
              {showNewPasswordField && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input type="password" required minLength={6}
                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••"
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input type="password" required minLength={6}
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all" />
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 hover:from-sky-400 hover:via-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl py-3.5 transition-all shadow-lg shadow-sky-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {getButtonLabel()}
              </button>
            </form>
          )}

          {mode !== 'forgot' && !resetComplete && (
            <p className="text-center text-slate-400 mt-6">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}

          <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-slate-800 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-sky-500" /> 256-bit Encryption
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-sky-500" /> OTP Secure
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Fingerprint className="w-3.5 h-3.5 text-sky-500" /> RLS Protected
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
