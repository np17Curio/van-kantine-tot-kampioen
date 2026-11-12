import { hashGetal, uiterlijkVoor } from './pixel/uiterlijk.js';
import { BX, JOURNALISTEN, PH, PW, P_FPS, SX, DEUR, maakPers } from './pixel/pers.js';
import { ploegen } from './pitch.js';
import { S, club } from '../core/state.js';
import { esc } from '../core/utils.js';
import { CLUBS } from '../data/gegevens.js';
import { clubTenue } from '../data/tenues.js';
import { logoURL } from '../data/logos.js';
import { ACHTERNAMEN, VOORL } from '../game/competitie/spelers.js';
import { KRANTEN } from '../game/media/nieuws.js';
import { social, volgersTxt } from '../game/prive/social.js';
import { TOON } from '../game/speler/journey.js';
import { PERS_HINT, PERS_ICOON, fans, persAntwoord, persOpen, persVragen } from '../game/wedstrijd/fans-pers.js';
import { persAntwoord as persAntwoordTrainer, persOpenTrainer, persVragenTrainer } from '../game/trainer/pers.js';
import { GLAD, draaiLus, laadPlaatje, maakLaag } from './cutscene-basis.js';

/* ===================== Cutscene: de persconferentie ===================== */
// In pixels (render/pixel/pers.js), in de stijl van de contractondertekening: je loopt de perszaal in en gaat naast de
// persvoorlichter achter de microfoons zitten. Daarna steken journalisten een voor een hun hand op en stel je je antwoord
// samen door een kaart aan te klikken (of 1, 2, 3). Na elke keuze zie je meteen wat het doet (fans, moraal, de trainer of
// het bestuur), aan het eind een overzicht. Overslaan (Esc) mag altijd: open vragen blijven dan in het paneel van het spel.

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

