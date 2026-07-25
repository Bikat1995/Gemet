'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type TelegramUser={id:number;username?:string;first_name:string;last_name?:string;photo_url?:string};
type TelegramState={isTelegram:boolean;initData:string;user?:TelegramUser;token?:string;balance?:string;ready:boolean};
const C=createContext<TelegramState>({isTelegram:false,initData:'',ready:false});
const api='https://gemet-api.onrender.com';
declare global {interface Window {Telegram?:{WebApp?:any}}}
export function TelegramProvider({children}:{children:React.ReactNode}){const[state,setState]=useState<TelegramState>({isTelegram:false,initData:'',ready:false});useEffect(()=>{const app=window.Telegram?.WebApp;if(!app){setState(s=>({...s,ready:true}));return}app.ready();app.expand();app.setHeaderColor?.('#0A0D14');app.setBackgroundColor?.('#0A0D14');const initData=app.initData??'',user=app.initDataUnsafe?.user as TelegramUser|undefined;const root=document.documentElement;root.style.setProperty('--tg-safe-top',`${app.safeAreaInset?.top??0}px`);root.style.setProperty('--tg-safe-bottom',`${app.safeAreaInset?.bottom??0}px`);if(!initData){setState({isTelegram:true,initData,user,ready:true});return}fetch(`${api}/auth/telegram`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData})}).then(async r=>{if(!r.ok)throw new Error('Telegram login failed');return r.json()}).then(data=>setState({isTelegram:true,initData,user,token:data.token,balance:data.user.balance,ready:true})).catch(()=>setState({isTelegram:true,initData,user,ready:true}));},[]);return <C.Provider value={state}>{children}</C.Provider>}
export const useTelegram=()=>useContext(C);
