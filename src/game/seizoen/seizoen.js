import { spelerVanHetSeizoen } from './verkiezing.js';
import { S, club, gemCijfer, mod, ovr, seizoenLabel } from '../../core/state.js';
import { clamp, rnd } from '../../core/utils.js';
import { CLUBS, DIVS, LAAGSTE, POS } from '../../data/gegevens.js';
import { bekerResultaat, nieuweBekers } from '../competitie/beker.js';
import { stand } from '../competitie/spelers.js';
import { toernooiSelectie } from '../interlands/toernooi.js';
import { KRANTEN, fotoVan, metVoorletter, ranglijst } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { seizoenGeld } from '../prive/buiten-week.js';
import { afscheid } from './afscheid.js';
import { goudenBal } from './gouden-bal.js';
import { bepaalPromotie, voerPromotieUit } from './kampioen.js';
import { fmt1, gemiddelde } from '../speler/o23.js';
import { checkStatus, nieuweTabellen, statusPunten } from '../speler/status.js';
import { nieuweWeek, verhoog } from '../week.js';
import { talentSeizoen } from '../speler/talent.js';
import { doelInfo } from '../transfers/zaakwaarnemer.js';
import { europaKrant } from '../competitie/europa.js';
import { rivaalOuder, rivaalSeizoen } from '../speler/rivaal.js';
import { magAfscheid, maakAfscheid } from './afscheidswedstrijd.js';

/* ===================== Seizoen ===================== */
export function ontwikkel(){
  const sp = S.sp, w = POS[sp.pos].w, keys = Object.keys(w), tekst = [];
  const verdeel = n => { for (let i = 0; i < n; i++){ let r = rnd(), k = keys[0]; for (const kk of keys){ r -= w[kk]; if (r <= 0){ k = kk; break; } } if (ovr(sp) < sp.pot + 3) verhoog(k, 1); } };
  const voor = ovr(sp);
  if (sp.leeftijd <= 18) verdeel(4);
  else if (sp.leeftijd <= 21) verdeel(3);
  else if (sp.leeftijd <= 27) verdeel(2);
  else if (sp.leeftijd >= 31 && sp.leeftijd <= 33){ verhoog('cond', sp.items.kok ? -1 : -2); verhoog('drib', -1); }
  else if (sp.leeftijd >= 34){ verhoog('cond', sp.items.kok ? -2 : -3); verhoog('drib', -2); verhoog('afw', -1); verhoog('pas', -1); verhoog('verd', -1); }
  const na = ovr(sp);
  if (na > voor) tekst.push(`Je ontwikkelt je verder: klasse ${voor} → ${na}.`);
  else if (na < voor) tekst.push(`De jaren gaan tellen: klasse ${voor} → ${na}.`);
  else tekst.push(`Je klasse blijft ${na}.`);
  return tekst;
}

