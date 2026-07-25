const fs = require('fs');
const files = [
  'admin/page.tsx',
  'auction/[id]/page.tsx',
  'bids/page.tsx',
  'components/TelegramProvider.tsx',
  'notifications/page.tsx',
  'page.tsx',
  'wallet/history/page.tsx',
  'wallet/page.tsx',
  'winners/page.tsx'
];
files.forEach(f => {
  const p = 'apps/web/app/' + f;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/process\.env\.NEXT_PUBLIC_API_URL/g, "'https://gemet-api.onrender.com'");
  fs.writeFileSync(p, c, 'utf8');
  console.log('Fixed ' + f);
});
