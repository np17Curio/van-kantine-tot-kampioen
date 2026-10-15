import { S, seizoenLabel, tmp } from '../../core/state.js';
import { act, keuzeKnop, knop, tabBalk } from '../../core/ui.js';
import { esc, geldTxt } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS, DIVS } from '../../data/gegevens.js';
import { clubLogo } from '../../data/logos.js';
import { fixture } from '../../game/competitie/competitie.js';
import { POS_NAAM, stand } from '../../game/competitie/spelers.js';
import { vormBolletjes, vormLabel } from '../../game/competitie/vorm.js';
import { metVoorletter, vKrant } from '../../game/media/nieuws.js';
import { BESPREKING, TACTIEK, TRAINING, kiesTrainerClub, stopTrainer, trainerAndereClub, trainerNieuwSeizoen, trainerVerder, trainerWedstrijd, zorgVoorTrainer } from '../../game/trainer.js';
import { score, status } from '../../game/trainer/bestuur.js';
import { FORMATIES, LINIE, elfKracht, fit, geldig, kiesFormatie, mijnSel, opst, refKracht, telling, vulBesteElf, wissel } from '../../game/trainer/ploeg.js';
import { MAX_SEL, accepteerBod, biedAan, koop, prijs, vensterOpen, weigerBod } from '../../game/trainer/transfers.js';

