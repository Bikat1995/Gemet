'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from './components/BottomNav';
import { useLanguage } from './components/LanguageProvider';
import { useTelegram } from './components/TelegramProvider';
import { Icon } from './components/Icons';
import { PromoArt } from './components/PromoArt';

type Auction = { id: string; title: string; description: string; imageUrl: string; entryFee: string; endTime: string; category: string };

const CATEGORIES = ['All', 'Electronics', 'Vehicles', 'Property', 'Other'];

function Countdown({ until }: { until: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const n = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(n); }, []);
  const v = Math.max(0, new Date(until).getTime() - now);
  return <span className="mono">{String(Math.floor(v / 36e5)).padStart(2, '0')}:{String(Math.floor(v / 6e4) % 60).padStart(2, '0')}:{String(Math.floor(v / 1000) % 60).padStart(2, '0')}</span>;
}

export default function Home() {
  const [auctions, setAuctions] = useState<Auction[] | null>(null);
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [clickedId, setClickedId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { lang, setLang, t } = useLanguage();
  const tg = useTelegram();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch auctions whenever category changes, then auto-refresh every 20s
  useEffect(() => {
    const catParam = cat === 'All' ? '' : `&category=${encodeURIComponent(cat)}`;
    const fetchAuctions = () =>
      fetch(`https://gemet-api.onrender.com/auctions?${catParam}`)
        .then(r => r.ok ? r.json() : null)
        .then(x => { if (x?.auctions) setAuctions(x.auctions); })
        .catch(() => {});

    setAuctions(null); // show spinner only on first load / category change
    fetch(`https://gemet-api.onrender.com/auctions?${catParam}`)
      .then(r => r.ok ? r.json() : null)
      .then(x => setAuctions(x?.auctions ?? []))
      .catch(() => setAuctions([]));

    const interval = setInterval(fetchAuctions, 5000);
    return () => clearInterval(interval);
  }, [cat]);

  // Fetch unread notifications count
  useEffect(() => {
    if (!tg.token) return;
    fetch('https://gemet-api.onrender.com/notifications', {
      headers: { authorization: `Bearer ${tg.token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(x => {
        if (x?.notifications) setUnreadCount(x.notifications.filter((n: any) => !n.read).length);
      })
      .catch(() => {});
  }, [tg.token]);

  const name = tg.user?.first_name ?? 'Gemet Player';
  const initial = name.slice(0, 1).toUpperCase();

  const toggleTheme = () => {
    const nt = theme === 'dark' ? 'light' : 'dark';
    setTheme(nt);
    document.documentElement.setAttribute('data-theme', nt);
    document.body.setAttribute('data-theme', nt);
  };

  // Client-side filter by search term
  const filtered = auctions?.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  ) ?? null;

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border-[1.5px] border-cyan-300 bg-gradient-to-br from-cyan-300 to-blue-600 text-xs font-extrabold text-[#0A0D14]">
            {tg.user?.photo_url ? <img src={tg.user.photo_url} alt="" className="h-full w-full object-cover" /> : initial}
          </div>
          <div>
            <b className="block max-w-28 truncate text-[13px]">{name}</b>
            <span className="mono text-[10px] text-slate-400">✦ {tg.balance ?? '0.00'} ETB</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLang(lang === 'en' ? 'am' : 'en')}
            className="tile grid h-9 w-9 place-items-center rounded-lg text-[10px] font-bold text-cyan-300 active:scale-95 transition-transform"
          >
            {lang === 'en' ? 'አማ' : 'EN'}
          </button>
          <Link href="/notifications" className="tile relative grid h-9 w-9 place-items-center rounded-lg text-slate-300 active:scale-95 transition-transform">
            <Icon name="bell" size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-red-500 text-white text-[9px] font-black grid place-items-center px-1 leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <button
            onClick={toggleTheme}
            className="tile grid h-9 w-9 place-items-center rounded-lg text-slate-300 active:scale-95 transition-transform"
          >
            <span className="text-sm">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </header>

      {/* Hero banner */}
      <section className="relative mt-5 min-h-32 overflow-hidden rounded-2xl bg-[linear-gradient(125deg,#172a85,#005acf_56%,#00b9e6)] p-4">
        <PromoArt />
        <p className="relative m-0 text-[11px] font-semibold text-blue-100">{t.featured}</p>
        <h1 className="relative mb-1 mt-1 max-w-[58%] text-[21px] font-extrabold leading-tight text-white">{t.ourWinners}</h1>
        <p className="relative mb-3 max-w-[55%] text-[10px] leading-snug text-blue-100">{t.ourWinnersDesc}</p>
        <Link href="/winners" className="relative inline-block rounded-lg bg-white/20 px-3 py-1.5 text-[10px] font-semibold text-white active:scale-95 transition-transform">
          {t.details} <Icon name="arrow" size={11} className="ml-1 inline" />
        </Link>
      </section>

      {/* Category chips */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(c => (
          <motion.button
            key={c}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCat(c)}
            className={`chip shrink-0 transition-all duration-150 ${cat === c ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : ''}`}
          >
            {c}
          </motion.button>
        ))}
      </div>

      {/* Search bar */}
      <div
        className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-[#141923] px-3 py-3 transition-all duration-200 focus-within:border-cyan-500/60 focus-within:shadow-[0_0_14px_rgba(34,211,238,0.12)] cursor-text"
        onClick={() => searchRef.current?.focus()}
      >
        <Icon name="search" size={16} className="text-slate-500 shrink-0" />
        <input
          ref={searchRef}
          type="text"
          placeholder={t.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-[13px] outline-none text-inherit placeholder:text-slate-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white transition-colors shrink-0">
            ✕
          </button>
        )}
      </div>

      {/* Section header */}
      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-[16px] font-bold">{t.live}</h2>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-cyan-300">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
          {t.liveNow}
        </span>
      </div>

      {/* Auction grid */}
      <section className="mt-3 grid grid-cols-2 gap-3">
        {filtered === null ? (
          <div className="col-span-2 py-10 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 py-12 text-center">
            <p className="text-sm text-slate-500">No live auctions{search ? ` matching "${search}"` : ' right now'}.</p>
          </div>
        ) : (
          filtered.map((a, i) => {
            const isEnded = new Date(a.endTime).getTime() <= Date.now();
            return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: isEnded ? 1 : 0.94 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => {
                if (isEnded) return;
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                setClickedId(a.id);
                router.push(`/auction/${a.id}`);
              }}
              className={`tile overflow-hidden rounded-[14px] p-2 relative ${isEnded ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isEnded && (
                <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-[14px]">
                  <div className="absolute top-4 -right-12 w-40 rotate-45 bg-red-600/90 text-white text-[9px] font-black tracking-widest text-center py-1 shadow-lg backdrop-blur-sm">
                    {t.auctionEnded}
                  </div>
                </div>
              )}
              <div className="product-frame relative aspect-square rounded-[10px]">
                <img src={a.imageUrl} alt={a.title} className="h-full w-full object-cover mix-blend-luminosity opacity-90" />
                <span className="absolute bottom-2 left-2 rounded-md bg-black/65 px-1.5 py-1 text-[10px] text-amber-300">
                  <Icon name="clock" size={11} className="mr-1 inline" />
                  <Countdown until={a.endTime} />
                </span>
                {a.category && (
                  <span className="absolute top-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wide">
                    {a.category}
                  </span>
                )}
              </div>
              <div className="px-0.5 pb-1 pt-2">
                <h3 className="truncate text-[13px] font-bold">{a.title}</h3>
                <p className="mb-2 mt-0.5 truncate text-[10px] text-slate-500">{a.description}</p>
                <div className="flex items-center gap-1">
                  <span className="flex-1 rounded-md bg-gradient-to-r from-[#00A3FF] to-[#00D6FF] px-1.5 py-1.5 text-center text-[10px] font-bold text-[#06101b]">
                    {a.entryFee} ETB
                  </span>
                  <span className="grid h-7 w-7 place-items-center rounded-md border border-black/10 bg-black/20 text-cyan-500">
                    <Icon name="arrow" size={13} />
                  </span>
                </div>
              </div>
              <AnimatePresence>
                {clickedId === a.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm grid place-items-center z-10 rounded-[14px]"
                  >
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            );
          })
        )}
      </section>
      <BottomNav />
    </main>
  );
}
