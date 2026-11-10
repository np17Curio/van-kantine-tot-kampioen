import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { laadAnimatie, qrot } from './anim/voetbal-anim.js';
import { maakRetarget } from './anim/retarget.js';
import { langeBroek, maakPubliek } from './publiek.js';
import { hashGetal, laadModel, maakModelSpeler, uiterlijkVoor } from './spelermodel.js';
import { ploegen } from './pitch.js';
import { S } from '../core/state.js';
import { esc, geldTxt } from '../core/utils.js';
import { CLUBS } from '../data/gegevens.js';
import { clubTenue } from '../data/tenues.js';
import { logoURL } from '../data/logos.js';
import { shirtSponsor } from '../data/shirtsponsors.js';
import { thuisLand } from '../data/landen.js';
import { rugnummer } from '../game/team/rugnummers.js';
import { GLAD, canvas, laadPlaatje, licht, maakLaag, maakRenderer, speelLus, tex } from './cutscene-basis.js';

/* ===================== Cutscene: je tekent bij je nieuwe club ===================== */
// Je komt de bestuurskamer binnen, de voorzitter zwaait, jullie gaan zitten, je zet je handtekening, jullie schudden
// elkaar de hand en je houdt het shirt van je nieuwe club omhoog (met je naam en rugnummer).
// De beweging komt uit anim/contract_tekenen.json (24 s, met camera en props) en gaat met anim/retarget.js op ons model.
// Er komt even een eigen WebGL-renderer bij: het canvas van het veld hangt in de pagina eronder en moet daar blijven.
// Na afloop wordt die renderer helemaal opgeruimd (ook de context), dus er blijft niets openstaan.

let DATA = null;
const laadData = () => DATA || (DATA = import('./anim/contract_tekenen.json').then(m => laadAnimatie(m.default)));
const VOORNAAM = ['J.', 'H.', 'P.', 'W.', 'R.', 'M.', 'A.', 'C.', 'F.', 'G.', 'K.', 'L.', 'E.', 'T.'];
const ACHTERNAAM = ['Van der Meer', 'Hoekstra', 'De Ruyter', 'Verbeek', 'Kramer', 'Van Dijk', 'Brandsma', 'Lindqvist', 'Moreau', 'Ferreira', 'Rossi', 'Novak', 'Hartmann', 'Okafor', 'Schouten', 'De Lange', 'Bakker', 'Sanders', 'Castelli', 'Van Rijn'];
const CONTRACT_MIDDEN = new THREE.Vector3(-.6, .75, -.17);
// Het publiek (publiek.js): links de pers, rechts clubmensen in clubkleur, met een gangpad in het midden voor de camera;
// twee fotografen staan op de hoeken. Ze kijken naar de tafel.
const TAFEL = [0, -.3];
const PUBLIEK = [
  ...[[-3.3, 2.0], [-2.4, 2.0], [-1.5, 2.0], [-3.0, 2.9], [-2.1, 2.9]].map(([x, z]) => ({x, z, rol:'pers', kijk:TAFEL})),
  ...[[1.9, 2.0], [2.8, 2.0], [3.7, 2.0], [2.2, 2.9], [3.1, 2.9]].map(([x, z]) => ({x, z, rol:'club', kijk:TAFEL})),
  {x:-2.5, z:1.0, rol:'fotograaf', kijk:TAFEL}, {x:2.7, z:.9, rol:'fotograaf', kijk:TAFEL},
];

let BEZIG = null;
// o = {clubId, jaren?, salaris?, som?}. Geeft een Promise die klaar is als de scène af is of overgeslagen.
export function speelContractScene(o = {}){
  if (BEZIG) return BEZIG;
  BEZIG = speel(o).catch(e => { console.warn('Transfer-animatie kon niet spelen', e); }).finally(() => { BEZIG = null; });
  return BEZIG;
}

