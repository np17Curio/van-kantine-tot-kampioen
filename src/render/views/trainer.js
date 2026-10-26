import { S, seizoenLabel, tmp } from '../../core/state.js';
import { act, keuzeKnop, knop, tabBalk } from '../../core/ui.js';
import { esc, geldTxt } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS, DIVS, WINTER, rondesVan, rondesVoor } from '../../data/gegevens.js';
import { clubLogo } from '../../data/logos.js';
import { POS_NAAM, stand } from '../../game/competitie/spelers.js';
import { vormBolletjes, vormLabel } from '../../game/competitie/vorm.js';
import { metVoorletter, vKrant } from '../../game/media/nieuws.js';
import { BESPREKING, TACTIEK, TRAINING, kiesTrainerClub, stopTrainer, trainerAndereClub, trainerNieuwSeizoen, trainerVerder, trainerWedstrijd, zorgVoorTrainer } from '../../game/trainer.js';
import { score, status } from '../../game/trainer/bestuur.js';
import { FORMATIES, LINIE, elfKracht, fit, geldig, kiesFormatie, mijnSel, opst, refKracht, telling, vulBesteElf, wissel } from '../../game/trainer/ploeg.js';
import { MAX_SEL, accepteerBod, biedAan, koop, prijs, vensterOpen, vraagVersterking, weigerBod } from '../../game/trainer/transfers.js';
import { ASSISTENTEN, DIPLOMAS, NIVEAUS, STAF, assistent, assistentAdvies, assistentKost, coach, neemAssistent, ontslaAssistent, pasAdviesToe, cursusAntwoord, cursusPrijs, cursusWanneer, DOOR_WED, doorstroom, heeftDiploma, kanDoorstromen, o23Stand, ontslaStaf, sluitCursus, startCursus, stafKosten, trainerNiveau, volgendNiveau, volgendeCursus, vraagStaf, zwaksteBasis } from '../../game/trainer/loopbaan.js';
import { startLive, startTrainer, trainerVrij, volgendeWedstrijd } from '../../game/trainer.js';
import { dramaOpen, vKleedkamerPaneel, vPersPaneel, vPrijzenkast, vPriveTab } from './trainer-extra.js';
import { vPitch } from '../pitch.js';

