import { partnerNaWedstrijd } from '../prive/partner.js';
import { mijlpaalGoalNaWedstrijd } from '../speler/mijlpaalgoal.js';
import { S, club, mod, ovr, seizoenLabel } from '../../core/state.js';
import { sterrenNa } from '../wedstrijd/opdrachten.js';
import { knop } from '../../core/ui.js';
import { clamp, esc, randInt } from '../../core/utils.js';
import { CLUBS, DIVS, LAAGSTE, ligaVan } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { simBeker, vBekerUitslagen } from './beker.js';
import { stand } from './spelers.js';
import { krantMelding } from '../media/roddel.js';
import { volgersNaWedstrijd } from '../prive/social.js';
import { topBonus } from '../prive/sponsors.js';
import { carCijfer } from '../seizoen/carriere.js';
import { seizoenEinde } from '../seizoen/seizoen.js';
import { fmt1 } from '../speler/o23.js';
import { checkStatus, statusPunten, wedstrijdPunten } from '../speler/status.js';
import { teamKracht } from '../team/kleedkamer.js';
import { opstellingReden, opstellingScore } from '../team/opstelling.js';
import { focusNaWedstrijd } from '../wedstrijd/focus.js';
import { MOMENTS, kans } from '../wedstrijd/momenten.js';
import { staminaNaWedstrijd } from '../wedstrijd/stamina.js';
import { planWedstrijd, verderSpelen, keeperRol } from '../wedstrijd/wedstrijd.js';
import { animPush, reeksStrafschoppen } from '../../render/pitch.js';
import { scorebord, vFit, vLog, statRegel } from '../../render/views/match.js';
import { vormBonus } from './vorm.js';

