import { useEffect, useState, type FormEvent } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, Loader2,
  DollarSign, ArrowUpCircle, ArrowDownCircle, X, Search,
} from 'lucide-react';
import { supabase, type Transaction, type TransactionType, type TransactionStatus } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const categories = ['salary', 'equipment', 'security', 'software', 'services', 'other'];

export default function Transactions() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('other');
  const [status, setStatus] = useState<TransactionStatus>('completed');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');

  const isManager = profile?.role === 'manager';

  async function loadTransactions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setTransactions([]);
    } else {
      setTransactions((data as Transaction[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('transactions').insert({
      title,
      amount: parseFloat(amount),
      type,
      category,
      status,
      recipient: recipient || null,
      notes: notes || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setTitle('');
    setAmount('');
    setType('expense');
    setCategory('other');
    setStatus('completed');
    setRecipient('');
    setNotes('');
    setShowAdd(false);
    setSaving(false);
    await loadTransactions();
  }

  async function handleRemove(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return;
    await loadTransactions();
  }

  const filtered = transactions.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !(t.recipient || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  function formatCurrency(val: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Money Transactions</h1>
          <p className="text-slate-400 mt-2">Track and manage your company's financial transactions.</p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" /> Add Transaction
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs text-slate-500 uppercase tracking-wider">Income</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-xs text-slate-500 uppercase tracking-wider">Expenses</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalExpense)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-sky-400" />
            </div>
            <span className="text-xs text-slate-500 uppercase tracking-wider">Balance</span>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && isManager && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Add Transaction</h2>
            <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Security software subscription"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                      type === 'income'
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-800/50 border border-slate-700 text-slate-400'
                    }`}
                  >
                    <ArrowUpCircle className="w-4 h-4" /> Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                      type === 'expense'
                        ? 'bg-red-500/15 border border-red-500/40 text-red-400'
                        : 'bg-slate-800/50 border border-slate-700 text-slate-400'
                    }`}
                  >
                    <ArrowDownCircle className="w-4 h-4" /> Expense
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-all cursor-pointer capitalize"
                >
                  {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-all cursor-pointer capitalize"
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Recipient (optional)</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Who sent or received the money?"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all resize-none"
              />
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
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Add Transaction
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-all cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Wallet className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">
            {transactions.length === 0 ? 'No transactions yet. Click "Add Transaction" to get started.' : 'No transactions match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
              }`}>
                {tx.type === 'income' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{tx.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="capitalize">{tx.category}</span>
                  {tx.recipient && ` • ${tx.recipient}`}
                  {' • '}{new Date(tx.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-lg font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                  tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                  tx.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {tx.status}
                </span>
                {isManager && (
                  <button
                    onClick={() => handleRemove(tx.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
