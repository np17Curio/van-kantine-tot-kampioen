import { S, club, mod, seizoenLabel } from '../../core/state.js';
import { geldTxt } from '../../core/utils.js';
import { KRANTEN } from '../media/nieuws.js';
import { RODDELBLADEN, krantMelding, roddel } from '../media/roddel.js';
import { isProf } from './sponsors.js';
import { focusBoost } from '../wedstrijd/momenten.js';

/* ===================== Goede doelen ===================== */
export const STICHTING_PRIJS = 100000;
export function goedDoel(id){
  const sp = S.sp, w = S.week; if (w.goed) return; let t;
  const telGoed = () => { S.ss.goed = (S.ss.goed || 0) + 1; S.car.goed = (S.car.goed || 0) + 1; };
  if (id === 'ziekenhuis'){ mod('moraal', 4); mod('rep', 1); focusBoost(2); t = 'Je bezoekt het kinderziekenhuis met een tas vol shirts en ballen. De kinderen stralen. Jij ook.';
    roddel(`${sp.naam} verrast zieke kinderen`, 'Hij bleef de hele middag, terwijl er maar een uurtje gepland was.'); }
  else if (id === 'clinic'){ mod('moraal', 3); mod('rep', 1); mod('fit', -3); t = 'Je geeft een voetbalclinic bij een jeugdclub in de buurt. Honderd kinderen willen allemaal een panna op je proberen.'; }
  else if (id === 'doneren'){ const b = Math.max(100, Math.round(sp.geld * .1)); if (sp.geld < b) return; sp.geld -= b; mod('moraal', 3); mod('rep', Math.min(5, 1 + Math.round(Math.log10(b) - 2)));
    t = `Je doneert ${geldTxt(b)} aan een goed doel. Ze sturen je een bedankkaart, getekend door alle vrijwilligers.`;
    if (b >= 10000) roddel(`${sp.naam} doneert ${geldTxt(b)}`, 'Het geld gaat naar sportclubs voor kinderen die het thuis niet breed hebben.'); }
  else if (id === 'stichting'){ if (sp.stichting || sp.geld < STICHTING_PRIJS) return; sp.geld -= STICHTING_PRIJS; sp.stichting = {naam:`Stichting ${sp.naam}`, jaar:S.jaar}; mod('moraal', 10); mod('rep', 6);
    S.car.hist.push(`${seizoenLabel()}: Stichting ${sp.naam} opgericht`); t = `Je richt Stichting ${sp.naam} op: elke kind moet kunnen voetballen. Elke week geeft dat je een goed gevoel.`;
    krantMelding(`${sp.naam} richt eigen stichting op`, '"Ik wil iets teruggeven," zegt hij. De stichting helpt kinderen die geen contributie kunnen betalen.', isProf() ? RODDELBLADEN : KRANTEN[club().t]); }
  if (!t) return; w.goed = id; telGoed(); w.tekst.push(t);
}
