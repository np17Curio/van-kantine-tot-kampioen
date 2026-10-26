import { S, club } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { esc } from '../../core/utils.js';
import { landInfo } from '../../data/gegevens.js';
import { interRol, landenVoor, naInterland, startInterland, stopVanuitOproep, zegAf } from '../../game/interlands/interlands.js';
import { naToernooiWedstrijd, vTwTabel } from '../../game/interlands/toernooi.js';
import { scorebord, vFit, vLog, statRegel } from './match.js';

export function vOproep(){
  const O = S.oproep, sp = S.sp, meer = O.landen.length > 1;
  let h = `<div class="verhaal"><span class="label">Interlandperiode · ${O.type}</span><h2>${meer ? 'Meerdere landen willen je!' : `Opgeroepen voor ${esc(O.landen[0].land)}!`}</h2>
    <p>${meer ? 'Je hebt een oproep van meerdere bondscoaches. Voor welk land kom je uit?' : `De bondscoach van ${esc(O.landen[0].land)} belt: je zit bij de selectie.`}</p></div><div class="aanbod">`;
  for (const x of O.landen){
    const st = S.car.int[x.land], r = interRol(x.land);
    const vast = O.type === 'Kwalificatiewedstrijd' && !sp.land && landenVoor().length > 1;
    h += `<div class="bod door"><span class="label">Nationaal team · sterkte ${landInfo(x.land).s}</span><div class="club">${esc(x.land)}</div>
      <dl><dt>Wedstrijd</dt><dd>${O.type}</dd><dt>Tegenstander</dt><dd>${esc(x.opp)}</dd><dt>Interlands</dt><dd>${st ? st.caps : 0}</dd></dl>
      <div class="rol"><span class="label">Jouw rol</span><span class="risico ${r[1]}">${r[0]}</span></div>
      ${vast ? `<p class="muted klein-tekst">Let op: dit is een officiële wedstrijd. Daarna kun je alleen nog voor ${esc(x.land)} uitkomen.</p>` : ''}
      <div class="rij">${knop(`Opkomen voor ${esc(x.land)}`, () => startInterland(x.land), 'hoofd middel')}</div></div>`;
  }
  return h + `</div><div class="rij">${knop('Afzeggen', zegAf, 'klein')}${knop('Ik stop als international', stopVanuitOproep, 'klein', 'data-bevestig="Je wordt niet meer opgeroepen en gaat niet meer naar eindtoernooien. Later terugkeren kan, maar alleen als de bondscoach je dan nog wil." data-ja="Ja, ik stop"')}</div>`;
}
export function vInterEnd(){
  const M = S.M, I = M.inter, st = S.car.int[I.land];
  const uitslag = M.us > M.them ? 'Gewonnen' : M.us < M.them ? 'Verloren' : 'Gelijkgespeeld';
  const oordeel = M.cijfer >= 8.5 ? 'Uitblinker! Het hele land praat over je.' : M.cijfer >= 7.3 ? 'Sterke interland. De bondscoach is tevreden.' : M.cijfer >= 6 ? 'Degelijk. Je hoort erbij.' : 'Een lastige avond. De bondscoach denkt erover na.';
  return scorebord() + `<div class="verhaal"><span class="label">${I.type} · ${uitslag}</span>
    <div class="rij" style="gap:20px;align-items:flex-end"><div><span class="label">Jouw cijfer</span><div class="groot">${M.cijfer.toFixed(1).replace('.', ',')}</div></div>
    <div class="muted">${statRegel(M)}${M.rood ? ' · rode kaart' : ''}<br>Interland ${st.caps} voor ${esc(I.land)} · ${st.g} interlandgoals</div></div>
    <p>${oordeel}</p>${M.focusTekst ? `<p class="${M.focusOmlaag ? 'fouttxt' : 'goedtxt'}">${esc(M.focusTekst)}</p>` : ''}${vFit(M)}${(M.interTekst || []).map(t => `<p class="melding">${esc(t)}</p>`).join('')}${M.pens ? `<p class="melding">Strafschoppen: ${M.pensWin ? 'gewonnen' : 'verloren'} (${M.pens}).</p>` : ''}${M.rood && I.toernooi ? '<p class="fouttxt">Door je rode kaart ben je de volgende toernooiwedstrijd geschorst.</p>' : ''}${M.twTekst ? `<div class="${S.tw && S.tw.res === 'winst' ? 'kampioen' : 'melding'}"><p>${esc(M.twTekst)}</p></div>` : ''}${I.toernooi && S.tw && S.tw.fase === 'groep' ? `<div class="paneel"><span class="label">Poule</span>${vTwTabel()}</div>` : ''}</div>` + vLog() + (I.toernooi ? knop('Verder', naToernooiWedstrijd) : knop(`Terug naar ${esc(club().n)}`, naInterland));
}
