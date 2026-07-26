export const dynamic = 'force-static';

export default function PaymentDone() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Payment Complete — Gemet</title>
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
          .icon {
            width: 64px;
            height: 64px;
            background: rgba(34,211,238,0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 32px;
          }
          h1 { font-size: 22px; font-weight: 800; margin-bottom: 12px; }
          p { font-size: 14px; color: #8F9CAE; line-height: 1.6; margin-bottom: 28px; }
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
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="icon">✅</div>
          <h1>Deposit Successful!</h1>
          <p>
            Your funds have been added to your Gemet wallet.
            Return to Telegram to continue bidding.
          </p>
          <a href="https://t.me/gemetlowestuniquebidauctionbot">
            Open Gemet in Telegram
          </a>
        </div>
      </body>
    </html>
  );
}
