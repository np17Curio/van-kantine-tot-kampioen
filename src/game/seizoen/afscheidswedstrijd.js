import { S, club, mod, ovr, seizoenLabel } from '../../core/state.js';
import { CLUBS } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { selectie } from '../competitie/spelers.js';
import { krantMelding } from '../media/roddel.js';
import { kinderen } from '../prive/gezin.js';
import { rivaal, rivaalNaam } from '../speler/rivaal.js';
import { ck } from '../transfers/buitenland.js';
import { oudeClubs } from '../wedstrijd/reunie.js';

/* ===================== Afscheidswedstrijd van een clublegende ===================== */
// Je club tegen "Vrienden van ...": oud-teamgenoten van al je vorige clubs (en misschien je rivaal).
// De eerste helft speel je bij je club, de tweede helft bij je vrienden. Een feest, geen competitiewedstrijd:
// er verandert niets aan uitslagen, standen of statistieken.
const VULLING = ['je oude jeugdtrainer', 'een oud-ploeggenoot uit de O23', 'je eerste aanvoerder', 'de kitman van je eerste club', 'je beste vriend van vroeger', 'je oude buurjongen'];
// Iedereen die stopt krijgt er een (eerst alleen een clublegende van zijn huidige club: dat was na een late transfer
// bijna niemand meer). Zonder club: bij je laatste club in dit land. Een clublegende krijgt het grote feest.
function afscheidClub(){
  const sp = S.sp; if (!sp.clubloos && sp.club != null && CLUBS[sp.club]) return sp.club;
  const l = ((S.car && S.car.clubs) || []).filter(x => !x.huur && (x.land || thuisLand()) === thuisLand() && CLUBS[x.club]);
  return l.length ? l[l.length - 1].club : null;
}
export const magAfscheid = () => { const sp = S.sp; return !!(sp && !S.trainer && !S.eigenaar && !S.analist && afscheidClub() != null); };
const kans = () => clamp(.55 + (ovr(S.sp) - 60) / 100, .4, .85);
export function maakAfscheid(){
  const sp = S.sp, id = afscheidClub(), c = CLUBS[id], hier = id === sp.club && !sp.clubloos, rel = hier && sp.kleed && sp.kleed.club === ck(sp.club) ? sp.kleed.rel : {};
  const legende = hier ? !!sp.legendeHier : (S.car.prijzen || []).includes(`Clublegende van ${c.n}`);
  const team = selectie(id).slice().sort((a, b) => (rel[b.n] ?? 50) - (rel[a.n] ?? 50)).slice(0, 8).map(x => ({n:x.n}));
  const vrienden = [];
  for (const o of Object.values(oudeClubs())){
    if (!o || !o.rel) continue;
    Object.entries(o.rel).filter(([, b]) => b >= 55).sort((a, b) => b[1] - a[1]).slice(0, 2).forEach(([n]) => vrienden.push({n, club:o.n}));
  }
  const R = rivaal(), rivMee = !!(R && (R.band ?? -20) >= 20);
  if (rivMee) vrienden.unshift({n:rivaalNaam(), club:'je rivaal', rivaal:true});
  let v = 0; while (vrienden.length < 6) vrienden.push({n:VULLING[v++ % VULLING.length], club:''});
  const kids = kinderen().filter(k => S.jaar - k.jaar >= 4);
  return {club:c.n, clubId:id, legende, hier, team, vrienden:vrienden.slice(0, 11), rivaal:R ? {naam:rivaalNaam(), mee:rivMee} : null, kind:kids.length ? pick(kids).naam : null,
    stap:0, wij:0, zij:0, goals:0, log:[], min:0};
}
// Wat er bij elke stap te kiezen is
export function afscheidKeuzes(){
  const A = S.afscheidWed; if (!A) return [];
  if (A.stap === 0) return [{l:'Aftrappen!', s:'De laatste wedstrijd van je carrière'}, {l:'Geen afscheidswedstrijd, ik stop in stilte', s:'Meteen naar het einde'}];
  if (A.stap === 1) return [{l:'Stiften', s:'Een mooie afsluiter'}, {l:'Hard schieten', s:'Zoals vroeger'}, {l:'Panna door de benen van de keeper', s:'Voor de show'}];
  if (A.stap === 2) return [{l:'Een rondje langs het publiek', s:'De supporters bedanken'}, {l:'Je oude maatjes omhelzen', s:'Herinneringen ophalen'}];
  if (A.stap === 3){ const beste = A.vrienden.find(x => !x.rivaal && x.club) || A.vrienden[0];
    return [{l:'Zelf nemen', s:'Natuurlijk'}, ...(A.kind ? [{l:`${A.kind} laten nemen`, s:'Je kind op het veld'}] : []), {l:`${beste.n} laten nemen`, s:beste.club ? `je oud-ploeggenoot van ${beste.club}` : 'een oude vriend'}, ...(A.rivaal && A.rivaal.mee ? [{l:`Je rivaal ${A.rivaal.naam} laten nemen`, s:'Een gebaar van respect'}] : [])]; }
  if (A.stap === 4) return [{l:'Een emotionele toespraak', s:'Geen droog oog in het stadion'}, {l:'Een grap maken', s:'Iedereen lacht'}, {l:'Kort en krachtig', s:'"Bedankt voor alles."'}];
  return [];
}
const regel = (A, m, t, k = '') => A.log.push({m:m ? m + "'" : '', t, k});
// Doelpunten van de anderen in een helft
// (op volgorde van de minuut, en vóór het fluitsignaal)
function helft(A, tot){
  const n = () => randInt(0, 1) + (rnd() < .2 ? 1 : 0), goals = [];
  for (let i = n(); i > 0; i--) goals.push({min:randInt(A.min + 1, tot - 1), wij:true});
  for (let i = n(); i > 0; i--) goals.push({min:randInt(A.min + 1, tot - 1), wij:false});
  goals.sort((a, b) => a.min - b.min).forEach(g => {
    if (g.wij){ A.wij++; regel(A, g.min, `Goal voor ${A.club}! ${pick(A.team).n} scoort. ${A.wij}-${A.zij}`, 'goal'); }
    else { A.zij++; const v = pick(A.vrienden).n; regel(A, g.min, `Goal voor de Vrienden! ${v.charAt(0).toUpperCase() + v.slice(1)} scoort. ${A.wij}-${A.zij}`, 'goal'); }
  });
  A.min = tot;
}
export function afscheidStap(i){
  const A = S.afscheidWed, sp = S.sp; if (!A) return;
  const opts = afscheidKeuzes(), o = opts[i]; if (!o) return;
  if (A.stap === 0){
    if (i === 1) return afscheidOverslaan();
    regel(A, 1, `Het stadion van ${A.club} is uitverkocht. Overal spandoeken: "Bedankt ${sp.naam}". Je loopt als laatste het veld op.`, 'info');
    if (A.rivaal) regel(A, 1, A.rivaal.mee ? `Zelfs je rivaal ${A.rivaal.naam} is er. Hij geeft je een stevige hand: "Zonder jou was ik nooit zo goed geworden."` : `Je rivaal ${A.rivaal.naam} kon er niet bij zijn, maar stuurt een filmpje dat op het grote scherm wordt getoond.`, 'info');
    A.stap = 1; return;
  }
  if (A.stap === 1){
    const g = pick(A.team).n; A.min = 12;
    if (rnd() < kans()){ A.wij++; A.goals++; regel(A, 12, `${g} legt de bal voor je klaar. [${o.l}] Raak! Het stadion zingt je naam. ${A.wij}-${A.zij}`, 'goal'); }
    else regel(A, 12, `${g} legt de bal voor je klaar. [${o.l}] Net mis! Het publiek applaudisseert toch.`, '');
    helft(A, 44); regel(A, 45, 'Rust. Je trekt het shirt van de Vrienden aan. Je oud-ploeggenoten van al je clubs staan om je heen.', 'rust');
    A.stap = 2; return;
  }
  if (A.stap === 2){
    regel(A, 46, i === 0 ? 'Je loopt een rondje langs het publiek. Mensen huilen, zwaaien met sjaals, filmen alles.' : `Je omhelst je oude maatjes: ${A.vrienden.filter(x => x.club && !x.rivaal).slice(0, 3).map(x => x.n).join(', ') || 'iedereen die er is'}. Zoveel herinneringen.`, 'info');
    mod('moraal', 5); A.min = 46; helft(A, 69); A.stap = 3; return;
  }
  if (A.stap === 3){
    const wie = o.l;
    if (i === 0){ if (rnd() < kans() + .1){ A.zij++; A.goals++; regel(A, 70, `Penalty voor de Vrienden. Je neemt hem zelf... en schiet hem keihard in de kruising! ${A.wij}-${A.zij}`, 'goal'); } else regel(A, 70, 'Penalty voor de Vrienden. Je neemt hem zelf... maar de keeper houdt hem. Hij grijnst: "Die bewaar ik."', ''); }
    else if (A.kind && wie.startsWith(A.kind)){ A.zij++; regel(A, 70, `Penalty. ${A.kind} pakt de bal, loopt aan... en de keeper duikt expres de verkeerde kant op. Goal! Het hele stadion staat op. ${A.wij}-${A.zij}`, 'goal'); }
    else if (A.rivaal && A.rivaal.mee && wie.includes(A.rivaal.naam)){ const r = rnd() < .65; if (r) A.zij++; regel(A, 70, `Je geeft de bal aan je rivaal ${A.rivaal.naam}. ${r ? `Hij scoort en jullie vallen elkaar in de armen. ${A.wij}-${A.zij}` : 'Hij schiet over en jullie liggen allebei dubbel van het lachen.'}`, r ? 'goal' : 'info'); }
    else { const r = rnd() < .7; if (r) A.zij++; regel(A, 70, `${wie.replace(' laten nemen', '')} neemt de penalty. ${r ? `Raak! Hij wijst naar jou. ${A.wij}-${A.zij}` : 'Op de paal. Hij slaat zijn handen voor zijn gezicht, en lacht dan.'}`, r ? 'goal' : ''); }
    A.min = 70; helft(A, 84); A.stap = 4; return;
  }
  if (A.stap === 4){
    const t = i === 0 ? '"Dit stadion was mijn thuis. Jullie waren mijn familie." Geen droog oog in het stadion.' : i === 1 ? '"Eindelijk kan ik uitslapen!" Het hele stadion lacht, en dan klinkt een daverend applaus.' : '"Bedankt voor alles." Meer hoeft niet. Het applaus duurt minutenlang.';
    regel(A, 85, `Je wordt gewisseld. Beide teams vormen een erehaag. Je pakt de microfoon: ${t}`, 'info');
    A.min = 85; helft(A, 90); regel(A, 90, `Laatste fluitsignaal. Eindstand ${A.club} ${A.wij}-${A.zij} Vrienden van ${sp.naam}.`, 'rust');
    return rondAf();
  }
}
function rondAf(){
  const A = S.afscheidWed, sp = S.sp, uit = `${A.wij}-${A.zij}`;
  const tekst = `Afscheidswedstrijd bij ${A.club}: ${A.club} ${uit} Vrienden van ${sp.naam}, ${A.goals} ${A.goals === 1 ? 'goal' : 'goals'} van jou. Met oud-ploeggenoten van ${[...new Set(A.vrienden.map(x => x.club).filter(c => c && c !== 'je rivaal'))].join(', ') || 'je vroegere clubs'}${A.rivaal && A.rivaal.mee ? ` en je rivaal ${A.rivaal.naam}` : ''}.`;
  S.car.hist.push(`${seizoenLabel()}: afscheidswedstrijd bij ${A.club} (${uit}, ${A.goals} goals)`);
  S.car.prijzen.push(`Afscheidswedstrijd bij ${A.club}`);
  krantMelding(`${sp.naam} neemt afscheid in een uitverkocht stadion`, tekst);
  A.klaar = true; S.einde.afscheidWed = {tekst, log:A.log.slice(-6)};
  S.fase = 'einde';
}
export function afscheidOverslaan(){ const A = S.afscheidWed; if (A) A.klaar = true; S.einde.afscheidWed = null; S.fase = 'einde'; }
