import { S } from '../../core/state.js';
import { clamp, randInt, rnd } from '../../core/utils.js';
import { OPBOUW, selectie } from '../competitie/spelers.js';

/* ===================== Trainer: opstelling, fitheid en blessures ===================== */
// Formaties met 11 spelers: 1 keeper en het aantal verdedigers, middenvelders en aanvallers
export const FORMATIES = {
  '4-4-2':{V:4, M:4, A:2}, '4-3-3':{V:4, M:3, A:3}, '5-3-2':{V:5, M:3, A:2}, '3-5-2':{V:3, M:5, A:2}, '4-5-1':{V:4, M:5, A:1},
};
export const LINIE = ['K', 'V', 'M', 'A'];
export const mijnSel = () => S.trainer.o23 ? S.trainer.o23Sel : selectie(S.trainer.club); // bij de O23 je eigen jeugdselectie
export const kan = x => !(x.bles > 0) && !(x.schors > 0); // geblesseerd of geschorst (kleedkamer-drama)
// Hoe goed speelt hij nu? Wie moe is (fitheid onder de 60), speelt slechter
export const eff = x => x.k - (fit(x) < 60 ? (60 - fit(x)) / 4 : 0) - (x.ontevreden > 0 ? 2 : 0); // een ontevreden speler speelt minder goed
export const fit = x => x.fit ?? 100;
const aantal = (f, pos) => pos === 'K' ? 1 : FORMATIES[f][pos];

// De beste elf voor een formatie (zonder geblesseerden). metFitheid: rekening houden met vermoeidheid
export function besteElf(formatie, metFitheid = true, sel = mijnSel()){
  const uit = [];
  for (const pos of LINIE){
    const l = sel.filter(x => x.pos === pos && kan(x)).sort((a, b) => (metFitheid ? eff(b) - eff(a) : b.k - a.k));
    uit.push(...l.slice(0, aantal(formatie, pos)).map(x => x.n));
  }
  return uit;
}
const gem = (sel, ids, metFitheid) => { const l = sel.filter(x => ids.includes(x.n)); return l.length ? l.reduce((a, x) => a + (metFitheid ? eff(x) : x.k), 0) / 11 : 0; };
// De kracht van de gekozen elf (met vermoeidheid) en van de best mogelijke elf (fit, in de beste formatie)
export const elfKracht = () => gem(mijnSel(), opst().ids, true);
export function refKracht(sel = mijnSel()){ return Math.max(...Object.keys(FORMATIES).map(f => gem(sel, besteElf(f, false, sel), false))); }

export function opst(){
  const T0 = S.trainer;
  if (!T0.opstelling) T0.opstelling = {formatie:'4-4-2', ids:besteElf('4-4-2')};
  return T0.opstelling;
}
export function telling(o = opst(), sel = mijnSel()){
  const t = {K:0, V:0, M:0, A:0}; for (const n of o.ids){ const x = sel.find(y => y.n === n); if (x) t[x.pos]++; } return t;
}
export function geldig(o = opst(), sel = mijnSel()){
  const t = telling(o, sel), f = FORMATIES[o.formatie];
  return o.ids.length === 11 && t.K === 1 && t.V === f.V && t.M === f.M && t.A === f.A && o.ids.every(n => { const x = sel.find(y => y.n === n); return x && kan(x); });
}
// Een speler in de basis of op de bank zetten (in de basis alleen als er op die linie plek is)
export function wissel(naam){
  const o = opst(), sel = mijnSel(), x = sel.find(y => y.n === naam); if (!x) return;
  if (o.ids.includes(naam)) o.ids = o.ids.filter(n => n !== naam);
  else if (kan(x) && telling(o, sel)[x.pos] < aantal(o.formatie, x.pos)) o.ids.push(naam);
  pasToe();
}
export function kiesFormatie(f){ const o = opst(); o.formatie = f; o.ids = besteElf(f); pasToe(); }
export function vulBesteElf(){ const o = opst(); o.ids = besteElf(o.formatie); pasToe(); }
// Vóór een wedstrijd: wie geblesseerd of weg is, wordt vervangen door de beste die er nog is
export function vulAan(){
  const o = opst(), sel = mijnSel(), weg = [];
  o.ids = o.ids.filter(n => { const x = sel.find(y => y.n === n); if (!x || !kan(x)){ weg.push(n); return false; } return true; });
  for (const pos of LINIE){
    const nodig = aantal(o.formatie, pos) - telling(o, sel)[pos];
    if (nodig > 0) o.ids.push(...sel.filter(x => x.pos === pos && kan(x) && !o.ids.includes(x.n)).sort((a, b) => eff(b) - eff(a)).slice(0, nodig).map(x => x.n));
    // te veel op een linie (na een andere formatie): de zwakste eruit
    let teveel = telling(o, sel)[pos] - aantal(o.formatie, pos);
    while (teveel-- > 0){ const l = sel.filter(x => x.pos === pos && o.ids.includes(x.n)).sort((a, b) => eff(a) - eff(b)); o.ids = o.ids.filter(n => n !== l[0].n); }
  }
  pasToe();
  return weg;
}
// De keuze van de trainer in de selectie zetten: basis/bank, en wie het vaakst scoort en aangeeft (zoals herschik)
export function pasToe(){
  const o = opst(), sel = mijnSel();
  for (const [pos, ob] of Object.entries(OPBOUW)){
    sel.filter(x => x.pos === pos).sort((a, b) => (o.ids.includes(b.n) - o.ids.includes(a.n)) || b.k - a.k).forEach((x, i) => {
      x.basis = o.ids.includes(x.n); x.g = ob.g[Math.min(i, ob.g.length - 1)]; x.a = ob.a[Math.min(i, ob.a.length - 1)];
    });
  }
}
// Na een wedstrijd: wie speelde wordt moe (en loopt soms een blessure op), wie op de bank zat herstelt helemaal.
// Een vaste basisspeler zakt zo langzaam (ongeveer 4 per week): na een reeks wedstrijden is rust of rotatie nodig.
export function naWedstrijd({rotatie = false, conditie = false} = {}){
  const sel = mijnSel(), o = opst(), blessures = [];
  for (const x of sel){
    if (x.bles > 0){ x.bles--; x.fit = clamp(fit(x) + 10, 0, 100); continue; }
    if (x.schors > 0){ x.schors--; x.fit = clamp(fit(x) + 15, 0, 100); continue; }
    if (o.ids.includes(x.n)){ // (een conditietrainer: 40% minder blessures)
      x.fit = clamp(fit(x) - (rotatie ? randInt(3, 5) : randInt(8, 13)) + 6, 20, 100); x.bT = (x.bT || 0) + 1; // spelen kost fitheid, in de week herstel je een deel
      if (rnd() < (.03 + (conditie ? .01 : 0) + (fit(x) < 50 ? .03 : 0)) * ((S.trainer.staf || []).includes('conditie') ? .6 : 1)){ x.bles = randInt(1, 4); blessures.push(x); }
    } else x.fit = clamp(fit(x) + 15, 0, 100);
  }
  return blessures;
}
export const jeugdSpeler = x => (x.lft || 25) <= 21;
