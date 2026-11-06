import * as THREE from 'three';
import { laadAnimatie } from './anim/voetbal-anim.js';
import { maakRetarget } from './anim/retarget.js';
import { hashGetal, laadModel, maakModelSpeler, tenueVoor, uiterlijkVoor, zetBand } from './spelermodel.js';
import { ACHTERNAMEN, VOORL } from '../game/competitie/spelers.js';
import { toast } from '../core/feedback.js';
import { ploegen } from './pitch.js';
import { publiekTex, veldTex } from './veld3d.js';
import { elftal, introSoort } from './views/match.js';
import { canvas, laadPlaatje, licht, maakLaag, maakRenderer, speelLus, tex } from './cutscene-basis.js';
import { S } from '../core/state.js';
import { esc } from '../core/utils.js';
import { AANV, CLUBS } from '../data/gegevens.js';
import { logoURL } from '../data/logos.js';
import { shirtSponsor } from '../data/shirtsponsors.js';
import { thuisLand } from '../data/landen.js';
import { metVoorletter } from '../game/media/nieuws.js';
import { isAanvoerder } from '../game/team/aanvoerder.js';
import { TACTIEKEN, clubTactiek } from '../game/team/tactiek.js';

/* ===================== Cutscene: de teams komen het veld op, daarna de opstellingen ===================== */
// Vanuit de spelerstunnel lopen de scheidsrechters en beide elftallen (de aanvoerders voorop) het veld op en gaan in
// een rij staan; de camera vliegt daarna rond het stadion terwijl de opstellingen in beeld komen, eerst de thuisploeg.
// De beweging komt uit anim/opkomst.json (31,5 s; verkleind met scripts/anim-verkleinen.mjs) en gaat met
// anim/retarget.js op onze spelers. Namen, nummers, tenues en de opstelling komen uit het spel zelf.

let DATA = null;
const laadData = () => DATA || (DATA = import('./anim/opkomst.json').then(m => laadAnimatie(m.default)));
const T = {scorebalk:[3.6, 16.9], titel:[4.6, 11.1], thuis:17.5, uit:24.5};
const RIJ_V = {K:.88, V:.68, M:.45, A:.2}; // hoogte van elke linie op het opstellingsbord (0 = aanval bovenaan)
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

async function speel(M){
  const opp = M && tegenstander(M);
  if (!S || !S.sp || opp == null || !CLUBS[opp]) return;
  const laag = maakLaag({tag:'Live', label:'Animatie: de teams komen het veld op'});
  let r3 = null;
  try {
    try { r3 = maakRenderer(laag, {fov:40, ver:600, pixels:1.5}); } catch (e){ laag.sluit(); return; }
    const {renderer, camera, reg} = r3;
    const P = ploegen(), ploeg = ploegInfo(M, P);
    for (const p of [ploeg.thuis, ploeg.uit]) p.logoImg = await laadPlaatje(logoURL(p.id, 256));
    const [anim] = await Promise.all([laadData(), laadModel()]);
    if (laag.weg) return;

    // ---------- het stadion ----------
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b1020); scene.fog = new THREE.Fog(0x0b1020, 120, 320);
    scene.add(new THREE.HemisphereLight(0xe6eeff, 0x2a4a2e, 1.15));
    const zon = new THREE.DirectionalLight(0xffffff, 1.5); zon.position.set(-20, 60, 40); scene.add(zon);
    const tegen = new THREE.DirectionalLight(0xdfe8ff, 1.0); tegen.position.set(15, 35, -60); scene.add(tegen); // (de lichtmasten aan de overkant: de rij spelers kijkt die kant op)
    const stadion = bouwStadion(renderer, reg, ploeg, {leeg:!!M.o23}); scene.add(stadion.groep); // (de O23: een handjevol toeschouwers)

    // ---------- de personages ----------
    const sporen = prefix => anim.personages.filter(n => n.startsWith(prefix)).sort((a, b) => anim.data.characters[a].Hips.t[0][2] - anim.data.characters[b].Hips.t[0][2]);
    const volgorde = p => { const k = p.elf.find(x => x.pos === 'K'), c = p.aanv, rest = p.elf.filter(x => x !== k && x !== c).sort((a, b) => (a.nr || 99) - (b.nr || 99)); return (c && c !== k ? [c, k] : [k]).concat(rest).filter(Boolean); };
    const personages = [];
    const zet = (spoor, uit, tenue, band) => { const m = maakModelSpeler(uit, tenue); if (!m) return; if (band) zetBand(m); const r = maakRetarget(m); scene.add(r.houder); personages.push({spoor, r, n:0}); };
    for (const [prefix, p] of [['NOO_', ploeg.thuis], ['ZUI_', ploeg.uit]]){
      const lijst = volgorde(p), sp = sporen(prefix);
      lijst.forEach((x, i) => { if (!sp[i]) return;
        const uit = x.jij ? uiterlijkVoor('jij|' + (P.jij || S.sp.naam), S.sp.uiterlijk) : uiterlijkVoor('c' + p.id + '|' + x.n + '|' + (x.nr ?? ''));
        zet(sp[i], uit, x.pos === 'K' ? p.keeper : p.tenue, x === p.aanv); });
    }
    const scheids = tenueVoor('R', P.tenues);
    for (const n of ['Scheidsrechter', 'Assistent_1', 'Assistent_2']) if (anim.data.characters[n]) zet(n, uiterlijkVoor('scheids|' + opp + '|' + n), scheids, false);
    if (!personages.length) throw new Error('geen spelersmodel');

    // ---------- overlay ----------
    laag.geladen();
    const ui = maakOverlay(laag, M, ploeg);

    // ---------- afspelen ----------
    let beeld = 0;
    await speelLus(laag, anim.duur, (tt, dt) => {
      beeld++;
      const cam = anim.object('Camera', tt); camera.position.fromArray(cam.t); camera.quaternion.fromArray(cam.r);
      const z = camera.userData.zoom || 1; if (z < 1) camera.translateZ((1 / z - 1) * 6);
      camera.fov = cam.yfov_graden || 40; camera.far = 600; camera.updateProjectionMatrix();
      // dichtbij elke beeld bijwerken, verder weg om de paar beelden (25 spelers met IK is veel rekenwerk)
      for (const p of personages){
        const h = p.r.houder.position, d = h.x || h.z ? camera.position.distanceTo(h) : 0, elke = d > 60 ? 4 : d > 28 ? 2 : 1;
        if (dt && (beeld + p.n++) % elke) continue;
        p.r.zet(anim.wereldPose(p.spoor, tt));
      }
      stadion.stap(tt, dt, laag);
      ui.stap(tt);
      renderer.render(scene, camera);
    });
  } finally {
    if (r3) r3.opruim();
    laag.sluit();
  }
}

