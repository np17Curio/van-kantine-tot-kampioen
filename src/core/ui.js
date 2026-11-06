import { S, bewaar, tmp } from './state.js';
import { vToernooi, vToernooiEinde } from '../game/interlands/toernooi.js';
import { instel, openAnims, pitchNaRender, vPitch } from '../render/pitch.js';
import { fotoNaRender } from '../render/krantfoto.js';
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
import { vHoofdstuk } from '../render/views/hoofdstuk.js';
import { vAfscheid } from '../render/views/afscheid.js';

/* ===================== Weergave ===================== */
// Elke knop krijgt een index in ACTS; de klik-handler in main.js voert die functie uit en tekent opnieuw.
export let ACTS = [];
export const act = fn => ACTS.push(fn) - 1;
export function knop(label, fn, cls = 'hoofd', extra = ''){ return `<button class="${cls}" data-i="${act(fn)}" ${extra}>${label}</button>`; }
export function resetActs(){ ACTS = []; }

// Kleurt effecten als "+8" (groen) en "−12" (rood) in de ondertitel van een keuze
export const effecten = s => String(s).replace(/(^|[\s(·])([+−]\d+(?:[.,]\d+)?%?)/g, (_, voor, n) => `${voor}<span class="eff ${n[0] === '+' ? 'plus' : 'min'}">${n}</span>`);
export function keuzeKnop(t, s, fn, extra = ''){ return `<button class="keuze" data-i="${act(fn)}" ${extra}><span class="t">${t}</span>${s ? `<span class="s">${effecten(s)}</span>` : ''}</button>`; }

// Tabbalk: tabs = [[sleutel, label, badge?]]; badge '!' is urgent, een getal is 'nog te doen'
export function tabBalk(tabs, actief, kies, cls = 'hubtabs'){
  return `<nav class="${cls}" role="tablist">${tabs.map(([k, l, badge]) => `<button class="hubtab ${k === actief ? 'aan' : ''}" role="tab" aria-selected="${k === actief}" data-i="${act(() => kies(k))}" data-blijf>${l}${badge ? `<span class="badge ${badge === '!' ? 'urgent' : ''}" aria-label="${badge === '!' ? 'actie nodig' : `${badge} open`}">${badge}</span>` : ''}</button>`).join('')}</nav>`;
}

export function render(){
  resetActs();
  const veld = document.getElementById('veld'), trainerFase = S && (/^(trainer|analist|eigenaar)/.test(S.fase) || (S.fase === 'event' && S.trainer && !S.trainer.gestopt)); // (een privégebeurtenis als trainer)
  veld.innerHTML = tmp.beweging ? vBeweging() : S && tmp.vrijTrainen ? vVrijTrainen() : S && tmp.stats ? vStats() : S ? ({selectie:vSelectie, selectieKeuze:vSelectieKeuze, hoofdstuk:vHoofdstuk, week:vWeek, oproep:vOproep, event:vEvent, match:vMatch, matchEnd:vMatchEnd, venster:vVenster, clubloos:vClubloos, afscheid:vAfscheid, seizoenEinde:vSeizoenEinde, ontwikkeling:vOntwikkeling, toernooi:vToernooi, toernooiEinde:vToernooiEinde, einde:vEinde, trainerAanbod:vTrainerAanbod, trainerCursus:vTrainerCursus, trainerLive:vTrainerLive, trainer:vTrainer, trainerUitslag:vTrainerUitslag, trainerSeizoen:vTrainerSeizoen, analist:vAnalist, analistUitslag:vAnalistUitslag, analistSeizoen:vAnalistSeizoen, eigenaarAanbod:vEigenaarAanbod, eigenaar:vEigenaar, eigenaarSeizoen:vEigenaarSeizoen}[S.fase] || vStart)() : vStart();
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
  markeerSneltoetsen(veld);
  if (S) bewaar();
  // Net getekend bij een nieuwe club? Dan de animatie (over het spel heen; het spel zelf is al bijgewerkt)
  if (S && tmp.ondertekening){ const o = tmp.ondertekening; tmp.ondertekening = null; if (instel().transferAnim !== 'uit') speelOndertekening(o); }
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
