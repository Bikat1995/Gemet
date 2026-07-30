'use client';
import Link from 'next/link';
import { useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { useLanguage } from '../components/LanguageProvider';
import { Icon } from '../components/Icons';

const faqs = [
  { q: 'What is a lowest unique bid?', a: 'A "lowest unique bid" means the single lowest bid amount that no other participant has also submitted. For example, if three players bid 5 ETB and one player bids 3 ETB alone, that 3 ETB bid is the unique lowest — and wins!' },
  { q: 'How do I enter an auction?', a: 'Tap any live auction on the home screen, pay the entry fee via Telebirr or CBE Birr, then submit your transaction ID. Once our team verifies your payment, you will be able to place your bid.' },
  { q: 'How long does payment verification take?', a: 'Payments are typically verified within 15 minutes. If it takes longer, please contact support with your transaction ID.' },
  { q: 'What happens if my bid is duplicated?', a: 'If another player has bid the exact same amount, your bid will be marked as "Duplicated." You can still place a different bid amount — only your latest bid counts.' },
  { q: 'When is the winner announced?', a: 'Winners are automatically determined the moment the auction timer reaches zero. You will receive a Telegram notification if you win.' },
  { q: 'What payment methods are accepted?', a: 'We currently accept Telebirr (two numbers available) and CBE Birr. All payments are made to the recipient numbers shown in the app.' },
];

export default function Help() {
  const { t } = useLanguage();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/profile" className="tile grid h-9 w-9 place-items-center rounded-xl text-cyan-300">
          <Icon name="chevron" size={16} className="rotate-180" />
        </Link>
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{t.account}</p>
          <h1 className="m-0 text-xl font-extrabold">{t.help}</h1>
        </div>
      </header>

      {/* Banner */}
      <section className="tile mb-5 rounded-2xl bg-gradient-to-br from-cyan-900/40 to-blue-900/40 p-5 border border-cyan-500/20">
        <div className="flex items-center gap-3 mb-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-300">
            <Icon name="help" size={22} />
          </span>
          <div>
            <h2 className="text-[15px] font-extrabold">How Gemet Works</h2>
            <p className="text-[10px] text-slate-400">Lowest Unique Bid Auction</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Gemet is a unique-bid auction platform. The player who submits the <b className="text-cyan-300">single lowest bid</b> that nobody else has placed — wins the prize at that price.
        </p>
      </section>

      {/* FAQ */}
      <h2 className="mb-3 text-[13px] font-bold text-slate-300 uppercase tracking-wider">Frequently Asked Questions</h2>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="tile rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-[13px] font-semibold pr-3">{faq.q}</span>
              <span className={`shrink-0 transition-transform duration-200 text-cyan-400 ${open === i ? 'rotate-180' : ''}`}>
                <Icon name="chevron" size={16} className="rotate-90" />
              </span>
            </button>
            {open === i && (
              <div className="px-4 pb-4">
                <div className="h-px bg-white/5 mb-3" />
                <p className="text-[12px] text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact */}
      <section className="tile mt-5 rounded-2xl p-4">
        <h2 className="text-[13px] font-bold mb-3">Still need help?</h2>
        <p className="text-[11px] text-slate-400 mb-3">Reach out to our support team directly on Telegram.</p>
        <a
          href="https://t.me/gemet_support"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 py-3 text-sm font-bold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
        >
          <Icon name="bell" size={16} /> Contact Support
        </a>
      </section>

      <BottomNav />
    </main>
  );
}