async function speel(o){
  const sp = S && S.sp; if (!sp) return;
  const clubId = o.clubId ?? sp.club, c = CLUBS[clubId]; if (!c) return;
  const laag = maakLaag({tag:'Officieel', label:'Animatie: je tekent bij je nieuwe club'}); // meteen iets laten zien (laden duurt even de eerste keer)
  const tk = teksten(laag);
  let r3 = null;
  try {
    try { r3 = maakRenderer(laag); } catch (e){ laag.sluit(); return; }
    const {renderer, camera, reg} = r3;

    const tenue = clubTenue(clubId), logoImg = await laadPlaatje(logoURL(clubId, 256));
    const [anim] = await Promise.all([laadData(), laadModel()]);
    if (laag.weg) return;
    const o23 = !!(o.o23 || sp.o23); // (bij de O23 nog geen rugnummer van het eerste elftal)
    let nr = null; if (!o23) try { nr = rugnummer(); } catch (e){}
    const info = {club:c.n, naam:sp.naam, nr, tenue, logoImg, sponsor:shirtSponsor(c, thuisLand()), jaren:o.huur ? null : o.jaren ?? sp.contract, salaris:o.salaris ?? sp.salaris, o23, huur:!!o.huur,
      voorzitter:`${VOORNAAM[hashGetal('vzv|' + c.n) % VOORNAAM.length]} ${ACHTERNAAM[hashGetal('vza|' + c.n) % ACHTERNAAM.length]}`};

    // ---------- scène ----------
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a1d24);
    const pmrem = new THREE.PMREMGenerator(renderer), envRT = pmrem.fromScene(new RoomEnvironment(), .04); pmrem.dispose();
    scene.environment = envRT.texture; reg(envRT);
    const kamer = bouwKamer(info, reg); scene.add(kamer.groep);
    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a3228, .55));
    const zon = new THREE.DirectionalLight(0xfff1dc, 1.6); zon.position.set(3, 5, 4); scene.add(zon);
    const raam = new THREE.DirectionalLight(0xcfe3ff, .7); raam.position.set(-4, 3, -1); scene.add(raam);
    const flits = new THREE.PointLight(0xffffff, 0, 12, 1.5); scene.add(flits);

    // personages
    let sleutel = sp.naam; try { sleutel = ploegen().jij || sleutel; } catch (e){}
    const ikUit = uiterlijkVoor('jij|' + sleutel, sp.uiterlijk);
    const nett = {shirt:'#eef1f6', accent:'#eef1f6', patroon:'effen', broek:'#262b36', sok:'#262b36'};
    const ik = maakModelSpeler(ikUit, nett); if (!ik) throw new Error('geen spelersmodel');
    langeBroek(ik);
    const vzUit = uiterlijkVoor('voorzitter|' + c.n);
    vzUit.haar = hashGetal('vzh|' + c.n) % 3 ? 5 : vzUit.haar; vzUit.kapsel = ['kort', 'kort', 'kaal', 'kuif'][hashGetal('vzk|' + c.n) % 4]; vzUit.bouw = Math.max(vzUit.bouw, 1.02);
    const pak = {shirt:'#1f2433', accent:'#1f2433', patroon:'effen', broek:'#1f2433', sok:'#0e1016'};
    const vz = maakModelSpeler(vzUit, pak); if (!vz) throw new Error('geen spelersmodel');
    langeBroek(vz);
    const rIk = maakRetarget(ik), rVz = maakRetarget(vz);
    scene.add(rIk.houder, rVz.houder);
    const das = maakDas(tenue, reg); vz.botten.spine_03 && scene.add(das);

    // props
    const props = maakProps(info, reg); for (const p of Object.values(props.mesh)) scene.add(p);
    const confetti = maakConfetti(tenue, reg); scene.add(confetti.mesh);
    const publiek = maakPubliek({scene, anim, reg, plekken:PUBLIEK, sleutel:c.n, tenue, stoel:kamer.stoel});

    // ---------- teksten bij de gebeurtenissen ----------
    const T = {binnen:2.4, zwaai:5.4, penPak:8.2, penNeer:12.7, tekenStart:9.2, tekenEind:12.2, hand:14.0, handEind:16.2, shirt:17.3, einde:anim.duur};
    laag.geladen(); tk.zetInfo(info);
    const momenten = [
      [T.binnen, () => tk.onderschrift(`Welkom bij <b>${esc(info.club)}</b>`, info.huur ? 'Huurperiode tot het einde van het seizoen'
        : `${info.o23 ? 'Je tekent bij de O23' : 'Transfer rond'} · ${info.jaren ? `contract voor ${info.jaren} jaar` : 'contract getekend'}${o.som ? ` · ${geldTxt(o.som)}` : ''}`)],
      [T.zwaai, () => tk.melding(`${esc(info.voorzitter)}, voorzitter: "Fijn dat je er bent!"`)],
      [T.tekenStart, () => tk.melding('Je zet je handtekening…')],
      [T.tekenEind, () => tk.melding('✍️ Getekend!')],
      [T.hand, () => tk.melding('🤝 Een stevige handdruk met de voorzitter')],
      [T.shirt, () => tk.titel(info)],
    ];
    let volgende = 0;

    // ---------- afspelen ----------
    const handdrukDoel = new THREE.Vector3(), tmpV = new THREE.Vector3(), penAs = new THREE.Vector3(), handRichting = new THREE.Vector3(), HAND_LENGTE = .075;
    await speelLus(laag, anim.duur, (tt, dt) => {
        while (volgende < momenten.length && momenten[volgende][0] <= tt) momenten[volgende++][1]();
        // personages: bij de handdruk komen de twee rechterhanden in het midden samen
        const pIk = anim.wereldPose('Speler', tt), pVz = anim.wereldPose('Voorzitter', tt);
        const w = GLAD(T.hand, T.hand + .5, tt) * (1 - GLAD(T.handEind - .4, T.handEind, tt));
        const extraIk = {}, extraVz = {};
        if (w > 0){ handdrukDoel.fromArray(pIk.RightHand.t).add(tmpV.fromArray(pVz.RightHand.t)).multiplyScalar(.5);
          extraIk.doel = {hand_r:tmpV.fromArray(pIk.RightHand.t).lerp(handdrukDoel, w).clone()};
          extraVz.doel = {hand_r:tmpV.fromArray(pVz.RightHand.t).lerp(handdrukDoel, w).clone()}; }
        // de pen in de hand: de pols zo, dat de vingers net boven de punt de pen vasthouden
        const wp = GLAD(T.penPak, T.penPak + .4, tt) * (1 - GLAD(T.penNeer - .2, T.penNeer + .2, tt));
        if (wp > 0){ const pen = anim.object('Prop_Pen', tt), as = penAs.fromArray(qrot(pen.r, [0, 1, 0])), hand = handRichting.fromArray(qrot(pIk.RightHand.r, [0, 1, 0]));
          const greep = tmpV.fromArray(pen.t).addScaledVector(as, -.035).addScaledVector(hand, -HAND_LENGTE);
          extraIk.doel = {...(extraIk.doel || {}), hand_r:new THREE.Vector3().fromArray(pIk.RightHand.t).lerp(greep, wp)}; }
        rIk.zet(pIk, extraIk); rVz.zet(pVz, extraVz);
        if (vz.botten.spine_03) zetDas(das, vz.botten.spine_03, rVz.houder);
        // props en de handtekening
        for (const [naam, m] of Object.entries(props.mesh)){
          const ob = anim.object(naam, tt); m.position.fromArray(ob.t); m.quaternion.fromArray(ob.r);
          if (ob.visible !== undefined) m.visible = ob.visible; if (ob.scale !== undefined) m.scale.setScalar(Math.max(.0001, ob.scale));
        }
        props.handtekening((tt - T.tekenStart) / (T.tekenEind - T.tekenStart));
        // camera uit de animatie (op een smal scherm iets verder naar achteren)
        const cam = anim.object('Camera', tt); camera.position.fromArray(cam.t); camera.quaternion.fromArray(cam.r);
        const z = camera.userData.zoom || 1; if (z < 1) camera.translateZ((1 / z - 1) * 1.2);
        // de close-up van het tekenen: de camera is gemaakt voor een skelet zonder handen; met onze handen iets meer afstand
        const dc = camera.position.distanceTo(CONTRACT_MIDDEN); if (dc < 1.1) camera.translateZ(.42 * (1 - dc / 1.1));
        camera.fov = cam.yfov_graden || 40; camera.updateProjectionMatrix();
        // fotografen: flitsen bij de handdruk en bij het shirt
        const flitsTijd = (tt > T.hand && tt < T.handEind) || tt > T.shirt + .2;
        if (flitsTijd && Math.random() < dt * 2.2){ flits.intensity = 30; if (!publiek.flitsPlek(flits.position)) flits.position.set(-1.5 + Math.random() * 3, 1.6 + Math.random() * .6, 1.6 + Math.random() * 1.5); laag.flits(); }
        flits.intensity *= Math.pow(.0005, dt);
        confetti.stap(tt - T.shirt, dt);
        // het publiek klapt als je getekend hebt, bij de handdruk en bij het shirt
        const klap = (tt > T.tekenEind && tt < T.tekenEind + 2.5) || tt > T.shirt ? 1 : tt > T.hand && tt < T.handEind ? .7 : 0;
        publiek.stap(tt, dt, {klap});
        renderer.render(scene, camera);
    });
    for (const r of [rIk, rVz]) scene.remove(r.houder);
    publiek.weg();
  } finally {
    if (r3) r3.opruim();
    laag.sluit();
  }
}