/* ===================== Nacompetitie ===================== */
// Na het seizoen promoveren en degraderen clubs volgens de regels van je land (LIGA in gegevens.js). Daarna de nacompetitie:
//   barrage: één wedstrijd tussen de nr. `boven` van de hoogste league en de nr. `onder` van de 2e league. Wint de lagere club,
//            dan wisselen ze van league; anders blijft alles zo.
//   playoff: de nrs. `van` t/m `tot` van de 2e league spelen halve finales (3-6, 4-5) en een finale; de winnaar promoveert.
// Bij gelijkspel strafschoppen. De club die hoger eindigde speelt thuis.
export function nacompetitieParen(){
  const po = ligaVan(thuisLand()).po, boven = stand(1), onder = stand(LAAGSTE);
  if (po.soort === 'barrage') return boven.length >= po.boven && onder.length >= po.onder ? [{t:1, soort:'barrage', hoog:boven[po.boven - 1], laag:onder[po.onder - 1]}] : [];
  const l = onder.slice(po.van - 1, po.tot); if (l.length < 4) return [];
  return [{t:1, soort:'halve', hoog:l[0], laag:l[3]}, {t:1, soort:'halve', hoog:l[1], laag:l[2]}];
}
// De finale van de play-offs, zodra beide halve finales gespeeld zijn
function finalePaar(paren){
  const h = paren.filter(x => x.soort === 'halve');
  if (h.length !== 2 || h.some(x => x.w === undefined) || paren.some(x => x.soort === 'finale')) return null;
  return {t:1, soort:'finale', hoog:h[0].w, laag:h[1].w};
}
// Een paar zonder jou: simuleren (de hoger geëindigde club speelt thuis)
const simPaar = p => { const m = simBeker(p.hoog, p.laag); return Object.assign(p, {gh:m.gh, gu:m.gu, pen:m.pen, w:m.w}); };
export function simNacompetitie(){ const p = nacompetitieParen().map(simPaar), f = finalePaar(p); if (f) p.push(simPaar(f)); return p; }
// Is de nacompetitie helemaal gespeeld?
export const nacompetitieKlaar = po => !!po && po.every(p => p.w !== undefined) && (ligaVan(thuisLand()).po.soort !== 'playoff' || po.some(p => p.soort === 'finale'));
// Na de laatste speelronde
export function nacompetitie(){
  const sp = S.sp, paren = nacompetitieParen();
  S.ss.po = paren;
  let mijn = null;
  for (const p of paren){ if (!sp.clubloos && (p.hoog === sp.club || p.laag === sp.club)){ p.wacht = true; mijn = p; } else simPaar(p); }
  if (mijn) return startNacompetitie(mijn);
  volgendeNacompetitie();
}
// Na een (halve) finale: de finale van de play-offs spelen (zelf, als jouw club erin staat), of het seizoen afsluiten
function volgendeNacompetitie(){
  const sp = S.sp, f = finalePaar(S.ss.po || []);
  if (!f) return seizoenEinde();
  S.ss.po.push(f);
  if (!sp.clubloos && (f.hoog === sp.club || f.laag === sp.club)){ f.wacht = true; return startNacompetitie(f); }
  simPaar(f); seizoenEinde();
}
export function startNacompetitie(p){
  const sp = S.sp, c = club(), thuis = p.hoog === sp.club, oppId = thuis ? p.laag : p.hoog, opp = CLUBS[oppId];
  const soort = p.soort === 'barrage' ? (thuis ? 'degradatie' : 'promotie') : p.soort; // degradatie, promotie, halve of finale
  let rol, reden = '';
  if (sp.o23) rol = 'o23';
  else if (sp.blessure > 0) rol = 'blessure';
  else if (sp.fit < 20) rol = 'rust';
  else if (sp.geschorst > 0) rol = 'geschorst';
  else { const sc = opstellingScore() + randInt(-6, 6); rol = keeperRol(sc >= 50 ? 'basis' : sc >= 12 ? 'invaller' : 'tribune'); if (rol !== 'basis') reden = ' ' + opstellingReden(); }
  const speelt = rol === 'basis' || rol === 'invaller';
  const T = teamKracht(c.s, {speelt, thuis}), O = opp.s + (thuis ? 0 : 2) + vormBonus(oppId);
  const M = {po:{t:p.t, soort, boven:DIVS[p.t], onder:DIVS[p.t + 1]}, opp:oppId, oppS:opp.s, wij:c.n, zij:opp.n, thuis, rol, us:0, them:0, min:0, ev:[], idx:0, log:[], cijfer:sp.pos === 'VERD' || sp.pos === 'KEEPER' ? 6.3 : 6.0, goals:0, assists:0, geel:false, rood:false, pending:null, klaar:false};
  S.M = M;
  const inzet = soort === 'promotie' || soort === 'finale' ? `Win je, dan promoveer je naar de ${DIVS[p.t]}. Verlies je, dan blijf je in de ${DIVS[p.t + 1]}.` : soort === 'halve' ? `Win je, dan speel je de finale van de play-offs om promotie. Verlies je, dan blijf je in de ${DIVS[p.t + 1]}.` : `Win je, dan blijf je in de ${DIVS[p.t]}. Verlies je, dan degradeer je naar de ${DIVS[p.t + 1]}.`;
  const jij = rol === 'basis' ? 'Je staat in de basis.' : rol === 'invaller' ? 'Je begint op de bank.' + reden : rol === 'bank' ? 'Je zit op de bank als reservekeeper.' : rol === 'o23' ? 'Je speelt bij de O23 en kijkt vanaf de tribune.' : rol === 'blessure' ? 'Je bent geblesseerd en kijkt vanaf de tribune.' : rol === 'rust' ? 'Je bent kapot en krijgt rust.' : rol === 'geschorst' ? 'Je bent geschorst en kijkt vanaf de tribune.' : 'De trainer laat je buiten de selectie.' + reden;
  const wie = soort === 'promotie' ? `de nummer ${stand(p.t).indexOf(oppId) + 1} van de ${DIVS[p.t]}` : soort === 'degradatie' ? `de nummer ${stand(p.t + 1).indexOf(oppId) + 1} van de ${DIVS[p.t + 1]}` : `de nummer ${stand(p.t + 1).indexOf(oppId) + 1} van de ${DIVS[p.t + 1]}`;
  M.log.push({m:'', t:`${soort === 'halve' ? 'HALVE FINALE PLAY-OFFS' : soort === 'finale' ? 'FINALE PLAY-OFFS' : 'NACOMPETITIE'} tegen ${opp.n}, ${wie}. ${inzet} Het stadion is uitverkocht. ${jij}`, k:'info'});
  if (!speelt){ const m = simBeker(p.hoog, p.laag), a = thuis ? m.gh : m.gu, b = thuis ? m.gu : m.gh; planWedstrijd(M, T, O, {us:a, them:b}); }
  else planWedstrijd(M, T, O);
  S.fase = 'match';
  verderSpelen();
}
// Einde van de nacompetitiewedstrijd (aangeroepen vanuit eindeWedstrijd)
export function eindeNacompetitie(){
  const sp = S.sp, M = S.M, p = (S.ss.po || []).find(x => x.wacht), c = club().n, opp = CLUBS[M.opp].n;
  M.klaar = true;
  const speelde = M.rol === 'basis' || M.rol === 'invaller';
  let winst = M.us > M.them;
  if (M.us === M.them){
    const kansJij = speelde && !M.rood ? kans(MOMENTS.penalty.opts[0]) : null;
    const ks = reeksStrafschoppen(kansJij, M);
    winst = ks.wij > ks.zij; M.pens = `${ks.wij}-${ks.zij}`; animPush(M, {soort:'shootout', type:'shootout', kicks:ks.lijst, winst});
    M.log.push({m:"120'", t:`Strafschoppen!${M.penJij === true ? ' Jij neemt de vijfde: raak!' : M.penJij === false ? ' Jij neemt de vijfde... en mist.' : ''} ${winst ? `${c} wint na strafschoppen (${ks.wij}-${ks.zij})!` : `${opp} wint na strafschoppen (${ks.zij}-${ks.wij}).`}`, k: winst ? 'goal' : 'tegen'});
    if (speelde) M.cijfer += M.penJij === true ? .3 : M.penJij === false ? -.4 : 0;
  }
  if (p){ Object.assign(p, {gh:M.thuis ? M.us : M.them, gu:M.thuis ? M.them : M.us, pen:M.pens ? (winst === M.thuis ? 'h' : 'u') : null, w:winst ? sp.club : M.opp}); delete p.wacht; }
  if (speelde){
    if (winst) M.cijfer += .3; else M.cijfer -= .3;
    M.cijfer = Math.round(clamp(M.cijfer, 3, 10) * 10) / 10;
    sp.vert = clamp(sp.vert + (M.cijfer - (M.rol === 'invaller' ? 6.0 : 6.3)) * 4, 0, 100);
    sp.vorm = clamp(sp.vorm * .6 + (M.cijfer - 6.5) * .7, -3, 3);
    sp.rep = clamp(sp.rep + (M.cijfer - 6.5) + M.goals * .8 + (winst ? 1 : 0), 0, 100);
    staminaNaWedstrijd(M);
    S.car.wed++; if (M.rood) S.sp.roodBij = S.car.wed; S.car.g += M.goals; S.car.a += M.assists; carCijfer(M.cijfer);
    statusPunten(wedstrijdPunten(M.cijfer, M.goals, M.assists, winst, M.rood, M.rol === 'invaller') * .5);
    M.bonus = topBonus(M); sterrenNa(M); // (de wedstrijddoelen: opdrachten.js)
    focusNaWedstrijd(M); volgersNaWedstrijd(M); partnerNaWedstrijd(M); mijlpaalGoalNaWedstrijd(M);
  } else { M.cijfer = null; if (M.rol === 'geschorst' && sp.geschorst > 0) sp.geschorst--; }
  const prom = M.po.soort === 'promotie' || M.po.soort === 'finale';
  M.poWinst = winst;
  if (M.po.soort === 'halve'){ if (winst){ mod('moraal', 5); M.poTekst = `${c} wint de halve finale van de play-offs! Nog één wedstrijd van promotie.`; } else { mod('moraal', -6); M.poTekst = `${c} is uitgeschakeld in de play-offs en blijft in de ${M.po.onder}.`; S.car.hist.push(`${seizoenLabel()}: uitgeschakeld in de play-offs met ${c}`); } }
  else if (prom && winst){ mod('moraal', 12); statusPunten(4); M.poTekst = `${c} promoveert via ${M.po.soort === 'finale' ? 'de play-offs' : 'de nacompetitie'} naar de ${M.po.boven}!`; S.car.hist.push(`${seizoenLabel()}: via ${M.po.soort === 'finale' ? 'de play-offs' : 'de nacompetitie'} gepromoveerd met ${c}`);
    krantMelding(`${c} promoveert via de nacompetitie!`, `${M.pens ? 'Na strafschoppen' : `Met ${M.thuis ? M.us + '-' + M.them : M.them + '-' + M.us}`} werd ${opp} verslagen. Volgend seizoen speelt ${c} in de ${M.po.boven}.${speelde && M.goals ? ` ${sp.naam} scoorde.` : ''}`); }
  else if (prom){ mod('moraal', -6); M.poTekst = `Promotie gemist. ${c} blijft in de ${M.po.onder}.`; S.car.hist.push(`${seizoenLabel()}: promotie gemist in de nacompetitie met ${c}`); }
  else if (winst){ mod('moraal', 8); M.poTekst = `${c} handhaaft zich via de nacompetitie in de ${M.po.boven}!`; S.car.hist.push(`${seizoenLabel()}: via de nacompetitie gehandhaafd met ${c}`); }
  else { mod('moraal', -10); M.poTekst = `${c} degradeert naar de ${M.po.onder}.`; S.car.hist.push(`${seizoenLabel()}: via de nacompetitie gedegradeerd met ${c}`);
    krantMelding(`Drama: ${c} degradeert na nacompetitie`, `${opp} was te sterk${M.pens ? ' na strafschoppen' : ''}. Volgend seizoen speelt ${c} een niveau lager.`); }
  M.statusTekst = checkStatus();
  S.fase = 'matchEnd';
}
export function naNacompetitie(){ S.M = null; volgendeNacompetitie(); }
export function vNacompetitieEnd(){
  const M = S.M, uitslag = M.us > M.them ? 'Gewonnen' : M.us < M.them ? 'Verloren' : 'Gelijkspel', goed = M.poWinst;
  let h = scorebord() + `<div class="verhaal"><span class="label">${M.po.soort === 'halve' ? 'Play-offs · halve finale' : M.po.soort === 'finale' ? 'Play-offs · finale' : 'Nacompetitie'} · ${uitslag}${M.pens ? ` (strafschoppen ${M.pens})` : ''}</span>`;
  if (M.cijfer !== null) h += `<div class="rij" style="gap:20px;align-items:flex-end"><div><span class="label">Jouw cijfer</span><div class="groot">${fmt1(M.cijfer)}</div></div><div class="muted">${statRegel(M)}</div></div>`
    + (M.focusTekst ? `<p class="${M.focusOmlaag ? 'fouttxt' : 'goedtxt'}">${esc(M.focusTekst)}</p>` : '') + vFit(M) + (M.bonus ? `<p class="melding">${esc(M.bonus.tekst)}</p>` : '');
  if (M.po.soort === 'halve' && goed) h += `<div class="kampioen"><span class="label">Door naar de finale!</span><p>${esc(M.poTekst)}</p></div>`;
  else if ((M.po.soort === 'promotie' || M.po.soort === 'finale') && goed) h += `<div class="kampioen"><span class="label">Promotie!</span><h2>Naar de ${esc(M.po.boven)}</h2><p>${esc(M.poTekst)} De spelers dansen op het veld en de fans zingen tot diep in de nacht.</p></div>`;
  else if (goed) h += `<div class="kampioen"><span class="label">Gehandhaafd!</span><p>${esc(M.poTekst)} Wat een opluchting.</p></div>`;
  else h += `<p class="melding" style="color:var(--fout);border-color:var(--fout)">${esc(M.poTekst)}</p>`;
  if (M.statusTekst) h += `<p class="melding">${esc(M.statusTekst)}</p>`;
  h += `</div>`;
  const anderen = (S.ss.po || []).filter(p => p.hoog !== S.sp.club && p.laag !== S.sp.club).map(p => ({h:p.hoog, u:p.laag, gh:p.gh, gu:p.gu, pen:p.pen, w:p.w}));
  if (anderen.length) h += `<div class="krantblok"><span class="label">Ook in de nacompetitie</span>${vBekerUitslagen(anderen)}</div>`;
  return h + vLog() + knop(M.po.soort === 'halve' && goed ? 'Naar de finale van de play-offs' : 'Seizoen afsluiten', naNacompetitie);
}
