'use client';
import { createContext, useContext, useEffect, useState } from 'react';
type Lang = 'en' | 'am';

const copy = {
  en: {
    // Nav
    market: 'Market', auctions: 'Auctions', bids: 'Bids', tickets: 'Tickets',
    wallet: 'Wallet', profile: 'Profile',
    // General
    back: 'Back', language: 'Language', notifications: 'Notifications',
    settings: 'Settings', help: 'Help & support', account: 'Account',
    // Home
    featured: 'Featured this week', live: 'Live auctions',
    search: 'Search auctions', filters: 'Filters', category: 'Category',
    model: 'Model', liveNow: 'Live now', all: 'All',
    electronics: 'Electronics', vehicles: 'Vehicles', property: 'Property', other: 'Other',
    // Auction
    fee: 'Entry fee', bid: 'Place bid', balance: 'Available balance',
    add: 'Add funds', choose: 'Choose amount', payment: 'Payment method',
    deposit: 'Deposit with Chapa', status: 'Bid status', submit: 'Submit bid',
    remaining: 'remaining', winner: 'Lowest unique bid wins', details: 'Details',
    // Bids page
    active: 'Active', history: 'Bid history', noBids: 'No bids yet',
    amount: 'Amount', totalBids: 'Total Bids', bidders: 'Bidders',
    allAuctions: 'All Auctions', leaderboard: 'Leaderboard',
    viewBidders: 'View Bidders', noBidders: 'No bids on this item yet',
    // Tickets
    myTickets: 'My Tickets', ticketNum: 'Ticket No.', noTickets: 'No tickets yet',
    // Payment
    custom: 'Custom', telebirr: 'Telebirr', cbe: 'CBE Birr', bank: 'Bank transfer',
    // Winners
    winners: 'Winners', winnerLabel: 'Winner', winningBid: 'Winning bid',
    // Profile
    greeting: 'Welcome back', joined: 'Member since',
    totalBidsPlaced: 'Total bids', auctionsWon: 'Auctions won',
    // Help
    faq: 'Frequently Asked Questions', howItWorks: 'How it works',
    howBidWorks: 'How does bidding work?',
    howBidAnswer: 'The lowest unique bid wins. For example, if bids of 1, 1, 2, 3 are placed, the winner is 2 — the lowest number no one else chose.',
    howPay: 'How do I pay the entry fee?',
    howPayAnswer: 'Use Telebirr or CBE Birr to send the entry fee to our official numbers, then submit your transaction ID in the app.',
    howWin: 'How do I know if I won?',
    howWinAnswer: 'When the auction ends, we announce the winner via a Telegram message and on the Winners page.',
    contact: 'Contact us',
    contactText: 'For any support, reach us on Telegram: @gemet_support',
  },
  am: {
    // Nav
    market: 'ገበያ', auctions: 'ጨረታዎች', bids: 'ግምቶች', tickets: 'ቲኬቶች',
    wallet: 'ካዝና', profile: 'ግል መለያ',
    // General
    back: 'ተመለስ', language: 'ቋንቋ', notifications: 'ማሳወቂያዎች',
    settings: 'ቅንብሮች', help: 'እርዳታ እና ድጋፍ', account: 'መለያ',
    // Home
    featured: 'የሳምንቱ ልዩ ሽልማት', live: 'ቀጥታ ጨረታዎች',
    search: 'ጨረታ ይፈልጉ', filters: 'ማጣሪያ', category: 'ምድብ',
    model: 'ሞዴል', liveNow: 'አሁን በቀጥታ', all: 'ሁሉም',
    electronics: 'ኤሌክትሮኒክስ', vehicles: 'ተሽከርካሪዎች', property: 'ንብረት', other: 'ሌላ',
    // Auction
    fee: 'የመግቢያ ክፍያ', bid: 'ግምት አስገባ', balance: 'ያለዎት ቀሪ ሂሳብ',
    add: 'ገንዘብ ያስገቡ', choose: 'መጠን ይምረጡ', payment: 'የክፍያ ዘዴ',
    deposit: 'በቻፓ ይክፈሉ', status: 'የግምት ሁኔታ', submit: 'ግምት አስገባ',
    remaining: 'ቀሪ', winner: 'ዝቅተኛው ልዩ ግምት ያሸንፋል', details: 'ዝርዝር',
    // Bids page
    active: 'ንቁ', history: 'የግምት ታሪክ', noBids: 'እስካሁን ያስገቡት ግምት የለም',
    amount: 'መጠን', totalBids: 'ጠቅላላ ግምቶች', bidders: 'ገዢዎች',
    allAuctions: 'ሁሉም ጨረታዎች', leaderboard: 'የሰዎች ዝርዝር',
    viewBidders: 'ገዢዎችን ይመልከቱ', noBidders: 'ለዚህ ዕቃ እስካሁን ግምት የለም',
    // Tickets
    myTickets: 'የእኔ ቲኬቶች', ticketNum: 'የቲኬት ቁጥር', noTickets: 'ቲኬት የለም',
    // Payment
    custom: 'ሌላ መጠን', telebirr: 'ቴሌብር', cbe: 'ሲቢኢ ብር', bank: 'የባንክ ዝውውር',
    // Winners
    winners: 'አሸናፊዎች', winnerLabel: 'አሸናፊ', winningBid: 'አሸናፊ ግምት',
    // Profile
    greeting: 'እንኳን ደህና መጡ', joined: 'ምዝገባ ጀምሮ',
    totalBidsPlaced: 'ጠቅላላ ግምቶች', auctionsWon: 'የተሸነፉ ጨረታዎች',
    // Help
    faq: 'ብዙ ጊዜ የሚጠየቁ ጥያቄዎች', howItWorks: 'እንዴት ይሠራል',
    howBidWorks: 'ጨረታ እንዴት ይሠራል?',
    howBidAnswer: 'ዝቅተኛው ልዩ ግምት ያሸንፋል። ለምሳሌ 1፣ 1፣ 2፣ 3 ቢቀርቡ 2 ያሸንፋል — ሌላ ሰው ያልመረጠው ዝቅተኛ ቁጥር።',
    howPay: 'የመግቢያ ክፍያ እንዴት እከፍላለሁ?',
    howPayAnswer: 'ቴሌብርን ወይም ሲቢኢ ብርን ተጠቅሞ ክፍያ ወደ ኦፊሴላዊ ቁጥሮቻችን ይላኩ፣ ከዚያ በመተግበሪያው ውስጥ ማስረጃ ቁጥርዎን ያስገቡ።',
    howWin: 'አሸናፊ ስሆን እንዴት አውቃለሁ?',
    howWinAnswer: 'ጨረታ ሲጠናቀቅ አሸናፊን በቴሌግራም መልእክት እና በአሸናፊዎች ገጽ እናስታውቃለን።',
    contact: 'ያግኙን',
    contactText: 'ለማናቸውም ድጋፍ በቴሌግራም ያናግሩን፦ @gemet_support',
  }
};

export type Copy = typeof copy.en;
const C = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Copy }>({ lang: 'en', setLang: () => {}, t: copy.en });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => {
    const saved = localStorage.getItem('gemet-language') as Lang | null;
    if (saved) setLang(saved);
  }, []);
  const change = (l: Lang) => { localStorage.setItem('gemet-language', l); setLang(l); };
  return (
    <C.Provider value={{ lang, setLang: change, t: copy[lang] }}>
      <div className={lang === 'am' ? 'amharic-ui' : ''}>{children}</div>
    </C.Provider>
  );
}
export const useLanguage = () => useContext(C);
