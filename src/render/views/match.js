import { S, club, statWaarde } from '../../core/state.js';
import { act, knop } from '../../core/ui.js';
import { esc } from '../../core/utils.js';
import { AANTAL_RONDES, ATTR, CLUBS } from '../../data/gegevens.js';
import { naWedstrijd, vBekerEnd } from '../../game/competitie/beker.js';
import { vNacompetitieEnd } from '../../game/competitie/nacompetitie.js';
import { vKrant, vOokGespeeld } from '../../game/media/nieuws.js';
import { social, volgersTxt } from '../../game/prive/social.js';
import { fmt1 } from '../../game/speler/o23.js';
import { vPers } from '../../game/wedstrijd/fans-pers.js';
import { focusStaat, kans, pOpts, risico } from '../../game/wedstrijd/momenten.js';
import { WAARSCHUW, actieKosten, stamina } from '../../game/wedstrijd/stamina.js';
import { vReunieEinde } from '../../game/wedstrijd/reunie.js';
import { kies, mijnNaam, stand2 } from '../../game/wedstrijd/wedstrijd.js';
import { vPitch } from '../pitch.js';
import { vInterEnd } from './interland.js';
import { vSeizoenStrip } from './zijbalk.js';

export function vO23End(){
  const M = S.M, uitslag = M.us > M.them ? 'Gewonnen' : M.us < M.them ? 'Verloren' : 'Gelijkgespeeld';
  return scorebord() + vSeizoenStrip() + `<div class="verhaal"><span class="label">O23 · ${uitslag}</span>
    <div class="rij" style="gap:20px;align-items:flex-end"><div><span class="label">Jouw cijfer</span><div class="groot">${fmt1(M.cijfer)}</div></div>
    <div class="muted">${M.goals} ${M.goals === 1 ? 'goal' : 'goals'} · ${M.assists} ${M.assists === 1 ? 'assist' : 'assists'}${M.rood ? ' · rode kaart' : ''}</div></div>
    ${M.focusTekst ? `<p class="${M.focusOmlaag ? 'fouttxt' : 'goedtxt'}">${esc(M.focusTekst)}</p>` : ''}${vFit(M)}
    <p class="melding">${esc(M.o23Tekst)}</p>
    ${M.bonus ? `<p class="melding">${esc(M.bonus.tekst)}</p>` : ''}
    ${M.groei ? `<p class="muted">Door je goede spel groeit je ${ATTR[M.groei].toLowerCase()} met 1.</p>` : ''}
    <p class="muted">${esc(M.eersteTekst)}</p></div>` + vLog()
    + knop(S.ronde + 1 === 7 ? 'Naar de winterstop' : S.ronde + 1 >= AANTAL_RONDES ? 'Seizoen afsluiten' : 'Volgende week', naWedstrijd);
}

export function scorebord(){
  const M = S.M, mij = esc(M.wij ?? mijnNaam()), hun = esc(M.zij ?? CLUBS[M.opp].n);
  const [l, r] = M.thuis ? [mij, hun] : [hun, mij];
  return `<div class="score"><div class="team ${M.thuis ? 'mij' : ''}">${l}</div>
    <div class="stand">${stand2()}<span class="min">${M.derby ? '<b style="color:var(--fout)">DERBY</b> · ' : ''}${M.klaar ? 'EINDE' : M.min + "'"}</span></div>
    <div class="team r ${!M.thuis ? 'mij' : ''}">${r}</div>${vStamina(M)}</div>`;
}
// Hoeveel energie heb je nog? Alleen zolang jij in het veld staat (of net gewisseld bent)
export function vStamina(M){
  if (!M.stam || M.klaar || M.rood) return '';
  if (M.gewisseld !== undefined) return `<div class="stamina uit"><span class="label">Gewisseld (${M.gewisseld}')</span><span class="muted klein-tekst">Je stamina was op.</span></div>`;
  const st = Math.round(stamina(M)), kl = st > 50 ? 'hoog' : st >= 25 ? 'mid' : 'laag', alarm = M.rol === 'basis' && st < M.wisselGrens + WAARSCHUW;
  return `<div class="stamina ${kl}${alarm ? ' alarm' : ''}" title="Elke minuut en elke actie kost stamina. Moeilijke acties kosten meer. Is hij op, dan wisselt de trainer je."><span class="label">Stamina</span><div class="stambalk"><i style="width:${st}%"></i></div><b>${st}</b>${alarm ? '<span class="klein-tekst">Wisselgevaar</span>' : ''}</div>`;
}
// Na afloop: hoeveel fitheid kostte het, en werd je gewisseld?
export function vFit(M){
  if (M.fitVoor === undefined) return '';
  return (M.gewisseld !== undefined ? `<p class="fouttxt">De trainer wisselde je in de ${M.gewisseld}e minuut: je stamina was op.</p>` : '') + `<p class="muted">Fitheid: ${M.fitVoor} → ${S.sp.fit}.</p>`;
}
// Nieuwe regels sinds de vorige weergave verschijnen één voor één, alsof je de wedstrijd live volgt
export const REGEL_TEMPO = .22;
export const nieuweRegels = () => Math.max(0, S.M.log.length - (S.M.getoond || 0));
export function vLog(){
  const M = S.M, oud = M.getoond || 0;
  const html = `<div class="log">${M.log.map((l, i) => `<div${i >= oud ? ` class="nieuw" style="animation-delay:${(Math.min(i - oud, 20) * REGEL_TEMPO).toFixed(2)}s"` : ''}><span class="m">${l.m}</span><span class="${l.k}">${esc(l.t)}</span></div>`).join('')}</div>`;
  M.getoond = M.log.length;
  return html;
}

