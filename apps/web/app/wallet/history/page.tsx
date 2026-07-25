'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '../../components/Icons';
import { useTelegram } from '../../components/TelegramProvider';
import { useLanguage } from '../../components/LanguageProvider';

type Tx = { id: string; amount: string; isDeposit: boolean; status: string; date: string; };

export default function WalletHistory() {
  const { t } = useLanguage();
  const tg = useTelegram();
  const [history, setHistory] = useState<Tx[]>([]);

  useEffect(() => {
    if (!tg.token) return;
    fetch(`${'https://gemet-api.onrender.com'}/wallet/history`, {
      headers: { authorization: `Bearer ${tg.token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(x => x?.transactions && setHistory(x.transactions))
      .catch(() => {});
  }, [tg.token]);

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-8 pt-5">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/wallet" className="flex items-center gap-1 text-xs text-cyan-300">
          <Icon name="chevron" size={15} className="rotate-180" />
          {t.back}
        </Link>
        <b className="text-xs">{t.history}</b>
      </div>
      <h1 className="mb-5 text-2xl font-extrabold text-white">Transactions</h1>
      <div className="space-y-3">
        {history.length === 0 ? (
          <p className="text-center text-sm text-slate-500">No transactions yet.</p>
        ) : (
          history.map(tx => (
            <div key={tx.id} className="tile flex items-center justify-between rounded-xl p-4">
              <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-lg ${tx.isDeposit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  <Icon name={tx.isDeposit ? 'arrow' : 'bids'} size={16} className={tx.isDeposit ? 'rotate-180' : ''} />
                </span>
                <div>
                  <b className="block text-sm">{tx.isDeposit ? 'Deposit' : 'Bid Fee'}</b>
                  <span className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right">
                <b className={`block text-sm font-bold ${tx.isDeposit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.isDeposit ? '+' : '-'}{tx.amount} ETB
                </b>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">{tx.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
