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

  useEffect(() => {
    if (!auth) return;
    const fetchAll = async () => {
      const api = process.env.NEXT_PUBLIC_API_URL || 'https://gemet-api.onrender.com';
      const [sRes, uRes, aRes] = await Promise.all([
        fetch(`${api}/admin/stats`),
        fetch(`${api}/admin/users`),
        fetch(`${api}/admin/auctions`)
      ]);
      setStats(await sRes.json());
      setUsers((await uRes.json()).users);
      setAuctions((await aRes.json()).auctions);
    };
    fetchAll();
  }, [auth]);

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
    <main className="min-h-screen bg-[#0A0D14] text-white p-8">
      <header className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 bg-cyan-500 rounded-lg grid place-items-center text-slate-900">
          <Icon name="sliders" size={20} />
        </div>
        <h1 className="text-2xl font-bold">Gemet System Dashboard</h1>
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
    </main>
  );
}