export function seizoenEinde(){
  const sp = S.sp, los = !!sp.clubloos, t = club().t, st = stand(t), plek = los ? 0 : st.indexOf(sp.club) + 1;
  const gem = gemCijfer();
  const prijzen = [];
  if (plek === 1) prijzen.push(`Kampioen ${DIVS[t]} ${seizoenLabel()}`);
  // Topscorer en assistkoning: echt de meeste van de hele competitie
  const rs = ranglijst(t, 'g'), ra = ranglijst(t, 'a'), ik = rs.find(x => x.jij);
  if (ik && ik.g > 0 && ik.g >= rs[0].g) prijzen.push(`Topscorer ${DIVS[t]} ${seizoenLabel()} (${ik.g} goals)`);
  const ika = ra.find(x => x.jij);
  if (ika && ika.a > 0 && ika.a >= ra[0].a) prijzen.push(`Assistkoning ${DIVS[t]} ${seizoenLabel()} (${ika.a} assists)`);
  const kop = rs[0];
  S.ss.topscorer = kop && !kop.jij ? `${metVoorletter(kop)} (${CLUBS[kop.club].n}) met ${kop.g} goals` : null;
  // Speler van het Seizoen: een verkiezing onder alle spelers van de competitie (niet alleen een drempel op je cijfer)
  const svs = spelerVanHetSeizoen(t, gem);
  if (svs.winnaar && svs.winnaar.jij) prijzen.push(`Speler van het Seizoen ${seizoenLabel()}`);
  if ((S.ss.goed || 0) >= 5) prijzen.push(`Maatschappelijk betrokken speler ${seizoenLabel()}`);
  const gb = goudenBal(gem);
  if (gb.telt && gb.plek === 1){ prijzen.push(`Gouden Bal ${seizoenLabel()}`); mod('rep', 10); mod('moraal', 15); S.car.hist.push(`${seizoenLabel()}: Gouden Bal gewonnen, beste speler van de wereld!`); krantMelding(`${sp.naam} wint de Gouden Bal!`, 'De beste speler van de wereld. Een droom die uitkomt voor de jongen uit de kantine.', KRANTEN[0]); }
  else if (gb.telt && gb.plek <= 3) S.car.hist.push(`${seizoenLabel()}: ${gb.plek}e bij de verkiezing van de Gouden Bal`);
  S.car.prijzen.push(...prijzen);
  if (plek === 1){ mod('rep', 8); mod('moraal', 10); }
  if (!los){ sp.clubSz++; statusPunten(3 + (plek === 1 ? 8 : 0) + prijzen.length * 2); }
  const statusTekst = los ? null : checkStatus();
  S.car.hist.push(los ? `${seizoenLabel()}: seizoen zonder club${S.ss.wed ? ` (${S.ss.wed} wedstrijden, ${S.ss.g} goals, ${S.ss.a} assists)` : ''}` : `${seizoenLabel()}: ${plek}e met ${club().n} · ${S.ss.wed} wedstrijden, ${S.ss.g} goals, ${S.ss.a} assists`);
  const wissels = bepaalPromotie(), mijnWissel = los ? null : wissels.find(w => w.id === sp.club);
  if (mijnWissel && mijnWissel.naar < mijnWissel.van) prijzen.push(`Promotie naar de ${DIVS[mijnWissel.naar]}${mijnWissel.po ? ' via de nacompetitie' : ''} ${seizoenLabel()}`);
  if (mijnWissel && !mijnWissel.po) S.car.hist.push(`${seizoenLabel()}: ${mijnWissel.naar < mijnWissel.van ? 'gepromoveerd' : 'gedegradeerd'} met ${club().n} naar de ${DIVS[mijnWissel.naar]}`);
  (S.car.seizoenen = S.car.seizoenen || []).push({s:seizoenLabel(), club:los ? 'Zonder club' : club().n, div:DIVS[t], wed:S.ss.wed + (S.ss.bw || 0), g:S.ss.g + (S.ss.bg || 0), a:S.ss.a + (S.ss.ba || 0), gem: gem === null ? null : Math.round(gem * 10) / 10, plek, beker:los ? null : bekerResultaat(sp.club)});
  S.eind = {clubloos:los, gb, plek, t, divisie:DIVS[t], clubNaam:los ? 'Zonder club' : club().n, prijzen, wed:S.ss.wed, g:S.ss.g, a:S.ss.a, gem, statusTekst, topscorer:S.ss.topscorer, svs:{naam:svs.winnaar && svs.winnaar.naam, club:svs.winnaar && svs.winnaar.club, jij:!!(svs.winnaar && svs.winnaar.jij), plek:svs.plek, reden:svs.reden}, wissels, mijnWissel, po:los ? null : [...(S.ss.po || [])].reverse().find(p => p.hoog === sp.club || p.laag === sp.club) || null, poAlle:S.ss.po || [], toernooi:toernooiSelectie()};
  // De krant: bij Speler van het Seizoen en topscorer een foto van jou met de prijs
  const bron = KRANTEN[t], krant = [], wanneer = `einde seizoen ${seizoenLabel()}`;
  if (S.eind.svs.jij) krant.push({bron:bron[0], kop:`${sp.naam} is de Speler van het Seizoen`, tekst:`De ${DIVS[t]} kiest ${sp.naam} van ${club().n} als beste speler: ${S.ss.g} goals, ${S.ss.a} assists${gem !== null ? ` en gemiddeld een ${gem.toFixed(1).replace('.', ',')}` : ''}.`, wanneer, foto:fotoVan('svs', `${sp.naam} met de bokaal voor Speler van het Seizoen.`)});
  if (ik && ik.g > 0 && ik.g >= rs[0].g) krant.push({bron:bron[1 % bron.length], kop:`Gouden Schoen voor ${sp.naam}`, tekst:`Met ${ik.g} goals is ${sp.naam} de topscorer van de ${DIVS[t]}. Niemand scoorde vaker.`, wanneer, foto:fotoVan('topscorer', `Topscorer ${sp.naam} met de Gouden Schoen.`)});
  const rv = rivaalSeizoen(); if (rv){ krant.push({bron:bron[0], kop:rv.kop, tekst:rv.tekst, wanneer}); S.eind.rivaal = rv; if (rv.prijs){ S.car.prijzen.push(rv.prijs); S.eind.prijzen.push(rv.prijs); } }
  for (const k of europaKrant(wissels).slice(0, 3)) krant.push({bron:KRANTEN[0][0], kop:k.kop, tekst:k.tekst, wanneer});
  S.eind.krant = krant; S.nieuws = krant.concat(S.nieuws || []).slice(0, 6);
  S.fase = 'seizoenEinde';
}
export function naSeizoen(){
  const sp = S.sp;
  S.vorigGem = gemCijfer() ?? S.vorigGem;
  sp.leeftijd++;
  sp.ovrVorig = ovr(sp); // voor de trend in het teamoverzicht
  // Eerst het talent bijstellen (sterk seizoen, prijzen), zodat de groei van dit jaar al onder het nieuwe plafond valt
  const tal = talentSeizoen(S.eind.gem, S.eind.prijzen.length + (S.eind.svs.jij ? 1 : 0));
  S.eind.ontw = ontwikkel();
  rivaalOuder(ovr(sp) - sp.ovrVorig); // je rivaal groeit (of zakt) net als jij
  if (tal) S.eind.ontw.unshift(tal);
  sp.potSz = 0;
  S.eind.ontw.push(...seizoenGeld());
  sp.sponsors = (sp.sponsors || []).filter(d => { d.jaren--; if (d.jaren <= 0){ S.eind.ontw.push(`Je contract met ${d.merk} loopt af.`); return false; } return true; });
  if (sp.leeftijd === 18 && sp.school && sp.school.cijfers.length){
    const g = gemiddelde(sp.school.cijfers.map(x => x.c));
    if (g >= 5.5){ S.eind.ontw.push(`Je bent 18 en hebt je diploma gehaald, met gemiddeld een ${fmt1(g)}! Nu kun je je helemaal op voetbal richten.`); S.car.prijzen.push(`Schooldiploma (gemiddeld ${fmt1(g)})`); S.car.hist.push(`${seizoenLabel()}: diploma gehaald`); mod('moraal', 10); }
    else { S.eind.ontw.push(`Je bent 18, maar je bent gezakt voor je examen (gemiddeld ${fmt1(g)}). Je stopt met school en gaat vol voor het voetbal.`); S.car.hist.push(`${seizoenLabel()}: gezakt voor het examen`); mod('moraal', -5); }
    sp.ouders.boos = false;
  }
  if (!sp.clubloos) sp.contract--;
  sp.rep = clamp(sp.rep * .92, 0, 100);
  sp.blessure = 0; sp.fit = 95;
  // Promotie en degradatie gaan nu in: de nieuwe competities beginnen met een lege stand
  S.vorig = {}; for (let t = 1; t <= LAAGSTE; t++) stand(t).forEach((id, i) => { S.vorig[id] = {t, plek:i + 1}; });
  if (S.eind.wissels){ voerPromotieUit(S.eind.wissels); S.tab = nieuweTabellen(); S.ss.st = {}; S.ss.res = {}; }
  if (sp.leeftijd >= 35) return stoppen('Op je 35e hang je de schoenen aan de wilgen. Je lichaam zegt: genoeg.');
  S.fase = 'ontwikkeling';
}
export function startNieuwSeizoen(){
  S.jaar++; S.ronde = 0; S.tab = nieuweTabellen(); S.ss = {wed:0, g:0, a:0, c:[], bods:0};
  S.ss.bekers = nieuweBekers();
  const ag = S.sp.agent;
  if (ag && ag.doel != null && !ag.gehaald) ag.antwoord = `Nieuw seizoen. Voor ${doelInfo().n} begint de teller weer bij nul: laat het opnieuw zien.`;
  S.eind = null;
  nieuweWeek(true);
}
export function stoppen(reden){
  S.einde = {reden};
  S.car.hist.push(`${S.jaar}: einde carrière`);
  S.einde.eer = afscheid();
  S.fase = 'einde';
  // Een clublegende krijgt een afscheidswedstrijd: zijn club tegen oud-ploeggenoten van al zijn clubs
  if (magAfscheid()){ S.afscheidWed = maakAfscheid(); S.fase = 'afscheid'; }
}
