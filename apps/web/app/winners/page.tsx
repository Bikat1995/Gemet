'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '../components/Icons';
import { useLanguage } from '../components/LanguageProvider';

type Winner = { id: string; title: string; image: string; winner: string; amount: string; date: string; };

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
        <b className="text-xs">Our Winners</b>
      </div>
      <h1 className="mb-5 text-2xl font-extrabold text-white">Epic Wins 🏆</h1>
      <div className="space-y-4">
        {winners.length === 0 ? (
          <p className="text-center text-sm text-slate-500">No winners yet. Be the first!</p>
        ) : (
          winners.map(w => (
            <div key={w.id} className="tile flex gap-4 p-3 rounded-2xl border border-white/[.05]">
              <img src={w.image} alt={w.title} className="h-20 w-20 rounded-xl object-cover" />
              <div className="flex flex-1 flex-col justify-center">
                <h3 className="text-sm font-bold leading-tight">{w.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Won by <b className="text-cyan-300">{w.winner}</b></p>
                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-amber-300">
                  <span className="rounded bg-amber-500/10 px-2 py-0.5">Winning Bid: {w.amount} ETB</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
