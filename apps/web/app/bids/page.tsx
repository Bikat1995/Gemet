'use client';
import { useEffect, useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { useLanguage } from '../components/LanguageProvider';
import { Icon } from '../components/Icons';
import { useTelegram } from '../components/TelegramProvider';

const api = 'https://gemet-api.onrender.com';

type Auction = {
  id: string;
  title: string;
  imageUrl: string;
  status: string;
  entryFee: string;
  endTime: string;
  category: string;
};

type Bidder = {
  id: string;
  phone: string;
  date: string;
};

type LeaderboardData = {
  totalBids: number;
  bidders: Bidder[];
};

export default function Bids() {
  const { t, lang } = useLanguage();
  const tg = useTelegram();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selected, setSelected] = useState<Auction | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lbLoading, setLbLoading] = useState(false);

  useEffect(() => {
    const fetchAuctions = () =>
      fetch(`${api}/auctions`)
        .then(r => r.ok ? r.json() : null)
        .then(x => { if (x?.auctions) setAuctions(x.auctions); })
        .catch(() => {});

    setLoading(true);
    fetch(`${api}/auctions`)
      .then(r => r.ok ? r.json() : null)
      .then(x => x?.auctions && setAuctions(x.auctions))
      .catch(() => {})
      .finally(() => setLoading(false));

    const interval = setInterval(fetchAuctions, 30000);
    return () => clearInterval(interval);
  }, []);

  const openLeaderboard = async (auction: Auction) => {
    setSelected(auction);
    setLbLoading(true);
    setLeaderboard(null);
    try {
      const r = await fetch(`${api}/auctions/${auction.id}/bidders`);
      if (r.ok) setLeaderboard(await r.json());
    } catch (_) {}
    setLbLoading(false);
  };

  const timeLeft = (endTime: string) => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return lang === 'am' ? 'ጨረታ አብቅቷል' : 'Ended';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    return `${h}h ${m}m`;
  };

  const catColor = (c: string) => {
    const map: Record<string, string> = { electronics: 'text-cyan-400 bg-cyan-400/10', vehicles: 'text-emerald-400 bg-emerald-400/10', property: 'text-violet-400 bg-violet-400/10', other: 'text-amber-400 bg-amber-400/10' };
    return map[c?.toLowerCase()] ?? 'text-slate-400 bg-slate-400/10';
  };

  // Leaderboard modal
  if (selected) {
    return (
      <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
        <header className="flex items-center gap-3 mb-6">
          <button onClick={() => { setSelected(null); setLeaderboard(null); }} className="tile h-9 w-9 grid place-items-center rounded-xl text-cyan-300">
            <Icon name="back" size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">{t.leaderboard}</p>
            <h1 className="text-lg font-extrabold truncate">{selected.title}</h1>
          </div>
        </header>

        <div className="tile rounded-2xl p-5 mb-4 flex items-center justify-between border border-white/[.06]">
          <div>
            <p className="text-[11px] text-slate-400">{t.totalBids}</p>
            <p className="text-4xl font-black text-cyan-300">{lbLoading ? '…' : (leaderboard?.totalBids ?? 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-400">{lang === 'am' ? 'ቀሪ ጊዜ' : 'Time left'}</p>
            <p className="text-xl font-bold text-amber-300">{timeLeft(selected.endTime)}</p>
          </div>
        </div>

        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">{t.bidders}</h2>

        {lbLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => <div key={i} className="tile rounded-xl h-12 animate-pulse" />)}
          </div>
        ) : !leaderboard || leaderboard.bidders.length === 0 ? (
          <div className="tile rounded-2xl p-8 text-center">
            <span className="grid mx-auto h-14 w-14 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 mb-3">
              <Icon name="bids" size={26} />
            </span>
            <p className="text-sm text-slate-400">{t.noBidders}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.bidders.map((b, i) => (
              <div key={b.id} className="tile flex items-center gap-4 rounded-xl px-4 py-3 border border-white/[.04]">
                <span className={`text-sm font-black w-6 text-center ${i === 0 ? 'text-amber-300' : 'text-slate-500'}`}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-mono text-sm text-white font-bold">{b.phone}</p>
                  <p className="text-[10px] text-slate-500">{new Date(b.date).toLocaleDateString()}</p>
                </div>
                {i === 0 && <span className="text-xs">🥇</span>}
              </div>
            ))}
          </div>
        )}
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
      <header className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{t.liveNow}</p>
        <h1 className="text-xl font-extrabold mt-1">{t.bids}</h1>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="tile rounded-2xl h-20 animate-pulse" />)}
        </div>
      ) : auctions.length === 0 ? (
        <div className="tile rounded-2xl p-8 text-center mt-4">
          <span className="grid mx-auto h-14 w-14 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 mb-3">
            <Icon name="bids" size={26} />
          </span>
          <p className="text-sm text-slate-400">{lang === 'am' ? 'ቀጥታ ጨረታ የለም' : 'No live auctions right now'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {auctions.map(a => {
            const isEnded = new Date(a.endTime).getTime() <= Date.now();
            return (
            <button
              key={a.id}
              onClick={() => { if (!isEnded) openLeaderboard(a); }}
              className={`tile relative w-full flex items-center gap-4 rounded-2xl p-3 border border-white/[.05] text-left transition-transform overflow-hidden ${isEnded ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'}`}
            >
              {isEnded && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                  <div className="absolute top-3 -right-10 w-32 rotate-45 bg-red-600/90 text-white text-[8px] font-black tracking-widest text-center py-1 shadow-lg backdrop-blur-sm">
                    {t.auctionEnded}
                  </div>
                </div>
              )}
              <div className="relative shrink-0">
                <img src={a.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover mix-blend-luminosity opacity-90" />
                <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-[#0E131D] ${isEnded ? 'bg-red-500' : 'bg-emerald-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[14px] truncate">{a.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${catColor(a.category)}`}>
                  {a.category}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">⏱ {timeLeft(a.endTime)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-400">{t.fee}</p>
                <p className="text-sm font-bold text-amber-300">{a.entryFee} ETB</p>
                {!isEnded && (
                  <span className="text-[10px] text-cyan-300 mt-1 flex items-center gap-1 justify-end">
                    {t.viewBidders} <Icon name="chevron-right" size={12} />
                  </span>
                )}
              </div>
            </button>
            );
          })}
        </div>
      )}
      <BottomNav />
    </main>
  );
}