// ---------- het stadion: veld, tribunes, de spelerstunnel, LED-borden, lichtmasten ----------
function bouwStadion(renderer, reg, ploeg, {leeg = false} = {}){
  const groep = new THREE.Group(), L = o => reg(new THREE.MeshLambertMaterial(o)), B = o => reg(new THREE.MeshBasicMaterial(o));
  const doos = (b, h, d, m, x, y, z, ouder = groep) => { const me = new THREE.Mesh(reg(new THREE.BoxGeometry(b, h, d)), m); me.position.set(x, y, z); ouder.add(me); return me; };
  // grond en veld (dezelfde textuur als in de wedstrijd)
  const grond = new THREE.Mesh(reg(new THREE.PlaneGeometry(500, 500)), L({color:0x23552f})); grond.rotation.x = -Math.PI / 2; grond.position.y = -.02; groep.add(grond);
  const vt = veldTex(renderer.capabilities.getMaxAnisotropy()); reg(vt.t);
  const veld = new THREE.Mesh(reg(new THREE.PlaneGeometry(vt.w, vt.h)), L({map:vt.t})); veld.rotation.x = -Math.PI / 2; groep.add(veld);
  // tribunes; de hoofdtribune (aan de kant van de tunnel) staat op een muur, met de tunnel eronder door
  const pub = reg(publiekTex()); pub.wrapS = THREE.RepeatWrapping;
  if (leeg){ // bijna lege tribunes: het publiek grotendeels overgeschilderd met lege stoeltjes
    const c = pub.image, g = c.getContext('2d'); g.fillStyle = 'rgba(26,34,56,.82)'; g.fillRect(0, 0, c.width, c.height); pub.needsUpdate = true; }
  const dakM = L({color:0x10172a}), muurM = L({color:0x172036});
  const tribune = (lengte, x, z, ry, hoog = 0) => {
    const g = new THREE.Group(), t = reg(pub.clone()); t.needsUpdate = true; t.repeat.set(lengte / 30, 1);
    const vlak = new THREE.Mesh(reg(new THREE.PlaneGeometry(lengte, 16)), L({map:t})); vlak.rotation.x = -.62; vlak.position.y = 7 + hoog; g.add(vlak);
    doos(lengte, .6, 9, dakM, 0, 15.5 + hoog, -4, g); // (een verhoogde tribune staat op losse muren, met de tunnel ertussen)
    g.position.set(x, 0, z); g.rotation.y = ry; groep.add(g);
  };
  tribune(150, 0, -50, 0); tribune(100, -66, 0, Math.PI / 2); tribune(100, 66, 0, -Math.PI / 2);
  // hoofdtribune: twee helften naast de tunnel (de muur eronder heeft een opening) en één stuk erboven
  const thuis = ploeg.thuis, [tc, tg] = canvas(512, 128);
  tg.fillStyle = thuis.tenue.shirt; tg.fillRect(0, 0, 512, 128); tg.fillStyle = thuis.tenue.accent || '#fff'; tg.fillRect(0, 0, 512, 10); tg.fillRect(0, 118, 512, 10);
  if (thuis.logoImg) tg.drawImage(thuis.logoImg, 30, 22, 84, 84);
  tg.fillStyle = licht(thuis.tenue.shirt) ? '#15161c' : '#ffffff'; tg.font = '900 44px Arial Black, Arial, sans-serif'; tg.textBaseline = 'middle'; tg.fillText(thuis.kort, 136, 66);
  const clubM = L({map:tex(tc, reg)});
  tribune(150, 0, 53, Math.PI, 3.8);
  for (const s of [-1, 1]) doos(72, 4.4, .5, muurM, s * 38.8, 2.2, 47.9);
  doos(5.6, 1.4, .5, clubM, 0, 3.7, 47.9);
  // de spelerstunnel: van z = 36 (bij het veld) tot ver onder de tribune, met lampen aan het plafond en de clubkleuren
  const [wc, wg] = canvas(1024, 128); wg.fillStyle = '#20283f'; wg.fillRect(0, 0, 1024, 128);
  for (let i = 0; i < 6; i++){ wg.fillStyle = thuis.tenue.shirt; wg.fillRect(i * 170 + 10, 18, 150, 92); if (thuis.logoImg) wg.drawImage(thuis.logoImg, i * 170 + 55, 32, 60, 60); }
  const wandTex = tex(wc, reg); wandTex.wrapS = THREE.RepeatWrapping; wandTex.repeat.set(2, 1);
  const wand = L({map:wandTex}), vloer = L({color:0x2b2f38}), plafond = L({color:0x1a1f2c});
  const Z0 = 36, Z1 = 62, len = Z1 - Z0, zm = (Z0 + Z1) / 2;
  for (const s of [-1, 1]){ const w = doos(.3, 3.2, len, wand, s * 2.8, 1.6, zm); w.rotation.y = 0; }
  doos(5.9, .25, len, plafond, 0, 3.25, zm); doos(5.6, .02, len, vloer, 0, .01, zm); doos(5.9, 3.4, .3, plafond, 0, 1.7, Z1);
  const lampM = B({color:0xfff6e0});
  for (let z = Z0 + 1.5; z < Z1; z += 3) doos(1.6, .05, .25, lampM, 0, 3.1, z);
  for (const z of [42, 54]){ const l = new THREE.PointLight(0xfff1d6, 18, 14, 1.4); l.position.set(0, 2.7, z); groep.add(l); }
  // de mond van de tunnel: een lijst in de accentkleur
  const lijst = L({color:new THREE.Color(thuis.tenue.accent || '#ffffff')});
  doos(6.4, .35, .5, lijst, 0, 3.45, Z0); for (const s of [-1, 1]) doos(.35, 3.6, .5, lijst, s * 3.1, 1.8, Z0);
  // LED-borden rond het veld, met de shirtsponsors (opening bij de tunnel)
  const reclame = [thuis.sponsor, ploeg.uit.sponsor].filter(Boolean).map(s => s.naam.toUpperCase()).concat(['HET GROTE DOORBREKEN']);
  // het canvas is precies één rij namen breed, zodat de herhaling naadloos aansluit
  const font = '900 34px Arial Black, Arial, sans-serif', [, mg] = canvas(8, 8); mg.font = font;
  const breed = reclame.map(t => Math.ceil(mg.measureText(t).width) + 70), W = breed.reduce((a, b) => a + b, 0);
  const [rc, rg] = canvas(W, 64); rg.fillStyle = '#0b1020'; rg.fillRect(0, 0, W, 64);
  rg.font = font; rg.textBaseline = 'middle'; let x = 35;
  reclame.forEach((t, i) => { rg.fillStyle = i % 2 ? '#c6f432' : '#ffffff'; rg.fillText(t, x, 33); x += breed[i]; });
  const ledTex = tex(rc, reg); ledTex.wrapS = THREE.RepeatWrapping;
  const meter = W / 64 * .9; // zoveel meter bord per herhaling (het bord is 0,9 m hoog)
  const bord = (lengte, x, z, ry) => { const t = reg(ledTex.clone()); t.needsUpdate = true; t.repeat.set(lengte / meter, 1);
    const m = new THREE.Mesh(reg(new THREE.BoxGeometry(lengte, .9, .12)), [muurM, muurM, muurM, muurM, B({map:t}), B({map:t})]); m.position.set(x, .45, z); m.rotation.y = ry; groep.add(m); return t; };
  const leds = [bord(110, 0, -37.5, 0), bord(52, -30, 37.5, Math.PI), bord(52, 30, 37.5, Math.PI), bord(68, -57, 0, Math.PI / 2), bord(68, 57, 0, -Math.PI / 2)];
  // doelen
  const wit = L({color:0xffffff});
  for (const X of [-52.5, 52.5]){
    for (const z of [-3.66, 3.66]){ const p = new THREE.Mesh(reg(new THREE.CylinderGeometry(.07, .07, 2.44, 8)), wit); p.position.set(X, 1.22, z); groep.add(p); }
    const lat = new THREE.Mesh(reg(new THREE.CylinderGeometry(.07, .07, 7.32, 8)), wit); lat.rotation.x = Math.PI / 2; lat.position.set(X, 2.44, 0); groep.add(lat);
    const net = new THREE.Mesh(reg(new THREE.PlaneGeometry(7.32, 2.44)), B({color:0xffffff, transparent:true, opacity:.18, side:THREE.DoubleSide, depthWrite:false})); net.rotation.y = Math.PI / 2; net.position.set(X + Math.sign(X) * 1.8, 1.22, 0); groep.add(net);
  }
  // lichtmasten
  for (const [mx, mz] of [[-62, -46], [62, -46], [-62, 46], [62, 46]]){
    const mast = new THREE.Mesh(reg(new THREE.CylinderGeometry(.35, .5, 34, 6)), L({color:0x2a3654})); mast.position.set(mx, 17, mz); groep.add(mast);
    const lamp = new THREE.Mesh(reg(new THREE.BoxGeometry(5, 2.4, .6)), lampM); lamp.position.set(mx, 34, mz); lamp.lookAt(0, 0, 0); groep.add(lamp);
  }
  // fotoflitsen op de tribunes
  const N = 420, pos = new Float32Array(N * 3), kl = new Float32Array(N * 3);
  for (let i = 0; i < N; i++){ const kant = i % 4, a = Math.random(), h = Math.random();
    const [px, pz] = kant === 0 ? [(a - .5) * 140, -46 - h * 8] : kant === 1 ? [(a - .5) * 140, 49.5 + h * 8] : kant === 2 ? [-62 - h * 8, (a - .5) * 90] : [62 + h * 8, (a - .5) * 90];
    pos.set([px, (kant === 1 ? 4.4 : .6) + h * 12, pz], i * 3); }
  const fg = reg(new THREE.BufferGeometry()); fg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); fg.setAttribute('color', new THREE.BufferAttribute(kl, 3));
  const flitsen = new THREE.Points(fg, reg(new THREE.PointsMaterial({size:.9, vertexColors:true, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false})));
  groep.add(flitsen);
  return {groep, stap(tt, dt){
    // de LED-borden lopen, en hier en daar een flits
    for (const t of leds) t.offset.x = (t.offset.x + dt * .06) % 1;
    const af = Math.pow(.002, dt); for (let i = 0; i < kl.length; i++) kl[i] *= af;
    const kans = leeg ? 1 : tt > 3 ? 14 : 4; for (let k = 0; k < kans * dt * 10; k++) if (Math.random() < .1){ const i = Math.floor(Math.random() * N) * 3; kl[i] = kl[i + 1] = kl[i + 2] = 1; }
    fg.attributes.color.needsUpdate = true;
  }};
}

