import { S, bewaar, tmp } from './state.js';
import { muziekNaRender } from './muziek.js';
import { taal, vertaal } from './taal.js';
import { vToernooi, vToernooiEinde } from '../game/interlands/toernooi.js';
import { instel, openAnims, pitchNaRender, vPitch } from '../render/pitch.js';
import { fotoNaRender, krantNaRender } from '../render/krantfoto.js';
import { voorbeeldNaRender } from '../render/pixel/voorbeeld.js';
import { vHud } from '../render/views/hud.js';
import { vOproep } from '../render/views/interland.js';
import { vMatch, vMatchEnd } from '../render/views/match.js';
import { vEinde, vOntwikkeling, vSeizoenEinde } from '../render/views/seizoen.js';
import { vStart, vZijStart } from '../render/views/start.js';
import { vStats } from '../render/views/stats.js';
import { bewegingNaRender, vBeweging } from '../render/views/beweging.js';
import { vVrijTrainen, vrijNaRender } from '../render/views/vrijtrainen.js';
import { vTrainerLive } from '../render/views/trainer-extra.js';
import { vTrainer, vTrainerAanbod, vTrainerCursus, vTrainerSeizoen, vTrainerUitslag, vZijTrainer } from '../render/views/trainer.js';
import { vVenster } from '../render/views/venster.js';
import { vEvent, vWeek } from '../render/views/week.js';
import { vZij } from '../render/views/zijbalk.js';
import { vAnalist, vAnalistSeizoen, vAnalistUitslag, vEigenaar, vEigenaarAanbod, vEigenaarSeizoen, vZijNa } from '../render/views/nacarriere.js';
import { vClubloos } from '../render/views/clubloos.js';
import { vSelectie, vSelectieKeuze } from '../render/views/selectiedagen.js';
import { proefNaRender, vProef } from '../render/views/proef.js';
import { vAfscheid } from '../render/views/afscheid.js';

/* ===================== Weergave ===================== */
// Elke knop krijgt een index in ACTS; de klik-handler in main.js voert die functie uit en tekent opnieuw.
export let ACTS = [];
export const act = fn => ACTS.push(fn) - 1;
export function knop(label, fn, cls = 'hoofd', extra = ''){ return `<button class="${cls}" data-i="${act(fn)}" ${extra}>${label}</button>`; }
export function resetActs(){ ACTS = []; }

