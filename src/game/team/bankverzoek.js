import { S, mod } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { clamp, esc, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, AANV } from '../../data/gegevens.js';
import { fixture } from '../competitie/competitie.js';
import { statusNiveau } from '../speler/status.js';
import { isDerby } from '../wedstrijd/fans-pers.js';
import { opstellingScore } from './opstelling.js';

/* ===================== Op de bank beginnen om fit te blijven ===================== */
// Je kunt de trainer vragen om de volgende wedstrijd op de bank te beginnen. Hij beslist:
// hoe vermoeider je bent, hoe eerder ja; een aanvoerder of een derby laat hij niet graag schieten.
export function kanBankVragen(){
  const sp = S.sp, w = S.week;
  if (!w || w.bank || sp.o23) return false;
  if (sp.blessure > 0 || sp.geschorst > 0 || sp.fit < 20) return false;
  return opstellingScore() >= 44; // alleen als je nu een basisplaats (of bijna) hebt
}
export function bankKans(){
  const sp = S.sp, n = statusNiveau(), fx = fixture(S.ronde);
  let k = .45 + (60 - sp.fit) / 80 + (sp.vert - 50) / 400;
  if (n >= AANV) k -= .18; else if (n === 3) k -= .08;
  if (fx && isDerby(fx.opp)) k -= .2;
  if (S.ronde >= AANTAL_RONDES - 3) k -= .1;
  return clamp(k, .05, .95);
}
export function vraagBank(){
  const sp = S.sp, w = S.week; if (!kanBankVragen()) return;
  let t;
  if (rnd() < bankKans()){
    if (sp.fit < 40){ w.bank = 'rust'; t = 'De trainer kijkt je aan en knikt. "Je zit erbij, maar je speelt niet. Rust maar goed uit."'; }
    else { w.bank = 'inval'; t = 'De trainer knikt. "Goed idee. Je begint op de bank en ik breng je in de tweede helft."'; }
  } else {
    w.bank = 'nee';
    if (sp.fit >= 70){ mod('vert', -2); t = 'De trainer fronst. "Op de bank? Je bent fit genoeg. Ik heb je nodig op het veld."'; }
    else t = 'De trainer schudt zijn hoofd. "Geen sprake van, ik heb je nodig. Zet je er maar overheen."';
  }
  w.bankTekst = t; w.tekst.push(t);
}
// In de vooruitblik op de wedstrijd: de vraag, of het antwoord van de trainer
export function vBankVraag(){
  const w = S.week; if (!w) return '';
  if (w.bankTekst) return `<p class="opst"><span class="label">Bank gevraagd</span><span class="muted">${esc(w.bankTekst)}</span></p>`;
  if (!kanBankVragen()) return '';
  const k = bankKans(), [l, cls] = k >= .6 ? ['waarschijnlijk wel', 'r-veilig'] : k >= .3 ? ['misschien', 'r-gem'] : ['waarschijnlijk niet', 'r-riskant'];
  return `<p class="opst"><span class="label">Fitheid sparen</span>${knop('Vraag om op de bank te beginnen', vraagBank, 'klein', 'data-blijf')}<span class="muted klein-tekst">Gaat de trainer akkoord?</span><span class="risico ${cls}" style="white-space:nowrap">${l}</span></p>`;
}