async function speel(o){
  const sp = S.sp, c = CLUBS[o.clubId]; if (!c) return;
  const laag = maakLaag({tag:o.tag, label:'Animatie: persconferentie. Kies je antwoorden met de knoppen of met 1, 2 en 3.', interactief:true});
  try {
    const tenue = clubTenue(o.clubId), logoImg = await laadPlaatje(logoURL(o.clubId, 256));
    if (laag.weg) return;
    const info = {club:c.n, naam:sp.naam, tenue, logoImg, trainer:o.trainer,
      voorlichter:`${VOORL[hashGetal('pvv|' + c.n) % VOORL.length]}. ${ACHTERNAMEN[hashGetal('pva|' + c.n) % ACHTERNAMEN.length]}`};

    // ---------- de pixelzaal: jij (met je eigen uiterlijk), de persvoorlichter en het publiek ----------
    let sleutel = sp.naam; try { sleutel = ploegen().jij || sleutel; } catch (e){}
    const delen = String(sp.naam || '').trim().split(/\s+/), achternaam = delen.length > 1 ? delen.slice(1).join(' ') : delen[0] || '';
    const zaal = maakPers({uit:uiterlijkVoor('jij|' + sleutel, {...(sp.uiterlijk || {}), vrouw:!!sp.vrouw}), uitPv:uiterlijkVoor('persvoorlichter|' + c.n),
      tenue, trainer:o.trainer, naam:achternaam});
    const Z = 3, cv = document.createElement('canvas'); cv.width = PW * Z; cv.height = PH * Z; cv.className = 'cs-pixel';
    cv.setAttribute('aria-hidden', 'true'); laag.vak.prepend(cv);
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;

    // ---------- teksten en knoppen ----------
    laag.geladen();
    const ui = maakOverlay(laag, info);
    const vragen = o.vragen, open = vragen.map((v, q) => q).filter(q => !vragen[q].klaar);
    const metersVoor = o.meters();
    let fase = 'binnen', ft = 0, q = -1, keuze = -1, beantwoord = 0, flitsKans = 0;
    const volgorde = JOURNALISTEN.slice().sort((a, b) => hashGetal('jv' + a + (S.ronde || 0)) - hashGetal('jv' + b + (S.ronde || 0)));
    const vrager = () => volgorde[Math.max(0, open.indexOf(q)) % volgorde.length];
    const handen = new Set();
    const naar = (f) => { fase = f; ft = 0; };
    const volgendeVraag = () => {
      const k = open.indexOf(q) + 1; handen.clear();
      if (k < open.length){ q = open[k]; keuze = -1; ui.verberg(); handen.add(vrager()); naar('hand'); }
      else { ui.verberg(); naar('opstaan'); }
    };
    const kies = (i) => {
      if (fase !== 'vraag' || !vragen[q].opts[i]) return;
      keuze = i; const opt = vragen[q].opts[i];
      ui.kies(i, opt);
      let uit = null; try { uit = o.antwoord(q, i); } catch (e){ console.warn('persantwoord', e); }
      ui.zetGevolg(uit || '');
      beantwoord++; laag.tijd(beantwoord / Math.max(1, open.length));
      handen.clear();
      // na een uitdagend antwoord willen meer journalisten doorvragen
      if (opt.soort === 'u') JOURNALISTEN.filter(j => j !== vrager()).sort(() => Math.random() - .5).slice(0, 3).forEach(j => handen.add(j));
      flitsKans = opt.soort === 'u' ? 7 : opt.soort === 'z' ? 2.5 : 1;
      naar('antwoord');
    };
    laag.opToets = e => { if (fase === 'vraag' && /^[1-3]$/.test(e.key)){ e.preventDefault(); kies(Number(e.key) - 1); } };
    ui.opKies(kies);
    ui.opVerder(() => { if (fase === 'gevolg') volgendeVraag(); else if (fase === 'slot') laag.sluit(); });

    // ---------- de camera: een uitsnede van het pixelbeeld (midden x, y en zoom), zacht naar het volgende shot ----------
    const cam = {x:PW / 2, y:PH / 2, z:1}, wens = {x:PW / 2, y:PH / 2, z:1};
    const shot = (naam) => {
      if (naam === 'zaal') Object.assign(wens, {x:PW / 2, y:PH / 2, z:1});
      else if (naam === 'tafel') Object.assign(wens, {x:(SX + BX) / 2, y:80, z:4 / 3});      // (jij en de persvoorlichter in de bovenste helft: daaronder staat de vraag)
      else if (naam === 'jij') Object.assign(wens, {x:SX + 6, y:80, z:5 / 3});
      else if (naam === 'publiek') Object.assign(wens, {x:PW / 2, y:84, z:4 / 3});
      else if (naam === 'handOp'){ const [x] = zaal.plekVan(vrager()); Object.assign(wens, {x, y:86, z:4 / 3}); }
    };
    const zetCamera = (dt) => {
      const k = dt ? 1 - Math.exp(-dt * 3) : 1;
      cam.x += (wens.x - cam.x) * k; cam.y += (wens.y - cam.y) * k; cam.z += (wens.z - cam.z) * k;
      const w = PW / cam.z, h = PH / cam.z, x = Math.max(0, Math.min(PW - w, cam.x - w / 2)), y = Math.max(0, Math.min(PH - h, cam.y - h / 2));
      return [x, y, w, h];
    };

    // ---------- afspelen (de pixels op 8 beelden per seconde, de camera vloeiend) ----------
    const LOOPT = (SX - DEUR) / 30, ZITT = LOOPT + .6;
    let flitsen = [], flitsTot = 0, gebaar = 0;
    await draaiLus(laag, (t, dt) => {
      ft += dt;
      const st = {ikX:SX, ikLoop:null, ikZit:1, ikPose:'zit', pvPose:'zit', handen, flits:flitsen, lamp:Math.sin(t * 3) > -.6};
      if (fase === 'binnen'){
        if (t < LOOPT){ st.ikX = DEUR + t * 30; st.ikLoop = Math.floor(t * P_FPS); st.ikZit = 0; }
        else { st.ikZit = GLAD(LOOPT, ZITT, t); st.ikPose = st.ikZit < .5 ? 'staan' : 'zit'; }
        if (t > LOOPT - .4 && t < LOOPT + 1.4) st.pvPose = 'zwaai';
        if (t > .6 && !ui.onder) ui.onderschrift(o.kop, o.sub);
        if (t > LOOPT - .4 && !ui.wenk){ ui.wenk = true; ui.melding(`${esc(info.voorlichter)}, persvoorlichter: "Ga zitten, ze zijn er klaar voor."`); }
        if (t >= ZITT + 1.6){ q = -1; if (open.length){ q = open[0]; keuze = -1; handen.add(vrager()); naar('hand'); } else naar('opstaan'); }
        flitsKans = t > LOOPT ? 1.5 : .4;
      } else if (fase === 'hand'){
        shot('handOp'); st.pvPose = ft < 1 ? 'zwaai' : 'zit';
        laag.$('.cs-onder').classList.remove('aan'); // (anders staat het onderschrift voor de journalist met zijn hand omhoog)
        if (ft > 1.6){ ui.vraag(vragen[q], open.indexOf(q), open.length); shot('tafel'); naar('vraag'); }
      } else if (fase === 'vraag'){
        flitsKans = .3;
      } else if (fase === 'antwoord'){
        shot('jij');
        const s = vragen[q].opts[keuze].soort, snel = s === 'u' ? .18 : .3;
        if (ft < 2.2){ gebaar += dt; st.ikPose = Math.floor(gebaar / snel) % 2 ? 'praat1' : 'praat2'; }
        if (ft > 2.4){ ui.toonGevolg(); naar('gevolg'); }
      } else if (fase === 'gevolg'){
        if (ft > 1.2) shot('zaal');
        flitsKans *= Math.pow(.4, dt);
        const lees = Math.min(9, Math.max(4, (ui.gevolgLengte || 0) / 28));
        if (ft > lees) volgendeVraag();
      } else if (fase === 'opstaan'){
        shot('zaal'); handen.clear();
        st.ikZit = 1 - GLAD(0, .8, ft); st.ikPose = st.ikZit < .5 ? 'staan' : 'zit';
        if (ft > 1.4){ ui.slot(metersVoor, o.meters(), beantwoord); naar('slot'); }
      } else if (fase === 'slot'){
        st.ikZit = 0; st.ikPose = 'staan'; st.pvPose = 'staan'; flitsKans = 2;
        if (ft > 8) laag.sluit();
      }
      if (laag.weg) return;
      // fotografen
      if (Math.random() < dt * flitsKans){ flitsen = [zaal.fotografen[Math.floor(Math.random() * zaal.fotografen.length)]]; flitsTot = t + .25; laag.flits(); }
      if (t > flitsTot) flitsen = [];
      st.flits = flitsen;
      const beeld = zaal.teken(st), [x, y, w, h] = zetCamera(dt);
      g.drawImage(beeld, x, y, w, h, 0, 0, cv.width, cv.height);
    });
  } finally {
    laag.sluit();
  }
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
