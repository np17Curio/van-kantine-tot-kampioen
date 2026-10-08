import { S, seizoenLabel, tmp } from '../../core/state.js';
import { act, keuzeKnop, knop } from '../../core/ui.js';
import { esc } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS, DIVS } from '../../data/gegevens.js';
import { fixture } from '../../game/competitie/competitie.js';
import { stand } from '../../game/competitie/spelers.js';
import { vKrant } from '../../game/media/nieuws.js';
import { nieuweTabellen } from '../../game/speler/status.js';
import { TACTIEK, kiesTrainerClub, stopTrainer, trainerAanbiedingen, trainerNieuwSeizoen, trainerVerder, trainerWedstrijd } from '../../game/trainer.js';

export function vTrainerAanbod(){
  const l = S.trainerAanbod || [];
  return `<div class="verhaal"><span class="label">${S.trainer && S.trainer.ontslagen ? 'Op zoek naar een nieuwe club' : 'Trainer worden'}</span><h2>Welke club wil jij trainen?</h2>
    <p>${S.trainer && S.trainer.ontslagen ? 'Na je ontslag bellen er een paar clubs. Het niveau is wat lager, maar het is een nieuwe kans.' : 'Je naam en je prijzen openen deuren. Deze clubs bellen je.'}</p></div>
    <div class="aanbod">${l.map(id => `<div class="bod"><div class="club">${esc(CLUBS[id].n)}</div><span class="niv">${DIVS[CLUBS[id].t]} · sterkte ${CLUBS[id].s}</span>${keuzeKnop('Trainer worden', '', () => kiesTrainerClub(id))}</div>`).join('')}</div>
    ${S.trainer && S.trainer.ontslagen ? knop('Stoppen met trainen', () => stopTrainer()) : ''}`;
}
export function vTrainer(){
  const T0 = S.trainer, c = CLUBS[T0.club], fx = fixture(S.ronde), opp = CLUBS[fx.opp], pl = stand(c.t).indexOf(T0.club) + 1;
  const bestuur = T0.bestuur >= 60 ? ['Tevreden', 'r-veilig'] : T0.bestuur >= 35 ? ['Afwachtend', 'r-gem'] : ['Ongeduldig', 'r-riskant'];
  return `<div class="verhaal"><span class="label">Trainer van ${esc(c.n)} · week ${S.ronde + 1} van ${AANTAL_RONDES}</span><h2>Wedstrijd ${S.ronde + 1}</h2>
    <p>${fx.thuis ? 'Thuis' : 'Uit'} tegen <b>${esc(opp.n)}</b> (sterkte ${opp.s}, jullie ${c.s}). ${S.ronde === 0 ? 'Het seizoen moet nog beginnen.' : `Jullie staan ${pl}e.`}</p>
    <p class="opst"><span class="label">Bestuur</span><span class="risico ${bestuur[1]}">${bestuur[0]}</span><span class="label">Moraal groep</span><b>${Math.round(T0.moraal)}</b><span class="label">Fitheid groep</span><b>${Math.round(T0.fit)}</b></p>
    ${T0.bestuur < 35 ? '<p class="melding" style="color:var(--fout);border-color:var(--fout)">Het bestuur wordt ongeduldig. Nog een paar nederlagen en je wordt ontslagen.</p>' : ''}</div>
    ${vKrant(S.krantWacht)}
    <div><span class="label">Welke tactiek kies je?</span><div class="keuzes" style="margin-top:6px">${Object.entries(TACTIEK).map(([k, x]) => `<button class="keuze ${T0.tactiek === k ? 'aan' : ''}" data-i="${act(() => { T0.tactiek = k; })}" data-blijf aria-pressed="${T0.tactiek === k}"><span class="t">${x.n}</span><span class="s">${x.d}</span></button>`).join('')}</div></div>
    ${knop(`Speel: ${fx.thuis ? esc(c.n) + ' – ' + esc(opp.n) : esc(opp.n) + ' – ' + esc(c.n)} (${TACTIEK[T0.tactiek].n.toLowerCase()})`, trainerWedstrijd)}
    <div class="rij">${knop('Stoppen als trainer', () => { tmp.stopTrainerVraag = true; }, 'klein', 'data-blijf')}${tmp.stopTrainerVraag ? `<span class="muted">Zeker weten?</span>${knop('Ja, stoppen', () => { tmp.stopTrainerVraag = false; stopTrainer(); }, 'klein')}${knop('Nee', () => { tmp.stopTrainerVraag = false; }, 'klein', 'data-blijf')}` : ''}</div>`;
}
export function vTrainerUitslag(){
  const T0 = S.trainer, L = T0.laatste, c = CLUBS[T0.club], uit = L.a > L.b ? 'Gewonnen' : L.a < L.b ? 'Verloren' : 'Gelijkgespeeld';
  const [th, tu, sh, su] = L.thuis ? [c.n, L.opp, L.a, L.b] : [L.opp, c.n, L.b, L.a];
  return `<div class="score"><div class="team ${L.thuis ? 'mij' : ''}">${esc(th)}</div><div class="stand">${sh}-${su}<span class="min">EINDE</span></div><div class="team r ${!L.thuis ? 'mij' : ''}">${esc(tu)}</div></div>
    <div class="verhaal"><span class="label">${uit} · tactiek: ${TACTIEK[L.tk].n.toLowerCase()}</span>${L.regels.map(r => `<p>${esc(r)}</p>`).join('')}<p class="muted">Jullie staan nu ${L.plek}e.</p>
    ${T0.ontslag ? '<p class="melding" style="color:var(--fout);border-color:var(--fout)">Het bestuur heeft genoeg gezien. Je bent ontslagen.</p>' : ''}</div>
    ${vKrant(S.krantWacht)}
    ${knop(T0.ontslag ? 'Op zoek naar een nieuwe club' : S.ronde >= AANTAL_RONDES ? 'Seizoen afsluiten' : 'Volgende week', () => { S.krantWacht = []; trainerVerder(); })}`;
}
export function vTrainerSeizoen(){
  const E = S.trainerEind, T0 = S.trainer;
  return `<div class="verhaal"><span class="label">Einde seizoen ${seizoenLabel()} · trainer</span><h2>${E.plek === 1 ? 'Kampioen!' : `${E.plek}e plaats`}</h2><p>${esc(E.clubNaam)} eindigt als ${E.plek}e in de ${DIVS[E.t]}.</p></div>
    ${E.plek === 1 ? `<div class="kampioen"><span class="label">Kampioen als trainer</span><h2>🏆 ${esc(E.clubNaam)}</h2><p>Je spelers gooien je in de lucht. Als speler was het mooi, maar dit voelt nog beter.</p></div>` : ''}
    ${E.mijn ? (E.mijn.naar < E.mijn.van ? `<p class="melding">Promotie naar de ${DIVS[E.mijn.naar]}!</p>` : `<p class="melding" style="color:var(--fout);border-color:var(--fout)">Degradatie naar de ${DIVS[E.mijn.naar]}.</p>`) : ''}
    <p class="muted">Als trainer: ${T0.totWed} wedstrijden, ${T0.totW} gewonnen (${T0.totWed ? Math.round(100 * T0.totW / T0.totWed) : 0}%). Je trainersreputatie: <b>${Math.round(T0.rep)}</b>${T0.rep >= 52 ? ' · topclubs kennen je naam' : ''}.${E.plek <= 3 ? ' De club investeert: het team wordt sterker.' : ''}</p>
    ${knop('Volgend seizoen', trainerNieuwSeizoen)}${knop('Andere club zoeken', () => { S.jaar++; S.sp.leeftijd++; S.ronde = 0; S.tab = nieuweTabellen(); S.ss = {wed:0, g:0, a:0, c:[], bods:0}; S.fase = 'trainerAanbod'; S.trainerAanbod = trainerAanbiedingen(); }, 'hoofd tweede')}`;
}
export function vTrainerSamenvatting(){
  const T0 = S.trainer;
  return `<div class="paneel"><span class="label">Trainerscarrière</span><p>${T0.seizoenen} ${T0.seizoenen === 1 ? 'seizoen' : 'seizoenen'} · ${T0.totWed} wedstrijden · ${T0.totW} gewonnen${T0.ontslagen ? ` · ${T0.ontslagen}x ontslagen` : ''}</p>
    ${T0.prijzen.length ? `<div class="prijzen">${T0.prijzen.map(p => `<span class="prijs">${esc(p)}</span>`).join('')}</div>` : ''}${T0.hist.map(h => `<p class="muted">${esc(h)}</p>`).join('')}</div>`;
}
export function vZijTrainer(){
  const T0 = S.trainer, c = CLUBS[T0.club], st = stand(c.t);
  return `<div class="kaart"><span class="label">Trainer</span><div class="naam">${esc(S.sp.naam)}</div><p class="muted">${S.sp.leeftijd} jaar · ${esc(c.n)}</p>
    <div class="feiten"><div><span class="label">Dit seizoen</span><b>${T0.w}W ${T0.g}G ${T0.v}V</b></div><div><span class="label">Totaal</span><b>${T0.totW} van ${T0.totWed}</b></div><div><span class="label">Reputatie</span><b>${Math.round(T0.rep)}</b></div><div><span class="label">Clubsterkte</span><b>${c.s}</b></div></div>
    ${T0.prijzen.length ? `<div class="prijzen">${T0.prijzen.map(p => `<span class="prijs">${esc(p)}</span>`).join('')}</div>` : ''}</div>
    <div class="kaart"><h3>${DIVS[c.t]}</h3><div class="tabelwrap"><table class="tabel"><thead><tr><th>#</th><th>Club</th><th>G</th><th>DS</th><th>Pt</th></tr></thead><tbody>${st.map((id, i) => { const e = S.tab[id]; return `<tr class="${id === T0.club ? 'mij' : ''}"><td>${i + 1}</td><td>${esc(CLUBS[id].n)}</td><td>${e.g}</td><td>${e.dv - e.dt > 0 ? '+' : ''}${e.dv - e.dt}</td><td>${e.pt}</td></tr>`; }).join('')}</tbody></table></div></div>`;
}