// ---------- de bestuurskamer ----------
function bouwKamer(info, reg){
  const groep = new THREE.Group(), {tenue} = info;
  const mat = (o) => reg(new THREE.MeshStandardMaterial(o));
  const doos = (b, h, d, m, x, y, z) => { const me = new THREE.Mesh(reg(new THREE.BoxGeometry(b, h, d)), m); me.position.set(x, y, z); groep.add(me); return me; };
  // parketvloer
  const [vc, vg] = canvas(512, 512);
  for (let r = 0; r < 16; r++) for (let k = 0; k < 4; k++){ const s = (hashGetal('p' + r + k) % 40) - 20; vg.fillStyle = `rgb(${120 + s},${82 + s * .7},${52 + s * .5})`; const off = r % 2 ? 64 : 0; vg.fillRect(k * 128 - off, r * 32, 128, 32); vg.fillRect(k * 128 - off + 512, r * 32, 128, 32); vg.strokeStyle = 'rgba(40,24,12,.5)'; vg.strokeRect(k * 128 - off, r * 32, 128, 32); }
  const vt = tex(vc, reg); vt.wrapS = vt.wrapT = THREE.RepeatWrapping; vt.repeat.set(5, 4);
  const vloer = new THREE.Mesh(reg(new THREE.PlaneGeometry(16, 12)), mat({map:vt, roughness:.55})); vloer.rotation.x = -Math.PI / 2; vloer.position.set(-1, 0, 2); groep.add(vloer);
  // achterwand: een perswand met het logo en de sponsor, herhaald
  const [wc, wg] = canvas(2048, 512);
  wg.fillStyle = tenue.shirt; wg.fillRect(0, 0, 2048, 512);
  const grad = wg.createLinearGradient(0, 0, 0, 512); grad.addColorStop(0, 'rgba(255,255,255,.10)'); grad.addColorStop(1, 'rgba(0,0,0,.35)'); wg.fillStyle = grad; wg.fillRect(0, 0, 2048, 512);
  const tekstKl = licht(tenue.shirt) ? 'rgba(20,22,28,.85)' : 'rgba(255,255,255,.9)';
  for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++){
    const x = 80 + k * 240 + (r % 2) * 120, y = 90 + r * 170;
    if ((k + r) % 2 === 0 && info.logoImg) wg.drawImage(info.logoImg, x - 45, y - 45, 90, 90);
    else { wg.fillStyle = tekstKl; wg.font = '900 30px Arial Black, Arial, sans-serif'; wg.textAlign = 'center'; wg.textBaseline = 'middle'; wg.fillText((info.sponsor ? info.sponsor.naam : info.club).toUpperCase(), x, y); }
  }
  doos(10.5, 3.2, .12, mat({map:tex(wc, reg), roughness:.8}), -.75, 1.6, -2.0);
  // boven de perswand een gewone muur tot het plafond (de camera begint hoog)
  const muur = mat({color:0xd9d2c5, roughness:.9});
  doos(10.5, 3, .12, muur, -.75, 4.7, -2.0); doos(10.5, .12, .14, mat({color:0x2a2d36}), -.75, 3.2, -1.98);
  // linkerwand met de deur waar je binnenkomt
  doos(.12, 6.2, 1.0, muur, -6.0, 3.1, -1.5); doos(.12, 6.2, 6, muur, -6.0, 3.1, 3.2); doos(.12, 3.95, 1.2, muur, -6.0, 4.22, -.4);
  const deur = doos(.05, 2.25, 1.0, mat({color:0x6b4a32, roughness:.6}), -5.6, 1.13, .15); deur.rotation.y = -1.1;
  // een raam met daglicht in de achterwand (rechts)
  const [rc, rg] = canvas(256, 256); const lucht = rg.createLinearGradient(0, 0, 0, 256); lucht.addColorStop(0, '#9cc8ff'); lucht.addColorStop(.75, '#e6f1ff'); lucht.addColorStop(.76, '#3c7d3a'); lucht.addColorStop(1, '#2d6a2c'); rg.fillStyle = lucht; rg.fillRect(0, 0, 256, 256);
  const ruit = new THREE.Mesh(reg(new THREE.PlaneGeometry(1.8, 1.4)), reg(new THREE.MeshBasicMaterial({map:tex(rc, reg)}))); ruit.position.set(3.4, 1.7, -1.93); groep.add(ruit);
  const kozijn = mat({color:0xf2f2f2, roughness:.5});
  doos(1.95, .08, .08, kozijn, 3.4, 2.42, -1.9); doos(1.95, .08, .08, kozijn, 3.4, .98, -1.9); doos(.08, 1.5, .08, kozijn, 2.45, 1.7, -1.9); doos(.08, 1.5, .08, kozijn, 4.35, 1.7, -1.9); doos(.05, 1.4, .05, kozijn, 3.4, 1.7, -1.9);
  // een prijzenkast links
  doos(1.4, 1.9, .45, mat({color:0x3a2a1e, roughness:.6}), -3.6, .95, -1.7);
  const goud = mat({color:0xf3c44f, metalness:.9, roughness:.25});
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++){
    const beker = new THREE.Mesh(reg(new THREE.LatheGeometry([[0, 0], [.06, 0], [.06, .02], [.02, .06], [.02, .14], [.07, .2], [.09, .32], [.08, .32], [0, .22]].map(([r, y]) => new THREE.Vector2(r, y)), 24)), goud);
    beker.position.set(-4.0 + i * .4, .55 + j * .75, -1.6); beker.scale.setScalar(.8 + (i + j) % 2 * .2); groep.add(beker);
  }
  for (let j = 0; j < 2; j++) doos(1.3, .03, .4, mat({color:0x2a1d14}), -3.6, .54 + j * .75, -1.66);
  // twee banieren in de clubkleuren naast het logo
  for (const x of [-2.2, 2.0]){
    const [bc, bg] = canvas(256, 1024); bg.fillStyle = tenue.shirt; bg.fillRect(0, 0, 256, 1024); bg.fillStyle = tenue.accent; bg.fillRect(0, 0, 256, 60); bg.fillRect(0, 964, 256, 60);
    if (info.logoImg) bg.drawImage(info.logoImg, 28, 380, 200, 200);
    const ban = new THREE.Mesh(reg(new THREE.PlaneGeometry(.55, 2.2)), mat({map:tex(bc, reg), roughness:.9, side:THREE.DoubleSide})); ban.position.set(x, 1.65, -1.85); groep.add(ban);
  }
  // tafel met een kleed in de clubkleur en het logo aan de voorkant
  const hout = mat({color:0x4a3021, roughness:.35, metalness:.05});
  doos(2.6, .05, .72, hout, 0, .725, 0);
  for (const [x, z] of [[-1.2, -.3], [1.2, -.3], [-1.2, .3], [1.2, .3]]) doos(.06, .7, .06, hout, x, .35, z);
  const [kc, kg] = canvas(1024, 280); kg.fillStyle = tenue.shirt; kg.fillRect(0, 0, 1024, 280); kg.fillStyle = tenue.accent; kg.fillRect(0, 0, 1024, 18); kg.fillRect(0, 262, 1024, 18);
  if (info.logoImg) kg.drawImage(info.logoImg, 512 - 90, 50, 180, 180);
  kg.fillStyle = licht(tenue.shirt) ? '#15161c' : '#ffffff'; kg.font = '900 54px Arial Black, Arial, sans-serif'; kg.textBaseline = 'middle';
  kg.textAlign = 'right'; kg.fillText('WELKOM', 400, 140); kg.textAlign = 'left'; kg.fillText('THUIS', 624, 140);
  const kleed = new THREE.Mesh(reg(new THREE.PlaneGeometry(2.62, .7)), mat({map:tex(kc, reg), roughness:.95})); kleed.position.set(0, .4, .365); groep.add(kleed);
  // stoelen
  const leer = mat({color:0x15161a, roughness:.45});
  for (const x of [-.6, .6]){
    doos(.5, .07, .48, leer, x, .44, -.88); doos(.5, .62, .07, leer, x, .8, -1.13); doos(.06, .42, .06, mat({color:0x888c94, metalness:.8, roughness:.3}), x, .2, -.88);
  }
  // twee flesjes water en een naambordje
  const glas = reg(new THREE.MeshPhysicalMaterial({color:0xcfe8ff, roughness:.05, transmission:.6, transparent:true, opacity:.6}));
  for (const x of [-1.05, 1.05]){ const f = new THREE.Mesh(reg(new THREE.CylinderGeometry(.03, .03, .2, 16)), glas); f.position.set(x, .85, -.05); groep.add(f); }
  // stoelen voor het publiek (p = [x, y, z] op de vloer, h = kijkrichting)
  const stof = mat({color:0x30343f, roughness:.8}), poot = mat({color:0x888c94, metalness:.8, roughness:.3});
  const blok = (g, b, h, d, m, x, y, z) => { const me = new THREE.Mesh(reg(new THREE.BoxGeometry(b, h, d)), m); me.position.set(x, y, z); g.add(me); };
  const stoel = (p, h) => { const g = new THREE.Group(); g.position.set(p[0], 0, p[2]); g.rotation.y = h; groep.add(g);
    blok(g, .46, .06, .44, stof, 0, .44, 0); blok(g, .46, .38, .05, stof, 0, .7, -.24);
    for (const [x, z] of [[-.2, -.18], [.2, -.18], [-.2, .18], [.2, .18]]) blok(g, .025, .42, .025, poot, x, .21, z);
  };
  return {groep, stoel};
}

