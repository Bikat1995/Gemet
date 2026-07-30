'use client';
import { useEffect, useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { Icon } from '../components/Icons';
import { useLanguage } from '../components/LanguageProvider';

const api = 'https://gemet-api.onrender.com';

export default function TicketsPage() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const { t, lang } = useLanguage();

  useEffect(() => {
    fetch(`${api}/tickets/all`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.auctions) setAuctions(data.auctions); })
      .finally(() => setLoading(false));
  }, []);

  const selectedAuction = auctions.find(a => a.id === selectedAuctionId);
  const filteredBids = selectedAuction?.bids.filter((b: any) =>
    search === '' || b.ticketNumber.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const badgeColor = (status: string) => {
    if (status === 'unique') return 'text-emerald-300 bg-emerald-500/10';
    if (status === 'duplicated') return 'text-red-300 bg-red-500/10';
    return 'text-slate-300 bg-white/5';
  };

  const badgeLabel = (status: string) => {
    if (status === 'unique') return lang === 'am' ? 'ልዩ ✓' : 'Unique ✓';
    if (status === 'duplicated') return lang === 'am' ? 'ተደጋጋሚ' : 'Duplicated';
    return status;
  };

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
      <header className="mb-6 flex items-center justify-between">
        <div>
          {selectedAuctionId && (
            <button onClick={() => { setSelectedAuctionId(null); setSearch(''); }} className="flex items-center gap-1 text-xs text-cyan-400 mb-2 font-semibold">
              <Icon name="back" size={14} /> {t.back}
            </button>
          )}
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">{t.liveNow}</p>
          <h1 className="text-xl font-extrabold mt-0.5">{t.tickets}</h1>
        </div>
        <span className="tile grid h-10 w-10 place-items-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
          <Icon name="ticket" size={20} />
        </span>
      </header>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : !selectedAuctionId ? (
        // Auction list
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            {lang === 'am' ? 'ጨረታ ይምረጡ' : 'Select an Auction'}
          </p>
          {auctions.length === 0 ? (
            <div className="tile rounded-2xl p-8 text-center">
              <span className="grid mx-auto h-14 w-14 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 mb-3">
                <Icon name="ticket" size={26} />
              </span>
              <p className="text-sm text-slate-400">{t.noTickets}</p>
            </div>
          ) : auctions.map(auction => (
            <button
              key={auction.id}
              onClick={() => setSelectedAuctionId(auction.id)}
              className="w-full text-left tile flex items-center gap-4 rounded-2xl p-3 border border-white/[.04] active:scale-[0.98] transition-transform"
            >
              <img src={auction.imageUrl} alt={auction.title} className="h-16 w-16 rounded-xl object-cover bg-slate-800 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-white truncate">{auction.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  🎫 {auction.bids.length} {lang === 'am' ? 'ቲኬቶች' : 'Tickets'}
                </p>
              </div>
              <Icon name="chevron-right" size={16} className="text-slate-500 shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        // Ticket list for selected auction
        <div>
          <div className="flex items-center gap-3 mb-5 tile rounded-xl p-3">
            <img src={selectedAuction?.imageUrl} className="w-12 h-12 rounded-lg object-cover shrink-0" alt="" />
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-white truncate">{selectedAuction?.title}</h2>
              <p className="text-xs text-slate-400">🎫 {selectedAuction?.bids.length} {lang === 'am' ? 'ቲኬቶች' : 'Total Tickets'}</p>
            </div>
          </div>

          <div className="relative mb-4">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={lang === 'am' ? 'UND-... ይፈልጉ' : 'Search by Ticket ID...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#101722] pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 placeholder-slate-500"
            />
          </div>

          <div className="space-y-2">
            {filteredBids.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-6">
                {lang === 'am' ? 'ቲኬት አልተገኘም' : 'No tickets found'}
              </p>
            ) : filteredBids.map((bid: any) => (
              <div key={bid.ticketNumber} className="tile flex items-center justify-between p-4 rounded-xl border border-white/[.04]">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                    <Icon name="ticket" size={16} />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sm text-white tracking-wide">{bid.ticketNumber}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(bid.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${badgeColor(bid.status)}`}>
                  {badgeLabel(bid.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
