import { S, club, mod, ovr, salarisVoor, seizoenLabel } from '../../core/state.js';
import { clamp, pick } from '../../core/utils.js';
import { AANTAL_RONDES, AMATEUR, CLUBS, DIVS, JEUGD } from '../../data/gegevens.js';
import { stand } from '../competitie/spelers.js';
import { simNacompetitie } from '../competitie/nacompetitie.js';
import { KRANTEN } from '../media/nieuws.js';
import { roddel } from '../media/roddel.js';
import { isProf } from '../prive/sponsors.js';
import { nieuweIdentiteit } from '../competitie/europa.js';
import { hervormEuropa } from '../transfers/buitenland.js';

/* ===================== Kampioen, promotie en degradatie ===================== */
// Kampioen zodra niemand je nog kan inhalen (of na de laatste speelronde bovenaan)
export function checkKampioen(M){
  const t = club().t, st = stand(t), mijn = S.sp.club, over = AANTAL_RONDES - (S.ronde + 1);
  if (S.ss.kampioen || st[0] !== mijn) return;
  const voorsprong = S.tab[st[0]].pt - S.tab[st[1]].pt;
  if (over > 0 && voorsprong <= over * 3) return;
  S.ss.kampioen = S.ronde + 1; M.kampioen = true;
  mod('moraal', 12);
  const volgende = t >= 2 && t <= AMATEUR ? DIVS[t - 1] : null;
  M.kampioenTekst = `${club().n} is kampioen van de ${DIVS[t]}!${over > 0 ? ` Met nog ${over} ${over === 1 ? 'wedstrijd' : 'wedstrijden'} te gaan kan niemand jullie meer inhalen.` : ''} De spelers rennen het veld op, de trainer wordt in de lucht gegooid en jij staat met de schaal in je handen.${volgende ? ` Volgend seizoen speelt ${club().n} in de ${volgende}!` : t === 1 ? ' Volgend seizoen spelen jullie Champions League!' : ''}`;
  const kop = {bron:pick(KRANTEN[t]), kop:`${club().n} kampioen van de ${DIVS[t]}!`, tekst: volgende ? `De ploeg van ${S.sp.naam} promoveert naar de ${volgende}. Feest in de hele stad.` : t === 1 ? 'De beste ploeg van het land. Volgend seizoen wacht de Champions League.' : 'Na afloop wordt er tot diep in de nacht gefeest in de kantine.', wanneer:`week ${S.ronde + 1}, ${seizoenLabel()}`};
  M.nieuws = [kop].concat(M.nieuws || []).slice(0, 3);
  S.nieuws = [kop].concat(S.nieuws || []).slice(0, 6);
}
// Na het seizoen: de kampioen van een niveau gaat omhoog, de nummer laatst gaat omlaag (jeugd doet niet mee).
// Daarna de nacompetitie: wint de nummer 2 van het lagere niveau van de nummer een-na-laatst erboven, dan wisselen ze ook.
// Zonder gespeelde nacompetitie (trainermodus) wordt die hier gesimuleerd.
export function bepaalPromotie(){
  const wissels = [];
  for (let t = 1; t < AMATEUR; t++){
    const boven = stand(t), onder = stand(t + 1);
    wissels.push({id:boven[boven.length - 1], van:t, naar:t + 1}, {id:onder[0], van:t + 1, naar:t});
  }
  const po = S.ss.po && S.ss.po.every(p => p.w !== undefined) ? S.ss.po : (S.ss.po = simNacompetitie());
  for (const p of po) if (p.w === p.laag) wissels.push({id:p.laag, van:p.t + 1, naar:p.t, po:true}, {id:p.hoog, van:p.t, naar:p.t + 1, po:true});
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
export const FEEST = (jeugd, prof) => [
  jeugd ? {l:'Feest in de kantine', f(){ mod('moraal', 8); return 'Patat, cola en heel hard meezingen. De trainer danst op tafel.'; }}
        : {l:'Met de open bus door de stad', f(){ mod('moraal', 8); mod('rep', 3); return 'Duizenden fans langs de route. Jij staat vooraan met de schaal boven je hoofd.'; }},
  {l:'De trainer natspuiten', f(){ mod('moraal', 6); mod('vert', 3); return jeugd ? 'Je gooit een emmer water over de trainer heen. Hij lacht en gooit er een terug.' : 'Je spuit de trainer helemaal nat met champagne. Hij lacht en spuit terug.'; }},
  {l:'Feesten tot de zon opkomt', f(){ mod('moraal', 12); if (prof) roddel(`${S.sp.naam} viert titel tot zonsopgang`, 'Foto\'s van het feest gaan rond. "Hij heeft het verdiend," zeggen de fans.'); return 'Wat een nacht. Je weet niet meer hoe je thuisgekomen bent.'; }},
  {l:'Rustig vieren met familie', f(){ mod('moraal', 5); mod('focus', 5); if (S.sp.relatie) S.sp.relatie.band = clamp(S.sp.relatie.band + 5, 0, 100); return 'Je viert het thuis met de mensen die het dichtst bij je staan. Je moeder huilt van trots.'; }}];
export function kiesFeest(i){ const E = S.eind; if (!E || E.feest) return; E.feest = FEEST(E.t === JEUGD, isProf())[i].f(); }
