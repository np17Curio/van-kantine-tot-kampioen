import { S, club, seizoenLabel } from '../../core/state.js';
import { geldTxt } from '../../core/utils.js';
import { KRANTEN } from '../media/nieuws.js';
import { RODDELBLADEN, krantMelding } from '../media/roddel.js';
import { isProf } from './sponsors.js';

/* ===================== Geld en zaken ===================== */
export const ZAKEN = [
  {id:'snackbar',  n:'Snackbar',     prijs:20000,  winst:350},
  {id:'barbershop',n:'Barbershop',   prijs:60000,  winst:1000},
  {id:'sportschool',n:'Sportschool', prijs:250000, winst:3800},
  {id:'restaurant',n:'Restaurant',   prijs:600000, winst:8500}
];
export const geldZaken = () => S.sp.zaken || (S.sp.zaken = {spaar:0, aandelen:0, aandelenIn:0, zaak:null, laatsteKoers:0});
export function spaar(deel){ const sp = S.sp, z = geldZaken(); const b = Math.floor(sp.geld * deel); if (b <= 0) return; sp.geld -= b; z.spaar += b; S.week.tekst.push(`Je zet ${geldTxt(b)} op je spaarrekening.`); }
export function haalSpaar(){ const sp = S.sp, z = geldZaken(); if (!z.spaar) return; sp.geld += z.spaar; S.week.tekst.push(`Je haalt ${geldTxt(z.spaar)} van je spaarrekening.`); z.spaar = 0; }
export function koopAandelen(deel){ const sp = S.sp, z = geldZaken(); const b = Math.floor(sp.geld * deel); if (b <= 0) return; sp.geld -= b; z.aandelen += b; z.aandelenIn += b; S.week.tekst.push(`Je koopt voor ${geldTxt(b)} aandelen. Spannend!`); }
export function verkoopAandelen(){ const sp = S.sp, z = geldZaken(); if (!z.aandelen) return; const w = z.aandelen - z.aandelenIn; sp.geld += z.aandelen;
  S.week.tekst.push(`Je verkoopt al je aandelen voor ${geldTxt(z.aandelen)}. ${w >= 0 ? `Winst: ${geldTxt(w)}.` : `Verlies: ${geldTxt(-w)}.`}`); z.aandelen = 0; z.aandelenIn = 0; }
export function startZaak(id){
  const sp = S.sp, z = geldZaken(), x = ZAKEN.find(a => a.id === id); if (!x || z.zaak || sp.leeftijd < 18 || sp.geld < x.prijs) return;
  sp.geld -= x.prijs; z.zaak = {id, n:x.n, prijs:x.prijs, winst:x.winst, totaal:0, laatste:0, weken:0};
  S.car.hist.push(`${seizoenLabel()}: eigen ${x.n.toLowerCase()} geopend`);
  S.week.tekst.push(`Je opent je eigen ${x.n.toLowerCase()}! Op de gevel staat jouw naam in grote letters.`);
  krantMelding(`${sp.naam} opent eigen ${x.n.toLowerCase()}`, 'Op de opening staan vrienden, familie en een paar teamgenoten. De eerste klanten willen vooral een handtekening.', isProf() ? RODDELBLADEN : KRANTEN[club().t]);
}
export function verkoopZaak(){ const sp = S.sp, z = geldZaken(); if (!z.zaak) return; const b = Math.round(z.zaak.prijs * .6); sp.geld += b; S.week.tekst.push(`Je verkoopt je ${z.zaak.n.toLowerCase()} voor ${geldTxt(b)}.`); S.car.hist.push(`${seizoenLabel()}: ${z.zaak.n.toLowerCase()} verkocht`); z.zaak = null; }
