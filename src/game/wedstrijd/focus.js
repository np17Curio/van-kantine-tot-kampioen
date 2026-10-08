import { S, mod } from '../../core/state.js';
import { FLOW, SLECHTE_FOCUS, focusBoost } from './momenten.js';

/* ===================== Focus na de wedstrijd ===================== */
export function focusNaWedstrijd(M){
  const sp = S.sp; if (M.cijfer === null || M.cijfer === undefined) return;
  const c = M.cijfer, x = M.derby ? 1.5 : 1;
  if (c <= 6) mod('focus', -(4 + (6 - c) * 4) * x);
  else if (c >= 7.5) focusBoost((2 + (c - 7.5) * 1.5) * x);
  const van = M.focusStart ?? Math.round(sp.focus), naar = Math.round(sp.focus);
  const uitleg = c <= 6 ? 'Na deze matige wedstrijd zit je hoofd vol. Je focus zakt.' : c >= 7.5 ? (naar >= FLOW ? 'Je zit in een geweldige flow!' : 'Je zit lekker in je spel. Je focus groeit.') : '';
  M.focusTekst = naar === van ? null : `Focus ${van} → ${naar}.${uitleg ? ' ' + uitleg : ''}${naar < SLECHTE_FOCUS ? ' Pas op: met zo weinig focus gaan je acties vaker mis. Rustig aan doen helpt.' : ''}`;
  M.focusOmlaag = naar < van;
}
