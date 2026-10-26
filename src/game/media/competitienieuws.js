import { S, seizoenLabel } from '../../core/state.js';
import { pick, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS, DIVS, divClubs, rondeInWeek } from '../../data/gegevens.js';
import { stand } from '../competitie/spelers.js';
import { trainerVan } from '../trainer/pers.js';
import { rivaal } from '../wedstrijd/fans-pers.js';
import { KRANTEN, metVoorletter, ranglijst } from './nieuws.js';

/* ===================== Nieuws over de hele competitie ===================== */
// Na elke speelronde 1 à 2 berichten over de andere clubs: een nieuwe koploper, een stunt, een grote overwinning, een derby,
// de topscorer, een reeks, een crisis of een ontslagen trainer. Over je eigen club gaat het al in je eigen nieuws.
const TELWOORD = ['', 'eerste', 'tweede', 'derde', 'vierde', 'vijfde', 'zesde', 'zevende', 'achtste', 'negende', 'tiende', 'elfde', 'twaalfde'];
const keer = n => TELWOORD[n] || `${n}e`;
const mijnClub = () => S.trainer && !S.trainer.gestopt ? S.trainer.club : S.sp && !S.sp.clubloos ? S.sp.club : null;
const mijnLeague = () => { const id = mijnClub(); return id != null && CLUBS[id] && CLUBS[id].t >= 1 ? CLUBS[id].t : 1; };
const n = id => CLUBS[id].n;
// De uitslagen van een club dit seizoen, op volgorde: 'W', 'G' of 'V'
function reeksVan(t, id){
  const uit = []; for (const r of (S.ss.res && S.ss.res[t]) || []) if (r) for (const [h, u, gh, gu] of r){ if (h !== id && u !== id) continue; const v = h === id ? gh - gu : gu - gh; uit.push(v > 0 ? 'W' : v < 0 ? 'V' : 'G'); }
  return uit;
}
const opRij = (l, f) => { let k = 0; for (let i = l.length - 1; i >= 0 && f(l[i]); i--) k++; return k; };
// Kandidaat-berichten voor league t in speelronde r: {p (prioriteit), sl (sleutel tegen herhaling), kop, tekst}
function kandidaten(t, r){
  const ronde = S.ss.res[t][r] || [], ik = mijnClub(), st = stand(t), tab = S.tab || {}, l = [], N = st.length;
  const plek = id => st.indexOf(id) + 1, pt = id => (tab[id] || {}).pt || 0, gespeeld = (S.ss.res[t] || []).filter(Boolean).length, tweede = gespeeld >= (S.ss.res[t].length || 1) / 2 || S.ronde >= AANTAL_RONDES / 2;
  const C = S.ss.compNieuws = S.ss.compNieuws || {laatst:{}, mijl:{}, ontslag:{}, leider:{}};
  // nieuwe koploper
  const leider = st[0], vorige = C.leider[t]; C.leider[t] = leider;
  if (vorige != null && vorige !== leider && leider !== ik) l.push({p:9, sl:'leider' + leider, kop:`${n(leider)} neemt de koppositie over in de ${DIVS[t]}`, tekst:`Met ${pt(leider)} punten staat ${n(leider)} nu bovenaan, ${pt(leider) - pt(st[1])} ${pt(leider) - pt(st[1]) === 1 ? 'punt' : 'punten'} voor ${n(st[1])}. ${vorige === ik ? 'Jullie zijn de koppositie kwijt.' : `${n(vorige)} zakt naar plek ${plek(vorige)}.`}`});
  for (const [h, u, gh, gu] of ronde){
    if (h === ik || u === ik) continue;
    const w = gh > gu ? h : gu > gh ? u : null, v = w === h ? u : w === u ? h : null, vs = Math.abs(gh - gu), score = `${gh}-${gu}`;
    if (w != null){
      // stunt: een veel zwakkere club wint, of een club uit de onderste helft verslaat een topclub
      if (CLUBS[v].s - CLUBS[w].s >= 8 || (plek(v) <= 3 && plek(w) > N / 2)) l.push({p:8, sl:'stunt' + w, kop:`Stunt! ${n(w)} verslaat ${plek(v) === 1 ? 'koploper ' : ''}${n(v)}`, tekst:`${n(h)} - ${n(u)} eindigde in ${score}. Niemand had dit verwacht van de nummer ${plek(w)} van de ${DIVS[t]}.`});
      // grote overwinning
      if (vs >= 4) l.push({p:6 + Math.min(2, vs - 4), sl:'groot' + w, kop:`${n(w)} walst over ${n(v)} heen: ${score}`, tekst:`Een middag om nooit te vergeten voor de fans van ${n(w)}. ${n(v)} ging volledig onderuit.`});
    }
    // derby tussen twee aartsrivalen
    if (rivaal(h) === u) l.push({p:7, sl:'derby' + h + u, kop:w != null ? `Derby voor ${n(w)}` : `Derby eindigt in een gelijkspel`, tekst:`${n(h)} - ${n(u)}: ${score}. ${w != null ? `De supporters van ${n(w)} kunnen weer een tijdje opscheppen.` : 'Niemand mag opscheppen, deze keer.'}`});
  }
  // topscorer: mijlpalen (10, 15, 20, 25, 30)
  const top = ranglijst(t, 'g').find(x => !x.jij && x.club !== ik);
  if (top){ const m = [30, 25, 20, 15, 10].find(k => top.g >= k), sl = 'top' + top.n + m;
    if (m && !C.mijl[sl]){ l.push({p:7, sl, mijl:sl, kop:`${metVoorletter(top)} (${n(top.club)}) maakt zijn ${m}e goal`, tekst:`${metVoorletter(top)} is de topscorer van de ${DIVS[t]} met ${top.g} goals.${ranglijst(t, 'g')[1] ? ` Achtervolger: ${ranglijst(t, 'g')[1].jij ? 'jij' : metVoorletter(ranglijst(t, 'g')[1])} met ${ranglijst(t, 'g')[1].g}.` : ''}`}); } }
  // reeksen, crisis en ontslag
  for (const id of divClubs(t)){
    if (id === ik) continue; const rs = reeksVan(t, id), win = opRij(rs, x => x === 'W'), geen = opRij(rs, x => x !== 'W');
    if (win >= 5 && rs[rs.length - 1] === 'W') l.push({p:5 + Math.min(2, win - 5), sl:'reeks' + id + win, kop:`${n(id)} wint voor de ${keer(win)} keer op rij`, tekst:`${n(id)} is niet te stoppen en staat ${plek(id)}e met ${pt(id)} punten.`});
    if (geen >= 6){
      if (geen >= 7 && plek(id) > N - 3 && !C.ontslag[id + '|' + S.jaar] && rnd() < .3){
        l.push({p:9, sl:'ontslag' + id, ontslag:id + '|' + S.jaar, kop:`${n(id)} ontslaat trainer ${trainerVan(id)}`, tekst:`Na ${geen} wedstrijden zonder overwinning grijpt het bestuur in. ${n(id)} staat ${plek(id)}e en vecht tegen degradatie.`}); }
      else if (geen % 2 === 0) l.push({p:4, sl:'crisis' + id + geen, kop:`${n(id)} wacht al ${geen} wedstrijden op een zege`, tekst:`De sfeer bij ${n(id)} wordt steeds grimmiger. De club staat ${plek(id)}e met ${pt(id)} punten.`});
    }
  }
  // spanning in de tweede seizoenshelft
  if (tweede && st.length > 3){
    const bij = st.filter(id => pt(st[0]) - pt(id) <= 2);
    if (bij.length >= 3 && !bij.includes(ik)) l.push({p:5, sl:'titel' + bij.length + S.ronde, kop:`Spannende titelstrijd in de ${DIVS[t]}`, tekst:`${bij.length} clubs staan binnen twee punten van elkaar: ${bij.slice(0, 4).map(id => `${n(id)} (${pt(id)})`).join(', ')}.`});
    const onder = st.slice(-4); if (pt(onder[3]) - pt(onder[0]) <= 0 || (pt(onder[0]) - pt(onder[3]) <= 3 && rnd() < .3)) if (!onder.includes(ik)) l.push({p:3, sl:'degr' + S.ronde, kop:`Spannende strijd onderin de ${DIVS[t]}`, tekst:`${onder.map(id => `${n(id)} (${pt(id)})`).join(', ')}: nog niets is beslist.`});
  }
  return l;
}
// Na een speelronde (week w): berichten bij het nieuws
export function competitieNieuws(w){
  if (!S || !S.ss || !S.ss.res || w !== S.ronde) return []; // (geen nieuws bij het inhalen van rondes)
  const C = S.ss.compNieuws = S.ss.compNieuws || {laatst:{}, mijl:{}, ontslag:{}, leider:{}}, mijn = mijnLeague(), uit = [];
  for (const t of [mijn, mijn === 1 ? 2 : 1]){
    const r = rondeInWeek(t, w); if (r == null || !(S.ss.res[t] && S.ss.res[t][r])) continue;
    const k = kandidaten(t, r).filter(x => !(C.laatst[x.sl] >= S.ronde - 3)).sort((a, b) => b.p - a.p); // (niet dezelfde kop vlak achter elkaar)
    const neem = t === mijn ? k.slice(0, rnd() < .6 ? 2 : 1) : k.filter(x => x.p >= 8).slice(0, rnd() < .5 ? 1 : 0); // (uit de andere league alleen groot nieuws)
    for (const x of neem){ C.laatst[x.sl] = S.ronde; if (x.mijl) C.mijl[x.mijl] = 1; if (x.ontslag) C.ontslag[x.ontslag] = 1; uit.push({bron:pick(KRANTEN[t] || KRANTEN[1]), kop:x.kop, tekst:x.tekst, wanneer:`week ${w + 1}, ${seizoenLabel()}`, comp:true}); }
  }
  S.ss.compRonde = uit;
  if (uit.length){ S.nieuws = uit.concat(S.nieuws || []).slice(0, 12); if (S.trainer && !S.trainer.gestopt) (S.krantWacht = S.krantWacht || []).push(...uit); }
  return uit;
}
