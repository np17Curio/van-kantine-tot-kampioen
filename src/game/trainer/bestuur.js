import { S } from '../../core/state.js';
import { geldTxt, pick, shuffle } from '../../core/utils.js';
import { AMATEUR, CLUBS, DIVS, divClubs } from '../../data/gegevens.js';
import { stand } from '../competitie/spelers.js';
import { rivaal } from '../wedstrijd/fans-pers.js';
import { jeugdSpeler, mijnSel, refKracht } from './ploeg.js';

/* ===================== Trainer: de eisen van het bestuur ===================== */
// Aan het begin van elk seizoen 3 eisen: een hoofdeis (de eindklassering, telt dubbel) en twee nevendoelen.
// Score = hoofdeis × 2 + nevendoelen (max 4). Minder dan 2: ontslagen. Precies 2: laatste waarschuwing.
export const rangOpSterkte = id => divClubs(CLUBS[id].t).sort((a, b) => CLUBS[b].s - CLUBS[a].s).indexOf(id) + 1;
export function maakEisen(halverwege = false){
  const T0 = S.trainer, id = T0.club, c = CLUBS[id], t = c.t, rang = rangOpSterkte(id), onderste = t >= AMATEUR;
  // De hoofdeis: wat je op papier minstens moet kunnen (met wat ruimte voor pech)
  // (de zwakste club van de competitie: geen klassering, wel een fatsoenlijk aantal punten)
  const max = rang === 1 ? 3 : rang === 2 ? 4 : rang === 3 ? 5 : rang <= 6 ? Math.min(7, rang + 2) : onderste || rang === 8 ? 8 : 7;
  const hoofd = {soort:'plek', max, tekst: rang === 1 ? `Strijd om de titel: eindig in de top 3 van de ${DIVS[t]}` : max === 7 && rang >= 7 ? 'Degradeer niet rechtstreeks: eindig niet als laatste' : max === 8 ? `Maak er een fatsoenlijk seizoen van: haal minstens ${Math.max(6, Math.round((30 - (rang - 1) * 2.9) * .65))} punten` : `Eindig in de top ${max}`};
  if (max === 8){ hoofd.soort = 'punten'; hoofd.n = Math.max(6, Math.round((30 - (rang - 1) * 2.9) * .65)); }
  hoofd.hoofd = true; // net gemist (1 plek of 2 punten) telt nog voor 1 punt
  const verwachtPt = Math.round((30 - (rang - 1) * 2.9) * .8);
  const pool = [
    {soort:'punten', n:Math.max(8, verwachtPt), tekst:`Haal minstens ${Math.max(8, verwachtPt)} punten`},
    {soort:'thuis', n:rang <= 3 ? 4 : rang <= 6 ? 3 : 2, tekst:`Win minstens ${rang <= 3 ? 4 : rang <= 6 ? 3 : 2} thuiswedstrijden`},
    {soort:'jeugd', n:5, tekst:'Geef een speler van 21 of jonger minstens 5 basisplaatsen'},
    t >= 2 ? {soort:'verkoop', n:0, tekst:'Geef met transfers niet meer uit dan je binnenhaalt (transfersaldo niet negatief)'}
           : {soort:'aankoop', n:Math.round(refKracht()) + 2, tekst:`Haal een versterking van minimaal klasse ${Math.round(refKracht()) + 2}`},
  ];
  const r = rivaal(id); if (r != null && CLUBS[r].t === t) pool.push({soort:'rivaal', tegen:r, tekst:`Haal minstens één punt tegen aartsrivaal ${CLUBS[r].n}`});
  // halverwege het seizoen: geen transferdoel dat al bijna niet meer kan
  const kies = shuffle(pool.filter(e => !halverwege || (e.soort !== 'verkoop' && e.soort !== 'aankoop'))).slice(0, 2);
  T0.eisen = {jaar:S.jaar, halverwege, rang, lijst:[hoofd, ...kies], gezien:false};
  return T0.eisen;
}
// Hoe staat een eis ervoor? {ok (gehaald), bijna (net gemist), staat: 'gehaald' | 'koers' | 'bijna' | 'gevaar', tekst}
export function status(e){
  const T0 = S.trainer, id = T0.club, z = T0.sz, plek = stand(CLUBS[id].t).indexOf(id) + 1, tab = S.tab[id] || {pt:0, g:0};
  const klaar = S.ronde >= 14;
  switch (e.soort){
    case 'plek': { const ok = plek <= e.max, bijna = !ok && plek === e.max + 1; if (!tab.g) return {ok:false, staat:'koers', tekst:'Nog niet begonnen'}; return {ok, bijna, staat: ok ? (klaar ? 'gehaald' : 'koers') : bijna ? 'bijna' : 'gevaar', tekst: bijna ? `Nu ${plek}e: net niet, 1 plek te laag` : `Nu ${plek}e`}; }
    case 'punten': { const ok = tab.pt >= e.n, nodig = e.n * tab.g / 14, bijna = !ok && e.hoofd && klaar && tab.pt >= e.n - 2; return {ok, bijna, staat: ok ? 'gehaald' : bijna ? 'bijna' : tab.pt >= nodig - 1 ? 'koers' : 'gevaar', tekst:`${tab.pt} van ${e.n} punten${bijna ? ': net niet' : ''}`}; }
    case 'thuis': { const ok = z.thuisW >= e.n; return {ok, staat: ok ? 'gehaald' : z.thuisW + (7 - z.thuisGes) >= e.n ? 'koers' : 'gevaar', tekst:`${z.thuisW} van ${e.n} thuiszeges`}; }
    case 'jeugd': { const b = Math.max(0, ...mijnSel().filter(jeugdSpeler).map(x => x.bT || 0)), ok = b >= e.n; return {ok, staat: ok ? 'gehaald' : b + (14 - S.ronde) >= e.n ? 'koers' : 'gevaar', tekst:`${b} van ${e.n} basisplaatsen`}; }
    case 'verkoop': { const ok = z.saldo >= e.n, nogOpen = S.ronde < 7 || !!T0.venster; return {ok, staat: ok ? (nogOpen ? 'koers' : 'gehaald') : nogOpen ? 'koers' : 'gevaar', tekst:`Saldo ${geldTxt(z.saldo)}`}; }
    case 'aankoop': { const ok = z.gekocht.some(k => k >= e.n); return {ok, staat: ok ? 'gehaald' : S.ronde < 7 || T0.venster ? 'koers' : 'gevaar', tekst: ok ? 'Gehaald' : 'Nog niet'}; }
    case 'rivaal': { const ok = (z.rivaalPt || 0) > 0; return {ok, staat: ok ? 'gehaald' : z.rivaalGes < 2 ? 'koers' : 'gevaar', tekst: ok ? `${z.rivaalPt} ${z.rivaalPt === 1 ? 'punt' : 'punten'}` : `${z.rivaalGes} van 2 gespeeld`}; }
  }
  return {ok:false, staat:'gevaar', tekst:''};
}
// De hoofdeis telt dubbel; net gemist telt nog voor 1 punt
export const score = () => S.trainer.eisen.lijst.reduce((a, e, i) => { const st = status(e); return a + (st.ok ? (i === 0 ? 2 : 1) : i === 0 && st.bijna ? 1 : 0); }, 0);
// Einde seizoen: het oordeel van het bestuur
export function oordeel(){
  const T0 = S.trainer, s = score(), c = CLUBS[T0.club];
  const uit = s < 2 ? 'ontslag' : s === 2 ? 'waarschuwing' : 'tevreden';
  const tekst = uit === 'ontslag' ? `Het bestuur van ${c.n} is klaar met je: je haalde ${s} van de 4 punten uit de eisen. Je bent ontslagen.`
    : uit === 'waarschuwing' ? `Het bestuur is niet tevreden (${s} van de 4 punten). Volgend seizoen moet het beter, anders sta je op straat.`
    : `Het bestuur is tevreden: ${s} van de 4 punten uit de eisen. Je krijgt er volgend seizoen extra budget bij.`;
  return {score:s, uit, tekst, lijst:T0.eisen.lijst.map(e => { const st = status(e); return {eis:e.tekst, ok:st.ok, bijna:!!st.bijna, voortgang:st.tekst}; })};
}
// Na elke wedstrijd: het vertrouwen reageert ook op of je op koers ligt voor de hoofdeis
export function bijwerkenVertrouwen(){
  const T0 = S.trainer; if (!T0.eisen || S.ronde < 5) return;
  const st = status(T0.eisen.lijst[0]).staat;
  T0.bestuur = Math.max(0, Math.min(100, T0.bestuur + (st === 'gevaar' ? -2 : 1)));
}
export const nieuwSeizoenTeller = () => ({thuisW:0, thuisGes:0, saldo:0, gekocht:[], rivaalW:0, rivaalGes:0, rivaalPt:0});
export const krantOordeel = o => pick(o.uit === 'ontslag' ? ['Het bestuur grijpt in', 'Einde verhaal voor de trainer'] : o.uit === 'waarschuwing' ? ['Trainer krijgt nog één kans', 'Bestuur kritisch over het seizoen'] : ['Bestuur tevreden over de trainer', 'Vertrouwen in de trainer']);
