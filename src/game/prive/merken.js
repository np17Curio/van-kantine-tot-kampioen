import { S, ovr, seizoenLabel } from '../../core/state.js';
import { keuzeKnop, knop } from '../../core/ui.js';
import { clamp, esc, geldTxt, pick, rnd } from '../../core/utils.js';
import { krantMelding, RODDELBLADEN } from '../media/roddel.js';
import { social, volgersTxt } from './social.js';
import { schoenDeal } from './schoenen.js';
import { rugnummer } from '../team/rugnummers.js';

/* ===================== Je eigen merken ===================== */
// Maximaal 2 eigen merken. Omzet per week = volgers × factor × (1 + kwaliteit × 0,25) × hype/50.
// De hype zakt langzaam naar een basis (reputatie, vorm) en gaat omhoog door goals, prijzen, collecties en campagnes.
export const MERK_SOORTEN = {
  kleding: {n:'Kledinglijn', i:'👕', min:50000, prijs:20000, f:.0015, d:'het meest constant'},
  sneakers:{n:'Signature sneakers', i:'👟', min:0, prijs:80000, f:.003, d:'samen met je schoenenmerk, de hoogste omzet', schoen:true},
  drank:   {n:'Energiedrank', i:'⚡', min:100000, prijs:150000, f:.0022, d:'piekt als je in vorm bent'},
  parfum:  {n:'Parfum', i:'🌸', min:250000, prijs:300000, f:.0026, d:'luxe: hoge marge, gevoelig voor je imago', rep:50},
  gaming:  {n:'Gaming-headset', i:'🎧', min:75000, prijs:60000, f:.0018, d:'populair bij jonge fans'},
};
export const MAX_MERKEN = 2;
// Oude opslag: de eenvoudige kledinglijn (sp.merk) wordt je eerste merk
export function mijnMerken(){
  const sp = S.sp; if (!sp.merken){ sp.merken = []; if (sp.merk) sp.merken.push({soort:'kleding', naam:`${sp.naam.split(' ').pop()} Wear`, kwaliteit:1, hype:50, totaal:sp.merk.totaal || 0, start:sp.merk.start || S.jaar}); }
  return sp.merken;
}
export function naamVoorstellen(soort){
  const sp = S.sp, delen = sp.naam.split(' '), ach = delen[delen.length - 1], ini = delen.map(d => d[0]).join('').toUpperCase();
  let nr = ''; try { nr = rugnummer() || ''; } catch (e){ nr = ''; }
  const ext = {kleding:'Wear', sneakers:'Signature', drank:'Energy', parfum:'Parfum', gaming:'Sound'}[soort];
  return [`${ini}${nr}`, `${ach} ${ext}`, `${delen[0]} ${ext}`];
}
export function kanStarten(soort){
  const sp = S.sp, M = MERK_SOORTEN[soort], l = mijnMerken();
  if (l.length >= MAX_MERKEN) return `Je hebt al ${MAX_MERKEN} merken.`;
  if (l.some(m => m.soort === soort)) return 'Dit merk heb je al.';
  if (M.schoen){ const d = schoenDeal(); if (!d || !['Volta Boots', 'Strikr'].includes(d.merk)) return 'Alleen met een schoenendeal bij Volta Boots of Strikr.'; }
  if (social().volgers < M.min) return `Vanaf ${volgersTxt(M.min)} volgers.`;
  if (M.rep && sp.rep < M.rep) return `Vanaf reputatie ${M.rep}.`;
  if (sp.geld < M.prijs) return `Kost ${geldTxt(M.prijs)}.`;
  return null;
}
export function startMerk(soort, naam){
  const sp = S.sp, M = MERK_SOORTEN[soort]; if (kanStarten(soort)) return;
  sp.geld -= M.prijs; mijnMerken().push({soort, naam, kwaliteit:1, hype:60, totaal:0, start:S.jaar});
  S.car.hist.push(`${seizoenLabel()}: eigen merk ${naam} gelanceerd (${M.n.toLowerCase()})`);
  krantMelding(`${sp.naam} lanceert ${naam}`, `De ${M.n.toLowerCase()} van de voetballer gaat vandaag in de verkoop. De eerste dag is meteen een succes.`, RODDELBLADEN);
  if (S.week) S.week.tekst.push(`${M.i} Je lanceert ${naam}! De eerste dag loopt meteen storm.`);
}
export const omzet = m => { const M = MERK_SOORTEN[m.soort]; return Math.round(social().volgers * M.f * (1 + m.kwaliteit * .25) * m.hype / 50); };
export const merkenPerWeek = () => mijnMerken().reduce((a, m) => a + omzet(m), 0);
// Elke week: omzet erbij, en de hype zakt richting de basis (reputatie, vorm; parfum ook je imago)
export function merkenWeek(){
  const sp = S.sp, w = S.week; let tot = 0;
  for (const m of mijnMerken()){
    const o = omzet(m); sp.geld += o; m.totaal += o; tot += o;
    const basis = 30 + sp.rep * .4 + (sp.vorm || 0) * 6 - (m.soort === 'parfum' && sp.imago > 0 ? 15 : 0);
    m.hype = clamp(m.hype + (basis - m.hype) * .06, 5, 100);
    // af en toe iets bijzonders
    if (w && rnd() < .02){
      if (m.kwaliteit <= 2 && rnd() < .5){ m.hype = clamp(m.hype - 12, 5, 100); w.tekst.push(`Een bekende YouTuber noemt ${m.naam} "slechte kwaliteit voor veel geld". Hype −12.`); }
      else if (rnd() < .5){ m.hype = clamp(m.hype + 10, 5, 100); w.tekst.push(`Een groot warenhuis neemt ${m.naam} op in het assortiment. Hype +10.`); }
      else if (sp.vriend && !sp.vriend.weg){ m.hype = clamp(m.hype + 8, 5, 100); sp.vriend.band = Math.min(100, sp.vriend.band + 4); w.tekst.push(`${sp.vriend.voornaam} draagt ${m.naam} in zijn nieuwste post. Hype +8, en jullie band groeit.`); }
    }
  }
  return tot;
}
// Na een wedstrijd: goals en een topcijfer geven hype, een rode kaart kost hype
export function merkenNaWedstrijd(M){
  if (!M || M.cijfer == null) return;
  const d = M.goals * 2 + (M.cijfer >= 8 ? 3 : 0) - (M.rood ? 6 : 0) + (M.kampioen ? 15 : 0);
  if (d) for (const m of mijnMerken()) m.hype = clamp(m.hype + d, 5, 100);
}
// Acties, één per week
export const kostCollectie = m => Math.round(MERK_SOORTEN[m.soort].prijs * .25 / 1000) * 1000;
export const kostKwaliteit = m => Math.round(MERK_SOORTEN[m.soort].prijs * .5 * m.kwaliteit / 1000) * 1000;
export const kostCampagne = m => Math.round(MERK_SOORTEN[m.soort].prijs * .35 / 1000) * 1000;
export const verkoopWaarde = m => Math.round(omzet(m) * 52 * 3 / 1000) * 1000;
export const kanActie = () => !!(S.week && !S.week.merk);
export function merkActie(i, soort){
  const sp = S.sp, l = mijnMerken(), m = l[i]; if (!m || !kanActie()) return;
  const w = S.week; let t;
  if (soort === 'collectie'){ const k = kostCollectie(m); if (sp.geld < k) return; sp.geld -= k; m.hype = clamp(m.hype + 25, 5, 100);
    if (rnd() < .25 + m.kwaliteit * .08){ t = `De nieuwe collectie van ${m.naam} is binnen een uur uitverkocht! Hype +25.`; krantMelding(`${m.naam} binnen een uur uitverkocht`, `De nieuwe collectie van ${sp.naam} ging razendsnel. Fans stonden de hele nacht in de rij.`, RODDELBLADEN); }
    else t = `Je lanceert een nieuwe collectie van ${m.naam}. Hype +25.`; }
  else if (soort === 'kwaliteit'){ if (m.kwaliteit >= 5) return; const k = kostKwaliteit(m); if (sp.geld < k) return; sp.geld -= k; m.kwaliteit++; t = `Betere materialen en een topontwerper: ${m.naam} is nu kwaliteit ${m.kwaliteit}.`; }
  else if (soort === 'campagne'){ const k = kostCampagne(m); if (sp.geld < k) return; sp.geld -= k; m.hype = clamp(m.hype + 15, 5, 100); const n = Math.round(200 + social().volgers * .02); social().volgers += n;
    t = `Een campagne met ${pick(['een bekende rapper', 'een topmodel', 'een wereldberoemde gamer', 'een olympisch kampioen'])} voor ${m.naam}. Hype +15 en +${volgersTxt(n)} volgers.`; }
  else if (soort === 'verkoop'){ const b = verkoopWaarde(m); sp.geld += b; l.splice(i, 1); S.car.hist.push(`${seizoenLabel()}: merk ${m.naam} verkocht voor ${geldTxt(b)}`); t = `Je verkoopt ${m.naam} aan een groot concern voor ${geldTxt(b)}.`; krantMelding(`${sp.naam} verkoopt ${m.naam}`, `Een groot concern betaalt ${geldTxt(b)} voor het merk van de voetballer.`, RODDELBLADEN); }
  if (t){ w.merk = soort; w.tekst.push(t); }
}

