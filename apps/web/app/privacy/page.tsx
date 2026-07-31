'use client';
import Link from 'next/link';
import { Icon } from '../components/Icons';

export default function Privacy() {
  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-16 pt-5">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-1 text-xs text-cyan-300">
          <Icon name="chevron" size={15} className="rotate-180" />
          Back
        </Link>
        <b className="text-xs text-slate-400">Privacy Policy</b>
      </div>

      <div className="space-y-6 text-sm text-slate-300 leading-relaxed">

        <div>
          <h1 className="text-xl font-extrabold text-white mb-1">Privacy Policy</h1>
          <p className="text-[11px] text-slate-500">Last Updated: 31 July 2026 &nbsp;·&nbsp; Effective Date: 31 July 2026</p>
        </div>

        <p className="text-slate-400 text-[13px]">
          This Privacy Policy explains how <strong className="text-white">Gemet</strong> ("we," "us," or "our") collects, uses, and protects personal information when you interact with our Telegram Mini App and any related services (collectively, the "Services"). We are committed to safeguarding your information and handling it responsibly in accordance with applicable data protection laws.
        </p>
        <p className="text-slate-400 text-[13px]">Our business is located in <strong className="text-white">Addis Ababa, Ethiopia</strong>.</p>
        <p className="text-slate-400 text-[13px]">
          If you have questions, contact us at{' '}
          <a href="mailto:bikatvon@gmail.com" className="text-cyan-400 underline">bikatvon@gmail.com</a>
          {' '}or by phone at <strong className="text-white">0969485212</strong>.
        </p>

        {/* TOC */}
        <div className="tile rounded-2xl p-4 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Contents</p>
          {[
            'Information We Collect',
            'How We Collect Information',
            'How We Use Your Information',
            'How We Process Your Information',
            'Automated Decision-Making',
            'Cookies & Tracking Technologies',
            'How We Share Information',
            'International Transfers',
            'How Long We Retain Information',
            'How We Keep Information Safe',
            'Your Rights',
            "Children's Privacy",
            'Updates to This Policy',
            'How to Contact Us',
          ].map((item, i) => (
            <p key={i} className="text-[12px] text-slate-400">{i + 1}. {item}</p>
          ))}
        </div>

        <Section title="1. Information We Collect">
          <p>We collect personal information that you provide directly, information generated automatically when you use our Services, and information obtained from third-party tools that support our operations.</p>
          <ul className="list-disc ml-4 space-y-1 mt-2 text-[13px]">
            <li><strong className="text-white">Identifiers:</strong> Phone number, Telegram user ID, username</li>
            <li><strong className="text-white">Account & Transaction Data:</strong> Profile information, bid history, transaction references, payment method used</li>
            <li><strong className="text-white">Technical Data:</strong> Server-side logs and system data</li>
            <li><strong className="text-white">Preferences:</strong> Language settings (stored locally on your device)</li>
          </ul>
        </Section>

        <Section title="2. How We Collect Information">
          <ul className="list-disc ml-4 space-y-1 text-[13px]">
            <li><strong className="text-white">Directly from you:</strong> When you register by sharing your phone number via Telegram, and when you manually submit transaction IDs when paying entry fees.</li>
            <li><strong className="text-white">From your activity:</strong> Your bids, payment submissions, and auction interactions are recorded as you use the app.</li>
            <li><strong className="text-white">Via Telegram authentication:</strong> When you open the Mini App, Telegram securely passes your profile data (ID, name, username) to us for authentication.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <ul className="list-disc ml-4 space-y-2 text-[13px]">
            <li><strong className="text-white">Account management</strong> — to create and maintain your profile. <em className="text-slate-500">Legal basis: Consent.</em></li>
            <li><strong className="text-white">Processing payments & bids</strong> — to handle entry fee payments and auction entries. <em className="text-slate-500">Legal basis: Contract.</em></li>
            <li><strong className="text-white">Fraud detection & security</strong> — to verify transaction IDs and use HMAC authentication to prevent spoofing and fake entries. <em className="text-slate-500">Legal basis: Legitimate interests.</em></li>
          </ul>
        </Section>

        <Section title="4. How We Process Your Information">
          <p>We process personal information in ways appropriate to the data and purposes for which it is collected — including storing, organizing, using, transmitting, and deleting it when no longer required. Access is limited to authorized personnel only. We apply data minimization and purpose limitation principles.</p>
        </Section>

        <Section title="5. Automated Decision-Making">
          <p>When an auction ends, our system automatically determines the winner using an algorithm that identifies the lowest unique bid — the smallest bid value submitted by only one participant. This is performed entirely by software with no human involvement. The result determines which user wins the prize, and they are automatically notified via Telegram message.</p>
          <p className="mt-2">We do not use automated decision-making that produces legal or similarly significant effects without providing safeguards or obtaining consent where required.</p>
        </Section>

        <Section title="6. Cookies & Tracking Technologies">
          <p>We do not use cookies or similar tracking technologies. Gemet is a Telegram Mini App — it does not run in a traditional web browser context. We use <strong className="text-white">Local Storage</strong> only to remember your language preference (English or Amharic) between sessions.</p>
        </Section>

        <Section title="7. How We Share Information">
          <p>We may share personal information with the following categories of trusted third-party providers:</p>
          <ul className="list-disc ml-4 space-y-1 mt-2 text-[13px]">
            <li><strong className="text-white">Hosting & infrastructure:</strong> Render (API server), Vercel (Mini App frontend), Neon (PostgreSQL database), Upstash (Redis cache)</li>
            <li><strong className="text-white">Messaging platform:</strong> Telegram Bot API — used to send auction result notifications and winner announcements</li>
          </ul>
          <p className="mt-2">We do not sell personal information. We only share data as necessary to operate the Services.</p>
        </Section>

        <Section title="8. International Transfers">
          <p>Gemet is an Ethiopian business serving Ethiopian users. We do not specifically collect or transfer personal information from EU/EEA or UK residents. Our hosting providers (Render, Vercel) are US-based; by using the app you acknowledge that data may be processed on servers outside Ethiopia.</p>
        </Section>

        <Section title="9. How Long We Retain Information">
          <ul className="list-disc ml-4 space-y-1 text-[13px]">
            <li><strong className="text-white">Account & profile:</strong> Until you delete your account</li>
            <li><strong className="text-white">Bid & transaction history:</strong> 2 years from the date of the transaction</li>
            <li><strong className="text-white">Security logs:</strong> 90 days</li>
            <li><strong className="text-white">Legal & regulatory records:</strong> 5 years</li>
          </ul>
          <p className="mt-2">When we no longer have a legitimate need to retain data, we delete or anonymize it.</p>
        </Section>

        <Section title="10. How We Keep Information Safe">
          <ul className="list-disc ml-4 space-y-1 text-[13px]">
            <li>Encryption of data in transit (HTTPS)</li>
            <li>HMAC cryptographic authentication to verify all Telegram logins</li>
            <li>JWT token-based sessions (no cookies)</li>
            <li>Access controls and server-side logging</li>
            <li>Atomically safe bid processing to prevent duplicate transactions</li>
          </ul>
          <p className="mt-2">No system is 100% secure. If a breach affecting your data is identified, we will notify you as required.</p>
        </Section>

        <Section title="11. Your Rights">
          <p>Regardless of where you live, you may:</p>
          <ul className="list-disc ml-4 space-y-1 mt-2 text-[13px]">
            <li>Request access to the personal information we hold about you</li>
            <li>Request corrections or updates</li>
            <li>Request deletion of your data</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p className="mt-2">Submit requests by contacting us at <a href="mailto:bikatvon@gmail.com" className="text-cyan-400 underline">bikatvon@gmail.com</a>.</p>
        </Section>

        <Section title="12. Children's Privacy">
          <p>Our Services are not intended for children under 16. We do not knowingly collect personal information from individuals under this age. If you believe a child has provided us with information, please contact us immediately.</p>
        </Section>

        <Section title="13. Updates to This Policy">
          <p>We may update this Privacy Policy from time to time. When we do, we will update the "Last Updated" date at the top. Significant changes will be communicated via an in-app notification within the Telegram Mini App.</p>
        </Section>

        <Section title="14. How to Contact Us">
          <p className="font-semibold text-white">Gemet</p>
          <p>Addis Ababa, Ethiopia</p>
          <p>Email: <a href="mailto:bikatvon@gmail.com" className="text-cyan-400 underline">bikatvon@gmail.com</a></p>
          <p>Phone: <a href="tel:0969485212" className="text-cyan-400 underline">0969485212</a></p>
        </Section>

        <p className="text-[10px] text-slate-600 text-center pb-4">© {new Date().getFullYear()} Gemet. All rights reserved.</p>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="tile rounded-2xl p-4 space-y-2">
      <h2 className="text-[13px] font-bold text-white">{title}</h2>
      <div className="text-[13px] text-slate-400 space-y-2">{children}</div>
    </div>
  );
}
