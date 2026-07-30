'use client';
import { BottomNav } from '../components/BottomNav';
import { useLanguage } from '../components/LanguageProvider';
import { Icon } from '../components/Icons';
import { useState } from 'react';

type FAQ = { q: string; a: string };

export default function HelpPage() {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState<number | null>(null);

  const faqs: FAQ[] = [
    { q: t.howBidWorks, a: t.howBidAnswer },
    { q: t.howPay, a: t.howPayAnswer },
    { q: t.howWin, a: t.howWinAnswer },
  ];

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
      <header className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{t.help}</p>
        <h1 className="mt-1 text-xl font-extrabold">{lang === 'am' ? 'የእርዳታ ማዕከል' : 'Help Center'}</h1>
      </header>

      {/* How it works banner */}
      <section className="tile rounded-2xl p-5 mb-5 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/10">
        <div className="flex items-center gap-3 mb-3">
          <span className="h-9 w-9 grid place-items-center rounded-xl bg-cyan-500/20 text-cyan-300">
            <Icon name="help" size={18} />
          </span>
          <h2 className="font-bold text-[14px]">{t.howItWorks}</h2>
        </div>
        <div className="space-y-3">
          {[
            { step: '1', icon: '📱', title: lang === 'am' ? 'ምዝገባ' : 'Register', desc: lang === 'am' ? 'ስልክ ቁጥርዎን ያስገቡ' : 'Share your phone number via the Gemet bot' },
            { step: '2', icon: '💳', title: lang === 'am' ? 'ይክፈሉ' : 'Pay Entry Fee', desc: lang === 'am' ? 'ቴሌብር ወይም CBE Birr ይጠቀሙ' : 'Use Telebirr or CBE Birr to pay' },
            { step: '3', icon: '🎯', title: lang === 'am' ? 'ይወዳደሩ' : 'Place Your Bid', desc: lang === 'am' ? 'ልዩ የሆነ ዝቅተኛ ቁጥር ይምረጡ' : 'Enter the lowest unique number you can think of' },
            { step: '4', icon: '🏆', title: lang === 'am' ? 'ያሸንፉ!' : 'Win!', desc: lang === 'am' ? 'ዝቅተኛ ልዩ ቁጥር ያሸንፋል' : 'The lowest number that nobody else chose wins the prize' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="text-[13px] font-bold text-white">{s.title}</p>
                <p className="text-[11px] text-slate-400">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">{t.faq}</h2>
      <div className="space-y-2 mb-6">
        {faqs.map((faq, i) => (
          <div key={i} className="tile rounded-xl border border-white/[.04] overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="text-[13px] font-semibold pr-4">{faq.q}</span>
              <span className={`shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}>
                <Icon name="chevron-down" size={16} className="text-slate-400" />
              </span>
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-[12px] text-slate-400 leading-relaxed border-t border-white/[.04] pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact */}
      <section className="tile rounded-2xl p-5 border border-white/[.04]">
        <div className="flex items-center gap-3 mb-2">
          <span className="h-8 w-8 grid place-items-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <Icon name="bell" size={16} />
          </span>
          <h3 className="font-bold text-[13px]">{t.contact}</h3>
        </div>
        <p className="text-[12px] text-slate-400">{t.contactText}</p>
      </section>

      <BottomNav />
    </main>
  );
}
