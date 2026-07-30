'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '../components/Icons';
import { useLanguage } from '../components/LanguageProvider';

type Winner = { id: string; title: string; description: string; category: string; image: string; winner: string; amount: string; date: string; };

const api = process.env.NEXT_PUBLIC_API_URL || 'https://gemet-api.onrender.com';

export default function Winners() {
  const { t } = useLanguage();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);
  const [losers, setLosers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [losersLoading, setLosersLoading] = useState(false);

  useEffect(() => {
    fetch(`${api}/winners`)
      .then(r => r.ok ? r.json() : null)
      .then(x => x?.winners && setWinners(x.winners))
      .catch(() => {});
  }, []);

  const openLosers = (w: Winner) => {
    setSelectedWinner(w);
    setSearch('');
    setLosersLoading(true);
    setLosers([]);
    fetch(`${api}/winners/${w.id}/losers`)
      .then(r => r.ok ? r.json() : null)
      .then(x => x?.losers && setLosers(x.losers))
      .catch(() => {})
      .finally(() => setLosersLoading(false));
  };

  const filteredLosers = losers.filter(l => l.ticketNumber?.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search));

  if (selectedWinner) {
    return (
      <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-8 pt-5">
        <header className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelectedWinner(null)} className="tile h-9 w-9 grid place-items-center rounded-xl text-cyan-300">
            <Icon name="back" size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.lostBids}</p>
            <h1 className="text-lg font-extrabold truncate text-white">{selectedWinner.title}</h1>
          </div>
        </header>
        
        <div className="mb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input 
              type="text" 
              placeholder={t.searchBids}
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full bg-[#0E131D] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors" 
            />
          </div>
        </div>

        {losersLoading ? (
          <div className="space-y-2 mt-4">
            {[1, 2, 3].map(i => <div key={i} className="tile rounded-xl h-12 animate-pulse bg-white/5" />)}
          </div>
        ) : filteredLosers.length === 0 ? (
          <div className="tile rounded-2xl p-8 text-center mt-4 border border-white/5">
            <p className="text-sm text-slate-400">{t.noLostBids}</p>
          </div>
        ) : (
          <div className="space-y-2 mt-4 max-h-[70vh] overflow-y-auto pb-10 pr-1">
            {filteredLosers.map((l, i) => (
              <div key={l.id} className="tile flex items-center justify-between rounded-xl px-4 py-3 border border-white/[.04]">
                <div>
                  <p className="font-mono text-sm text-white font-bold">{l.phone}</p>
                  <p className="text-[10px] text-slate-500">Ticket: {l.ticketNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-300">{l.amount} ETB</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-8 pt-5">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 text-xs text-cyan-300">
          <Icon name="chevron" size={15} className="rotate-180" />
          {t.back}
        </Link>
        <b className="text-xs text-slate-300 uppercase tracking-wider">Our Winners</b>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">Hall of Fame 🏆</h1>
        <p className="text-xs text-slate-400 mt-1">Celebrating our lowest unique bidders</p>
      </div>
      <div className="space-y-4">
        {winners.length === 0 ? (
          <div className="tile p-8 text-center rounded-3xl mt-10">
            <span className="grid mx-auto h-16 w-16 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/5 text-amber-300">
              <Icon name="history" size={28}/>
            </span>
            <p className="mt-4 text-sm text-slate-300 font-bold">No winners yet.</p>
            <p className="text-xs text-slate-500 mt-1">Be the first to claim a prize!</p>
          </div>
        ) : (
          winners.map(w => (
            <div key={w.id} className="tile flex flex-col gap-3 p-4 rounded-3xl border border-amber-500/10 shadow-[0_4px_20px_-10px_rgba(251,191,36,0.15)]">
              <div className="flex gap-3">
                <div className="h-20 w-20 shrink-0 rounded-2xl overflow-hidden border border-white/5">
                  <img src={w.image} alt={w.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    {w.category && <span className="bg-white/10 text-white text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md">{w.category}</span>}
                    <span className="text-[10px] text-slate-400">{new Date(w.date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-[15px] font-extrabold leading-tight">{w.title}</h3>
                  {w.description && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{w.description}</p>}
                </div>
              </div>
              <div className="h-px w-full bg-white/5" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 grid place-items-center text-[10px] font-bold text-white">
                    {w.winner.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Won by</p>
                    <p className="text-xs font-bold text-cyan-300">{w.winner}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Winning Bid</p>
                  <p className="text-sm font-black text-amber-400">{w.amount} ETB</p>
                </div>
              </div>
              <button 
                onClick={() => openLosers(w)}
                className="mt-2 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors border border-white/5"
              >
                {t.viewLostBids}
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
