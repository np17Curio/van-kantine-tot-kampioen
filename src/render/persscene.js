import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { laadAnimatie } from './anim/voetbal-anim.js';
import { langeBroek, maakPubliek } from './publiek.js';
import { maakRetarget } from './anim/retarget.js';
import { hashGetal, laadModel, maakModelSpeler, uiterlijkVoor } from './spelermodel.js';
import { ploegen } from './pitch.js';
import { S, club } from '../core/state.js';
import { esc } from '../core/utils.js';
import { CLUBS } from '../data/gegevens.js';
import { clubTenue } from '../data/tenues.js';
import { logoURL } from '../data/logos.js';
import { shirtSponsor } from '../data/shirtsponsors.js';
import { thuisLand } from '../data/landen.js';
import { ACHTERNAMEN, VOORL } from '../game/competitie/spelers.js';
import { KRANTEN } from '../game/media/nieuws.js';
import { social, volgersTxt } from '../game/prive/social.js';
import { TOON } from '../game/speler/journey.js';
import { PERS_HINT, PERS_ICOON, fans, persAntwoord, persOpen, persVragen } from '../game/wedstrijd/fans-pers.js';
import { persAntwoord as persAntwoordTrainer, persOpenTrainer, persVragenTrainer } from '../game/trainer/pers.js';
import { GLAD, canvas, draaiLus, laadPlaatje, licht, maakLaag, maakRenderer, tex } from './cutscene-basis.js';

/* ===================== Cutscene: de persconferentie ===================== */
// Je loopt de perszaal in, de persvoorlichter van de club wenkt, jullie gaan zitten achter de microfoons. Daarna steken
// journalisten een voor een hun hand op en stel je je antwoord samen door een kaart aan te klikken (of 1, 2, 3).
// Na elke keuze zie je meteen wat het doet (fans, moraal, de trainer of het bestuur), aan het eind een overzicht.
// De beweging (binnenlopen, gaan zitten, opstaan) komt uit anim/contract_tekenen.json: de zaal heeft dezelfde maten als
// de bestuurskamer daar, zodat de bewegingen kloppen. Zittend houden we de pose vast en zetten de handen op tafel.
// Overslaan (Esc) mag altijd: open vragen blijven dan gewoon in het paneel van het spel staan.

let DATA = null;
const laadData = () => DATA || (DATA = import('./anim/contract_tekenen.json').then(m => laadAnimatie(m.default)));
const ZIT = 8.4, OPSTAAN = [13.0, 14.1];      // tijden in de animatie: zitten, opstaan
// Het publiek: drie rijen journalisten (achterin een gangpad op x 0,5–2: daar komt de camera uit de animatie langs),
// twee fotografen aan de zijkanten en een cameraman achter elke tv-camera (publiek.js)
const RIJEN = [[-2.3, 2.4], [-1.2, 2.4], [-.1, 2.4], [1.0, 2.45], [2.1, 2.5], [-2.6, 3.3], [-1.5, 3.3], [-.4, 3.3], [.7, 3.35], [2.3, 3.4], [-2.8, 4.2], [-1.7, 4.2], [-.6, 4.2], [2.6, 4.3]];
const TV = [[3.0, 1.5], [-3.4, 3.4]], JIJ = [-.6, -.85];
const ZENDERS = [['TV1', '#d62828'], ['SPORT', '#1d4ed8'], ['24', '#f59e0b'], ['RADIO', '#111827'], ['FM', '#059669']];

let BEZIG = null;
// Speelt de persconferentie die nu open staat (als speler na de wedstrijd, of als trainer voor de wedstrijd)
export function speelPersconferentie(){
  if (BEZIG) return BEZIG;
  BEZIG = Promise.resolve().then(() => { const o = invoer(); return o ? speel(o) : null; })
    .catch(e => { console.warn('Persconferentie kon niet spelen', e); }).finally(() => { BEZIG = null; });
  return BEZIG;
}

