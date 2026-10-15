import { S, club, mod } from '../../core/state.js';
import { clamp, esc, geldTxt, pick, rnd } from '../../core/utils.js';
import { AANV } from '../../data/gegevens.js';
import { RODDELBLADEN, krantMelding } from '../media/roddel.js';
import { isProf } from '../prive/sponsors.js';
import { statusPunten } from './status.js';
import { ergernis } from '../team/tucht.js';
import { ck } from '../transfers/buitenland.js';
import { modFans } from '../wedstrijd/fans-pers.js';
import { balk } from '../../render/views/zijbalk.js';
import { pers } from './persoonlijkheid.js';

/* ===================== Kalmte ===================== */
// Kalmte = basis (moraal, leeftijd, aanvoerder, mentale coach) min wat je dwarszit: lage focus, ruzies thuis, in de kleedkamer of met de fans.
// Ruzies die net gebeurd zijn tellen als 'onrust'; die zakt elke week een stuk
export const kalmData = () => S.sp.kalm || (S.sp.kalm = {onrust:0, red:[], vorig:null});
export function onrust(n, reden){
  const k = kalmData(); k.onrust = clamp(k.onrust + n, 0, 60);
  if (reden){ const r = k.red.find(x => x.t === reden); if (r){ r.w = 4; r.n += n; } else k.red.push({t:reden, w:4, n}); }
}
export function kalmBasis(){ const sp = S.sp; return sp.moraal * .5 + sp.leeftijd * 1.2 + 10 + (sp.statusNiveau >= AANV ? 8 : 0) + (sp.items.mentaal ? 6 : 0) + pers('kalm'); }
// Wat er nu aan je trekt (live), met hoeveel punten
export function kalmMinpunten(){
  const sp = S.sp, l = [], f = sp.focus ?? 65;
  if (f < 50) l.push(['Lage focus', (50 - f) * .5]);
  if (sp.ouders && sp.ouders.boos) l.push(['Ruzie met je ouders', 6]);
  else if (sp.ouders && (sp.ouders.band ?? 70) < 30) l.push(['Slechte band met je ouders', 5]);
  if (sp.relatie && sp.relatie.band < 30) l.push([`Vaak ruzie met ${sp.relatie.naam}`, 8]);
  else if (sp.relatie && sp.relatie.band < 45) l.push([`Het gaat minder met ${sp.relatie.naam}`, 3]);
  if (!sp.o23 && sp.kleed && sp.kleed.club === ck(sp.club)){ const vijand = Object.values(sp.kleed.rel).filter(v => v < 25).length; if (vijand) l.push([`${vijand} ${vijand === 1 ? 'teamgenoot' : 'teamgenoten'} met wie je overhoop ligt`, Math.min(9, vijand * 3)]); }
  if (!sp.o23 && sp.fans && sp.fans[ck(sp.club)] !== undefined && sp.fans[ck(sp.club)] < 25) l.push(['De fans zijn tegen je', 6]);
  if (sp.verl && sp.verl.meter >= 50) l.push(['De drang naar het casino of feesten', 5]);
  const k = kalmData(); if (k.onrust >= 1) l.push([k.red.length ? k.red.map(r => r.t).join(', ') : 'Recent gedoe', k.onrust]);
  return l;
}
export function kalmte(){ return clamp(Math.round(kalmBasis() - kalmMinpunten().reduce((a, x) => a + x[1], 0)), 5, 99); }
// Elke week: onrust zakt, en ruzies van afgelopen week (een flinke daling van een band) tellen mee
export function kalmWeek(eerste){
  const sp = S.sp, k = kalmData();
  const nu = {rel: sp.relatie ? sp.relatie.band : null, relNaam: sp.relatie ? sp.relatie.naam : null, oud: sp.ouders ? (sp.ouders.band ?? 70) : 70, fans: sp.fans && sp.fans[ck(sp.club)] !== undefined ? sp.fans[ck(sp.club)] : null, club: ck(sp.club)};
  if (!eerste){
    k.onrust = k.onrust * .7; if (k.onrust < 1) k.onrust = 0;
    k.red.forEach(r => r.w--); k.red = k.red.filter(r => r.w > 0);
    const v = k.vorig;
    if (v){
      if (v.rel !== null && nu.rel !== null && v.relNaam === nu.relNaam && v.rel - nu.rel >= 8) onrust((v.rel - nu.rel) * .6, `Ruzie met ${nu.relNaam}`);
      if (v.oud - nu.oud >= 6) onrust((v.oud - nu.oud) * .6, 'Ruzie met je ouders');
      if (v.fans !== null && nu.fans !== null && v.club === nu.club && v.fans - nu.fans >= 8) onrust((v.fans - nu.fans) * .4, 'Gedoe met de fans');
    }
  }
  k.vorig = nu;
}
// Ruzie tijdens het stappen: hoe lager je kalmte, hoe groter de kans
export const kroegKans = () => clamp((60 - kalmte()) / 70 * pers('kroeg'), 0, .5);
export function kroegEvent(){
  const sp = S.sp, prof = isProf(), boete = Math.max(100, Math.round(sp.salaris * .05 / 100) * 100);
  return {soort:'prive', tekst:pick([`Laat op de avond botst iemand tegen je aan. Je drankje valt op de grond. "Kijk uit waar je loopt," snauwt hij.${prof ? ' Hij herkent je: "Hé, jij bent toch die voetballer? Stelt niks voor."' : ''}`, `Bij de bar begint een groepje jongens je uit te lachen.${prof ? ` "${club().n} speelt voor geen meter, en jij al helemaal niet."` : ''} Je voelt je bloed koken.`]), opts:[
    {l:'Weglopen', f(){ if (rnd() < kalmte() / 100 + .2){ return 'Je haalt diep adem en loopt weg. Je vrienden geven je een schouderklopje. Niet de moeite waard.'; } onrust(3, 'Ruzie in de kroeg'); return 'Je wilt weglopen, maar hij loopt je achterna en blijft roepen. Je vrienden trekken je mee naar buiten. De avond is verpest.'; }},
    {l:'Terugduwen', f(){
      if (rnd() < .5){ onrust(8, 'Vechtpartij in de kroeg'); ergernis(25); mod('rep', -4); mod('vert', -10); statusPunten(-4); sp.geld = Math.max(0, sp.geld - boete); modFans(-6);
        if (prof) krantMelding(`${sp.naam} betrokken bij vechtpartij`, `De speler van ${club().n} werd in de nacht van vrijdag op zaterdag door de beveiliging uit een café gezet. De club is "zeer teleurgesteld".`, RODDELBLADEN);
        const schors = rnd() < .3; if (schors) sp.geschorst = (sp.geschorst || 0) + 1;
        return `Het loopt uit de hand. De beveiliging haalt jullie uit elkaar en zet je op straat. De club hoort ervan: boete van ${geldTxt(boete)}${schors ? ' en je mag de volgende wedstrijd niet meespelen' : ''}. De trainer is woedend.`; }
      onrust(4, 'Ruzie in de kroeg'); ergernis(6); mod('rep', -1); return 'Je duwt terug. Voordat het escaleert, stapt de beveiliging ertussen. Jullie moeten allebei naar huis.'; }},
    {l:'Je vrienden laten ingrijpen', f(){ onrust(2, 'Ruzie in de kroeg'); mod('moraal', -2); return 'Je vrienden gaan tussen jullie in staan en praten de boel sussend. Je gaat vroeg naar huis, nog steeds boos.'; }}]};
}
export function vKalmte(){
  const k = kalmte(), l = kalmMinpunten().filter(x => x[1] >= 2).sort((a, b) => b[1] - a[1]);
  return `${balk('Kalmte', k, 'st')}${l.length ? `<p class="muted klein-tekst" style="margin-top:-2px">Kalmte omlaag door: ${l.map(x => esc(x[0].charAt(0).toLowerCase() + x[0].slice(1))).join(' · ')}</p>` : ''}`;
}
