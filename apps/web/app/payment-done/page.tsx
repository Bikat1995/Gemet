export const dynamic = 'force-static';

export default function PaymentDone() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Payment Complete — Gemet</title>
        {/* Auto-redirect back to Telegram after 3 seconds */}
        <meta httpEquiv="refresh" content="3;url=https://t.me/gemetlowestuniquebidauctionbot" />
        <script dangerouslySetInnerHTML={{
          __html: `
            setTimeout(function() {
              window.location.href = 'https://t.me/gemetlowestuniquebidauctionbot';
            }, 3000);
          `
        }} />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #0A0D14;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            text-align: center;
          }
          .card {
            background: #141923;
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 24px;
            padding: 40px 32px;
            max-width: 360px;
            width: 100%;
          }
          .icon { font-size: 48px; margin-bottom: 20px; }
          h1 { font-size: 22px; font-weight: 800; margin-bottom: 12px; }
          p { font-size: 14px; color: #8F9CAE; line-height: 1.6; margin-bottom: 8px; }
          .redirect-note { font-size: 12px; color: #4ade80; margin-bottom: 24px; }
          a {
            display: block;
            background: linear-gradient(to right, #06b6d4, #3b82f6);
            color: #071019;
            font-weight: 700;
            font-size: 14px;
            padding: 14px 24px;
            border-radius: 12px;
            text-decoration: none;
          }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
          .pulse { animation: pulse 1.5s infinite; }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="icon">✅</div>
          <h1>Deposit Successful!</h1>
          <p>Your funds have been added to your Gemet wallet.</p>
          <p className="redirect-note pulse">Returning to Telegram in 3 seconds…</p>
          <a href="https://t.me/gemetlowestuniquebidauctionbot">
            Open Gemet Now
          </a>
        </div>
      </body>
    </html>
  );
}
