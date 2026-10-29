import { S } from '../core/state.js';
import { rnd } from '../core/utils.js';
import { CLUBS, TRAINBAAR } from '../data/gegevens.js';
import { fixture } from './competitie/competitie.js';
import { naBeker, naWedstrijd } from './competitie/beker.js';
import { naNacompetitie } from './competitie/nacompetitie.js';
import { kiesEvent } from './gebeurtenissen.js';
import { naInterland } from './interlands/interlands.js';
import { geefNaam } from './prive/gezin.js';
import { beantwoord } from './prive/school.js';
import { doeActiviteit, plafond } from './week.js';
import { isDerby } from './wedstrijd/fans-pers.js';
import { rustWeek, simuleer, startWedstrijd } from './wedstrijd/wedstrijd.js';

/* ===================== Het seizoen simuleren ===================== */
// Speelt week na week door, en stopt bij de grote momenten: de transferperiode, een verhaalhoofdstuk, een interland,
// een eindtoernooi, een derby, een transferbod en het einde van het seizoen. Kleine keuzes maakt het spel zelf, zoals een gewone
// speler: niet elke week de perfecte training en niet altijd de veiligste optie in de wedstrijd (anders groei je sneller dan als je zelf speelt).
const STOP = {venster:'de transferperiode is open', hoofdstuk:'een nieuw hoofdstuk in je verhaal', oproep:'de bondscoach roept je op', toernooi:'het eindtoernooi begint', seizoenEinde:'het seizoen zit erop'};
function weekKeuzes(){
  const sp = S.sp, w = S.week;
  if (w.school && !w.school.klaar) beantwoord(rnd() < .7 ? w.school.goed : (w.school.goed + 1) % 3);
  if (sp.geboorte && sp.geboorte.opties) geefNaam(sp.geboorte.opties[0]);
  if (!w.gedaan){
    if (sp.blessure > 0) doeActiviteit('revalidatie');
    else if (sp.fit < 55) doeActiviteit('rust');
    // zoals een gewone speler: meestal trainen (niet altijd je zwakste punt), soms rust, video of mentale training
    else { const r = rnd(), l = TRAINBAAR.filter(x => sp.a[x] < plafond()).sort((a, b) => sp.a[a] - sp.a[b]).slice(0, 3), k = l.length ? l[Math.floor(rnd() * l.length)] : null;
      if (r < .6 && k) doeActiviteit('train', k); else if (r < .75) doeActiviteit('video'); else if (r < .85) doeActiviteit('mentaal'); else doeActiviteit('rust'); }
  }
}
// Halve finales en finales van een beker speel je zelf (als je meedoet)
function grootBeker(){
  const M = S.M; if (!M || !M.beker || !/^(Halve finale|Finale)$/.test(M.beker.ronde) || !(M.rol === 'basis' || M.rol === 'invaller')) return null;
  return `de ${M.beker.ronde.toLowerCase()} van de ${M.beker.naam} tegen ${M.zij} speel je zelf`;
}
const naEind = M => M && M.inter ? naInterland() : M && M.po ? naNacompetitie() : M && M.beker ? naBeker() : naWedstrijd();
export function simuleerSeizoen(){
  const sp = S.sp, tel = {wed:0, W:0, G:0, V:0, g:0}, start = S.ronde; let reden = null, stil = 0, vorige = '';
  const telWed = M => { if (!M || M.geteldSim) return; M.geteldSim = true; tel.wed++; tel[M.us > M.them ? 'W' : M.us < M.them ? 'V' : 'G']++; tel.g += M.goals || 0; };
  for (let n = 0; n < 2000; n++){
    const f = S.fase, sleutel = `${f}|${S.jaar}|${S.ronde}|${S.M ? S.M.idx : ''}`;
    if (sleutel === vorige){ if (++stil > 3){ reden = 'er moet iets gekozen worden'; break; } } else { stil = 0; vorige = sleutel; }
    if (STOP[f]){ reden = STOP[f]; break; }
    if (f === 'week'){
      weekKeuzes(); if (S.fase !== 'week') continue; // (een activiteit kan een gebeurtenis openen: die eerst)
      if (S.week.school && !S.week.school.klaar) { reden = 'eerst je schoolwerk'; break; }
      const fx = sp.clubloos ? null : fixture(S.ronde);
      if (!fx){ rustWeek(); continue; }
      if (!sp.o23 && isDerby(fx.opp)){ reden = `de derby tegen ${CLUBS[fx.opp].n} speel je zelf`; break; }
      startWedstrijd(); if (S.fase === 'match'){ if ((reden = grootBeker())) break; simuleer(true); } continue;
    }
    if (f === 'match'){ if (S.M && S.M.derby){ reden = `de derby tegen ${S.M.zij} speel je zelf`; break; } if ((reden = grootBeker())) break; simuleer(true); continue; }
    if (f === 'matchEnd'){ telWed(S.M); naEind(S.M); continue; }
    if (f === 'event'){
      if (S.ev && S.ev.soort === 'transfer'){ reden = 'er ligt een bod op je'; break; }
      const o = (S.ev && S.ev.opts) || []; let i = o.findIndex(x => x.toon === 'bal'); if (i < 0) i = 0;
      kiesEvent(i); continue;
    }
    reden = 'hier kies je zelf'; break;
  }
  const weken = Math.max(0, S.ronde - start), samen = tel.wed ? ` ${tel.wed} ${tel.wed === 1 ? 'wedstrijd' : 'wedstrijden'} gesimuleerd: ${tel.W}W ${tel.G}G ${tel.V}V, ${tel.g} ${tel.g === 1 ? 'goal' : 'goals'} van jou.` : '';
  S.simMelding = `⏸ Gesimuleerd tot week ${Math.min(S.ronde + 1, 99)}: ${reden || 'klaar'}.${samen}`;
  if (S.week && S.fase === 'week') S.week.tekst.unshift(S.simMelding);
  if (S.fase === 'match' && S.M && S.M.log) S.M.log.unshift({m:'', t:S.simMelding, k:'info'});
  if (S.fase === 'venster' && S.venster) S.venster.intro = S.simMelding + ' ' + S.venster.intro;
  return {reden, weken, ...tel};
}
