import { S, ovr } from '../core/state.js';
import { CLUBS } from './gegevens.js';
import { clubFormatie, plekkenBijClub } from '../game/team/formatie.js';

/* ===================== Plekken: waar je precies speelt ===================== */
// Binnen je positie (keeper, verdediger, middenvelder, spits) speel je op een eigen plek: een centrale verdediger of een back,
// een verdedigende (CDM), centrale (CM) of aanvallende middenvelder (CAM) of een man op de flank, een spits of een buitenspeler.
// Je plek bepaalt wat voor momenten je in een wedstrijd krijgt (een CDM vaker tackles, een CAM vaker steekballen en schoten),
// hoe makkelijk je scoort (afwerken is het vak van een spits) en hoeveel goals en assists je ploeg van jou verwacht.
// [id, naam, uitleg]
export const PLEKKEN = {
  KEEPER:[['GK', 'Keeper', 'Reddingen en uittrappen']],
  VERD:[['CB', 'Centrale verdediger', 'Duels, kopballen, de achterhoede leiden'], ['RB', 'Rechtsback', 'Mee opkomen langs de rechterlijn, voorzetten'], ['LB', 'Linksback', 'Mee opkomen langs de linkerlijn, voorzetten']],
  MID:[['CDM', 'Verdedigende middenvelder', 'Ballen afpakken, de rust bewaren, het team afschermen'], ['CM', 'Centrale middenvelder', 'Overal te vinden: verdedigen, passen, af en toe scoren'],
    ['CAM', 'Aanvallende middenvelder', 'Steekballen, de assist, en zelf schieten'], ['RM', 'Rechtermiddenvelder', 'Op de rechterflank: counters en voorzetten'], ['LM', 'Linkermiddenvelder', 'Op de linkerflank: counters en voorzetten']],
  SPITS:[['ST', 'Spits', 'In de zestien: goals maken en kopballen'], ['RW', 'Rechtsbuiten', 'Dribbelen en naar binnen snijden vanaf rechts'], ['LW', 'Linksbuiten', 'Dribbelen en naar binnen snijden vanaf links']],
};
export const STANDAARD_PLEK = {KEEPER:'GK', VERD:'CB', MID:'CM', SPITS:'ST'};
// Welke momenten je vaker (>1) of minder vaak (<1) krijgt op deze plek (bovenop de pool van je positie: gegevens.js MOMENT_POOL).
// Een moment dat niet in de pool van je positie zit (vleugel: de bal op de flank) krijgt hier zijn eigen gewicht
export const PLEK_MOMENTEN = {
  CB:{verdedigen:1.3, kopduel:1.5, tackle:1.2, verdCorner:1.2, counter:.5, opbouw:1.1},
  RB:{counter:1.7, opbouw:1.3, kopduel:.6, verdedigen:.9, verdCorner:.7, corner:.8, vleugel:1}, LB:{counter:1.7, opbouw:1.3, kopduel:.6, verdedigen:.9, verdCorner:.7, corner:.8, vleugel:1},
  CDM:{tackle:1.7, verdedigen:1.9, counter:.6, eenOpEen:.35, volley:.5, rand:.55, diepteBal:1.2, vrijeTrap:.8},
  CM:{},
  CAM:{rand:1.5, eenOpEen:1.7, diepteBal:1.5, volley:1.3, vrijeTrap:1.2, tackle:.45, verdedigen:.35},
  RM:{vleugel:3, counter:1.4, rand:.55, eenOpEen:.6, volley:.6, corner:1.2, tackle:.8, verdedigen:.7, diepteBal:.6}, LM:{vleugel:3, counter:1.4, rand:.55, eenOpEen:.6, volley:.6, corner:1.2, tackle:.8, verdedigen:.7, diepteBal:.6},
  ST:{eenOpEen:1.3, kopduel:1.25, penalty:1.3, counter:.8, tackle:.7},
  RW:{vleugel:3.5, counter:1.3, rand:.6, eenOpEen:.7, volley:.6, kopduel:.45, corner:1.2, penalty:.7}, LW:{vleugel:3.5, counter:1.3, rand:.6, eenOpEen:.7, volley:.6, kopduel:.45, corner:1.2, penalty:.7},
};
// Extra moeilijkheid bij een schot (zelfde schaal als momenten.js kans(): 1 punt ≈ 2% kans). Een spits is de afmaker
export const PLEK_AFWERKEN = {ST:0, RW:2, LW:2, CAM:3, CM:6, RM:5, LM:5, CDM:9, RB:7, LB:7, CB:9, GK:0};
// Hoeveel goals plus assists jouw ploeg per wedstrijd van jou verwacht (wedstrijd.js verwachteBijdrage)
export const PLEK_BIJDRAGE = {ST:.55, RW:.5, LW:.5, CAM:.5, CM:.4, RM:.42, LM:.42, CDM:.22, RB:.22, LB:.22, CB:.12, GK:0};