// ---------- props: contract, pen, opgevouwen shirt, open shirt ----------
function maakProps(info, reg){
  const mesh = {};
  // het contract (A4); de bovenkant van het blad wijst van de speler af (zo leest hij het)
  const B = 640, H = Math.round(B * 297 / 210), [cc, cg] = canvas(B, H), [basis, bg] = canvas(B, H);
  bg.fillStyle = '#fbfaf6'; bg.fillRect(0, 0, B, H);
  if (info.logoImg) bg.drawImage(info.logoImg, B / 2 - 50, 40, 100, 100);
  bg.fillStyle = '#1b1d24'; bg.textAlign = 'center'; bg.font = '900 40px Arial Black, Arial, sans-serif'; bg.fillText('SPELERSCONTRACT', B / 2, 190);
  bg.font = '700 26px Georgia, serif'; bg.fillText(info.club, B / 2, 232);
  bg.textAlign = 'left'; bg.font = '22px Georgia, serif';
  const regels = [`Speler: ${info.naam}`, info.nr ? `Rugnummer: ${info.nr}` : '', info.jaren ? `Looptijd: ${info.jaren} jaar` : '', info.salaris ? `Salaris: ${geldTxt(info.salaris)} per jaar` : ''].filter(Boolean);
  regels.forEach((r, i) => bg.fillText(r, 60, 300 + i * 36));
  bg.fillStyle = '#c9c6bd'; for (let i = 0; i < 9; i++){ const w = 380 + (hashGetal('r' + i) % 140); bg.fillRect(60, 470 + i * 26, w, 9); }
  // de handtekening van de voorzitter staat er al; die van de speler komt op de onderste lijn
  bg.strokeStyle = '#1b1d24'; bg.lineWidth = 2;
  const lijnY = Math.round(H * .82), x0 = Math.round(B * .2), x1 = Math.round(B * .67);
  bg.beginPath(); bg.moveTo(x0 - 20, lijnY + 8); bg.lineTo(x1 + 20, lijnY + 8); bg.stroke();
  bg.beginPath(); bg.moveTo(x1 + 40, lijnY - 70); bg.lineTo(B - 40, lijnY - 70); bg.stroke();
  bg.fillStyle = '#666'; bg.font = '17px Georgia, serif'; bg.fillText('Handtekening speler', x0 - 20, lijnY + 32); bg.fillText('Voorzitter', x1 + 40, lijnY - 46);
  krabbel(bg, info.voorzitter, x1 + 50, B - 50, lijnY - 78, 1, '#1d2a6b', 28);
  cg.drawImage(basis, 0, 0);
  const contractTex = tex(cc, reg);
  const contract = new THREE.Mesh(reg(new THREE.PlaneGeometry(.21, .297)), reg(new THREE.MeshStandardMaterial({map:contractTex, roughness:.85, side:THREE.DoubleSide})));
  const blad = new THREE.Group(); contract.position.z = .002; blad.add(contract); mesh.Prop_Contract = blad;
  let gezet = -1;
  const handtekening = (p) => {
    p = Math.min(1, Math.max(0, p)); if (Math.abs(p - gezet) < .004) return; gezet = p;
    cg.drawImage(basis, 0, 0); krabbel(cg, info.naam, x0, x1, lijnY, p, '#0d1f8c', 44); contractTex.needsUpdate = true;
  };
  // de pen (de oorsprong is het midden van de pen; hij staat bijna rechtop als je schrijft)
  const pen = new THREE.Group();
  pen.add(new THREE.Mesh(reg(new THREE.CylinderGeometry(.0055, .0045, .13, 14)), reg(new THREE.MeshStandardMaterial({color:0x101218, metalness:.4, roughness:.3}))));
  const punt = new THREE.Mesh(reg(new THREE.ConeGeometry(.0045, .012, 14)), reg(new THREE.MeshStandardMaterial({color:0xd8c27a, metalness:.9, roughness:.2}))); punt.position.y = -.071; punt.rotation.x = Math.PI; pen.add(punt);
  const clip = new THREE.Mesh(reg(new THREE.BoxGeometry(.002, .04, .004)), punt.material); clip.position.set(0, .04, .006); pen.add(clip);
  mesh.Prop_Pen = pen;
  // het opgevouwen shirt op tafel
  const [fc, fg] = canvas(320, 280); tekenShirtStof(fg, 320, 280, info.tenue); if (info.logoImg) fg.drawImage(info.logoImg, 160 - 40, 90, 80, 80);
  fg.strokeStyle = 'rgba(0,0,0,.25)'; fg.lineWidth = 6; fg.beginPath(); fg.moveTo(70, 0); fg.lineTo(70, 280); fg.moveTo(250, 0); fg.lineTo(250, 280); fg.stroke();
  const stof = reg(new THREE.MeshStandardMaterial({color:info.tenue.shirt, roughness:.8})), boven = reg(new THREE.MeshStandardMaterial({map:tex(fc, reg), roughness:.8}));
  mesh.Prop_Shirt_Opgevouwen = new THREE.Mesh(reg(new THREE.BoxGeometry(.28, .035, .24)), [stof, stof, boven, stof, stof, stof]);
  // het open shirt: de achterkant met je naam en rugnummer, naar de camera
  const SB = 740, SH = 700, [sc, sg] = canvas(SB, SH); tekenShirt(sg, SB, SH, info);
  const shirtGeo = reg(new THREE.PlaneGeometry(.74, .70)); shirtGeo.translate(0, -.03, 0);
  const shirt = new THREE.Mesh(shirtGeo, reg(new THREE.MeshStandardMaterial({map:tex(sc, reg), roughness:.8, alphaTest:.5, side:THREE.DoubleSide})));
  mesh.Prop_Shirt_Open = shirt;
  return {mesh, handtekening};
}

