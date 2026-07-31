'use client';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useLanguage } from '../../components/LanguageProvider';
import { Icon } from '../../components/Icons';

const api = 'https://gemet-api.onrender.com';

// Payment methods config
const PAYMENT_METHODS = [
  {
    id: 'telebirr_1',
    name: 'Telebirr',
    phone: '0969485212',
    logo: (
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-7">
        <text x="2" y="28" fontFamily="Arial" fontWeight="bold" fontSize="20" fill="#00ADEF">tele</text>
        <text x="44" y="28" fontFamily="Arial" fontWeight="bold" fontSize="20" fill="#E87722">birr</text>
      </svg>
    ),
    color: '#00ADEF',
    bg: 'rgba(0, 173, 239, 0.08)',
    border: 'rgba(0, 173, 239, 0.3)',
  },
  {
    id: 'telebirr_2',
    name: 'Telebirr',
    phone: '0900042739',
    logo: (
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-7">
        <text x="2" y="28" fontFamily="Arial" fontWeight="bold" fontSize="20" fill="#00ADEF">tele</text>
        <text x="44" y="28" fontFamily="Arial" fontWeight="bold" fontSize="20" fill="#E87722">birr</text>
      </svg>
    ),
    color: '#00ADEF',
    bg: 'rgba(0, 173, 239, 0.08)',
    border: 'rgba(0, 173, 239, 0.3)',
  },
  {
    id: 'cbe_birr',
    name: 'CBE Birr',
    phone: '0969485212',
    logo: (
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-7">
        <text x="2" y="20" fontFamily="Arial" fontWeight="bold" fontSize="11" fill="#888">CBE</text>
        <text x="2" y="34" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="#F7941D">Birr</text>
      </svg>
    ),
    color: '#F7941D',
    bg: 'rgba(247, 148, 29, 0.08)',
    border: 'rgba(247, 148, 29, 0.3)',
  },
];

const TIMER_SECONDS = 15 * 60; // 15 minutes

export default function Auction() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0D14] flex items-center justify-center text-white">Loading...</div>}>
      <AuctionInner />
    </Suspense>
  );
}

function CountdownTimer({ startedAt }: { startedAt: number }) {
  const [remaining, setRemaining] = useState(TIMER_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, TIMER_SECONDS - elapsed);
      setRemaining(left);
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');
  const pct = remaining / TIMER_SECONDS;
  const color = pct > 0.4 ? '#22d3ee' : pct > 0.15 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex items-center gap-2 text-sm" style={{ color }}>
      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray={`${pct * 62.8} 62.8`} strokeLinecap="round" />
      </svg>
      <span>We're waiting for your transfer:</span>
      <span className="font-mono font-bold">{mins}:{secs}</span>
    </div>
  );
}

function CopyRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all active:scale-[0.98]"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <span className="text-xl">{icon}</span>
      <div className="flex-1 text-left">
        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</div>
        <div className="font-mono font-semibold text-white text-sm">{value}</div>
      </div>
      <span className="text-xs" style={{ color: copied ? '#22d3ee' : '#64748b' }}>
        {copied ? '✓ Copied' : '⎘ Copy'}
      </span>
    </button>
  );
}

