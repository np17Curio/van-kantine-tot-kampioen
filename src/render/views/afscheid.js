import { S } from '../../core/state.js';
import { keuzeKnop } from '../../core/ui.js';
import { esc } from '../../core/utils.js';
import { afscheidKeuzes, afscheidStap } from '../../game/seizoen/afscheidswedstrijd.js';
import { instel } from '../pitch.js';

// Bij het laatste fluitsignaal (de erehaag): eenmalig de pixelscène (render/afscheidscene.js), tenzij de huldigingsanimaties uit staan
function kies(i){
  const A = S.afscheidWed, slot = A && A.stap === 4, team = A ? A.team.map(x => x.n) : [], vrienden = A ? A.vrienden.map(x => x.n) : [];
  afscheidStap(i);
  if (!slot || !A.klaar || A.animGezien || !S.einde || !S.einde.afscheidWed) return;
  A.animGezien = true; let uit = false; try { uit = instel().huldigingAnim === 'uit'; } catch (e){}
  if (!uit) import('../afscheidscene.js').then(m => m.speelAfscheid({clubId:A.clubId ?? S.sp.club, club:A.club, team, vrienden})).catch(e => console.warn('afscheid', e));
}

// De afscheidswedstrijd: scorebord, opstellingen, verslag en de keuze van dit moment
export function vAfscheid(){
  const A = S.afscheidWed, sp = S.sp; if (!A) return '';
  const lijst = (l, metClub) => l.map(x => `<li>${esc(x.n)}${metClub && x.club ? ` <span class="muted">· ${esc(x.club)}</span>` : ''}</li>`).join('');
  const kop = A.stap === 0 ? 'Je afscheidswedstrijd' : A.stap === 1 ? 'Eerste helft: jij speelt bij je club' : A.stap === 2 ? 'Rust' : A.stap === 3 ? 'Tweede helft: jij speelt bij de Vrienden' : 'De laatste minuten';
  return `<div class="verhaal"><span class="label">${A.legende === false ? 'Je afscheid' : 'Afscheid als clublegende'}</span><h2>${esc(A.club)} ${A.wij} - ${A.zij} Vrienden van ${esc(sp.naam)}</h2>
      <p>${A.stap === 0 ? `Als dank voor alles organiseert ${esc(A.club)} een afscheidswedstrijd. ${A.hier === false ? 'Je laatste club' : 'Je huidige ploeg'} speelt tegen je vrienden: oud-ploeggenoten van al je clubs.` : esc(kop)}</p></div>
    ${A.stap === 0 ? `<div class="rij afscheidteams" style="align-items:flex-start;gap:24px;flex-wrap:wrap">
      <div><span class="label">${esc(A.club)}</span><ul>${lijst(A.team)}</ul></div>
      <div><span class="label">Vrienden van ${esc(sp.naam)}</span><ul>${lijst(A.vrienden, true)}</ul></div></div>` : ''}
    ${A.log.length ? `<div class="log">${A.log.map(l => `<div><span class="m">${l.m}</span><span class="${l.k}">${esc(l.t)}</span></div>`).join('')}</div>` : ''}
    <div class="keuzes">${afscheidKeuzes().map((o, i) => keuzeKnop(esc(o.l), esc(o.s), () => kies(i))).join('')}</div>`;
}