// Een handtekening van een naam: een lopende lijn met lussen, steeds dezelfde voor dezelfde naam. p = hoeveel er al staat (0-1)
function krabbel(g, naam, x0, x1, y, p, kleur, hoog){
  let h = hashGetal('krabbel|' + naam); const d = () => { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h % 1000) / 1000; };
  // lopend schrift: een rij lussen (zoals een aan elkaar geschreven l of e), elke lus anders hoog, met een grote beginletter
  const n = 320, punten = [], letters = Math.max(4, Math.min(8, Math.round(String(naam).length * .55)));
  const amp = []; for (let i = 0; i <= letters; i++) amp.push(.45 + d() * .8);
  const w = (x1 - x0) / (letters + .5), r = w * .42, fase = -Math.PI / 2;
  for (let i = 0; i <= n; i++){
    const u = i / n, l = u * letters, k = Math.min(letters - 1, Math.floor(l)), f = l - Math.floor(l), a = amp[k] + (amp[k + 1] - amp[k]) * f;
    const hoek = l * Math.PI * 2 + fase, groot = k === 0 ? 1.7 : 1;
    const x = x0 + w * .25 + l * w - Math.cos(hoek) * r * .8, yy = y - (Math.sin(hoek) + 1) * hoog * .32 * a * groot;
    punten.push([x, yy]);
  }
  const tot = Math.floor(p * n); if (tot < 1) return;
  g.save(); g.strokeStyle = kleur; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(...punten[0]); for (let i = 1; i <= tot; i++) g.lineTo(...punten[i]); g.stroke();
  if (p >= 1){ g.beginPath(); g.moveTo(x0 + (x1 - x0) * .05, y + 4); g.quadraticCurveTo(x0 + (x1 - x0) * .6, y + 14, x1 + 10, y - 6); g.stroke(); } // de streep eronder
  g.restore();
}

