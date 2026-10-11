import { useEffect, useState, type FormEvent } from 'react';
import {
  Users, UserPlus, Trash2, Loader2, Mail, Briefcase, User, X,
} from 'lucide-react';
import { supabase, type Employee } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function Employees() {
  const { profile, user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadEmployees() {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setEmployees([]);
    } else {
      setEmployees((data as Employee[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('employees').insert({
      name,
      email: email || null,
      position: position || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setName('');
    setEmail('');
    setPosition('');
    setShowAdd(false);
    setSaving(false);
    await loadEmployees();
  }

  async function handleRemove(id: string) {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) return;
    await loadEmployees();
  }

  const isManager = profile?.role === 'manager';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Employees</h1>
          <p className="text-slate-400 mt-2">
            {isManager
              ? `Manage your company's employee list. ${employees.length} employee${employees.length !== 1 ? 's' : ''} registered.`
              : 'View your company employee list.'}
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
          >
            <UserPlus className="w-4 h-4" /> Add Employee
          </button>
        )}
      </div>

      {/* Company info banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-900/50 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{profile?.company_name || 'Your Company'}</p>
            <p className="text-sm text-slate-400">
              Manager: {user?.email} • {employees.length} employee{employees.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Add employee form */}
      {showAdd && isManager && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Add New Employee</h2>
            <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Employee Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email (optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@company.com"
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Position (optional)</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Software Engineer"
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
              </div>
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
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              Add Employee
            </button>
          </form>
        </div>
      )}

      {/* Employee list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">
            {isManager ? 'No employees added yet. Click "Add Employee" to get started.' : 'No employees in your company yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-sky-400">
                    {emp.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{emp.name}</p>
                  {emp.position && (
                    <p className="text-xs text-slate-400 mt-0.5">{emp.position}</p>
                  )}
                  {emp.email && (
                    <p className="text-xs text-slate-500 mt-1 truncate">{emp.email}</p>
                  )}
                  <p className="text-xs text-slate-600 mt-2">
                    Added {new Date(emp.created_at).toLocaleDateString()}
                  </p>
                </div>

                {isManager && (
                  <button
                    onClick={() => handleRemove(emp.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
