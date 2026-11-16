import { S, mod } from '../../core/state.js';
import { keuzeKnop } from '../../core/ui.js';
import { clamp, esc, geldTxt, pick, rnd } from '../../core/utils.js';
import { roddel } from '../media/roddel.js';
import { ouders } from './familie.js';
import { social, volgersTxt } from './social.js';

/* ===================== Tattoos ===================== */
// Vanaf je 18e, één per week in de tattooshop (Privé › Kapper en schoenen). Ze staan op S.sp.tattoos = [{soort, arm, tekst?, jaar}]
// (soort: 'klein', 'tekst' (een naam), 'mouw' (een full sleeve) of 'rug' (de leeuw uit belevenissen.js, die zie je niet);
// arm: 'r' = je voorste arm, 'l' = de andere). De pixelspeler tekent ze op de huid van je armen (render/pixel/tattoo.js):
// in een voetbalshirt zie je je onderarmen, onder een pak of een jas niet.
// Een week later reageren je ouders, je partner of een sponsor (S.wachtEv), en soms schrijft een roddelblad erover.
export const TATTOO = {
  klein:{n:'Een kleine tattoo', d:'een klein voetballetje op je onderarm', prijs:250},
  tekst:{n:'Een naam op je onderarm', d:'in sierlijke letters', prijs:600},
  mouw:{n:'Een full sleeve', d:'je hele arm vol, van schouder tot pols', prijs:3500},
};
export const tattoos = () => S.sp.tattoos || (S.sp.tattoos = []);
const op = (arm, soort) => tattoos().some(t => t.arm === arm && t.soort === soort);
// Op welke arm komt hij? (een sleeve gaat over wat er al zat; een naam liefst op je linkerarm, klein liefst rechts)
function welkeArm(soort){
  if (soort === 'mouw') return ['r', 'l'].find(a => !op(a, 'mouw')) || null;
  if (soort === 'tekst') return ['l', 'r'].find(a => !op(a, 'mouw')) || null;
  if (soort === 'klein') return ['r', 'l'].find(a => !op(a, 'mouw') && !op(a, 'klein')) || null;
  return null;
}
// Een tattoo erbij, zonder te betalen (ook voor de belevenis in belevenissen.js)
export function voegTattooToe(soort, tekst){
  const t = {soort, arm:soort === 'rug' ? null : welkeArm(soort), jaar:S.jaar || 0, ...(tekst ? {tekst} : {})};
  tattoos().push(t); (S.sp.beleefd = S.sp.beleefd || []).includes('tattoo') || S.sp.beleefd.push('tattoo');
  return t;
}
// Welke namen kun je laten zetten
export function tattooNamen(){
  const sp = S.sp, l = [];
  if (sp.relatie) l.push(sp.relatie.naam);
  for (const k of sp.kinderen || []) if (k && k.naam) l.push(k.naam);
  l.push('Mam & Pap');
  return l.filter(n => !tattoos().some(t => t.soort === 'tekst' && t.tekst === n));
}
// '' = het mag, anders de reden
export function kanTattoo(soort){
  const sp = S.sp;
  if (sp.leeftijd < 18) return 'vanaf je 18e';
  if (S.week && S.week.tattoo) return 'deze week al geweest';
  if (sp.geld < TATTOO[soort].prijs) return 'te weinig geld';
  if (!welkeArm(soort)) return soort === 'mouw' ? 'je armen zijn al vol' : 'geen plek meer';
  if (soort === 'tekst' && !tattooNamen().length) return 'geen naam meer over';
  return '';
}
export function zetTattoo(soort, naam){
  const sp = S.sp; if (kanTattoo(soort) || !S.week) return;
  if (soort === 'tekst' && !tattooNamen().includes(naam)) return;
  const prijs = TATTOO[soort].prijs; sp.geld -= prijs; S.week.tattoo = true;
  const t = voegTattooToe(soort, soort === 'tekst' ? naam : null), arm = t.arm === 'r' ? 'rechterarm' : 'linkerarm';
  mod('moraal', soort === 'mouw' ? 5 : 3);
  S.week.tekst.push(soort === 'mouw' ? `Zes sessies, veel pijn: je ${arm} staat nu helemaal vol. (${geldTxt(prijs)})`
    : soort === 'tekst' ? `"${naam}" staat nu in sierlijke letters op je onderarm. (${geldTxt(prijs)})`
    : `Een klein voetballetje op je onderarm. Het deed minder pijn dan je dacht. (${geldTxt(prijs)})`);
  if (rnd() < .4){ const n = Math.round(20 + social().volgers * .01); social().volgers += n; S.week.tekst.push(`Je foto uit de tattooshop gaat rond: +${volgersTxt(n)} volgers.`); }
  // roddel (alleen als je bekend bent)
  if (sp.rep >= 15 && soort === 'mouw') roddel(`${sp.naam} laat full sleeve tattoo zetten`, 'De hele arm vol inkt. Fans zijn verdeeld: stoer of zonde?');
  if (sp.rep >= 15 && soort === 'tekst' && sp.relatie && naam === sp.relatie.naam) roddel(`${sp.naam} laat naam van ${naam} tattooëren`, 'Liefde voor altijd? Op de onderarm staat nu in sierlijke letters de naam van de geliefde.');
  if (soort === 'klein'){ const o = ouders(); o.band = clamp(o.band - 1, 0, 100); S.week.tekst.push('Je moeder ziet het en zucht. "Nou ja, hij is tenminste klein."'); return; }
  if (!S.wachtEv) S.wachtEv = reactie(soort, naam);
}

