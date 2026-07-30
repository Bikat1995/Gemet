'use client';
import { useEffect, useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { useLanguage } from '../components/LanguageProvider';
import { Icon } from '../components/Icons';
import { useTelegram } from '../components/TelegramProvider';

type Bid = {
  id: string;
  amount: string | null;
  paymentStatus: string;
  ticketNumber: string;
  status: string;
  date: string;
  auction: { title: string; status: string; imageUrl: string };
};

function statusBadge(b: Bid) {
  if (b.paymentStatus === 'verifying') return { label: 'Verifying', color: 'text-yellow-300 bg-yellow-500/10' };
  if (b.paymentStatus === 'pending') return { label: 'Pending Payment', color: 'text-orange-300 bg-orange-500/10' };
  if (b.status === 'unique') return { label: 'Unique ✓', color: 'text-emerald-300 bg-emerald-500/10' };
  if (b.status === 'duplicated') return { label: 'Duplicated', color: 'text-red-300 bg-red-500/10' };
  return { label: b.status, color: 'text-slate-300 bg-white/5' };
}

export default function Bids() {
  const { t } = useLanguage();
  const tg = useTelegram();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    if (!tg.token) return;
    fetch(`${'https://gemet-api.onrender.com'}/bids/history`, {
      headers: { authorization: `Bearer ${tg.token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(x => x?.bids && setBids(x.bids))
      .catch(() => {});
  }, [tg.token]);

  const active = bids.filter(b =>
    b.auction.status === 'active' || b.paymentStatus === 'verifying' || b.paymentStatus === 'pending'
  );
  const history = bids.filter(b =>
    b.auction.status !== 'active' && b.paymentStatus !== 'verifying' && b.paymentStatus !== 'pending'
  );
  const visible = tab === 'active' ? active : history;

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{t.history}</p>
          <h1 className="m-0 mt-1 text-xl font-extrabold">{t.bids}</h1>
        </div>
        <button className="tile grid h-9 w-9 place-items-center rounded-lg text-cyan-300">
          <Icon name="filter" size={17} />
        </button>
      </header>

      <div className="mt-5 flex rounded-xl border border-white/[.08] bg-[#141923] p-1">
        <button
          onClick={() => setTab('active')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold ${tab === 'active' ? 'bg-gradient-to-r from-[#00A3FF] to-[#00D6FF] text-[#081018]' : 'text-[#8F9CAE]'}`}
        >
          <Icon name="bids" size={15} />{t.active} ({active.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold ${tab === 'history' ? 'bg-gradient-to-r from-[#00A3FF] to-[#00D6FF] text-[#081018]' : 'text-[#8F9CAE]'}`}
        >
          <Icon name="history" size={15} />{t.history} ({history.length})
        </button>
      </div>

      <section className="mt-6 space-y-3">
        {visible.length === 0 ? (
          <div className="tile mt-4 rounded-2xl p-8 text-center">
            <span className="grid mx-auto h-14 w-14 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5 text-cyan-300">
              <Icon name="bids" size={26} />
            </span>
            <h2 className="mb-1 mt-3 text-[15px] font-bold">{t.noBids}</h2>
            <p className="m-0 text-[11px] leading-relaxed text-[#8F9CAE]">{t.winner}</p>
          </div>
        ) : (
          visible.map(b => {
            const badge = statusBadge(b);
            return (
              <div key={b.id} className="tile flex items-center gap-4 rounded-2xl p-3 border border-white/[.05]">
                <img src={b.auction.imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-[13px] font-bold">{b.auction.title}</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{b.ticketNumber}</p>
                  <p className="text-[10px] text-slate-400">{new Date(b.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0">
                  {b.amount ? (
                    <b className="block text-sm font-bold text-amber-300">{b.amount} ETB</b>
                  ) : (
                    <b className="block text-[11px] font-bold text-slate-500">—</b>
                  )}
                  <span className={`mt-1 inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </section>
      <BottomNav />
    </main>
  );
}

