import { S } from '../../core/state.js';
import { CLUBS } from '../../data/gegevens.js';
import { BEKER_ALT, PRIJS_LAND } from '../../data/landen.js';
import { recs } from './records.js';

/* ===================== Afscheid en eindscherm ===================== */
export const RUGNUMMER = {SPITS:9, MID:10, VERD:4, KEEPER:1};
export function afscheid(){
  const sp = S.sp, C = S.car, R = recs(), eer = [];
  const legendes = [...new Set(C.prijzen.filter(p => /^Clublegende van /.test(p)).map(p => p.replace('Clublegende van ', '')))];
  for (const naam of legendes){
    const ky = Object.keys(R.clubN || {}).find(k => R.clubN[k] === naam) ?? CLUBS.findIndex(c => c.n === naam), nr = (sp.rugHist || {})[ky] ?? RUGNUMMER[sp.pos], g = (R.clubG || {})[ky] || 0, titels = (C.seizoenen || []).filter(x => x.club === naam && x.plek === 1).length;
    if (g >= 100 || (titels >= 3 && g >= 50)) eer.push({club:naam, soort:'standbeeld', t:`${naam} onthult een standbeeld van jou voor het stadion. Kinderen maken er foto's bij in jouw shirt.`});
    else eer.push({club:naam, soort:'nummer', nr, t:`${naam} geeft het shirt met nummer ${nr} nooit meer uit. Het hangt ingelijst in de bestuurskamer.`});
  }
  eer.forEach(e => { C.hist.push(`${S.jaar}: ${e.soort === 'standbeeld' ? 'standbeeld bij' : 'rugnummer ' + e.nr + ' teruggetrokken bij'} ${e.club}`); C.prijzen.push(e.soort === 'standbeeld' ? `Standbeeld bij ${e.club}` : `Rugnummer ${e.nr} teruggetrokken bij ${e.club}`); });
  return eer;
}
// Carrièrescore: prijzen, goals, klasse en interlands
export function carriereScore(){
  const C = S.car, p = C.prijzen, tel = re => p.filter(x => re.test(x)).length, caps = Object.values(C.int || {}).reduce((a, x) => a + x.caps, 0);
  return tel(/^Gouden Bal/) * 15 + tel(/^Champions League/) * 8 + tel(PRIJS_LAND) * 10 + tel(/^Kampioen/) * 4 + tel(new RegExp(`^(${BEKER_ALT}|Europa Cup)`)) * 3 + tel(/^(Topscorer|Assistkoning|Speler van het Seizoen|Beste speler)/) * 2
    + tel(/^(Clublegende|Clubtopscorer|Competitierecord|Standbeeld)/) * 3 + C.g / 10 + C.a / 20 + Math.max(0, C.maxOvr - 50) * .8 + caps / 8;
}
export function eindTitel(sc){ return sc >= 180 ? 'Legende van het wereldvoetbal' : sc >= 110 ? 'Wereldster' : sc >= 65 ? 'Clubicoon' : sc >= 35 ? 'Degelijke prof' : sc >= 15 ? 'Werkpaard' : 'Kantinekoning'; }
export function besteSeizoen(){ const l = (S.car.seizoenen || []).filter(x => x.wed >= 5); if (!l.length) return null; return l.slice().sort((a, b) => (b.g + b.a * .5 + (b.gem || 6) * 2) - (a.g + a.a * .5 + (a.gem || 6) * 2))[0]; }
