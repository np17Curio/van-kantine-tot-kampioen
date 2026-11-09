import { S, seizoenLabel } from '../../core/state.js';
import { act, keuzeKnop, knop } from '../../core/ui.js';
import { esc, geldTxt } from '../../core/utils.js';
import { CLUBS } from '../../data/gegevens.js';
import { POS_NAAM } from '../../game/competitie/spelers.js';
import { metVoorletter } from '../../game/media/nieuws.js';
import { geefNaam } from '../../game/prive/gezin.js';
import { TOON } from '../../game/speler/journey.js';
import { PEPTALK, SLOT, TACTIEK, liveEff, liveTactiek, liveWissel, slotKeuze, tweedeHelft } from '../../game/trainer.js';
import { dramaKeuze, dramaOpties, dramaTekst } from '../../game/trainer/drama.js';
import { DIPLOMAS, heeftDiploma } from '../../game/trainer/loopbaan.js';
import { persAntwoord, persOpenTrainer, persVragenTrainer, rivaalClub, trainerVan } from '../../game/trainer/pers.js';
import { eff, fit, kan, mijnSel, opst } from '../../game/trainer/ploeg.js';
import { vPitch } from '../pitch.js';
import { vBuiten } from './week.js';

/* ===================== Trainer: live coachen, kleedkamer, pers, prijzenkast en privé ===================== */
const fitKl = f => f < 60 ? 'fouttxt' : f < 80 ? '' : 'goedtxt';
// Live coachen: in de rust (peptalk, wissels, tactiek) en rond de 70e minuut (alles of niets)
export function vTrainerLive(){
  const T0 = S.trainer, L = T0.live, M = S.M; if (!L || !M) return '';
  const [th, tu, sh, su] = M.thuis ? [M.wij, M.zij, L.a, L.b] : [M.zij, M.wij, L.b, L.a], rust = L.fase === 'rust';
  const stand = `${L.a}-${L.b}`, voor = L.a > L.b ? 'voor' : L.a < L.b ? 'achter' : 'gelijk';
  const score = `<div class="score"><div class="team ${M.thuis ? 'mij' : ''}">${esc(th)}</div><div class="stand">${sh}-${su}<span class="min">${rust ? 'RUST' : "70'"}</span></div><div class="team r ${!M.thuis ? 'mij' : ''}">${esc(tu)}</div></div>`;
  const keuzes = rust
    ? `<span class="label">Je peptalk in de kleedkamer (je staat ${voor === 'gelijk' ? 'gelijk' : voor === 'voor' ? 'voor' : 'achter'}, ${stand})</span><div class="keuzes">${Object.entries(PEPTALK).map(([k, x]) => keuzeKnop(esc(x.n), esc(x.d), () => tweedeHelft(k))).join('')}</div>`
    : `<span class="label">Nog 20 minuten, ${stand}. Wat doe je?</span><div class="keuzes">${Object.entries(SLOT).map(([k, x]) => keuzeKnop(esc(x.n), esc(x.d), () => slotKeuze(k))).join('')}</div>`;
  return `${score}${vPitch()}<div class="verhaal"><span class="label">${L.beker ? `${esc(L.beker.naam)} · ${esc(L.beker.ronde)}` : 'Live coachen'}</span>
    <p>${rust ? 'Rust. Je spelers zitten in de kleedkamer en kijken naar jou.' : 'De 70e minuut. Het kan nog alle kanten op.'}</p></div>
    ${vLiveWissels(L)}${rust ? vLiveTactiek(L) : ''}${keuzes}`;
}
function vLiveWissels(L){
  const sel = mijnSel(), o = opst(), over = 3 - L.wissels.length;
  const lf = x => L.moe && L.moe[x.n] != null ? L.moe[x.n] : fit(x);
  const basis = o.ids.map(n => sel.find(x => x.n === n)).filter(Boolean).filter(x => x.pos !== 'K').sort((a, b) => lf(a) - lf(b)).slice(0, 6);
  const rij = x => { const y = sel.filter(z => z.pos === x.pos && kan(z) && !o.ids.includes(z.n)).sort((a, b) => eff(b) - eff(a))[0], beter = y && liveEff(y, {moe:{}}) > liveEff(x, L);
    return `<tr><td>${esc(metVoorletter(x))} <span class="muted klein-tekst">${POS_NAAM[x.pos].toLowerCase()}</span></td><td>${x.k}</td><td class="${fitKl(lf(x))}">${Math.round(lf(x))}</td><td>${y && over > 0 ? knop(`${beter ? '✓ ' : ''}↔ ${metVoorletter(y)} (${y.k}, fris)`, () => liveWissel(x.n, y.n), beter ? 'klein aan' : 'klein', 'data-blijf') : ''}</td></tr>`; };
  return `<div class="paneel"><span class="label">Wissels · nog ${over} van 3</span>${L.wissels.length ? `<p class="klein-tekst">${L.wissels.map(w => `${esc(w.in)} erin voor ${esc(w.uit)}`).join(' · ')}</p>` : ''}<p class="muted klein-tekst">Na een helft zijn je spelers moe (fitheid hieronder). Een frisse invaller met ✓ is nu beter dan wie eruit gaat.</p>
    <table class="tabel trsel"><thead><tr><th>In het veld (moeste eerst)</th><th>Klasse</th><th>Fit</th><th></th></tr></thead><tbody>${basis.map(rij).join('')}</tbody></table></div>`;
}
function vLiveTactiek(L){
  return `<div class="paneel"><span class="label">Tactiek voor de tweede helft</span><div class="rij" style="gap:6px;flex-wrap:wrap">${Object.entries(TACTIEK).map(([k, x]) => knop(x.n, () => liveTactiek(k), `klein${L.tk === k ? ' aan' : ''}`, 'data-blijf')).join('')}</div></div>`;
}
// Het drama van deze week, bovenaan de tab Wedstrijd
export function vKleedkamerPaneel(){
  const D = S.trainer.drama; if (!D) return '';
  if (D.klaar) return `<div class="paneel"><span class="label">In de kleedkamer</span><p class="melding">${esc(D.uit)}</p></div>`;
  return `<div class="paneel"><span class="label">In de kleedkamer · eerst dit</span><p class="moment">${esc(dramaTekst(D))}</p>
    <div class="keuzes">${dramaOpties(D).map((o, i) => `<button class="keuze" data-i="${act(() => dramaKeuze(i))}" data-blijf><span class="t">${TOON[o.toon].i} ${esc(o.l)}</span><span class="s">${TOON[o.toon].n}</span></button>`).join('')}</div></div>`;
}
export const dramaOpen = () => !!(S.trainer.drama && !S.trainer.drama.klaar);
// De persconferentie voor de wedstrijd (niet verplicht)
export function vPersPaneel(){
  const P = S.trainer.pers; if (!P) return '';
  const V = persVragenTrainer(P), open = persOpenTrainer(P);
  const gedaan = V.filter(v => v.keuze != null).map(v => `<p class="muted">🎤 ${esc(v.vraag)}</p><p><b>Jij:</b> ${esc(v.opts[v.keuze].l)}</p><p class="melding">${esc(v.uit)}</p>`).join('');
  if (open < 0) return `<div class="paneel"><span class="label">Persconferentie</span>${gedaan}</div>`;
  const v = V[open];
  return `<div class="paneel"><span class="label">Persconferentie voor de wedstrijd (niet verplicht)${V.length > 1 ? ` · vraag ${open + 1} van ${V.length}` : ''}</span>${gedaan}<p class="moment">🎤 ${esc(v.vraag)}</p>
    <div class="keuzes">${v.opts.map((o, i) => `<button class="keuze" data-i="${act(() => persAntwoord(i, open))}" data-blijf><span class="t">${TOON[o.toon].i} ${esc(o.l)}</span><span class="s">${esc(o.s)}</span></button>`).join('')}</div></div>`;
}
// De prijzenkast: prijzen, diploma's, duels met andere trainers, je loopbaan
const icoon = p => /Trainer van het Jaar|Jeugdtrainer/.test(p) ? '⭐' : /^Kampioen/.test(p) ? '🏆' : '🥇';
export function vPrijzenkast(){
  const T0 = S.trainer, r = rivaalClub(), duels = Object.entries(T0.duels || {}).sort((a, b) => (b[1].w + b[1].g + b[1].v) - (a[1].w + a[1].g + a[1].v)).slice(0, 8);
  const rivN = r != null ? trainerVan(r) : null, f = Math.round(T0.fans ?? 50);
  return `<div class="paneel"><span class="label">Prijzenkast</span>${T0.prijzen.length ? `<div class="prijzen">${T0.prijzen.map(p => `<span class="prijs">${icoon(p)} ${esc(p)}</span>`).join('')}</div>` : '<p class="muted">Nog leeg. Daar gaan we wat aan doen.</p>'}
    <p>${Object.entries(DIPLOMAS).filter(([k]) => heeftDiploma(k)).map(([, x]) => `🎓 ${x.n}`).join(' · ')}</p>
    <p class="muted klein-tekst">${T0.totWed} wedstrijden als trainer, ${T0.totW} gewonnen (${T0.totWed ? Math.round(100 * T0.totW / T0.totWed) : 0}%). Reputatie ${Math.round(T0.rep)}.</p></div>
    <div class="paneel"><span class="label">De fans · ${f} van 100</span><p>${f >= 80 ? 'Ze zingen je naam. Je kunt bijna niets fout doen.' : f >= 55 ? 'De fans staan achter je.' : f >= 35 ? 'De fans twijfelen. Een paar goede resultaten helpen.' : 'De fans keren zich tegen je. Er hangen spandoeken.'}</p></div>
    <div class="paneel"><span class="label">Duels met andere trainers</span>${rivN ? `<p>Je aartsrivaal: <b>${esc(rivN)}</b> (${esc(CLUBS[r].n)}).</p>` : ''}
    ${duels.length ? `<table class="tabel"><thead><tr><th>Trainer</th><th>Club</th><th>W</th><th>G</th><th>V</th></tr></thead><tbody>${duels.map(([n, d]) => `<tr class="${n === rivN ? 'mij' : ''}"><td>${esc(n)}</td><td class="klein-tekst">${esc(d.club)}</td><td>${d.w}</td><td>${d.g}</td><td>${d.v}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Nog geen duels gespeeld.</p>'}</div>
    <div class="paneel"><span class="label">Je loopbaan</span>${T0.hist.slice().reverse().map(h => `<p class="muted klein-tekst">${esc(h)}</p>`).join('')}</div>`;
}
// Je privéleven: net als toen je speelde
export function vPriveTab(){
  const sp = S.sp, T0 = S.trainer, w = S.week || {tekst:[]}, G = sp.geboorte;
  return `<div class="paneel"><span class="label">Privé · ${seizoenLabel()}</span><p>Je salaris als trainer: <b>${geldTxt(T0.salaris || 0)}</b> per seizoen. Op je rekening: <b>${geldTxt(sp.geld)}</b>.</p>
    ${(w.tekst || []).map(t => `<p class="muted">${esc(t)}</p>`).join('')}
    ${G && G.opties ? `<p class="moment">Je ${G.jongen ? 'zoon' : 'dochter'} is geboren! Hoe gaat ${G.jongen ? 'hij' : 'zij'} heten?</p><div class="rij" style="gap:6px;flex-wrap:wrap">${G.opties.map(n => knop(esc(n), () => geefNaam(n), 'klein', 'data-blijf')).join('')}</div>` : ''}</div>
    ${S.week ? vBuiten() : ''}`;
}
