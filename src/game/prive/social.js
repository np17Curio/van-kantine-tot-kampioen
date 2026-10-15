import { S, club, mod, seizoenLabel } from '../../core/state.js';
import { geldTxt, rnd } from '../../core/utils.js';
import { KRANTEN } from '../media/nieuws.js';
import { RODDELBLADEN, krantMelding, roddel } from '../media/roddel.js';
import { isProf } from './sponsors.js';
import { statusPunten } from '../speler/status.js';
import { modFans } from '../wedstrijd/fans-pers.js';
import { pers } from '../speler/persoonlijkheid.js';

/* ===================== Social media ===================== */
export function volgersTxt(n){ n = Math.round(n); if (n < 1000) return String(n); if (n < 1e6) return (n / 1000).toFixed(n < 1e4 ? 1 : 0).replace('.', ',').replace(',0', '') + 'k'; return (n / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + ' mln'; }
export const social = () => S.sp.social || (S.sp.social = {volgers:Math.round(40 + S.sp.rep * 30), posts:0, mijl:0});
// Basisgroei per post: hoe bekender je bent (reputatie, niveau), hoe meer nieuwe volgers
export function postGroei(f){ const sp = S.sp, t = club().t; return Math.round((15 + sp.rep * 12) * (1 + (5 - Math.min(t, 5)) * .6) * f * (.6 + rnd() * .8)); }
export function volgerMijlpaal(){
  const so = social(), grenzen = [1000, 10000, 100000, 1000000];
  const nieuw = grenzen.filter(g => so.volgers >= g).length;
  if (nieuw > (so.mijl || 0)){ so.mijl = nieuw; const g = grenzen[nieuw - 1];
    const tekst = `Je hebt ${volgersTxt(g)} volgers! ${g >= 10000 ? 'Merken betalen je nu voor posts.' : 'Je account groeit hard.'}`;
    if (g >= 10000) krantMelding(`${S.sp.naam} heeft ${volgersTxt(g)} volgers`, g >= 1000000 ? 'Een van de populairste voetballers online.' : 'Zijn video\'s worden steeds vaker gedeeld.', g >= 100000 ? RODDELBLADEN : KRANTEN[club().t]);
    return tekst; }
  return null;
}
export const POSTS = [
  {id:'training', l:'Trainingsvideo posten', d:'Rustige groei', f(){ const n = postGroei(1); social().volgers += n; return `Je post een filmpje van je vrije trappen op de training. +${volgersTxt(n)} volgers.`; }},
  {id:'fans', l:'Foto met fans en teamgenoten', d:'Groei · vertrouwen +1', f(){ const n = postGroei(1.1); social().volgers += n; mod('vert', 1); return `Een selfie met de selectie en een paar jonge fans. Iedereen vindt het leuk. +${volgersTxt(n)} volgers.`; }},
  {id:'challenge', l:'Grappige challenge-video', d:'Kans om viraal te gaan', f(){
    if (rnd() < .3){ const n = postGroei(3.5); social().volgers += n; mod('rep', 2); mod('moraal', 4); return `Je video gaat VIRAAL! Iedereen doet je challenge na. +${volgersTxt(n)} volgers.`; }
    const n = postGroei(.4); social().volgers += n; return `Je video valt een beetje flauw. +${volgersTxt(n)} volgers.`; }},
  {id:'hater', l:'Reageren op een hater', d:'Riskant', f(){
    if (rnd() < .5){ const n = postGroei(1.5); social().volgers += n; mod('rep', 1); return `Je reageert met humor. Iedereen staat aan jouw kant. +${volgersTxt(n)} volgers.`; }
    mod('rep', -3); mod('focus', -4); social().volgers = Math.round(social().volgers * .98);
    roddel(`Ophef om bericht van ${S.sp.naam}`, 'Zijn felle reactie op een criticus zorgt voor veel boze reacties.'); return 'Je reactie valt verkeerd. Ophef! Je verliest volgers en je hoofd zit vol.'; }}
];
export function post(id){ const w = S.week, x = POSTS.find(p => p.id === id); if (!x || w.post) return; w.post = id; social().posts++; w.tekst.push(x.f()); const m = volgerMijlpaal(); if (m) w.tekst.push(m); }
// Na een wedstrijd: goed spelen en scoren levert volgers op
export function volgersNaWedstrijd(M){
  if (M.cijfer === null || M.cijfer === undefined) return;
  const so = social(), t = club().t, schaal = (1 + (5 - Math.min(t, 5)) * .8) * (1 + S.sp.rep / 20);
  const voor = so.volgers;
  const groei = ((M.cijfer - 6) * 6 + M.goals * 15 + M.assists * 6 + (M.kampioen ? 80 : 0)) * schaal;
  so.volgers = Math.max(0, Math.round(so.volgers + (groei > 0 ? groei * pers('volgers') : groei)));
  M.volgers = so.volgers - voor;
  M.volgerTekst = volgerMijlpaal();
}
// Betaalde posts vanaf 10.000 volgers (vanaf je 16e)
// Wat je met je volgers kunt doen (vanaf een bepaald aantal)
export const VOLG_ACTIES = [
  {id:'live',     min:1000,   l:'Livestream met fans (vragenuur)', d:'moraal +4 · fans gaan meer van je houden'},
  {id:'deal',     min:5000,   l:'Betaalde samenwerking met een merk', d:'eenmalig geld · kies zelf het merk'},
  {id:'inzamel',  min:25000,  l:'Inzamelen voor een goed doel', d:'je volgers doneren · reputatie omhoog · telt als goed doel'},
  {id:'kleding',  min:50000,  l:'Eigen kledinglijn lanceren', d:'€20k · daarna elke week inkomsten', eenmalig:true}
];
export const kledingPerWeek = () => S.sp.merk ? Math.round(social().volgers * .0015) : 0;
export function volgActie(id){
  const sp = S.sp, w = S.week, so = social(), x = VOLG_ACTIES.find(a => a.id === id); if (!x || w.volg || so.volgers < x.min) return;
  if (id === 'live'){ mod('moraal', 4); statusPunten(1); modFans(2); so.volgers += Math.round(so.volgers * .01); w.tekst.push(`Je doet een livestream. ${volgersTxt(Math.max(50, so.volgers * .03))} fans kijken mee en stellen vragen. "Wat is je lievelingseten?" "Wie is je beste vriend in het team?" Je fans gaan nog meer van je houden.`); }
  else if (id === 'deal'){
    const basis = Math.round(so.volgers * .04 / 10) * 10;
    S.ev = {soort:'sponsor', tekst:`Drie merken willen een betaalde post met jou (${volgersTxt(so.volgers)} volgers). Welke kies je?`, opts:[
      {l:`Sportdrank FitFuel · ${geldTxt(basis)}`, f(){ sp.geld += basis; return `Je post een foto met een fles FitFuel. ${geldTxt(basis)} verdiend.`; }},
      {l:`Gamingstoel Throne · ${geldTxt(Math.round(basis * 1.3))}`, f(){ sp.geld += Math.round(basis * 1.3); mod('moraal', 2); return `Je speelt een avond FIFA live op je nieuwe stoel. ${geldTxt(Math.round(basis * 1.3))} verdiend.`; }},
      {l:`Gokbedrijf BetKing · ${geldTxt(basis * 3)}`, f(){ sp.geld += basis * 3; mod('rep', -6); roddel(`Ophef: ${sp.naam} maakt reclame voor gokbedrijf`, 'Ouders van jonge fans zijn boos. "Hij is een voorbeeld voor kinderen."'); return `Veel geld (${geldTxt(basis * 3)}), maar veel fans zijn boos. Je reputatie daalt.`; }},
      {l:'Geen enkele, ik blijf echt', f(){ mod('rep', 1); return 'Je zegt alle drie nee. Je fans waarderen dat.'; }}]};
    S.fase = 'event'; }
  else if (id === 'inzamel'){ const b = Math.round(so.volgers * .02); mod('rep', 3); mod('moraal', 5); S.ss.goed = (S.ss.goed || 0) + 1; S.car.goed = (S.car.goed || 0) + 1;
    w.tekst.push(`Je vraagt je volgers om te doneren voor zieke kinderen. Samen halen jullie ${geldTxt(b)} op!`); krantMelding(`Volgers van ${sp.naam} zamelen ${geldTxt(b)} in`, 'De actie van de voetballer gaat als een lopend vuurtje over social media.', isProf() ? RODDELBLADEN : KRANTEN[club().t]); }
  else if (id === 'kleding'){ if (sp.merk || sp.geld < 20000) return; sp.geld -= 20000; sp.merk = {start:S.jaar, totaal:0}; S.car.hist.push(`${seizoenLabel()}: eigen kledinglijn gelanceerd`);
    w.tekst.push(`Je lanceert je eigen kledinglijn! De eerste hoodies zijn binnen een uur uitverkocht.`); krantMelding(`${sp.naam} lanceert eigen kledinglijn`, 'De hoodies met zijn rugnummer zijn binnen een uur uitverkocht.', RODDELBLADEN); }
  w.volg = id;
}
export const influencerPerWeek = () => S.sp.leeftijd >= 16 && social().volgers >= 10000 ? Math.round(social().volgers * .002) : 0;
