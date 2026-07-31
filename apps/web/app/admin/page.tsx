'use client';
import { useEffect, useState } from 'react';
import { Icon } from '../components/Icons';

const api = 'https://gemet-api.onrender.com';

type Stats = { users: number; liveAuctions: number; totalDeposits: string; totalBids: number };
type User = { id: string; username: string; phoneNumber: string; walletBalance: number; createdAt: string };
type Auction = { id: string; title: string; entryFee: string; status: string };
type Winner = { auctionId: string; title: string; description?: string; category?: string; username: string; phoneNumber: string; winningBidAmount: string; date: string };
type PendingPayment = { id: string; username: string; phoneNumber: string | null; auctionTitle: string; entryFee: string; paymentMethod: string | null; txId: string | null; createdAt: string };
type AdminBid = { id: string; auctionTitle: string; auctionCategory: string; username: string; phoneNumber: string; ticketNumber: string; amount: string; status: string; date: string };
type LiveLeader = { auctionId: string; auctionTitle: string; category: string; endTime: string; totalBids: number; currentLeader: { username: string; phoneNumber: string; amount: string; ticketNumber: string } | null };

type Tab = 'overview' | 'payments' | 'auctions' | 'users' | 'winners' | 'bids' | 'leaders';

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border ${color}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-black text-white">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full opacity-5 bg-white translate-x-6 translate-y-6" />
    </div>
  );
}

