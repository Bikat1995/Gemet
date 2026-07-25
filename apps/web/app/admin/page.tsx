'use client';
import { useEffect, useState } from 'react';
import { Icon } from '../components/Icons';

type Stats = { users: number; liveAuctions: number; totalDeposits: string; totalBids: number };
type User = { id: string; username: string; phoneNumber: string; walletBalance: number; createdAt: string; };
type Auction = { id: string; title: string; entryFee: string; status: string; };
type Winner = { auctionId: string; title: string; username: string; phoneNumber: string; winningBidAmount: string; date: string; };

export default function AdminDashboard() {
  const [pass, setPass] = useState('');
  const [auth, setAuth] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
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
    const [sRes, uRes, aRes, wRes] = await Promise.all([
      fetch(`${api}/admin/stats`),
      fetch(`${api}/admin/users`),
      fetch(`${api}/admin/auctions`),
      fetch(`${api}/admin/winners`)
    ]);
    if(sRes.ok) setStats(await sRes.json());
    if(uRes.ok) setUsers((await uRes.json()).users);
    if(aRes.ok) setAuctions((await aRes.json()).auctions);
    if(wRes.ok) setWinners((await wRes.json()).winners);
  };

  useEffect(() => {
    if (!auth) return;
    fetchAll();
  }, [auth]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large (max 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

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
        const errorText = await res.text();
        console.error("Backend Error:", errorText);
        alert(`Failed to create auction. Server response: ${errorText}`);
      }
    } catch (err) {
      console.error("Network Error:", err);
      alert(`Error creating auction: ${(err as Error).message}`);
    }
    setSubmitting(false);
  };

  const exportCsv = (data: any[], filename: string) => {
    if (!data.length) return alert("No data to export");
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <section className="bg-[#141923] p-6 rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Recent Users</h3>
                <button onClick={() => exportCsv(users, 'users.csv')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Icon name="download" size={14} /> Export CSV
                </button>
              </div>
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">System Auctions</h3>
                <button onClick={() => exportCsv(auctions, 'auctions.csv')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Icon name="download" size={14} /> Export CSV
                </button>
              </div>
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

          <section className="bg-[#141923] p-6 rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Auction Winners</h3>
              <button onClick={() => exportCsv(winners, 'winners.csv')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Icon name="download" size={14} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-[#0E131D]">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Auction</th>
                    <th className="px-4 py-3">Winner</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Winning Bid</th>
                    <th className="px-4 py-3 rounded-tr-lg">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {winners.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No winners yet</td></tr>
                  ) : winners.map(w => (
                    <tr key={w.auctionId} className="border-b border-white/5">
                      <td className="px-4 py-3 font-medium text-white">{w.title}</td>
                      <td className="px-4 py-3 text-white">{w.username}</td>
                      <td className="px-4 py-3 text-cyan-300">{w.phoneNumber}</td>
                      <td className="px-4 py-3 text-emerald-400 font-mono">{w.winningBidAmount} ETB</td>
                      <td className="px-4 py-3 text-slate-400">{new Date(w.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
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
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Item Image</label>
                  <div className="flex items-center gap-4">
                    {imageUrl && <img src={imageUrl} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-white/10" />}
                    <input required={!imageUrl} type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-[#0E131D] border border-white/10 rounded-lg p-2 text-sm text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30" />
                  </div>
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
