'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type TelegramUser={id:number;username?:string;first_name:string;last_name?:string;photo_url?:string};
type TelegramState={isTelegram:boolean;initData:string;user?:TelegramUser;token?:string;balance?:string;phoneNumber?:string;ready:boolean};
const C=createContext<TelegramState>({isTelegram:false,initData:'',ready:false});
const api='https://gemet-api.onrender.com';
declare global {interface Window {Telegram?:{WebApp?:any}}}
export function TelegramProvider({children}:{children:React.ReactNode}){const[state,setState]=useState<TelegramState>({isTelegram:false,initData:'',ready:false});useEffect(()=>{const app=window.Telegram?.WebApp;if(!app){setState(s=>({...s,ready:true}));return}app.ready();app.expand();app.setHeaderColor?.('#0A0D14');app.setBackgroundColor?.('#0A0D14');const initData=app.initData??'',user=app.initDataUnsafe?.user as TelegramUser|undefined;const root=document.documentElement;root.style.setProperty('--tg-safe-top',`${app.safeAreaInset?.top??0}px`);root.style.setProperty('--tg-safe-bottom',`${app.safeAreaInset?.bottom??0}px`);if(!initData){setState({isTelegram:true,initData,user,ready:true});return}fetch(`${api}/auth/telegram`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData})}).then(async r=>{if(!r.ok)throw new Error('Telegram login failed');return r.json()}).then(data=>setState({isTelegram:true,initData,user,token:data.token,balance:data.user.balance,phoneNumber:data.user.phoneNumber,ready:true})).catch(()=>setState({isTelegram:true,initData,user,ready:true}));},[]);

  // Bypass the block on the admin dashboard since it's already secured by telegramId
  const isAdminPage = typeof window !== 'undefined' && window.location.pathname.includes('/admin');

  if (state.ready && !state.phoneNumber && !isAdminPage) {
    return (
      <main className="app-shell min-h-screen grid place-items-center bg-[#0A0D14] px-6 text-center" data-theme="dark">
        <div className="bg-[#141923] p-8 rounded-3xl border border-white/5 w-full max-w-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-xl font-extrabold text-white mb-3">Registration Required</h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Please return to the Telegram bot chat and share your phone number to continue.
          </p>
        </div>
      </main>
    );
  }

  return <C.Provider value={state}>{children}</C.Provider>
}
export const useTelegram=()=>useContext(C);
