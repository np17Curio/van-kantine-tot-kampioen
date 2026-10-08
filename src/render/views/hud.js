import { S, club, ovr, seizoenLabel } from '../../core/state.js';
import { clamp, esc, geldTxt } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS, NIVEAU, POS } from '../../data/gegevens.js';
import { statusNaam, statusNiveau } from '../../game/speler/status.js';
import { rugnummer } from '../../game/team/rugnummers.js';

// Kleine meter in de HUD: rood onder 35, geel tot 60, groen daarboven (focus vanaf 80: flow)
function meter(kort, lang, v, flow){
  v = Math.round(v ?? 0);
  const cls = v < 35 ? 'laag' : v < 60 ? 'mid' : flow && v >= 80 ? 'flow' : 'goed';
  return `<div class="meter m-${cls}" title="${lang} ${v}${cls === 'flow' ? ' · in de flow' : cls === 'laag' ? ' · te laag!' : ''}"><span class="mk">${kort}</span><span class="b"><i style="width:${clamp(v, 0, 100)}%"></i></span><b>${v}</b></div>`;
}

export function vHud(inSpel){
  const merk = `<div class="merk">Van Kantine tot Kampioen<small>VAN DE JEUGD NAAR DE WERELDTOP</small></div>`;
  const hulp = `<button class="hudknop" data-hulp aria-label="Hulp, sneltoetsen en instellingen" title="Hulp en instellingen">?</button>`;
  if (!inSpel) return `${merk}<div class="hudrechts">${hulp}</div>`;
  const sp = S.sp, c = club();
  const status = sp.o23 ? 'Bij de O23' : statusNaam(statusNiveau());
  return `<div class="hudspeler">
      <div class="hudovr" title="Klasse (overall)">${ovr(sp)}</div>
      <div class="hudnaam"><b>${sp.o23 ? '' : `<span class="muted">#${rugnummer()}</span> `}${esc(sp.naam)}</b>
        <span class="niv">${POS[sp.pos].n} · ${sp.leeftijd} jr · ${esc(c.n)}${sp.o23 ? ' O23' : ''}${sp.huur ? ` · gehuurd van ${esc(CLUBS[sp.huur.ouder].n)}` : ''}</span></div>
    </div>
    <div class="hudmeters">${meter('FIT', 'Fitheid', sp.fit)}${meter('FOC', 'Focus', sp.focus ?? 65, true)}${meter('MOR', 'Moraal', sp.moraal)}</div>
    <div class="hudinfo">
      <span class="chip">${seizoenLabel()} · <b>wk ${Math.min(S.ronde + 1, AANTAL_RONDES)}/${AANTAL_RONDES}</b></span>
      <span class="chip">${NIVEAU[c.t]} · <b>${status}</b></span>
      <span class="chip geld"><b>${geldTxt(sp.geld)}</b></span>
      ${sp.blessure > 0 ? `<span class="chip alarm">Geblesseerd · ${sp.blessure} wk</span>` : ''}${sp.geschorst > 0 ? `<span class="chip alarm">Geschorst</span>` : ''}
    </div>
    <div class="hudrechts">${hulp}</div>`;
}
