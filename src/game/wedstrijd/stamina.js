import { S } from '../../core/state.js';
import { clamp, randInt } from '../../core/utils.js';

/* ===================== Stamina in de wedstrijd ===================== */
// Je begint met je fitheid. Elke minuut in het veld kost wat, en elke actie kost meer naarmate ze moeilijker is.
// Met een goede conditie raak je minder snel leeg. Is je stamina op, dan haalt de trainer je eraf.
const SOORT = {drib:1.2, verd:1.2, afw:1.2, pas:.9, kalm:.4};
export const WAARSCHUW = 8;
const zuinig = () => 1.25 - (S.sp.a.cond ?? 50) / 200;

// min = de minuut waarop je het veld in komt
export function staminaStart(M, min){
  M.stam = {start:S.sp.fit, vanaf:min, kosten:0};
  if (M.wisselGrens === undefined) M.wisselGrens = randInt(20, 30);
}
export function stamina(M){
  if (!M || !M.stam) return S.sp.fit;
  const s = M.stam, tot = M.gewisseld ?? M.min;
  return clamp(s.start - Math.max(0, tot - s.vanaf) * .1 * zuinig() - s.kosten, 0, 100);
}
// Wat een actie kost: hoe moeilijker (opt.b), hoe meer
export function actieKosten(opt){
  return Math.max(1, Math.round((1 + (opt.b - 30) / 8) * (SOORT[opt.st] ?? 1) * zuinig() * .8));
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
    M.log.push({m:M.min + "'", t:'Je benen worden zwaar. Langs de lijn begint een wisselspeler warm te lopen. Kies wat rustigere acties.', k:'gevaar'});
  }
  if ((st <= M.wisselGrens && M.min >= 55) || (st < 12 && M.min >= 25)){
    M.gewisseld = M.min;
    M.log.push({m:M.min + "'", t:`${coach} haalt je naar de kant. Je bent helemaal kapot. Je krijgt een klopje op je schouder en gaat op de bank zitten.`, k:'mis'});
  }
}
// Na afloop: wat je stamina nog is, is je nieuwe fitheid
export function staminaNaWedstrijd(M){
  const voor = S.sp.fit;
  if (!M.stam) staminaStart(M, M.min); // invaller die toch niet het veld in kwam
  S.sp.fit = Math.round(stamina(M));
  M.fitVoor = voor;
}
