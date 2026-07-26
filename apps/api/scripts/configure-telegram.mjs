const token=process.env.BOT_TOKEN;
const adminToken=process.env.ADMIN_BOT_TOKEN;
const url=process.env.TMA_URL;
const apiUrl=process.env.API_URL;
if(!token||!url||!url.startsWith('https://'))throw new Error('Set BOT_TOKEN and a public HTTPS TMA_URL in apps/api/.env before configuring Telegram.');
const call=async(t,method,body)=>{const r=await fetch(`https://api.telegram.org/bot${t}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),data=await r.json();if(!data.ok)throw new Error(`${method}: ${data.description}`);return data.result};
await call(token,'setChatMenuButton',{menu_button:{type:'web_app',text:'Open Gemet',web_app:{url}}});
await call(token,'setMyCommands',{commands:[{command:'start',description:'Open Gemet auctions'},{command:'auctions',description:'View live auctions'},{command:'tickets',description:'Open tickets'}]});
if(apiUrl){
  await call(token,'setWebhook',{url:`${apiUrl}/webhooks/telegram`});
  console.log(`Telegram Webhook set to ${apiUrl}/webhooks/telegram`);
  if(adminToken) {
    await call(adminToken,'setWebhook',{url:`${apiUrl}/webhooks/telegram-admin`});
    console.log(`Admin Telegram Webhook set to ${apiUrl}/webhooks/telegram-admin`);
  }
}
console.log(`Telegram Mini App menu configured for ${url}`);