function AuctionInner() {
  const p = useParams();
  const { t } = useLanguage();
  const id = p.id as string;

  const [value, setValue] = useState('');
  const [token, setToken] = useState('');
  const [auction, setAuction] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Payment modal state: 'none' | 'select' | 'details'
  const [payModal, setPayModal] = useState<'none' | 'select' | 'details'>('none');
  const [selectedMethod, setSelectedMethod] = useState<typeof PAYMENT_METHODS[0] | null>(null);
  const [txInput, setTxInput] = useState('');
  const [timerStart, setTimerStart] = useState(0);
  const [txError, setTxError] = useState('');

  const [notice, setNotice] = useState<{ kind: 'idle' | 'unique' | 'duplicate' | 'error' | 'success'; text: string }>({
    kind: 'idle',
    text: '',
  });

  // Polling interval ref for verifying state
  const pollRef = useRef<any>(null);

  // Authenticate
  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
    const init = window.Telegram?.WebApp?.initData;
    if (!init) { setLoading(false); return; }
    fetch(`${api}/auth/telegram`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData: init }),
    }).then(r => r.json()).then(x => { if (x.token) setToken(x.token); }).catch(() => setLoading(false));
  }, []);

  // Fetch auction + ticket
  useEffect(() => {
    if (!id) return;
    const fetchAuction = fetch(`${api}/auctions`).then(r => r.ok ? r.json() : null);
    if (token) {
      setLoading(true);
      const fetchTicket = fetch(`${api}/auctions/${id}/ticket`, { headers: { authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null);
      Promise.all([fetchAuction, fetchTicket])
        .then(([aData, tData]) => {
          const found = aData?.auctions?.find((a: any) => a.id === id);
          if (found) setAuction(found);
          if (tData?.ticket) setTicket(tData.ticket);
        })
        .finally(() => setLoading(false));
    } else {
      fetchAuction.then(aData => {
        const found = aData?.auctions?.find((a: any) => a.id === id);
        if (found) setAuction(found);
      }).finally(() => setLoading(false));
    }
  }, [id, token]);

  // Poll when in verifying state
  useEffect(() => {
    if (ticket?.paymentStatus === 'verifying' && token) {
      pollRef.current = setInterval(async () => {
        const r = await fetch(`${api}/auctions/${id}/ticket`, { headers: { authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (d?.ticket?.paymentStatus === 'success') {
          setTicket(d.ticket);
          clearInterval(pollRef.current);
        } else if (d?.ticket?.paymentStatus === 'failed') {
          setTicket(d.ticket);
          clearInterval(pollRef.current);
        }
      }, 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [ticket?.paymentStatus, token]);


  const openPayModal = () => {
    setPayModal('select');
    setSelectedMethod(null);
    setTxInput('');
    setTxError('');
  };

  const selectProvider = (method: typeof PAYMENT_METHODS[0]) => {
    setSelectedMethod(method);
    setTimerStart(Date.now());
    setPayModal('details');
  };

  const submitPayment = async () => {
    if (!txInput.trim()) { setTxError('Please enter your Transaction ID.'); return; }
    if (!token) { setTxError('Authentication failed. Reopen the app.'); return; }
    setSubmitting(true);
    setTxError('');
    try {
      const r = await fetch(`${api}/auctions/${id}/manual-pay/submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ txId: txInput.trim(), paymentMethod: selectedMethod?.id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Submission failed');
      // Update ticket locally to verifying
      setTicket((prev: any) => ({ ...(prev ?? {}), paymentStatus: 'verifying', txRef: txInput.trim(), paymentMethod: selectedMethod?.id }));
      setPayModal('none');
    } catch (e: any) {
      setTxError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const press = (x: string | number) => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    if (x === '⌫') { setValue(v => v.slice(0, -1)); }
    else if (x === 'C') { setValue(''); }
    else { setValue(v => (v.length < 8 ? v + x : v)); }
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
        setNotice({ kind: 'success', text: `✅ ${t.bidSubmitted}: ${value} ETB` });
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      }
    } catch {
      setNotice({ kind: 'error', text: 'Network error — check your connection.' });
    } finally {
      setSubmitting(false);
    }
  };

  const title = auction?.title ?? 'Loading auction...';
  const fee = auction?.entryFee ?? '0.00';
  const img = auction?.imageUrl || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=85';

  const hasPaid = ticket?.paymentStatus === 'success';
  const isVerifying = ticket?.paymentStatus === 'verifying';
  const hasBid = ticket?.amount != null;
  const wasFailed = ticket?.paymentStatus === 'failed';

  let noticeColor = 'border-slate-500/40 bg-slate-950/35';
  if (notice.kind === 'error') noticeColor = 'border-red-500/50 bg-red-950/45';
  if (notice.kind === 'duplicate') noticeColor = 'border-orange-500/50 bg-orange-950/45';
  if (notice.kind === 'unique' || notice.kind === 'success') noticeColor = 'border-emerald-500/40 bg-emerald-950/35';

  return (
    <>
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
        <motion.section initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="tile overflow-hidden rounded-2xl">
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
              <motion.p key={notice.text} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="m-0 text-sm font-semibold">
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
            <div className="flex flex-col gap-3">
              <button onClick={() => { setTicket(null); setNotice({ kind: 'idle', text: '' }); }} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-[0_0_22px_rgba(6,182,212,.25)] active:scale-95 transition-all">
                Place Another Bid
              </button>
              <Link href="/bids" className="block w-full text-center py-3 rounded-xl bg-[#141923] text-cyan-300 font-semibold border border-white/5 active:scale-95 transition-all">
                View My Bids
              </Link>
            </div>
          </motion.div>
        ) : hasPaid ? (
          // --- STATE: PAID, NEEDS BID ---
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mt-6 mb-2">
              <h2 className="text-lg font-bold">Payment Confirmed! 🎉</h2>
              <p className="text-sm text-slate-400">Enter your unique bid amount</p>
            </div>

            <div className="mono my-4 flex items-center justify-center rounded-xl border border-cyan-500/50 bg-[#101722] px-3 py-4 text-4xl font-bold">
              <span className="min-w-[4ch] text-center text-white">{value || '0'}</span>
              <small className="ml-2 text-base text-cyan-500">ETB</small>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map(n => (
                <button key={n} onClick={() => press(n)} className="tile h-[52px] rounded-xl text-lg font-bold active:scale-95 transition-transform">{n}</button>
              ))}
            </div>

            <button
              disabled={!value || submitting}
              onClick={submitBid}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_22px_rgba(6,182,212,.25)] disabled:opacity-50 transition-opacity"
            >
              <Icon name="ticket" size={18} />
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </motion.div>
        ) : isVerifying ? (
          // --- STATE: AWAITING ADMIN APPROVAL ---
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <div className="tile rounded-2xl p-6 text-center border border-amber-500/20">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(251, 191, 36, 0.1)' }}>
                <svg className="w-8 h-8 animate-pulse text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Verifying Payment</h2>
              <p className="text-sm text-slate-400 mb-5">Your transaction is being reviewed by our team. This usually takes a few minutes.</p>
              <div className="rounded-xl p-3 text-left space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Payment method</span>
                  <span className="text-slate-300 capitalize">{ticket?.paymentMethod?.replace('_', ' ') ?? '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="text-slate-300 font-mono">{ticket?.txRef ?? '—'}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-4">We'll notify you once your payment is confirmed.</p>
            </div>
          </motion.div>
        ) : wasFailed ? (
          // --- STATE: PAYMENT REJECTED ---
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <div className="tile rounded-2xl p-6 text-center border border-red-500/20">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Payment Rejected</h2>
              <p className="text-sm text-slate-400 mb-5">Your transaction ID was invalid. Please double-check and try again.</p>
              <button onClick={openPayModal} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 py-3.5 text-sm font-bold text-white">
                Try Again
              </button>
            </div>
          </motion.div>
        ) : (
          // --- STATE: NOT ENTERED ---
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
            <div className="tile p-6 rounded-2xl mb-4">
              <Icon name="ticket" size={32} className="mx-auto text-cyan-400 mb-3" />
              <h2 className="text-lg font-bold mb-2">Pay Entry Fee to Bid</h2>
              <p className="text-sm text-slate-400 mb-4">Pay the entry fee via Telebirr or CBE Birr. Once confirmed, you can place your unique bid!</p>
              <div className="text-2xl font-black text-white">{fee} <span className="text-sm text-cyan-500">ETB</span></div>
            </div>
            <button
              onClick={openPayModal}
              className="glow flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_22px_rgba(16,185,129,.25)]"
            >
              Pay Entry Fee
            </button>
          </motion.div>
        )}
      </main>

      {/* ── Payment Modal ── */}
      <AnimatePresence>
        {payModal !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setPayModal('none'); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-md rounded-t-3xl overflow-hidden"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                {payModal === 'details' ? (
                  <button onClick={() => setPayModal('select')} className="flex items-center gap-1 text-sm text-cyan-400">
                    <Icon name="chevron" size={15} className="rotate-180" />
                    Back
                  </button>
                ) : (
                  <span className="text-base font-bold text-white">Pay Entry Fee</span>
                )}
                <button onClick={() => setPayModal('none')} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
              </div>

              {payModal === 'select' && (
                <div className="px-5 pb-8">
                  <p className="text-xs text-slate-400 mb-5">Select a payment method to continue</p>
                  {/* Amount banner */}
                  <div className="rounded-xl px-4 py-3 mb-5 flex items-center justify-between" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}>
                    <span className="text-sm text-slate-400">Amount</span>
                    <span className="font-mono font-bold text-cyan-300 text-lg">{fee} ETB</span>
                  </div>
                  {/* Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => selectProvider(m)}
                        className="flex flex-col items-center justify-center gap-2 rounded-2xl py-5 px-3 transition-all active:scale-95"
                        style={{ background: m.bg, border: `1px solid ${m.border}` }}
                      >
                        {m.logo}
                        <span className="text-xs text-slate-400">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {payModal === 'details' && selectedMethod && (
                <div className="px-5 pb-8 space-y-5">
                  {/* Provider header */}
                  <div className="flex items-center gap-3">
                    {selectedMethod.logo}
                    <span className="font-bold text-white">{selectedMethod.name}</span>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-1">
                    <p className="text-sm text-slate-300">1. Send funds to the following recipient</p>
                    <p className="text-sm text-slate-300">2. After payment, enter the transaction ID below or the payment will not be credited</p>
                  </div>

                  {/* Step 1: Copy details */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">1. Copy payment details</p>
                    <div className="space-y-2">
                      <CopyRow label="Recipient's phone number" value={selectedMethod.phone} icon="📞" />
                      <CopyRow label="Amount" value={`ETB ${fee}`} icon="💰" />
                    </div>
                  </div>

                  {/* Step 2: Transaction ID */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">2. Enter payment details</p>
                    <input
                      type="text"
                      value={txInput}
                      onChange={e => { setTxInput(e.target.value); setTxError(''); }}
                      placeholder="Transaction ID (e.g. DXXXXXXXXX)"
                      className="w-full rounded-xl px-4 py-3 text-sm font-mono text-white outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: txError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)' }}
                    />
                    {txError && <p className="text-xs text-red-400 mt-1">{txError}</p>}
                  </div>

                  {/* Countdown */}
                  <CountdownTimer startedAt={timerStart} />

                  {/* Confirm button */}
                  <button
                    onClick={submitPayment}
                    disabled={submitting || !txInput.trim()}
                    className="flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(to right, #22c55e, #16a34a)', color: '#fff' }}
                  >
                    {submitting ? 'Submitting...' : 'Confirm Transfer'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