// ---------- wat de scène van het spel nodig heeft ----------
function invoer(){
  if (!S || !S.sp) return null;
  const naam = () => `${VOORL[Math.floor(Math.random() * VOORL.length)]}. ${ACHTERNAMEN[Math.floor(Math.random() * ACHTERNAMEN.length)]}`;
  const kranten = t => KRANTEN[Math.min(t, 2)] || KRANTEN[2];
  const krantVoor = (lijst, eerste, q) => q === 0 && eerste ? eerste : (lijst.filter(k => k !== eerste)[(q - 1 + lijst.length) % Math.max(1, lijst.length - 1)] || lijst[0]);
  if (S.fase === 'trainer' && S.trainer && S.trainer.pers){
    const T0 = S.trainer, P = T0.pers, V = persVragenTrainer(P); if (persOpenTrainer(P) < 0) return null;
    const lijst = kranten(CLUBS[T0.club].t), tegen = CLUBS[P.opp];
    return {trainer:true, clubId:T0.club, tag:'Persconferentie', kop:'Persconferentie', sub:tegen ? `Voor de wedstrijd tegen ${tegen.n}` : 'Voor de wedstrijd',
      vragen:V.map((v, q) => ({vraag:v.vraag, klaar:v.keuze != null, wie:naam(), krant:krantVoor(lijst, null, q + 1),
        opts:v.opts.map(o => ({soort:o.toon === 'kalm' ? 'b' : o.toon === 'bal' ? 'z' : 'u', icoon:TOON[o.toon].i, l:TOON[o.toon].n, t:o.l, hint:o.s}))})),
      antwoord:(q, i) => persAntwoordTrainer(i, q),
      meters:() => [{n:'Bestuur', v:T0.bestuur}, {n:'Moraal', v:T0.moraal}, {n:'Fans', v:T0.fans ?? 50}]};
  }
  const M = S.M, P = M && M.pers; if (S.fase !== 'matchEnd' || !P || persOpen(P) < 0) return null;
  const V = persVragen(P), lijst = kranten(club().t), tegen = CLUBS[M.opp];
  return {trainer:false, clubId:S.sp.club, tag:'Persconferentie', kop:'Persconferentie',
    sub:tegen ? `Na de wedstrijd tegen ${tegen.n} · ${M.thuis ? `${M.us}-${M.them}` : `${M.them}-${M.us}`}` : 'Na de wedstrijd',
    vragen:V.map((v, q) => ({vraag:v.vraag, klaar:v.keuze != null, wie:naam(), krant:krantVoor(lijst, P.bron, q),
      opts:v.opts.map(o => ({soort:o.s, icoon:PERS_ICOON[o.s], l:o.l, t:o.t, hint:PERS_HINT[o.s]}))})),
    antwoord:(q, i) => persAntwoord(i, q),
    meters:() => { const sp = S.sp; return [{n:'Fans', v:fans()}, {n:'Moraal', v:sp.moraal}, {n:'Vertrouwen', v:sp.vert}, {n:'Reputatie', v:sp.rep}, {n:'Volgers', v:social().volgers, t:volgersTxt}]; }};
}

const V3 = a => new THREE.Vector3(a[0], a[1], a[2]);