export function vTrainerAanbod(){
  const l = S.trainerAanbod || [], o23 = !!S.trainerAanbodO23, E = S.trainerEind, ontsl = S.trainer && S.trainer.ontslagen;
  const uitleg = o23 ? (E && E.o23 && E.bestuur && E.bestuur.uit === 'tevreden' && !heeftDiploma('A') ? 'Je deed het goed bij de O23, maar zonder UEFA A-diploma mag je nog geen eerste elftal trainen. Deze O23-teams willen je wel.'
      : 'Met je UEFA B-diploma begin je bij de jeugd. Doe het goed bij een O23 en de eerste elftallen weten je te vinden.')
    : ontsl ? 'Na je ontslag bellen er een paar clubs. Het niveau is wat lager, maar het is een nieuwe kans.' : `Je werk valt op. Deze clubs zoeken een hoofdtrainer.${heeftDiploma('Pro') ? '' : ' (Met je UEFA A-diploma mag je de tweede league trainen; voor de hoogste league heb je UEFA Pro nodig.)'}`;
  return `<div class="verhaal"><span class="label">${ontsl ? 'Op zoek naar een nieuwe club' : 'Trainer worden'}</span><h2>${o23 ? 'Welk O23-team wil jij trainen?' : 'Welke club wil jij trainen?'}</h2>
    <p>${esc(uitleg)}</p></div>
    <div class="aanbod">${l.map(id => `<div class="bod"><div class="club">${clubLogo(id, 40)}<span>${esc(CLUBS[id].n)}${o23 ? ' O23' : ''}</span></div><span class="niv">${DIVS[CLUBS[id].t]} · sterkte ${o23 ? `O23 ±${CLUBS[id].s - 10}` : CLUBS[id].s}</span>${keuzeKnop(o23 ? 'Trainer van de O23' : 'Trainer worden', '', () => kiesTrainerClub(id))}</div>`).join('')}</div>
    ${S.trainer && S.trainer.ontslagen ? knop('Stoppen met trainen', () => stopTrainer()) : ''}`;
}
const STAAT = {gehaald:['Gehaald', 'r-veilig'], koers:['Op koers', 'r-gem'], bijna:['Net niet', 'r-gem'], gevaar:['In gevaar', 'r-riskant']};
function vEisen(kort){
  const T0 = S.trainer, E = T0.eisen;
  return `<div class="paneel eisen-bestuur"><span class="label">Eisen van ${T0.o23 ? 'de technisch directeur' : 'het bestuur'} · ${seizoenLabel()}${E.halverwege ? ' · halverwege gesteld' : ''}</span>
    ${E.lijst.map((e, i) => { const s = status(e), [l, cls] = STAAT[s.staat]; return `<div class="eisrij"><span>${i === 0 ? '<b>Hoofdeis</b> · ' : ''}${esc(e.tekst)}</span><span class="muted klein-tekst">${esc(s.tekst)}</span><span class="risico ${cls}">${l}</span></div>`; }).join('')}
    ${kort ? '' : `<p class="muted klein-tekst">De hoofdeis telt dubbel (net gemist: 1 punt). Haal je aan het einde van het seizoen minder dan 2 van de 4 punten, dan word je ontslagen. Met 3 of 4 punten krijg je extra budget. Nu: ${score()} van de 4.</p>`}</div>`;
}
function vWedstrijdTab(){
  const T0 = S.trainer, c = CLUBS[T0.club], fx = volgendeWedstrijd(); if (!fx) return `<div class="vooruit"><span class="label">Speelvrije week</span><p>Jouw league speelt deze week niet.</p>${knop('Volgende week', trainerVrij)}</div>`;
  const opp = CLUBS[fx.opp], o = opst(), ok = geldig(), o23 = T0.o23, wij = o23 ? `${c.n} O23` : c.n, zij = o23 ? `${opp.n} O23` : opp.n;
  const kies = (obj, sleutel) => `<div class="keuzes" style="margin-top:6px">${Object.entries(obj).map(([k, x]) => `<button class="keuze ${T0[sleutel] === k ? 'aan' : ''}" data-i="${act(() => { T0[sleutel] = T0[sleutel] === k && sleutel === 'bespreking' ? null : k; })}" data-blijf aria-pressed="${T0[sleutel] === k}"><span class="t">${x.n}</span><span class="s">${x.d}</span></button>`).join('')}</div>`;
  const vl = id => { const [l, cls] = vormLabel(id); return `${vormBolletjes(id)} <span class="risico ${cls}">${l}</span>`; };
  return `${vKleedkamerPaneel()}${vPersPaneel()}<div class="vooruit"><span class="label">${fx.beker ? `🏆 ${esc(fx.beker.naam)} · ${esc(fx.beker.ronde)}` : `Wedstrijd ${rondesVoor(c.t, S.ronde) + 1} van ${rondesVan(c.t)}`} · ${fx.thuis ? 'thuis' : 'uit'}</span>
      <div class="vs"><div class="ploeg mij">${clubLogo(T0.club, 40)}<b>${esc(wij)}</b></div><span class="vsteken">vs</span><div class="ploeg r"><b>${esc(zij)}</b>${clubLogo(fx.opp, 40)}</div></div>
      ${o23 ? `<p class="opst"><span class="label">Sterkte</span><b>${elfKracht().toFixed(0)}</b><span class="muted">tegen ongeveer</span><b>${opp.s - 9}</b></p>` : `<p class="opst"><span class="label">Sterkte</span><b>${c.s}</b><span class="muted">tegen</span><b>${opp.s}</b><span class="label">Vorm</span>${vl(T0.club)}<span class="muted">tegen</span>${vl(fx.opp)}</p>`}
      <p class="opst"><span class="label">Opstelling</span><b>${o.formatie}</b><span class="muted">elf ${elfKracht().toFixed(1)} · beste mogelijke ${refKracht().toFixed(1)}</span>${ok ? '' : '<span class="risico r-riskant">Niet compleet</span>'}${knop('Wijzigen', () => { tmp.trTab = 'opstelling'; }, 'klein', 'data-blijf')}</p></div>
    ${vAdvies()}
    <div><span class="label">Tactiek</span>${kies(TACTIEK, 'tactiek')}</div>
    <div><span class="label">Teambespreking voor de wedstrijd (niet verplicht)</span>${kies(BESPREKING, 'bespreking')}</div>
    <p class="muted klein-tekst">Training deze week: <b>${TRAINING[T0.training] ? TRAINING[T0.training].n : 'geen'}</b> · ${knop('Wijzigen', () => { tmp.trTab = 'training'; }, 'klein', 'data-blijf')}</p>
    ${dramaOpen() ? '<p class="melding">Los eerst het probleem in de kleedkamer op (bovenaan).</p>'
      : ok ? `<p class="muted klein-tekst">${fx.thuis ? esc(wij) + ' – ' + esc(zij) : esc(zij) + ' – ' + esc(wij)}</p>${knop('▶ Speel live (coachen in de rust)', startLive)}${knop('⏩ Snel spelen', trainerWedstrijd, 'hoofd tweede')}`
      : `<p class="melding">Je opstelling klopt niet (er ontbreekt iemand of er staat een geblesseerde speler in).</p>${knop('Beste elf invullen en live spelen', () => { vulBesteElf(); startLive(); })}${knop('Beste elf en snel spelen', () => { vulBesteElf(); trainerWedstrijd(); }, 'hoofd tweede')}`}`;
}
// Het advies van je assistent-trainer voor deze wedstrijd
function vAdvies(){
  const A = assistent();
  if (!A) return `<p class="muted klein-tekst">Hulp nodig bij je opstelling? Neem een assistent-trainer aan in de tab ${knop('Staf & cursus', () => { tmp.trTab = 'staf'; }, 'klein', 'data-blijf')}.</p>`;
  const a = assistentAdvies(); if (!a) return '';
  const sel = mijnSel(), lijn = pos => a.ids.map(n => sel.find(x => x.n === n)).filter(x => x && x.pos === pos).map(x => { const f = Math.round(fit(x)); return `${esc(metVoorletter(x))} <span class="${f < 60 ? 'fouttxt' : f < 80 ? '' : 'goedtxt'}">(${f})</span>`; }).join(', ');
  return `<div class="paneel"><span class="label">Advies van je assistent · ${esc(A.naam)} (${ASSISTENTEN[A.q - 1].n.toLowerCase()})</span>
    ${a.regels.map(r => `<p>"${esc(r)}"</p>`).join('')}
    <details><summary class="label" style="cursor:pointer">Zijn opstelling: ${a.f} · kracht ${a.kracht.toFixed(1).replace('.', ',')} (jouw elf ${a.nu.toFixed(1).replace('.', ',')}) · fitheid ${Math.round(a.fit)}</summary>
      <p class="klein-tekst">${LINIE.map(p => `<b>${POS_NAAM[p]}${p === 'K' ? '' : 's'}</b>: ${lijn(p)}`).join('<br>')}</p></details>
    <div class="rij" style="gap:8px;align-items:center;flex-wrap:wrap">${a.zelfde ? '<span class="risico r-veilig">Je volgt zijn advies</span>' : knop('Advies overnemen', () => { pasAdviesToe(); }, 'klein', 'data-blijf')}
      <label class="klein-tekst"><input type="checkbox" data-i="${act(() => { A.auto = !A.auto; })}" ${A.auto ? 'checked' : ''}> Laat de assistent elke week de opstelling maken</label></div></div>`;
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
  const zeg = fn => () => { tmp.trMelding = fn(); }, N = trainerNiveau(), beg = N.k === 'beginnend';
  return `<div class="paneel"><span class="label">Transfervenster (${T0.venster}) · budget ${geldTxt(T0.budget)} · selectie ${sel.length}/${MAX_SEL}</span>${m}
    <p class="klein-tekst">Jouw trainersniveau: <b>${N.n}</b>. ${esc(N.d)}${N.maxKoop ? ` (Deze periode gekocht: ${T0.gekochtVenster || 0} van ${N.maxKoop}.)` : ''}</p>
    ${beg ? (T0.versterkingGevraagd ? '<p class="muted klein-tekst">Je hebt deze transferperiode al om een versterking gevraagd.</p>' : knop('Vraag de technisch directeur om een versterking', zeg(vraagVersterking), 'klein', 'data-blijf')) : ''}
    ${T0.bod ? `<div class="melding">${esc(CLUBS[T0.bod.koper].n)} biedt <b>${geldTxt(T0.bod.som)}</b> voor ${esc(metVoorletter(sel.find(x => x.n === T0.bod.naam) || {v:'', n:T0.bod.naam}))}. ${knop('Accepteren', zeg(accepteerBod), 'klein', 'data-blijf')}${knop('Weigeren', () => { weigerBod(); tmp.trMelding = 'Je houdt hem.'; }, 'klein', 'data-blijf')}</div>` : ''}</div>
    <div class="paneel"><span class="label">Op de markt</span><table class="tabel trsel"><thead><tr><th>Speler</th><th>Club</th><th>Lft</th><th>Klasse</th><th>Prijs</th><th></th></tr></thead><tbody>${(T0.markt || []).map((x, i) =>
      `<tr><td>${esc(metVoorletter(x))} <span class="muted klein-tekst">${POS_NAAM[x.pos].toLowerCase()}${x.basis ? ', basis' : ''}</span></td><td class="klein-tekst">${esc(CLUBS[x.van].n)}</td><td>${x.lft}</td><td><b>${x.k}</b></td><td>${geldTxt(x.tegenbod || x.prijs)}${x.tegenbod ? ' <span class="klein-tekst muted">(tegenbod)</span>' : ''}</td><td>${beg ? '' : knop('Koop', zeg(() => koop(i)), 'klein', 'data-blijf')}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Geen spelers meer op de markt.</td></tr>'}</tbody></table></div>
    <div class="paneel"><span class="label">Jouw selectie: verkopen</span><table class="tabel trsel"><thead><tr><th>Speler</th><th>Lft</th><th>Klasse</th><th>Waarde</th><th></th></tr></thead><tbody>${sel.slice().sort((a, b) => b.k - a.k).map(x =>
      `<tr class="${x.basis ? 'mij' : ''}"><td>${esc(metVoorletter(x))} <span class="muted klein-tekst">${POS_NAAM[x.pos].toLowerCase()}</span></td><td>${x.lft ?? ''}</td><td><b>${x.k}</b></td><td>${geldTxt(prijs(x))}</td><td>${beg ? '' : knop('Aanbieden', zeg(() => biedAan(x.n)), 'klein', 'data-blijf')}</td></tr>`).join('')}</tbody></table></div>`;
}
// De O23: je talenten, hoeveel ze gegroeid zijn, en wie klaar is voor het eerste elftal
function vTalentenTab(){
  const T0 = S.trainer, sel = mijnSel(), grens = zwaksteBasis(T0.club) - 3, m = tmp.trMelding ? `<p class="melding">${esc(tmp.trMelding)}</p>` : '';
  const pot = x => { const d = (x.pot || x.k) - x.k; return d >= 9 ? ['groot talent', 'goedtxt'] : d >= 4 ? ['kan nog groeien', ''] : ['bijna op zijn top', 'muted']; };
  return `<div class="paneel"><span class="label">Talenten · ${T0.sz.door || 0} doorgestroomd dit seizoen</span>${m}
    <p class="klein-tekst">Een talent mag naar het eerste elftal van ${esc(CLUBS[T0.club].n)} als hij minstens klasse <b>${grens}</b> is (de zwakste basisspeler daar min 3) en ${DOOR_WED} keer in de basis stond bij de O23. Training "Jeugd ontwikkelen" en een jeugdtrainer laten ze sneller groeien.</p>
    <table class="tabel trsel"><thead><tr><th>Speler</th><th>Lft</th><th>Klasse</th><th>Groei</th><th>Talent</th><th></th></tr></thead><tbody>${sel.slice().sort((a, b) => b.k - a.k).map(x => { const [pl, pc] = pot(x), g = x.k - (x.kStart ?? x.k);
      return `<tr class="${x.basis ? 'mij' : ''}"><td>${esc(metVoorletter(x))} <span class="muted klein-tekst">${POS_NAAM[x.pos].toLowerCase()}</span></td><td>${x.lft}</td><td><b>${x.k}</b></td><td class="${g >= 3 ? 'goedtxt' : ''}">${g > 0 ? '+' + g : '0'}</td><td class="klein-tekst ${pc}">${pl}</td><td>${kanDoorstromen(x) ? knop('Naar het eerste', () => { tmp.trMelding = doorstroom(x.n); }, 'klein', 'data-blijf') : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
}
// Het examen van een trainerscursus (in de cursus-fase en in de tab Staf & cursus)
function vExamen(klaarKnop){
  const K = coach().cursus; if (!K) return '';
  if (!K.klaar){ const v = K.vragen[K.i];
    return `<div class="paneel"><span class="label">Examen ${DIPLOMAS[K.d].n} · vraag ${K.i + 1} van ${K.vragen.length}</span>${K.laatste ? `<p class="${K.laatste === 'Goed!' ? 'goedtxt' : 'fouttxt'}">${esc(K.laatste)}</p>` : ''}${K.tip && K.i === 0 ? '<p class="muted klein-tekst">Als oud-ster krijg je van de docent bij elke vraag een tip: één fout antwoord valt af.</p>' : ''}
      <p><b>${esc(v.q)}</b></p><div class="keuzes">${v.opts.map((o, j) => keuzeKnop(esc(o), '', () => cursusAntwoord(j), 'data-blijf')).join('')}</div></div>`; }
  return `<div class="paneel"><span class="label">Examen ${DIPLOMAS[K.d].n}</span>${K.laatste ? `<p class="${K.laatste === 'Goed!' ? 'goedtxt' : 'fouttxt'}">${esc(K.laatste)}</p>` : ''}
    ${K.geslaagd ? `<div class="kampioen"><span class="label">Geslaagd · ${K.goed} van de 3 goed</span><h2>🎓 ${DIPLOMAS[K.d].n}</h2><p>${esc(DIPLOMAS[K.d].d)}</p></div>` : `<p class="fouttxt">Gezakt: ${K.goed} van de 3 goed (je had er 2 nodig). ${S.trainer ? 'Volgende week' : 'Je kunt het meteen'} opnieuw proberen, voor de helft van het geld.</p>`}
    ${klaarKnop}</div>`;
}
export function vTrainerCursus(){
  const c = coach(), K = c.cursus, d = (K && K.d) || volgendeCursus() || 'B';
  const terug = () => { sluitCursus(); if (S.cursusTerug === 'seizoen') S.fase = 'trainerSeizoen'; else if (heeftDiploma('B')) startTrainer(); else S.fase = 'einde'; };
  const lijst = `<ul>${Object.entries(DIPLOMAS).map(([k, x]) => `<li>${heeftDiploma(k) ? '✓ ' : ''}<b>${x.n}</b>: ${esc(x.d)}${heeftDiploma(k) ? '' : ` <span class="muted klein-tekst">(${geldTxt(x.prijs)}, ${cursusWanneer(k)})</span>`}</li>`).join('')}</ul>`;
  const m = tmp.trMelding ? `<p class="melding">${esc(tmp.trMelding)}</p>` : '';
  return `<div class="verhaal"><span class="label">Trainerscursus</span><h2>${d === 'B' ? 'Eerst je trainersdiploma' : `De ${DIPLOMAS[d].n}-cursus`}</h2>
    <p>${d === 'B' ? 'Zonder diploma mag je geen team trainen. De bond geeft de cursus UEFA B: een paar avonden les en een examen van drie vragen. Haal je er twee goed, dan ben je geslaagd.' : `Met dit diploma: ${esc(DIPLOMAS[d].d.toLowerCase())}`}</p>${lijst}</div>${m}
    ${K ? vExamen(K.geslaagd ? knop('Verder', terug) : knop(`Opnieuw proberen (${geldTxt(cursusPrijs(d))})`, () => { sluitCursus(); tmp.trMelding = startCursus(d); }, 'hoofd', 'data-blijf') + knop('Terug', terug, 'hoofd tweede'))
      : knop(`Inschrijven voor ${DIPLOMAS[d].n} (${S.sp.geld < cursusPrijs(d) && d === 'B' ? 'de bond betaalt' : geldTxt(cursusPrijs(d))})`, () => { tmp.trMelding = startCursus(d); }, 'hoofd', 'data-blijf') + knop('Toch geen trainer', terug, 'hoofd tweede')}`;
}
// Je staf (extra trainers), je trainersniveau en de volgende cursus
function vStafTab(){
  const T0 = S.trainer, N = trainerNiveau(), V = volgendNiveau(), l = T0.staf || [], m = tmp.trMelding ? `<p class="melding">${esc(tmp.trMelding)}</p>` : '';
  const zeg = fn => () => { tmp.trMelding = fn(); }, d = volgendeCursus(), K = coach().cursus;
  return `${m}<div class="paneel"><span class="label">Jouw trainersniveau · reputatie ${Math.round(T0.rep)}</span>
    <table class="tabel"><thead><tr><th>Niveau</th><th>Vanaf</th><th>Wat mag je?</th><th>Staf</th></tr></thead><tbody>${NIVEAUS.map(x => `<tr class="${x.k === N.k ? 'mij' : ''}"><td><b>${x.n}</b></td><td>${x.min}</td><td class="klein-tekst">${esc(x.d)}</td><td>${x.staf}</td></tr>`).join('')}</tbody></table>
    <p class="muted klein-tekst">${V ? `Nog ${Math.ceil(V.min - T0.rep)} reputatie tot ${V.n.toLowerCase()}. Je reputatie groeit met titels, promoties, een tevreden bestuur en talenten die doorbreken.` : 'Je bent een toptrainer: je mag alles.'}</p></div>
    <div class="paneel"><span class="label">Extra trainers · ${l.length} van ${N.staf}${T0.o23 ? '' : ` · ${geldTxt(stafKosten())} per trainer per seizoen`}</span>
    ${Object.entries(STAF).map(([k, x]) => `<div class="eisrij"><span><b>${x.n}</b> <span class="muted klein-tekst">${esc(x.d)}</span></span>${l.includes(k) ? `<span class="risico r-veilig">In dienst</span>${knop('Ontslaan', zeg(() => ontslaStaf(k)), 'klein', 'data-blijf')}` : knop('Aanvragen', zeg(() => vraagStaf(k)), 'klein', 'data-blijf')}</div>`).join('')}</div>
    <div class="paneel"><span class="label">Assistent-trainer</span>${assistent() ? `<p>In dienst: <b>${esc(assistent().naam)}</b>, ${ASSISTENTEN[assistent().q - 1].n.toLowerCase()}. Zijn advies staat elke week in de tab Wedstrijd.</p>` : '<p class="muted klein-tekst">Een assistent geeft je elke wedstrijd advies over je opstelling. Hij telt niet mee voor je extra trainers.</p>'}
    ${ASSISTENTEN.map(x => { const nu = assistent() && assistent().q === x.q, kost = assistentKost(x.q);
      return `<div class="eisrij"><span><b>${x.n}</b> <span class="muted klein-tekst">${esc(x.d)} ${x.min ? `Vanaf reputatie ${x.min}.` : ''} ${kost ? `${geldTxt(kost)} per seizoen.` : 'Kost je niets.'}</span></span>${nu ? `<span class="risico r-veilig">In dienst</span>${knop('Ontslaan', zeg(ontslaAssistent), 'klein', 'data-blijf')}` : knop(assistent() ? 'Wisselen' : 'Aannemen', zeg(() => neemAssistent(x.q)), 'klein', 'data-blijf')}</div>`; }).join('')}</div>
    <div class="paneel"><span class="label">Diploma's</span><p>${Object.entries(DIPLOMAS).map(([k, x]) => `${heeftDiploma(k) ? '✓' : '·'} ${x.n}`).join(' · ')}</p>
    ${K ? vExamen(knop('Sluiten', sluitCursus, 'klein', 'data-blijf')) : d ? `<p>Je kunt nu de cursus <b>${DIPLOMAS[d].n}</b> volgen: ${esc(DIPLOMAS[d].d.toLowerCase())}</p>${knop(`Inschrijven (${geldTxt(cursusPrijs(d))})`, zeg(() => startCursus(d)), 'klein', 'data-blijf')}`
      : `<p class="muted klein-tekst">${heeftDiploma('Pro') ? 'Je hebt alle diploma\'s.' : `De volgende cursus (${heeftDiploma('A') ? 'UEFA Pro' : 'UEFA A'}) kan ${cursusWanneer(heeftDiploma('A') ? 'Pro' : 'A')}.`}</p>`}</div>`;
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
  const T0 = S.trainer, c = CLUBS[T0.club], o23 = T0.o23, pl = (o23 ? o23Stand() : stand(c.t)).indexOf(T0.club) + 1, naam = o23 ? `${c.n} O23` : c.n;
  if (!T0.eisen.gezien) return `<div class="verhaal"><span class="label">Trainer van ${esc(naam)} · ${seizoenLabel()}</span><h2>${o23 ? 'De eisen van de technisch directeur' : 'De eisen van het bestuur'}</h2>
      <p>${o23 ? `De technisch directeur van ${esc(c.n)} roept je bij zich: "Bij de O23 draait het om talenten klaarstomen voor het eerste. Dit verwachten we ${T0.eisen.halverwege ? 'de rest van' : ''} dit seizoen."` : `De voorzitter roept je bij zich: "Dit verwachten we ${T0.eisen.halverwege ? 'de rest van' : ''} dit seizoen van je." ${esc(c.n)} is op papier de nummer ${T0.eisen.rang} van de ${DIVS[c.t]}.`}</p></div>
    ${vEisen(false)}${o23 ? '' : `<p class="muted">Budget voor transfers: <b>${geldTxt(T0.budget)}</b>${vensterOpen() ? ' · het transfervenster is open' : ''}. Jouw trainersniveau: <b>${trainerNiveau().n}</b>.</p>`}${knop('Begrepen', () => { T0.eisen.gezien = true; })}`;
  const tab = tmp.trTab === 'transfers' && o23 ? 'talenten' : tmp.trTab === 'talenten' && !o23 ? 'transfers' : tmp.trTab || 'wedstrijd';
  const tabs = [['wedstrijd', 'Wedstrijd'], ['opstelling', 'Opstelling', geldig() ? null : '!'], o23 ? ['talenten', 'Talenten', mijnSel().some(kanDoorstromen) ? '!' : null] : ['transfers', 'Transfers', vensterOpen() ? '!' : null], ['training', 'Training'], ['staf', 'Staf & cursus', volgendeCursus() && !heeftDiploma(volgendeCursus()) ? '!' : null], ['bestuur', o23 ? 'Directeur' : 'Bestuur', T0.eisen.lijst.some(e => status(e).staat === 'gevaar') ? '!' : null], ['kast', 'Prijzenkast'], ['prive', 'Privé', S.sp.geboorte ? '!' : null]];
  const inhoud = {wedstrijd:vWedstrijdTab, opstelling:vOpstellingTab, transfers:vTransferTab, talenten:vTalentenTab, training:vTrainingTab, staf:vStafTab, bestuur:vBestuurTab, kast:vPrijzenkast, prive:vPriveTab}[tab]();
  return `<div class="verhaal"><span class="label">Trainer van ${esc(naam)} · ${trainerNiveau().n.toLowerCase()} · week ${S.ronde + 1} van ${AANTAL_RONDES}${S.ronde ? ` · ${pl}e` : ''}</span></div>
    ${T0.bestuur < 35 ? '<p class="melding" style="color:var(--fout);border-color:var(--fout)">Het bestuur wordt ongeduldig. Nog een paar nederlagen en je wordt ontslagen.</p>' : ''}
    ${tabBalk(tabs, tab, k => { tmp.trTab = k; tmp.trMelding = null; })}<div class="trinhoud">${inhoud}</div>${tab === 'wedstrijd' ? vKrant((S.krantWacht || []).slice(0, 4)) : ''}
    <div class="rij">${knop('Stoppen als trainer', () => { tmp.stopTrainerVraag = true; }, 'klein', 'data-blijf')}${tmp.stopTrainerVraag ? `<span class="muted">Zeker weten?</span>${knop('Ja, stoppen', () => { tmp.stopTrainerVraag = false; stopTrainer(); }, 'klein')}${knop('Nee', () => { tmp.stopTrainerVraag = false; }, 'klein', 'data-blijf')}` : ''}</div>`;
}
export function vTrainerUitslag(){
  const T0 = S.trainer, L = T0.laatste, c = CLUBS[T0.club], uit = L.a > L.b ? 'Gewonnen' : L.a < L.b ? 'Verloren' : 'Gelijkgespeeld';
  const wij = T0.o23 ? `${c.n} O23` : c.n, zij = T0.o23 ? `${L.opp} O23` : L.opp;
  const [th, tu, sh, su] = L.thuis ? [wij, zij, L.a, L.b] : [zij, wij, L.b, L.a];
  return `<div class="score"><div class="team ${L.thuis ? 'mij' : ''}">${esc(th)}</div><div class="stand">${sh}-${su}<span class="min">EINDE</span></div><div class="team r ${!L.thuis ? 'mij' : ''}">${esc(tu)}</div></div>
    ${S.M && S.M.trainer ? vPitch() : ''}
    <div class="verhaal"><span class="label">${L.beker ? `${esc(L.beker.naam)} · ${esc(L.beker.ronde)} · ` : ''}${uit}${L.pens ? ` (strafschoppen ${L.pens})` : ''} · tactiek: ${TACTIEK[L.tk].n.toLowerCase()}</span>${L.regels.map(r => `<p>${esc(r)}</p>`).join('')}${L.plek ? `<p class="muted">Jullie staan nu ${L.plek}e.</p>` : ''}
    ${T0.ontslag ? '<p class="melding" style="color:var(--fout);border-color:var(--fout)">Het bestuur heeft genoeg gezien. Je bent ontslagen.</p>' : ''}</div>
    ${vKrant(S.krantWacht)}
    ${knop(T0.ontslag ? 'Op zoek naar een nieuwe club' : (T0.bekerQ || []).length ? 'Naar de bekerwedstrijd' : S.ronde >= AANTAL_RONDES ? 'Seizoen afsluiten' : S.ronde === WINTER ? 'Naar de winterstop (transfervenster)' : 'Volgende week', () => { S.krantWacht = []; tmp.trTab = S.ronde === WINTER ? 'transfers' : tmp.trTab; tmp.trMelding = null; trainerVerder(); })}`;
}
export function vTrainerSeizoen(){
  const E = S.trainerEind, T0 = S.trainer, B = E.bestuur;
  const ontslagen = B && B.uit === 'ontslag';
  if (E.o23) return vO23Seizoen(E, T0, B, ontslagen);
  return `<div class="verhaal"><span class="label">Einde seizoen ${seizoenLabel()} · trainer</span><h2>${E.plek === 1 ? 'Kampioen!' : `${E.plek}e plaats`}</h2><p>${esc(E.clubNaam)} eindigt als ${E.plek}e in de ${DIVS[E.t]}.</p></div>
    ${E.plek === 1 ? `<div class="kampioen"><span class="label">Kampioen als trainer</span><h2>🏆 ${esc(E.clubNaam)}</h2><p>Je spelers gooien je in de lucht. Als speler was het mooi, maar dit voelt nog beter.</p></div>` : ''}
    ${E.mijn ? (E.mijn.naar < E.mijn.van ? `<p class="melding">Promotie naar de ${DIVS[E.mijn.naar]}!</p>` : `<p class="melding" style="color:var(--fout);border-color:var(--fout)">Degradatie naar de ${DIVS[E.mijn.naar]}.</p>`) : ''}
    ${B ? `<div class="paneel eisen-bestuur"><span class="label">Het oordeel van het bestuur · ${B.score} van 4 punten</span>${B.lijst.map((e, i) => `<div class="eisrij"><span>${i === 0 ? '<b>Hoofdeis</b> · ' : ''}${esc(e.eis)}</span><span class="muted klein-tekst">${esc(e.voortgang || '')}</span><span class="risico ${e.ok ? 'r-veilig' : e.bijna ? 'r-gem' : 'r-riskant'}">${e.ok ? 'Gehaald' : e.bijna ? 'Net niet (1 punt)' : 'Niet gehaald'}</span></div>`).join('')}
      <p class="${ontslagen ? 'fouttxt' : B.uit === 'tevreden' ? 'goedtxt' : ''}">${esc(B.tekst)}</p></div>` : ''}
    <p class="muted">Als trainer: ${T0.totWed} wedstrijden, ${T0.totW} gewonnen (${T0.totWed ? Math.round(100 * T0.totW / T0.totWed) : 0}%). Je trainersreputatie: <b>${Math.round(T0.rep)}</b>${T0.rep >= 52 ? ' · topclubs kennen je naam' : ''}.${E.plek <= 3 ? ' De club investeert: het team wordt sterker.' : ''}</p>
    ${ontslagen ? knop('Op zoek naar een nieuwe club', trainerAndereClub) : knop('Volgend seizoen', trainerNieuwSeizoen) + knop('Andere club zoeken', trainerAndereClub, 'hoofd tweede')}`;
}
function vO23Seizoen(E, T0, B, ontslagen){
  const tevreden = B && B.uit === 'tevreden', A = heeftDiploma('A');
  const naarCursus = () => { S.cursusTerug = 'seizoen'; S.fase = 'trainerCursus'; };
  const knoppen = ontslagen ? knop('Op zoek naar een ander O23-team', trainerAndereClub)
    : tevreden && A ? knop('Aanbiedingen als hoofdtrainer bekijken', trainerAndereClub) + knop('Nog een seizoen bij de O23', trainerNieuwSeizoen, 'hoofd tweede')
    : tevreden ? `<p class="melding">Clubs hebben interesse, maar zonder UEFA A-diploma mag je nog geen eerste elftal trainen.</p>${knop('De UEFA A-cursus volgen', naarCursus)}${knop('Nog een seizoen bij de O23', trainerNieuwSeizoen, 'hoofd tweede')}`
    : knop('Nog een seizoen bij de O23', trainerNieuwSeizoen) + knop('Ander O23-team zoeken', trainerAndereClub, 'hoofd tweede');
  return `<div class="verhaal"><span class="label">Einde seizoen ${seizoenLabel()} · trainer van de O23</span><h2>${E.plek === 1 ? 'Kampioen met de O23!' : `${E.plek}e plaats`}</h2>
    <p>${esc(E.clubNaam)} eindigt als ${E.plek}e in de O23-competitie. ${E.door ? `${E.door} ${E.door === 1 ? 'talent maakte' : 'talenten maakten'} de stap naar het eerste elftal.` : 'Er brak dit seizoen geen talent door naar het eerste.'}</p></div>
    ${B ? `<div class="paneel eisen-bestuur"><span class="label">Het oordeel van de technisch directeur · ${B.score} van 4 punten</span>${B.lijst.map((e, i) => `<div class="eisrij"><span>${i === 0 ? '<b>Hoofdeis</b> · ' : ''}${esc(e.eis)}</span><span class="muted klein-tekst">${esc(e.voortgang || '')}</span><span class="risico ${e.ok ? 'r-veilig' : e.bijna ? 'r-gem' : 'r-riskant'}">${e.ok ? 'Gehaald' : e.bijna ? 'Net niet' : 'Niet gehaald'}</span></div>`).join('')}
      <p class="${ontslagen ? 'fouttxt' : tevreden ? 'goedtxt' : ''}">${esc(B.tekst)}</p></div>` : ''}
    <p class="muted">Je trainersreputatie: <b>${Math.round(T0.rep)}</b> (${trainerNiveau().n.toLowerCase()}).${tevreden ? ' Je werk bij de jeugd valt op: eerste elftallen kennen nu je naam.' : ''}</p>
    ${knoppen}`;
}
export function vTrainerSamenvatting(){
  const T0 = S.trainer;
  return `<div class="paneel"><span class="label">Trainerscarrière</span><p>${T0.seizoenen} ${T0.seizoenen === 1 ? 'seizoen' : 'seizoenen'} · ${T0.totWed} wedstrijden · ${T0.totW} gewonnen${T0.ontslagen ? ` · ${T0.ontslagen}x ontslagen` : ''}</p>
    ${T0.prijzen.length ? `<div class="prijzen">${T0.prijzen.map(p => `<span class="prijs">${esc(p)}</span>`).join('')}</div>` : ''}${T0.hist.map(h => `<p class="muted">${esc(h)}</p>`).join('')}</div>`;
}
export function vZijTrainer(){
  const T0 = S.trainer, c = CLUBS[T0.club], st = stand(c.t);
  const dipl = `<p class="muted klein-tekst">Diploma's: ${Object.entries(DIPLOMAS).filter(([k]) => heeftDiploma(k)).map(([, x]) => x.n).join(', ') || 'geen'} · ${trainerNiveau().n.toLowerCase()}</p>`;
  if (T0.o23){ const O = T0.o23Tab || {};
    return `<div class="kaart"><span class="label">Trainer O23</span><div class="naam">${esc(S.sp.naam)}</div><p class="muted">${S.sp.leeftijd} jaar · ${esc(c.n)} O23</p>${dipl}
      <div class="feiten"><div><span class="label">Dit seizoen</span><b>${T0.w}W ${T0.g}G ${T0.v}V</b></div><div><span class="label">Doorgestroomd</span><b>${(T0.sz && T0.sz.door) || 0}</b></div><div><span class="label">Reputatie</span><b>${Math.round(T0.rep)}</b></div></div></div>
      <div class="kaart"><h3>O23-competitie</h3><div class="tabelwrap"><table class="tabel"><thead><tr><th>#</th><th>Club</th><th>G</th><th>DS</th><th>Pt</th></tr></thead><tbody>${o23Stand().map((id, i) => { const e = O[id]; return `<tr class="${id === T0.club ? 'mij' : ''}"><td>${i + 1}</td><td><span class="clubnaam">${clubLogo(id, 16)}${esc(CLUBS[id].n)} O23</span></td><td>${e.g}</td><td>${e.dv - e.dt > 0 ? '+' : ''}${e.dv - e.dt}</td><td>${e.pt}</td></tr>`; }).join('')}</tbody></table></div></div>`; }
  return `<div class="kaart"><span class="label">Trainer</span><div class="naam">${esc(S.sp.naam)}</div><p class="muted">${S.sp.leeftijd} jaar · ${esc(c.n)}</p>${dipl}
    <div class="feiten"><div><span class="label">Dit seizoen</span><b>${T0.w}W ${T0.g}G ${T0.v}V</b></div><div><span class="label">Totaal</span><b>${T0.totW} van ${T0.totWed}</b></div><div><span class="label">Reputatie</span><b>${Math.round(T0.rep)}</b></div><div><span class="label">Fans</span><b>${Math.round(T0.fans ?? 50)}</b></div><div><span class="label">Clubsterkte</span><b>${c.s}</b></div><div><span class="label">Budget</span><b>${geldTxt(T0.budget || 0)}</b></div></div>
    ${T0.prijzen.length ? `<div class="prijzen">${T0.prijzen.map(p => `<span class="prijs">${esc(p)}</span>`).join('')}</div>` : ''}</div>
    <div class="kaart"><h3>${DIVS[c.t]}</h3><div class="tabelwrap"><table class="tabel"><thead><tr><th>#</th><th>Club</th><th>G</th><th>DS</th><th>Pt</th><th class="vk">Vorm</th></tr></thead><tbody>${st.map((id, i) => { const e = S.tab[id]; return `<tr class="${id === T0.club ? 'mij' : ''}"><td>${i + 1}</td><td><span class="clubnaam">${clubLogo(id, 16)}${esc(CLUBS[id].n)}</span></td><td>${e.g}</td><td>${e.dv - e.dt > 0 ? '+' : ''}${e.dv - e.dt}</td><td>${e.pt}</td><td class="vk">${vormBolletjes(id)}</td></tr>`; }).join('')}</tbody></table></div></div>`;
}
