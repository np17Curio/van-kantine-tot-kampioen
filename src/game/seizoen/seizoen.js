import { hoogtepunt } from '../speler/hoogtepunten.js';
import { spelerVanHetSeizoen } from './verkiezing.js';
import { S, club, gemCijfer, mod, ovr, seizoenLabel } from '../../core/state.js';
import { clamp, rnd } from '../../core/utils.js';
import { CLUBS, DIVS, LAAGSTE, POS, WINTER } from '../../data/gegevens.js';
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
import { ontwikkelLanden } from '../competitie/landsterkte.js';
import { rivaalOuder, rivaalSeizoen } from '../speler/rivaal.js';
import { magAfscheid, maakAfscheid } from './afscheidswedstrijd.js';
import { vriendOuder, vriendSeizoen } from '../speler/journey.js';
import { galaReacties, goudenBalWinst } from './gouden-bal-winst.js';
import { historieSeizoen } from './historie.js';
import { groeiJaar } from '../speler/lichaam.js';
import { thuisLand } from '../../data/landen.js';
import { ik } from '../../core/geslacht.js';
import { eersteClubBod } from '../transfers/transfers.js';
import { clubInfo } from '../transfers/buitenland.js';
import { ZWAAR } from '../speler/blessures.js';
import { herstelRecords, recordsSeizoenEinde } from './records.js';

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

