import { hashGetal, tenueVoor, uiterlijkVoor } from './pixel/uiterlijk.js';
import { lookVan, donker } from './pixel/atlas.js';
import { OP_FPS, OP_FRAMES, maakOpkomst } from './pixel/opkomst.js';
import { zonderAccent } from './pixel/font.js';
import { ACHTERNAMEN, VOORL } from '../game/competitie/spelers.js';
import { toast } from '../core/feedback.js';
import { ploegen } from './pitch.js';
import { elftal, introSoort } from './views/match.js';
import { maakLaag, speelLus } from './cutscene-basis.js';
import { laadLogoBron } from './pixel/clublogo.js';
import { S } from '../core/state.js';
import { esc } from '../core/utils.js';
import { AANV, CLUBS } from '../data/gegevens.js';
import { shirtSponsor } from '../data/shirtsponsors.js';
import { thuisLand } from '../data/landen.js';
import { metVoorletter } from '../game/media/nieuws.js';
import { isAanvoerder } from '../game/team/aanvoerder.js';
import { TACTIEKEN, clubTactiek } from '../game/team/tactiek.js';

/* ===================== Cutscene: de teams komen het veld op, daarna de opstellingen ===================== */
// Een pixelanimatie zoals bij FIFA (render/pixel/opkomst.js, naar de stijlbron art/chibi_anims.px.js deel 9): de teams wachten
// in de spelerstunnel en lopen het stadion in (scheidsrechters en aanvoerders voorop), staan op een rij met een naambalk,
// het uitteam schudt de handen van het thuisteam, en dan de opstellingen. Namen, nummers, tenues, aanvoerders en de
// formatie komen uit het spel zelf; jij staat ertussen met je eigen uiterlijk.

const VOORV = /^(fc|sc|sv|ac|as|vv|sbv|rksv|real|sporting|rapid|dynamo|olympique|celtic|quick|fortuna|achilles|victoria|sparta|inter|atletico|atlético|racing|union|royal|kv|krc|rsc|club|de|het|go|ahead|cf|cd|ud|sd|ss|us|1\.)$/i;
const kort = naam => { const w = String(naam).replace(/ Vrouwen$/, '').split(/\s+/).filter(x => !VOORV.test(x)); return (w[0] || naam).replace(/[^\p{L}]/gu, '').slice(0, 3).toUpperCase(); };

let BEZIG = null;
// M = S.M (een clubwedstrijd met echte selecties). Geeft een Promise die klaar is als de scène af is of overgeslagen.
export function speelOpkomst(M){
  if (BEZIG) return BEZIG;
  BEZIG = speel(M).catch(e => { console.warn('Opkomst kon niet spelen', e); toast('De opkomst kon niet worden afgespeeld.'); }).finally(() => { BEZIG = null; });
  return BEZIG;
}
// De tegenstander (club-id): bij de O23 staat die bij het eerste elftal (M.eerste)
const tegenstander = M => M.opp ?? (M.o23 && M.eerste ? M.eerste.opp : null);

// O23-elftallen bestaan niet in het spel: een vaste (per seizoen andere) groep jonge spelers per club, 4-3-3.
// Jij neemt de plek in van iemand op jouw linie, met je wensnummer als dat vrij is
const MIJN_LINIE = {SPITS:'A', MID:'M', VERD:'V', KEEPER:'K'};
function jeugdElf(id, metJou){
  let h = hashGetal('o23|' + CLUBS[id].n + '|' + S.jaar); const d = n => { h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; return h % n; };
  const namen = ACHTERNAMEN.slice(), nummers = Array.from({length:39}, (_, i) => i + 2), neem = l => l.splice(d(l.length), 1)[0];
  const speler = (pos, basis) => ({v:VOORL[d(VOORL.length)], n:neem(namen), pos, nr:pos === 'K' && basis ? 1 : neem(nummers), k:50 + d(25), basis});
  const elf = [speler('K', true), ...[0, 1, 2, 3].map(() => speler('V', true)), ...[0, 1, 2].map(() => speler('M', true)), ...[0, 1, 2].map(() => speler('A', true))];
  const bank = ['K', 'V', 'M', 'M', 'A'].map(p => speler(p, false));
  if (metJou){
    const lijn = MIJN_LINIE[S.sp.pos] || 'M', weg = elf.findLastIndex(x => x.pos === lijn), wens = S.sp.wensNr;
    const nr = wens && wens !== 1 && !elf.some((x, i) => i !== weg && x.nr === wens) ? wens : elf[weg].nr;
    const wissel = bank.find(x => x.nr === nr); if (wissel) wissel.nr = elf[weg].nr; // (een wissel met jouw nummer krijgt het nummer van wie jij vervangt)
    elf.splice(weg, 1, {jij:true, n:S.sp.naam, pos:lijn, nr});
  }
  return {elf, bank};
}

