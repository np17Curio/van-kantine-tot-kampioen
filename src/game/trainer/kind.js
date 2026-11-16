import { S, mod } from '../../core/state.js';
import { clamp, pick, randInt } from '../../core/utils.js';
import { CLUBS } from '../../data/gegevens.js';
import { kinderen, kindLeeftijd } from '../prive/gezin.js';
import { krantMelding } from '../media/roddel.js';
import { KRANTEN } from '../media/nieuws.js';
import { team } from '../../core/geslacht.js';
import { mijnSel } from './ploeg.js';

/* ===================== Trainer: je eigen kind in je selectie ===================== */
// Ben je trainer en is je kind oud genoeg (16 bij de O23, 17 bij een eerste elftal), dan vraagt het of het bij jou mag spelen.
// Alleen in de wereld van jouw club: een zoon in het mannenvoetbal, een dochter in het vrouwenvoetbal.
// Zeg je ja, dan komt je kind in je selectie (x.kind): met jouw achternaam, een eigen positie en wat van jouw talent.
// Zeg je "nog niet", dan vraagt het het volgend seizoen opnieuw; "eigen weg" is voor altijd.
const LINIES = ['K', 'V', 'V', 'M', 'M', 'M', 'A', 'A'];
const minLeeftijd = () => S.trainer && S.trainer.o23 ? 16 : 17;
const achternaam = () => { const d = String(S.sp.naam || '').trim().split(/\s+/); return d.length > 1 ? d.slice(1).join(' ') : d[0] || 'Junior'; };
const inSelectie = k => mijnSel().find(x => x.kind && x.kindNaam === k.naam);

// Elke week (trainer/prive.js): je kinderen in je selectie groeien elk seizoen, en een kind dat oud genoeg is, vraagt of het mag komen
export function kindWeek(){
  const T0 = S.trainer; if (!T0 || T0.gestopt || !(S.sp.kinderen || []).length) return;
  for (const x of mijnSel()) if (x.kind && x.kindJaar !== S.jaar){ // (een nieuw seizoen: een jaar ouder en beter, tot een jaar of 27)
    x.kindJaar = S.jaar; x.lft = (x.lft || 17) + 1;
    if (x.lft <= 27) x.k = clamp(x.k + randInt(x.lft <= 21 ? 2 : 0, x.lft <= 21 ? 6 : 3), 30, x.plafond || 85);
  }
  if (S.wachtEv || S.ev) return;
  const vrouwen = S.wereld === 'v';
  const k = kinderen().find(k => !k.eigenWeg && k.jongen === !vrouwen && k.teamVraag !== S.jaar && kindLeeftijd(k) >= minLeeftijd() && kindLeeftijd(k) <= 30 && !inSelectie(k));
  if (k){ k.teamVraag = S.jaar; S.wachtEv = vraagEvent(k); }
}
function vraagEvent(k){
  const T0 = S.trainer, c = CLUBS[T0.club], lft = kindLeeftijd(k), zij = team.hij, Zij = team.Hij, zoon = team.zoon;
  return {soort:'prive', tekst:`${k.naam} (${lft}) staat in de deuropening van je kantoor, met ${team.zijn} voetbalschoenen in de hand. "${S.sp.vrouw ? 'Mam' : 'Pap'}... ik wil bij jouw ${T0.o23 ? 'O23' : 'selectie'} spelen. Geef me een kans. Ik laat zien dat ik het kan." Je ${zoon} speelt al jaren in de jeugd van ${c.n}.`, opts:[
    {l:`${k.naam} in je ${T0.o23 ? 'O23' : 'selectie'} opnemen`, toon:'bal', f(){ const x = neemOp(k); mod('moraal', 6); T0.moraal = clamp((T0.moraal ?? 60) - 2, 0, 100);
      krantMelding(`Trainer ${S.sp.naam} haalt eigen ${zoon} naar de selectie`, `${k.naam} ${achternaam()} (${lft}) maakt de overstap naar ${T0.o23 ? 'de O23' : 'het eerste elftal'} van ${c.n}. "Thuis is ${zij} mijn kind. Op het veld is ${zij} gewoon een speler."`, KRANTEN[c.t] || KRANTEN[1]);
      return `${k.naam} vliegt je om de nek. ${Zij} krijgt rugnummer ${x.nr} en speelt als ${({K:'keeper', V:'verdediger', M:'middenvelder', A:'aanvaller'})[x.pos]}. Een paar spelers kijken je even aan: krijgt de ${zoon} van de trainer een voorkeursbehandeling? Laat maar zien van niet.`; }},
    {l:'Nog niet: eerst een seizoen bij de jeugd', toon:'kalm', f(){ return `"Nog een jaartje rijpen," zeg je. ${k.naam} baalt, maar knikt. Volgend seizoen praten jullie verder.`; }},
    {l:`${Zij} moet ${team.zijn} eigen weg gaan`, toon:'fel', f(){ k.eigenWeg = true; mod('moraal', -3); return `"Ik wil niet dat iedereen zegt dat je er alleen door mij in staat." ${k.naam} loopt stil weg. Later begrijpt ${zij} het misschien.`; }}]};
}
// Je kind in je selectie: jouw achternaam, een vrij rugnummer en een klasse rond de onderkant van je selectie (met wat van jouw talent)
function neemOp(k){
  const T0 = S.trainer, sel = mijnSel(), c = CLUBS[T0.club], an = achternaam();
  const n = sel.some(x => x.n === an) ? `${an} jr.` : an, pos = pick(LINIES);
  const bezet = new Set(sel.map(x => x.nr)), vrij = Array.from({length:40}, (_, i) => i + 2).filter(nr => !bezet.has(nr));
  const talent = Math.round(((S.car && S.car.maxOvr) || 70) - 70) / 5;
  const x = {v:k.naam[0], n, pos, nr:vrij.length ? pick(vrij.slice(0, 15)) : 99, k:clamp(Math.round((c ? c.s : 60) - 13 + randInt(-3, 4) + talent), 35, 88), lft:kindLeeftijd(k), basis:false, jeugd:true,
    kind:true, kindNaam:k.naam, kindJaar:S.jaar, plafond:clamp(Math.round((c ? c.s : 60) + 6 + talent * 2), 60, 95), fit:100, bT:0};
  sel.push(x);
  return x;
}
