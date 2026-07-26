'use client';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useLanguage } from '../../components/LanguageProvider';
import { Icon } from '../../components/Icons';

const api = 'https://gemet-api.onrender.com';

export default function Auction() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0D14] flex items-center justify-center text-white">Loading...</div>}>
      <AuctionInner />
    </Suspense>
  );
}

function AuctionInner() {
  const p = useParams();
  const { t } = useLanguage();
  const id = p.id as string;

  const [value, setValue] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [token, setToken] = useState('');
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'idle' | 'unique' | 'duplicate' | 'error'; text: string }>({
    kind: 'idle',
    text: 'Enter your unique bid amount below',
  });

  // 1. Authenticate with Telegram and get token + balance
  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
    const init = window.Telegram?.WebApp?.initData;
    if (!init) return;

    fetch(`${api}/auth/telegram`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData: init }),
    })
      .then(r => r.json())
      .then(x => {
        if (x.token) setToken(x.token);
        if (x.user?.balance) setBalance(x.user.balance);
      })
      .catch(() => {});
  }, []);

  // 2. Fetch the specific auction by ID
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${api}/auctions`)
      .then(r => (r.ok ? r.json() : null))
      .then(x => {
        const found = x?.auctions?.find((a: any) => a.id === id);
        if (found) setAuction(found);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // 3. WebSocket for real-time duplicate detection
  useEffect(() => {
    if (!id) return;
    const wsUrl = api.replace(/^http/, 'ws') + `/events/${id}`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = e => {
        try {
          const x = JSON.parse(e.data);
          const bidCents = Math.round(Number(value) * 100);
          if (x.amount === String(bidCents) && x.frequency > 1) {
            setNotice({ kind: 'duplicate', text: 'Someone else also bid this amount — it is now duplicated!' });
          }
        } catch {}
      };
    } catch {}
    return () => {
      try { ws?.close(); } catch {}
    };
  }, [id, value]);

  const press = (x: string | number) => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    if (x === '⌫') {
      setValue(v => v.slice(0, -1));
    } else {
      setValue(v => (v.length < 8 ? v + x : v));
    }
  };

  const submit = async () => {
    if (!value || !token) {
      setNotice({ kind: 'error', text: token ? 'Please enter a bid amount.' : 'Authentication failed — reopen the app.' });
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`${api}/bids`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ auctionId: id, amount: value }),
      });
      const x = await r.json();
      if (!r.ok) {
        setNotice({ kind: 'error', text: x.error ?? 'Bid failed. Try again.' });
      } else {
        const fee = Number(auction?.entryFee ?? 0);
        setBalance(b => (Number(b) - fee).toFixed(2));
        if (x.unique) {
          setNotice({ kind: 'unique', text: `✅ Unique bid placed: ${value} ETB` });
          window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
        } else {
          setNotice({ kind: 'duplicate', text: `⚠️ Duplicate bid: ${value} ETB — someone else bid this too!` });
          window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning');
        }
        setValue('');
      }
    } catch (e: any) {
      setNotice({ kind: 'error', text: 'Network error — check your connection.' });
    } finally {
      setSubmitting(false);
    }
  };

  const title = auction?.title ?? 'Loading auction...';
  const fee = auction?.entryFee ?? '0.00';
  const img = auction?.imageUrl || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=85';
  const bad = notice.kind === 'duplicate' || notice.kind === 'error';

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-8 pt-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 text-xs text-cyan-300">
          <Icon name="chevron" size={15} className="rotate-180" />
          {t.back}
        </Link>
        <b className="text-xs">{t.auctions}</b>
      </div>

      {/* Auction Image + Title */}
      <motion.section
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="tile overflow-hidden rounded-2xl"
      >
        <img src={img} alt={title} className="h-52 w-full object-cover" />
        <div className="p-4">
          <h1 className="m-0 text-lg font-bold">{loading ? 'Loading...' : title}</h1>
          {auction?.endTime && (
            <div className="mono mt-3 flex items-center justify-center gap-2 rounded-lg bg-cyan-500/10 py-2 text-sm text-cyan-300">
              <Icon name="clock" size={15} />
              Ends: {new Date(auction.endTime).toLocaleString()}
            </div>
          )}
        </div>
      </motion.section>

      {/* Status Banner */}
      <section className={`mt-4 rounded-xl border p-3 ${bad ? 'border-red-500/50 bg-red-950/45' : 'border-emerald-500/40 bg-emerald-950/35'}`}>
        <small className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bid Status</small>
        <AnimatePresence mode="wait">
          <motion.p
            key={notice.text}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="m-0 mt-1 text-sm font-semibold"
          >
            {notice.text}
          </motion.p>
        </AnimatePresence>
      </section>

      {/* Wallet Balance */}
      <div className="tile mt-4 flex items-center justify-between rounded-xl px-3 py-3">
        <span className="text-xs text-slate-400">{t.wallet}</span>
        <b className="mono text-sm text-cyan-300">{balance} ETB</b>
      </div>

      {/* Bid Amount Display */}
      <div className="mono my-4 flex items-center justify-center rounded-xl border border-cyan-500/50 bg-[#101722] px-3 py-4 text-4xl font-bold focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(34,211,238,0.2)]">
        <span className="min-w-[4ch] text-center text-white">{value || '0'}</span>
        <small className="ml-2 text-base text-cyan-500">ETB</small>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '⌫'].map(n => (
          <button
            key={n}
            onClick={() => press(n)}
            className="tile h-[52px] rounded-xl text-lg font-bold active:scale-95 transition-transform"
          >
            {n}
          </button>
        ))}
      </div>

      {/* Submit Button */}
      <button
        disabled={!value || submitting}
        onClick={submit}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_22px_rgba(6,182,212,.25)] disabled:opacity-50 transition-opacity"
      >
        <Icon name="plus" size={16} />
        {submitting ? 'Placing Bid...' : `${t.submit} · ${fee} ETB`}
      </button>
    </main>
  );
}
