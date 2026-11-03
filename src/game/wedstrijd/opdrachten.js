import { S, mod } from '../../core/state.js';
import { pick, rnd } from '../../core/utils.js';

/* ===================== Wedstrijddoelen en sterren ===================== */
// Elke wedstrijd waarin je speelt krijgt drie doelen: één bij je positie, één over de uitslag en één over jezelf.
// Elk gehaald doel is een ster (0 tot 3). Sterren geven vertrouwen; drie sterren is een perfecte wedstrijd.
// t: de tekst · ok(M): gehaald aan het einde · al(M): tijdens de wedstrijd al zeker gehaald (voor het vinkje) · nu(M): de stand nu
const DOELEN = {
  goal:     {t:'Scoor een goal', ok:M => M.goals >= 1, al:M => M.goals >= 1, nu:M => `${M.goals}/1`},
  goal2:    {t:'Scoor twee keer', ok:M => M.goals >= 2, al:M => M.goals >= 2, nu:M => `${M.goals}/2`},
  assist:   {t:'Geef een assist', ok:M => M.assists >= 1, al:M => M.assists >= 1, nu:M => `${M.assists}/1`},
  betrokken:{t:'Wees bij 2 goals betrokken', ok:M => M.goals + M.assists >= 2, al:M => M.goals + M.assists >= 2, nu:M => `${M.goals + M.assists}/2`},
  nul:      {t:'Houd de nul', ok:M => M.them === 0, nu:M => `${M.them} tegen`},
  max1:     {t:'Laat hoogstens 1 goal toe', ok:M => M.them <= 1, nu:M => `${M.them} tegen`},
  winst:    {t:'Win de wedstrijd', ok:M => M.us > M.them, nu:M => `${M.us}-${M.them}`},
  ruim:     {t:'Win met 2 goals verschil', ok:M => M.us - M.them >= 2, nu:M => `${M.us}-${M.them}`},
  punt:     {t:'Verlies niet', ok:M => M.us >= M.them, nu:M => `${M.us}-${M.them}`},
  cijfer:   {t:'Haal een 7,5 of hoger', ok:M => M.cijfer >= 7.5},
  cijfer7:  {t:'Haal een 7 of hoger', ok:M => M.cijfer >= 7},
  netjes:   {t:'Blijf zonder kaart', ok:M => !M.geel && !M.rood, nu:M => M.rood ? 'rood' : M.geel ? 'geel' : 'nog geen'},
};
export const opdrachtTekst = id => DOELEN[id] ? DOELEN[id].t : id;

// T en O: de sterkte van jullie en van de tegenstander (zoals in planWedstrijd)
export function maakOpdrachten(M, T, O){
  if (M.opdrachten || M.selectie || !(M.rol === 'basis' || M.rol === 'invaller')) return;
  const pos = S.sp.pos, inval = M.rol === 'invaller', verschil = T - O;
  const eigen = pos === 'KEEPER' ? (verschil > 2 ? 'nul' : 'max1')
    : pos === 'VERD' ? (inval ? 'max1' : rnd() < .5 ? 'nul' : pick(['max1', 'assist']))
    : inval ? pick(pos === 'SPITS' ? ['goal', 'goal', 'assist'] : ['assist', 'goal'])
    : pos === 'SPITS' ? (verschil > 4 && rnd() < .5 ? 'goal2' : rnd() < .7 ? 'goal' : 'betrokken')
    : pick(['assist', 'assist', 'goal', 'betrokken']);
  const uitslag = verschil > 4 ? pick(['ruim', 'winst']) : verschil < -3 ? 'punt' : 'winst';
  const jij = inval ? (rnd() < .6 ? 'cijfer7' : 'netjes') : rnd() < .7 ? 'cijfer' : 'netjes';
  M.opdrachten = [eigen, uitslag, jij];
}
// Tijdens de wedstrijd: per doel {t, klaar, nu}
export const opdrachtStand = M => (M.opdrachten || []).map(id => { const d = DOELEN[id]; return {id, t:d.t, klaar:!!(d.al && d.al(M)), nu:d.nu ? d.nu(M) : ''}; });

// Na de wedstrijd (naast topBonus): de sterren tellen en belonen
export function sterrenNa(M){
  if (!M.opdrachten || M.sterren) return M.sterren || null;
  const per = M.opdrachten.map(id => ({id, t:DOELEN[id].t, ok:!!DOELEN[id].ok(M)})), n = per.filter(x => x.ok).length;
  if (n) mod('vert', 2 * n);
  if (n === 3){ mod('rep', 1); mod('moraal', 3); }
  const ss = S.ss; ss.sterren = (ss.sterren || 0) + n; ss.sterrenMax = (ss.sterrenMax || 0) + 3; if (n === 3) ss.perfect = (ss.perfect || 0) + 1;
  const C = S.car; C.sterren = (C.sterren || 0) + n; if (n === 3) C.perfect = (C.perfect || 0) + 1;
  M.sterren = {n, per, tekst:n === 3 ? 'Perfecte wedstrijd! Vertrouwen +6, reputatie +1, moraal +3.' : n ? `Vertrouwen +${2 * n}.` : 'Geen sterren deze keer.'};
  return M.sterren;
}
