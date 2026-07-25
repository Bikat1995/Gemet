'use client';
import { useEffect, useState } from 'react';
import { Icon } from '../components/Icons';

type Stats = { users: number; liveAuctions: number; totalDeposits: string; totalBids: number };
type User = { id: string; username: string; phoneNumber: string; walletBalance: number; createdAt: string; };
type Auction = { id: string; title: string; entryFee: string; status: string; };

export default function AdminDashboard() {
  const [pass, setPass] = useState('');
  const [auth, setAuth] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // New Auction Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('electronics');
  const [entryFee, setEntryFee] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const api = 'https://gemet-api.onrender.com';

  const fetchAll = async () => {
    const [sRes, uRes, aRes] = await Promise.all([
      fetch(`${api}/admin/stats`),
      fetch(`${api}/admin/users`),
      fetch(`${api}/admin/auctions`)
    ]);
    if(sRes.ok) setStats(await sRes.json());
    if(uRes.ok) setUsers((await uRes.json()).users);
    if(aRes.ok) setAuctions((await aRes.json()).auctions);
  };

  useEffect(() => {
    if (!auth) return;
    fetchAll();
  }, [auth]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${api}/admin/auctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, imageUrl, category, entryFee: Number(entryFee),
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString()
        })
      });
      if (res.ok) {
        setShowModal(false);
        fetchAll(); // Refresh the list
        // Reset form
        setTitle(''); setDescription(''); setImageUrl(''); setEntryFee(''); setStartTime(''); setEndTime('');
      } else {
        alert('Failed to create auction. Please check the inputs.');
      }
    } catch (err) {
      alert('Error creating auction');
    }
    setSubmitting(false);
  };

  if (!auth) {
    return (
      <main className="min-h-screen bg-[#0A0D14] flex items-center justify-center p-4">
        <div className="bg-[#141923] p-8 rounded-2xl border border-white/10 w-full max-w-sm">
          <h1 className="text-xl font-bold text-white mb-4">Admin Login</h1>
          <input 
            type="password" 
            placeholder="Enter Admin Password" 
            className="w-full bg-[#0E131D] border border-white/10 rounded-lg p-3 text-white mb-4 outline-none focus:border-cyan-500"
            value={pass}
            onChange={e => setPass(e.target.value)}
          />
          <button 
            onClick={() => { if (pass === 'admin123') setAuth(true); else alert('Incorrect Password'); }}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-lg"
          >
            Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0D14] text-white p-8 relative">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-cyan-500 rounded-lg grid place-items-center text-slate-900">
            <Icon name="sliders" size={20} />
          </div>
          <h1 className="text-2xl font-bold">Gemet System Dashboard</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <Icon name="plus" size={16} /> Create Auction
        </button>
      </header>

      {!stats ? <p>Loading data...</p> : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#141923] p-5 rounded-2xl border border-white/5">
              <p className="text-sm text-slate-400 mb-1">Total Users</p>
              <h2 className="text-3xl font-bold">{stats.users}</h2>
            </div>
            <div className="bg-[#141923] p-5 rounded-2xl border border-white/5">
              <p className="text-sm text-slate-400 mb-1">Live Auctions</p>
              <h2 className="text-3xl font-bold">{stats.liveAuctions}</h2>
            </div>
            <div className="bg-[#141923] p-5 rounded-2xl border border-white/5">
              <p className="text-sm text-slate-400 mb-1">Total Deposits (ETB)</p>
              <h2 className="text-3xl font-bold text-emerald-400">{stats.totalDeposits}</h2>
            </div>
            <div className="bg-[#141923] p-5 rounded-2xl border border-white/5">
              <p className="text-sm text-slate-400 mb-1">Total Bids Placed</p>
              <h2 className="text-3xl font-bold text-cyan-400">{stats.totalBids}</h2>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="bg-[#141923] p-6 rounded-2xl border border-white/5 overflow-hidden">
              <h3 className="text-lg font-bold mb-4">Recent Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-[#0E131D]">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">User</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Balance (cents)</th>
                      <th className="px-4 py-3 rounded-tr-lg">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-white/5">
                        <td className="px-4 py-3 font-medium text-white">{u.username || 'Anonymous'}</td>
                        <td className="px-4 py-3 text-cyan-300">{u.phoneNumber || 'Not provided'}</td>
                        <td className="px-4 py-3 text-emerald-400 font-mono">{u.walletBalance}</td>
                        <td className="px-4 py-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-[#141923] p-6 rounded-2xl border border-white/5 overflow-hidden">
              <h3 className="text-lg font-bold mb-4">System Auctions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-[#0E131D]">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Title</th>
                      <th className="px-4 py-3">Entry Fee</th>
                      <th className="px-4 py-3 rounded-tr-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auctions.map(a => (
                      <tr key={a.id} className="border-b border-white/5">
                        <td className="px-4 py-3 font-medium text-white">{a.title}</td>
                        <td className="px-4 py-3 text-cyan-300 font-mono">{a.entryFee} ETB</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${a.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141923] border border-white/10 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Create New Auction</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#0E131D] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500" placeholder="e.g. iPhone 15 Pro Max" />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#0E131D] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500" placeholder="A brief description of the item" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Image URL</label>
                  <input required type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full bg-[#0E131D] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#0E131D] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500">
                    <option value="electronics">Electronics</option>
                    <option value="vehicles">Vehicles</option>
                    <option value="property">Property</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Entry Fee (ETB)</label>
                <input required type="number" min="1" step="0.01" value={entryFee} onChange={e => setEntryFee(e.target.value)} className="w-full bg-[#0E131D] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500" placeholder="e.g. 30" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Start Time (Local)</label>
                  <input required type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-[#0E131D] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">End Time (Local)</label>
                  <input required type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-[#0E131D] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500" />
                </div>
              </div>

              <button disabled={submitting} type="submit" className="w-full mt-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                {submitting ? 'Creating...' : 'Create Auction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