export function vMatch(){
  const M = S.M, wacht = `style="animation-delay:${(Math.min(nieuweRegels(), 20) * REGEL_TEMPO).toFixed(2)}s"`;
  let keuzeHtml = '';
  if (M.pending){
    const f = Math.round(S.sp.focus ?? 65), fs = focusStaat(f);
    keuzeHtml = `<p class="moment nieuw" ${wacht}><b>${M.min}'</b> · ${esc(M.pending.tekst)}</p><p class="opst nieuw" ${wacht}><span class="label">Focus ${f}</span>${fs ? `<span class="risico ${fs.cls}">${fs.k}</span><span class="muted klein-tekst">${fs.t}</span>` : '<span class="muted klein-tekst">Lukt een actie, dan groeit je focus. Mislukt ze, dan zakt hij.</span>'}</p><div class="keuzes nieuw" ${wacht}>${pOpts(M.pending).map((o, i) => {
      const [r, cls] = risico(kans(o)), kost = actieKosten(o);
      return `<button class="keuze" data-i="${act(() => kies(i))}"><span class="t">${esc(o.l)}</span><span class="s">${ATTR[o.st]} ${statWaarde(o.st)} <span class="risico ${cls}">${r}</span><span class="stamkost${kost >= 6 ? ' zwaar' : ''}" title="Kost ${kost} stamina">−${kost} ⚡</span>${o.kaart ? `<span class="kaartrisico ${o.kaart}">${o.kaart === 'rood' ? 'kans op rood' : 'kans op geel'}</span>` : ''}</span></button>`;
    }).join('')}</div>`;
  }
  // Jouw actie staat op het veld zelf; zonder veld staat hij boven het verslag
  const veld = vPitch(keuzeHtml);
  return scorebord() + (veld || keuzeHtml) + vLog();
}

