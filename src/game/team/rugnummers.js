import { S, club, mod, seizoenLabel, tmp } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { clamp, esc, pick, rnd } from '../../core/utils.js';
import { AANV, LEGENDE, STATUS } from '../../data/gegevens.js';
import { selectie } from '../competitie/spelers.js';
import { krantMelding } from '../media/roddel.js';
import { isProf } from '../prive/sponsors.js';
import { statusNaam, statusNiveau } from '../speler/status.js';
import { band, zetBand } from './kleedkamer.js';
import { ck } from '../transfers/buitenland.js';
import { kans } from '../wedstrijd/momenten.js';
import { ik, team } from '../../core/geslacht.js';

/* ===================== Rugnummers ===================== */
// Elke teamgenoot heeft een rugnummer en een status in de groep. Nummer 1 is altijd van de keeper
export const RUG_ROL = {K:[16, 23, 30, 13], A:[9, 11, 7, 17, 19, 18], M:[10, 8, 6, 14, 20, 21, 16, 23], V:[4, 3, 5, 2, 15, 22, 13, 12]};
export function rugTeam(id){
  const sel = selectie(id), bezet = new Set();
  sel.forEach(x => { if (x.nr) bezet.add(x.nr); });
  const k = sel.find(x => x.pos === 'K' && x.basis);
  if (k && !k.nr && !bezet.has(1)){ k.nr = 1; bezet.add(1); }
  bezet.add(1);
  // Basisspelers eerst, zodat zij de bekende nummers krijgen
  [...sel].sort((a, b) => b.basis - a.basis).forEach(x => {
    if (!x.nr){ const pool = RUG_ROL[x.pos].filter(n => !bezet.has(n)); x.nr = pool.length && rnd() < (x.basis ? .85 : .5) ? pick(pool) : vrijNummer(bezet, 12, 40); bezet.add(x.nr); }
  });
  if (sel.some(x => x.st === undefined)){
    // Status in de groep: één aanvoerder, soms een clublegende, de rest gemengd
    // Reserves zijn vaker jonkie of bankspeler, basisspelers vaker vaste waarde of fan-favoriet
    // Nieuwkomer ben je alleen als je net binnen bent (uit de jeugd of gekocht)
    sel.forEach(x => { if (x.st === undefined) x.st = net(x) ? 0 : pick(x.basis === false ? [1, 1, 1, 2] : [1, 2, 2, 2, 3, 3]); });
    const basis = sel.filter(x => x.basis !== false);
    if (!sel.some(x => x.st === AANV)) pick(basis).st = AANV;
    if (rnd() < .2 && !sel.some(x => x.st === LEGENDE)) pick(basis.filter(x => x.st !== AANV)).st = LEGENDE;
  }
  // Wie al een tijd bij de club is, is geen nieuwkomer meer (ook in oude opslag, waar dat willekeurig was)
  sel.forEach(x => { if (x.st === 0 && !net(x)) x.st = 1; });
  return sel;
}
export function vrijNummer(bezet, van, tot){ const l = []; for (let n = van; n <= tot; n++) if (!bezet.has(n)) l.push(n); return l.length ? pick(l) : tot + 1; }
export const teamNummers = id => new Set([1, ...rugTeam(id).map(x => x.nr)]);
// Jouw nummer bij je huidige club. Bij een nieuwe club krijg je een nummer dat vrij is: als jonkie een hoog nummer, als ster een laag
export function rugnummer(){
  const sp = S.sp;
  if (sp.rug && sp.rug.club === ck(sp.club)) return sp.rug.nr;
  const bezet = teamNummers(sp.club), niv = statusNiveau(), wens = sp.wensNr;
  let nr, tekst; const oud = (sp.rugHist || {})[ck(sp.club)];
  if (oud && !bezet.has(oud)){ nr = oud; tekst = `Terug bij ${club().n}: je speelt weer met nummer ${nr}.`; }
  else if (wens && !bezet.has(wens) && niv >= 3 && sp.rug){ nr = wens; tekst = `Je krijgt bij ${club().n} meteen je favoriete nummer: ${nr}!`; }
  else { nr = niv >= 2 ? vrijNummer(bezet, 2, 23) : vrijNummer(bezet, 24, 45); tekst = `Je krijgt bij ${club().n} rugnummer ${nr}.${niv < 2 ? ' Als nieuwkomer krijg je wat er over is.' : ''}`; }
  sp.rug = {club:ck(sp.club), nr}; (sp.rugHist = sp.rugHist || {})[ck(sp.club)] = nr;
  sp.rugMelding = tekst;
  return nr;
}
// Het nummer op je shirt (contractscène, krantfoto): bij het eerste elftal je rugnummer, bij de O23 een vast nummer
// van het beloftenteam (24-45, één keer gekozen en bewaard in sp.o23.nr)
export function shirtNummer(o23 = !!S.sp.o23){
  const sp = S.sp;
  if (!o23) return rugnummer();
  const o = sp.o23 && typeof sp.o23 === 'object' ? sp.o23 : null;
  if (o && o.nr) return o.nr;
  let h = 7; for (const ch of `${sp.naam}|${sp.club}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const nr = 24 + h % 22; if (o) o.nr = nr;
  return nr;
}
export function zetRug(nr){ const sp = S.sp; sp.rug = {club:ck(sp.club), nr}; (sp.rugHist = sp.rugHist || {})[ck(sp.club)] = nr; }
export const stNaam = st => STATUS[st].n;
// Net bij de selectie gekomen: de laatste 14 weken uit de jeugd doorgestroomd of gekocht
export const NET_WEKEN = 14;
export const netUitJeugd = x => !!x.jeugd && (S.weekNr || 0) - (x.sindsWeek || 0) < NET_WEKEN;
export const netGekocht = x => x.nieuwWeek !== undefined && (S.weekNr || 0) - x.nieuwWeek < NET_WEKEN;
export const net = x => netUitJeugd(x) || netGekocht(x);
// De trainer vragen om een ander nummer. Wat hij zegt hangt af van jouw status en die van de speler die het nummer heeft
export function rugVraag(nr){
  const sp = S.sp, w = S.week, mijn = rugnummer(); nr = +nr; if (!w || w.rug || !nr || nr === mijn) return;
  w.rug = true;
  const s = statusNiveau(), eig = rugTeam(sp.club).find(x => x.nr === nr);
  let ok = false, t;
  if (nr === 1){ t = '"Nummer 1? Dat is voor de keeper, ' + ik.jongen + '." De trainer moet erom lachen.'; }
  else if (!eig){
    ok = rnd() < [.3, .7, 1, 1, 1, 1][s];
    t = ok ? `De trainer knikt: "Nummer ${nr} is vrij. Hij is van jou."` : `"Eerst maar eens laten zien wat je kan," zegt de trainer. "Dan praten we verder over een ander nummer."`;
  } else if (s > eig.st){
    ok = rnd() < .9; const naam = eig.n;
    if (ok){ const d = band(naam) >= 70 ? -6 : -12; eig.nr = vrijNummer(teamNummers(sp.club), 12, 40); zetBand(naam, d); t = `De trainer kiest voor jou: jij krijgt nummer ${nr}. ${naam} (${stNaam(eig.st).toLowerCase()}) moet naar nummer ${eig.nr}. ${team.Hij} is er niet blij mee. Band met ${naam} −${-d}.`; }
    else t = `De trainer twijfelt: "Ik wil geen gedoe in de groep." Nummer ${nr} blijft van ${naam}.`;
  } else if (s === eig.st){
    ok = rnd() < .35; const naam = eig.n;
    if (ok){ eig.nr = vrijNummer(teamNummers(sp.club), 12, 40); zetBand(naam, -15); t = `Jij en ${naam} zijn allebei ${stNaam(s).toLowerCase()}. De trainer kiest toch voor jou: nummer ${nr} is van jou. ${naam} is woedend. Band met ${naam} −15.`; }
    else { zetBand(naam, -4); mod('vert', -2); t = `"${naam} is net zo belangrijk als jij, en ${team.hij} had het nummer eerst," zegt de trainer. Nee dus. ${naam} hoort ervan (band −4).`; }
  } else {
    const naam = eig.n; zetBand(naam, -5); mod('vert', -3);
    t = `De trainer schudt zijn hoofd: "Nummer ${nr} is van ${naam}, onze ${stNaam(eig.st).toLowerCase()}. Daar begin ik niet aan." ${naam} hoort het (band −5).`;
  }
  w.rugTekst = t;
  if (ok){ zetRug(nr); mod('moraal', 5); S.car.hist.push(`${seizoenLabel()}: rugnummer ${nr} bij ${club().n}`); if (isProf()) krantMelding(`${sp.naam} krijgt rugnummer ${nr}`, `Bij ${club().n} speelt ${sp.naam} voortaan met nummer ${nr}${nr === sp.wensNr ? ', ' + ik.zijn + ' favoriete nummer' : ''}. Het nieuwe shirt is meteen uitverkocht in de fanshop.`); }
  w.tekst.push(t);
}
// Zelf aan een teamgenoot vragen of hij wil ruilen: hangt af van jullie band
export function rugRuil(naam){
  const sp = S.sp, w = S.week, eig = rugTeam(sp.club).find(x => x.n === naam); if (!w || w.rug || !eig) return;
  w.rug = true; const mijn = rugnummer(), b = band(naam), s = statusNiveau();
  const kans = clamp((b - 30) / 60, 0, .95) * (s >= eig.st ? 1 : .6);
  if (rnd() < kans){ const zijn = eig.nr; eig.nr = mijn; zetRug(zijn); zetBand(naam, 2); mod('moraal', 5); S.car.hist.push(`${seizoenLabel()}: rugnummer ${zijn} bij ${club().n}`);
    w.tekst.push(w.rugTekst = `Je vraagt ${naam} of ${team.hij} wil ruilen. "Voor jou? Prima, maatje." Jij krijgt nummer ${zijn}, ${team.hij} neemt jouw ${mijn}.`); }
  else { zetBand(naam, -4); w.tekst.push(w.rugTekst = b < 40 ? `${naam} kijkt je aan alsof je gek bent: "Mijn nummer? Echt niet." Band −4.` : `${naam} twijfelt, maar zegt toch nee: "Ik speel al jaren met dit nummer." Band −4.`); }
}
export function vRugnummer(){
  const sp = S.sp, w = S.week || {}, mijn = rugnummer(), wens = +(tmp.wensNr || sp.wensNr || 0), eig = wens ? rugTeam(sp.club).find(x => x.nr === wens) : null;
  const opties = Array.from({length:99}, (_, i) => i + 1).map(n => `<option value="${n}" ${n === wens ? 'selected' : ''}>${n}</option>`).join('');
  let advies = '';
  if (wens && wens !== mijn){
    const s = statusNiveau();
    advies = wens === 1 ? 'Nummer 1 is voor de keeper.' : !eig ? `Nummer ${wens} is vrij.${s === 0 ? ' Als jonkie is het wel de vraag of de trainer het je geeft.' : ''}`
      : `Nummer ${wens} is van ${esc(eig.n)} (${esc(stNaam(eig.st).toLowerCase())}). Jij bent ${esc(statusNaam(s).toLowerCase())}: ${s > eig.st ? 'de trainer kiest waarschijnlijk voor jou' : s === eig.st ? 'dat wordt lastig, jullie zijn even belangrijk' : 'de trainer zal nee zeggen'}.`;
  }
  return `<div class="paneel" style="gap:6px"><span class="label">Rugnummer · jij speelt met <b style="color:var(--lamp)">${mijn}</b></span>
    <div class="rij" style="gap:8px;align-items:center;flex-wrap:wrap"><label for="wensNr" class="muted klein-tekst">Je favoriete nummer:</label><select id="wensNr"><option value="">kies</option>${opties}</select></div>
    ${advies ? `<p class="muted klein-tekst">${advies}</p>` : ''}
    ${wens && wens !== mijn ? `<div class="rij" style="gap:6px;flex-wrap:wrap">${knop(`Vraag de trainer om nummer ${wens}`, () => { sp.wensNr = wens; rugVraag(wens); }, 'klein', `data-blijf ${w.rug ? 'disabled' : ''}`)}${eig ? knop(`Vraag ${esc(eig.n)} zelf om te ruilen`, () => { sp.wensNr = wens; rugRuil(eig.n); }, 'klein', `data-blijf ${w.rug ? 'disabled' : ''}`) : ''}</div>${w.rug ? '<p class="muted klein-tekst">Deze week heb je al om een ander nummer gevraagd.</p>' : ''}` : wens && wens === mijn ? '<p class="goedtxt klein-tekst">Je speelt met je favoriete nummer!</p>' : ''}${w.rugTekst ? `<p class="melding">${esc(w.rugTekst)}</p>` : ''}</div>`;
}
