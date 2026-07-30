'use client';
import Link from 'next/link';
import { useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { useLanguage } from '../components/LanguageProvider';
import { Icon } from '../components/Icons';

type Toggle = { id: string; label: string; desc: string; value: boolean };

export default function Settings() {
  const { lang, setLang, t } = useLanguage();
  const [toggles, setToggles] = useState<Toggle[]>([
    { id: 'notifications', label: 'Push Notifications', desc: 'Receive alerts for auction results', value: true },
    { id: 'sounds', label: 'Sound Effects', desc: 'Haptic and audio feedback on bids', value: true },
    { id: 'countdown', label: 'Countdown Alerts', desc: 'Alert when auction ends in 5 min', value: false },
  ]);

  const flip = (id: string) =>
    setToggles(prev => prev.map(t => t.id === id ? { ...t, value: !t.value } : t));

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/profile" className="tile grid h-9 w-9 place-items-center rounded-xl text-cyan-300">
          <Icon name="chevron" size={16} className="rotate-180" />
        </Link>
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{t.account}</p>
          <h1 className="m-0 text-xl font-extrabold">{t.settings}</h1>
        </div>
      </header>

      {/* Language */}
      <section className="tile rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300">
            <Icon name="settings" size={16} />
          </span>
          <b className="text-[13px]">{t.language}</b>
        </div>
        <div className="flex rounded-xl border border-white/[.08] bg-[#0E131D] p-1">
          <button
            onClick={() => setLang('en')}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold ${lang === 'en' ? 'bg-gradient-to-r from-[#00A3FF] to-[#00D6FF] text-[#091018]' : 'text-[#8F9CAE]'}`}
          >English</button>
          <button
            onClick={() => setLang('am')}
            className={`ethiopic flex-1 rounded-lg py-2.5 text-xs font-bold ${lang === 'am' ? 'bg-gradient-to-r from-[#00A3FF] to-[#00D6FF] text-[#091018]' : 'text-[#8F9CAE]'}`}
          >አማርኛ</button>
        </div>
      </section>

      {/* Toggles */}
      <section className="tile rounded-2xl p-4 mb-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-400/10 text-purple-300">
            <Icon name="bell" size={16} />
          </span>
          <b className="text-[13px]">Preferences</b>
        </div>
        {toggles.map(tog => (
          <div key={tog.id} className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold">{tog.label}</p>
              <p className="text-[10px] text-slate-500">{tog.desc}</p>
            </div>
            <button
              onClick={() => flip(tog.id)}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${tog.value ? 'bg-cyan-500' : 'bg-white/10'}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-200 ${tog.value ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </section>

      {/* About */}
      <section className="tile rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400/10 text-amber-300">
            <Icon name="history" size={16} />
          </span>
          <b className="text-[13px]">About Gemet</b>
        </div>
        <div className="space-y-2 text-[12px] text-slate-400">
          <div className="flex justify-between"><span>Version</span><span className="text-white font-semibold">1.0.0</span></div>
          <div className="flex justify-between"><span>Platform</span><span className="text-white font-semibold">Telegram Mini App</span></div>
          <div className="flex justify-between"><span>Region</span><span className="text-white font-semibold">Ethiopia 🇪🇹</span></div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
