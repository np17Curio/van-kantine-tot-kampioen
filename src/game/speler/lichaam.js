import { S } from '../../core/state.js';

/* ===================== Lichaam: lengte en bouw ===================== */
// Je kiest bij het maken van je speler hoe lang en hoe zwaar hij is (in sp.uiterlijk: lengte in cm, bmi).
// Lang is sterk in de lucht, klein en tenger is snel en wendbaar, zwaar wint duels maar raakt sneller moe.
// Het effect is klein (hooguit ±8% per actie): je eigenschappen blijven het belangrijkst.
export const LENGTES = [165, 170, 175, 180, 185, 190, 195, 200];
export const BOUW = [{id:'tenger', n:'Tenger', bmi:20}, {id:'normaal', n:'Normaal', bmi:22.5}, {id:'stevig', n:'Stevig', bmi:25}, {id:'zwaar', n:'Zwaar', bmi:27.5}];
export const STANDAARD_LENGTE = {SPITS:182, MID:177, VERD:186};
export const gewichtVan = (lengte, bmi) => Math.round(bmi * (lengte / 100) ** 2);
export const lengteTxt = l => (l / 100).toFixed(2).replace('.', ',') + ' m';
// Zonder keuze (oude opslag): 1,80 m en normaal, dus geen effect
export function lichaam(sp = S && S.sp){ const u = sp && sp.uiterlijk; return {lengte:(u && u.lengte) || 180, bmi:(u && u.bmi) || 22.5}; }
export function lichaamEffecten(L = lichaam()){
  return {kop:(L.lengte - 180) * .004, snel:(180 - L.lengte) * .002 + (22.5 - L.bmi) * .01, duel:(L.bmi - 22.5) * .012, stamina:(L.bmi - 22.5) * .015};
}
const KOP = ['kopduel', 'corner', 'verdCorner'], SNEL = ['counter', 'diepteBal', 'eenOpEen'], DUEL = ['tackle', 'verdedigen', 'opstootje'];
// Plus of min op de slagingskans van een actie (type: het soort moment)
export function lichaamKans(opt, type){
  const e = lichaamEffecten(), l = opt.l || ''; let d = 0;
  if (KOP.includes(type) || /kop/i.test(l)) d += e.kop;
  if (opt.st === 'drib' || opt.st === 'cond') d += SNEL.includes(type) ? e.snel : e.snel * .5;
  else if (SNEL.includes(type) && opt.st === 'afw') d += e.snel * .5;
  if (opt.st === 'verd' || (DUEL.includes(type) && opt.st !== 'kalm') || /schouder|tackle|duel/i.test(l)) d += e.duel;
  return Math.max(-.08, Math.min(.08, d));
}
// Hoe vaak een soort moment voorkomt: lang = vaker in de lucht, snel = vaker in de omschakeling
export function lichaamMomentFactor(type){ const e = lichaamEffecten(); return KOP.includes(type) ? 1 + e.kop * 4 : SNEL.includes(type) ? 1 + e.snel * 4 : 1; }
// Staminaverbruik: zwaarder kost meer
export const lichaamStamina = () => 1 + lichaamEffecten().stamina;
// Een kort overzicht (startscherm, zijbalk): "Koppen +6% · Snelheid −3% · Duels +4% · Stamina −2%"
export function lichaamSamenvatting(L){
  const e = lichaamEffecten(L), p = (n, x) => `${n} ${x >= 0 ? '+' : '−'}${Math.abs(Math.round(x * 100))}%`;
  return [p('Koppen', e.kop), p('Snelheid', e.snel), p('Duels', e.duel), p('Stamina', -e.stamina)].join(' · ');
}
