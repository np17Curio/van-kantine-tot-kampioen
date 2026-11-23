import { S } from '../../core/state.js';
import { AANTAL_RONDES } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';

/* ===================== Het weer bij een wedstrijd ===================== */
// Elke wedstrijd heeft weer: zon, bewolkt, regen of sneeuw, met een temperatuur. Het hangt vooral af van de maand (een seizoen loopt
// van augustus tot en met mei: in de herfst veel regen, in de winter soms sneeuw, in het voorjaar en de zomer vaker zon) en van het
// land waar je speelt (in Spanje of Turkije sneeuwt het bijna nooit, in Noorwegen juist vaker). Het veld (veld3d.js) tekent het:
// de lucht, het licht, regen- of sneeuwvlokken en een wit laagje op het veld.

export const WEER = {
  zon:{n:'Zonnig', i:'☀️'},
  bewolkt:{n:'Bewolkt', i:'☁️'},
  regen:{n:'Regen', i:'🌧️'},
  sneeuw:{n:'Sneeuw', i:'🌨️'},
};
// De maand (0 = januari) van een speelronde: ronde 0 is half augustus, de laatste ronde eind mei
export const maandVan = ronde => (7 + Math.floor(Math.max(0, ronde) * 10 / Math.max(1, AANTAL_RONDES))) % 12;
// Kansen per maand op [zon, bewolkt, regen, sneeuw] en de gemiddelde temperatuur (een Nederlands klimaat)
const KLIMAAT = [
  [.15, .32, .28, .25, 3], [.18, .32, .28, .22, 4], [.32, .33, .27, .08, 8],  // januari, februari, maart
  [.45, .30, .25, 0, 12], [.55, .27, .18, 0, 16], [.6, .25, .15, 0, 19],      // april, mei, juni
  [.65, .22, .13, 0, 21], [.62, .23, .15, 0, 21], [.45, .3, .25, 0, 17],      // juli, augustus, september
  [.28, .35, .37, 0, 12], [.18, .35, .42, .05, 7], [.14, .32, .32, .22, 4],   // oktober, november, december
];
// Het land: warmer en droger in het zuiden, kouder in het noorden (sneeuw: hoeveel vaker, temperatuur: hoeveel warmer)
const LAND = {Spanje:{sneeuw:0, warm:7, zon:.2}, Portugal:{sneeuw:0, warm:6, zon:.2}, Turkije:{sneeuw:.2, warm:6, zon:.15}, 'Italië':{sneeuw:.2, warm:5, zon:.15},
  Griekenland:{sneeuw:0, warm:8, zon:.25}, Frankrijk:{sneeuw:.6, warm:2, zon:.05}, Noorwegen:{sneeuw:2, warm:-5, zon:-.05}, Polen:{sneeuw:1.6, warm:-2, zon:0},
  Denemarken:{sneeuw:1.2, warm:-1, zon:0}, Zwitserland:{sneeuw:1.6, warm:-1, zon:0}, 'Tsjechië':{sneeuw:1.5, warm:-2, zon:0}, Duitsland:{sneeuw:1.2, warm:0, zon:0}};
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// Het weer voor een ronde (vast: dezelfde ronde in hetzelfde seizoen heeft altijd hetzelfde weer, ook als je hem opnieuw laadt)
export function weerVoor(ronde = S.ronde, land = thuisLand(), extra = ''){
  const m = maandVan(ronde), [z0, b0, r0, s0, t0] = KLIMAAT[m], L = LAND[land] || {sneeuw:1, warm:0, zon:0};
  let zon = Math.max(.05, z0 + (L.zon || 0)), sneeuw = s0 * L.sneeuw, regen = r0, bewolkt = b0;
  const tot = zon + bewolkt + regen + sneeuw, h = hash([S.jaar, ronde, land, extra].join('|')), r = (h % 10000) / 10000 * tot;
  const soort = r < zon ? 'zon' : r < zon + bewolkt ? 'bewolkt' : r < zon + bewolkt + regen ? 'regen' : 'sneeuw';
  let temp = Math.round(t0 + L.warm + ((h >>> 14) % 9) - 4 + (soort === 'zon' ? 2 : soort === 'regen' ? -1 : 0));
  if (soort === 'sneeuw') temp = Math.min(temp, 1); // (sneeuw blijft alleen liggen als het vriest)
  return {soort, temp, maand:m};
}
// Het weer van de wedstrijd die nu gespeeld wordt (één keer bepaald en bewaard in S.M)
export function wedstrijdWeer(){
  const M = S && S.M; if (!M) return null;
  if (!M.weer) M.weer = weerVoor(S.ronde, thuisLand(), String(M.opp ?? ''));
  return M.weer;
}
export const weerTekst = w => w ? `${WEER[w.soort].i} ${WEER[w.soort].n} · ${w.temp}°C` : '';

// ---------- Wat het weer doet met de wedstrijd ----------
// moeilijker: extra moeilijkheid per soort actie (zelfde schaal als opt.b in momenten.js kans(): 1 punt ≈ 2% kans), keeper: extra
// moeilijk bij een keepersmoment, stamina: hoe snel je leeg raakt, goals: meer of minder doelpunten van de rest van het team
// Regen: de bal glijdt en stuitert raar (dribbelen en passen lastiger, een schot op een nat veld juist venijnig, de keeper heeft het zwaar).
// Sneeuw: alles gaat stroever, je raakt sneller leeg, er vallen minder goals. Hitte (vanaf 26 graden) en vrieskou kosten extra energie
export function weerEffect(w = wedstrijdWeer()){
  const e = {moeilijk:{}, keeper:0, stamina:1, goals:1, regels:[]};
  if (!w) return e;
  if (w.soort === 'regen'){ Object.assign(e.moeilijk, {drib:4, pas:3, afw:-2}); e.keeper = 5; e.stamina = 1.05; e.goals = 1.05;
    e.regels.push('dribbelen en passen lastiger', 'schoten op het natte gras zijn venijnig', 'keepers hebben het zwaar'); }
  if (w.soort === 'sneeuw'){ Object.assign(e.moeilijk, {drib:7, pas:6, afw:3, verd:2}); e.keeper = 3; e.stamina = 1.12; e.goals = .85;
    e.regels.push('alles gaat stroever', 'je raakt sneller leeg', 'er vallen minder goals'); }
  if (w.temp >= 26){ e.stamina *= 1.15; e.regels.push('de hitte kost extra energie'); }
  else if (w.temp <= 0 && w.soort !== 'sneeuw'){ e.stamina *= 1.06; e.regels.push('de vrieskou kost extra energie'); }
  return e;
}
// Voor in het scherm: "Regen: dribbelen en passen lastiger, ..." (leeg bij weer zonder invloed)
export const weerEffectTekst = (w = wedstrijdWeer()) => { const r = weerEffect(w).regels; return w && r.length ? `${WEER[w.soort].n}: ${r.join(', ')}.` : ''; };