// ---------- Het blok "Jouw merken" (tabblad Geld en zaken) ----------
export function vMerken(){
  const sp = S.sp, l = mijnMerken(), ka = kanActie(), sel = S.week && S.week.merkKeuze;
  const merk = (m, i) => `<div class="paneel"><p>${MERK_SOORTEN[m.soort].i} <b>${esc(m.naam)}</b> <span class="muted">· ${MERK_SOORTEN[m.soort].n.toLowerCase()} · kwaliteit ${'★'.repeat(m.kwaliteit)}${'☆'.repeat(5 - m.kwaliteit)} · hype ${Math.round(m.hype)}</span></p>
    <p class="klein-tekst">Nu ${geldTxt(omzet(m))} per week · totaal ${geldTxt(m.totaal)}</p>
    <div class="rij">${knop(`Nieuwe collectie · ${geldTxt(kostCollectie(m))}`, () => merkActie(i, 'collectie'), 'klein', `data-blijf ${ka && sp.geld >= kostCollectie(m) ? '' : 'disabled'}`)}${m.kwaliteit < 5 ? knop(`Kwaliteit verbeteren · ${geldTxt(kostKwaliteit(m))}`, () => merkActie(i, 'kwaliteit'), 'klein', `data-blijf ${ka && sp.geld >= kostKwaliteit(m) ? '' : 'disabled'}`) : ''}${knop(`Campagne · ${geldTxt(kostCampagne(m))}`, () => merkActie(i, 'campagne'), 'klein', `data-blijf ${ka && sp.geld >= kostCampagne(m) ? '' : 'disabled'}`)}${knop(`Verkopen · ${geldTxt(verkoopWaarde(m))}`, () => merkActie(i, 'verkoop'), 'klein', `data-blijf data-bevestig="Je verkoopt ${esc(m.naam)} voor ${geldTxt(verkoopWaarde(m))}. Daarna is het merk niet meer van jou." data-ja="Ja, verkopen"`)}</div></div>`;
  const nieuw = l.length < MAX_MERKEN ? (sel ? `<span class="label">Hoe noem je je ${MERK_SOORTEN[sel].n.toLowerCase()}?</span><div class="keuzes">${naamVoorstellen(sel).map(n => keuzeKnop(esc(n), `Starten · ${geldTxt(MERK_SOORTEN[sel].prijs)}`, () => { startMerk(sel, n); S.week.merkKeuze = null; }, 'data-blijf')).join('')}${keuzeKnop('Toch niet', '', () => { S.week.merkKeuze = null; }, 'data-blijf')}</div>`
    : `<span class="label">Een merk beginnen (${l.length} van ${MAX_MERKEN})</span><div class="keuzes">${Object.entries(MERK_SOORTEN).filter(([k]) => !l.some(m => m.soort === k)).map(([k, M]) => { const r = kanStarten(k);
      return keuzeKnop(`${M.i} ${M.n}`, `${M.d} · ${r || `start ${geldTxt(M.prijs)}`}`, () => { if (!kanStarten(k) && S.week) S.week.merkKeuze = k; }, `data-blijf ${r ? 'disabled' : ''}`); }).join('')}</div>`) : '';
  return `<span class="label winkelkop">Jouw merken${ka ? '' : ' · deze week al iets gedaan'}</span>${l.length ? l.map(merk).join('') : '<p class="muted klein-tekst">Nog geen eigen merk. Met genoeg volgers kun je er een beginnen: het levert elke week geld op, ook na je carrière.</p>'}${nieuw}`;
}
export const merkenTotaal = () => mijnMerken().reduce((a, m) => a + m.totaal, 0);
export const isSuperster = () => { const sp = S.sp; return ovr(sp) >= 84 && sp.rep >= 60; };
