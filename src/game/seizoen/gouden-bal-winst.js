import { S, club, mod, seizoenLabel } from '../../core/state.js';
import { keuzeKnop } from '../../core/ui.js';
import { esc, geldTxt } from '../../core/utils.js';
import { KRANTEN, fotoVan } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { mijnMerken } from '../prive/merken.js';
import { social, volgersTxt } from '../prive/social.js';
import { toonMeter } from '../speler/journey.js';
import { iedereen } from '../team/kleedkamer.js';
import { modFans } from '../wedstrijd/fans-pers.js';
import { ik } from '../../core/geslacht.js';

/* ===================== De Gouden Bal winnen ===================== */
// Een gala met een speech (kalm/gebalanceerd/fel), en gevolgen: salaris, volgers, sponsorbonussen, hype voor je merken,
// een gegarandeerd aanbod voor een levenslange deal, vanaf de 2e Gouden Bal een standbeeld, en reacties van je vriend, rivaal en opa.
export function goudenBalWinst(){
  const sp = S.sp, c = club(), uit = [], aantal = S.car.prijzen.filter(p => /^Gouden Bal/.test(p)).length; // (deze al meegeteld)
  if (!sp.clubloos){ const oud = sp.salaris; sp.salaris = Math.round(sp.salaris * 1.3 / 1000) * 1000; uit.push(`${c.n} beloont je met een nieuw contract: je salaris gaat van ${geldTxt(oud)} naar ${geldTxt(sp.salaris)} per jaar.`); }
  const so = social(), n = Math.max(200000, Math.round(so.volgers * .25)); so.volgers += n; uit.push(`+${volgersTxt(n)} volgers: de hele wereld wil je volgen.`);
  const deals = sp.sponsors || []; if (deals.length){ const b = deals.reduce((a, d) => a + Math.round(d.bedrag * .5), 0); sp.geld += b; uit.push(`Je sponsors betalen een bonus van samen ${geldTxt(b)}.`); }
  const merken = mijnMerken(); if (merken.length){ merken.forEach(m => { m.hype = 100; }); uit.push(`Je merken (${merken.map(m => m.naam).join(', ')}) gaan door het dak: hype 100.`); }
  (sp.levenslang = sp.levenslang || {aanbod:0, laatste:null}).gb = true; // het volgende sponsormoment: een levenslang aanbod
  if (aantal >= 2 && !sp.clubloos && !S.car.prijzen.includes(`Standbeeld bij ${c.n}`)){
    S.car.prijzen.push(`Standbeeld bij ${c.n}`); S.car.hist.push(`${seizoenLabel()}: standbeeld bij het stadion van ${c.n}`);
    krantMelding(`${c.n} onthult standbeeld van ${sp.naam}`, `Na ${ik.zijn} ${aantal}e Gouden Bal staat ${ik.hij} voor altijd in brons bij het stadion.`, KRANTEN[0]);
    uit.push(`Na je ${aantal}e Gouden Bal krijg je een standbeeld bij het stadion van ${c.n}!`);
  }
  // reacties in je eerste week van het nieuwe seizoen
  const r = [], v = sp.vriend, R = sp.rivaal;
  if (v && !v.weg) r.push(`${v.voornaam} appt: "Ik zei het toch, broer! De beste van de wereld. Vanaf het jeugdtoernooi wist ik het al."`);
  if (R) r.push((R.band || 0) >= 20 ? `Je rivaal ${R.v}. ${R.n} feliciteert je: "Verdiend. Volgend jaar is hij van mij."` : `Je rivaal ${R.v}. ${R.n} in een interview: "Gouden Bal? Ik had hem ook kunnen winnen als ik bij zijn club speelde."`);
  if (sp.opa) r.push(`Opa ${sp.opa.naam} belt: "Ik heb de uitzending drie keer teruggekeken. Ik heb het hele dorp gebeld."`);
  S.gbReacties = r;
  S.eind.gala = {keuze:null, uit:null, gevolgen:uit};
  krantMelding(`${sp.naam} wint de Gouden Bal!`, 'De beste ' + ik.speler + ' van de wereld. Een droom die uitkomt voor de ' + ik.jongen + ' uit de kantine.', KRANTEN[0], fotoVan('goudenbal', `${sp.naam} met de Gouden Bal.`));
}
// De speech op het gala
export function galaSpeech(i){
  const sp = S.sp, G = S.eind && S.eind.gala; if (!G || G.keuze != null) return;
  const opa = sp.opa ? `opa ${sp.opa.naam}` : sp.vriend ? sp.vriend.voornaam : 'mijn moeder';
  G.keuze = i;
  if (i === 0){ toonMeter('kalm'); mod('rep', 3); iedereen(3); mod('vert', 5); G.uit = 'Een bescheiden speech. Je ploeggenoten kijken trots, de trainer knikt. Reputatie +3, vertrouwen +5.'; }
  else if (i === 1){ toonMeter('bal'); mod('moraal', 10); const n = Math.round(social().volgers * .05); social().volgers += n; G.uit = `Je stem breekt als je ${opa} bedankt. De clip gaat de wereld rond: +${volgersTxt(n)} volgers.`; }
  else { toonMeter('fel'); modFans(10); mod('vert', -3); const n = Math.round(social().volgers * .08); social().volgers += n; krantMelding(`Arrogant? ${sp.naam}: "Ik ben de beste"`, '' + ik.Zijn + ' speech op het gala zorgt voor discussie. ' + ik.Zijn + ' fans vinden het geweldig.'); G.uit = `De zaal valt even stil, en dan juichen je fans. +${volgersTxt(n)} volgers, fans +10. De trainer is minder blij.`; }
}
export function vGala(){
  const sp = S.sp, G = S.eind && S.eind.gala; if (!G) return '';
  const zaal = [sp.relatie ? sp.relatie.naam : 'je moeder', sp.opa ? `opa ${sp.opa.naam}` : '', sp.vriend && !sp.vriend.weg ? sp.vriend.voornaam : ''].filter(Boolean).join(', ');
  const opts = [['🧊 "Dit is voor mijn team en mijn familie."', 'reputatie + · vertrouwen +'], [`⚖️ "${sp.opa ? `Opa ${sp.opa.naam}` : 'Mam'}, dit is voor jou."`, 'moraal + · de clip gaat viral'], ['🔥 "Ik ben de beste. En dit is pas het begin."', 'fans + · volgers + · de trainer minder blij']];
  return `<div class="kampioen"><span class="label">Parijs · het gala van de Gouden Bal</span><h2>🏆 De beste speler van de wereld</h2>
    <p>De lichten gaan uit. De presentator opent de envelop... "De Gouden Bal gaat naar: <b>${esc(sp.naam)}</b>!" In de zaal springen ${esc(zaal)} op.</p>
    ${G.keuze == null ? `<p>Je loopt naar het podium. Wat zeg je?</p><div class="keuzes">${opts.map(([l, s], i) => keuzeKnop(esc(l), s, () => galaSpeech(i), 'data-blijf')).join('')}</div>` : `<p class="melding">${esc(G.uit)}</p>`}
    <ul>${G.gevolgen.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
}
// In de eerste week van het nieuwe seizoen: de reacties
export function galaReacties(){ if (S.gbReacties && S.week){ S.week.tekst.push(...S.gbReacties); S.gbReacties = null; } }