// Kleurt effecten als "+8" (groen) en "−12" (rood) in de ondertitel van een keuze
// (eerst vertalen: daarna staan de getallen in een eigen <span> en is de zin in stukjes geknipt)
const ontsnap = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// (een tekst zonder html, maar met &quot; erin: eerst terug naar gewone tekst, anders herkent het woordenboek hem niet)
const vertaalHtml = t => taal() !== 'en' ? t : /</.test(t) || !/&(quot|#39|amp|lt|gt);/.test(t) ? vertaal(t) : ontsnap(vertaal(t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')));
export const effecten = s => vertaalHtml(String(s)).replace(/(^|[\s(·])([+−]\d+(?:[.,]\d+)?%?)/g, (_, voor, n) => `${voor}<span class="eff ${n[0] === '+' ? 'plus' : 'min'}">${n}</span>`);
export function keuzeKnop(t, s, fn, extra = ''){ return `<button class="keuze" data-i="${act(fn)}" ${extra}><span class="t">${t}</span>${s ? `<span class="s">${effecten(s)}</span>` : ''}</button>`; }

// Tabbalk: tabs = [[sleutel, label, badge?]]; badge '!' is urgent, een getal is 'nog te doen'
export function tabBalk(tabs, actief, kies, cls = 'hubtabs'){
  return `<nav class="${cls}" role="tablist">${tabs.map(([k, l, badge]) => `<button class="hubtab ${k === actief ? 'aan' : ''}" role="tab" aria-selected="${k === actief}" data-i="${act(() => kies(k))}" data-blijf>${l}${badge ? `<span class="badge ${badge === '!' ? 'urgent' : ''}" aria-label="${badge === '!' ? 'actie nodig' : `${badge} open`}">${badge}</span>` : ''}</button>`).join('')}</nav>`;
}

export function render(){
  resetActs(); muziekNaRender(!!S); // (startscherm: menumuziek, in het spel: de spelmuziek)
  const veld = document.getElementById('veld'), trainerFase = S && (/^(trainer|analist|eigenaar)/.test(S.fase) || (S.fase === 'event' && S.trainer && !S.trainer.gestopt)); // (een privégebeurtenis als trainer)
  veld.innerHTML = tmp.beweging ? vBeweging() : S && tmp.vrijTrainen ? vVrijTrainen() : S && tmp.stats ? vStats() : S ? ({selectie:vSelectie, selectieKeuze:vSelectieKeuze, proef:vProef, week:vWeek, oproep:vOproep, event:vEvent, match:vMatch, matchEnd:vMatchEnd, venster:vVenster, clubloos:vClubloos, afscheid:vAfscheid, seizoenEinde:vSeizoenEinde, ontwikkeling:vOntwikkeling, toernooi:vToernooi, toernooiEinde:vToernooiEinde, einde:vEinde, trainerAanbod:vTrainerAanbod, trainerCursus:vTrainerCursus, trainerLive:vTrainerLive, trainer:vTrainer, trainerUitslag:vTrainerUitslag, trainerSeizoen:vTrainerSeizoen, analist:vAnalist, analistUitslag:vAnalistUitslag, analistSeizoen:vAnalistSeizoen, eigenaarAanbod:vEigenaarAanbod, eigenaar:vEigenaar, eigenaarSeizoen:vEigenaarSeizoen}[S.fase] || vStart)() : vStart();
  document.getElementById('zij').innerHTML = S && /^(analist|eigenaar)/.test(S.fase) ? (vZijNa() || vZijStart()) : S && S.trainer && trainerFase ? vZijTrainer() : S && S.fase !== 'einde' && !trainerFase && !S.selectie ? vZij() : vZijStart();
  const hud = document.getElementById('hud');
  hud.innerHTML = vHud(!!(S && !trainerFase && S.fase !== 'einde' && !S.selectie));
  document.body.dataset.fase = tmp.beweging ? 'beweging' : S && tmp.vrijTrainen ? 'vrijtrainen' : S ? (tmp.stats ? 'stats' : S.fase) : 'start';
  document.documentElement.style.setProperty('--hud-h', hud.offsetHeight + 'px');
  // Laatste actie van de wedstrijd nog niet in beeld gezien? Dan het veld boven het eindscherm
  if (S && !tmp.beweging && !tmp.vrijTrainen && !tmp.stats && S.fase === 'matchEnd' && S.M && openAnims(S.M).length && instel().anim !== 'uit') veld.insertAdjacentHTML('afterbegin', vPitch());
  const log = veld.querySelector('.log'); if (log) log.scrollTop = log.scrollHeight;
  try { pitchNaRender(); } catch (e){ console.error('veld', e); }
  try { bewegingNaRender(); } catch (e){ console.error('bewegingseditor', e); }
  try { vrijNaRender(); } catch (e){ console.error('vrij trainen', e); }
  try { fotoNaRender(); } catch (e){ console.error('krantenfoto', e); }
  try { krantNaRender(); } catch (e){ console.error('pixelkrant', e); }
  try { voorbeeldNaRender(); } catch (e){ console.error('pixelspeler', e); }
  try { proefNaRender(); } catch (e){ console.error('proeftraining', e); }
  markeerSneltoetsen(veld);
  if (S) bewaar();
  // Net getekend bij een nieuwe club? Dan de animatie (over het spel heen; het spel zelf is al bijgewerkt)
  if (S && tmp.ondertekening){ const o = tmp.ondertekening; tmp.ondertekening = null; if (instel().transferAnim !== 'uit') speelOndertekening(o); }
  // Een prijs gewonnen? Dan eerst de huldiging; een persconferentie die nog open staat komt daarna (als speler na de wedstrijd, als trainer ervoor)
  if (S && !tmp.beweging && !tmp.vrijTrainen && !tmp.stats && !tmp.simBezig){ if (S.huldiging || HULD_BEZIG) huldigingCheck(); else persCheck(); }
}
// De huldiging (render/huldigingscene.js): S.huldiging = {soort, prijs, clubId of land}, gezet bij de winst van een beker, de titel of een toernooi.
// Na een wedstrijd pas als de laatste actie op het veld is uitgespeeld (zoals de persconferentie hieronder)
let HULD = null, HULD_BEZIG = false, huldWacht = 0, huldSinds = 0;
function huldigingCheck(){
  if (HULD_BEZIG || !S.huldiging || S.fase === 'match') return;
  if (S.fase === 'matchEnd' && S.M){ const open = openAnims(S.M); huldSinds = huldSinds || Date.now(); const lang = Date.now() - huldSinds > 5000; // (hooguit 5 seconden wachten)
    (S.M.gesimuleerd || lang ? open : open.slice(0, -1)).forEach(a => { a.gezien = true; }); }
  if (S.fase === 'matchEnd' && S.M && openAnims(S.M).length && instel().anim !== 'uit'){ clearTimeout(huldWacht); huldWacht = setTimeout(() => { if (S && S.huldiging) huldigingCheck(); }, 600); return; }
  const o = S.huldiging; S.huldiging = null; huldSinds = 0; bewaar();
  if (instel().huldigingAnim === 'uit'){ render(); return; }
  HULD_BEZIG = true;
  speelHuldigingNu(o).finally(() => { HULD_BEZIG = false; if (S) render(); });
}
export function speelHuldigingNu(o){ return (HULD || (HULD = import('../render/huldigingscene.js'))).then(m => m.speelHuldiging(o)).catch(e => console.warn('huldiging', e)); }
let PERS = null, persWacht = 0;
function persOpenNu(){
  const P = S.fase === 'matchEnd' && S.M ? S.M.pers : S.fase === 'trainer' && S.trainer ? S.trainer.pers : null;
  return P && !P.getoond && !P.klaar ? P : null;
}
function persCheck(){
  const P = persOpenNu(); if (!P) return;
  // eerst de laatste actie van de wedstrijd op het veld laten uitspelen
  // (een gesimuleerde wedstrijd: niet eerst alle acties afspelen; anders hooguit de laatste, zodat je niet lang hoeft te wachten)
  if (S.fase === 'matchEnd'){ const open = openAnims(S.M); P.wachtSinds = P.wachtSinds || Date.now(); const lang = Date.now() - P.wachtSinds > 5000; // (hooguit 5 seconden wachten)
    (S.M.gesimuleerd || lang ? open : open.slice(0, -1)).forEach(a => { a.gezien = true; }); }
  if (S.fase === 'matchEnd' && openAnims(S.M).length && instel().anim !== 'uit'){ clearTimeout(persWacht); persWacht = setTimeout(() => { if (S && persOpenNu() === P) persCheck(); }, 600); return; }
  P.getoond = true; bewaar();
  (PERS || (PERS = import('../render/persscene.js'))).then(m => m.speelPersconferentie()).catch(e => console.warn('persconferentie', e)).finally(() => { if (S) render(); });
}
let CONTRACT = null;
export function speelOndertekening(o){
  return (CONTRACT || (CONTRACT = import('../render/contractscene.js'))).then(m => m.speelContractScene(o)).catch(e => console.warn('transfer-animatie', e));
}

// Nummer 1-9 op de eerste keuzes in het speelveld, en de hoofdknop (Enter) markeren
function markeerSneltoetsen(veld){
  // Knoppen in een dichtgeklapt paneel tellen niet mee
  [...veld.querySelectorAll('.keuze:not([disabled])')].filter(b => !b.closest('details:not([open])')).forEach((b, i) => { if (i < 9) b.dataset.sneltoets = i + 1; });
  const hoofd = [...veld.querySelectorAll('.hoofd:not([disabled])')].filter(b => !b.closest('.paneel, .keuzes'));
  const primair = hoofd[hoofd.length - 1];
  if (primair) primair.dataset.primair = '';
}
