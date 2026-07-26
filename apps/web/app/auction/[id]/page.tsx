'use client';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const id = p.id as string;

  const [value, setValue] = useState('');
  const [token, setToken] = useState('');
  const [auction, setAuction] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [notice, setNotice] = useState<{ kind: 'idle' | 'unique' | 'duplicate' | 'error' | 'success'; text: string }>({
    kind: 'idle',
    text: '',
  });

  // 1. Authenticate with Telegram and get token
  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
    const init = window.Telegram?.WebApp?.initData;
    if (!init) {
      setLoading(false);
      return;
    }

    fetch(`${api}/auth/telegram`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData: init }),
    })
      .then(r => r.json())
      .then(x => {
        if (x.token) setToken(x.token);
      })
      .catch(() => setLoading(false));
  }, []);

  // 2. Fetch the specific auction and user's ticket status
  useEffect(() => {
    if (!id) return;
    
    const fetchAuction = fetch(`${api}/auctions`).then(r => r.ok ? r.json() : null);
    
    if (token) {
      setLoading(true);
      const fetchTicket = fetch(`${api}/auctions/${id}/ticket`, {
        headers: { authorization: `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : null);

      Promise.all([fetchAuction, fetchTicket])
        .then(([aData, tData]) => {
          const found = aData?.auctions?.find((a: any) => a.id === id);
          if (found) setAuction(found);
          if (tData?.ticket) setTicket(tData.ticket);
        })
        .finally(() => setLoading(false));
    } else {
      // Fetch just auction if not authenticated yet
      fetchAuction.then(aData => {
        const found = aData?.auctions?.find((a: any) => a.id === id);
        if (found) setAuction(found);
      }).finally(() => setLoading(false));
    }
  }, [id, token]);

  // 3. WebSocket for real-time duplicate detection (only active when placing bid)
  useEffect(() => {
    if (!id || ticket?.amount != null) return;
    
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
  }, [id, value, ticket]);

  const payEntryFee = async () => {
    if (!token) {
      setNotice({ kind: 'error', text: 'Authentication failed. Please reopen the app.' });
      return;
    }
    setSubmitting(true);
    setNotice({ kind: 'idle', text: 'Opening payment...' });
    try {
      const r = await fetch(`${api}/auctions/${id}/pay`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` }
      });
      const data = await r.json();
      if (!r.ok || !data.checkoutUrl) throw new Error(data.error ?? 'Payment setup failed');
      
      const tgApp = window.Telegram?.WebApp;
      if (tgApp?.openLink) {
        tgApp.openLink(data.checkoutUrl, { try_instant_view: false });
      } else {
        window.open(data.checkoutUrl, '_blank');
      }
    } catch (e: any) {
      setNotice({ kind: 'error', text: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const press = (x: string | number) => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    if (x === '⌫') {
      setValue(v => v.slice(0, -1));
    } else {
      setValue(v => (v.length < 8 ? v + x : v));
    }
  };

  const submitBid = async () => {
    if (!value || !token) return;
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
        setTicket({ ...ticket, amount: x.amount, ticketNumber: x.ticketNumber });
        if (x.unique) {
          setNotice({ kind: 'unique', text: `✅ Unique bid placed: ${value} ETB` });
          window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
        } else {
          setNotice({ kind: 'duplicate', text: `⚠️ Duplicate bid: ${value} ETB — someone else bid this too!` });
          window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning');
        }
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
  
  // Determine view state
  const hasPaid = ticket?.paymentStatus === 'success';
  const hasBid = ticket?.amount != null;
  
  let noticeColor = 'border-slate-500/40 bg-slate-950/35';
  if (notice.kind === 'error') noticeColor = 'border-red-500/50 bg-red-950/45';
  if (notice.kind === 'duplicate') noticeColor = 'border-orange-500/50 bg-orange-950/45';
  if (notice.kind === 'unique' || notice.kind === 'success') noticeColor = 'border-emerald-500/40 bg-emerald-950/35';

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
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

      {notice.text && (
        <section className={`mt-4 rounded-xl border p-3 ${noticeColor}`}>
          <AnimatePresence mode="wait">
            <motion.p
              key={notice.text}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="m-0 text-sm font-semibold"
            >
              {notice.text}
            </motion.p>
          </AnimatePresence>
        </section>
      )}

      {loading ? (
        <div className="mt-10 text-center text-slate-500">Loading auction status...</div>
      ) : hasBid ? (
        // --- STATE: COMPLETED BID ---
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
          <div className="tile relative overflow-hidden rounded-2xl p-6 text-center border border-cyan-500/30">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/15 blur-2xl" />
            <Icon name="ticket" size={40} className="mx-auto text-cyan-400 mb-3" />
            <h2 className="text-lg font-bold text-white mb-1">Your Ticket</h2>
            <p className="text-xs text-slate-400 mb-4">Proof of participation</p>
            
            <div className="mono text-3xl font-black text-cyan-300 mb-2">{ticket.amount} <span className="text-sm">ETB</span></div>
            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Your Bid Amount</div>
            
            <div className="mt-6 pt-4 border-t border-white/10 border-dashed">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Ticket ID</div>
              <div className="mono text-lg font-bold text-white">{ticket.ticketNumber}</div>
            </div>
          </div>
          <Link href="/tickets" className="block w-full text-center py-3 rounded-xl bg-[#141923] text-cyan-300 font-semibold border border-white/5">
            View All Tickets
          </Link>
        </motion.div>
      ) : hasPaid ? (
        // --- STATE: PAID, NEEDS BID ---
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mt-6 mb-2">
            <h2 className="text-lg font-bold">Payment Confirmed!</h2>
            <p className="text-sm text-slate-400">Enter your unique bid amount</p>
          </div>
          
          <div className="mono my-4 flex items-center justify-center rounded-xl border border-cyan-500/50 bg-[#101722] px-3 py-4 text-4xl font-bold focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <span className="min-w-[4ch] text-center text-white">{value || '0'}</span>
            <small className="ml-2 text-base text-cyan-500">ETB</small>
          </div>

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

          <button
            disabled={!value || submitting}
            onClick={submitBid}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_22px_rgba(6,182,212,.25)] disabled:opacity-50 transition-opacity"
          >
            <Icon name="ticket" size={18} />
            {submitting ? 'Submitting...' : `Submit Ticket`}
          </button>
        </motion.div>
      ) : (
        // --- STATE: NOT ENTERED ---
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
          <div className="tile p-6 rounded-2xl mb-4">
            <Icon name="ticket" size={32} className="mx-auto text-cyan-400 mb-3" />
            <h2 className="text-lg font-bold mb-2">Buy a Ticket to Enter</h2>
            <p className="text-sm text-slate-400 mb-4">
              Pay the entry fee to secure your ticket. Once paid, you can submit your lowest unique bid!
            </p>
            <div className="text-2xl font-black text-white">{fee} <span className="text-sm text-cyan-500">ETB</span></div>
          </div>
          
          <button
            disabled={submitting || ticket?.paymentStatus === 'pending'}
            onClick={payEntryFee}
            className="glow flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_22px_rgba(16,185,129,.25)] disabled:opacity-50"
          >
            {submitting ? 'Connecting...' : ticket?.paymentStatus === 'pending' ? 'Payment Pending...' : `Pay Entry Fee via Chapa`}
          </button>
          
          {ticket?.paymentStatus === 'pending' && (
            <p className="text-xs text-orange-400 mt-3">Waiting for Chapa confirmation... you can try paying again if it failed.</p>
          )}
        </motion.div>
      )}
    </main>
  );
}
