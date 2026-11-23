import { weerEffect } from './weer.js';
import { S } from '../../core/state.js';
import { clamp, randInt, rnd } from '../../core/utils.js';
import { pers } from '../speler/persoonlijkheid.js';
import { lichaamStamina } from '../speler/lichaam.js';

/* ===================== Stamina in de wedstrijd ===================== */
// Je begint met je fitheid. Elke minuut in het veld kost wat, en elke actie kost meer naarmate ze moeilijker is.
// Met een goede conditie raak je minder snel leeg. Is je stamina op, dan haalt de trainer je eraf.
const SOORT = {drib:1.2, verd:1.2, afw:1.2, pas:.9, kalm:.4};
export const WAARSCHUW = 8;
const zuinig = () => (1.25 - (S.sp.a.cond ?? 50) / 200) * pers('stamina') * lichaamStamina() * (S.M ? weerEffect().stamina : 1); // (zwaarder: sneller moe; sneeuw en hitte ook: weer.js)
// Leeftijd: vanaf je 30e raak je sneller leeg, vooral in het laatste half uur. Een goede conditie blijft helpen.
const lft = () => S.sp.leeftijd ?? 25;
// (de eerste jaren na je 29e gaat het snel, daarna wat geleidelijker)
const jaren = () => Math.max(0, lft() - 29), stap = (a, b) => a * Math.min(jaren(), 2) + b * Math.max(0, jaren() - 2);
export const leeftijdFactor = () => 1 + stap(.35, .03);
const laatFactor = () => stap(4, .5); // extra verbruik na minuut 60 (31 jaar: ±0,8 per minuut)
export const isRoutinier = () => lft() >= 30;

// min = de minuut waarop je het veld in komt
export function staminaStart(M, min){
  // dag: de ene dag voel je je fris, de andere dag zijn je benen zwaar (±15% verbruik per minuut)
  M.stam = {start:S.sp.fit, vanaf:min, kosten:0, dag:.85 + rnd() * .3};
  // De trainer spaart een routinier eerder (vanaf 31 jaar)
  if (M.wisselGrens === undefined) M.wisselGrens = randInt(20, 30) + Math.max(0, lft() - 30);
}
export function stamina(M){
  if (!M || !M.stam) return S.sp.fit;
  const s = M.stam, tot = M.gewisseld ?? M.min, laat = Math.max(0, tot - Math.max(60, s.vanaf));
  return clamp(s.start - (Math.max(0, tot - s.vanaf) * leeftijdFactor() + laat * laatFactor()) * .1 * zuinig() * (s.dag ?? 1) - s.kosten, 0, 100);
}
// Wat een actie kost: hoe moeilijker (opt.b), hoe meer
export function actieKosten(opt){
  return Math.max(1, Math.round((1 + (opt.b - 30) / 8) * (SOORT[opt.st] ?? 1) * zuinig() * .8 * leeftijdFactor()));
}
export function gebruik(M, opt){ if (M.stam) M.stam.kosten += actieKosten(opt); }
// Sta je in het veld (en niet gewisseld of met rood eraf)?
export const inHetVeld = M => !!M.stam && !M.rood && M.gewisseld === undefined;
// De trainer houdt je in de gaten: eerst warmt er iemand op, daarna ga je eraf
export function wisselCheck(M){
  if (M.rol !== 'basis' || !inHetVeld(M) || M.klaar) return;
  const st = stamina(M), coach = M.inter ? 'De bondscoach' : 'De trainer';
  if (!M.wisselWaarschuwing && st < M.wisselGrens + WAARSCHUW && M.min >= 40){
    M.wisselWaarschuwing = true;
    M.log.push({m:M.min + "'", t:`Je benen worden zwaar${isRoutinier() ? ` (je bent ${lft()}: de laatste minuten worden zwaarder)` : ''}. Langs de lijn begint een wisselspeler warm te lopen. Kies wat rustigere acties.`, k:'gevaar'});
  }
  if ((st <= M.wisselGrens && M.min >= (lft() >= 31 ? 50 : 55)) || (st < 12 && M.min >= 25)){
    M.gewisseld = M.min;
    M.log.push({m:M.min + "'", t: isRoutinier() ? `${coach} haalt je naar de kant. Je bent ${lft()} en de benen willen niet meer: "Goed gedaan, ik spaar je voor de volgende wedstrijd." Een klopje op je schouder en je gaat op de bank zitten.` : `${coach} haalt je naar de kant. Je bent helemaal kapot. Je krijgt een klopje op je schouder en gaat op de bank zitten.`, k:'mis'});
  }
}
// Na afloop: wat je stamina nog is, is je nieuwe fitheid
export function staminaNaWedstrijd(M){
  const voor = S.sp.fit;
  if (!M.stam) staminaStart(M, M.min); // invaller die toch niet het veld in kwam
  S.sp.fit = Math.round(stamina(M));
  M.fitVoor = voor;
}
