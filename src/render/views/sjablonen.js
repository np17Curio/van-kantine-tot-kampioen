import { tmp } from '../../core/state.js';
import { act, effecten } from '../../core/ui.js';
import { esc } from '../../core/utils.js';

/* ===================== Sjablonen: vaste bouwstenen voor de schermen ===================== */
// Elk onderdeel van het weekscherm heeft dezelfde vorm: een blok met een klein label, de kern, en alles wat minder belangrijk
// is ingeklapt onder "Meer". Zo blijft het scherm rustig en weet je altijd waar iets staat.

// Een uitklapdeel. Open of dicht wordt onthouden per sleutel (main.js luistert naar 'toggle' op details[data-meer])
export function meer(sleutel, label, inhoud, {open = false} = {}){
  if (!inhoud) return '';
  const o = tmp.meer && sleutel in tmp.meer ? tmp.meer[sleutel] : open;
  return `<details class="meer" data-meer="${esc(sleutel)}" ${o ? 'open' : ''}><summary>${label}</summary><div class="meerinhoud">${inhoud}</div></details>`;
}

// Een blok: {label, titel, inhoud, meer (html), meerLabel, sleutel, cls, id, rechts (iets rechts naast het label)}
export function blok({label = '', titel = '', inhoud = '', meer: m = '', meerLabel = 'Meer', sleutel = '', cls = '', id = '', rechts = ''} = {}){
  return `<section class="sblok ${cls}"${id ? ` id="${id}"` : ''}>
    ${label || rechts ? `<div class="blokkop">${label ? `<span class="label">${label}</span>` : '<span></span>'}${rechts}</div>` : ''}
    ${titel ? `<h3 class="bloktitel">${titel}</h3>` : ''}
    ${inhoud}
    ${m ? meer(sleutel || label, meerLabel, m) : ''}
  </section>`;
}

// Hooguit `max` labeltjes op één rij (de belangrijkste eerst)
export const chips = (lijst, max = 3) => { const l = lijst.filter(Boolean).slice(0, max); return l.length ? `<div class="chiprij">${l.join('')}</div>` : ''; };

// Een compacte actietegel: titel en één regel effecten; de uitleg als tooltip
export function tegel(titel, effect, fn, {uitleg = '', extra = ''} = {}){
  return `<button class="keuze tegel" data-i="${act(fn)}"${uitleg ? ` title="${esc(uitleg)}"` : ''} ${extra}><span class="t">${titel}</span>${effect ? `<span class="s">${effecten(effect)}</span>` : ''}</button>`;
}

// Een lijst die na `max` regels inklapt ("nog 3 ▾")
export function regels(lijst, max, sleutel, cls = 'moment'){
  if (!lijst.length) return '';
  const p = x => `<p class="${cls}">${x}</p>`;
  return lijst.slice(0, max).map(p).join('') + (lijst.length > max ? meer(sleutel, `nog ${lijst.length - max} ▾`, lijst.slice(max).map(p).join('')) : '');
}
