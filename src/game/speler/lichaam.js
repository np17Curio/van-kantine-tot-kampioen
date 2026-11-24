import { S } from '../../core/state.js';

/* ===================== Lichaam: lengte en bouw ===================== */
// Je kiest bij het maken van je speler hoe lang en hoe zwaar hij is (in sp.uiterlijk: lengte in cm, bmi).
// Lang is sterk in de lucht, klein en tenger is snel en wendbaar, zwaar wint duels maar raakt sneller moe.
// Het effect is klein (hooguit ±8% per actie): je eigenschappen blijven het belangrijkst.
export const LENGTES = [165, 170, 175, 180, 185, 190, 195, 200];
export const BOUW = [{id:'tenger', n:'Tenger', bmi:20}, {id:'normaal', n:'Normaal', bmi:22.5}, {id:'stevig', n:'Stevig', bmi:25}, {id:'zwaar', n:'Zwaar', bmi:27.5}];
export const STANDAARD_LENGTE = {SPITS:182, MID:177, VERD:186, KEEPER:190};
// Speelsters: andere lengtes, en de effecten gaan uit van 1,70 m in plaats van 1,80 m
export const LENGTES_V = [155, 160, 165, 170, 175, 180, 185, 190];
export const STANDAARD_LENGTE_V = {SPITS:170, MID:166, VERD:173, KEEPER:178};
export const lengtesVoor = vrouw => vrouw ? LENGTES_V : LENGTES;
export const standaardLengte = (pos, vrouw) => (vrouw ? STANDAARD_LENGTE_V : STANDAARD_LENGTE)[pos] || (vrouw ? 170 : 180);
const refLengte = L => (L && L.vrouw !== undefined ? L.vrouw : S && S.wereld === 'v') ? 170 : 180;
// Je groeit nog tot je 23e: hoeveel cm je gemiddeld nog groeit op een leeftijd (jongens en meisjes)
const GROEI_REST = {m:{15:9, 16:6.5, 17:4.5, 18:3, 19:2, 20:1.2, 21:.7, 22:.3}, v:{15:3, 16:2, 17:1.3, 18:.8, 19:.5, 20:.3, 21:.2, 22:.1}};
export const groeiRest = (lft, vrouw) => lft >= 23 ? 0 : GROEI_REST[vrouw ? 'v' : 'm'][Math.max(15, Math.round(lft))] || 0;
// De eindlengte: je lengte nu plus wat je nog groeit (met wat toeval). Het spel kiest die bij het begin
export const eindLengte = (lengte, lft, vrouw, f = .6 + Math.random() * .8) => Math.round(lengte + groeiRest(lft, vrouw) * f);
// Eén jaar ouder: een deel van wat er nog over is (sp.leeftijd is al opgehoogd). Geeft een tekst als je gegroeid bent
export function groeiJaar(sp){
  const u = sp && sp.uiterlijk; if (!u || !u.lengte) return null;
  if (u.eind == null) u.eind = eindLengte(u.lengte, sp.leeftijd - 1, sp.vrouw, 1); // (oude opslag)
  const rest = u.eind - u.lengte; if (rest <= 0) return null;
  const voor = groeiRest(sp.leeftijd - 1, sp.vrouw), na = groeiRest(sp.leeftijd, sp.vrouw);
  const nieuw = sp.leeftijd >= 23 || voor <= 0 ? u.eind : Math.min(u.eind, Math.round(u.lengte + rest * (voor - na) / voor));
  if (nieuw <= u.lengte) return null;
  const oud = u.lengte, kopVoor = lichaamEffecten(lichaam(sp)).kop; u.lengte = nieuw;
  const meer = lichaamEffecten(lichaam(sp)).kop - kopVoor >= .005 ? ' Je bent sterker in de lucht.' : '';
  return `Je bent gegroeid: ${lengteTxt(oud)} → ${lengteTxt(nieuw)}.${meer}${sp.leeftijd >= 23 || nieuw >= u.eind ? ' Je bent nu uitgegroeid.' : ''}`;
}
export const gewichtVan = (lengte, bmi) => Math.round(bmi * (lengte / 100) ** 2);
export const lengteTxt = l => (l / 100).toFixed(2).replace('.', ',') + ' m';
// Zonder keuze (oude opslag): 1,80 m en normaal, dus geen effect
export function lichaam(sp = S && S.sp){ const u = sp && sp.uiterlijk, v = !!(sp && sp.vrouw); return {lengte:(u && u.lengte) || (v ? 170 : 180), bmi:(u && u.bmi) || 22.5, vrouw:v}; }
export function lichaamEffecten(L = lichaam()){
  const r = refLengte(L);
  return {kop:(L.lengte - r) * .004, snel:(r - L.lengte) * .002 + (22.5 - L.bmi) * .01, duel:(L.bmi - 22.5) * .012, stamina:(L.bmi - 22.5) * .015};
}
const KOP = ['kopduel', 'corner', 'verdCorner'], SNEL = ['counter', 'diepteBal', 'eenOpEen', 'vleugel'], DUEL = ['tackle', 'verdedigen', 'opstootje'];
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
