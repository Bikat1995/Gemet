'use client';
import Link from 'next/link';
import { Icon } from '../components/Icons';

export default function Terms() {
  return (
    <main className="app-shell mx-auto min-h-screen max-w-md px-4 pb-16 pt-5">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-1 text-xs text-cyan-300">
          <Icon name="chevron" size={15} className="rotate-180" />
          Back
        </Link>
        <b className="text-xs text-slate-400">Terms of Use</b>
      </div>

      <div className="space-y-5 text-sm text-slate-300 leading-relaxed">
        <div>
          <h1 className="text-xl font-extrabold text-white mb-1">Terms of Use</h1>
          <p className="text-[11px] text-slate-500">Last Updated: 31 July 2026</p>
        </div>

        <p className="text-[13px] text-slate-400">
          Welcome to <strong className="text-white">Gemet</strong> ("we," "us," or "our"). By accessing or using the Gemet Telegram Mini App and any related services (collectively, the "Services"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree, please do not use our Services.
        </p>

        {/* TOC */}
        <div className="tile rounded-2xl p-4 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Contents</p>
          {[
            'Acceptance of Terms',
            'Eligibility',
            'User Accounts',
            'How Auctions Work',
            'Payments & Entry Fees',
            'In-App Purchases',
            'No Subscription',
            'Intellectual Property',
            'Prohibited Conduct',
            'Feedback & Suggestions',
            'Promotions & Contests',
            'Disclaimers',
            'Limitation of Liability',
            'Termination',
            'Changes to These Terms',
            'Contact Us',
          ].map((item, i) => (
            <p key={i} className="text-[12px] text-slate-400">{i + 1}. {item}</p>
          ))}
        </div>

        <Section title="1. Acceptance of Terms">
          <p>By opening the Gemet Telegram Mini App, creating an account, or placing a bid, you confirm that you have read, understood, and agree to these Terms and our <Link href="/privacy" className="text-cyan-400 underline">Privacy Policy</Link>. These Terms constitute a legally binding agreement between you and Gemet.</p>
        </Section>

        <Section title="2. Eligibility">
          <p>You must be at least <strong className="text-white">16 years old</strong> to use Gemet. By using our Services, you represent that you meet this age requirement. We reserve the right to suspend or terminate accounts that we believe belong to underage users.</p>
        </Section>

        <Section title="3. User Accounts">
          <ul className="list-disc ml-4 space-y-1 text-[13px]">
            <li>You create an account by registering through Telegram and sharing your phone number.</li>
            <li>You are responsible for keeping your account information accurate and up to date.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>You may not share your account or allow others to access the Services using your credentials.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
          </ul>
        </Section>

        <Section title="4. How Auctions Work">
          <ul className="list-disc ml-4 space-y-1 text-[13px]">
            <li>Gemet operates <strong className="text-white">lowest unique bid auctions</strong>. The winner is the participant who submits the lowest bid amount that no other participant has also submitted.</li>
            <li>Winner determination is performed automatically by our system with no human involvement.</li>
            <li>Each bid requires a separate entry fee payment. You may place multiple bids on the same auction, each requiring its own payment.</li>
            <li>Auction results are final once declared. We do not accept disputes regarding the outcome of the automated winner selection process.</li>
            <li>Auctions have a fixed end time. Bids submitted after the end time will not be accepted.</li>
          </ul>
        </Section>

        <Section title="5. Payments & Entry Fees">
          <ul className="list-disc ml-4 space-y-1 text-[13px]">
            <li>To place a bid, you must pay a non-refundable entry fee as displayed in the auction listing (in Ethiopian Birr, ETB).</li>
            <li>Payments are made manually via <strong className="text-white">Telebirr</strong> or <strong className="text-white">CBE Birr</strong> to the account numbers displayed in the app.</li>
            <li>After transferring the entry fee, you must submit your transaction ID within the app for verification.</li>
            <li>Our team reviews and verifies each transaction. You will be notified via Telegram once your payment is approved or rejected.</li>
            <li><strong className="text-white">Entry fees are non-refundable</strong>, regardless of the outcome of the auction. By paying the entry fee you accept the risk of not winning.</li>
            <li>If your transaction ID is found to be fraudulent or invalid, your bid will be rejected and your account may be suspended.</li>
          </ul>
        </Section>

        <Section title="6. In-App Purchases">
          <p>Gemet offers in-app purchases in the form of auction entry fees. These are one-time payments per bid. All prices are displayed in Ethiopian Birr (ETB). By completing a payment, you agree that the transaction is final and non-refundable.</p>
        </Section>

        <Section title="7. No Subscription">
          <p>Gemet does not offer subscription plans. All participation is based on individual, one-time entry fee payments per bid. You are never automatically charged on a recurring basis.</p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>All content, design, branding, logos, graphics, text, and trademarks within Gemet — including the name "Gemet" and the Gemet visual identity — are the <strong className="text-white">exclusive property of Gemet</strong> and are protected by applicable intellectual property laws.</p>
          <p className="mt-2">You may not copy, reproduce, distribute, modify, create derivative works of, or commercially exploit any part of our content or trademarks without our prior written consent.</p>
        </Section>

        <Section title="9. Prohibited Conduct">
          <p>You agree not to:</p>
          <ul className="list-disc ml-4 space-y-1 mt-2 text-[13px]">
            <li>Submit fake, duplicated, or fraudulent transaction IDs</li>
            <li>Use bots, scripts, or automated tools to interact with the Services</li>
            <li>Attempt to manipulate auction outcomes or collude with other participants</li>
            <li>Create multiple accounts to gain an unfair advantage</li>
            <li>Reverse-engineer, decompile, or attempt to access the source code of our Services</li>
            <li>Use the Services for any unlawful purpose or in violation of any applicable laws</li>
            <li>Harass, abuse, or harm other users or our team</li>
          </ul>
          <p className="mt-2">Violations may result in immediate account suspension and forfeiture of any pending bids or payments.</p>
        </Section>

        <Section title="10. Feedback & Suggestions">
          <p>If you submit feedback, ideas, or suggestions to us, you grant Gemet the right to use, implement, and incorporate that feedback into our Services without any obligation to compensate you or credit you. We are not required to keep any feedback confidential.</p>
        </Section>

        <Section title="11. Promotions & Contests">
          <p>We may from time to time offer special promotions, bonus contests, or sweepstakes. Any such promotions will be subject to their own specific rules, which will be communicated at the time of the promotion. Participation in promotions does not affect your existing rights or obligations under these Terms.</p>
        </Section>

        <Section title="12. Disclaimers">
          <ul className="list-disc ml-4 space-y-1 text-[13px]">
            <li>The Services are provided on an <strong className="text-white">"as is" and "as available"</strong> basis without warranties of any kind.</li>
            <li>We do not guarantee that the Services will be uninterrupted, error-free, or secure at all times.</li>
            <li>We are not responsible for delays or failures caused by circumstances beyond our reasonable control, including internet outages, Telegram platform issues, or third-party payment provider failures.</li>
          </ul>
        </Section>

        <Section title="13. Limitation of Liability">
          <p>To the fullest extent permitted by applicable law, Gemet shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of — or inability to use — the Services, including but not limited to lost profits or lost bids. Our total liability to you for any claim shall not exceed the entry fee you paid for the relevant auction.</p>
        </Section>

        <Section title="14. Termination">
          <p>We reserve the right to suspend or permanently terminate your access to the Services at any time, with or without notice, if we believe you have violated these Terms or if we decide to discontinue the Services. Upon termination, your right to use the Services ceases immediately.</p>
        </Section>

        <Section title="15. Changes to These Terms">
          <p>We may update these Terms from time to time. When we do, we will update the "Last Updated" date above. Continued use of the Services after changes are posted constitutes your acceptance of the revised Terms. We will notify you of significant changes via an in-app Telegram notification.</p>
        </Section>

        <Section title="16. Contact Us">
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
