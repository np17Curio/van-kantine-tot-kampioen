import { esc } from '../../core/utils.js';
import { opdrachtStand } from '../../game/wedstrijd/opdrachten.js';

/* ===================== Wedstrijddoelen en sterren in beeld ===================== */
// Voor en tijdens de wedstrijd: de drie doelen (een vinkje zodra een doel zeker gehaald is)
export function vDoelenBalk(M, intro = false){
  const l = opdrachtStand(M); if (!l.length) return '';
  return `<div class="doelenbalk${intro ? ' intro' : ''}"><span class="label">${intro ? 'Doelen van vandaag' : 'Doelen'} · ${'☆'.repeat(3)}</span>
    <ul>${l.map(d => `<li class="${d.klaar ? 'klaar' : ''}"><span class="vink">${d.klaar ? '✓' : '○'}</span>${esc(d.t)}${!intro && d.nu && !d.klaar ? ` <span class="muted">(${esc(d.nu)})</span>` : ''}</li>`).join('')}</ul></div>`;
}
// Na de wedstrijd: de sterren poppen één voor één op, met per doel gehaald of niet
export function vSterren(M){
  const s = M && M.sterren; if (!s) return '';
  return `<div class="sterrenblok${s.n === 3 ? ' perfect' : ''}"><div class="sterren" aria-label="${s.n} van de 3 sterren">${[0, 1, 2].map(i => `<span class="ster${i < s.n ? ' aan' : ''}" style="--i:${i}">★</span>`).join('')}</div>
    <ul>${s.per.map(d => `<li class="${d.ok ? 'klaar' : 'mis'}"><span class="vink">${d.ok ? '✓' : '✗'}</span>${esc(d.t)}</li>`).join('')}</ul>
    <p class="${s.n === 3 ? 'perfecttxt' : 'muted'}">${esc(s.tekst)}</p></div>`;
}
