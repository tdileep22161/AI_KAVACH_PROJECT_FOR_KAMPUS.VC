import { useEffect, useState, type FormEvent } from 'react';
import {
  MessageSquare, Send, Loader2, Trash2, Phone, User,
  AlertTriangle, X, CheckCircle2, Clock, Shield,
} from 'lucide-react';
import { supabase, type SmsAlert, type AlertType, type Employee } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const alertTypes: { value: AlertType; label: string; icon: typeof Shield }[] = [
  { value: 'threat', label: 'Security Threat', icon: AlertTriangle },
  { value: 'transaction', label: 'Transaction Alert', icon: MessageSquare },
  { value: 'login', label: 'Login Alert', icon: Shield },
  { value: 'custom', label: 'Custom Message', icon: MessageSquare },
];

export default function SmsAlerts() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<SmsAlert[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentConfirm, setSentConfirm] = useState<string | null>(null);

  // form
  const [employeeName, setEmployeeName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState<AlertType>('threat');
  const [selectedEmpId, setSelectedEmpId] = useState('');

  const isManager = profile?.role === 'manager';

  async function loadData() {
    setLoading(true);
    const [alertsRes, empRes] = await Promise.all([
      supabase.from('sms_alerts').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('*').order('name', { ascending: true }),
    ]);
    if (alertsRes.error || empRes.error) {
      setError('Failed to load data. Please try again.');
    }
    setAlerts((alertsRes.data as SmsAlert[]) ?? []);
    setEmployees((empRes.data as Employee[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function selectEmployee(empId: string) {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setEmployeeName(emp.name);
      // Use email as pseudo phone if no phone stored — user will type actual number
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!employeeName.trim() || !phone.trim() || !message.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms-alert`;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employee_name: employeeName,
          phone,
          message,
          alert_type: alertType,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        setError(errBody.error || `Request failed (${response.status})`);
        setSaving(false);
        return;
      }

      const result = await response.json();
      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }

      setSentConfirm(`SMS alert sent to ${employeeName} (${phone})`);
      setEmployeeName('');
      setPhone('');
      setMessage('');
      setAlertType('threat');
      setSelectedEmpId('');
      setShowSend(false);
      setSaving(false);
      setTimeout(() => setSentConfirm(null), 3000);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send SMS alert');
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    const { error: delError } = await supabase.from('sms_alerts').delete().eq('id', id);
    if (delError) {
      setError(delError.message);
      return;
    }
    await loadData();
  }

  function statusIcon(status: string) {
    if (status === 'sent') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (status === 'pending') return <Clock className="w-4 h-4 text-amber-400" />;
    return <AlertTriangle className="w-4 h-4 text-red-400" />;
  }

  const alertTypeColor = (type: AlertType) =>
    type === 'threat' ? 'bg-red-500/10 text-red-400' :
    type === 'transaction' ? 'bg-sky-500/10 text-sky-400' :
    type === 'login' ? 'bg-amber-500/10 text-amber-400' :
    'bg-slate-700/50 text-slate-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">SMS Alerts</h1>
          <p className="text-slate-400 mt-2">Send security SMS alerts to your employees about threats and transactions.</p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowSend(!showSend)}
            className="flex items-center gap-2 bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
          >
            <Send className="w-4 h-4" /> Send SMS Alert
          </button>
        )}
      </div>

      {sentConfirm && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> {sentConfirm}
        </div>
      )}

      {/* Send form */}
      {showSend && isManager && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Send New SMS Alert</h2>
            <button onClick={() => setShowSend(false)} className="text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Quick select from employee list */}
            {employees.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Quick Select Employee</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => selectEmployee(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-all cursor-pointer"
                >
                  <option value="">— Select from employee list —</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}{emp.position ? ` (${emp.position})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Employee Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Alert Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {alertTypes.map((at) => {
                  const Icon = at.icon;
                  const active = alertType === at.value;
                  return (
                    <button
                      key={at.value}
                      type="button"
                      onClick={() => setAlertType(at.value)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-sky-500/15 border border-sky-500/40 text-sky-400'
                          : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {at.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your security alert message..."
                rows={3}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">{message.length} characters</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl py-3 px-6 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Send SMS Alert
            </button>
          </form>
        </div>
      )}

      {/* Alert history */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">
            {isManager ? 'No SMS alerts sent yet. Click "Send SMS Alert" to notify your employees.' : 'No SMS alerts yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${alertTypeColor(alert.alert_type)}`}>
                <MessageSquare className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-white">{alert.employee_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${alertTypeColor(alert.alert_type)}`}>
                    {alert.alert_type}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    {statusIcon(alert.status)}
                    <span className="text-slate-500 capitalize">{alert.status}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{alert.phone}</p>
                <p className="text-sm text-slate-300 mt-2 break-words">{alert.message}</p>
                <p className="text-xs text-slate-600 mt-2">{new Date(alert.created_at).toLocaleString()}</p>
              </div>

              {isManager && (
                <button
                  onClick={() => handleRemove(alert.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
