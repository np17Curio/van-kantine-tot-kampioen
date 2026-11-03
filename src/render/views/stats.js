import { S, club, tmp } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { esc } from '../../core/utils.js';
import { CLUBS, POS } from '../../data/gegevens.js';
import { BEKER_ALT, PRIJS_CLUB, PRIJS_IND, PRIJS_LAND } from '../../data/landen.js';
import { vRecords } from '../../game/seizoen/records.js';
import { fmt1 } from '../../game/speler/o23.js';
import { vTegenOud } from '../../game/wedstrijd/reunie.js';
import { vrouwenWereld } from '../../core/geslacht.js';

export function vStats(){
  const sp = S.sp, C = S.car, sz = C.seizoenen || [];
  const gem = C.cn ? fmt1(C.cs / C.cn) : '–';
  const club = C.prijzen.filter(p => PRIJS_CLUB.test(p)), ind = C.prijzen.filter(p => PRIJS_IND.test(p)), land = C.prijzen.filter(p => PRIJS_LAND.test(p)), overig = C.prijzen.filter(p => !PRIJS_CLUB.test(p) && !PRIJS_IND.test(p) && !PRIJS_LAND.test(p));
  const toern = C.toernooien || [];
  const tel = re => C.prijzen.filter(p => re.test(p)).length;
  const kast = (l, leeg) => l.length ? `<div class="prijzen">${l.map(p => `<span class="prijs">${esc(p)}</span>`).join('')}</div>` : `<p class="muted">${leeg}</p>`;
  const int = Object.entries(C.int || {});
  const tegel = (l, w) => `<div class="tegel"><span class="label">${l}</span><b>${w}</b></div>`;
  return `<div class="verhaal"><span class="label">Mijn carrière</span><h2>${esc(sp.naam)}</h2><p class="muted">${POS[sp.pos].n} · ${sp.leeftijd} jaar · ${esc(CLUBS[sp.club].n)}</p></div>
    <div class="tegels">
      ${tegel('Wedstrijden', C.wed)}${tegel('Goals', C.g)}${tegel('Assists', C.a)}${tegel('Gem. cijfer', gem)}
      ${tegel(vrouwenWereld() ? 'Speelster van de Wedstrijd' : 'Man of the Match', C.motm || 0)}${tegel('Sterren ⭐', `${C.sterren || 0}${C.perfect ? ` <span class="muted klein-tekst">(${C.perfect}× perfect)</span>` : ''}`)}${tegel('Kampioen', tel(/^Kampioen/))}${tegel('Bekers', tel(new RegExp(`^(${BEKER_ALT}|Champions League|Europa Cup|Jeugdbeker)`)))}${tegel('Gouden Bal', tel(/^Gouden Bal/))}
      ${tegel('Gele kaarten', C.geel || 0)}${tegel('Rode kaarten', C.rood || 0)}${tegel('Hoogste klasse', C.maxOvr)}${tegel('Clubs', new Set(C.clubs.map(x => (x.land || 'Nederland') + x.club)).size)}
    </div>
    ${int.length ? `<div class="paneel"><span class="label">Interlands</span>${int.map(([n, x]) => `<p><b>${esc(n)}</b>: ${x.caps} interlands · ${x.g} goals · ${x.a} assists</p>`).join('')}</div>` : ''}
    <div class="paneel"><span class="label">Prijzen met je club</span>${kast(club, 'Nog geen prijzen met een club. Dat komt nog!')}</div>
    ${land.length || toern.length ? `<div class="paneel"><span class="label">Met je land</span>${kast(land, 'Nog geen toernooi gewonnen.')}${toern.map(x => `<p class="muted klein-tekst">${esc(x)}</p>`).join('')}</div>` : ''}
    ${vRecords()}
    ${vTegenOud()}
    <div class="paneel"><span class="label">Persoonlijke prijzen</span>${kast(ind, 'Nog geen persoonlijke prijzen.')}<p class="muted klein-tekst">${vrouwenWereld() ? 'Speelster van de Wedstrijd' : 'Man of the Match'} (een 8,5 of hoger): ${C.motm || 0} keer.</p></div>
    ${overig.length ? `<div class="paneel"><span class="label">Buiten het veld</span>${kast(overig, '')}</div>` : ''}
    <div class="paneel"><span class="label">Seizoen voor seizoen</span>${sz.length ? `<div class="tabelwrap"><table class="tabel seizoenen"><thead><tr><th>Seizoen</th><th>Club</th><th>Wed</th><th>G</th><th>A</th><th>Gem</th></tr></thead><tbody>
      ${sz.map(x => `<tr><td>${x.s}</td><td><span class="rnaam">${esc(x.club)}</span><span class="rclub">${esc(x.div)} · ${x.plek ? x.plek + 'e' : 'tot de winter'}${x.beker ? ` · beker: ${esc(x.beker)}` : ''}</span></td><td>${x.wed}</td><td>${x.g}</td><td>${x.a}</td><td>${x.gem === null ? '–' : fmt1(x.gem)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Na je eerste seizoen zie je hier elk seizoen terug.</p>'}</div>
    ${knop('Terug naar het spel', () => { tmp.stats = false; })}`;
}
