import { S, attr, ovr } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { esc } from '../../core/utils.js';
import { AGENT, CLUBS, DIVS, TRAINBAAR } from '../../data/gegevens.js';
import { clubLogo } from '../../data/logos.js';
import { clubTenue } from '../../data/tenues.js';
import { fmt1 } from '../../game/speler/o23.js';
import { OEFENINGEN, PROEF_GRENS, THUIS, doeOefening, doeThuis, geslaagd, naProefWed, nieuweKans, oefAttr, oefKans, proefStand, startProefWed, volgendeOefening, volgendeThuisWeek, vriendAlBijClub } from '../../game/speler/proef.js';
import { vriendClubNaam } from '../../game/speler/journey.js';
import { ANIMS } from '../pixel/animaties.js';
import { lookVan } from '../pixel/atlas.js';
import { tenueVoor, uiterlijkVoor } from '../pixel/uiterlijk.js';
import { speelReel } from '../pixel/voorbeeld.js';
import { ploegen } from '../pitch.js';
import { vFit, vLog, scorebord, statRegel } from './match.js';

/* ===================== De laatbloeier: proeftraining, oefenwedstrijd en thuis wachten (game/speler/proef.js) ===================== */
const pct = k => Math.round(k * 100) + '%';
const ok = x => x != null && x >= PROEF_GRENS;
// De twee stappen bovenaan: training en oefenwedstrijd, met hun cijfer (groen als het genoeg is)
function vStappen(P){
  const stap = (n, x, bezig) => `<div class="proefstap ${x != null ? (ok(x) ? 'goed' : 'fout') : bezig ? 'bezig' : ''}"><span class="label">${n}</span><b>${x != null ? fmt1(x) : bezig ? 'bezig' : '–'}</b></div>`;
  return `<div class="proefstappen">${stap('1 · Proeftraining', P.training, P.stap === 'training')}${stap('2 · Oefenwedstrijd', P.wed, P.stap === 'wed' || P.stap === 'naTraining')}<div class="proefstap"><span class="label">Nodig</span><b>${fmt1(PROEF_GRENS)}</b></div></div>`;
}
function vKop(P){
  const c = CLUBS[P.club];
  return `<div class="club" style="display:flex;align-items:center;gap:12px;margin:6px 0 10px">${clubLogo(P.club, 48)}<div><h2 style="margin:0">${esc(c.n)}</h2><span class="muted klein-tekst">${esc(DIVS[c.t])} · clubsterkte ${c.s} · kans ${P.poging}${P.vorige != null && CLUBS[P.vorige] ? ` (na ${esc(CLUBS[P.vorige].n)})` : ''}</span></div></div>`;
}
// Het pixelbeeld: jouw speler in het trainingspak van de club, met de animatie van de oefening
const beeld = (reel) => `<figure class="portretfoto proefbeeld"><canvas id="pixelOefening" data-reel="${esc(JSON.stringify(reel))}" role="img" aria-label="Jouw ${S.sp.vrouw ? 'speelster' : 'speler'} op de proeftraining"></canvas><span class="reellabel" aria-hidden="true"></span></figure>`;
const duur = naam => { const a = ANIMS[naam]; return a ? Math.max(.8, a.frames.length / (a.fps || 10)) : 1.2; };