async function speel(o){
  const sp = S.sp, c = CLUBS[o.clubId]; if (!c) return;
  const laag = maakLaag({tag:o.tag, label:'Animatie: persconferentie. Kies je antwoorden met de knoppen of met 1, 2 en 3.', interactief:true});
  let r3 = null;
  try {
    try { r3 = maakRenderer(laag); } catch (e){ laag.sluit(); return; }
    const {renderer, camera, reg} = r3;
    const tenue = clubTenue(o.clubId), logoImg = await laadPlaatje(logoURL(o.clubId, 256));
    const [anim] = await Promise.all([laadData(), laadModel()]);
    if (laag.weg) return;
    const info = {club:c.n, naam:sp.naam, tenue, logoImg, sponsor:shirtSponsor(c, thuisLand()), trainer:o.trainer,
      voorlichter:`${VOORL[hashGetal('pvv|' + c.n) % VOORL.length]}. ${ACHTERNAMEN[hashGetal('pva|' + c.n) % ACHTERNAMEN.length]}`};

    // ---------- de zaal ----------
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x14161c);
    const pmrem = new THREE.PMREMGenerator(renderer), envRT = pmrem.fromScene(new RoomEnvironment(), .04); pmrem.dispose();
    scene.environment = envRT.texture; reg(envRT);
    const zaal = bouwPerszaal(info, reg); scene.add(zaal.groep);
    scene.add(new THREE.HemisphereLight(0xf2f4ff, 0x2a2c34, .55));
    const spot = new THREE.SpotLight(0xfff4e0, 40, 14, .55, .5, 1.2); spot.position.set(0, 4.2, 3.2); spot.target.position.set(0, .9, -.6); scene.add(spot, spot.target);
    const vul = new THREE.DirectionalLight(0xdbe6ff, .8); vul.position.set(-3, 4, 5); scene.add(vul);
    const flits = new THREE.PointLight(0xffffff, 0, 12, 1.5); scene.add(flits);

    // ---------- jij en de persvoorlichter ----------
    let sleutel = sp.naam; try { sleutel = ploegen().jij || sleutel; } catch (e){}
    const pak = {shirt:'#1f2433', accent:'#1f2433', patroon:'effen', broek:'#1f2433', sok:'#0e1016'};
    const ik = maakModelSpeler(uiterlijkVoor('jij|' + sleutel, sp.uiterlijk), o.trainer ? pak : {...tenue, broek:'#262b36', sok:'#262b36'});
    if (!ik) throw new Error('geen spelersmodel');
    langeBroek(ik);
    const pv = maakModelSpeler(uiterlijkVoor('persvoorlichter|' + c.n), {shirt:'#232a3a', accent:tenue.shirt, patroon:'effen', broek:'#232a3a', sok:'#111318'});
    if (!pv) throw new Error('geen spelersmodel');
    langeBroek(pv);
    const rIk = maakRetarget(ik), rPv = maakRetarget(pv);
    scene.add(rIk.houder, rPv.houder);

    // ---------- het publiek ----------
    const plekken = RIJEN.map(([x, z]) => ({x, z, rol:'pers', kijk:JIJ}));
    plekken.push({x:-3.3, z:1.0, rol:'fotograaf', kijk:JIJ}, {x:2.9, z:.9, rol:'fotograaf', kijk:JIJ});
    for (const [x, z] of TV){ const d = Math.hypot(JIJ[0] - x, JIJ[1] - z); plekken.push({x:x - (JIJ[0] - x) / d * .55, z:z - (JIJ[1] - z) / d * .55, rol:'cameraman', kijk:JIJ}); }
    const publiek = maakPubliek({scene, anim, reg, plekken, sleutel:c.n, tenue, stoel:(p, h) => zaal.stoel(p, h, true)});
    const pers = publiek.zittend.filter(l => l.rol === 'pers');

    // ---------- teksten en knoppen ----------
    laag.geladen();
    const ui = maakOverlay(laag, info);
    const vragen = o.vragen, open = vragen.map((v, q) => q).filter(q => !vragen[q].klaar);
    const metersVoor = o.meters();
    let fase = 'binnen', ft = 0, q = -1, keuze = -1, beantwoord = 0, wachtVerder = false, flitsKans = 0;
    const volgorde = pers.map((_, i) => i).sort((a, b) => hashGetal('jv' + a + (S.ronde || 0)) - hashGetal('jv' + b + (S.ronde || 0)));
    const vrager = () => pers[volgorde[Math.max(0, open.indexOf(q)) % pers.length]];
    const naar = (f) => { fase = f; ft = 0; };
    const volgendeVraag = () => {
      const k = open.indexOf(q) + 1;
      for (const p of pers) p.doel = 0;
      if (k < open.length){ q = open[k]; keuze = -1; ui.verberg(); const j = vrager(); if (j) j.doel = 1; naar('hand'); }
      else { ui.verberg(); naar('opstaan'); }
    };
    const kies = (i) => {
      if (fase !== 'vraag' || !vragen[q].opts[i]) return;
      keuze = i; const opt = vragen[q].opts[i];
      ui.kies(i, opt);
      let uit = null; try { uit = o.antwoord(q, i); } catch (e){ console.warn('persantwoord', e); }
      ui.zetGevolg(uit || '');
      beantwoord++; laag.tijd(beantwoord / Math.max(1, open.length));
      const j = vrager(); if (j) j.doel = 0;
      // na een uitdagend antwoord willen meer journalisten doorvragen
      if (opt.soort === 'u') pers.filter(p => p !== j).sort(() => Math.random() - .5).slice(0, 3).forEach(p => { p.doel = 1; });
      flitsKans = opt.soort === 'u' ? 7 : opt.soort === 'z' ? 2.5 : 1;
      naar('antwoord');
    };
    laag.opToets = e => { if (fase === 'vraag' && /^[1-3]$/.test(e.key)){ e.preventDefault(); kies(Number(e.key) - 1); } };
    ui.opKies(kies);
    ui.opVerder(() => { if (fase === 'gevolg') volgendeVraag(); else if (fase === 'slot') laag.sluit(); });

    // ---------- de camera: eerst uit de animatie, daarna eigen shots die zacht in elkaar overlopen ----------
    const cam = {pos:new THREE.Vector3(), doel:new THREE.Vector3(), fov:40, los:false}, wens = {pos:new THREE.Vector3(), doel:new THREE.Vector3(), fov:40};
    const hoofdIk = V3([-.6, 1.08, -.72]);
    const shot = (naam) => {
      wens.zaalIn = false;
      if (naam === 'zaal'){ wens.pos.set(1.7, 1.75, 4.6); wens.doel.set(-.15, .95, -.45); wens.fov = 42; }
      else if (naam === 'publiek'){ wens.zaalIn = true; wens.pos.set(1.05, 1.42, -.3); wens.doel.set(-.35, .95, 3.2); wens.fov = 54; }
      else if (naam === 'handOp'){ const j = vrager(); if (!j) return shot('publiek'); wens.zaalIn = true;
        wens.pos.set(j.heup.x > -.6 ? -.1 : .9, 1.42, -.3); wens.doel.copy(j.hoofd).add(_v.set(0, .12, 0)); wens.fov = 40; }
      else if (naam === 'jij'){ wens.pos.set(-.22, 1.2, 1.25); wens.doel.set(-.62, 1.0, -.72); wens.fov = 34; }
      else if (naam === 'vraag'){ const j = vrager(); if (!j) return shot('zaal');
        const weg = j.heup.clone().sub(hoofdIk).setY(0).normalize(), zij = new THREE.Vector3(-weg.z, 0, weg.x);
        wens.pos.copy(j.heup).addScaledVector(weg, .95).addScaledVector(zij, .45 * Math.sign(j.heup.x + .6 || 1)).setY(1.45);
        wens.doel.copy(hoofdIk).lerp(j.hoofd, .18); wens.fov = 36; }
    };
    const kijk = new THREE.Vector3(0, 0, -1), _v = new THREE.Vector3();
    const zetCamera = (tt, dt) => {
      if (!cam.los){
        const a = anim.object('Camera', Math.min(tt, ZIT)); camera.position.fromArray(a.t); camera.quaternion.fromArray(a.r); camera.fov = a.yfov_graden || 40;
        if (tt >= ZIT){ cam.los = true; cam.pos.copy(camera.position); cam.doel.copy(camera.position).add(kijk.set(0, 0, -1).applyQuaternion(camera.quaternion).multiplyScalar(3.4)); cam.fov = camera.fov; shot('publiek'); }
      } else {
        const k = 1 - Math.exp(-dt * 2.4);
        cam.pos.lerp(wens.pos, k); cam.doel.lerp(wens.doel, k); cam.fov += (wens.fov - cam.fov) * k;
        camera.position.copy(cam.pos); camera.lookAt(cam.doel); camera.fov = cam.fov;
      }
      // smal scherm: verder naar achteren, of (als je vanaf de tafel de zaal in kijkt; daarachter staat de wand) breder kijken
      const z = camera.userData.zoom || 1; if (z < 1){ if (cam.los && wens.zaalIn) camera.fov = Math.min(80, camera.fov / Math.sqrt(z)); else camera.translateZ((1 / z - 1) * 1.1); }
      camera.updateProjectionMatrix();
    };

    // ---------- hoofden: kijken naar wie de vraag stelt ----------
    const kijkYaw = {ik:0, pv:0};
    const draaiHoofd = (m, houder, wie, doelPunt, dt) => {
      const hb = m.botten.head; if (!hb || !hb.parent) return;
      let yaw = 0;
      if (doelPunt){ hb.getWorldPosition(_v); const d = doelPunt.clone().sub(_v); yaw = Math.atan2(d.x, d.z) - houder.rotation.y; yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw)); yaw = Math.max(-.6, Math.min(.6, yaw)); }
      kijkYaw[wie] += (yaw - kijkYaw[wie]) * (1 - Math.exp(-dt * 4));
      const qw = hb.getWorldQuaternion(new THREE.Quaternion()), qp = hb.parent.getWorldQuaternion(new THREE.Quaternion());
      const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), kijkYaw[wie]);
      hb.quaternion.copy(qp.invert().multiply(qy.multiply(qw)));
    };
    // handen op tafel (anders pakt de animatie hier de pen); bij het antwoord een gebaar
    const TAFEL_IK = {hand_l:V3([-.36, .775, -.31]), hand_r:V3([-.84, .775, -.31])}, TAFEL_PV = {hand_l:V3([.84, .775, -.31]), hand_r:V3([.36, .775, -.31])};
    const GEBAAR = V3([-.74, .98, -.22]);

    // ---------- afspelen ----------
    await draaiLus(laag, (t, dt) => {
      ft += dt;
      let animT = ZIT, armW = 0;
      if (fase === 'binnen'){
        animT = Math.min(t, ZIT);
        if (t > 2.4 && !ui.onder) ui.onderschrift(o.kop, o.sub);
        if (t > 5.4 && !ui.wenk){ ui.wenk = true; ui.melding(`${esc(info.voorlichter)}, persvoorlichter: "Ga zitten, ze zijn er klaar voor."`); }
        if (t >= ZIT + 2.2){ q = -1; if (open.length){ q = open[0]; keuze = -1; const j = vrager(); if (j) j.doel = 1; naar('hand'); } else naar('opstaan'); }
        flitsKans = t > 5 ? 1.5 : .4;
      } else if (fase === 'hand'){
        shot('handOp');
        if (ft > 1.6){ ui.vraag(vragen[q], open.indexOf(q), open.length); shot('vraag'); naar('vraag'); }
      } else if (fase === 'vraag'){
        flitsKans = .3;
      } else if (fase === 'antwoord'){
        shot('jij');
        const s = vragen[q].opts[keuze].soort, snel = s === 'u' ? 9 : 5;
        armW = GLAD(0, .35, ft) * (1 - GLAD(1.8, 2.3, ft)) * (.65 + .35 * Math.sin(ft * snel));
        if (ft > 2.4){ ui.toonGevolg(); naar('gevolg'); }
      } else if (fase === 'gevolg'){
        if (ft > 1.2) shot('publiek');
        flitsKans *= Math.pow(.4, dt);
        const lees = Math.min(9, Math.max(4, (ui.gevolgLengte || 0) / 28));
        if (ft > lees) volgendeVraag();
      } else if (fase === 'opstaan'){
        shot('zaal');
        animT = OPSTAAN[0] + Math.min(1, ft / 1.4) * (OPSTAAN[1] - OPSTAAN[0]);
        if (ft > 1.6){ ui.slot(metersVoor, o.meters(), beantwoord); naar('slot'); }
      } else if (fase === 'slot'){
        animT = OPSTAAN[1]; flitsKans = 2;
        if (ft > 8) laag.sluit();
      }
      if (laag.weg) return;

      // personages
      const pIk = anim.wereldPose('Speler', animT), pPv = anim.wereldPose('Voorzitter', animT);
      const wZit = animT <= ZIT ? GLAD(7.9, ZIT, animT) : 1 - GLAD(OPSTAAN[0], OPSTAAN[0] + .5, animT), zit = wZit > 0;
      const extraIk = {}, extraPv = {};
      if (wZit > 0){
        extraIk.doel = {hand_l:V3(pIk.LeftHand.t).lerp(TAFEL_IK.hand_l, wZit), hand_r:V3(pIk.RightHand.t).lerp(TAFEL_IK.hand_r, wZit)};
        if (armW > 0) extraIk.doel.hand_r.lerp(GEBAAR, armW);
        extraPv.doel = {hand_l:V3(pPv.LeftHand.t).lerp(TAFEL_PV.hand_l, wZit), hand_r:V3(pPv.RightHand.t).lerp(TAFEL_PV.hand_r, wZit)};
      }
      rIk.zet(pIk, extraIk); rPv.zet(pPv, extraPv);
      const j = q >= 0 ? vrager() : null, kijkNaar = (fase === 'hand' || fase === 'vraag') && j ? j.hoofd : null;
      if (zit){ draaiHoofd(ik, rIk.houder, 'ik', kijkNaar, dt); draaiHoofd(pv, rPv.houder, 'pv', j ? j.hoofd : null, dt); }
      publiek.stap(t, dt);

      zetCamera(t, dt);
      // fotografen
      if (Math.random() < dt * flitsKans){ flits.intensity = 16; if (!publiek.flitsPlek(flits.position)) flits.position.set(-2 + Math.random() * 4, 1.3 + Math.random() * .6, 2 + Math.random() * 1.8); laag.flits(); }
      flits.intensity *= Math.pow(.0005, dt);
      zaal.stap(t);
      renderer.render(scene, camera);
    });
    for (const r of [rIk, rPv]) scene.remove(r.houder);
    publiek.weg();
  } finally {
    if (r3) r3.opruim();
    laag.sluit();
  }
}