export function vMatchEnd(){
  const M = S.M, sp = S.sp;
  if (M.inter) return vInterEnd();
  if (M.o23) return vO23End();
  if (M.beker) return vBekerEnd();
  if (M.po) return vNacompetitieEnd();
  const uitslag = M.us > M.them ? 'Gewonnen' : M.us < M.them ? 'Verloren' : 'Gelijkgespeeld';
  let oordeel = '';
  if (M.cijfer !== null){
    oordeel = M.cijfer >= 8.5 ? 'Man of the Match! De fans scanderen je naam.' : M.cijfer >= 7.3 ? 'Sterke wedstrijd. De trainer geeft je een schouderklopje.' : M.cijfer >= 6 ? 'Degelijk. Niks mis mee.' : M.cijfer >= 5 ? 'Matige wedstrijd. De trainer kijkt je niet aan.' : 'Dramatisch. In de kantine wordt over je gepraat.';
  }
  let html = scorebord() + vSeizoenStrip() + `<div class="verhaal"><span class="label">${uitslag}</span>`;
  if (M.cijfer !== null){
    html += `<div class="rij" style="gap:20px;align-items:flex-end"><div><span class="label">Jouw cijfer</span><div class="groot">${M.cijfer.toFixed(1).replace('.', ',')}</div></div>
      <div class="muted">${M.goals} ${M.goals === 1 ? 'goal' : 'goals'} · ${M.assists} ${M.assists === 1 ? 'assist' : 'assists'}${M.rood ? ' · rode kaart' : M.geel ? ' · gele kaart' : ''}</div></div>
      <p>${oordeel}</p>${M.focusTekst ? `<p class="${M.focusOmlaag ? 'fouttxt' : 'goedtxt'}">${esc(M.focusTekst)}</p>` : ''}${vFit(M)}`;
    if (M.volgers) html += `<p class="muted">${M.volgers > 0 ? '+' : ''}${volgersTxt(M.volgers)} volgers op social media (nu ${volgersTxt(social().volgers)}).</p>`;
    if (M.volgerTekst) html += `<p class="melding">${esc(M.volgerTekst)}</p>`;
    if (M.kaartTekst) html += `<p class="melding" style="${M.rood ? 'color:var(--fout);border-color:var(--fout)' : ''}">${esc(M.kaartTekst)}</p>`;
    if (M.statusTekst) html += `<p class="melding">${esc(M.statusTekst)}</p>`;
    if (M.agentTekst) html += `<p class="melding">${esc(M.agentTekst)}</p>`;
    if (M.o23Tekst) html += `<p class="melding">${esc(M.o23Tekst)}</p>`;
    if (M.o19Tekst) html += `<p class="melding">${esc(M.o19Tekst)}</p>`;
    if (M.bonus) html += `<p class="melding">${esc(M.bonus.tekst)}</p>`;
    if (M.groei) html += `<p class="muted">Door je goede spel groeit je ${ATTR[M.groei].toLowerCase()} met 1.</p>`;
    if (M.blessureNieuw) html += `<p style="color:var(--fout)">Je hebt je geblesseerd en ligt ${M.blessureNieuw} ${M.blessureNieuw === 1 ? 'week' : 'weken'} uit. Te weinig rust genomen?</p>`;
    if (M.kampioen) html += `<div class="kampioen"><span class="label">Kampioen!</span><h2>🏆 ${esc(club().n)}</h2><p>${esc(M.kampioenTekst)}</p></div>`;
    if (M.recordTekst) html += `<div class="kampioen"><span class="label">Record!</span>${[].concat(M.recordTekst).map(t => `<p>${esc(t)}</p>`).join('')}</div>`;
    if (M.derbyTekst) html += `<p class="melding" style="${M.us < M.them ? 'color:var(--fout);border-color:var(--fout)' : ''}">${esc(M.derbyTekst)}</p>`;
    if (M.grootTekst) html += `<p class="melding">${esc(M.grootTekst)}</p>`;
    if (M.fansTekst) html += `<p class="muted">${esc(M.fansTekst)}</p>`;
    html += vPers();
    html += vReunieEinde(M);
    html += vKrant(M.nieuws);
    html += vOokGespeeld();
    if (sp.vert < 25) html += `<p style="color:var(--fout)">Pas op: het vertrouwen van de trainer is laag. Zakt het onder de 15, dan word je bij de volgende transferperiode weggestuurd.</p>`;
  } else { html += `<p>${esc(M.log[0].t)}</p>`; html += vReunieEinde(M); if (M.derbyTekst) html += `<p class="melding">${esc(M.derbyTekst)}</p>`; if (M.o19Tekst) html += `<p class="melding">${esc(M.o19Tekst)}</p>`; if (M.kampioen) html += `<div class="kampioen"><span class="label">Kampioen!</span><h2>🏆 ${esc(club().n)}</h2><p>${esc(M.kampioenTekst)}</p></div>`; html += vKrant(M.nieuws); html += vOokGespeeld(); }
  html += `</div>` + vLog();
  html += knop(S.ronde + 1 === 7 ? 'Naar de winterstop' : S.ronde + 1 >= AANTAL_RONDES ? 'Seizoen afsluiten' : 'Volgende week', naWedstrijd);
  return html;
}
