import { S, mod, tmp } from '../../core/state.js';
import { keuzeKnop, knop } from '../../core/ui.js';
import { clamp, geldTxt, pick, randInt, rnd } from '../../core/utils.js';
import { krantMelding, roddel } from '../media/roddel.js';
import { uitgaanKrant } from '../media/uitgaan-krant.js';
import { isProf } from './sponsors.js';
import { kroegEvent, kroegKans } from '../speler/kalmte.js';
import { statusPunten } from '../speler/status.js';
import { TUCHT_LABEL, ergernis, tucht } from '../team/tucht.js';
import { focusBoost, kans } from '../wedstrijd/momenten.js';

/* ===================== Verleidingen: casino en feesten ===================== */
// Een verborgen meter (0-100). Hoe vaker je gokt of feest, hoe hoger. Boven de 50 krijg je last van de drang, boven de 70 gaat het echt mis
export const verleiding = () => S.sp.verl || (S.sp.verl = {meter:0, netto:0, keer:0, feesten:0, hulp:0, boeteWeek:-99});
export const CASINO_INZET = [100, 1000, 10000, 100000];
export const HULP_PRIJS = () => Math.max(300, Math.min(15000, Math.round(S.sp.salaris * .02 / 100) * 100));
export function verlStaat(m){ return m >= 70 ? ['Het beheerst je leven. Je denkt nergens anders meer aan.', 'r-riskant'] : m >= 50 ? ['Je denkt er vaak aan. Soms te vaak.', 'r-riskant'] : m >= 30 ? ['Het wordt een gewoonte. Pas een beetje op.', 'r-gem'] : ['Je hebt het onder controle.', 'r-veilig']; }
export function casino(inzet, gok){
  const sp = S.sp, w = S.week, v = verleiding(); if (sp.leeftijd < 18 || w.casino || sp.geld < inzet || v.hulp > 0) return;
  w.casino = true; sp.geld -= inzet; v.keer++; v.meter = clamp(v.meter + (inzet >= 10000 ? 10 : 7), 0, 100);
  const kans = gok ? 1 / 37 : 18 / 37, keer = gok ? 36 : 2, won = rnd() < kans, kleur = pick(['rood', 'zwart']), anders = rnd() < 1 / 19 ? 'groen (de nul)' : kleur === 'rood' ? 'zwart' : 'rood';
  let t;
  if (won){ const winst = inzet * keer; sp.geld += winst; v.netto += winst - inzet; mod('moraal', gok ? 10 : 4);
    t = gok ? `Je zet ${geldTxt(inzet)} op nummer ${randInt(1, 36)}. Het balletje rolt... en valt erin! Je wint ${geldTxt(winst)}! Het hele casino klapt.` : `Je zet ${geldTxt(inzet)} op ${kleur}. Raak! Je verdubbelt je geld: ${geldTxt(winst)}.`;
    if (gok) v.meter = clamp(v.meter + 8, 0, 100); // een grote winst maakt het juist gevaarlijk
  } else { v.netto -= inzet; mod('moraal', -3); t = gok ? `Je zet ${geldTxt(inzet)} op één nummer. Het balletje valt ernaast. Weg is je geld.` : `Je zet ${geldTxt(inzet)} op ${kleur}. Het wordt ${anders}. Verloren.`; }
  w.tekst.push(t);
  ergernis(inzet >= 10000 ? 8 : 4);
  if (won && gok && inzet >= 1000) uitgaanKrant('casinoWinst', true); else uitgaanKrant('casino', inzet >= 10000);
}
export function feesten(){
  const sp = S.sp, w = S.week, v = verleiding(); if (sp.leeftijd < 18 || w.feest || v.hulp > 0 || sp.geld < 100) return;
  w.feest = true; v.feesten++; sp.geld -= Math.min(sp.geld, isProf() ? 500 : 100); v.meter = clamp(v.meter + 6, 0, 100);
  mod('moraal', 8); mod('fit', -10); mod('focus', -8);
  if (rnd() < .15){ const boete = Math.max(50, Math.round(sp.salaris * .02 / 50) * 50); sp.geld = Math.max(0, sp.geld - boete); mod('vert', -6); statusPunten(-2);
    w.tekst.push(`Je gaat los tot 5 uur 's nachts en verslaapt je voor de training. De club geeft je een boete van ${geldTxt(boete)}. De trainer is woedend.`);
    ergernis(10); uitgaanKrant('boete', true);
  } else { w.tekst.push(pick([`Je gaat met vrienden de stad in en danst tot de zon opkomt. Geweldige avond, maar je benen voelen als lood.`, `Een VIP-tafel, harde muziek en veel te weinig slaap. Je moraal is top, je fitheid niet.`, `Een huisfeest bij een teamgenoot loopt uit tot diep in de nacht. Volgende keer toch wat eerder naar huis?`]));
    uitgaanKrant('feest'); }
  ergernis(8);
  if (rnd() < kroegKans()){ S.ev = kroegEvent(); S.fase = 'event'; }
}
export function hulpZoeken(){
  const sp = S.sp, w = S.week, v = verleiding(), prijs = HULP_PRIJS(); if (v.meter < 30 || v.hulp > 0 || sp.geld < prijs) return;
  sp.geld -= prijs; v.hulp = 6; v.meter = clamp(v.meter - 30, 0, 100); focusBoost(5); mod('moraal', 3);
  w.tekst.push(`Je zoekt hulp bij een verslavingscoach. Het eerste gesprek is moeilijk, maar het lucht op. De komende 6 weken ga je niet naar het casino en niet stappen.`);
  if (isProf()){ mod('rep', 2); krantMelding(`${sp.naam} zoekt hulp: "Ik schaam me er niet voor"`, 'De speler laat weten dat hij hulp krijgt. Veel fans steunen hem op social media.'); }
}
// Elke week: de meter zakt langzaam, en als hij hoog staat gebeurt er wat
export function verlWeek(){
  const sp = S.sp, w = S.week, v = sp.verl; if (!v) return;
  if (v.hulp > 0){ v.hulp--; v.meter = clamp(v.meter - 3, 0, 100); if (!v.hulp) w.tekst.push('Je laatste gesprek met de verslavingscoach. Je voelt je sterker dan een paar weken geleden.'); return; }
  v.meter = clamp(v.meter - 2, 0, 100);
  if (v.meter >= 70){
    if (sp.relatie) sp.relatie.band = clamp(sp.relatie.band - 3, 0, 100);
    if (isProf() && rnd() < .2) roddel(`Zorgen om ${sp.naam}`, pick(['Vrienden maken zich zorgen over zijn gedrag buiten het veld.', 'Hij zou grote schulden hebben gemaakt in het casino.', 'Hij wordt steeds vaker laat in de nacht gezien.']));
    if ((S.weekNr || 0) - v.boeteWeek >= 8 && rnd() < .3){ v.boeteWeek = S.weekNr || 0; const boete = Math.max(100, Math.round(sp.salaris * .05 / 100) * 100); sp.geld = Math.max(0, sp.geld - boete); mod('vert', -8); statusPunten(-3);
      w.tekst.push(`De club roept je op het matje. "Het gaat zo niet langer." Je krijgt een boete van ${geldTxt(boete)} en de trainer vertrouwt je minder.`); }
  }
  if (v.meter >= 50 && rnd() < .25 && !S.wachtEv) S.wachtEv = drangEvent();
}
export function drangEvent(){
  const sp = S.sp, v = verleiding(), steun = sp.relatie ? sp.relatie.naam : 'je moeder', verlies = Math.max(200, Math.round(sp.geld * (.03 + rnd() * .04) / 50) * 50);
  return {soort:'prive', tekst:pick([`Het is laat. Je ligt in bed, maar je denkt aan het casino. "Eén keer nog, wat kan het kwaad?"`, `Je vrienden appen: "Vanavond los?" Morgen is er training, maar het kriebelt.`, `Je telefoon licht op met een reclame voor online gokken. Je duim zweeft boven de knop.`]), opts:[
    {l:'Toegeven', f(){ ergernis(5); sp.geld = Math.max(0, sp.geld - verlies); v.netto -= verlies; v.meter = clamp(v.meter + 5, 0, 100); mod('focus', -6); mod('fit', -4); return `Je geeft toe. De volgende ochtend ben je ${geldTxt(verlies)} kwijt en voel je je ellendig.`; }},
    {l:'Weerstaan', f(){ v.meter = clamp(v.meter - 4, 0, 100); mod('focus', -2); mod('moraal', -1); return 'Je legt je telefoon weg en gaat slapen. Het is moeilijk, maar het lukt.'; }},
    {l:`${sp.relatie ? sp.relatie.naam : 'Je moeder'} bellen`, f(){ v.meter = clamp(v.meter - 7, 0, 100); mod('moraal', 2); if (sp.relatie) sp.relatie.band = clamp(sp.relatie.band + 3, 0, 100); else if (sp.ouders) sp.ouders.band = clamp((sp.ouders.band ?? 70) + 3, 0, 100);
      return `Je belt ${steun} en vertelt eerlijk hoe het gaat. ${steun.charAt(0).toUpperCase() + steun.slice(1)} luistert en helpt je erdoorheen.`; }}]};
}
export function vUitgaan(){
  const sp = S.sp, w = S.week, v = verleiding();
  if (sp.leeftijd < 18) return `<p class="muted">Het casino en de nachtclub zijn pas vanaf je 18e.</p>`;
  const [staat, cls] = verlStaat(v.meter), hulp = HULP_PRIJS();
  if (v.hulp > 0) return `<p><span class="risico r-veilig">In behandeling</span> Je krijgt hulp van een verslavingscoach. Nog ${v.hulp} ${v.hulp === 1 ? 'week' : 'weken'} geen casino en niet stappen.</p>`;
  const inzetten = CASINO_INZET.filter(x => x <= Math.max(100, sp.geld)), inzet = inzetten.includes(tmp.inzet) ? tmp.inzet : inzetten[0];
  // Grote inzet (een kwart van je geld of meer): eerst bevestigen
  const groot = inzet >= 1000 && inzet >= sp.geld * .25 ? ` data-bevestig="Je zet ${geldTxt(inzet)} in. Dat is ${Math.round(inzet / sp.geld * 100)}% van je geld." data-ja="Ja, inzetten"` : '';
  return `<p class="muted klein-tekst">Leuk voor je moraal, maar pas op: hoe vaker je gaat, hoe moeilijker het wordt om te stoppen. En de roddelbladen kijken mee.</p>
    <p>Hoe gaat het? <span class="risico ${cls}">${staat}</span></p>
    <p>De trainer: <span class="risico ${tucht().fase === 2 ? 'r-riskant' : tucht().fase === 1 || tucht().p >= 25 ? 'r-gem' : 'r-veilig'}">${tucht().fase === 0 && tucht().p >= 25 ? 'Hij hoort verhalen over je' : TUCHT_LABEL[tucht().fase]}</span>${sp.imago > 0 ? ' <span class="risico r-riskant">Slechte naam bij clubs</span>' : ''}</p>
    ${v.keer ? `<p class="muted klein-tekst">In het casino ${v.keer} keer geweest · ${v.netto >= 0 ? 'in totaal ' + geldTxt(v.netto) + ' gewonnen' : 'in totaal ' + geldTxt(-v.netto) + ' verloren'}.</p>` : ''}
    <span class="label winkelkop">Casino · 1 keer per week${w.casino ? ' (al geweest)' : ''}</span>
    <div class="rij" style="gap:6px;flex-wrap:wrap;align-items:center"><span class="muted klein-tekst">Inzet:</span>${inzetten.map(x => knop(geldTxt(x), () => { tmp.inzet = x; }, x === inzet ? 'klein aan' : 'klein', 'data-blijf')).join('')}</div>
    <div class="keuzes">${keuzeKnop(`Op rood of zwart · ${geldTxt(inzet)}`, 'bijna 50% kans · je geld verdubbelt', () => casino(inzet, false), `data-blijf ${w.casino || sp.geld < inzet ? 'disabled' : ''}${groot}`)}${keuzeKnop(`Op één nummer · ${geldTxt(inzet)}`, '3% kans · 36 keer je inzet', () => casino(inzet, true), `data-blijf ${w.casino || sp.geld < inzet ? 'disabled' : ''}${groot}`)}</div>
    <span class="label winkelkop">Stappen</span>
    <div class="keuzes">${keuzeKnop('Feesten tot de zon opkomt', `moraal +8 · fitheid −10 · focus −8 · ${isProf() ? '€500' : '€100'}`, feesten, `data-blijf ${w.feest || sp.geld < 100 ? 'disabled' : ''}`)}</div>
    ${v.meter >= 30 ? `<span class="label winkelkop">Hulp</span><div class="keuzes">${keuzeKnop(`Hulp zoeken bij een verslavingscoach · ${geldTxt(hulp)}`, '6 weken begeleiding · de drang wordt veel minder', hulpZoeken, `data-blijf ${sp.geld < hulp ? 'disabled' : ''}`)}</div>` : ''}`;
}