// ---------- de perszaal (dezelfde maten als de bestuurskamer in contractscene.js) ----------
function bouwPerszaal(info, reg){
  const groep = new THREE.Group(), {tenue} = info;
  const mat = (o) => reg(new THREE.MeshStandardMaterial(o));
  const doos = (b, h, d, m, x, y, z, ouder = groep) => { const me = new THREE.Mesh(reg(new THREE.BoxGeometry(b, h, d)), m); me.position.set(x, y, z); ouder.add(me); return me; };
  // vloerbedekking
  const [vc, vg] = canvas(256, 256); vg.fillStyle = '#2b303b'; vg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++){ const s = hashGetal('v' + i), x = s % 256, y = (s >>> 8) % 256; vg.fillStyle = (s >>> 16) % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.12)'; vg.fillRect(x, y, 2, 2); }
  const vt = tex(vc, reg); vt.wrapS = vt.wrapT = THREE.RepeatWrapping; vt.repeat.set(8, 6);
  const vloer = new THREE.Mesh(reg(new THREE.PlaneGeometry(16, 12)), mat({map:vt, roughness:.95})); vloer.rotation.x = -Math.PI / 2; vloer.position.set(-1, 0, 2); groep.add(vloer);
  // de perswand: logo en sponsor, om en om
  const [wc, wg] = canvas(2048, 512);
  wg.fillStyle = '#f4f5f8'; wg.fillRect(0, 0, 2048, 512);
  const tekstKl = licht(tenue.shirt) ? '#1b1d24' : tenue.shirt;
  for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++){
    const x = 80 + k * 240 + (r % 2) * 120, y = 90 + r * 170;
    if ((k + r) % 2 === 0 && info.logoImg) wg.drawImage(info.logoImg, x - 45, y - 45, 90, 90);
    else { wg.fillStyle = tekstKl; wg.font = '900 30px Arial Black, Arial, sans-serif'; wg.textAlign = 'center'; wg.textBaseline = 'middle'; wg.fillText((info.sponsor ? info.sponsor.naam : info.club).toUpperCase(), x, y); }
  }
  wg.fillStyle = tenue.shirt; wg.fillRect(0, 488, 2048, 24);
  doos(10.5, 3.2, .12, mat({map:tex(wc, reg), roughness:.85}), -.75, 1.6, -2.0);
  const muur = mat({color:0xcfd3db, roughness:.9});
  doos(10.5, 3, .12, muur, -.75, 4.7, -2.0); doos(10.5, .12, .14, mat({color:0x2a2d36}), -.75, 3.2, -1.98);
  // linkerwand met de deur waar je binnenkomt
  doos(.12, 6.2, 1.0, muur, -6.0, 3.1, -1.5); doos(.12, 6.2, 6, muur, -6.0, 3.1, 3.2); doos(.12, 3.95, 1.2, muur, -6.0, 4.22, -.4);
  const deur = doos(.05, 2.25, 1.0, mat({color:0x4b5260, roughness:.6}), -5.6, 1.13, .15); deur.rotation.y = -1.1;
  // achterwand achter het publiek en de rechterwand (ver genoeg weg voor de camera aan het begin, op x 6 / z 7)
  const zaalMuur = mat({color:0x3a404d, roughness:.9});
  doos(12.8, 4.6, .12, zaalMuur, .3, 2.3, 7.7); doos(.12, 4.6, 9.8, zaalMuur, 6.7, 2.3, 2.8);
  doos(12.8, .5, .14, mat({color:tenue.shirt, roughness:.7}), .3, 2.6, 7.62); // (een band in de clubkleur)
  const uitgang = (x, z, ry) => { const [ec, eg] = canvas(256, 96); eg.fillStyle = '#1b8a3c'; eg.fillRect(0, 0, 256, 96); eg.fillStyle = '#fff'; eg.font = '900 44px Arial, sans-serif'; eg.textAlign = 'center'; eg.textBaseline = 'middle'; eg.fillText('UITGANG', 128, 50);
    const m = new THREE.Mesh(reg(new THREE.PlaneGeometry(.5, .19)), reg(new THREE.MeshBasicMaterial({map:tex(ec, reg)}))); m.position.set(x, 2.35, z); m.rotation.y = ry; groep.add(m); };
  uitgang(-3.5, 7.62, Math.PI); doos(1.0, 2.2, .06, mat({color:0x2a2e38, roughness:.5}), -3.5, 1.1, 7.66);
  // banieren in de clubkleuren
  for (const x of [-2.2, 2.0]){
    const [bc, bg] = canvas(256, 1024); bg.fillStyle = tenue.shirt; bg.fillRect(0, 0, 256, 1024); bg.fillStyle = tenue.accent || '#fff'; bg.fillRect(0, 0, 256, 60); bg.fillRect(0, 964, 256, 60);
    if (info.logoImg) bg.drawImage(info.logoImg, 28, 380, 200, 200);
    const ban = new THREE.Mesh(reg(new THREE.PlaneGeometry(.55, 2.2)), mat({map:tex(bc, reg), roughness:.9, side:THREE.DoubleSide})); ban.position.set(x, 1.65, -1.85); groep.add(ban);
  }
  // de tafel met een kleed
  const hout = mat({color:0x2c2f38, roughness:.4, metalness:.1});
  doos(2.6, .05, .72, hout, 0, .725, 0);
  for (const [x, z] of [[-1.2, -.3], [1.2, -.3], [-1.2, .3], [1.2, .3]]) doos(.06, .7, .06, hout, x, .35, z);
  const [kc, kg] = canvas(1024, 280); kg.fillStyle = tenue.shirt; kg.fillRect(0, 0, 1024, 280); kg.fillStyle = tenue.accent || '#fff'; kg.fillRect(0, 0, 1024, 18); kg.fillRect(0, 262, 1024, 18);
  if (info.logoImg) kg.drawImage(info.logoImg, 60, 50, 180, 180);
  kg.fillStyle = licht(tenue.shirt) ? '#15161c' : '#ffffff'; kg.textBaseline = 'middle'; kg.textAlign = 'left';
  kg.font = '900 62px Arial Black, Arial, sans-serif'; kg.fillText('PERSCONFERENTIE', 280, 112);
  kg.font = '700 40px Arial, sans-serif'; kg.fillText(info.club.toUpperCase(), 284, 182);
  const kleed = new THREE.Mesh(reg(new THREE.PlaneGeometry(2.62, .7)), mat({map:tex(kc, reg), roughness:.95})); kleed.position.set(0, .4, .365); groep.add(kleed);
  // stoelen (jouw stoel en die van de persvoorlichter; die van de journalisten komen erbij met stoel())
  const leer = mat({color:0x15161a, roughness:.45}), poot = mat({color:0x888c94, metalness:.8, roughness:.3}), stof = mat({color:0x30343f, roughness:.8});
  const stoel = (p, h, klap) => {
    const g = new THREE.Group(); g.position.set(p[0], 0, p[2]); g.rotation.y = h; groep.add(g);
    const m = klap ? stof : leer;
    doos(.46, .06, .44, m, 0, .44, 0, g); doos(.46, klap ? .38 : .62, .05, m, 0, klap ? .7 : .8, -.24, g);
    for (const [x, z] of [[-.2, -.18], [.2, -.18], [-.2, .18], [.2, .18]]) doos(.025, .42, .025, poot, x, .21, z, g);
  };
  for (const x of [-.6, .6]) stoel([x, 0, -.88], 0, false);
  // microfoons van de zenders voor jouw plek, een losse voor de persvoorlichter
  const zwart = mat({color:0x1a1c22, roughness:.5, metalness:.3}), rooster = mat({color:0x2b2e36, roughness:.35, metalness:.6});
  const microfoon = (x, z, kanteling, draai, zender) => {
    const g = new THREE.Group(); g.position.set(x, .75, z); g.rotation.set(-kanteling, draai, 0); groep.add(g);
    const st = new THREE.Mesh(reg(new THREE.CylinderGeometry(.006, .006, .26, 8)), zwart); st.position.y = .13; g.add(st);
    const voet = new THREE.Mesh(reg(new THREE.CylinderGeometry(.035, .04, .012, 16)), zwart); voet.position.y = .006; g.add(voet);
    const kop = new THREE.Mesh(reg(new THREE.SphereGeometry(.022, 14, 10)), rooster); kop.position.y = .27; g.add(kop);
    if (zender){
      const [zc, zg] = canvas(128, 64); zg.fillStyle = zender[1]; zg.fillRect(0, 0, 128, 64); zg.fillStyle = '#fff'; zg.font = '900 30px Arial Black, Arial, sans-serif'; zg.textAlign = 'center'; zg.textBaseline = 'middle'; zg.fillText(zender[0], 64, 34);
      const zm = mat({map:tex(zc, reg), roughness:.6}), zk = mat({color:zender[1], roughness:.6});
      const blok = new THREE.Mesh(reg(new THREE.BoxGeometry(.07, .04, .07)), [zk, zk, zk, zk, zm, zm]); blok.position.y = .23; g.add(blok);
    }
  };
  ZENDERS.forEach((z, i) => microfoon(-.6 + (i - 2) * .075, -.12 - (i % 2) * .05, .32, (i - 2) * -.12, z));
  microfoon(.6, -.15, .3, 0, null);
  // naambordjes en water
  const bordje = (x, tekst) => {
    const [nc, ng] = canvas(512, 128); ng.fillStyle = '#ffffff'; ng.fillRect(0, 0, 512, 128); ng.fillStyle = tenue.shirt; ng.fillRect(0, 108, 512, 20);
    ng.fillStyle = '#15161c'; ng.font = '900 46px Arial Black, Arial, sans-serif'; ng.textAlign = 'center'; ng.textBaseline = 'middle';
    let f = 46; while (ng.measureText(tekst).width > 480 && f > 20){ f -= 2; ng.font = `900 ${f}px Arial Black, Arial, sans-serif`; } ng.fillText(tekst, 256, 56);
    const wit = mat({color:0xffffff, roughness:.6}), voor = mat({map:tex(nc, reg), roughness:.6});
    const b = new THREE.Mesh(reg(new THREE.BoxGeometry(.34, .085, .012)), [wit, wit, wit, wit, voor, wit]); b.position.set(x, .8, .2); b.rotation.x = -.25; groep.add(b);
  };
  bordje(-.6, info.naam.toUpperCase()); bordje(.6, 'PERSVOORLICHTER');
  const glas = reg(new THREE.MeshPhysicalMaterial({color:0xcfe8ff, roughness:.05, transmission:.6, transparent:true, opacity:.6}));
  for (const x of [-1.05, 1.05]){ const f = new THREE.Mesh(reg(new THREE.CylinderGeometry(.03, .03, .2, 16)), glas); f.position.set(x, .85, -.05); groep.add(f); }
  // twee tv-camera's op een statief, met een rood lampje
  const lampjes = [];
  for (const [x, z] of [[3.0, 1.5], [-3.4, 3.4]]){
    const g = new THREE.Group(); g.position.set(x, 0, z); g.lookAt(-.6, 0, -.8); groep.add(g);
    for (let i = 0; i < 3; i++){ const a = i * Math.PI * 2 / 3, been = new THREE.Mesh(reg(new THREE.CylinderGeometry(.015, .015, 1.5, 6)), zwart); been.position.set(Math.sin(a) * .22, .72, Math.cos(a) * .22); been.rotation.set(Math.cos(a) * .3, 0, -Math.sin(a) * .3); g.add(been); }
    doos(.22, .24, .5, mat({color:0x30333b, roughness:.4, metalness:.4}), 0, 1.55, 0, g);
    const lens = new THREE.Mesh(reg(new THREE.CylinderGeometry(.07, .08, .2, 16)), zwart); lens.rotation.x = Math.PI / 2; lens.position.set(0, 1.55, .33); g.add(lens);
    const lamp = new THREE.Mesh(reg(new THREE.SphereGeometry(.014, 8, 6)), reg(new THREE.MeshBasicMaterial({color:0xff2a2a}))); lamp.position.set(.08, 1.7, .2); g.add(lamp); lampjes.push(lamp);
  }
  return {groep, stoel, stap(t){ for (const l of lampjes) l.visible = Math.sin(t * 3) > -.6; }};
}