// ---------- De reactie, een week later ----------
function reactie(soort, naam){
  const sp = S.sp, o = ouders(), r = sp.relatie, band = d => { o.band = clamp(o.band + d, 0, 100); };
  if (soort === 'tekst' && r && naam === r.naam){
    const rb = d => { r.band = clamp(r.band + d, 0, 100); };
    if (r.band >= 45) return {soort:'prive', tekst:`${r.naam} ziet de tattoo en wordt helemaal stil. Dan komen de tranen. "Mijn naam? Voor altijd?"`, opts:[
      {l:'Samen een foto posten', f(){ rb(10); mod('moraal', 5); const n = Math.round(40 + social().volgers * .02); social().volgers += n; return `De foto van jullie armen krijgt duizenden likes. +${volgersTxt(n)} volgers.`; }},
      {l:'Het iets van jullie twee houden', f(){ rb(12); mod('moraal', 4); return 'Jullie vieren het met een etentje, zonder telefoons. Een mooie avond.'; }}]};
    return {soort:'prive', tekst:`${r.naam} kijkt naar de tattoo en zegt niks. Dan: "Is dat niet een beetje snel?"`, opts:[
      {l:'Uitleggen dat je het meent', f(){ rb(4); return 'Na een lang gesprek moet er toch een glimlach af. "Gek ben je."'; }},
      {l:'Grapje maken: "Er kan altijd nog een hartje overheen"', f(){ rb(-8); mod('moraal', -3); return 'Dat valt verkeerd. De rest van de avond is het ijzig stil.'; }}]};
  }
  if (soort === 'tekst') return {soort:'prive', tekst:naam === 'Mam & Pap' ? 'Je ouders komen eten en zien de tattoo "Mam & Pap" op je onderarm. Je moeder pakt je arm vast en laat hem niet meer los.' : `Je ouders zien de naam "${naam}" op je onderarm. Je vader schraapt zijn keel. "Mooi. Echt mooi."`, opts:[
    {l:'Een knuffel geven', f(){ band(naam === 'Mam & Pap' ? 12 : 7); mod('moraal', 4); return 'Je moeder maakt meteen een foto voor de familie-app.'; }},
    {l:'"Het is maar een tattoo"', f(){ band(3); return 'Je doet stoer, maar je ziet hoe trots ze zijn.'; }}]};
  // een full sleeve: je ouders en (als je er een hebt) een sponsor
  const deal = (sp.sponsors || []).length ? pick(sp.sponsors) : null, bonus = deal ? Math.max(250, Math.round((deal.bedrag || 0) * .05 / 50) * 50) : 0;
  const sponsor = () => { if (!deal) return '';
    if (rnd() < .5){ sp.geld += bonus; mod('rep', 1); return ` ${deal.merk} vindt de sleeve juist stoer en zet je arm in een campagne: ${geldTxt(bonus)} extra.`; }
    sp.geld = Math.max(0, sp.geld - bonus); mod('rep', -1); return ` ${deal.merk} is minder blij: bij de fotoshoot moet de sleeve worden weggewerkt, en dat kost ${geldTxt(bonus)} van je vergoeding.`; };
  return {soort:'prive', tekst:'Je moeder ziet je arm vol inkt en slaat een hand voor haar mond. "Dat gaat er nooit meer af, hè?"', opts:[
    {l:'Rustig uitleggen wat alles betekent', f(){ band(-2); mod('moraal', 2); return 'Ze luistert. "De datum van je debuut, dat is wel mooi," geeft ze toe.' + sponsor(); }},
    {l:'"Het is mijn lijf"', f(){ band(-8); mod('moraal', 3); return 'Je vader zegt de rest van het eten niks meer.' + sponsor(); }}]};
}

// ---------- Het blok in Privé › Kapper en schoenen ----------
export function vTattoo(){
  const sp = S.sp, l = tattoos(), te = soort => kanTattoo(soort);
  const lijst = l.length ? l.map(t => t.soort === 'rug' ? 'een leeuw op je rug' : t.soort === 'mouw' ? `een full sleeve (${t.arm === 'r' ? 'rechterarm' : 'linkerarm'})` : t.soort === 'tekst' ? `"${esc(t.tekst || '')}"` : 'een klein voetballetje').join(', ') : '';
  if (sp.leeftijd < 18) return `<span class="label winkelkop">Tattooshop</span><p class="muted klein-tekst">Vanaf je 18e kun je een tattoo laten zetten.</p>`;
  const knopVoor = soort => keuzeKnop(TATTOO[soort].n, `${TATTOO[soort].d} · ${te(soort) || geldTxt(TATTOO[soort].prijs)}`, () => zetTattoo(soort), `data-blijf ${te(soort) ? 'disabled' : ''}`);
  const namen = tattooNamen(), tk = te('tekst');
  return `<span class="label winkelkop">Tattooshop · 1 per week${S.week && S.week.tattoo ? ' (al geweest)' : ''}</span>
    ${lijst ? `<p class="klein-tekst">Je tattoos: ${lijst}.</p>` : '<p class="muted klein-tekst">Nog geen tattoos. In een voetbalshirt zie je ze op je onderarmen, onder een pak niet.</p>'}
    <div class="keuzes">${knopVoor('klein')}${knopVoor('mouw')}</div>
    <span class="label" style="margin-top:6px">${TATTOO.tekst.n} · ${geldTxt(TATTOO.tekst.prijs)}${tk && tk !== 'geen naam meer over' ? ' · ' + tk : ''}</span>
    <div class="keuzes">${namen.map(n => keuzeKnop(`"${esc(n)}"`, '', () => zetTattoo('tekst', n), `data-blijf ${tk ? 'disabled' : ''}`)).join('') || '<p class="muted klein-tekst">Alle namen staan er al op.</p>'}</div>`;
}