// stof in de kleuren en het patroon van het tenue (zoals PATROON in spelermodel.js)
function tekenShirtStof(g, w, h, t){
  g.fillStyle = t.shirt; g.fillRect(0, 0, w, h); g.fillStyle = t.accent || t.shirt;
  const p = t.patroon;
  if (p === 'strepen') for (let i = 1; i < 9; i += 2) g.fillRect(i * w / 9, 0, w / 9, h);
  else if (p === 'banen') for (let i = 1; i < 9; i += 2) g.fillRect(0, i * h / 9, w, h / 9);
  else if (p === 'helften') g.fillRect(w / 2, 0, w / 2, h);
  else if (p === 'sjerp'){ g.beginPath(); g.moveTo(0, h * .1); g.lineTo(w * .25, 0); g.lineTo(w, h * .85); g.lineTo(w * .75, h); g.closePath(); g.fill(); }
  else if (p === 'blokken') for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2) g.fillRect(i * w / 6, j * h / 6, w / 6, h / 6);
  else if (p === 'bies'){ g.fillRect(0, 0, w, h * .05); g.fillRect(0, h * .95, w, h * .05); }
}
function tekenShirt(g, W, H, info){
  const {tenue:t, naam, nr} = info, sx = W / .74, sy = H / .70, X = x => W / 2 + x * sx, Y = y => H * (.32 / .70) - y * sy;
  // het silhouet (in meters: schouders op ±0,25 en 0,28 hoog, mouwen tot ±0,37)
  const vorm = () => { g.beginPath();
    g.moveTo(X(-.07), Y(.30)); g.quadraticCurveTo(X(0), Y(.27), X(.07), Y(.30)); // de kraag
    g.lineTo(X(.25), Y(.28)); g.lineTo(X(.37), Y(.16)); g.lineTo(X(.30), Y(.07)); g.lineTo(X(.22), Y(.13));
    g.lineTo(X(.22), Y(-.36)); g.quadraticCurveTo(X(0), Y(-.38), X(-.22), Y(-.36));
    g.lineTo(X(-.22), Y(.13)); g.lineTo(X(-.30), Y(.07)); g.lineTo(X(-.37), Y(.16)); g.lineTo(X(-.25), Y(.28)); g.closePath(); };
  g.save(); vorm(); g.clip(); tekenShirtStof(g, W, H, t);
  // vouwen en licht
  const l = g.createLinearGradient(0, 0, W, 0); l.addColorStop(0, 'rgba(0,0,0,.25)'); l.addColorStop(.5, 'rgba(255,255,255,.08)'); l.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = l; g.fillRect(0, 0, W, H);
  g.fillStyle = t.accent || '#fff'; g.fillRect(X(-.4), Y(.31), W, .02 * sy);
  // naam en rugnummer
  const kl = licht(t.shirt) && !['strepen', 'blokken', 'helften'].includes(t.patroon) ? '#15161c' : '#ffffff', rand = kl === '#ffffff' ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.6)';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const achter = (String(naam).split(' ').slice(1).join(' ') || String(naam)).toUpperCase(); // (zonder voornaam: "DE VRIES")
  let f = Math.round(.06 * sy); g.font = `900 ${f}px Arial Black, Arial, sans-serif`; const mw = .38 * sx; if (g.measureText(achter).width > mw){ f = Math.floor(f * mw / g.measureText(achter).width); g.font = `900 ${f}px Arial Black, Arial, sans-serif`; }
  g.lineWidth = f * .18; g.strokeStyle = rand; g.strokeText(achter, X(0), Y(.19)); g.fillStyle = kl; g.fillText(achter, X(0), Y(.19));
  if (nr){ const fn = Math.round(.26 * sy); g.font = `900 ${fn}px Arial Black, Arial, sans-serif`; g.lineWidth = fn * .07; g.strokeText(String(nr), X(0), Y(-.06)); g.fillText(String(nr), X(0), Y(-.06)); }
  if (info.logoImg) g.drawImage(info.logoImg, X(-.03), Y(-.27), .06 * sx, .06 * sx);
  g.restore();
  g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.35)'; vorm(); g.stroke();
}