// ---------- de overlay: scorebalk, titel van de wedstrijd, en de opstellingen ----------
function shirtSvg(t, nr){
  const kl = licht(t.shirt) ? '#15161c' : '#ffffff';
  return `<svg viewBox="0 0 40 36" aria-hidden="true"><path d="M13 2 L6 5 L1 12 L6 16 L9 13 L9 34 L31 34 L31 13 L34 16 L39 12 L34 5 L27 2 Q20 7 13 2Z" fill="${t.shirt}" stroke="${t.accent || '#fff'}" stroke-width="1.6"/><text x="20" y="27" text-anchor="middle" font-size="15" font-weight="900" fill="${kl}" font-family="Arial Black, Arial, sans-serif">${nr ?? ''}</text></svg>`;
}
function bordHtml(p, kant){
  const linies = ['K', 'V', 'M', 'A'], kaartjes = []; let volg = 0;
  for (const l of linies){
    const g = p.elf.filter(x => x.pos === l);
    g.forEach((x, i) => { const u = .12 + .76 * (g.length === 1 ? .5 : i / (g.length - 1)), tenue = l === 'K' ? p.keeper : p.tenue;
      kaartjes.push(`<div class="ok-sp${x.jij ? ' jij' : ''}" style="left:${(u * 100).toFixed(1)}%;top:${(RIJ_V[l] * 100).toFixed(1)}%;--d:${(volg++ * 75)}ms">
        ${shirtSvg(tenue, x.nr)}<span class="ok-naam">${esc(achternaam(x))}${x === p.aanv ? ' <b class="ok-c">C</b>' : ''}</span>${x.jij ? '<span class="ok-jij">JIJ</span>' : ''}</div>`); });
  }
  return `<div class="ok-bord ok-${kant}" style="--kl:${p.tenue.shirt};--ac:${p.tenue.accent || '#fff'}">
    <div class="ok-bkop">${p.logoImg ? `<img src="${p.logoImg.src}" alt="">` : ''}<div><div class="ok-bsoort">${kant === 'thuis' ? 'Thuisploeg' : 'Uitploeg'}</div><div class="ok-bnaam">${esc(p.naam)}</div>
      <div class="ok-bsub"><span>${esc(p.formatie)}</span>${p.tactiek ? `<span>${esc(p.tactiek)}</span>` : ''}</div></div></div>
    <div class="ok-veld"><svg class="ok-lijnen" viewBox="0 0 68 105" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="rgba(255,255,255,.45)" stroke-width=".4"><rect x="1" y="1" width="66" height="103"/><line x1="1" y1="52.5" x2="67" y2="52.5"/><circle cx="34" cy="52.5" r="9.15"/><rect x="13.84" y="1" width="40.32" height="16.5"/><rect x="13.84" y="87.5" width="40.32" height="16.5"/><rect x="24.84" y="98.5" width="18.32" height="5.5"/><rect x="24.84" y="1" width="18.32" height="5.5"/></g></svg>${kaartjes.join('')}</div>
    <div class="ok-bank"><div class="ok-bsoort">Wissels</div><ol>${p.bank.map((x, i) => `<li class="${x.jij ? 'jij' : ''}" style="--d:${(11 + i) * 75}ms"><span>${x.nr ?? ''}</span>${esc(x.jij ? S.sp.naam + ' (jij)' : naamVan(x))}</li>`).join('')}</ol></div>
  </div>`;
}
function maakOverlay(laag, M, {thuis, uit}){
  const logo = p => p.logoImg ? `<img src="${p.logoImg.src}" alt="">` : '';
  const tags = [M.derby ? 'Derby' : '', M.rivaal ? 'Tegen je rivaal' : '', M.reunie ? 'Weerzien met je oude club' : '', M.beker && M.beker.finale ? 'Finale' : ''].filter(Boolean);
  laag.ui.innerHTML = `
    <div class="ok-score"><span class="ok-ploeg" style="--kl:${thuis.tenue.shirt}">${logo(thuis)}${esc(thuis.kort)}</span><span class="ok-stand">0 – 0</span><span class="ok-ploeg" style="--kl:${uit.tenue.shirt}">${esc(uit.kort)}${logo(uit)}</span><span class="ok-klok">00:00</span></div>
    <div class="ok-titel"><div class="ok-soort">${esc(introSoort(M))}</div>
      <div class="ok-teams"><span>${logo(thuis)}${esc(thuis.naam)}</span><i>tegen</i><span>${esc(uit.naam)}${logo(uit)}</span></div>
      ${tags.length ? `<div class="ok-tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}</div>
    ${bordHtml(thuis, 'thuis')}${bordHtml(uit, 'uit')}`;
  const el = s => laag.$(s), aan = (s, ja) => el(s).classList.toggle('aan', !!ja);
  return {stap(t){
    aan('.ok-score', t >= T.scorebalk[0] && t < T.scorebalk[1]);
    aan('.ok-titel', t >= T.titel[0] && t < T.titel[1]);
    aan('.ok-bord.ok-thuis', t >= T.thuis && t < T.uit);
    aan('.ok-bord.ok-uit', t >= T.uit);
    el('.ok-bord.ok-thuis').classList.toggle('weg', t >= T.uit);
  }};
}