// Een clubwissel midden in het seizoen: bewaar wat je bij je oude club haalde (voor het overzicht aan het einde)
export function seizoenDeel(){
  const sp = S.sp; if (!S.ss || !(S.ronde > 0) || sp.clubloos || (S.venster && S.venster.soort === 'zomer' && S.fase === 'venster')) return;
  const c = club(); (S.ss.delen = S.ss.delen || []).push({club:c.n, id:sp.club, div:DIVS[c.t], land:thuisLand(), wed:S.ss.wed, g:S.ss.g, a:S.ss.a, c:S.ss.c.length});
}
// Je seizoen per club (bij een wissel in de winter): het laatste deel is je huidige club
function seizoenDelen(huidig, div = DIVS[club().t]){
  const l = (S.ss.delen || []).concat([{club:huidig, div, wed:S.ss.wed, g:S.ss.g, a:S.ss.a, c:S.ss.c.length}]);
  return l.map((d, i) => { const v = i ? l[i - 1] : {wed:0, g:0, a:0, c:0}, cs = S.ss.c.slice(v.c, d.c);
    return {club:d.club, div:d.div, wed:d.wed - v.wed, g:d.g - v.g, a:d.a - v.a, gem:cs.length ? Math.round(cs.reduce((x, y) => x + y, 0) / cs.length * 10) / 10 : null}; }).filter((d, i, a) => i === a.length - 1 || d.wed > 0);
}
// Oude opslag: een overstap in de winter van vóór seizoenDeel. Zolang het seizoen nog in het geheugen staat (tot het nieuwe seizoen begint),
// wordt het achteraf gesplitst: je wedstrijden na de winterstop zijn van je nieuwe club, je goals daar staan in de topscorerslijst
export function herstelSeizoenDelen(){
  herstelRecords(); // (en een competitierecord uit het oude, vaste record dat niet klopte)
  const sp = S && S.sp, cl = S && S.car && S.car.clubs; if (!sp || !S.ss || S.ss.delen || S.ss.delenOk || !cl || cl.length < 2) return;
  S.ss.delenOk = true;
  const nieuw = cl[cl.length - 1], oud = cl[cl.length - 2]; if (nieuw.van !== S.jaar || sp.club !== nieuw.club || !(S.ronde >= WINTER)) return;
  const wed = (S.ss.uitslagen || []).filter((u, i) => u && u.mee && i >= WINTER).length;
  let g = 0, a = 0; for (const x of Object.values(S.ss.st || {})) if (x.jij && x.club === sp.club){ g += x.g; a += x.a; }
  if (wed > S.ss.wed || g > S.ss.g || a > S.ss.a || wed === S.ss.wed) return; // (klopt niet, of je speelde alleen bij je nieuwe club)
  const oc = clubInfo({club:oud.club, ...(oud.land && oud.land !== thuisLand() ? {land:oud.land} : {})});
  S.ss.delen = [{club:oud.n || (oc && oc.n) || 'je vorige club', div:oc && oc.t >= 1 ? (oc.div || DIVS[oc.t]) : '', land:oud.land, wed:S.ss.wed - wed, g:S.ss.g - g, a:S.ss.a - a, c:Math.max(0, S.ss.c.length - wed)}];
  // Het seizoen is al afgelopen: het overzicht, je geschiedenis en "seizoen voor seizoen" ook bijwerken
  const E = S.eind; if (!E || E.delen || E.clubloos) return;
  const delen = seizoenDelen(E.clubNaam, E.divisie), nu = delen[delen.length - 1], eerder = delen.slice(0, -1); if (!eerder.length) return;
  E.delen = delen;
  const lbl = seizoenLabel(), h = S.car.hist, hi = h.findIndex(x => x.startsWith(`${lbl}: ${E.plek}e met ${E.clubNaam} · `));
  if (hi >= 0) h[hi] = `${lbl}: ${E.plek}e met ${E.clubNaam} · ${nu.wed} wedstrijden, ${nu.g} goals, ${nu.a} assists (daarvoor ${eerder.map(d => `${d.wed} wedstrijden, ${d.g} goals, ${d.a} assists bij ${d.club}`).join('; ')})`;
  const sz = S.car.seizoenen || [], ri = sz.findIndex(x => x.s === lbl && x.club === E.clubNaam && !x.deel);
  if (ri >= 0){ const r = sz[ri]; Object.assign(r, {wed:nu.wed + (S.ss.bw || 0), g:nu.g + (S.ss.bg || 0), a:nu.a + (S.ss.ba || 0), gem:nu.gem});
    sz.splice(ri, 0, ...eerder.map(d => ({s:lbl, club:d.club, div:d.div, wed:d.wed, g:d.g, a:d.a, nul:0, gem:d.gem, plek:null, beker:null, deel:true}))); }
}
export function seizoenEinde(){
  const wacht0 = (S.krantWacht || []).length; // (berichten die bij het seizoenseinde ontstaan: hieronder in de eindkrant)
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
  recordsSeizoenEinde(); // (een topscorer met meer goals dan het record: die is nu de recordhouder)
  S.ss.topscorer = kop && !kop.jij ? `${metVoorletter(kop)} (${CLUBS[kop.club].n}) met ${kop.g} goals` : null;
  // Speler van het Seizoen: een verkiezing onder alle spelers van de competitie (niet alleen een drempel op je cijfer)
  const svs = spelerVanHetSeizoen(t, gem);
  if (svs.winnaar && svs.winnaar.jij) prijzen.push(`Speler van het Seizoen ${seizoenLabel()}`);
  if ((S.ss.goed || 0) >= 5) prijzen.push(`Maatschappelijk betrokken speler ${seizoenLabel()}`);
  const gb = goudenBal(gem);
  if (gb.telt && gb.plek === 1){ prijzen.push(`Gouden Bal ${seizoenLabel()}`); mod('rep', 10); mod('moraal', 15); S.car.hist.push(`${seizoenLabel()}: Gouden Bal gewonnen, beste speler van de wereld!`); S.gbWinst = true; }
  else if (gb.telt && gb.plek <= 3) S.car.hist.push(`${seizoenLabel()}: ${gb.plek}e bij de verkiezing van de Gouden Bal`);
  S.car.prijzen.push(...prijzen);
  if (plek === 1){ mod('rep', 8); mod('moraal', 10); }
  if (!los){ sp.clubSz++; statusPunten(3 + (plek === 1 ? 8 : 0) + prijzen.length * 2); }
  const statusTekst = los ? null : checkStatus();
  const delen = seizoenDelen(los ? 'Zonder club' : club().n), nu = delen[delen.length - 1], eerder = delen.slice(0, -1);
  const eerderTxt = eerder.length ? ` (daarvoor ${eerder.map(d => `${d.wed} wedstrijden, ${d.g} goals, ${d.a} assists bij ${d.club}`).join('; ')})` : '';
  S.car.hist.push(los ? `${seizoenLabel()}: seizoen zonder club${S.ss.wed ? ` (${S.ss.wed} wedstrijden, ${S.ss.g} goals, ${S.ss.a} assists)` : ''}` : `${seizoenLabel()}: ${plek}e met ${club().n} · ${nu.wed} wedstrijden, ${nu.g} goals, ${nu.a} assists${eerderTxt}`);
  const wissels = bepaalPromotie(), mijnWissel = los ? null : wissels.find(w => w.id === sp.club);
  if (mijnWissel && mijnWissel.naar < mijnWissel.van) prijzen.push(`Promotie naar de ${DIVS[mijnWissel.naar]}${mijnWissel.po ? ' via de nacompetitie' : ''} ${seizoenLabel()}`);
  // hoogtepunten pas bij de eindstand: echt kampioen (de eerste titel), of gepromoveerd zonder titel (als nummer 2, 3 of via de nacompetitie)
  if (!los && plek === 1) hoogtepunt('eersteTitel', {club:club().n, div:DIVS[t]});
  else if (mijnWissel && mijnWissel.naar < mijnWissel.van) hoogtepunt('promotie', {club:club().n, plek, naar:DIVS[mijnWissel.naar], po:!!mijnWissel.po}, true);
  if (mijnWissel && !mijnWissel.po) S.car.hist.push(`${seizoenLabel()}: ${mijnWissel.naar < mijnWissel.van ? 'gepromoveerd' : 'gedegradeerd'} met ${club().n} naar de ${DIVS[mijnWissel.naar]}`);
  // Seizoen voor seizoen: een rij per club (bij een wissel in de winter: de oude club "tot de winter"; de beker telt bij je huidige club)
  for (const d of eerder) (S.car.seizoenen = S.car.seizoenen || []).push({s:seizoenLabel(), club:d.club, div:d.div, wed:d.wed, g:d.g, a:d.a, nul:0, gem:d.gem, plek:null, beker:null, deel:true});
  (S.car.seizoenen = S.car.seizoenen || []).push({s:seizoenLabel(), club:los ? 'Zonder club' : club().n, div:DIVS[t], wed:nu.wed + (S.ss.bw || 0), g:nu.g + (S.ss.bg || 0), a:nu.a + (S.ss.ba || 0), nul:S.ss.cs || 0, gem: eerder.length ? nu.gem : gem === null ? null : Math.round(gem * 10) / 10, plek, beker:los ? null : bekerResultaat(sp.club)});
  const gbWon = S.gbWinst; S.gbWinst = false;
  S.eind = {clubloos:los, gb, plek, t, divisie:DIVS[t], clubNaam:los ? 'Zonder club' : club().n, prijzen, delen:eerder.length ? delen : null, wed:S.ss.wed, g:S.ss.g, a:S.ss.a, gem, statusTekst, topscorer:S.ss.topscorer, svs:{naam:svs.winnaar && svs.winnaar.naam, club:svs.winnaar && svs.winnaar.club, jij:!!(svs.winnaar && svs.winnaar.jij), plek:svs.plek, reden:svs.reden}, wissels, mijnWissel, po:los ? null : [...(S.ss.po || [])].reverse().find(p => p.hoog === sp.club || p.laag === sp.club) || null, poAlle:S.ss.po || [], toernooi:toernooiSelectie()};
  if (gbWon) goudenBalWinst(); // het gala en de gevolgen
  // De krant: bij Speler van het Seizoen en topscorer een foto van jou met de prijs
  const bron = KRANTEN[t], krant = [], wanneer = `einde seizoen ${seizoenLabel()}`;
  if (S.eind.svs.jij) krant.push({bron:bron[0], kop:`${sp.naam} is de Speler van het Seizoen`, tekst:`De ${DIVS[t]} kiest ${sp.naam} van ${club().n} als beste speler: ${S.ss.g} goals, ${S.ss.a} assists${gem !== null ? ` en gemiddeld een ${gem.toFixed(1).replace('.', ',')}` : ''}.`, wanneer, foto:fotoVan('svs', `${sp.naam} met de bokaal voor Speler van het Seizoen.`)});
  if (ik && ik.g > 0 && ik.g >= rs[0].g) krant.push({bron:bron[1 % bron.length], kop:`Gouden Schoen voor ${sp.naam}`, tekst:`Met ${ik.g} goals is ${sp.naam} de topscorer van de ${DIVS[t]}. Niemand scoorde vaker.`, wanneer, foto:fotoVan('topscorer', `Topscorer ${sp.naam} met de Gouden Schoen.`)});
  historieSeizoen(); // kampioenen en bekerwinnaars in de clubhistorie
  vriendSeizoen(); // de cijfers van je jeugdvriend bij zijn carrière
  const rv = rivaalSeizoen(); if (rv){ S.eind.rivaal = rv; for (const x of [rv, ...(rv.overig || [])]){ krant.push({bron:bron[0], kop:x.kop, tekst:x.tekst, wanneer}); if (x.prijs){ S.car.prijzen.push(x.prijs); S.eind.prijzen.push(x.prijs); } } } // (ook de races met je andere rivalen)
  for (const k of europaKrant(wissels).slice(0, 3)) krant.push({bron:KRANTEN[0][0], kop:k.kop, tekst:k.tekst, wanneer});
  for (const k of ontwikkelLanden().slice(0, 2)) krant.push({bron:KRANTEN[0][0], kop:k.kop, tekst:k.tekst, wanneer}); // de landen worden sterker of zwakker
  // Wat bij het seizoenseinde via krantMelding binnenkwam (de Gouden Bal, een standbeeld, een nieuw competitierecord) hoort op dit
  // scherm, niet pas in de eerste week van het volgende seizoen
  const vers = (S.krantWacht || []).splice(wacht0).map(k => ({...k, wanneer}));
  krant.unshift(...vers);
  S.eind.krant = krant; S.nieuws = krant.concat((S.nieuws || []).filter(x => !vers.some(k => k.kop === x.kop))).slice(0, 12);
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
  const vg = vriendOuder(); if (vg) S.eind.ontw.push(vg); // en je jeugdvriend ook
  const gr = groeiJaar(sp); if (gr) S.eind.ontw.push(gr); // je groeit nog, tot je 23e
  if (tal) S.eind.ontw.unshift(tal);
  sp.potSz = 0;
  S.eind.ontw.push(...seizoenGeld());
  sp.sponsors = (sp.sponsors || []).filter(d => { if (d.levenslang) return true; d.jaren--; if (d.jaren <= 0){ S.eind.ontw.push(`Je contract met ${d.merk} loopt af.`); return false; } return true; });
  if (sp.leeftijd === 18 && sp.school && sp.school.cijfers.length){
    const g = gemiddelde(sp.school.cijfers.map(x => x.c));
    if (g >= 5.5){ S.eind.ontw.push(`Je bent 18 en hebt je diploma gehaald, met gemiddeld een ${fmt1(g)}! Nu kun je je helemaal op voetbal richten.`); S.car.prijzen.push(`Schooldiploma (gemiddeld ${fmt1(g)})`); S.car.hist.push(`${seizoenLabel()}: diploma gehaald`); mod('moraal', 10); }
    else { S.eind.ontw.push(`Je bent 18, maar je bent gezakt voor je examen (gemiddeld ${fmt1(g)}). Je stopt met school en gaat vol voor het voetbal.`); S.car.hist.push(`${seizoenLabel()}: gezakt voor het examen`); mod('moraal', -5); }
    sp.ouders.boos = false;
  }
  if (!sp.clubloos) sp.contract--;
  sp.rep = clamp(sp.rep * .92, 0, 100);
  // Een zware blessure loopt door in de zomer (8 weken herstel), een lichte is dan over
  const bs = sp.blesSoort, blesVoor = sp.blessure || 0;
  sp.blessure = Math.max(0, blesVoor - 8);
  if (blesVoor > 0 && bs){
    if (sp.blessure > 0){ bs.zomer = true; S.eind.ontw.push(`Je revalideert de hele zomer door: nog ${sp.blessure} ${sp.blessure === 1 ? 'week' : 'weken'} tot je terug bent.`); }
    else if (bs.wk >= ZWAAR) S.eind.ontw.push(`Je bent in de zomer hersteld van je ${bs.kort}blessure. Het nieuwe seizoen begin je weer fit.`);
  }
  if (!sp.blessure) sp.blesSoort = null; sp.fit = 95;
  // Promotie en degradatie gaan nu in: de nieuwe competities beginnen met een lege stand
  S.vorig = {}; for (let t = 1; t <= LAAGSTE; t++) stand(t).forEach((id, i) => { S.vorig[id] = {t, plek:i + 1}; });
  if (S.eind.wissels){
    // de topscorerslijst van dit seizoen bewaren (met de divisie van toen): in de zomer laat de competitie die nog zien
    S.vorigeSt = {s:seizoenLabel(), st:Object.fromEntries(Object.entries(S.ss.st || {}).map(([k, x]) => [k, {...x, t:CLUBS[x.club] ? CLUBS[x.club].t : null}]))};
    voerPromotieUit(S.eind.wissels); S.tab = nieuweTabellen(); S.ss.st = {}; S.ss.res = {}; }
  if (sp.laatsteSeizoen){ const c0 = S.car.clubs[0], thuis = c0 && c0.club === sp.club && (c0.land || 'Nederland') === thuisLand();
    return stoppen(`Je laatste seizoen zit erop${thuis ? `, bij ${club().n}, waar het allemaal begon` : ''}. Je hangt je schoenen aan de wilgen.`); }
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
  galaReacties(); // reacties op je Gouden Bal
}
// Je stopt na nog één seizoen. In de zomertransferperiode belt je eerste club (transfers.js)
export function kondigAfscheidAan(){
  const sp = S.sp; if (sp.laatsteSeizoen) return;
  sp.laatsteSeizoen = true; S.car.hist.push(`${seizoenLabel()}: ${sp.naam} kondigt aan dat komend seizoen ${ik.zijn} laatste wordt`);
  krantMelding(`${sp.naam} kondigt afscheid aan`, `Op ${ik.zijn} ${sp.leeftijd}e is het bijna klaar: "Komend seizoen is mijn laatste. Ik wil nog één keer alles geven."`, KRANTEN[0]);
  // al in de transferperiode: het bod van je eerste club komt er meteen bij
  const V = S.venster, eb = V && V.soort === 'zomer' && S.fase === 'venster' ? eersteClubBod() : null;
  if (eb){ V.bods = V.bods.filter(b => !(b.club === eb.club && (b.land || null) === (eb.land || null))); V.bods.unshift(eb); V.melding = `Je telefoon gaat: ${clubInfo(eb).n} wil dat je je laatste seizoen bij hen speelt, waar het allemaal begon. Wel voor een fractie van je salaris.`; }
}
export function stoppen(reden){
  S.einde = {reden};
  // levenslange contracten: na je carrière blijven ze betalen (5 jaar de helft, in één keer)
  for (const d of (S.sp.sponsors || []).filter(d => d.levenslang)){ const b = Math.round(d.bedrag * 2.5 / 1000) * 1000; S.sp.geld += b; S.car.hist.push(`${S.jaar}: ${d.merk} blijft je levenslang betalen (nu ${Math.round(b / 1000)}k in één keer)`); }
  S.car.hist.push(`${S.jaar}: einde carrière`);
  S.einde.eer = afscheid();
  S.fase = 'einde';
  // Een clublegende krijgt een afscheidswedstrijd: zijn club tegen oud-ploeggenoten van al zijn clubs
  if (magAfscheid()){ S.afscheidWed = maakAfscheid(); S.fase = 'afscheid'; }
}