// De twee ploegen: wie, welk tenue, de elf (met jou als je in de basis staat), de aanvoerder en de wissels
function ploegInfo(M, P){
  const sp = S.sp, o23 = !!M.o23, mk = (id, wij) => {
    const c = CLUBS[id], r = o23 ? jeugdElf(id, wij && M.rol === 'basis') : elftal(id, wij && M.rol === 'basis', wij ? null : 'M'), tel = p => r.elf.filter(x => x.pos === p).length;
    let aanv = !o23 && wij && M.rol === 'basis' && isAanvoerder() ? r.elf.find(x => x.jij) : r.elf.find(x => !x.jij && x.st === AANV);
    if (!aanv) aanv = r.elf.filter(x => !x.jij).sort((a, b) => (b.k || 0) - (a.k || 0))[0];
    const bank = r.bank.slice(0, 7); if (wij && (M.rol === 'bank' || M.rol === 'invaller')) bank.unshift({jij:true, n:sp.naam, nr:null});
    const naam = o23 ? (wij ? M.wij : M.zij) || c.n + ' O23' : c.n;
    return {id, wij, naam, kort:kort(c.n) + (o23 ? ' O23' : ''), elf:r.elf, bank, aanv, formatie:`${tel('V')}-${tel('M')}-${tel('A')}`, tactiek:(TACTIEKEN[clubTactiek(id)] || {}).n || '',
      tenue:tenueVoor(wij ? 'wij' : 'zij', P.tenues), keeper:tenueVoor(wij ? 'k' : 'K', P.tenues), sponsor:shirtSponsor(c, thuisLand())};
  };
  const wij = mk(sp.club, true), zij = mk(tegenstander(M), false);
  return M.thuis ? {thuis:wij, uit:zij} : {thuis:zij, uit:wij};
}
const naamVan = x => x.jij ? S.sp.naam : metVoorletter(x);
const achternaam = x => x.jij ? (String(S.sp.naam).split(' ').slice(1).join(' ') || S.sp.naam) : x.n;

