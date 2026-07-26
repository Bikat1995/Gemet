'use client';
import { useState } from 'react';
import Link from 'next/link';
import { BottomNav } from '../components/BottomNav';
import { useLanguage } from '../components/LanguageProvider';
import { useTelegram } from '../components/TelegramProvider';
import { Icon } from '../components/Icons';

const api = 'https://gemet-api.onrender.com';

export default function Wallet() {
  const [amount, setAmount] = useState(250);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const tg = useTelegram();

  const deposit = async () => {
    if (!tg.token) {
      setError('Session not ready — please close and reopen the app.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${api}/payments/initialize`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${tg.token}` },
        body: JSON.stringify({ amount }),
      });
      const data = await r.json();
      if (!r.ok || !data.checkoutUrl) throw new Error(data.error ?? 'Payment setup failed');
      // Open Chapa checkout — works both inside and outside Telegram
      if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(data.checkoutUrl);
      } else {
        window.open(data.checkoutUrl, '_blank');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Show real balance from DB, or 0.00 if not loaded yet — no fake mock money
  const balance = tg.balance ?? '0.00';

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{t.account}</p>
          <h1 className="m-0 mt-1 text-xl font-extrabold">{t.wallet}</h1>
        </div>
        <Link href="/wallet/history" className="tile grid h-9 w-9 place-items-center rounded-lg text-cyan-300">
          <Icon name="history" size={18} />
        </Link>
      </header>

      {/* Balance Card */}
      <section className="tile relative mt-5 overflow-hidden rounded-2xl p-5">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/15 blur-2xl" />
        <span className="relative grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
          <Icon name="wallet" />
        </span>
        <p className="relative mb-1 mt-4 text-[11px] text-[#8F9CAE]">{t.balance}</p>
        <strong className="mono relative text-4xl tracking-tight text-white">
          {tg.ready ? balance : '…'}{' '}
          <small className="text-base text-cyan-300">ETB</small>
        </strong>
        <div className="relative mt-4 flex items-center gap-2 border-t border-white/[.08] pt-3 text-[10px] text-[#8F9CAE]">
          <span className="flex items-center gap-1 text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />Secure
          </span>
          <span>•</span>
          <span>Chapa verified</span>
        </div>
      </section>

      {/* Amount Picker */}
      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="m-0 text-[15px] font-bold">{t.choose}</h2>
          <span className="text-[10px] text-[#8F9CAE]">ETB</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[100, 250, 500].map(n => (
            <button
              key={n}
              onClick={() => setAmount(n)}
              className={`rounded-xl border py-3 text-xs font-bold ${
                amount === n
                  ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300 shadow-[0_4px_16px_rgba(0,163,255,.18)]'
                  : 'border-white/[.08] bg-[#141923] text-[#8F9CAE]'
              }`}
            >
              +{n}
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center rounded-xl border border-white/[.08] bg-[#141923] px-3">
          <span className="text-[11px] text-[#8F9CAE]">{t.custom}</span>
          <input
            className="mono ml-auto w-24 bg-transparent py-3 text-right text-sm text-white outline-none"
            value={amount}
            type="number"
            onChange={e => setAmount(Number(e.target.value))}
          />
          <b className="ml-2 text-[10px] text-cyan-300">ETB</b>
        </label>
      </section>

      {/* Payment Method Info */}
      <section className="mt-5">
        <h2 className="mb-3 text-[15px] font-bold">Deposit via Chapa</h2>
        <div className="tile flex items-center gap-3 rounded-xl p-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-500/30 bg-[#101722] text-sm font-bold text-cyan-300">C</span>
          <span className="flex-1">
            <b className="block text-xs">Chapa Secure Checkout</b>
            <small className="text-[10px] text-[#8F9CAE]">Telebirr, CBE Birr, Banks</small>
          </span>
          <Icon name="chevron" size={16} className="text-cyan-300" />
        </div>
      </section>

      {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}

      <button
        disabled={loading || !amount}
        onClick={deposit}
        className="glow mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00A3FF] to-[#00D6FF] py-3.5 text-sm font-bold text-[#071019] disabled:opacity-50"
      >
        <Icon name="plus" size={16} />
        {loading ? 'Opening Chapa…' : t.deposit}
      </button>

      <BottomNav />
    </main>
  );
}
