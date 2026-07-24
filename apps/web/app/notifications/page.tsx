'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '../components/Icons';
import { useTelegram } from '../components/TelegramProvider';
import { useLanguage } from '../components/LanguageProvider';

type Notification = { id: string; title: string; message: string; read: boolean; createdAt: string; };

export default function Notifications() {
  const { t } = useLanguage();
  const tg = useTelegram();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!tg.token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
      headers: { authorization: `Bearer ${tg.token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(x => {
        if (x?.notifications) {
          setNotifications(x.notifications);
          // Mark as read
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/read`, {
            method: 'POST',
            headers: { authorization: `Bearer ${tg.token}` }
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, [tg.token]);

  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-8 pt-5">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 text-xs text-cyan-300">
          <Icon name="chevron" size={15} className="rotate-180" />
          {t.back}
        </Link>
        <b className="text-xs">{t.notifications}</b>
      </div>
      <h1 className="mb-5 text-2xl font-extrabold text-white">{t.notifications}</h1>
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-center text-sm text-slate-500">No notifications yet.</p>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`tile rounded-xl p-4 ${n.read ? 'opacity-70' : 'border border-cyan-500/50'}`}>
              <div className="flex items-center gap-2 mb-1">
                {!n.read && <span className="h-2 w-2 rounded-full bg-cyan-400" />}
                <h3 className="text-sm font-bold">{n.title}</h3>
              </div>
              <p className="text-xs text-slate-400">{n.message}</p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