export function vTrainerAanbod(){
  const l = S.trainerAanbod || [];
  return `<div class="verhaal"><span class="label">${S.trainer && S.trainer.ontslagen ? 'Op zoek naar een nieuwe club' : 'Trainer worden'}</span><h2>Welke club wil jij trainen?</h2>
    <p>${S.trainer && S.trainer.ontslagen ? 'Na je ontslag bellen er een paar clubs. Het niveau is wat lager, maar het is een nieuwe kans.' : 'Je naam en je prijzen openen deuren. Deze clubs bellen je.'}</p></div>
    <div class="aanbod">${l.map(id => `<div class="bod"><div class="club">${clubLogo(id, 40)}<span>${esc(CLUBS[id].n)}</span></div><span class="niv">${DIVS[CLUBS[id].t]} · sterkte ${CLUBS[id].s}</span>${keuzeKnop('Trainer worden', '', () => kiesTrainerClub(id))}</div>`).join('')}</div>
    ${S.trainer && S.trainer.ontslagen ? knop('Stoppen met trainen', () => stopTrainer()) : ''}`;
}
const STAAT = {gehaald:['Gehaald', 'r-veilig'], koers:['Op koers', 'r-gem'], bijna:['Net niet', 'r-gem'], gevaar:['In gevaar', 'r-riskant']};
function vEisen(kort){
  const T0 = S.trainer, E = T0.eisen;
  return `<div class="paneel eisen-bestuur"><span class="label">Eisen van het bestuur · ${seizoenLabel()}${E.halverwege ? ' · halverwege gesteld' : ''}</span>
    ${E.lijst.map((e, i) => { const s = status(e), [l, cls] = STAAT[s.staat]; return `<div class="eisrij"><span>${i === 0 ? '<b>Hoofdeis</b> · ' : ''}${esc(e.tekst)}</span><span class="muted klein-tekst">${esc(s.tekst)}</span><span class="risico ${cls}">${l}</span></div>`; }).join('')}
    ${kort ? '' : `<p class="muted klein-tekst">De hoofdeis telt dubbel (net gemist: 1 punt). Haal je aan het einde van het seizoen minder dan 2 van de 4 punten, dan word je ontslagen. Met 3 of 4 punten krijg je extra budget. Nu: ${score()} van de 4.</p>`}</div>`;
}
function vWedstrijdTab(){
  const T0 = S.trainer, c = CLUBS[T0.club], fx = fixture(S.ronde), opp = CLUBS[fx.opp], o = opst(), ok = geldig();
  const kies = (obj, sleutel) => `<div class="keuzes" style="margin-top:6px">${Object.entries(obj).map(([k, x]) => `<button class="keuze ${T0[sleutel] === k ? 'aan' : ''}" data-i="${act(() => { T0[sleutel] = T0[sleutel] === k && sleutel === 'bespreking' ? null : k; })}" data-blijf aria-pressed="${T0[sleutel] === k}"><span class="t">${x.n}</span><span class="s">${x.d}</span></button>`).join('')}</div>`;
  const vl = id => { const [l, cls] = vormLabel(id); return `${vormBolletjes(id)} <span class="risico ${cls}">${l}</span>`; };
  return `<div class="vooruit"><span class="label">Wedstrijd ${S.ronde + 1} van ${AANTAL_RONDES} · ${fx.thuis ? 'thuis' : 'uit'}</span>
      <div class="vs"><div class="ploeg mij">${clubLogo(T0.club, 40)}<b>${esc(c.n)}</b></div><span class="vsteken">vs</span><div class="ploeg r"><b>${esc(opp.n)}</b>${clubLogo(fx.opp, 40)}</div></div>
      <p class="opst"><span class="label">Sterkte</span><b>${c.s}</b><span class="muted">tegen</span><b>${opp.s}</b><span class="label">Vorm</span>${vl(T0.club)}<span class="muted">tegen</span>${vl(fx.opp)}</p>
      <p class="opst"><span class="label">Opstelling</span><b>${o.formatie}</b><span class="muted">elf ${elfKracht().toFixed(1)} · beste mogelijke ${refKracht().toFixed(1)}</span>${ok ? '' : '<span class="risico r-riskant">Niet compleet</span>'}${knop('Wijzigen', () => { tmp.trTab = 'opstelling'; }, 'klein', 'data-blijf')}</p></div>
    <div><span class="label">Tactiek</span>${kies(TACTIEK, 'tactiek')}</div>
    <div><span class="label">Teambespreking voor de wedstrijd (niet verplicht)</span>${kies(BESPREKING, 'bespreking')}</div>
    <p class="muted klein-tekst">Training deze week: <b>${TRAINING[T0.training] ? TRAINING[T0.training].n : 'geen'}</b> · ${knop('Wijzigen', () => { tmp.trTab = 'training'; }, 'klein', 'data-blijf')}</p>
    ${ok ? knop(`Speel: ${fx.thuis ? esc(c.n) + ' – ' + esc(opp.n) : esc(opp.n) + ' – ' + esc(c.n)}`, trainerWedstrijd)
         : `<p class="melding">Je opstelling klopt niet (er ontbreekt iemand of er staat een geblesseerde speler in).</p>${knop('Beste elf invullen en spelen', () => { vulBesteElf(); trainerWedstrijd(); })}`}`;
}
function vOpstellingTab(){
  const o = opst(), sel = mijnSel(), t = telling(), f = FORMATIES[o.formatie];
  const teller = `K ${t.K}/1 · V ${t.V}/${f.V} · M ${t.M}/${f.M} · A ${t.A}/${f.A}`;
  return `<div class="paneel"><span class="label">Formatie</span><div class="rij formaties">${Object.keys(FORMATIES).map(k => knop(k, () => kiesFormatie(k), `klein${o.formatie === k ? ' actief' : ''}`, 'data-blijf')).join('')}</div>
    <p class="opst"><span class="label">Basis</span><b>${teller}</b>${geldig() ? '<span class="risico r-veilig">Compleet</span>' : '<span class="risico r-riskant">Niet compleet</span>'}<span class="muted">elf ${elfKracht().toFixed(1)} · beste ${refKracht().toFixed(1)}</span>${knop('Beste elf', vulBesteElf, 'klein', 'data-blijf')}</p></div>
    ${LINIE.map(pos => `<div class="paneel"><span class="label">${POS_NAAM[pos]}s</span><table class="tabel trsel"><thead><tr><th>Speler</th><th>Lft</th><th>Klasse</th><th>Fit</th><th></th></tr></thead><tbody>${sel.filter(x => x.pos === pos).sort((a, b) => b.k - a.k).map(x => {
      const inElf = o.ids.includes(x.n), bles = x.bles > 0, f2 = Math.round(fit(x));
      return `<tr class="${inElf ? 'mij' : ''}"><td>${esc(metVoorletter(x))}${bles ? ` <span class="fouttxt klein-tekst">geblesseerd (${x.bles} wk)</span>` : ''}</td><td>${x.lft ?? ''}</td><td><b>${x.k}</b></td><td class="${f2 < 60 ? 'fouttxt' : f2 < 80 ? '' : 'goedtxt'}">${f2}</td><td>${bles ? '' : knop(inElf ? 'Basis' : 'Bank', () => wissel(x.n), `klein${inElf ? ' actief' : ''}`, 'data-blijf')}</td></tr>`;
    }).join('')}</tbody></table></div>`).join('')}`;
}
function vTransferTab(){
  const T0 = S.trainer, sel = mijnSel();
  if (!vensterOpen()) return `<div class="paneel"><span class="label">Transfers</span><p>Het transfervenster is dicht. ${S.ronde < 7 ? 'Het gaat weer open in de winterstop (na wedstrijd 7).' : 'Het gaat weer open in de zomer.'}</p><p class="muted">Budget: <b>${geldTxt(T0.budget)}</b></p></div>`;
  const m = tmp.trMelding ? `<p class="melding">${esc(tmp.trMelding)}</p>` : '';
  const zeg = fn => () => { tmp.trMelding = fn(); };
  return `<div class="paneel"><span class="label">Transfervenster (${T0.venster}) · budget ${geldTxt(T0.budget)} · selectie ${sel.length}/${MAX_SEL}</span>${m}
    ${T0.bod ? `<div class="melding">${esc(CLUBS[T0.bod.koper].n)} biedt <b>${geldTxt(T0.bod.som)}</b> voor ${esc(metVoorletter(sel.find(x => x.n === T0.bod.naam) || {v:'', n:T0.bod.naam}))}. ${knop('Accepteren', zeg(accepteerBod), 'klein', 'data-blijf')}${knop('Weigeren', () => { weigerBod(); tmp.trMelding = 'Je houdt hem.'; }, 'klein', 'data-blijf')}</div>` : ''}</div>
    <div class="paneel"><span class="label">Op de markt</span><table class="tabel trsel"><thead><tr><th>Speler</th><th>Club</th><th>Lft</th><th>Klasse</th><th>Prijs</th><th></th></tr></thead><tbody>${(T0.markt || []).map((x, i) =>
      `<tr><td>${esc(metVoorletter(x))} <span class="muted klein-tekst">${POS_NAAM[x.pos].toLowerCase()}${x.basis ? ', basis' : ''}</span></td><td class="klein-tekst">${esc(CLUBS[x.van].n)}</td><td>${x.lft}</td><td><b>${x.k}</b></td><td>${geldTxt(x.tegenbod || x.prijs)}${x.tegenbod ? ' <span class="klein-tekst muted">(tegenbod)</span>' : ''}</td><td>${knop('Koop', zeg(() => koop(i)), 'klein', 'data-blijf')}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Geen spelers meer op de markt.</td></tr>'}</tbody></table></div>
    <div class="paneel"><span class="label">Jouw selectie: verkopen</span><table class="tabel trsel"><thead><tr><th>Speler</th><th>Lft</th><th>Klasse</th><th>Waarde</th><th></th></tr></thead><tbody>${sel.slice().sort((a, b) => b.k - a.k).map(x =>
      `<tr class="${x.basis ? 'mij' : ''}"><td>${esc(metVoorletter(x))} <span class="muted klein-tekst">${POS_NAAM[x.pos].toLowerCase()}</span></td><td>${x.lft ?? ''}</td><td><b>${x.k}</b></td><td>${geldTxt(prijs(x))}</td><td>${knop('Aanbieden', zeg(() => biedAan(x.n)), 'klein', 'data-blijf')}</td></tr>`).join('')}</tbody></table></div>`;
}
function vTrainingTab(){
  const T0 = S.trainer;
  return `<div><span class="label">Wat doe je deze week op de training?</span><div class="keuzes" style="margin-top:6px">${Object.entries(TRAINING).map(([k, x]) => `<button class="keuze ${T0.training === k ? 'aan' : ''}" data-i="${act(() => { T0.training = k; })}" data-blijf aria-pressed="${T0.training === k}"><span class="t">${x.n}</span><span class="s">${x.d}</span></button>`).join('')}</div></div>`;
}
function vBestuurTab(){
  const T0 = S.trainer, b = T0.bestuur >= 60 ? ['Tevreden', 'r-veilig'] : T0.bestuur >= 35 ? ['Afwachtend', 'r-gem'] : ['Ongeduldig', 'r-riskant'];
  return `${vEisen(false)}<div class="paneel"><span class="label">Vertrouwen van het bestuur</span><p class="opst"><span class="risico ${b[1]}">${b[0]}</span><span class="muted">${Math.round(T0.bestuur)} van 100</span></p>
    <p class="muted klein-tekst">Het vertrouwen stijgt door winst en zakt door verlies, en ook als je hoofdeis in gevaar komt. Zakt het onder de 15, dan word je ook midden in het seizoen ontslagen.</p></div>`;
}
export function vTrainer(){
  zorgVoorTrainer();
  const T0 = S.trainer, c = CLUBS[T0.club], pl = stand(c.t).indexOf(T0.club) + 1;
  if (!T0.eisen.gezien) return `<div class="verhaal"><span class="label">Trainer van ${esc(c.n)} · ${seizoenLabel()}</span><h2>De eisen van het bestuur</h2>
      <p>De voorzitter roept je bij zich: "Dit verwachten we ${T0.eisen.halverwege ? 'de rest van' : ''} dit seizoen van je." ${c.n} is op papier de nummer ${T0.eisen.rang} van de ${DIVS[c.t]}.</p></div>
    ${vEisen(false)}<p class="muted">Budget voor transfers: <b>${geldTxt(T0.budget)}</b>${vensterOpen() ? ' · het transfervenster is open' : ''}.</p>${knop('Begrepen', () => { T0.eisen.gezien = true; })}`;
  const tab = tmp.trTab || 'wedstrijd';
  const tabs = [['wedstrijd', 'Wedstrijd'], ['opstelling', 'Opstelling', geldig() ? null : '!'], ['transfers', 'Transfers', vensterOpen() ? '!' : null], ['training', 'Training'], ['bestuur', 'Bestuur', T0.eisen.lijst.some(e => status(e).staat === 'gevaar') ? '!' : null]];
  const inhoud = {wedstrijd:vWedstrijdTab, opstelling:vOpstellingTab, transfers:vTransferTab, training:vTrainingTab, bestuur:vBestuurTab}[tab]();
  return `<div class="verhaal"><span class="label">Trainer van ${esc(c.n)} · week ${S.ronde + 1} van ${AANTAL_RONDES}${S.ronde ? ` · ${pl}e` : ''}</span></div>
    ${T0.bestuur < 35 ? '<p class="melding" style="color:var(--fout);border-color:var(--fout)">Het bestuur wordt ongeduldig. Nog een paar nederlagen en je wordt ontslagen.</p>' : ''}
    ${tabBalk(tabs, tab, k => { tmp.trTab = k; tmp.trMelding = null; })}<div class="trinhoud">${inhoud}</div>${tab === 'wedstrijd' ? vKrant((S.krantWacht || []).slice(0, 4)) : ''}
    <div class="rij">${knop('Stoppen als trainer', () => { tmp.stopTrainerVraag = true; }, 'klein', 'data-blijf')}${tmp.stopTrainerVraag ? `<span class="muted">Zeker weten?</span>${knop('Ja, stoppen', () => { tmp.stopTrainerVraag = false; stopTrainer(); }, 'klein')}${knop('Nee', () => { tmp.stopTrainerVraag = false; }, 'klein', 'data-blijf')}` : ''}</div>`;
}
export function vTrainerUitslag(){
  const T0 = S.trainer, L = T0.laatste, c = CLUBS[T0.club], uit = L.a > L.b ? 'Gewonnen' : L.a < L.b ? 'Verloren' : 'Gelijkgespeeld';
  const [th, tu, sh, su] = L.thuis ? [c.n, L.opp, L.a, L.b] : [L.opp, c.n, L.b, L.a];
  return `<div class="score"><div class="team ${L.thuis ? 'mij' : ''}">${esc(th)}</div><div class="stand">${sh}-${su}<span class="min">EINDE</span></div><div class="team r ${!L.thuis ? 'mij' : ''}">${esc(tu)}</div></div>
    <div class="verhaal"><span class="label">${uit} · tactiek: ${TACTIEK[L.tk].n.toLowerCase()}</span>${L.regels.map(r => `<p>${esc(r)}</p>`).join('')}<p class="muted">Jullie staan nu ${L.plek}e.</p>
    ${T0.ontslag ? '<p class="melding" style="color:var(--fout);border-color:var(--fout)">Het bestuur heeft genoeg gezien. Je bent ontslagen.</p>' : ''}</div>
    ${vKrant(S.krantWacht)}
    ${knop(T0.ontslag ? 'Op zoek naar een nieuwe club' : S.ronde >= AANTAL_RONDES ? 'Seizoen afsluiten' : S.ronde === 7 ? 'Naar de winterstop (transfervenster)' : 'Volgende week', () => { S.krantWacht = []; tmp.trTab = S.ronde === 7 ? 'transfers' : tmp.trTab; tmp.trMelding = null; trainerVerder(); })}`;
}
export function vTrainerSeizoen(){
  const E = S.trainerEind, T0 = S.trainer, B = E.bestuur;
  const ontslagen = B && B.uit === 'ontslag';
  return `<div class="verhaal"><span class="label">Einde seizoen ${seizoenLabel()} · trainer</span><h2>${E.plek === 1 ? 'Kampioen!' : `${E.plek}e plaats`}</h2><p>${esc(E.clubNaam)} eindigt als ${E.plek}e in de ${DIVS[E.t]}.</p></div>
    ${E.plek === 1 ? `<div class="kampioen"><span class="label">Kampioen als trainer</span><h2>🏆 ${esc(E.clubNaam)}</h2><p>Je spelers gooien je in de lucht. Als speler was het mooi, maar dit voelt nog beter.</p></div>` : ''}
    ${E.mijn ? (E.mijn.naar < E.mijn.van ? `<p class="melding">Promotie naar de ${DIVS[E.mijn.naar]}!</p>` : `<p class="melding" style="color:var(--fout);border-color:var(--fout)">Degradatie naar de ${DIVS[E.mijn.naar]}.</p>`) : ''}
    ${B ? `<div class="paneel eisen-bestuur"><span class="label">Het oordeel van het bestuur · ${B.score} van 4 punten</span>${B.lijst.map((e, i) => `<div class="eisrij"><span>${i === 0 ? '<b>Hoofdeis</b> · ' : ''}${esc(e.eis)}</span><span class="muted klein-tekst">${esc(e.voortgang || '')}</span><span class="risico ${e.ok ? 'r-veilig' : e.bijna ? 'r-gem' : 'r-riskant'}">${e.ok ? 'Gehaald' : e.bijna ? 'Net niet (1 punt)' : 'Niet gehaald'}</span></div>`).join('')}
      <p class="${ontslagen ? 'fouttxt' : B.uit === 'tevreden' ? 'goedtxt' : ''}">${esc(B.tekst)}</p></div>` : ''}
    <p class="muted">Als trainer: ${T0.totWed} wedstrijden, ${T0.totW} gewonnen (${T0.totWed ? Math.round(100 * T0.totW / T0.totWed) : 0}%). Je trainersreputatie: <b>${Math.round(T0.rep)}</b>${T0.rep >= 52 ? ' · topclubs kennen je naam' : ''}.${E.plek <= 3 ? ' De club investeert: het team wordt sterker.' : ''}</p>
    ${ontslagen ? knop('Op zoek naar een nieuwe club', trainerAndereClub) : knop('Volgend seizoen', trainerNieuwSeizoen) + knop('Andere club zoeken', trainerAndereClub, 'hoofd tweede')}`;
}
export function vTrainerSamenvatting(){
  const T0 = S.trainer;
  return `<div class="paneel"><span class="label">Trainerscarrière</span><p>${T0.seizoenen} ${T0.seizoenen === 1 ? 'seizoen' : 'seizoenen'} · ${T0.totWed} wedstrijden · ${T0.totW} gewonnen${T0.ontslagen ? ` · ${T0.ontslagen}x ontslagen` : ''}</p>
    ${T0.prijzen.length ? `<div class="prijzen">${T0.prijzen.map(p => `<span class="prijs">${esc(p)}</span>`).join('')}</div>` : ''}${T0.hist.map(h => `<p class="muted">${esc(h)}</p>`).join('')}</div>`;
}
export function vZijTrainer(){
  const T0 = S.trainer, c = CLUBS[T0.club], st = stand(c.t);
  return `<div class="kaart"><span class="label">Trainer</span><div class="naam">${esc(S.sp.naam)}</div><p class="muted">${S.sp.leeftijd} jaar · ${esc(c.n)}</p>
    <div class="feiten"><div><span class="label">Dit seizoen</span><b>${T0.w}W ${T0.g}G ${T0.v}V</b></div><div><span class="label">Totaal</span><b>${T0.totW} van ${T0.totWed}</b></div><div><span class="label">Reputatie</span><b>${Math.round(T0.rep)}</b></div><div><span class="label">Clubsterkte</span><b>${c.s}</b></div><div><span class="label">Budget</span><b>${geldTxt(T0.budget || 0)}</b></div></div>
    ${T0.prijzen.length ? `<div class="prijzen">${T0.prijzen.map(p => `<span class="prijs">${esc(p)}</span>`).join('')}</div>` : ''}</div>
    <div class="kaart"><h3>${DIVS[c.t]}</h3><div class="tabelwrap"><table class="tabel"><thead><tr><th>#</th><th>Club</th><th>G</th><th>DS</th><th>Pt</th><th class="vk">Vorm</th></tr></thead><tbody>${st.map((id, i) => { const e = S.tab[id]; return `<tr class="${id === T0.club ? 'mij' : ''}"><td>${i + 1}</td><td><span class="clubnaam">${clubLogo(id, 16)}${esc(CLUBS[id].n)}</span></td><td>${e.g}</td><td>${e.dv - e.dt > 0 ? '+' : ''}${e.dv - e.dt}</td><td>${e.pt}</td><td class="vk">${vormBolletjes(id)}</td></tr>`; }).join('')}</tbody></table></div></div>`;
}