// Je eerste kans: je zat thuis, weggestuurd bij je amateurclub, tot je zaakwaarnemer belde
function vTelefoontje(P){
  const sp = S.sp, v = sp.vriend, vc = vriendClubNaam(), voor = AGENT.split(' ')[0];
  return `<p>Een week geleden stuurde je amateurclub je weg: "We gaan verder met jongere ${sp.vrouw ? 'speelsters' : 'spelers'}." Je zat thuis op de bank, je voetbaltas nog in de gang.${v && vc ? ` Op je telefoon zag je ${esc(v.voornaam)} in het shirt van ${esc(vc)}, op een vol veld.` : ''}</p>
    <p>Toen belde ${esc(AGENT)}, je oude vriend van vroeger, net begonnen als zaakwaarnemer: "Sta op. Ik heb een proeftraining voor je bij ${esc(CLUBS[P.club].n)}, en daarna een oefenwedstrijd. Haal je voor allebei een ${fmt1(PROEF_GRENS)}, dan willen ze je hebben." ${esc(voor)} staat nu langs de lijn.</p>`;
}
export function vProef(){
  const sp = S.sp, P = proefStand(); if (!P) return '<p class="muted">Even geduld…</p>';
  if (!P.club) return `<div class="verhaal"><p>${esc(AGENT)} heeft een proeftraining voor je geregeld.</p>${knop('Naar de proeftraining', () => { vriendAlBijClub(); nieuweKans(); })}</div>`; // (oude opslag: van vóór de eerste kans)
  const info = `<p class="muted klein-tekst">Klasse ${ovr(sp)} · fitheid ${Math.round(sp.fit)}${vriendClubNaam() && sp.vriend ? ` · ${esc(sp.vriend.voornaam)} speelt bij ${esc(vriendClubNaam())}` : ''}</p>`;
  if (P.stap === 'wacht') return vThuis(P, info);
  let html = `<div class="verhaal"><span class="label">Je kans via ${esc(AGENT)} · ${P.stap === 'training' ? `oefening ${Math.min(P.i + 1, P.oef.length)} van ${P.oef.length}` : 'de proeftraining zit erop'}</span>${vKop(P)}${P.poging === 1 && P.stap === 'training' && !P.i && !P.laatste ? vTelefoontje(P) : ''}${vStappen(P)}`;
  if (P.stap === 'training'){
    const id = P.oef[P.i], o = OEFENINGEN[id], a = oefAttr(id), L = P.laatste;
    const klaar = sp.pos === 'KEEPER' ? 'keeperKlaar' : 'sta';
    html += `<div class="rij proefoefening" style="gap:16px;align-items:flex-start;flex-wrap:wrap">
      ${beeld(L ? [[o.anim, duur(o.anim) + .3, o.n.toLowerCase()], [L.gelukt ? 'juich' : 'balen', 1.6, L.gelukt ? 'gelukt!' : 'mislukt']] : [[klaar, 2, 'klaar voor de oefening']])}
      <div style="flex:1;min-width:240px"><h3 style="margin:0 0 4px">${esc(o.n)}</h3><p>${esc(o.u)}</p>
      <p class="muted klein-tekst">Het draait om <b>${esc(attr(a))}</b>: jij hebt ${sp.a[a]}.</p>
      ${L ? `<p class="melding ${L.gelukt ? 'goedtxt' : 'fouttxt'}">${esc(L.tekst)} Cijfer: <b>${fmt1(L.cijfer)}</b></p>
        <p class="muted klein-tekst">Tot nu toe: ${P.punten.map(fmt1).join(' · ')}</p>
        <div class="keuzes">${knop(P.i + 1 < P.oef.length ? 'Volgende oefening' : 'Naar de uitslag', volgendeOefening)}</div>`
      : `<div class="keuzes">${knop(`🛡️ ${esc(o.v)}<br><span class="klein-tekst">veilig · kans ${pct(oefKans(id, true))} · een 6,5 tot 7</span>`, () => doeOefening(true), 'klein', 'style="text-align:left"')}
        ${knop(`🔥 ${esc(o.r)}<br><span class="klein-tekst">risico · kans ${pct(oefKans(id, false))} · een 8 tot 9 (mislukt: een 5)</span>`, () => doeOefening(false), 'klein', 'style="text-align:left"')}</div>`}
      </div></div>`;
  } else if (P.stap === 'naTraining'){
    html += `<p>De proeftraining zit erop. Je cijfers: <b>${P.punten.map(fmt1).join(' · ')}</b>, gemiddeld een <b class="${ok(P.training) ? 'goedtxt' : 'fouttxt'}">${fmt1(P.training)}</b>.</p>
      <p>${ok(P.training) ? `De trainer knikt: "Niet slecht. Zaterdag speel je mee in de oefenwedstrijd. Dan zien we het echt."` : `De trainer kijkt bedenkelijk: "Dat was nog niet overtuigend. Zaterdag mag je meedoen in de oefenwedstrijd, maar dan moet je wel iets laten zien." Voor een contract heb je voor allebei een ${fmt1(PROEF_GRENS)} nodig.`}</p>`
      + knop('Speel de oefenwedstrijd', startProefWed);
  }
  return html + info + '</div>';
}

