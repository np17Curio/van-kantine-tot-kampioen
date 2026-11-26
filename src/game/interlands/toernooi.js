import { S, mod, ovr, seizoenLabel } from '../../core/state.js';
import { keuzeKnop, knop } from '../../core/ui.js';
import { clamp, esc, pick, randInt, rnd } from '../../core/utils.js';
import { LANDEN } from '../../data/gegevens.js';
import { simGoals } from '../competitie/competitie.js';
import { interDrempel, interScore, landenVoor, magInterland } from './interlands.js';
import { KRANTEN, vKrant } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { social } from '../prive/social.js';
import { naSeizoen } from '../seizoen/seizoen.js';
import { fmt1, gemiddelde } from '../speler/o23.js';
import { MOMENTS, focusBoost, kans } from '../wedstrijd/momenten.js';
import { planWedstrijd, verderSpelen } from '../wedstrijd/wedstrijd.js';
import { animPush, reeksStrafschoppen } from '../../render/pitch.js';
import { nationS } from '../../data/gegevens.js';
import { ik, team } from '../../core/geslacht.js';

/* ===================== Eindtoernooien: WK, EK en de andere continenten ===================== */
export const CONTINENT = {Nederland:'eu', 'België':'eu', Duitsland:'eu', Frankrijk:'eu', Spanje:'eu', Engeland:'eu', Portugal:'eu', 'Italië':'eu', 'Kroatië':'eu', Turkije:'eu', Polen:'eu', Zwitserland:'eu', Denemarken:'eu', Noorwegen:'eu', 'Tsjechië':'eu', Griekenland:'eu',
  'Brazilië':'zam', 'Argentinië':'zam', Marokko:'af', Senegal:'af', Nigeria:'af', Ghana:'af', 'Kaapverdië':'af', Japan:'as', 'Indonesië':'as', 'Curaçao':'nam', Suriname:'nam', Mexico:'nam', 'Verenigde Staten':'nam'};
