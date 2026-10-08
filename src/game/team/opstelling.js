import { S, club, ovr } from '../../core/state.js';
import { clamp } from '../../core/utils.js';
import { AANV, JEUGD, OPST_BASIS } from '../../data/gegevens.js';
import { statusNiveau } from '../speler/status.js';

/* ===================== Opstelling ===================== */
// Hoe groot is je kans op een basisplaats? Vertrouwen, vorm, conditie, kwaliteit en status tellen mee
// Je status gaat voor: een jonkie/nieuwkomer begint op de bank, een bankspeler komt hooguit in aanmerking
// voor een basisplaats (twijfelgeval) als hij in vorm is. Pas als vaste waarde ben je echt basisspeler.
export const OPST_MAX = [42, 50];
export function opstMax(lvl, sc){ return lvl < OPST_MAX.length ? Math.min(sc, OPST_MAX[lvl]) : sc; }
export function opstellingScore(){
  const sp = S.sp, c = club(), lvl = statusNiveau();
  return opstMax(lvl, OPST_BASIS[lvl] + sp.vorm * 9 + Math.min(0, sp.fit - 55) * 1.2 + (sp.vert - 50) * .25 + clamp(ovr(sp) - c.s, -10, 10) * .8);
}
export function opstellingReden(twijfel){
  const sp = S.sp, c = club(), lvl = statusNiveau();
  if (sp.fit < 45) return twijfel ? `Je conditie is niet top (fitheid ${Math.round(sp.fit)}). De trainer twijfelt of hij je laat starten.` : `Je conditie is niet goed genoeg (fitheid ${Math.round(sp.fit)}).`;
  if (sp.vorm <= -1) return twijfel ? 'Je speelde slecht in de vorige wedstrijd. De trainer twijfelt of hij je laat starten.' : 'Je speelde slecht in de vorige wedstrijd. De trainer kiest voor iemand anders.';
  if (lvl === 0){
    const vorm = sp.vorm >= .8;
    if (c.t !== JEUGD && sp.leeftijd < 20) return vorm ? 'Je bent nog een jonkie bij de senioren. De trainer laat je rustig wennen, maar hij ziet wel dat je in vorm bent: pak je minuten als invaller!' : 'Je bent nog een jonkie bij de senioren. De trainer laat je rustig wennen.';
    return vorm ? 'Je bent nieuw bij de club en moet je eerst bewijzen. Je bent in vorm: pak je minuten als invaller!' : 'Je bent nieuw bij de club. Je moet je eerst bewijzen.';
  }
  if (lvl === 1){
    if (twijfel) return sp.vorm >= .8 ? 'Je bent bankspeler, maar door je goede vorm maak je kans op een basisplaats.' : 'Je bent bankspeler, maar de trainer overweegt je een kans in de basis te geven.';
    return 'Je bent bankspeler. Speel goed als invaller om een basisplaats te verdienen.';
  }
  if (sp.vert < 40) return 'De trainer heeft nog niet genoeg vertrouwen in je.';
  return 'De concurrentie op jouw positie is groot.';
}
export function verwachteOpstelling(){
  const sp = S.sp;
  if (sp.blessure > 0) return {k:'Geblesseerd', cls:'r-riskant', reden:'Je kunt deze week niet spelen.'};
  if (sp.geschorst > 0) return {k:'Geschorst', cls:'r-riskant', reden: sp.geschorst === 1 ? 'Je bent deze wedstrijd geschorst.' : `Je bent nog ${sp.geschorst} wedstrijden geschorst.`};
  if (sp.fit < 20) return {k:'Rust', cls:'r-riskant', reden:'Je bent compleet kapot. De trainer laat je rusten.'};
  const sc = opstellingScore();
  if (sc >= 56) return {k:'Basisplaats', cls:'r-veilig', reden: statusNiveau() >= AANV ? 'Jij bent de aanvoerder.' : 'De trainer rekent op je.'};
  if (sc >= 44) return {k:'Twijfelgeval', cls:'r-gem', reden:opstellingReden(true)};
  if (sc >= 12) return {k:'Waarschijnlijk bank', cls:'r-riskant', reden:opstellingReden()};
  return {k:'Waarschijnlijk tribune', cls:'r-riskant', reden:opstellingReden()};
}