// Een stropdas in de clubkleur voor de voorzitter: een plat vlakje voor zijn borst, dat met het bovenlijf meebeweegt
function maakDas(tenue, reg){
  const s = new THREE.Shape(); s.moveTo(-.022, 0); s.lineTo(.022, 0); s.lineTo(.035, -.3); s.lineTo(0, -.34); s.lineTo(-.035, -.3); s.closePath();
  const m = new THREE.Mesh(reg(new THREE.ShapeGeometry(s)), reg(new THREE.MeshStandardMaterial({color:licht(tenue.shirt) ? tenue.accent : tenue.shirt, roughness:.5, side:THREE.DoubleSide})));
  const kraag = new THREE.Mesh(reg(new THREE.PlaneGeometry(.12, .05)), reg(new THREE.MeshStandardMaterial({color:0xf4f4f4, roughness:.7, side:THREE.DoubleSide}))); kraag.position.set(0, .01, -.002); m.add(kraag);
  return m;
}
const _p = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3(), _x = new THREE.Vector3(), _m4 = new THREE.Matrix4();
// borst = spine_03, houder = de groep van retarget (draait mee met de heup)
function zetDas(das, borst, houder){
  // net onder de nek, voor de borst; langs het bovenlijf naar beneden
  const nek = borst.children.find(c => c.isBone && /^neck/.test(c.name)); if (!nek) return;
  nek.getWorldPosition(_p); borst.getWorldPosition(_u);
  const op = _u.subVectors(_p, _u).normalize();
  _f.set(0, 0, 1).applyQuaternion(houder.quaternion); _f.addScaledVector(op, -_f.dot(op)).normalize();
  das.position.copy(_p).addScaledVector(op, -.04).addScaledVector(_f, .1);
  das.quaternion.setFromRotationMatrix(_m4.makeBasis(_x.crossVectors(op, _f).normalize(), op, _f));
}

