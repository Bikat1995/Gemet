'use client';
import { useEffect, useState } from 'react';

export default function TelegramGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    // If Telegram WebApp is present and has initData, we're inside Telegram
    if (tg?.initData && tg.initData.length > 0) {
      tg.ready();
      tg.expand();
      setOk(true);
    } else {
      setOk(false);
    }
  }, []);

  if (ok === null) return null; // loading

  if (!ok) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0A0D14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h1 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
          Open in Telegram
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '280px', lineHeight: 1.6 }}>
          Gemet is a Telegram Mini App. Please open it through the official Gemet bot on Telegram.
        </p>
        <a
          href="https://t.me/GemetAuctionBot"
          style={{
            marginTop: '1.5rem',
            display: 'inline-block',
            background: 'linear-gradient(135deg, #00A3FF, #00D6FF)',
            color: '#06101b',
            fontWeight: 700,
            fontSize: '0.85rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            textDecoration: 'none',
          }}
        >
          Open Gemet on Telegram →
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
