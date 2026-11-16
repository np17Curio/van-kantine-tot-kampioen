/* ===================== Uiterlijk en tenue van een figuur ===================== */
// Zonder three.js: het veld, de cutscenes, de krantenfoto's en het startscherm gebruiken dit allemaal.
// (Kwam uit render/spelermodel.js, uit de tijd van de 3D-spelers.)
import { BAARD_KEUZE, HAAR, HUID, KAPSELS, KAPSELS_V, KAPSEL_KEUZE, KROES_KAPSELS, SCHOENEN } from '../../data/uiterlijk.js';
import { STANDAARD } from '../../data/tenues.js';
import { vrouwenWereld } from '../../core/geslacht.js';
import { S } from '../../core/state.js';
import { tattooCode } from './tattoo.js';

export function hashGetal(s){ let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
// Een vaste dobbelsteen: dezelfde sleutel geeft altijd hetzelfde uiterlijk, en ook dezelfde manier van bewegen.
// eigen = wat je zelf koos bij het aanmaken van je speler (huid, haar, kapsel); de rest blijft van de dobbelsteen
const GEWOON = KAPSELS.filter(k => !KROES_KAPSELS.includes(k)); // de andere kapsels (met 'model' dubbel)
// De leeftijd van jouw speler (of niets, zonder carrière)
export const jijLeeftijd = () => S && S.sp && S.sp.leeftijd || 0;
// Jouw tattoos als code (pixel/tattoo.js; '' = geen op je armen)
export const jijTattoo = () => S && S.sp ? tattooCode(S.sp.tattoos) : '';
export function uiterlijkVoor(sleutel, eigen){
  let h = hashGetal(sleutel); const d = n => { h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; return h % n; };
  const huid = d(HUID.length);
  // (een donkere huid: vaker kroeshaar-kapsels, zoals een afro, cornrows of vlechten)
  // (in het vrouwenvoetbal: vaker lang haar of een staart, iets kleiner en slanker)
  const v = vrouwenWereld(), kroes = huid >= 3 && d(5) < 3;
  const u = {huid, haar: huid >= 4 && d(3) ? 0 : d(HAAR.length), kapsel:kroes ? KROES_KAPSELS[d(KROES_KAPSELS.length)] : v ? KAPSELS_V[d(KAPSELS_V.length)] : d(25) === 0 ? 'vlechten' : GEWOON[d(GEWOON.length)], lengte:(v ? .89 : .93) + d(15) / 100, bouw:(v ? .85 : .9) + d(21) / 100, schoen:d(SCHOENEN.length),
    stijl:{arm:.8 + d(41) / 100, pas:.9 + d(26) / 100, houding:d(11) / 100, veer:.85 + d(31) / 100}};
  if (eigen){ if (HUID[eigen.huid]) u.huid = eigen.huid; if (HAAR[eigen.haar]) u.haar = eigen.haar; if (KAPSELS.includes(eigen.kapsel) || KAPSEL_KEUZE.some(([k]) => k === eigen.kapsel)) u.kapsel = eigen.kapsel; if (SCHOENEN[eigen.schoen]) u.schoen = eigen.schoen; if (BAARD_KEUZE.some(([b]) => b === eigen.baard)) u.baard = eigen.baard;
    // gekozen lengte (165-200 cm) en bouw (bmi 20-27,5)
    // (een speelster: 155-190 cm en iets slanker)
    const ev = eigen.vrouw ?? v, l0 = ev ? 155 : 165, b0 = ev ? .85 : .9;
    if (eigen.lengte) u.lengte = (ev ? .89 : .93) + Math.max(0, Math.min(35, eigen.lengte - l0)) / 35 * .14; if (eigen.bmi) u.bouw = b0 + Math.max(0, Math.min(7.5, eigen.bmi - 20)) / 7.5 * .2; }
  u.vrouw = !!(eigen && eigen.vrouw !== undefined ? eigen.vrouw : v); // (de pixelspeler: een meisjesgezicht)
  // Jouw speler wordt ouder (pixel/leeftijd.js): de leeftijd uit eigen (het startscherm), anders die van je carrière.
  // Het zaad (wie kaal wordt en wanneer, wie een bril krijgt) hangt alleen aan jouw vaste sleutel, niet aan je kapsel.
  if (sleutel.startsWith('jij|')){ const l = eigen && eigen.leeftijd ? eigen.leeftijd : jijLeeftijd(); if (l){ u.leeftijd = +l; u.ouderZaad = hashGetal('ouder|' + sleutel.split('|')[1]); }
    // en je tattoos (pixel/tattoo.js): uit eigen.tattoo (het startscherm: ''), anders die van je carrière
    const t = eigen && eigen.tattoo !== undefined ? eigen.tattoo : jijTattoo(); if (t) u.tattoo = t; }
  return u;
}
// Tenue voor een rol in de wedstrijd: uit de tenues van deze wedstrijd (data/tenues.js), anders een vaste kleur per rol
export function tenueVoor(rol, tenues){
  if (tenues && tenues[rol]) return tenues[rol];
  if (rol === 'K') return {shirt:'#8a5cf0', accent:'#141720', patroon:'effen', broek:'#141720', sok:'#8a5cf0'};
  if (rol === 'k') return {shirt:'#2fbf71', accent:'#141720', patroon:'effen', broek:'#141720', sok:'#2fbf71'};
  if (rol === 'R') return {shirt:'#15161c', accent:'#15161c', patroon:'effen', broek:'#15161c', sok:'#15161c'};
  return STANDAARD;
}