export const plekkenVoor = pos => PLEKKEN[pos] || PLEKKEN.MID;
// Op welke flank je speelt: 'R' (rechts), 'L' (links) of null (centraal). Rechts is in het 3D-veld de kant van de camera (kleine y)
const KANT = {RB:'R', RM:'R', RW:'R', LB:'L', LM:'L', LW:'L'};
export const plekKant = () => { const sp = S && S.sp; return sp && sp.pos !== 'KEEPER' ? KANT[mijnPlek()] || null : null; };
export const geldigePlek = (pos, plek) => plekkenVoor(pos).some(([id]) => id === plek) ? plek : STANDAARD_PLEK[pos] || 'CM';
// De plekken die jouw club heeft voor jouw positie (de formatie van de club: game/team/formatie.js), of null zonder club
export const clubPlekken = (sp = S && S.sp) => !sp || sp.clubloos || sp.club == null || !CLUBS[sp.club] ? null : plekkenBijClub(sp.club, sp.pos);
export const mijnFormatie = (sp = S && S.sp) => sp && sp.club != null ? clubFormatie(sp.club) : null;
// De best passende plek uit een lijst
const bestePlek = (lijst, sp) => lijst.slice().sort((a, b) => plekFit(b, sp) - plekFit(a, sp))[0];
// Jouw plek (oude opslag zonder plek: de standaardplek van je positie). Heeft je club die plek niet in zijn formatie (een CAM in
// een 4-4-2), dan speel je op de plek in die formatie die het best bij je past
export const mijnPlek = () => {
  const sp = S && S.sp; if (!sp) return 'CM';
  const p = geldigePlek(sp.pos, sp.plek), mag = clubPlekken(sp);
  return !mag || mag.includes(p) ? p : bestePlek(mag, sp);
};
export const plekNaam = (plek, pos) => (plekkenVoor(pos).find(([id]) => id === plek) || [, ''])[1];
// Kort voor op het scherm: "CDM · Verdedigende middenvelder"
export const plekTekst = (sp = S.sp) => { const p = sp === S.sp ? mijnPlek() : geldigePlek(sp.pos, sp.plek); return `${p} · ${plekNaam(p, sp.pos)}`; };
// Welke kwaliteiten (sp.a) een plek vraagt: daarmee kijkt de trainer of een plek bij je past
export const PLEK_KWAL = {
  GK:{verd:1},
  CB:{verd:.6, cond:.2, pas:.2}, RB:{verd:.4, cond:.35, pas:.15, drib:.1}, LB:{verd:.4, cond:.35, pas:.15, drib:.1},
  CDM:{verd:.5, pas:.35, cond:.15}, CM:{pas:.45, cond:.25, verd:.15, drib:.15}, CAM:{pas:.35, drib:.3, afw:.35},
  RM:{drib:.35, cond:.3, pas:.25, afw:.1}, LM:{drib:.35, cond:.3, pas:.25, afw:.1},
  ST:{afw:.65, cond:.2, drib:.15}, RW:{drib:.45, afw:.3, cond:.25}, LW:{drib:.45, afw:.3, cond:.25},
};
export const plekFit = (plek, sp = S.sp) => { const w = PLEK_KWAL[plek] || {}; let t = 0; for (const k in w) t += w[k] * (sp.a[k] || 0); return t; };
// Hoe goed een plek bij je past, vergeleken met je beste plek: 'goed', 'redelijk' of 'minder'
export function plekPast(plek, sp = S.sp){
  const best = Math.max(...plekkenVoor(sp.pos).map(([id]) => plekFit(id, sp))), d = best - plekFit(plek, sp);
  return d <= 1.5 ? 'goed' : d <= 4 ? 'redelijk' : 'minder';
}
const PAST_TEKST = {goed:'Past goed bij je', redelijk:'Past redelijk bij je', minder:'Past minder bij je'};
export const plekPastTekst = plek => PAST_TEKST[plekPast(plek)];

