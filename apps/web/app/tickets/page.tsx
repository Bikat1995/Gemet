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
  const { t } = useLanguage();

  useEffect(() => {
    fetch(`${api}/tickets/all`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.auctions) {
          setAuctions(data.auctions);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value.toLowerCase());
  };

  const selectedAuction = auctions.find(a => a.id === selectedAuctionId);

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="m-0 text-xl font-extrabold">{t.tickets}</h1>
          <p className="text-[11px] text-[#8F9CAE]">View participants for each auction</p>
        </div>
        <span className="tile grid h-10 w-10 place-items-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
          <Icon name="ticket" size={20} />
        </span>
      </header>

      {loading ? (
        <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" /></div>
      ) : !selectedAuctionId ? (
        // List of Auctions
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-300 mb-2">Select an Auction</h2>
          {auctions.map(auction => (
            <button
              key={auction.id}
              onClick={() => setSelectedAuctionId(auction.id)}
              className="w-full text-left tile flex items-center gap-4 rounded-2xl p-3 border border-transparent hover:border-cyan-500/30 transition-colors"
            >
              <img src={auction.imageUrl} alt={auction.title} className="h-16 w-16 rounded-xl object-cover bg-slate-800" />
              <div className="flex-1">
                <h3 className="font-bold text-sm text-white">{auction.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{auction.bids.length} Tickets sold</p>
              </div>
              <Icon name="chevron" size={16} className="text-slate-500" />
            </button>
          ))}
          {auctions.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-10">No auctions found.</p>
          )}
        </div>
      ) : (
        // Ticket List for Selected Auction
        <div>
          <button onClick={() => setSelectedAuctionId(null)} className="flex items-center gap-1 text-xs text-cyan-400 mb-4 font-semibold">
            <Icon name="chevron" size={14} className="rotate-180" /> Back to items
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <img src={selectedAuction?.imageUrl} className="w-12 h-12 rounded-lg object-cover" />
            <div>
              <h2 className="font-bold text-sm text-white">{selectedAuction?.title}</h2>
              <p className="text-xs text-slate-400">{selectedAuction?.bids.length} Total Tickets</p>
            </div>
          </div>

          <div className="relative mb-6">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Ticket ID..."
              value={search}
              onChange={handleSearch}
              className="w-full rounded-xl border border-white/10 bg-[#101722] pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="space-y-2">
            {selectedAuction?.bids
              .filter((b: any) => search === '' || b.ticketNumber.toLowerCase().includes(search))
              .map((bid: any) => (
                <div key={bid.ticketNumber} className="tile flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-cyan-400">
                      <Icon name="ticket" size={16} />
                    </div>
                    <div>
                      <div className="mono font-bold text-sm text-white">{bid.ticketNumber}</div>
                      <div className="text-[10px] text-slate-400">{new Date(bid.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-300">{bid.user.username ?? 'Anonymous'}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Status: {bid.status}</div>
                  </div>
                </div>
            ))}
            {selectedAuction?.bids.filter((b: any) => search === '' || b.ticketNumber.toLowerCase().includes(search)).length === 0 && (
              <p className="text-center text-sm text-slate-500 py-6">No tickets found.</p>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
