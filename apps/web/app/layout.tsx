import './globals.css';
import { LanguageProvider } from './components/LanguageProvider';
import { TelegramProvider } from './components/TelegramProvider';
import TelegramGate from './components/TelegramGate';
import Script from 'next/script';
export const metadata={title:'Gemet | ገምት',description:'Lowest unique bid auctions'};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive"/><TelegramProvider><LanguageProvider><TelegramGate>{children}</TelegramGate></LanguageProvider></TelegramProvider></body></html>; }
