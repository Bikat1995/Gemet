const token=process.env.BOT_TOKEN;
const url=process.env.TMA_URL;
const apiUrl=process.env.API_URL;
if(!token||!url||!url.startsWith('https://'))throw new Error('Set BOT_TOKEN and a public HTTPS TMA_URL in apps/api/.env before configuring Telegram.');
const call=async(method,body)=>{const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),data=await r.json();if(!data.ok)throw new Error(`${method}: ${data.description}`);return data.result};
await call('setChatMenuButton',{menu_button:{type:'web_app',text:'Open Gemet',web_app:{url}}});
await call('setMyCommands',{commands:[{command:'start',description:'Open Gemet auctions'},{command:'auctions',description:'View live auctions'},{command:'wallet',description:'Open wallet'}]});
if(apiUrl){await call('setWebhook',{url:`${apiUrl}/webhooks/telegram`});console.log(`Telegram Webhook set to ${apiUrl}/webhooks/telegram`);}
console.log(`Telegram Mini App menu configured for ${url}`);
