'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BottomNav } from '../components/BottomNav';
import { useLanguage } from '../components/LanguageProvider';
import { Icon, type IconName } from '../components/Icons';
import { useTelegram } from '../components/TelegramProvider';

const api = 'https://gemet-api.onrender.com';

export default function Profile() {
  const { lang, setLang, t } = useLanguage();
  const tg = useTelegram();
  const [bidCount, setBidCount] = useState(0);

  useEffect(() => {
    if (!tg.token) return;
    fetch(`${api}/bids/history`, { headers: { authorization: `Bearer ${tg.token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(x => x?.bids && setBidCount(x.bids.length))
      .catch(() => {});
  }, [tg.token]);

  const username = tg.user?.first_name ?? tg.user?.username ?? 'Gemet Player';
  const handle = tg.user?.username ? `@${tg.user.username}` : '@gemet_player';
  const photo = tg.user?.photo_url;
  const joinedYear = new Date().getFullYear();

  const rows: [IconName, 'notifications' | 'help', string][] = [
    ['bell', 'notifications', '/notifications'],
    ['help', 'help', '/help'],
  ];

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{t.account}</p>
        <h1 className="mt-1 text-xl font-extrabold">{t.profile}</h1>
      </header>

      {/* User Card */}
      <section className="tile mt-5 rounded-2xl p-4">
        <div className="flex items-center gap-4">
          {photo ? (
            <img src={photo} alt={username} className="h-14 w-14 rounded-full border-2 border-cyan-400 object-cover" />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full border-[1.5px] border-cyan-300 bg-gradient-to-br from-cyan-300 to-blue-700 text-xl font-black text-[#0A0D14]">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <b className="block truncate text-[15px]">{username}</b>
            <span className="block truncate text-[11px] text-[#8F9CAE]">{handle}</span>
            <span className="mt-1 inline-block rounded-md bg-purple-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-300">
              {lang === 'am' ? 'ተጫዋች' : 'Bidder'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-cyan-300">{bidCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{t.totalBidsPlaced}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-amber-300">{joinedYear}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{t.joined}</p>
          </div>
        </div>
      </section>

      {/* Language Switcher */}
      <section className="tile mt-4 rounded-2xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300">
            <Icon name="settings" size={16} />
          </span>
          <b className="text-[13px]">{t.language}</b>
        </div>
        <div className="flex rounded-xl border border-white/[.08] bg-[#0E131D] p-1">
          <button
            onClick={() => setLang('en')}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${lang === 'en' ? 'bg-gradient-to-r from-[#00A3FF] to-[#00D6FF] text-[#091018]' : 'text-[#8F9CAE]'}`}
          >
            English
          </button>
          <button
            onClick={() => setLang('am')}
            className={`ethiopic flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${lang === 'am' ? 'bg-gradient-to-r from-[#00A3FF] to-[#00D6FF] text-[#091018]' : 'text-[#8F9CAE]'}`}
          >
            አማርኛ
          </button>
        </div>
      </section>

      {/* Menu Items */}
      <section className="mt-4 space-y-2">
        {rows.map(([icon, label, href]) => (
          <Link href={href} key={label} className="tile flex w-full items-center gap-3 rounded-xl p-3 text-left active:scale-[0.98] transition-transform">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#101722] text-cyan-300">
              <Icon name={icon} size={17} />
            </span>
            <span className="flex-1 text-[13px] font-semibold">{t[label]}</span>
          </Link>
        ))}
      </section>

      {/* Legal */}
      <section className="mt-4 space-y-2">
        <Link href="/privacy" className="tile flex w-full items-center gap-3 rounded-xl p-3 text-left active:scale-[0.98] transition-transform">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#101722] text-cyan-300">
            <Icon name="help" size={17} />
          </span>
          <span className="flex-1 text-[13px] font-semibold">Privacy Policy</span>
        </Link>
      </section>

      <BottomNav />
    </main>
  );
}