// Confetti in de clubkleuren als je het shirt omhooghoudt
function maakConfetti(tenue, reg){
  const N = 260, geo = reg(new THREE.PlaneGeometry(.035, .022)), mat = reg(new THREE.MeshStandardMaterial({side:THREE.DoubleSide, roughness:.6}));
  const mesh = new THREE.InstancedMesh(geo, mat, N); mesh.frustumCulled = false; mesh.visible = false;
  const kl = [tenue.shirt, tenue.accent || '#ffffff', '#ffffff', '#f3c44f'].map(x => new THREE.Color(x));
  const st = [];
  for (let i = 0; i < N; i++){ mesh.setColorAt(i, kl[i % kl.length]); st.push({p:new THREE.Vector3((Math.random() - .5) * 4, 2.6 + Math.random() * 1.8, (Math.random() - .3) * 2.5), v:-.35 - Math.random() * .4, r:new THREE.Euler(Math.random() * 6, Math.random() * 6, 0), w:2 + Math.random() * 5, ph:Math.random() * 6}); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), een = new THREE.Vector3(1, 1, 1);
  return {mesh, stap(t, dt){
    if (t < 0){ mesh.visible = false; return; } mesh.visible = true;
    for (let i = 0; i < N; i++){ const s = st[i]; s.p.y += s.v * dt; s.p.x += Math.sin(t * 2 + s.ph) * .15 * dt; s.r.x += s.w * dt; s.r.y += s.w * .6 * dt;
      if (s.p.y < 0) s.p.y = 0.002; m4.compose(s.p, q.setFromEuler(s.r), een); mesh.setMatrixAt(i, m4); }
    mesh.instanceMatrix.needsUpdate = true;
  }};
}

// ---------- de teksten over de scène (in de laag uit cutscene-basis.js) ----------
function teksten(laag){
  laag.ui.innerHTML = `<div class="cs-melding" aria-live="polite"></div>
    <div class="cs-onder"><img class="cs-logo" alt=""><div><div class="cs-kop"></div><div class="cs-sub"></div></div></div>
    <div class="cs-titel"></div>`;
  const $ = laag.$;
  let meldTimer = 0;
  return {
    zetInfo(info){ if (info.logoImg) $('.cs-logo').src = info.logoImg.src; },
    onderschrift(kop, sub){ $('.cs-kop').innerHTML = kop; $('.cs-sub').textContent = sub; $('.cs-onder').classList.add('aan'); },
    melding(html){ const m = $('.cs-melding'); m.innerHTML = html; m.classList.add('aan'); clearTimeout(meldTimer); meldTimer = setTimeout(() => m.classList.remove('aan'), 2600); },
    titel(info){ $('.cs-onder').classList.remove('aan'); $('.cs-melding').classList.remove('aan');
      $('.cs-titel').innerHTML = `${info.logoImg ? `<img src="${info.logoImg.src}" alt="">` : ''}<div class="cs-t1">${esc(info.naam)}${info.nr ? ` <span>#${info.nr}</span>` : ''}</div><div class="cs-t2">${info.huur ? `Gehuurd door ${esc(info.club)}` : info.o23 ? `Nieuwe speler van de O23 van ${esc(info.club)}` : `Nieuwe speler van ${esc(info.club)}`}</div>`;
      $('.cs-titel').classList.add('aan'); },
  };
}
