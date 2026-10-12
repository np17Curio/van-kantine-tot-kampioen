import { S } from '../../core/state.js';
import { clamp } from '../../core/utils.js';
import { CLUBS } from '../../data/gegevens.js';

/* ===================== Teamvorm ===================== */
// Een ploeg die wint, krijgt vertrouwen en wint vaker; een ploeg die verliest, raakt in de put.
// De vorm komt uit de laatste 5 competitiewedstrijden van dit seizoen (de nieuwste telt het zwaarst).
const GEWICHT = [1, .85, .7, .55, .4];
export const VORM_MAX = 2; // hooguit ±2 sterktepunten

// De laatste n uitslagen ('W', 'G' of 'V'), de nieuwste eerst
export function laatsteUitslagen(id, n = 5){
  const c = CLUBS[id], rondes = c && S.ss && S.ss.res ? S.ss.res[c.t] || [] : [], uit = [];
  for (let r = rondes.length - 1; r >= 0 && uit.length < n; r--){
    const m = (rondes[r] || []).find(x => x[0] === id || x[1] === id); if (!m) continue;
    const [voor, tegen] = m[0] === id ? [m[2], m[3]] : [m[3], m[2]];
    uit.push(voor > tegen ? 'W' : voor === tegen ? 'G' : 'V');
  }
  return uit;
}
export function vormScore(id){
  return laatsteUitslagen(id).reduce((a, u, i) => a + (u === 'W' ? 1 : u === 'V' ? -1 : 0) * GEWICHT[i], 0);
}
export const vormBonus = id => clamp(vormScore(id) * .6, -VORM_MAX, VORM_MAX);
export function vormLabel(id){
  if (laatsteUitslagen(id).length < 2) return ['Nog geen vorm', ''];
  const v = vormScore(id);
  return v >= 2 ? ['Topvorm', 'r-veilig'] : v >= .8 ? ['In vorm', 'r-veilig'] : v <= -2 ? ['Crisis', 'r-riskant'] : v <= -.8 ? ['Uit vorm', 'r-riskant'] : ['Wisselvallig', 'r-gem'];
}
// Hoeveel op rij hetzelfde (bijvoorbeeld 4 zeges op rij)?
export function reeks(id){
  const l = laatsteUitslagen(id, 10); if (!l.length) return {u:null, n:0};
  let n = 0; while (n < l.length && l[n] === l[0]) n++;
  return {u:l[0], n};
}
// Na de wedstrijd: een korte regel als de ploeg in een reeks zit
const RANG = ['', '', 'Tweede', 'Derde', 'Vierde', 'Vijfde', 'Zesde', 'Zevende', 'Achtste', 'Negende', 'Tiende'];
export function reeksTekst(id){
  const {u, n} = reeks(id), nr = RANG[Math.min(n, 10)] + (n > 10 ? ' (of meer)' : '');
  if (u === 'W' && n >= 3) return `${nr} zege op rij: de ploeg zit in ${n >= 4 ? 'topvorm' : 'vorm'}! Dat vertrouwen neem je mee naar de volgende wedstrijd.`;
  if (u === 'V' && n >= 3) return `${nr} nederlaag op rij: de ploeg zit in ${n >= 4 ? 'een crisis' : 'een dip'}. Het vertrouwen is weg.`;
  if (u === 'G' && n >= 3) return `${nr} gelijkspel op rij. De ploeg komt maar niet los.`;
  return null;
}
// De bolletjes: groen (winst), grijs (gelijk), rood (verlies), oudste links
export const vormBolletjes = id => `<span class="vormrij" title="Laatste wedstrijden: ${laatsteUitslagen(id).slice().reverse().join(' ') || 'nog geen'}">${laatsteUitslagen(id).slice().reverse().map(u => `<i class="vb vb-${u}">${u}</i>`).join('')}</span>`;