// Extra tegenstanders op toernooien (je kunt er zelf niet voor uitkomen)
export const EXTRA_LANDEN = [
  {n:'Oostenrijk',s:78,c:'eu'},{n:'Schotland',s:74,c:'eu'},{n:'Servië',s:76,c:'eu'},{n:'Oekraïne',s:76,c:'eu'},{n:'Zweden',s:76,c:'eu'},{n:'Wales',s:72,c:'eu'},{n:'Hongarije',s:73,c:'eu'},
  {n:'Uruguay',s:82,c:'zam'},{n:'Colombia',s:81,c:'zam'},{n:'Ecuador',s:77,c:'zam'},{n:'Chili',s:74,c:'zam'},{n:'Paraguay',s:73,c:'zam'},{n:'Peru',s:71,c:'zam'},{n:'Venezuela',s:70,c:'zam'},{n:'Bolivia',s:64,c:'zam'},
  {n:'Egypte',s:76,c:'af'},{n:'Algerije',s:76,c:'af'},{n:'Ivoorkust',s:77,c:'af'},{n:'Kameroen',s:75,c:'af'},{n:'Tunesië',s:73,c:'af'},{n:'Mali',s:73,c:'af'},{n:'Zuid-Afrika',s:70,c:'af'},{n:'DR Congo',s:71,c:'af'},
  {n:'Zuid-Korea',s:78,c:'as'},{n:'Iran',s:77,c:'as'},{n:'Australië',s:76,c:'as'},{n:'Saoedi-Arabië',s:73,c:'as'},{n:'Qatar',s:70,c:'as'},{n:'Irak',s:69,c:'as'},{n:'Oezbekistan',s:70,c:'as'},{n:'China',s:63,c:'as'},{n:'Vietnam',s:62,c:'as'},
  {n:'Verenigde Staten',s:79,c:'nam'},{n:'Mexico',s:79,c:'nam'},{n:'Canada',s:76,c:'nam'},{n:'Panama',s:70,c:'nam'},{n:'Costa Rica',s:70,c:'nam'},{n:'Jamaica',s:68,c:'nam'},{n:'Honduras',s:66,c:'nam'},{n:'Haïti',s:62,c:'nam'}
];
export const CONT_TOERNOOI = {eu:'EK', zam:'Copa América', af:'Afrika Cup', as:'Azië Cup', nam:'Gold Cup'};
export const alleLanden = () => LANDEN.map(l => ({n:l.n, s:l.s, c:CONTINENT[l.n] || 'eu'})).concat(EXTRA_LANDEN.map(l => ({...l, s:nationS(l.n, l.s)}))); // (vrouwen: andere sterktes)
export const tLand = n => alleLanden().find(l => l.n === n) || {n, s:70, c:'eu'};
export const lidw = naam => /^(WK|EK)$/.test(naam) ? 'het' : 'de';
// Zomer na het seizoen: om de 2 jaar een toernooi, afwisselend het WK en het EK (of het toernooi van je eigen continent)
export function toernooiSoort(){ const zomer = S.jaar + 1; return zomer % 4 === 2 ? 'WK' : zomer % 4 === 0 ? 'cont' : null; }
export function toernooiLand(){
  const sp = S.sp; if (sp.land) return sp.land;
  const l = Object.entries(S.car.int || {}).filter(([, x]) => x.caps > 0).sort((a, b) => b[1].caps - a[1].caps);
  return l.length ? l[0][0] : null;
}
export function toernooiSelectie(){
  const soort = toernooiSoort(), land = toernooiLand(), sp = S.sp; if (!soort || !land || sp.leeftijd < 17 || sp.interStop) return null;
  const naam = soort === 'WK' ? 'WK' : CONT_TOERNOOI[tLand(land).c], jaar = S.jaar + 1, titel = `${naam} ${jaar}`, lw = lidw(naam), basis = {titel, land, naam, jaar, mee:false};
  if (sp.clubloos) return {...basis, reden:`Je zit zonder club. De bondscoach neemt je niet mee naar ${lw} ${titel}.`};
  if (sp.blessure > 0) return {...basis, reden:`Je bent geblesseerd en mist ${lw} ${titel}. Balen!`};
  if (!magInterland()) return {...basis, reden:`Je speelt niet op een hoog genoeg niveau. De bondscoach van ${land} neemt je niet mee naar ${lw} ${titel}.`};
  // Nog niet gekozen en meer landen mogelijk? Dan is een eindtoernooi een keuze: het is officieel, dus daarna zit je vast
  const vrij = !sp.land && landenVoor().length > 1;
  if (vrij){
    const opties = landenVoor().filter(l => interScore(l) - interDrempel(l) >= -1).map(l => { const n = soort === 'WK' ? 'WK' : CONT_TOERNOOI[tLand(l).c]; return {land:l, naam:n, titel:`${n} ${jaar}`}; });
    if (opties.length){
      const wie = opties.map(o => o.land).join(' en '), waar = [...new Set(opties.map(o => `${lidw(o.naam)} ${o.titel}`))].join(' of ');
      const rest = opties.length === 1 ? `voor ${landenVoor().filter(l => l !== opties[0].land).join(' of ')}` : 'voor het andere land';
      return {...opties[0], jaar, mee:true, keuze:opties, reden:`${wie} ${opties.length > 1 ? 'willen' : 'wil'} je meenemen naar ${waar}. Let op: een eindtoernooi is officieel. Ga je mee, dan kies je definitief voor dat land en kun je daarna niet meer ${rest} uitkomen.`};
    }
  }
  const d = interScore(land) - interDrempel(land);
  if (d >= -1) return {...basis, mee:true, reden:`De bondscoach van ${land} heeft zijn selectie bekendgemaakt: jij gaat mee naar ${lw} ${titel}!`};
  return d >= -7 ? {...basis, reden:`Net niet: de bondscoach van ${land} laat je thuis voor ${lw} ${titel}. Met betere cijfers was je erbij geweest.`} : null;
}
// Nee zeggen tegen het eindtoernooi: je houdt je keuze open (de bondscoaches zijn teleurgesteld)
export function toernooiAfzeggen(){
  const E = S.eind, T0 = E && E.toernooi, sp = S.sp; if (!T0 || !T0.mee || E.toernooiKlaar) return;
  (T0.keuze || [{land:T0.land}]).forEach(o => { sp.bonds[o.land] = clamp((sp.bonds[o.land] ?? 40) - 8, 0, 100); });
  E.toernooiKlaar = true; T0.mee = false;
  T0.reden = `Je zegt nee tegen ${(T0.keuze || [T0]).map(o => o.land).join(' en ')}. Je blijft thuis en houdt je keuze nog open.`;
}
export function startToernooi(keus){
  const E = S.eind, T0 = E && E.toernooi, sp = S.sp;
  if (!T0 || !T0.mee || E.toernooiKlaar || S.tw) return;
  if (T0.keuze){ // je kiest zelf voor welk land je meegaat (definitief)
    const o = typeof keus === 'string' && T0.keuze.find(x => x.land === keus); if (!o) return;
    Object.assign(T0, {land:o.land, naam:o.naam, titel:o.titel});
    S.car.hist.push(`${seizoenLabel()}: kiest definitief voor ${o.land} (${o.titel})`);
    krantMelding(`${sp.naam} kiest voor ${o.land}`, `${ik.Hij} gaat mee naar ${lidw(o.naam)} ${o.titel}. Daarmee ligt ${ik.zijn} keuze vast: vanaf nu komt ${ik.hij} alleen nog uit voor ${o.land}.`);
  }
  const mijn = tLand(T0.land);
  sp.land = T0.land;
  const pool = alleLanden().filter(l => l.n !== mijn.n && (T0.naam === 'WK' || l.c === mijn.c)).sort((a, b) => b.s - a.s);
  const d = Math.ceil(pool.length / 3), groep = [pick(pool.slice(0, d)), pick(pool.slice(d, 2 * d)), pick(pool.slice(2 * d))].map(l => l.n);
  const tab = {}; [mijn.n, ...groep].forEach(n => tab[n] = {g:0, w:0, gl:0, v:0, dv:0, dt:0, pt:0});
  S.tw = {titel:T0.titel, naam:T0.naam, land:mijn.n, groep:[mijn.n, ...groep], tab, speeldag:0, fase:'groep', rondes: T0.naam === 'WK' ? ['Achtste finale', 'Kwartfinale', 'Halve finale', 'Finale'] : ['Kwartfinale', 'Halve finale', 'Finale'], koIdx:0, koTegen:null, gehad:[...groep], gespeeld:[], andere:[], goals:0, assists:0, cijfers:[], geschorst:false, klaar:false, res:null};
  S.fase = 'toernooi';
}
export const TW_PAREN = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
export function twUitslag(a, b, ga, gb){ const T = S.tw.tab; for (const [x, v, t] of [[a, ga, gb], [b, gb, ga]]){ const e = T[x]; e.g++; e.dv += v; e.dt += t; if (v > t){ e.w++; e.pt += 3; } else if (v === t){ e.gl++; e.pt++; } else e.v++; } }
export const twStand = () => Object.keys(S.tw.tab).sort((a, b) => { const x = S.tw.tab[a], y = S.tw.tab[b]; return y.pt - x.pt || (y.dv - y.dt) - (x.dv - x.dt) || y.dv - x.dv || (a === S.tw.land ? -1 : b === S.tw.land ? 1 : 0); });
export const twRonde = () => S.tw.fase === 'groep' ? `Poulewedstrijd ${S.tw.speeldag + 1}` : S.tw.rondes[S.tw.koIdx];
export function twKoTegen(){
  const tw = S.tw, mijn = tLand(tw.land), van = tw.rondes.length - 1 - tw.koIdx; // 0 = finale
  let pool = alleLanden().filter(l => l.n !== tw.land && !tw.gehad.includes(l.n) && (tw.naam === 'WK' || l.c === mijn.c)).sort((a, b) => b.s - a.s);
  if (!pool.length) pool = alleLanden().filter(l => l.n !== tw.land && (tw.naam === 'WK' || l.c === mijn.c));
  const n = Math.max(2, Math.round(pool.length * [.15, .25, .4, .6][Math.min(van, 3)]));
  const t = pick(pool.slice(0, n)).n; tw.gehad.push(t); return t;
}
export function toernooiWedstrijd(){
  const tw = S.tw, sp = S.sp, L = tLand(tw.land), oppN = tw.fase === 'groep' ? tw.groep[TW_PAREN[tw.speeldag][0][1]] : tw.koTegen, opp = tLand(oppN), ronde = twRonde();
  const T = L.s + (ovr(sp) - L.s) * .1, O = opp.s;
  if (tw.geschorst){
    // Geschorst: je kijkt vanaf de tribune, de uitslag wordt gesimuleerd
    let [a, b] = simGoals(T, O, false), pens = null;
    if (tw.fase === 'ko' && a === b){ const w = rnd() < clamp(.5 + (T - O) / 60, .2, .8); pens = w ? '5-4' : '4-5'; }
    tw.geschorst = false; tw.actie = null; tw.actieTekst = null;
    const M = {inter:{land:tw.land, type:`${tw.titel} · ${ronde}`, toernooi:true, ko:tw.fase === 'ko'}, wij:tw.land, zij:oppN, thuis:true, us:a, them:b, pens, pensWin: pens ? pens === '5-4' : null, cijfer:null, goals:0, assists:0, rood:false, geschorstGemist:true};
    S.M = M; toernooiNaWedstrijd(M);
    tw.melding = `Je was geschorst en zag vanaf de tribune: ${tw.land} - ${oppN} ${a}-${b}${pens ? ` (strafschoppen ${pens})` : ''}. ${M.twTekst}`;
    S.M = null; S.fase = tw.klaar ? 'toernooiEinde' : 'toernooi'; return;
  }
  tw.melding = null;
  const sc = (sp.bonds[tw.land] ?? 40) + sp.vorm * 6 + randInt(-8, 8), rol = sc >= 50 || ovr(sp) >= L.s ? 'basis' : 'invaller';
  const M = {inter:{land:tw.land, type:`${tw.titel} · ${ronde}`, toernooi:true, ko:tw.fase === 'ko'}, oppS:opp.s, wij:tw.land, zij:oppN, thuis:true, rol, us:0, them:0, min:0, ev:[], idx:0, log:[], cijfer:sp.pos === 'VERD' || sp.pos === 'KEEPER' ? 6.3 : 6.0, goals:0, assists:0, geel:false, rood:false, pending:null, klaar:false};
  S.M = M;
  planWedstrijd(M, T, O);
  M.log.push({m:"1'", t:`${tw.titel}, ${ronde.toLowerCase()} tegen ${oppN}. Het volkslied klinkt, het stadion zit vol en thuis kijkt het hele land mee. ${rol === 'basis' ? 'Je staat in de basis.' : 'Je begint op de bank.'}`, k:''});
  S.fase = 'match';
  verderSpelen();
}
// Knock-out: bij gelijkspel strafschoppen. Sta je in het veld, dan neem jij de vijfde
export function twStrafschoppen(M){
  const speelde = M.rol === 'basis' || M.rol === 'invaller', kansJij = speelde && !M.rood ? kans(MOMENTS.penalty.opts[0]) : null;
  let wij = 0, zij = 0;
  { const ks = reeksStrafschoppen(kansJij, M); wij = ks.wij; zij = ks.zij; animPush(M, {soort:'shootout', type:'shootout', kicks:ks.lijst, winst:wij > zij}); }
  M.pens = `${wij}-${zij}`; M.pensWin = wij > zij;
  M.log.push({m:"120'", t:`Verlenging levert niks op. Strafschoppen!${M.penJij === true ? ' Jij neemt de vijfde: raak!' : M.penJij === false ? ' Jij neemt de vijfde... en mist.' : ''} ${M.pensWin ? `${M.wij} wint na strafschoppen (${wij}-${zij})!` : `${M.zij} wint na strafschoppen (${zij}-${wij}).`}`, k: M.pensWin ? 'goal' : 'tegen'});
  if (speelde) M.cijfer += M.penJij === true ? .3 : M.penJij === false ? -.4 : 0;
}
export function toernooiNaWedstrijd(M){
  const tw = S.tw, won = M.us > M.them || (M.us === M.them && M.pensWin === true), ronde = twRonde();
  if (!M.geschorstGemist){ tw.goals += M.goals; tw.assists += M.assists; tw.cijfers.push(M.cijfer); tw.geschorst = !!M.rood; }
  tw.gespeeld.push({ronde, tegen:M.zij, us:M.us, them:M.them, pens:M.pens || null, cijfer:M.cijfer});
  if (tw.fase === 'groep'){
    const [x, y] = TW_PAREN[tw.speeldag][1], X = tw.groep[x], Y = tw.groep[y];
    twUitslag(tw.land, M.zij, M.us, M.them);
    const [a, b] = simGoals(tLand(X).s, tLand(Y).s, false); twUitslag(X, Y, a, b); tw.andere.push(`${X} ${a}-${b} ${Y}`);
    tw.speeldag++;
    if (tw.speeldag < 3) M.twTekst = `Nog ${3 - tw.speeldag} ${3 - tw.speeldag === 1 ? 'poulewedstrijd' : 'poulewedstrijden'}. In de andere wedstrijd: ${X} ${a}-${b} ${Y}.`;
    else {
      const plek = twStand().indexOf(tw.land) + 1;
      if (plek <= 2){ tw.fase = 'ko'; tw.koIdx = 0; tw.koTegen = twKoTegen(); M.twTekst = `${tw.land} eindigt als ${plek}e in de poule en gaat door! In de ${tw.rondes[0].toLowerCase()} wacht ${tw.koTegen}.`; }
      else { tw.klaar = true; tw.res = 'poule'; M.twTekst = `${tw.land} eindigt als ${plek}e in de poule. Uitgeschakeld...`; }
    }
  } else if (won){
    tw.koIdx++;
    if (tw.koIdx >= tw.rondes.length){ tw.klaar = true; tw.res = 'winst'; M.twTekst = `${tw.land} wint ${lidw(tw.naam)} ${tw.titel}!`; }
    else { tw.koTegen = twKoTegen(); M.twTekst = `Door naar de ${tw.rondes[tw.koIdx].toLowerCase()}! Daar wacht ${tw.koTegen}.`; }
  } else { tw.klaar = true; tw.res = tw.rondes[tw.koIdx]; M.twTekst = `Uitgeschakeld in de ${tw.rondes[tw.koIdx].toLowerCase()}.`; }
  if (tw.klaar) eindeToernooi();
}
export function eindeToernooi(){
  const tw = S.tw, sp = S.sp, C = S.car, c = tw.cijfers.filter(x => x !== null), gem = c.length ? gemiddelde(c) : null, lw = lidw(tw.naam);
  const ver = tw.res === 'winst' ? tw.rondes.length : tw.res === 'poule' ? -1 : tw.rondes.indexOf(tw.res); // hoe ver kwam je (index van de ronde waarin je eruit ging)
  tw.prijzen = [];
  const resTekst = tw.res === 'winst' ? `gewonnen met ${tw.land}!` : tw.res === 'poule' ? `uitgeschakeld in de poule met ${tw.land}` : tw.res === 'Finale' ? `verloren finale met ${tw.land}` : `uitgeschakeld in de ${tw.res.toLowerCase()} met ${tw.land}`;
  (C.toernooien = C.toernooien || []).push(`${tw.titel}: ${resTekst} (${c.length} wed, ${tw.goals} G, ${tw.assists} A)`);
  C.hist.push(`${tw.titel}: ${resTekst}`);
  if (tw.res === 'winst'){
    S.huldiging = {soort:'toernooi', prijs:tw.titel, lidw:lw, land:tw.land}; // de huldiging (render/huldigingscene.js)
    tw.prijzen.push(`${tw.titel} met ${tw.land}`); mod('moraal', 15); mod('rep', 10); sp.bonds[tw.land] = clamp((sp.bonds[tw.land] ?? 40) + 10, 0, 100); social().volgers = Math.round(social().volgers * 1.15);
    tw.kop = {kop:`${tw.land} wint ${lw} ${tw.titel}!`, tekst:`Het hele land staat op zijn kop.${tw.goals ? ` ${sp.naam} scoorde ${tw.goals} keer op het toernooi.` : ''} De ${team.spelers} worden als helden onthaald.`};
  } else if (tw.res === 'Finale') tw.kop = {kop:`Finale verloren: ${tw.land} net niet`, tekst:`Zo dichtbij. Toch is het land trots op de spelers.`};
  else if (tw.res === 'poule') tw.kop = {kop:`Drama: ${tw.land} al na de poule naar huis`, tekst:`Een grote teleurstelling. De bondscoach ligt onder vuur.`};
  else tw.kop = {kop:`${tw.land} strandt in de ${tw.res.toLowerCase()}`, tekst:`Het avontuur op ${lw} ${tw.titel} is voorbij.`};
  krantMelding(tw.kop.kop, tw.kop.tekst, KRANTEN[0]);
  const topNodig = randInt(3, 6);
  if (tw.goals >= 3 && tw.goals >= topNodig){ tw.prijzen.push(`Topscorer ${tw.titel} (${tw.goals} goals)`); krantMelding(`${sp.naam} topscorer van ${lw} ${tw.titel}`, `Met ${tw.goals} goals was niemand op het toernooi beter.`, KRANTEN[0]); }
  if (gem !== null && gem >= 7.8 && c.length >= 4 && ver >= tw.rondes.length - 2){ tw.prijzen.push(`Beste speler ${tw.titel}`); mod('rep', 5); }
  C.prijzen.push(...tw.prijzen);
  if (tw.prijzen.length) tw.prijzen.forEach(p => C.hist.push(`${tw.titel}: ${p}`));
  // Telt mee voor de Gouden Bal van het komende seizoen
  const fase = tw.res === 'winst' ? 14 : tw.res === 'Finale' ? 9 : ver === tw.rondes.length - 2 ? 6 : ver === tw.rondes.length - 3 ? 3 : 0;
  sp.tGB = Math.min(30, Math.round(fase + Math.max(0, (gem ?? 6.5) - 6.5) * 4 + tw.goals * 1.5));
  sp.fit = clamp(sp.fit, 0, 100);
}
export function naToernooiWedstrijd(){ S.M = null; mod('fit', 8); S.tw.actie = null; S.tw.actieTekst = null; S.fase = S.tw.klaar ? 'toernooiEinde' : 'toernooi'; }
// Tussen twee toernooiwedstrijden: één keuze, net als in een gewone week (je zit in het trainingskamp van het nationale team)
export const TW_ACTIES = {
  rust:{n:'Rusten en herstellen', s:'Fitheid +18 · focus +2'},
  training:{n:'Extra trainen bij de bondscoach', s:'Bondscoach vertrouwen +5 (meer kans op de basis) · fitheid −6'},
  analyse:{n:'De tegenstander bestuderen', s:'Focus +8 voor de volgende wedstrijd'},
  groep:{n:'Ontspannen met de groep', s:'Moraal +6 · fitheid +6'},
  thuis:{n:'Naar huis bellen', s:'Moraal +4 · focus +3'},
};
export function twActie(id){
  const tw = S.tw, sp = S.sp; if (!tw || tw.actie || !TW_ACTIES[id]) return;
  tw.actie = id; let t;
  if (id === 'rust'){ mod('fit', 18); focusBoost(2); t = pick(['Een rustige dag in het hotel: ijsbad, massage en vroeg naar bed.', 'Je slaapt uit, zwemt een paar baantjes en laat je benen behandelen door de fysio.']); }
  else if (id === 'training'){ sp.bonds[tw.land] = clamp((sp.bonds[tw.land] ?? 40) + 5, 0, 100); mod('fit', -6); t = 'Je blijft na de training nog een uur hangen. De bondscoach ziet het en knikt.'; }
  else if (id === 'analyse'){ const n = focusBoost(8); t = `Je bekijkt beelden van ${tw.fase === 'groep' ? tw.groep[TW_PAREN[tw.speeldag][0][1]] : tw.koTegen}: hun sterke punten en waar ze kwetsbaar zijn. Focus +${n}.`; }
  else if (id === 'groep'){ mod('moraal', 6); mod('fit', 6); t = pick(['Een avond spelletjes met de groep. Er wordt veel gelachen.', 'Samen naar de stad, een ijsje en terug naar het hotel. De sfeer is goed.']); }
  else if (id === 'thuis'){ mod('moraal', 4); focusBoost(3); t = 'Je belt met je familie. Thuis hangt de vlag al uit.'; }
  tw.actieTekst = t;
}
export function naToernooi(){ S.eind.toernooiKlaar = true; S.tw = null; naSeizoen(); }
export function vTwTabel(){
  const tw = S.tw;
  return `<div class="tabelwrap"><table class="tabel"><thead><tr><th>#</th><th>Poule</th><th>W</th><th>G</th><th>V</th><th>Doel</th><th>Pnt</th></tr></thead><tbody>${twStand().map((n, i) => { const e = tw.tab[n];
    return `<tr class="${n === tw.land ? 'mij' : ''}"><td>${i + 1}</td><td>${esc(n)}</td><td>${e.w}</td><td>${e.gl}</td><td>${e.v}</td><td>${e.dv}-${e.dt}</td><td><b>${e.pt}</b></td></tr>`; }).join('')}</tbody></table></div><p class="muted klein-tekst">De nummers 1 en 2 gaan door naar de ${esc(tw.rondes[0].toLowerCase())}.</p>`;
}
export function vTwGespeeld(){
  const tw = S.tw; if (!tw.gespeeld.length) return '';
  return `<div class="paneel"><span class="label">Jullie wedstrijden</span>${tw.gespeeld.map(x => `<p><span class="muted">${esc(x.ronde)}:</span> ${esc(tw.land)} - ${esc(x.tegen)} <b>${x.us}-${x.them}</b>${x.pens ? ` (strafschoppen ${x.pens})` : ''}${x.cijfer !== null && x.cijfer !== undefined ? ` <span class="muted">· jouw cijfer ${fmt1(x.cijfer)}</span>` : ' <span class="muted">· geschorst</span>'}</p>`).join('')}</div>`;
}
export function vToernooi(){
  const tw = S.tw, ronde = twRonde(), opp = tw.fase === 'groep' ? tw.groep[TW_PAREN[tw.speeldag][0][1]] : tw.koTegen;
  return `<div class="verhaal"><span class="label">${esc(tw.titel)} · ${esc(tw.land)}</span><h2>${tw.fase === 'groep' && tw.speeldag === 0 ? `Welkom op ${lidw(tw.naam)} ${esc(tw.titel)}!` : esc(ronde)}</h2>
    ${tw.fase === 'groep' && tw.speeldag === 0 ? `<p>Je hebt je koffer gepakt en zit in het trainingskamp van ${esc(tw.land)}. In de poule spelen jullie tegen ${tw.groep.slice(1).map(esc).join(', ')}.</p>` : ''}
    ${tw.melding ? `<p class="melding">${esc(tw.melding)}</p>` : ''}
    <p>Volgende wedstrijd: <b>${esc(tw.land)} - ${esc(opp)}</b> <span class="muted">(${esc(ronde.toLowerCase())}, sterkte ${tLand(opp).s})</span>${tw.geschorst ? ' <span class="fouttxt">· je bent geschorst</span>' : ''}</p>
    ${tw.goals || tw.assists ? `<p class="muted">Jij op dit toernooi: ${tw.goals} ${tw.goals === 1 ? 'goal' : 'goals'}, ${tw.assists} ${tw.assists === 1 ? 'assist' : 'assists'}.</p>` : ''}</div>
    ${tw.fase === 'groep' ? `<div class="paneel"><span class="label">Poule</span>${vTwTabel()}</div>` : ''}
    ${vTwActies()}
    ${vTwGespeeld()}
    ${knop(tw.geschorst ? 'Wedstrijd bekijken vanaf de tribune' : `Speel: ${esc(tw.land)} - ${esc(opp)}`, toernooiWedstrijd)}`;
}
// Je keuze voor de volgende wedstrijd, met je fitheid, focus en moraal erbij
function vTwActies(){
  const tw = S.tw, sp = S.sp;
  const stand = `<p class="muted klein-tekst">Fitheid <b>${Math.round(sp.fit)}</b> · focus <b>${Math.round(sp.focus ?? 65)}</b> · moraal <b>${Math.round(sp.moraal)}</b> · vertrouwen bondscoach <b>${Math.round(sp.bonds[tw.land] ?? 40)}</b></p>`;
  if (tw.actie) return `<div class="paneel"><span class="label">Voor de wedstrijd</span>${stand}<p class="melding">${esc(tw.actieTekst || '')}</p></div>`;
  return `<section class="activiteiten"><h3 class="sectiekop">Wat doe je voor de wedstrijd?</h3>${stand}<div class="keuzes">${Object.entries(TW_ACTIES).map(([id, a]) => keuzeKnop(a.n, a.s, () => twActie(id))).join('')}</div></section>`;
}
export function vToernooiEinde(){
  const tw = S.tw, c = tw.cijfers.filter(x => x !== null), gem = c.length ? fmt1(gemiddelde(c)) : '–';
  return `<div class="verhaal"><span class="label">${esc(tw.titel)} · afgelopen</span>
    ${tw.res === 'winst' ? `<div class="kampioen"><span class="label">Kampioen!</span><h2>🏆 ${esc(tw.titel)}</h2><p>${esc(tw.land)} wint ${lidw(tw.naam)} ${esc(tw.titel)}! Je tilt de beker op voor een zee van supporters. Dit is het mooiste moment van je carrière.</p></div>`
      : `<h2>${tw.res === 'Finale' ? 'Finale verloren' : tw.res === 'poule' ? 'Uitgeschakeld in de poule' : `Uitgeschakeld in de ${esc(tw.res.toLowerCase())}`}</h2><p>${tw.res === 'Finale' ? 'Zo dichtbij. Je kijkt met tranen in je ogen naar de feestende tegenstander.' : 'Het avontuur is voorbij. Met hangende schouders vlieg je terug naar huis.'}</p>`}
    <p>Jij op ${lidw(tw.naam)} ${esc(tw.titel)}: ${c.length} ${c.length === 1 ? 'wedstrijd' : 'wedstrijden'}, ${tw.goals} ${tw.goals === 1 ? 'goal' : 'goals'}, ${tw.assists} ${tw.assists === 1 ? 'assist' : 'assists'}, gemiddeld cijfer ${gem}.</p>
    ${tw.prijzen.length ? `<div><span class="label">Prijzen</span><div class="prijzen" style="margin-top:6px">${tw.prijzen.map(p => `<span class="prijs">${esc(p)}</span>`).join('')}</div></div>` : ''}
    ${S.sp.tGB ? `<p class="muted">Je toernooi telt mee voor de Gouden Bal van volgend seizoen.</p>` : ''}</div>
    ${tw.kop ? vKrant([{bron:pick(KRANTEN[0]), kop:tw.kop.kop, tekst:tw.kop.tekst}]) : ''}
    ${vTwGespeeld()}
    ${knop('Naar de zomer', naToernooi)}`;
}
