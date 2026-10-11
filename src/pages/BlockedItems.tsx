import { useEffect, useState } from 'react';
import { Ban, Trash2, Loader2, ShieldX, Plus } from 'lucide-react';
import { supabase, type BlockedItem, type ContentType } from '@/lib/supabase';

export default function BlockedItems() {
  const [items, setItems] = useState<BlockedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<ContentType>('link');

  async function loadItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from('blocked_items')
      .select('*')
      .order('blocked_at', { ascending: false });
    if (error) {
      setItems([]);
    } else {
      setItems((data as BlockedItem[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function addItem() {
    if (!newUrl.trim()) return;
    const { error } = await supabase.from('blocked_items').insert({
      content_value: newUrl,
      content_type: newType,
    });
    if (error) return;
    setNewUrl('');
    setShowAdd(false);
    await loadItems();
  }

  async function removeItem(id: string) {
    const { error } = await supabase.from('blocked_items').delete().eq('id', id);
    if (error) return;
    await loadItems();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Blocked Items</h1>
          <p className="text-slate-400 mt-2">Content that has been blocked from reaching your customers.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" /> Add to Blocklist
        </button>
      </div>

      {showAdd && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Content to Block</label>
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://malicious-site.com or message text"
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {(['link', 'message', 'poster', 'email', 'other'] as ContentType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                    newType === t
                      ? 'bg-sky-500/15 border border-sky-500/40 text-sky-400'
                      : 'bg-slate-800/50 border border-slate-700 text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={addItem}
            className="bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-all"
          >
            Block Content
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <ShieldX className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No items blocked yet. Malicious threats are auto-blocked when reported.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center flex-shrink-0">
                <Ban className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white break-all truncate">{item.content_value}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {item.content_type} • Blocked on {new Date(item.blocked_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 p-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