/* ---- Het gesprek met de trainer: bij elke nieuwe club geef je aan waar je wilt spelen, de trainer beslist ---- */
// Wisselen kan dus niet elke week. sp.plekGesprek = {club, jaar, ok}. Zei de trainer nee, dan mag je het een seizoen later
// nog een keer vragen bij dezelfde club.
const hash = t => { let h = 2166136261; for (const c of String(t)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
// Op een plek heeft de trainer misschien al een vaste kracht staan (per club en seizoen, zodat opnieuw laden niets verandert)
function bezettePlek(sp){
  const lijst = clubPlekken(sp) || plekkenVoor(sp.pos).map(([id]) => id), h = hash(`${sp.club}|${S.jaar}|${sp.pos}`);
  return lijst.length > 1 && h % 2 ? lijst[(h >>> 3) % lijst.length] : null;
}
const magGesprek = sp => !!sp && !sp.clubloos && !sp.o23 && sp.pos !== 'KEEPER' && sp.club != null;
// Nieuwe club, nog niet gepraat over je plek?
export const plekGesprekNodig = (sp = S.sp) => magGesprek(sp) && (!sp.plekGesprek || sp.plekGesprek.club !== sp.club);
// Nee gekregen en een seizoen verder: je mag het nog een keer vragen
export const plekOpnieuwMag = (sp = S.sp) => magGesprek(sp) && !!sp.plekGesprek && sp.plekGesprek.club === sp.club && !sp.plekGesprek.ok && !sp.plekGesprek.opnieuw && S.jaar > sp.plekGesprek.jaar;

export function vraagPlek(plek, stil = false){
  const sp = S.sp; if (!magGesprek(sp) || geldigePlek(sp.pos, plek) !== plek) return;
  const opnieuw = plekOpnieuwMag(sp); if (!plekGesprekNodig(sp) && !opnieuw) return;
  // (alleen plekken die in de formatie van de club bestaan: in een 4-4-2 is er geen CAM)
  const lijst = clubPlekken(sp) || plekkenVoor(sp.pos).map(([id]) => id); if (!lijst.includes(plek)) return;
  sp.plekVoorkeur = plek;
  const bezet = bezettePlek(sp);
  const best = Math.max(...lijst.map(id => plekFit(id, sp))), tekort = best - plekFit(plek, sp);
  const klasse = Math.max(-8, Math.min(8, ovr(sp) - ((CLUBS[sp.club] || {}).s ?? 60))); // (ben je beter dan de club, dan past de trainer zich eerder aan)
  let p = .62 - tekort * .05 + klasse * .02 + (plek === STANDAARD_PLEK[sp.pos] ? .1 : 0) + (opnieuw ? .1 : 0);
  if (plek === bezet) p -= .5;
  p = Math.max(.08, Math.min(.95, p));
  // Welke andere plek de trainer je zou geven als hij nee zegt. Is er geen andere vrije plek (een 4-3-3 heeft op het middenveld alleen CM
  // en CDM, en de CDM is bezet), dan heeft nee zeggen geen zin: dan krijg je je wens gewoon
  const anders = bestePlek(lijst.filter(id => id !== bezet && id !== plek), sp);
  const ok = !anders || (hash(`${sp.club}|${S.jaar}|${plek}|${opnieuw}`) % 1000) / 1000 < p;
  let tekst, nieuw = plek;
  if (ok) tekst = `Je zegt tegen de trainer dat je het liefst als ${plek} speelt. Hij knikt: "Dat kan. Laat maar zien dat het werkt."`;
  else {
    nieuw = anders;
    const reden = plek === bezet ? '"Op die plek heb ik al een vaste kracht staan.'
      : tekort > 4 ? '"Daar ben je nog niet goed genoeg voor. Jouw kwaliteiten passen beter ergens anders.'
      : '"Eerst moet je je hier bewijzen.';
    tekst = `Je zegt tegen de trainer dat je het liefst als ${plek} speelt. Hij schudt zijn hoofd: ${reden} Ik zie je als ${nieuw}."`;
  }
  sp.plek = nieuw; sp.plekGesprek = {club:sp.club, jaar:S.jaar, ok, ...(opnieuw ? {opnieuw:true} : {})};
  if (!ok && !opnieuw) tekst += ' Volgend seizoen mag je het nog een keer vragen.';
  if (S.week && !stil) S.week.plekUitslag = {ok, tekst}; // (de kaart in het weekoverzicht toont het antwoord)
  return {ok, plek:nieuw, tekst};
}
// Speel of simuleer je zonder gesprek, dan vraagt je zaakwaarnemer het namens jou (je voorkeur van vroeger)
export function plekGesprekAuto(){
  const sp = S.sp; if (!plekGesprekNodig(sp)) return;
  const wens = geldigePlek(sp.pos, sp.plekVoorkeur || sp.plek), lijst = clubPlekken(sp) || [wens];
  vraagPlek(lijst.includes(wens) ? wens : bestePlek(lijst, sp), true); // (bestaat je wens niet in deze formatie, dan de best passende plek)
}

// Voor een aanbieding van een club (transfervenster, selectiedagen, huur): welke formatie ze spelen en of jouw favoriete plek
// daar bestaat. Bijvoorbeeld "4-2-3-1 · CAM kan" of "4-4-2 · geen CAM, wel CM"
export function formatieBijBod(id){
  const sp = S.sp; if (!sp || id == null || !CLUBS[id]) return '';
  const f = clubFormatie(id); if (sp.pos === 'KEEPER') return f;
  const lijst = plekkenBijClub(id, sp.pos), wens = geldigePlek(sp.pos, sp.plekVoorkeur || sp.plek);
  return lijst.includes(wens) ? `${f} · ${wens} kan` : `${f} · geen ${wens}, wel ${bestePlek(lijst, sp)}`;
}
