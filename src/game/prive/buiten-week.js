import { S, mod } from '../../core/state.js';
import { geldTxt, pick, rnd } from '../../core/utils.js';
import { DIEREN, dieren } from './dieren.js';
import { geldZaken } from './geld.js';
import { influencerPerWeek, kledingPerWeek } from './social.js';
import { verlWeek } from './verleidingen.js';

/* ===================== Elke week buiten het voetbal ===================== */
export function buitenWeek(eerste){
  if (eerste) return;
  const sp = S.sp, w = S.week, z = geldZaken();
  dieren().forEach(d => { d.weken++; sp.geld = Math.max(0, sp.geld - DIEREN[d.soort].kost); });
  const d = dieren().length ? pick(dieren()) : null;
  if (d && (d.soort === 'hond' || d.soort === 'kat')){
    if (rnd() < .06) w.tekst.push(d.soort === 'hond' ? pick([`${d.naam} heeft je nieuwe voetbalschoenen opgegeten. Je lacht er maar om.`, `${d.naam} wacht elke dag kwispelend bij de deur als je thuiskomt.`]) : pick([`${d.naam} heeft je shirt als bed ingepikt.`, `${d.naam} gooit je trofee van de kast. Gelukkig is hij heel.`])); }
  const inf = influencerPerWeek(); if (inf){ sp.geld += inf; S.car.influencer = (S.car.influencer || 0) + inf; }
  const kl = kledingPerWeek(); if (kl){ sp.geld += kl; sp.merk.totaal += kl; }
  // Aandelen: meestal kleine schommelingen, soms een flinke klap of een uitschieter
  if (z.aandelen > 0){ let r = (rnd() - .45) * .08; if (rnd() < .03) r = -.2; else if (rnd() < .03) r = .18; const voor = z.aandelen; z.aandelen = Math.max(0, Math.round(z.aandelen * (1 + r))); z.laatsteKoers = z.aandelen - voor;
    if (r <= -.2) w.tekst.push(`Beurscrash! Je aandelen zijn ${geldTxt(-z.laatsteKoers)} minder waard.`); else if (r >= .18) w.tekst.push(`Je aandelen schieten omhoog: +${geldTxt(z.laatsteKoers)}!`); }
  if (z.zaak){ const zk = z.zaak; zk.weken++; let wst = Math.round(zk.winst * (.4 + rnd() * 1.2)); if (rnd() < .06){ wst = -zk.winst * 2; w.tekst.push(`Slechte week voor je ${zk.n.toLowerCase()}: ${pick(['de koelcel is kapot', 'een personeelslid is gestopt', 'de gemeente breekt de straat open'])}. Verlies: ${geldTxt(-wst)}.`); }
    sp.geld = Math.max(0, sp.geld + wst); zk.totaal += wst; zk.laatste = wst; }
  if (sp.stichting) mod('moraal', 1);
  verlWeek();
}
export function seizoenGeld(){
  const sp = S.sp, z = geldZaken(), uit = [];
  if (z.spaar > 0){ const r = Math.round(z.spaar * .02); z.spaar += r; uit.push(`Rente op je spaarrekening: +${geldTxt(r)}.`); }
  if (z.zaak) uit.push(`Je ${z.zaak.n.toLowerCase()} heeft tot nu toe ${z.zaak.totaal >= 0 ? geldTxt(z.zaak.totaal) + ' winst' : geldTxt(-z.zaak.totaal) + ' verlies'} opgeleverd.`);
  if (S.car.influencer) uit.push(`Met betaalde posts heb je in totaal ${geldTxt(S.car.influencer)} verdiend.`);
  return uit;
}
