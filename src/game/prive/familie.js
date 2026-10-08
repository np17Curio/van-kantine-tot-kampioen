import { S, mod } from '../../core/state.js';
import { clamp, pick, rnd } from '../../core/utils.js';
import { kindLeeftijd } from './gezin.js';
import { focusBoost } from '../wedstrijd/momenten.js';

/* ===================== Familie: je ouders ===================== */
export const ouders = () => { const o = S.sp.ouders || (S.sp.ouders = {boos:false, trots:false}); if (o.band === undefined) o.band = 70; return o; };
export function ouderActie(id){
  const sp = S.sp, w = S.week, o = ouders(); if (w.ouder) return; let t;
  if (id === 'eten'){ o.band = clamp(o.band + 6, 0, 100); mod('moraal', 3); focusBoost(2); t = sp.leeftijd < 18 ? 'Je helpt je moeder met koken en jullie eten met z\'n allen aan tafel. Je vader vraagt honderd dingen over je training.' : `Je gaat zondag bij je ouders eten. ${pick(['Je moeder heeft je lievelingseten gemaakt.', 'Je vader laat trots de krantenknipsels over jou zien.', 'Net als vroeger: stamppot en verhalen.'])}`; }
  else if (id === 'helpen'){ o.band = clamp(o.band + 6, 0, 100); let ex = ''; if (o.boos && rnd() < .35){ o.boos = false; ex = ' Je ouders zien dat je je best doet. Ze zijn niet meer boos.'; } t = `Je stofzuigt, ruimt de vaatwasser in en brengt het vuilnis buiten zonder dat iemand het vraagt.${ex}`; }
  else if (id === 'wedstrijd'){ o.band = clamp(o.band + 7, 0, 100); mod('moraal', 3); t = `Je ouders staan langs de lijn bij je wedstrijd. Je vader heeft een spandoek gemaakt met jouw naam.`; }
  else if (id === 'bellen'){ o.band = clamp(o.band + 3, 0, 100); t = `Je belt je moeder even. Na een uur hangen jullie op. "Eet je wel genoeg groente?"`; }
  else if (id === 'cadeau'){ const p = ouderCadeau(); if (sp.geld < p) return; sp.geld -= p; o.band = clamp(o.band + 10, 0, 100); mod('moraal', 3); t = `Je verrast je ouders met ${p >= 5000 ? 'een reis naar Italië' : p >= 1000 ? 'een nieuwe tv' : 'een etentje in een goed restaurant'}. Je moeder huilt van blijdschap.`; }
  if (!t) return; w.ouder = id; w.tekst.push(t);
}
export const ouderCadeau = () => Math.max(60, Math.min(8000, Math.round(S.sp.geld * .02 / 10) * 10));
export function kindActie(){ const sp = S.sp, w = S.week, k = (sp.kinderen || []); if (!k.length || w.kind) return; w.kind = true; mod('moraal', 5); focusBoost(2); const x = pick(k), lft = kindLeeftijd(x);
  w.tekst.push(lft < 2 ? `Je speelt de hele middag met ${x.naam} op de vloer. ${x.jongen ? 'Hij' : 'Zij'} lacht om alles.` : lft < 6 ? `Je leert ${x.naam} een balletje trappen in de tuin. Talent!` : `Je gaat met ${x.naam} naar de dierentuin. ${x.jongen ? 'Hij' : 'Zij'} wil alles weten over de leeuwen.`); }
// Elke week: een goede band met je ouders geeft rust, een slechte kost moraal. Jong? Dan krijg je soms wat extra zakgeld
export function familieWeek(eerste){ if (eerste) return; const sp = S.sp, o = ouders();
  o.band = clamp(o.band - .5, 0, 100);
  if (o.band >= 75) mod('moraal', 1); else if (o.band < 30) mod('moraal', -1);
  if (sp.leeftijd < 18 && o.band >= 70 && rnd() < .2){ sp.geld += 20; S.week.tekst.push('Je vader stopt je stiekem €20 toe. "Niet tegen je moeder zeggen."'); }
}