// ---------- de teksten en knoppen over de scène ----------
function maakOverlay(laag, info){
  laag.ui.innerHTML = `<div class="cs-melding" aria-live="polite"></div>
    <div class="cs-onder"><img class="cs-logo" alt=""><div><div class="cs-kop"></div><div class="cs-sub"></div></div></div>
    <div class="pc-paneel">
      <div class="pc-vraag" aria-live="polite"><div class="pc-wie"></div><p class="pc-tekst"></p></div>
      <div class="pc-keuzes" role="group" aria-label="Kies je antwoord"></div>
      <div class="pc-uit" aria-live="polite"><p class="pc-jij"></p><p class="pc-gevolg"></p><button type="button" class="pc-knop pc-verder">Verder <kbd>↵</kbd></button></div>
    </div>
    <div class="pc-slot" role="status"></div>`;
  const $ = laag.$; let meldTimer = 0, kiesF = null, verderF = null;
  if (info.logoImg) $('.cs-logo').src = info.logoImg.src;
  $('.pc-verder').addEventListener('click', () => verderF && verderF());
  laag.ui.addEventListener('click', e => { const b = e.target.closest('.pc-keuze'); if (b && kiesF) kiesF(Number(b.dataset.i)); if (e.target.closest('.pc-slot .pc-knop') && verderF) verderF(); });
  const U = {
    onder:false, wenk:false, gevolgLengte:0,
    opKies(f){ kiesF = f; }, opVerder(f){ verderF = f; },
    onderschrift(kop, sub){ U.onder = true; $('.cs-kop').textContent = kop; $('.cs-sub').textContent = sub; $('.cs-onder').classList.add('aan'); },
    melding(html){ const m = $('.cs-melding'); m.innerHTML = html; m.classList.add('aan'); clearTimeout(meldTimer); meldTimer = setTimeout(() => m.classList.remove('aan'), 2800); },
    verberg(){ for (const s of ['.pc-vraag', '.pc-keuzes', '.pc-uit']) $(s).classList.remove('aan'); },
    vraag(v, k, n){
      $('.cs-onder').classList.remove('aan');
      $('.pc-wie').innerHTML = `<span class="pc-krant">${esc(v.krant)}</span> ${esc(v.wie)}${n > 1 ? ` <span class="pc-nr">vraag ${k + 1} van ${n}</span>` : ''}`;
      $('.pc-tekst').textContent = `"${v.vraag}"`;
      $('.pc-keuzes').innerHTML = v.opts.map((o, i) => `<button type="button" class="pc-keuze pc-${o.soort}" data-i="${i}" style="--d:${120 + i * 90}ms">
        <span class="pc-k1"><span class="pc-icoon" aria-hidden="true">${o.icoon}</span><b>${esc(o.l)}</b><kbd>${i + 1}</kbd></span>
        <span class="pc-citaat">${esc(o.t)}</span><span class="pc-hint">${esc(o.hint || '')}</span></button>`).join('');
      $('.pc-vraag').classList.add('aan'); $('.pc-keuzes').classList.add('aan');
      requestAnimationFrame(() => { const b = $('.pc-keuze'); if (b) try { b.focus({preventScroll:true}); } catch (e){} });
    },
    kies(i, o){
      $('.pc-keuzes').classList.remove('aan'); $('.pc-vraag').classList.remove('aan');
      $('.pc-jij').innerHTML = `<b>Jij:</b> ${esc(o.t)}`; $('.pc-gevolg').textContent = ''; $('.pc-gevolg').classList.remove('aan'); $('.pc-verder').hidden = true;
      $('.pc-uit').className = `pc-uit pc-${o.soort} aan`;
    },
    zetGevolg(t){ U.gevolgLengte = t.length; $('.pc-gevolg').textContent = t; },
    toonGevolg(){ $('.pc-gevolg').classList.add('aan'); $('.pc-verder').hidden = false; try { $('.pc-verder').focus({preventScroll:true}); } catch (e){} },
    slot(voor, na, n){
      U.verberg(); $('.cs-onder').classList.remove('aan');
      const rijen = na.map((m, k) => { const a = voor[k] ? voor[k].v : m.v, d = Math.round(m.v) - Math.round(a), f = m.t || (x => String(Math.round(x)));
        return `<li class="${d > 0 ? 'op' : d < 0 ? 'neer' : ''}"><span>${esc(m.n)}</span><span>${esc(f(a))} → <b>${esc(f(m.v))}</b></span></li>`; }).join('');
      $('.pc-slot').innerHTML = `${info.logoImg ? `<img src="${info.logoImg.src}" alt="">` : ''}<div class="pc-skop">Persconferentie afgelopen</div>
        <p class="pc-ssub">${n ? `${n} ${n === 1 ? 'vraag' : 'vragen'} beantwoord` : 'Geen vragen beantwoord'}</p><ul>${rijen}</ul>
        <button type="button" class="pc-knop">Verder <kbd>↵</kbd></button>`;
      $('.pc-slot').classList.add('aan');
      try { $('.pc-slot .pc-knop').focus({preventScroll:true}); } catch (e){}
    },
  };
  return U;
}