// ---------- van de ploegen naar de pixelscène ----------
const hex2 = h => { const n = parseInt(String(h || '#888888').slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const helder = h => { const [r, g, b] = hex2(h); return r * .299 + g * .587 + b * .114; };
const verschil = (a, b) => Math.abs(helder(a) - helder(b));
// een kleur die goed leesbaar is op een andere kleur: de voorkeur, anders wit of zwart
const leesbaar = (op, voorkeur) => voorkeur && verschil(op, voorkeur) > 70 ? voorkeur : helder(op) > 140 ? '#1a1414' : '#ffffff';
// De plek op het opstellingsscherm per linie (de getallen van de stijlbron voor 4-3-3 en 4-4-2)
const PLEK = {
  K:{1:[[85, 132]]},
  V:{2:[[60, 106], [110, 106]], 3:[[40, 106], [85, 108], [130, 106]], 4:[[22, 104], [63, 108], [107, 108], [148, 104]], 5:[[16, 100], [50, 106], [85, 108], [120, 106], [154, 100]]},
  M:{1:[[85, 76]], 2:[[60, 74], [110, 74]], 3:[[40, 72], [85, 76], [130, 72]], 4:[[20, 70], [63, 74], [107, 74], [150, 70]], 5:[[16, 70], [50, 74], [85, 78], [120, 74], [154, 70]]},
  A:{1:[[85, 28]], 2:[[60, 32], [110, 32]], 3:[[28, 34], [85, 26], [142, 34]], 4:[[22, 34], [63, 30], [107, 30], [148, 34]]},
};
const BASIS_Y = {K:132, V:106, M:74, A:32};
const plekken = (lijn, n) => PLEK[lijn][n] || Array.from({length:n}, (_, i) => [Math.round(16 + (n === 1 ? .5 : i / (n - 1)) * 138), BASIS_Y[lijn]]);
const SCHEIDS_TENUE = {shirt:'#ffd84a', accent:'#ffd84a', patroon:'effen', broek:'#3a3a44', sok:'#3a3a44'};

function opkomstInfo(M, ploeg, P){
  const o23 = !!M.o23, sp = S.sp;
  const team = p => {
    // keeper eerst, dan verdedigers, middenvelders, aanvallers (zo komen ze ook op het scherm)
    const LIJN = ['K', 'V', 'M', 'A'], elf = p.elf.slice().sort((a, b) => LIJN.indexOf(a.pos) - LIJN.indexOf(b.pos));
    const xy = new Map(); for (const l of LIJN){ const g = elf.filter(x => x.pos === l), pl = plekken(l, g.length); g.forEach((x, i) => xy.set(x, pl[i])); }
    const naamKleur = helder(p.tenue.shirt) < 70 ? (helder(p.tenue.accent || '#fff') >= 70 ? p.tenue.accent : '#ffffff') : p.tenue.shirt;
    return {naam:zonderAccent(p.naam), formatie:p.formatie, aanv:Math.max(0, elf.indexOf(p.aanv)), naamKleur, balk:p.tenue.shirt, balkCijfer:leesbaar(p.tenue.shirt, p.tenue.accent),
      elf:elf.map(x => {
        const keeper = x.pos === 'K', tenue = keeper ? p.keeper : p.tenue;
        const uit = x.jij ? uiterlijkVoor('jij|' + (P.jij || sp.naam), {...(sp.uiterlijk || {}), vrouw:!!sp.vrouw}) : uiterlijkVoor('c' + p.id + '|' + x.n + '|' + (x.nr ?? ''));
        const band = !o23 && x === p.aanv, look = lookVan(uit, tenue, {handschoen:keeper, band});
        return {naam:zonderAccent(x.jij ? sp.naam : achternaam(x)), nr:x.nr ?? '', jij:!!x.jij, xy:xy.get(x), rond:tenue.shirt, cijfer:leesbaar(tenue.shirt, tenue.accent),
          persoon:{v:{kapsel:look.kapsel, vrouw:look.vrouw, baard:look.baard, kleding:'tenue', patroon:look.patroon, band}, kleuren:look.kleuren, hand:keeper ? 'q' : undefined}};
      })};
  };
  const opp = tegenstander(M);
  const scheids = [['SCHEIDSRECHTER', false], ['ASSISTENT 1', true], ['ASSISTENT 2', true]].map(([naam, vlag], i) => {
    const look = lookVan(uiterlijkVoor('scheids|' + opp + '|' + i), SCHEIDS_TENUE, {kleuren:{y:'#3a3a44', Y:'#24242c', a:'#1a1414', A:'#1a1414'}});
    return {naam, persoon:{v:{kapsel:look.kapsel, vrouw:look.vrouw, baard:look.baard, kleding:'tenue', patroon:'effen'}, kleuren:look.kleuren, vlag}};
  });
  const th = ploeg.thuis, ui = ploeg.uit, spons = p => { const s = shirtSponsor(CLUBS[p.id], thuisLand()); return zonderAccent(s && s.naam ? s.naam : p.naam); };
  return {thuis:team(th), uit:team(ui), scheids, leeg:o23,
    reclame:[[spons(th), 'y'], [spons(ui), 'o'], ['GOAL!', 'w']],
    titel:zonderAccent(`${th.naam}  -  ${ui.naam}`), tunnelNaam:zonderAccent(th.naam).slice(0, 17),
    kleuren:{1:th.tenue.shirt, 2:donker(th.tenue.shirt, .3), 3:th.tenue.accent || '#ffffff', 4:ui.tenue.shirt, 5:ui.tenue.accent || '#ffffff'}};
}

async function speel(M){
  const opp = M && tegenstander(M);
  if (!S || !S.sp || opp == null || !CLUBS[opp]) return;
  const laag = maakLaag({tag:'Live', label:'Animatie: de teams komen het veld op'});
  try {
    const P = ploegen(), ploeg = ploegInfo(M, P);
    const info = opkomstInfo(M, ploeg, P); info.logoImg = await laadLogoBron(ploeg.thuis.id); // (het logo zonder tekst: als scherp pixellogo in de tunnel)
    if (laag.weg) return;
    const op = maakOpkomst(info);
    if (laag.weg) return;
    const cv = document.createElement('canvas'); cv.width = op.W; cv.height = op.H; cv.className = 'cs-pixel'; cv.setAttribute('aria-hidden', 'true');
    laag.vak.prepend(cv); const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    // een klein label bovenin zolang de spelers in de tunnel staan: wat voor wedstrijd het is
    const tags = [M.derby ? 'Derby' : '', M.rivaal ? 'Tegen je rivaal' : '', M.reunie ? 'Weerzien met je oude club' : '', M.beker && M.beker.finale ? 'Finale' : ''].filter(Boolean);
    laag.ui.innerHTML = `<div class="op-label">${esc(introSoort(M))}${tags.map(t => ` · <b>${esc(t)}</b>`).join('')}</div>`;
    const label = laag.$('.op-label');
    laag.geladen();
    let vorig = -1;
    await speelLus(laag, OP_FRAMES / OP_FPS, tt => {
      const f = Math.max(0, Math.min(OP_FRAMES - 1, Math.floor(tt * OP_FPS)));
      if (f === vorig) return;
      op.teken(g, f); vorig = f;
      if (op.flitsen(f)) laag.flits();
      label.classList.toggle('aan', f < 70);
    });
  } finally {
    laag.sluit();
  }
}
