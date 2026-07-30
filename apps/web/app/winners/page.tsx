'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '../components/Icons';
import { useLanguage } from '../components/LanguageProvider';

type Winner = { id: string; title: string; description: string; category: string; image: string; winner: string; amount: string; date: string; };

export default function Winners() {
  const { t } = useLanguage();
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    fetch(`${'https://gemet-api.onrender.com'}/winners`)
      .then(r => r.ok ? r.json() : null)
      .then(x => x?.winners && setWinners(x.winners))
      .catch(() => {});
  }, []);

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
            </div>
          ))
        )}
      </div>
    </main>
  );
}
