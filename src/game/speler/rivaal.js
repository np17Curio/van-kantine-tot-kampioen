import { S, club, ovr } from '../../core/state.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { CLUBS, JEUGD, divClubs } from '../../data/gegevens.js';
import { selectie } from '../competitie/spelers.js';
import { metVoorletter } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { PERS } from './persoonlijkheid.js';

/* ===================== Je vaste rivaal ===================== */
// Een speler van jouw leeftijd, op jouw positie en van ongeveer jouw niveau, bij een andere club.
// Hij staat echt in de selectie van die club (dus hij scoort ook in de andere wedstrijden), groeit mee en volgt je omhoog.
const POS_LINIE = {SPITS:'A', MID:'M', VERD:'V'};
const NAMEN = ['Van Rijswijk', 'Brandsma', 'De Haas', 'Kortenhoeven', 'Vermeulen', 'Okonkwo', 'Lindqvist', 'Van der Stroom', 'El Haddaoui', 'Moreau', 'Kuipers', 'Sanchez-Duin'];
const VOORL = ['J', 'M', 'R', 'T', 'L', 'S', 'D', 'K'];
const ACHTERGROND = [
  'Jullie speelden al tegen elkaar in de jeugd en zijn sindsdien elkaars grootste concurrent.',
  'Jullie werden in hetzelfde jaar ontdekt. Sindsdien worden jullie altijd met elkaar vergeleken.',
  'Hij nam jouw plek in bij een jeugdselectie. Dat ben je nooit vergeten.',
  'De media noemen jullie al jaren in één adem. Jullie kunnen elkaar niet uitstaan.',
];
export const rivaal = () => S.sp && S.sp.rivaal;
// Waar speelt hij nu? (een transfer van de computer kan hem verplaatsen: we zoeken op naam)
export function rivaalSpeler(){
  const R = rivaal(); if (!R || R.gestopt) return null;
  const bij = id => { const x = selectie(id).find(y => y.n === R.n && y.v === R.v); return x ? {id, x} : null; };
  const nu = CLUBS[R.club] ? bij(R.club) : null; if (nu) return nu;
  for (let id = 0; id < CLUBS.length; id++){ const r = bij(id); if (r){ R.club = id; return r; } }
  return null;
}
// Hem bij een club in de selectie zetten (als basisspeler op zijn linie)
function plaats(id){
  const R = rivaal(), sel = selectie(id), linie = POS_LINIE[S.sp.pos];
  const oud = rivaalSpeler(); if (oud && oud.id !== id){ const s2 = selectie(oud.id); s2.splice(s2.indexOf(oud.x), 1); selectie(oud.id); }
  if (sel.some(y => y.n === R.n && y.v === R.v)) return;
  // de zwakste bankspeler op zijn linie maakt plaats
  const bank = sel.filter(y => y.pos === linie && !y.basis).sort((a, b) => a.k - b.k)[0]; if (bank) sel.splice(sel.indexOf(bank), 1);
  sel.push({v:R.v, n:R.n, pos:linie, basis:true, g:linie === 'A' ? 4.5 : linie === 'M' ? 2.4 : 1, a:linie === 'M' ? 2.8 : 1.6, k:R.k, lft:R.lft, rivaal:true});
  R.club = id;
}
// Een club voor hem: niet de jouwe, op jouw niveau (of eentje hoger/lager)
function kiesClub(t){
  // (in de jeugd: een ander jeugdteam)
  const mijn = S.sp.club, niv = t === JEUGD ? [JEUGD] : [t, t - 1, t + 1].filter(x => x >= 0 && x < JEUGD);
  for (const n of niv){ const l = divClubs(n).filter(i => i !== mijn); if (l.length) return pick(l); }
  return null;
}
export function maakRivaal(){
  const sp = S.sp; if (sp.rivaal) return sp.rivaal;
  const t = club().t, id = kiesClub(t); if (id == null) return null;
  const persIds = Object.keys(PERS);
  sp.rivaal = {v:pick(VOORL), n:pick(NAMEN), lft:sp.leeftijd + randInt(-1, 1), k:clamp(ovr(sp) + randInt(-3, 3), 30, 95), club:id,
    achtergrond:pick(ACHTERGROND), karakter:pick(persIds), onderling:{w:0, g:0, v:0}, hist:[], seizoen:null};
  plaats(id);
  return sp.rivaal;
}
// Zijn doelpunten en assists dit seizoen (over alle clubs waar hij speelde)
export function rivaalStats(){
  const R = rivaal(); let g = 0, a = 0; if (!R) return {g, a};
  for (const x of Object.values((S.ss && S.ss.st) || {})) if (!x.jij && x.n === R.n && x.v === R.v){ g += x.g || 0; a += x.a || 0; }
  return {g, a};
}
export const rivaalNaam = () => { const R = rivaal(); return R ? metVoorletter(R) : ''; };
export const speeltTegenRivaal = opp => { const r = rivaalSpeler(); return !!(r && r.id === opp && r.id !== S.sp.club); };
// Na een wedstrijd tegen zijn club: onderling resultaat, en de krant als een van jullie scoorde
export function naRivaalDuel(M){
  const R = rivaal(); if (!R || !M.rivaal) return null;
  const won = M.us > M.them, gel = M.us === M.them; R.onderling[won ? 'w' : gel ? 'g' : 'v']++;
  const hijG = (M.doelen || []).filter(d => d.club === M.opp && d.s && d.s.n === R.n).length, naam = rivaalNaam();
  if (M.goals || hijG) krantMelding(M.goals > hijG ? `${S.sp.naam} wint het duel met rivaal ${naam}` : hijG > M.goals ? `Rivaal ${naam} steelt de show tegen ${S.sp.naam}` : `${S.sp.naam} en ${naam} houden elkaar in evenwicht`,
    `${M.goals ? `${S.sp.naam} scoorde ${M.goals}x` : `${S.sp.naam} scoorde niet`}, ${hijG ? `${naam} ${hijG}x` : `${naam} niet`}. Onderling: ${R.onderling.w} zeges, ${R.onderling.g} gelijk, ${R.onderling.v} nederlagen.`);
  return `Het duel met je rivaal ${naam}: ${won ? 'jij wint deze keer!' : gel ? 'gelijk, niemand wint.' : 'hij heeft deze keer gewonnen.'} Onderling: ${R.onderling.w}-${R.onderling.g}-${R.onderling.v}.`;
}
// Einde seizoen: de race, en daarna wordt hij een jaar ouder en beter of slechter, net als jij
export function rivaalSeizoen(){
  const R = rivaal(); if (!R || R.gestopt) return null;
  const st = rivaalStats(), sp = S.sp, jij = {g:S.ss.g || 0, a:S.ss.a || 0}, naam = rivaalNaam();
  const doel = sp.pos === 'SPITS' ? 'g' : 'a', woord = doel === 'g' ? 'goals' : 'assists';
  const winst = jij[doel] > st[doel] ? 'jij' : jij[doel] < st[doel] ? 'hij' : 'gelijk';
  const tekst = `De race met je rivaal ${naam}: jij ${jij[doel]} ${woord}, hij ${st[doel]}. ${winst === 'jij' ? 'Dit seizoen ben jij de beste.' : winst === 'hij' ? 'Dit seizoen was hij beter. Volgend jaar pak je hem.' : 'Precies gelijk!'}`;
  R.hist.push(`${S.jaar}: jij ${jij[doel]}, hij ${st[doel]} ${woord}`); if (R.hist.length > 12) R.hist.shift();
  R.seizoen = {jij:jij[doel], hij:st[doel], woord, winst};
  return {tekst, kop: winst === 'hij' ? `${naam} wint de race van ${sp.naam}` : winst === 'jij' ? `${sp.naam} wint de race van rivaal ${naam}` : `${sp.naam} en ${naam}: geen winnaar`};
}
export function rivaalOuder(groeiJij){
  const R = rivaal(), r = rivaalSpeler(); if (!R) return;
  R.lft++; R.k = clamp(R.k + groeiJij + randInt(-1, 1), 30, 95);
  if (r){ r.x.k = R.k; r.x.lft = R.lft; }
  // op zijn 37e stopt hij
  if (R.lft >= 37 && !R.gestopt){ R.gestopt = true; if (r){ const sel = selectie(r.id); sel.splice(sel.indexOf(r.x), 1); selectie(r.id); }
    krantMelding(`Rivaal ${rivaalNaam()} stopt met voetballen`, `Na jaren strijd met ${S.sp.naam} hangt hij zijn schoenen aan de wilgen. "Hij maakte mij beter," zegt ${S.sp.naam}.`); }
}
// In een transfervenster: volgt hij je omhoog, of wordt hij zelfs je teamgenoot?
export function rivaalVenster(soort){
  const R = rivaal(); if (!R || R.gestopt) return null; let r = rivaalSpeler();
  if (!r){ const id = kiesClub(club().t); if (id != null) plaats(id); return null; }
  const t = club().t, hijT = CLUBS[r.id].t, naam = rivaalNaam();
  if (t !== JEUGD && (hijT > t || hijT === JEUGD) && rnd() < .6){ const id = kiesClub(t); if (id != null && CLUBS[id].t === t){ plaats(id); krantMelding(`Rivaal ${naam} volgt ${S.sp.naam} naar de top`, `${naam} tekent bij ${CLUBS[id].n}. "Ik wil laten zien dat ik net zo goed ben."`); return `Je rivaal ${naam} maakt ook de stap omhoog: hij tekent bij ${CLUBS[id].n}.`; } }
  if (t !== JEUGD && r.id !== S.sp.club && rnd() < .05){ plaats(S.sp.club); krantMelding(`Opvallend: rivaal ${naam} tekent bij de club van ${S.sp.naam}`, `De twee rivalen zijn nu teamgenoten. "We hoeven geen vrienden te worden," zegt ${naam}.`); return `Wat?! Je rivaal ${naam} tekent bij jouw club. Jullie strijden nu om dezelfde plek.`; }
  return null;
}
