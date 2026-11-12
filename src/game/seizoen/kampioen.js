import { S, club, mod, ovr, salarisVoor, seizoenLabel } from '../../core/state.js';
import { clamp, pick } from '../../core/utils.js';
import { CLUBS, DIVS, LAAGSTE, ligaVan, rondesVan, rondesVoor } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { stand } from '../competitie/spelers.js';
import { nacompetitieKlaar, simNacompetitie } from '../competitie/nacompetitie.js';
import { KRANTEN } from '../media/nieuws.js';
import { roddel } from '../media/roddel.js';
import { isProf } from '../prive/sponsors.js';
import { nieuweIdentiteit } from '../competitie/europa.js';
import { hervormEuropa } from '../transfers/buitenland.js';
import { ik } from '../../core/geslacht.js';

/* ===================== Kampioen, promotie en degradatie ===================== */
// Kampioen zodra niemand je nog kan inhalen (of na de laatste speelronde bovenaan)
export function checkKampioen(M){
  const t = club().t, st = stand(t), mijn = S.sp.club, over = rondesVan(t) - rondesVoor(t, S.ronde + 1); // wedstrijden die jouw league nog speelt
  if (S.ss.kampioen || st[0] !== mijn) return;
  const voorsprong = S.tab[st[0]].pt - S.tab[st[1]].pt;
  if (over > 0 && voorsprong <= over * 3) return;
  S.ss.kampioen = S.ronde + 1; M.kampioen = true;
  mod('moraal', 12);
  const volgende = t >= 2 && t <= LAAGSTE ? DIVS[t - 1] : null;
  M.kampioenTekst = `${club().n} is kampioen van de ${DIVS[t]}!${over > 0 ? ` Met nog ${over} ${over === 1 ? 'wedstrijd' : 'wedstrijden'} te gaan kan niemand jullie meer inhalen.` : ''} De spelers rennen het veld op, de trainer wordt in de lucht gegooid en jij staat met de schaal in je handen.${volgende ? ` Volgend seizoen speelt ${club().n} in de ${volgende}!` : t === 1 ? ' Volgend seizoen spelen jullie Champions League!' : ''}`;
  const kop = {bron:pick(KRANTEN[t]), kop:`${club().n} kampioen van de ${DIVS[t]}!`, tekst: volgende ? `De ploeg van ${S.sp.naam} promoveert naar de ${volgende}. Feest in de hele stad.` : t === 1 ? 'De beste ploeg van het land. Volgend seizoen wacht de Champions League.' : 'Na afloop wordt er tot diep in de nacht gefeest in de kantine.', wanneer:`week ${S.ronde + 1}, ${seizoenLabel()}`};
  M.nieuws = [kop].concat(M.nieuws || []).slice(0, 3);
  S.nieuws = [kop].concat(S.nieuws || []).slice(0, 12);
}
// Na het seizoen, volgens de regels van je land (LIGA in gegevens.js): de onderste `omlaag` clubs van de hoogste league
// gaan omlaag, de bovenste `omhoog` clubs van de 2e league omhoog. Daarna de nacompetitie (barrage of play-offs).
// Zonder gespeelde nacompetitie (trainermodus) wordt die hier gesimuleerd.
export function bepaalPromotie(){
  const L = ligaVan(thuisLand()), boven = stand(1), onder = stand(LAAGSTE), wissels = [];
  boven.slice(boven.length - L.omlaag).forEach(id => wissels.push({id, van:1, naar:LAAGSTE}));
  onder.slice(0, L.omhoog).forEach(id => wissels.push({id, van:LAAGSTE, naar:1}));
  const po = nacompetitieKlaar(S.ss.po) ? S.ss.po : (S.ss.po = simNacompetitie());
  if (L.po.soort === 'barrage'){ const p = po[0]; if (p && p.w === p.laag) wissels.push({id:p.laag, van:LAAGSTE, naar:1, po:true}, {id:p.hoog, van:1, naar:LAAGSTE, po:true}); }
  else { const f = po.find(p => p.soort === 'finale'); if (f && f.w != null) wissels.push({id:f.w, van:LAAGSTE, naar:1, po:true}); }
  return wissels;
}
export function voerPromotieUit(wissels){
  const sp = S.sp;
  wissels.forEach(w => { const c = CLUBS[w.id]; c.t = w.naar; if (w.naar !== w.van) c.s = clamp(c.s + (w.naar < w.van ? 2 : -2), 30, 95); if (w.nieuw) nieuweIdentiteit(w.id, w.nieuw); });
  // Voor de stand van het nieuwe seizoen: wie is er gepromoveerd, gedegradeerd of nieuw
  if (!S.mig6) hervormEuropa(); // oude opslag: de Elite opheffen (eenmalig, tussen twee seizoenen)
  S.nieuwInDiv = {jaar:S.jaar + 1, op:wissels.filter(w => w.naar < w.van).map(w => w.id), neer:wissels.filter(w => w.naar > w.van && !w.nieuw).map(w => w.id), nieuw:wissels.filter(w => w.nieuw).map(w => w.id)};
  S.clubs = CLUBS.map(c => [c.t, c.s]);
  // Je eigen club promoveert: een beter contract dat bij het nieuwe niveau past
  const mijn = wissels.find(w => w.id === sp.club);
  if (mijn && mijn.naar < mijn.van) sp.salaris = Math.max(sp.salaris, Math.round(salarisVoor(mijn.naar, ovr(sp), club().s) * .9 / 100) * 100);
}
export const FEEST = prof => [
  {l:'Met de open bus door de stad', f(){ mod('moraal', 8); mod('rep', 3); return 'Duizenden fans langs de route. Jij staat vooraan met de schaal boven je hoofd.'; }},
  {l:'De trainer natspuiten', f(){ mod('moraal', 6); mod('vert', 3); return 'Je spuit de trainer helemaal nat met champagne. Hij lacht en spuit terug.'; }},
  {l:'Feesten tot de zon opkomt', f(){ mod('moraal', 12); if (prof) roddel(`${S.sp.naam} viert titel tot zonsopgang`, 'Foto\'s van het feest gaan rond. "' + ik.Hij + ' heeft het verdiend," zeggen de fans.'); return 'Wat een nacht. Je weet niet meer hoe je thuisgekomen bent.'; }},
  {l:'Rustig vieren met familie', f(){ mod('moraal', 5); mod('focus', 5); if (S.sp.relatie) S.sp.relatie.band = clamp(S.sp.relatie.band + 5, 0, 100); return 'Je viert het thuis met de mensen die het dichtst bij je staan. Je moeder huilt van trots.'; }}];
export function kiesFeest(i){ const E = S.eind; if (!E || E.feest) return; E.feest = FEEST(isProf())[i].f(); }