// Thuis, tussen twee kansen: elke week één ding doen, tot je zaakwaarnemer weer belt
function vThuis(P, info){
  const W = P.wacht, sp = S.sp, g = W.gedaan;
  const acties = g ? `<p class="melding goedtxt">${esc(g.t)}</p>` : `<div class="keuzes">${TRAINBAAR.map(k => knop(`🏋️ ${esc(attr(k))} <span class="klein-tekst">(${sp.a[k]})</span>`, () => doeThuis('trainen', k), 'klein')).join('')}
      ${knop(`🏃 ${THUIS.conditie.n}<br><span class="klein-tekst">${THUIS.conditie.d}</span>`, () => doeThuis('conditie'), 'klein')}${knop(`🛋️ ${THUIS.rust.n}<br><span class="klein-tekst">${THUIS.rust.d}</span>`, () => doeThuis('rust'), 'klein')}</div>`;
  return `<div class="verhaal"><span class="label">Thuis · week ${W.week} van ${W.van}</span><h2>Wachten op een nieuwe kans</h2>
    <p>${W.week === 1 ? `Het is niet gelukt bij ${esc(CLUBS[P.club].n)} (proeftraining ${fmt1(P.training)}, oefenwedstrijd ${fmt1(P.wed)}). Op de terugweg in de auto zegt ${esc(AGENT)}: "Dit was één club. Ik bel rond. Blijf fit, dan sta je klaar als ik iets heb."` : `${esc(AGENT)} belt rond. "Nog even geduld, ik heb een paar clubs die willen kijken."`}</p>
    <p class="muted">Wat doe je deze week?</p>${acties}${info}</div>`
    + (g ? knop(W.week < W.van ? 'Volgende week' : `${AGENT.split(' ')[0]} belt…`, volgendeThuisWeek) : '');
}

// Na de oefenwedstrijd: het oordeel van de club
export function vProefEnd(){
  const M = S.M, P = proefStand(), uitslag = M.us > M.them ? 'Gewonnen' : M.us < M.them ? 'Verloren' : 'Gelijkgespeeld', ja = P && geslaagd(P);
  return scorebord() + `<div class="verhaal"><span class="label">Oefenwedstrijd · ${uitslag}</span>
    <div class="rij" style="gap:20px;align-items:flex-end"><div><span class="label">Jouw cijfer</span><div class="groot">${fmt1(M.cijfer)}</div></div>
    <div class="muted">${statRegel(M)}${M.rood ? ' · rode kaart' : ''}</div></div>${P ? vStappen(P) : ''}
    ${M.focusTekst ? `<p class="${M.focusOmlaag ? 'fouttxt' : 'goedtxt'}">${esc(M.focusTekst)}</p>` : ''}${vFit(M)}
    <p class="melding ${ja ? 'goedtxt' : ''}">${esc(M.proefTekst || '')}</p></div>` + vLog()
    + knop(ja ? 'Contract tekenen' : 'Naar huis', naProefWed);
}

// Na het tekenen van de pagina: de animatie van de oefening afspelen
export function proefNaRender(){
  const cv = document.getElementById('pixelOefening'); if (!cv || !S || !S.sp) return;
  const sp = S.sp, P = proefStand(); if (!P) return;
  let reel; try { reel = JSON.parse(cv.dataset.reel); } catch (e){ return; }
  let sleutel = sp.naam; try { sleutel = ploegen().jij || sleutel; } catch (e){}
  const look = lookVan(uiterlijkVoor('jij|' + sleutel, {...(sp.uiterlijk || {}), vrouw:!!sp.vrouw}), sp.pos === 'KEEPER' ? tenueVoor('K') : clubTenue(P.club), {handschoen:sp.pos === 'KEEPER'}); // (een keeper in het keepershirt)
  speelReel(cv, look, reel);
}
