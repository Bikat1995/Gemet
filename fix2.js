const fs = require('fs');
const files = [
  'apps/web/app/auction/[id]/page.tsx',
  'apps/web/app/components/TelegramProvider.tsx',
  'apps/web/app/wallet/page.tsx'
];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.split("??'http://localhost:4000'").join("");
  fs.writeFileSync(f, c, 'utf8');
  console.log('Fixed', f);
});