export default function AdminDashboard() {
  const [pass, setPass] = useState('');
  const [auth, setAuth] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [bids, setBids] = useState<AdminBid[]>([]);
  const [liveLeaders, setLiveLeaders] = useState<LiveLeader[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('electronics');
  const [entryFee, setEntryFee] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    const [sRes, uRes, aRes, wRes, pRes, bRes, lRes] = await Promise.all([
      fetch(`${api}/admin/stats`),
      fetch(`${api}/admin/users`),
      fetch(`${api}/admin/auctions`),
      fetch(`${api}/admin/winners`),
      fetch(`${api}/admin/payments/pending`),
      fetch(`${api}/admin/bids`),
      fetch(`${api}/admin/live-leaders`),
    ]);
    if (sRes.ok) setStats(await sRes.json());
    if (uRes.ok) setUsers((await uRes.json()).users);
    if (aRes.ok) setAuctions((await aRes.json()).auctions);
    if (wRes.ok) setWinners((await wRes.json()).winners);
    if (pRes.ok) setPendingPayments((await pRes.json()).payments);
    if (bRes.ok) setBids((await bRes.json()).bids);
    if (lRes.ok) setLiveLeaders((await lRes.json()).leaders);
  };

  // Initial fetch + auto-refresh every 5 seconds
  useEffect(() => {
    if (!auth) return;
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [auth]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image too large (max 2MB)'); return; }
    const reader = new FileReader();
    reader.onload = ev => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${api}/admin/auctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, imageUrl, category, entryFee: Number(entryFee), endTime: new Date(endTime).toISOString() })
      });
      if (res.ok) {
        setShowModal(false);
        fetchAll();
        setTitle(''); setDescription(''); setImageUrl(''); setEntryFee(''); setEndTime('');
      } else {
        alert(`Failed: ${await res.text()}`);
      }
    } catch (err) { alert(`Error: ${(err as Error).message}`); }
    setSubmitting(false);
  };

  const handleDeleteAuction = async (id: string) => {
    if (!confirm('Delete this auction?')) return;
    const res = await fetch(`${api}/admin/auctions/${id}`, { method: 'DELETE' });
    if (res.ok) fetchAll(); else alert('Failed to delete');
  };

  const handleVerify = async (id: string, status: 'success' | 'failed') => {
    setVerifyingId(id);
    const res = await fetch(`${api}/admin/payments/${id}/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) fetchAll(); else alert('Verification failed');
    setVerifyingId(null);
  };

  const handleReset = async () => {
    const secret = prompt('⚠️ DANGER: Enter secret key to wipe ALL data:');
    if (!secret) return;
    const res = await fetch(`${api}/admin/reset-all`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: secret.trim() })
    });
    if (res.ok) { alert('Database wiped!'); window.location.reload(); }
    else alert('Failed. Wrong secret?');
  };

  const exportCsv = (data: any[], filename: string) => {
    if (!data.length) return alert('No data');
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(r => headers.map(h => `"${String(r[h]).replace(/"/g, '""')}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = filename;
    link.click();
  };

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'leaders', label: '🥇 Live Leaders', badge: liveLeaders.filter(l => l.currentLeader).length || undefined },
    { id: 'payments', label: '⏳ Payments', badge: pendingPayments.length },
    { id: 'auctions', label: '🏷 Auctions' },
    { id: 'users', label: '👤 Users' },
    { id: 'winners', label: '🏆 Winners' },
    { id: 'bids', label: '🎯 All Bids' },
  ];

  if (!auth) {
    return (
      <main className="min-h-screen bg-[#07090F] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-3xl mb-4">🔐</div>
            <h1 className="text-2xl font-black text-white">Gemet Admin</h1>
            <p className="text-sm text-slate-400 mt-1">Restricted access only</p>
          </div>
          <div className="bg-[#111827] rounded-2xl border border-white/5 p-6">
            <input
              type="password"
              placeholder="Admin password"
              className="w-full bg-[#0A0D14] border border-white/10 rounded-xl p-3 text-white mb-4 outline-none focus:border-cyan-500 text-sm"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (pass === 'admin123' ? setAuth(true) : alert('Incorrect'))}
            />
            <button
              onClick={() => { if (pass === 'admin123') setAuth(true); else alert('Incorrect Password'); }}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-xl text-sm"
            >
              Unlock Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090F] text-white font-sans">
      {/* Sidebar header */}
      <div className="sticky top-0 z-40 bg-[#07090F]/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-cyan-500 grid place-items-center text-[#0A0D14] font-black text-sm">G</div>
          <div>
            <h1 className="text-sm font-extrabold text-white leading-tight">Gemet Admin</h1>
            <p className="text-[10px] text-slate-500">Management Console</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors">⚠️ Reset</button>
          <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-bold hover:bg-cyan-500/20 transition-colors">+ New Auction</button>
          <button onClick={() => setAuth(false)} className="px-3 py-1.5 bg-white/5 text-slate-400 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors">Logout</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-[#111827] rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${tab === t.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {t.label}
              {t.badge ? (
                <span className="h-4 min-w-4 px-1 rounded-full bg-amber-500 text-[#0A0D14] text-[9px] font-black grid place-items-center">{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats?.users ?? '…'} color="border-cyan-500/20 bg-cyan-500/5" icon="👥" />
              <StatCard label="Live Auctions" value={stats?.liveAuctions ?? '…'} color="border-emerald-500/20 bg-emerald-500/5" icon="🔴" />
              <StatCard label="Revenue (ETB)" value={stats?.totalDeposits ?? '…'} color="border-amber-500/20 bg-amber-500/5" icon="💰" />
              <StatCard label="Total Bids" value={stats?.totalBids ?? '…'} color="border-violet-500/20 bg-violet-500/5" icon="🎯" />
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pending Payments - large card */}
              <div className="md:col-span-2 bg-[#111827] rounded-2xl border border-amber-500/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 grid place-items-center rounded-lg bg-amber-500/10 text-amber-400 text-base">⏳</span>
                    <h3 className="font-bold text-sm">Pending Verifications</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${pendingPayments.length > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-500'}`}>
                    {pendingPayments.length} pending
                  </span>
                </div>
                {pendingPayments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">🎉 All payments verified!</div>
                ) : (
                  <div className="space-y-2">
                    {pendingPayments.slice(0, 5).map(p => (
                      <div key={p.id} className="bg-[#0A0D14] rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white">{p.auctionTitle}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{p.phoneNumber || p.username}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[11px] font-bold text-emerald-400">{p.entryFee} ETB</p>
                            <p className="text-[10px] text-amber-300 font-mono">{p.txId?.slice(0, 12)}…</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleVerify(p.id, 'success')} disabled={verifyingId === p.id} className="flex-1 text-[11px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 py-1.5 rounded-lg font-bold disabled:opacity-50">✓ Approve</button>
                          <button onClick={() => handleVerify(p.id, 'failed')} disabled={verifyingId === p.id} className="flex-1 text-[11px] bg-red-500/20 text-red-400 hover:bg-red-500/30 py-1.5 rounded-lg font-bold disabled:opacity-50">✕ Reject</button>
                        </div>
                      </div>
                    ))}
                    {pendingPayments.length > 5 && (
                      <button onClick={() => setTab('payments')} className="w-full text-xs text-cyan-400 text-center py-2">View all {pendingPayments.length} →</button>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Winners */}
              <div className="bg-[#111827] rounded-2xl border border-white/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-8 w-8 grid place-items-center rounded-lg bg-amber-500/10 text-amber-400 text-base">🏆</span>
                  <h3 className="font-bold text-sm">Recent Winners</h3>
                </div>
                {winners.length === 0 ? (
                  <p className="text-center text-slate-500 text-xs py-8">No winners yet</p>
                ) : (
                  <div className="space-y-2">
                    {winners.slice(0, 4).map(w => (
                      <div key={w.auctionId} className="bg-[#0A0D14] rounded-xl p-3">
                        <p className="text-xs font-bold text-white truncate">{w.title}</p>
                        <div className="flex justify-between mt-1">
                          <p className="text-[10px] text-slate-400 font-mono">{w.phoneNumber}</p>
                          <p className="text-[10px] text-emerald-400 font-bold">{w.winningBidAmount} ETB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live Auctions mini grid */}
            <div className="bg-[#111827] rounded-2xl border border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 grid place-items-center rounded-lg bg-emerald-500/10 text-emerald-400 text-base">🔴</span>
                  <h3 className="font-bold text-sm">Live Auctions</h3>
                </div>
                <button onClick={() => setTab('auctions')} className="text-xs text-cyan-400">View all →</button>
              </div>
              {auctions.filter(a => a.status === 'active').length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4">No live auctions</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {auctions.filter(a => a.status === 'active').slice(0, 6).map(a => (
                    <div key={a.id} className="bg-[#0A0D14] rounded-xl p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{a.title}</p>
                        <p className="text-[10px] text-cyan-400">{a.entryFee} ETB</p>
                      </div>
                      <button onClick={() => handleDeleteAuction(a.id)} className="shrink-0 text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-lg">Del</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {tab === 'payments' && (
          <div className="bg-[#111827] rounded-2xl border border-amber-500/20 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Payment Verifications</h3>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${pendingPayments.length > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-400'}`}>{pendingPayments.length} pending</span>
            </div>
            {pendingPayments.length === 0 ? (
              <p className="text-center py-12 text-slate-400">🎉 No pending verifications</p>
            ) : (
              <div className="space-y-3">
                {pendingPayments.map(p => (
                  <div key={p.id} className="bg-[#0A0D14] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <p className="text-[10px] text-slate-500">User</p>
                        <p className="text-xs font-bold text-white">{p.username}</p>
                        <p className="text-[10px] text-cyan-400 font-mono">{p.phoneNumber || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Auction</p>
                        <p className="text-xs text-white truncate">{p.auctionTitle}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Method / Tx ID</p>
                        <p className="text-[11px] text-amber-300 font-bold">{p.paymentMethod}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{p.txId}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Amount</p>
                        <p className="text-sm font-black text-emerald-400">{p.entryFee} ETB</p>
                        <p className="text-[10px] text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleVerify(p.id, 'success')} disabled={verifyingId === p.id} className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-4 py-2 rounded-xl font-bold disabled:opacity-50">✓ Approve</button>
                      <button onClick={() => handleVerify(p.id, 'failed')} disabled={verifyingId === p.id} className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-2 rounded-xl font-bold disabled:opacity-50">✕ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Auctions Tab */}
        {tab === 'auctions' && (
          <div className="bg-[#111827] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">All Auctions</h3>
              <div className="flex gap-2">
                <button onClick={() => exportCsv(auctions, 'auctions.csv')} className="text-xs bg-white/10 px-3 py-1.5 rounded-lg text-slate-300">⬇ CSV</button>
                <button onClick={() => setShowModal(true)} className="text-xs bg-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-lg font-bold">+ New</button>
              </div>
            </div>
            <div className="space-y-2">
              {auctions.map(a => (
                <div key={a.id} className="bg-[#0A0D14] rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{a.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>{a.status}</span>
                      <span className="text-[10px] text-cyan-400">{a.entryFee} ETB</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteAuction(a.id)} className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded-lg font-bold">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="bg-[#111827] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">All Users ({users.length})</h3>
              <button onClick={() => exportCsv(users, 'users.csv')} className="text-xs bg-white/10 px-3 py-1.5 rounded-lg text-slate-300">⬇ CSV</button>
            </div>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="bg-[#0A0D14] rounded-xl p-3 flex items-center gap-3">
                  <div className="h-8 w-8 grid place-items-center rounded-full bg-cyan-500/20 text-cyan-400 font-black text-xs shrink-0">
                    {(u.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{u.username || 'Anonymous'}</p>
                    <p className="text-[10px] text-cyan-400 font-mono">{u.phoneNumber || 'No phone'}</p>
                  </div>
                  <p className="text-[10px] text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Winners Tab */}
        {tab === 'winners' && (
          <div className="bg-[#111827] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Auction Winners</h3>
              <button onClick={() => exportCsv(winners, 'winners.csv')} className="text-xs bg-white/10 px-3 py-1.5 rounded-lg text-slate-300">⬇ CSV</button>
            </div>
            {winners.length === 0 ? (
              <p className="text-center text-slate-400 py-10">No winners declared yet</p>
            ) : (
              <div className="space-y-3">
                {winners.map(w => (
                  <div key={w.auctionId} className="bg-[#0A0D14] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-bold text-white">{w.title}</p>
                        <p className="text-[10px] text-slate-400">{w.description || '—'}</p>
                      </div>
                      <span className="text-[11px] font-black text-emerald-400 shrink-0">{w.winningBidAmount} ETB</span>
                    </div>
                    <div className="flex items-center gap-3 border-t border-white/5 pt-2">
                      <span className="text-base">🏆</span>
                      <div>
                        <p className="text-[10px] text-slate-500">Winner</p>
                        <p className="text-xs font-bold text-white font-mono">{w.phoneNumber}</p>
                      </div>
                      <p className="ml-auto text-[10px] text-slate-500">{new Date(w.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live Leaders Tab */}
        {tab === 'leaders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">🥇 Live Bid Leaders</h3>
              <span className="text-xs text-slate-400">Auto-refreshes every 15s</span>
            </div>
            {liveLeaders.length === 0 ? (
              <div className="bg-[#111827] rounded-2xl border border-white/5 p-10 text-center text-slate-400">No active auctions right now</div>
            ) : (
              liveLeaders.map(l => (
                <div key={l.auctionId} className="bg-[#111827] rounded-2xl border border-white/5 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{l.category}</p>
                      <h4 className="text-base font-extrabold text-white">{l.auctionTitle}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Ends: {new Date(l.endTime).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Total Bids</p>
                      <p className="text-2xl font-black text-cyan-300">{l.totalBids}</p>
                    </div>
                  </div>
                  <div className="h-px bg-white/5 mb-3" />
                  {l.currentLeader ? (
                    <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl p-4">
                      <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest mb-2">🏆 Current Leader (Lowest Unique Bid)</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Username</p>
                          <p className="text-sm font-bold text-white">{l.currentLeader.username}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Phone</p>
                          <p className="text-sm font-bold text-cyan-300 font-mono">{l.currentLeader.phoneNumber}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Bid Amount</p>
                          <p className="text-sm font-black text-amber-400">{l.currentLeader.amount} ETB</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Ticket</p>
                          <p className="text-xs font-bold text-slate-300 font-mono">{l.currentLeader.ticketNumber}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white/3 border border-white/5 p-4 text-center text-xs text-slate-400">
                      No unique bid yet — all bids are duplicated
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Bids Tab */}
        {tab === 'bids' && (
          <div className="bg-[#111827] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">All Placed Bids ({bids.length})</h3>
              <button onClick={() => exportCsv(bids, 'bids.csv')} className="text-xs bg-white/10 px-3 py-1.5 rounded-lg text-slate-300">⬇ CSV</button>
            </div>
            {bids.length === 0 ? (
              <p className="text-center text-slate-400 py-10">No bids placed yet</p>
            ) : (
              <div className="space-y-6">
                {/* Group bids by auction */}
                {Object.entries(
                  bids.reduce((acc, b) => { (acc[b.auctionTitle] = acc[b.auctionTitle] || []).push(b); return acc; }, {} as Record<string, AdminBid[]>)
                ).map(([auctionTitle, auctionBids]) => (
                  <div key={auctionTitle}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400`}>{auctionBids[0].auctionCategory}</span>
                      <h4 className="text-sm font-extrabold text-white">{auctionTitle}</h4>
                      <span className="text-[10px] text-slate-500">{auctionBids.length} bid{auctionBids.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-[#0E131D]">
                          <tr>
                            <th className="px-4 py-3 rounded-tl-lg">User</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Ticket</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 rounded-tr-lg">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auctionBids.map(b => (
                            <tr key={b.id} className="border-b border-white/5">
                              <td className="px-4 py-3 text-white">{b.username}</td>
                              <td className="px-4 py-3 text-cyan-300 font-mono">{b.phoneNumber}</td>
                              <td className="px-4 py-3 text-slate-300 font-mono text-xs">{b.ticketNumber}</td>
                              <td className="px-4 py-3 text-emerald-400 font-mono">{b.amount} ETB</td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === 'unique' ? 'bg-emerald-500/10 text-emerald-400' : b.status === 'duplicated' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-xs">{new Date(b.date).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Auction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Create New Auction</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#0A0D14] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-cyan-500" placeholder="e.g. iPhone 15 Pro Max" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#0A0D14] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-cyan-500" placeholder="Brief description of the item" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Item Image</label>
                <div className="flex items-center gap-3">
                  {imageUrl && <img src={imageUrl} alt="" className="h-12 w-12 object-cover rounded-lg border border-white/10" />}
                  <input required={!imageUrl} type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-[#0A0D14] border border-white/10 rounded-xl p-2 text-xs text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#0A0D14] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-cyan-500">
                    <option value="electronics">Electronics</option>
                    <option value="vehicles">Vehicles</option>
                    <option value="property">Property</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Entry Fee (ETB)</label>
                  <input required type="number" min="1" step="1" value={entryFee} onChange={e => setEntryFee(e.target.value)} className="w-full bg-[#0A0D14] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-cyan-500" placeholder="e.g. 30" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">End Time (Local)</label>
                <input required type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-[#0A0D14] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-cyan-500" />
              </div>
              <button disabled={submitting} type="submit" className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm">
                {submitting ? 'Creating…' : '🚀 Create Auction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
