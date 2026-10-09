import { S, bewaar } from '../core/state.js';
import { knop } from '../core/ui.js';
import { rnd } from '../core/utils.js';
import { rugnummer } from '../game/team/rugnummers.js';

/* ===================== 2,5D-veld: je acties in beeld ===================== */
// Een schuin veld (alsof je vanaf de tribune kijkt). De uitkomst wordt berekend zoals altijd; het veld laat zien wat er gebeurde.
// Coördinaten in meters: x 0-105 (wij spelen naar rechts), y 0-68 (0 = dichtbij), z = hoogte.
export const instel = () => S.instel || (S.instel = {anim:'normaal'});
export const PITCH_ZICHT = 30; // zoveel meter veld is op de voorste lijn in beeld
export const PITCH_KLEUR = {wij:'#c6f432', zij:'#e05252', K:'#9b6bd6', k:'#3fae6a', R:'#222'};
// Startopstelling per soort moment
export function pitchScene(type){
  const e = (id, x, y, rol) => ({id, x, y, z:0, rol});
  const L = {
    rand:     [e('J',84,30,'wij'), e('A',92,41,'wij'), e('B',79,49,'wij'), e('X',88,32,'zij'), e('Y',91,38,'zij'), e('Z',86,24,'zij'), e('K',104,34,'K')],
    laatsteMinuut:[e('J',76,34,'wij'), e('A',91,30,'wij'), e('B',89,41,'wij'), e('X',93,34,'zij'), e('Y',86,28,'zij'), e('Z',88,40,'zij'), e('K',104,34,'K')],
    eenOpEen: [e('J',90,33,'wij'), e('A',87,45,'wij'), e('X',83,36,'zij'), e('K',101,34,'K')],
    keeperFout:[e('J',95,32,'wij'), e('A',88,42,'wij'), e('X',90,28,'zij'), e('K',99,40,'K')],
    counter:  [e('J',55,34,'wij'), e('A',71,22,'wij'), e('B',72,47,'wij'), e('X',79,30,'zij'), e('Y',80,41,'zij'), e('K',104,34,'K')],
    diepteBal:[e('J',60,34,'wij'), e('A',73,26,'wij'), e('B',70,46,'wij'), e('X',79,29,'zij'), e('Y',79,40,'zij'), e('K',104,34,'K')],
    vrijeTrap:[e('J',78,34,'wij'), e('A',91,26,'wij'), e('B',92,42,'wij'), e('X',87,31.5,'zij'), e('Y',87,33,'zij'), e('Z',87,34.5,'zij'), e('K',103,35,'K')],
    corner:   [e('J',96,36,'wij'), e('A',104.3,67,'wij'), e('B',92,28,'wij'), e('X',97,33.5,'zij'), e('Y',94,38,'zij'), e('K',104,34,'K')],
    kopduel:  [e('J',82,34,'wij'), e('A',72,62,'wij'), e('B',90,40,'wij'), e('X',83,35.5,'zij'), e('Y',88,30,'zij'), e('K',104,34,'K')],
    volley:   [e('J',86,36,'wij'), e('A',79,60,'wij'), e('B',92,30,'wij'), e('X',88,31,'zij'), e('Y',90,40,'zij'), e('K',104,34,'K')],
    penalty:  [e('J',92,34,'wij'), e('A',86,42,'wij'), e('X',86,27,'zij'), e('Y',86,46,'zij'), e('K',104.6,34,'K')],
    verdedigen:[e('J',24,32,'wij'), e('A',20,42,'wij'), e('X',31,31,'zij'), e('Y',33,45,'zij'), e('k',1,34,'k')],
    verdCorner:[e('J',6,33,'wij'), e('A',8,41,'wij'), e('X',5.5,34.5,'zij'), e('Y',10,28,'zij'), e('Z',0.8,67,'zij'), e('k',1,34,'k')],
    tackle:   [e('J',46,36,'wij'), e('A',42,27,'wij'), e('X',51,34,'zij'), e('Y',58,42,'zij'), e('k',1,34,'k')],
    opbouw:   [e('J',20,34,'wij'), e('A',31,19,'wij'), e('B',32,49,'wij'), e('X',30,33,'zij'), e('Y',38,40,'zij'), e('k',1.5,34,'k')],
    provocatie:[e('J',60,34,'wij'), e('A',56,39,'wij'), e('X',61.6,34.8,'zij'), e('Y',65,29,'zij'), e('R',57,27,'R')],
    opstootje:[e('J',58,34,'wij'), e('A',61,37,'wij'), e('X',62,35,'zij'), e('Y',60,31,'zij'), e('R',55,27,'R')]
  };
  L.teamGoal = L.teamKans = [e('A',93,37,'wij'), e('B',88,58,'wij'), e('C',84,30,'wij'), e('J',78,45,'wij'), e('X',95,34.5,'zij'), e('Y',91,41,'zij'), e('K',104,34,'K')];
  L.tegenGoal = L.tegenKans = [e('X',12,31,'zij'), e('Y',17,58,'zij'), e('Z',21,38,'zij'), e('A',10,33.5,'wij'), e('B',14,41,'wij'), e('J',27,29,'wij'), e('k',1,34,'k')];
  L.shootout = [e('S',92.5,34,'wij'), e('J',84,44,'wij'), e('A',84,40,'wij'), e('X',84,28,'zij'), e('Y',84,24,'zij'), e('K',104.6,34,'K')];
  const lijst = (L[type] || L.rand).map(p => ({...p}));
  const ents = {}; lijst.forEach(p => ents[p.id] = p);
  // Waar ligt de bal aan het begin
  const bal = type === 'corner' ? {x:104.3, y:67, z:0} : type === 'verdCorner' ? {x:0.8, y:67, z:0} : type === 'kopduel' || type === 'volley' ? {x:ents.A.x, y:ents.A.y, z:0}
    : type === 'penalty' ? {x:94, y:34, z:0} : type === 'keeperFout' ? {x:97.5, y:35, z:0} : ['verdedigen', 'tackle'].includes(type) ? {x:ents.X.x, y:ents.X.y, z:0}
    : type === 'provocatie' || type === 'opstootje' ? {x:64, y:40, z:0} : type === 'shootout' ? {x:94, y:34, z:0} : /^tegen/.test(type) ? {x:ents.X.x + .8, y:ents.X.y, z:0} : /^team/.test(type) ? {x:ents.C.x + .8, y:ents.C.y, z:0} : {x:ents.J.x + .8, y:ents.J.y, z:0};
  const cam = /^tegen/.test(type) ? 18 : ['verdedigen', 'verdCorner'].includes(type) ? 18 : type === 'opbouw' ? 24 : type === 'tackle' ? 44 : ['counter', 'diepteBal'].includes(type) ? 68 : ['provocatie', 'opstootje'].includes(type) ? 60 : 87;
  return {ents, bal, cam};
}

// Wachtrij: jouw acties en wat anderen doen, in volgorde afgespeeld
export function animPush(M, a){
  a.id = Date.now() + '-' + (M.animN = (M.animN || 0) + 1); a.min = M.min;
  (M.animQ = M.animQ || []).push(a); if (M.animQ.length > 12) M.animQ.splice(0, M.animQ.length - 12);
  M.anim = a;
}
export const openAnims = M => (M && M.animQ || []).filter(a => !a.gezien);
// Strafschoppenserie: dezelfde kansen als voorheen, maar elke penalty wordt onthouden (voor het veld)
export function reeksStrafschoppen(kansJij, M){
  const lijst = []; let wij = 0, zij = 0;
  for (let i = 0; i < 5; i++){
    let r; if (i === 4 && kansJij !== null){ r = rnd() < kansJij; M.penJij = r; lijst.push({w:1, r, jij:1}); } else { r = rnd() < .76; lijst.push({w:1, r}); }
    if (r) wij++;
    const z = rnd() < .76; lijst.push({w:0, r:z}); if (z) zij++;
  }
  while (wij === zij){ const a = rnd() < .75, b = rnd() < .75; lijst.push({w:1, r:a}, {w:0, r:b}); if (a) wij++; if (b) zij++; }
  return {lijst, wij, zij};
}
// Goals en grote kansen van teamgenoten en tegenstanders (alleen als jij meespeelt of op de bank wacht om in te vallen)
export function animAnderen(M, e, v){
  if (!(M.rol === 'basis' || M.rol === 'invaller')) return;
  const t = v.t, kort = t.length > 70 ? t.slice(0, 67) + '...' : t;
  let soort = null, variant = 'combi', einde = null;
  if (e.type === 'us'){ soort = 'teamGoal'; variant = /kopt/.test(t) ? 'kop' : /strafschop/.test(t) ? 'pen' : /afstand/.test(t) ? 'afstand' : 'combi'; }
  else if (e.type === 'them'){ soort = 'tegenGoal'; variant = /kopt/.test(t) ? 'kop' : /fstandsschot|vrije trap/.test(t) ? 'afstand' : 'combi'; }
  else if (e.type === 'kansUs' && /paal|lijn|redt fantastisch|over de lat/.test(t)){ soort = 'teamKans'; variant = /Kopbal/.test(t) ? 'kop' : /afstand|krult/.test(t) ? 'afstand' : 'combi'; einde = /paal/.test(t) ? 'paal' : /lijn/.test(t) ? 'lijn' : /lat/.test(t) ? 'over' : 'redding'; }
  else if (e.type === 'kansThem' && /paal|lijn|vingertoppen|redt knap/.test(t)){ soort = 'tegenKans'; variant = /Kopbal/.test(t) ? 'kop' : 'combi'; einde = /paal/.test(t) ? 'paal' : /lijn/.test(t) ? 'lijn' : 'redding'; }
  if (soort) animPush(M, {soort, type:soort, variant, einde, onder:`${e.min}' · ${kort}`, anderen:true});
}

// Welke soort beweging hoort bij een keuze
export function animSoort(type, l){
  if (type === 'toespraak' || type === 'juichen') return null;
  if (type === 'provocatie' || type === 'opstootje') return 'duel';
  if (type === 'penalty') return 'penalty';
  if (type === 'verdCorner') return /Wegkoppen/.test(l) ? 'wegkop' : 'verdedig';
  if (/Omhaal|Volley|volley/.test(l)) return 'volley';
  if (/kop|Kop/.test(l)) return 'kop';
  if (/Sliding|Schone tackle|Keihard erin|Bal wegtikken|Vroeg doorstappen|Schouderduel|Tactische overtreding|shirt/.test(l)) return 'tackle';
  if (/Afstand houden|zijlijn|Blijven staan|Mandekking|Buitenspelval|Zone|Keeper laten komen|Keeper blokken/.test(l)) return 'verdedig';
  if (/Stiften|Chip|Panenka/.test(l)) return 'chip';
  if (/Schieten|schieten|Afstandsschot|Direct op doel|Onder de muur|Intikken|Hard erop|krullen|Hard in de zestien|Strak|Hard door/.test(l)) return 'schot';
  if (/Dribbel|dribbel|omspelen|Panna|Uitkappen|oprukken|Zelf de ruimte|Aannemen en draaien|borst|stuiteren|Wachten/.test(l)) return 'dribbel';
  if (/Lange bal|Voorzet|voorzet|Wisselen naar/.test(l)) return 'lang';
  if (/Terug naar|Rustig uitverdedigen|Veilig breed|Kort nemen|Teamgenoot laten nemen/.test(l)) return 'kort';
  return 'pass';
}
// Het script: een lijst stappen. Elke stap verplaatst spelers en/of de bal in d milliseconden
export function animScript(a){
  const sc = pitchScene(a.type), E = sc.ents, st = [], r = () => Math.random();
  const J = E.J, maat = E.A || E.B, tegen = E.X, K = E.K || E.k;
  const stap = (d, moves, bal, fx) => st.push({d, moves:moves || {}, bal, fx});
  const doelR = () => ({x:105.8, y:31 + r() * 6, z:.3 + r() * 1.7}), doelL = () => ({x:-.8, y:31 + r() * 6, z:.3 + r() * 1.5});
  const naast = () => r() < .5 ? {x:107, y:r() < .5 ? 28 : 40, z:.4 + r()} : {x:107, y:31 + r() * 6, z:3.3};
  const scoort = () => { const d = doelR(); stap(650, {K:{y: d.y > 34 ? 31 : 37, z:.4}}, {to:d, boog:.6}, 'goal'); };
  const tegengoal = () => { stap(700, {X:{x:20, y:33}}, {to:{x:20.5, y:33, z:0}, boog:0}); const d = doelL(); stap(600, {k:{y:d.y > 34 ? 31 : 37}}, {to:d, boog:.5}, 'tegen'); };
  const kaart = () => a.rood ? 'rood' : a.geel ? 'geel' : null;
  const c = a.soort;
  const juich = (wie, links) => { const hoek = links ? {x:3, y:62} : {x:102, y:62}; const mv = {[wie]:hoek}; ['A', 'B', 'C', 'J', 'Y', 'Z'].forEach(k => { if (k !== wie && E[k] && E[k].rol === E[wie].rol) mv[k] = {x:hoek.x + (links ? 3 : -3) + r() * 2, y:hoek.y - 2 - r() * 4}; }); stap(900, mv, null); };
  if (c === 'shootout'){
    let w = 0, z = 0;
    a.kicks.forEach(k => {
      const schutter = k.jij ? 'J' : 'S', hoek = r() < .5 ? 31.4 : 36.6;
      const reset = {S:{x:k.jij ? 86 : 92.5, y:k.jij ? 38 : 34, rol:k.w ? 'wij' : 'zij'}, K:{x:104.6, y:34, rol:k.w ? 'K' : 'k'}};
      if (k.jij) reset.J = {x:92.5, y:34}; else reset.J = {x:84, y:44};
      stap(1, reset, {to:{x:94, y:34, z:0}, boog:0});
      stap(320, {[schutter]:{x:93.4, y:34}}, null);
      if (k.r){ k.w ? w++ : z++; stap(480, {K:{y:hoek > 34 ? 31.5 : 36.5, z:.5}}, {to:{x:105.6, y:hoek, z:.3 + r() * 1.5}, boog:.3}, {t:`Raak! ${w}-${z}`, kl: k.w ? '#ffd84a' : '#ff9b9b', net:true, score:`${w}-${z}`}); }
      else stap(480, {K:{y:hoek, z:.5}}, {to:{x:104.4, y:hoek, z:.8}, boog:.3}, {t:`Gestopt! ${w}-${z}`, kl: k.w ? '#ff9b9b' : '#b9ff9c', score:`${w}-${z}`});
      stap(600, {[schutter]:{x:k.jij ? 96 : 95, y:k.r ? 30 : 37}}, null); // even kijken: juichen of balen
    });
    stap(300, {}, null, {t:a.winst ? 'Gewonnen!' : 'Uitgeschakeld', kl:a.winst ? '#ffd84a' : '#ff7b7b'});
    return {sc, st};
  }
  if (c === 'teamGoal' || c === 'teamKans' || c === 'tegenGoal' || c === 'tegenKans'){
    const wij = c.startsWith('team'), S1 = wij ? 'A' : 'X', AANG = wij ? (a.variant === 'kop' ? 'B' : 'C') : (a.variant === 'kop' ? 'Y' : 'Z'), KP = wij ? 'K' : 'k';
    const doel = () => wij ? doelR() : doelL(), lijnX = wij ? 104.6 : .4, paalY = r() < .5 ? 30.4 : 37.6;
    const sc1 = E[S1];
    if (a.variant === 'kop') stap(850, {[S1]:{x:sc1.x + (wij ? 1 : -1), y:34, z:.5}}, {to:{x:sc1.x + (wij ? 1 : -1), y:34, z:2.3}, boog:6, van:E[AANG]});
    else if (a.variant === 'afstand'){ const p0 = {x:wij ? 83 : 22, y:40}; stap(1, {[S1]:p0}, {to:{x:p0.x + (wij ? .8 : -.8), y:40, z:0}, boog:0}); stap(320, {[S1]:{x:p0.x + (wij ? 1 : -1)}}, null); }
    else if (a.variant === 'pen'){ stap(1, {[S1]:{x:92.5, y:34}}, {to:{x:94, y:34, z:0}, boog:0}); stap(320, {[S1]:{x:93.4}}, null); }
    else stap(650, {[S1]:{x:sc1.x + (wij ? 2 : -2), y:sc1.y + 1}, [AANG]:{x:E[AANG].x + (wij ? 2 : -2)}}, {to:{x:sc1.x + (wij ? 2.6 : -2.6), y:sc1.y + 1, z:0}, boog:.2, van:E[AANG]});
    const dive = d => ({[KP]:{y:d.y > 34 ? 31 : 37, z:.4}, [S1]:{z:0}});
    if (c === 'teamGoal' || c === 'tegenGoal'){ const d = doel(); stap(600, dive(d), {to:d, boog:a.variant === 'afstand' ? 1.2 : .4}, wij ? 'goal' : 'tegen'); juich(S1, !wij); }
    else if (a.einde === 'paal'){ stap(600, {[S1]:{z:0}}, {to:{x:wij ? 105 : 0, y:paalY, z:1.1}, boog:.5}, 'paal'); stap(450, {}, {to:{x:wij ? 98 : 7, y:paalY < 34 ? 27 : 41, z:0}, boog:1}); }
    else if (a.einde === 'lijn'){ const ly = 33 + r() * 2; stap(1, {[wij ? 'X' : 'A']:{x:lijnX, y:ly + 1.5}}, null); stap(600, {[wij ? 'X' : 'A']:{y:ly}, [S1]:{z:0}}, {to:{x:lijnX, y:ly, z:.4}, boog:.3}, 'lijn'); stap(400, {}, {to:{x:wij ? 96 : 9, y:ly + 8, z:0}, boog:1.5}); }
    else if (a.einde === 'over'){ stap(600, {[S1]:{z:0}}, {to:{x:wij ? 107 : -2, y:33 + r() * 2, z:3.3}, boog:.8}, 'over'); }
    else { const d = {x:wij ? 103.6 : 1.4, y:32 + r() * 4, z:.9}; stap(600, {[KP]:{x:d.x, y:d.y, z:.5}, [S1]:{z:0}}, {to:d, boog:.4}, wij ? 'redding' : 'onzeRedding'); }
    return {sc, st};
  }
  if (c === 'schot' || c === 'chip' || c === 'volley'){
    if (c === 'volley'){ const van = E.A || maat; stap(700, {J:{x:J.x + 1, y:J.y}}, {to:{x:J.x + .5, y:J.y, z:1.2}, boog:4, van}); }
    else stap(350, {J:{x:J.x + 1.2, y:J.y}}, {to:{x:J.x + 2, y:J.y, z:0}, boog:0});
    if (a.goal) scoort();
    else if (a.ok){ const d = {x:103.5, y:K.y + (r() - .5) * 3, z:.8}; stap(600, {K:{x:103.6, y:d.y, z:.5}}, {to:d, boog: c === 'chip' ? 3 : .5}, 'redding'); }
    else { const d = naast(); stap(650, {K:{y:K.y + (r() - .5) * 2}}, {to:d, boog: c === 'chip' ? 3.5 : .8}, d.z > 3 ? 'over' : 'naast'); }
  } else if (c === 'penalty'){
    stap(450, {J:{x:93.4, y:34}}, null);
    const hoek = r() < .5 ? 31.4 : 36.6;
    if (a.goal) stap(600, {K:{y: hoek > 34 ? 31.5 : 36.5, z:.6}}, {to:{x:105.6, y:hoek, z:.4 + r() * 1.6}, boog:.3}, 'goal');
    else if (a.ok || /Panenka/.test(a.label) || r() < .6) stap(600, {K:{y:hoek, z:.5}}, {to:{x:104.4, y:hoek, z:.8}, boog:.3}, 'redding');
    else stap(600, {K:{y: hoek > 34 ? 31.5 : 36.5, z:.6}}, {to:{x:107, y:hoek, z:3.2}, boog:.6}, 'over');
  } else if (c === 'pass' || c === 'kort' || c === 'lang'){
    const doelpos = c === 'kort' ? {x:maat.x - 3, y:maat.y} : {x:Math.min(98, maat.x + (c === 'lang' ? 7 : 5)), y:maat.y + (34 - maat.y) * .25};
    if (a.ok){
      stap(c === 'lang' ? 850 : 650, {A:doelpos, B:E.B ? {x:E.B.x + 3, y:E.B.y} : undefined, J:{x:J.x + 2, y:J.y}}, {to:{...doelpos, z: c === 'lang' ? .3 : 0}, boog: c === 'lang' ? 6 : .2, naar:'A'});
      if (a.goal){ // één-twee: de bal komt terug en jij schiet
        const terug = {x:Math.min(97, Math.max(J.x + 8, doelpos.x - 2)), y:J.y + (34 - J.y) * .5};
        stap(550, {J:terug}, {to:{...terug, z:0}, boog:.2});
        const d = doelR(); stap(600, {K:{y:d.y > 34 ? 31 : 37, z:.4}}, {to:d, boog:.4}, 'goal'); }
      else if (a.assist || a.team) scoort();
      else stap(500, {A:{x:doelpos.x + 4, y:doelpos.y + (34 - doelpos.y) * .2}}, {volg:'A'});
    } else {
      const mid = {x:(J.x + doelpos.x) / 2, y:(J.y + doelpos.y) / 2};
      stap(600, {X:mid, A:doelpos}, {to:{...mid, z:0}, boog: c === 'lang' ? 4 : .2}, 'onderschept');
      stap(500, {X:{x:mid.x - 8, y:mid.y}}, {volg:'X'});
      if (a.tegen) tegengoal();
    }
  } else if (c === 'dribbel'){
    if (a.ok){
      stap(450, {J:{x:J.x + 3, y:J.y + 2.5}, X:{x:J.x + 2, y:J.y - .5}}, {volg:'J'});
      stap(450, {J:{x:J.x + 7, y:J.y}, X:{x:J.x + 1.5, y:J.y - 1.5}}, {volg:'J'});
      if (a.goal || a.assist || a.team){ if (a.goal){ const d = doelR(); stap(600, {K:{y:d.y > 34 ? 31 : 37, z:.4}}, {to:d, boog:.4}, 'goal'); } else scoort(); }
    } else {
      stap(450, {J:{x:J.x + 2.5, y:J.y + 1.5}, X:{x:J.x + 2.6, y:J.y + 1.2}}, {volg:'J'});
      stap(450, {X:{x:J.x - 5, y:J.y + 1}}, {volg:'X'}, 'afgepakt');
      if (a.tegen) tegengoal();
    }
  } else if (c === 'kop' || c === 'wegkop'){
    const van = E.A && (a.type === 'corner' || a.type === 'kopduel') ? E.A : E.Z || E.A;
    stap(800, {J:{x:J.x + .5, y:J.y, z:.5}, X:{x:J.x + .8, y:J.y + .6, z:.3}}, {to:{x:J.x + .5, y:J.y, z:2.3}, boog:6, van});
    if (c === 'wegkop'){ stap(600, {J:{z:0}, X:{z:0}}, {to:{x:a.ok ? 30 : 9, y:a.ok ? 50 : 36, z:0}, boog:a.ok ? 5 : 1}, a.ok ? 'weg' : null); if (a.tegen) { stap(400, {X:{x:8, y:35}}, {to:{x:8, y:35, z:0}, boog:0}); const d = doelL(); stap(500, {k:{y:d.y > 34 ? 31 : 37}}, {to:d, boog:.4}, 'tegen'); } }
    else if (a.goal || a.team || a.assist) { const d = doelR(); stap(550, {J:{z:0}, X:{z:0}, K:{y:d.y > 34 ? 31 : 37, z:.5}}, {to:d, boog:.3}, 'goal'); }
    else if (a.ok) stap(550, {J:{z:0}, X:{z:0}, B:E.B ? {x:E.B.x + 2, y:E.B.y} : undefined}, {to:E.B ? {x:E.B.x + 2, y:E.B.y, z:0} : {x:103.5, y:34, z:1}, boog:1.2, naar:E.B ? 'B' : undefined}, E.B ? null : 'redding');
    else { const d = naast(); stap(550, {J:{z:0}, X:{z:0}}, {to:d, boog:.8}, d.z > 3 ? 'over' : 'naast'); }
  } else if (c === 'tackle' || c === 'verdedig'){
    const naarDoel = a.type === 'verdedigen' || a.type === 'tackle' ? {x:Math.max(8, tegen.x - 12), y:tegen.y + 1} : {x:tegen.x - 4, y:tegen.y};
    if (a.ok){
      stap(500, {X:{x:tegen.x - 3, y:tegen.y + .5}, J:{x:tegen.x - 3.3, y:tegen.y + .8, z: c === 'tackle' ? .05 : 0}}, {volg:'X'});
      stap(500, {J:{x:tegen.x - 1, y:tegen.y + 2, z:0}, X:{x:tegen.x - 2, y:tegen.y - .6}}, {to:{x:tegen.x - 6, y:tegen.y + 6, z:0}, boog:.8}, 'gewonnen');
    } else {
      stap(500, {X:{x:tegen.x - 3, y:tegen.y + .5}, J:{x:tegen.x - 2.6, y:tegen.y + 1.4}}, {volg:'X'});
      stap(600, {X:naarDoel, J:{x:tegen.x - 3.5, y:tegen.y + 2.2}}, {volg:'X'}, kaart() || 'langs');
      if (a.tegen){ const d = doelL(); stap(600, {k:{y:d.y > 34 ? 31 : 37}}, {to:d, boog:.5}, 'tegen'); }
    }
  } else if (c === 'duel'){
    stap(450, {J:{x:J.x + .6, y:J.y}, X:{x:J.x + 1.4, y:J.y + .3}}, null);
    if (kaart()) stap(600, {R:{x:J.x - 1, y:J.y - 2}, X:{x:J.x + 2.2, y:J.y + .8}}, null, kaart());
    else if (a.ok) stap(600, {J:{x:J.x - 4, y:J.y + 2}, A:{x:J.x - 2, y:J.y + 3}}, null, 'rustig');
    else stap(600, {J:{x:J.x + .3, y:J.y - .4}, X:{x:J.x + .9, y:J.y + .6}, R:{x:J.x - 1.5, y:J.y - 2}}, null);
  }
  // Juichen na een goal: de maker rent naar de hoekvlag, de rest erachteraan
  if (st.some(x => x.fx === 'goal')){ if (a.goal) juich('J'); else if (E.A) juich('A'); }
  return {sc, st};
}
// Projectie: schuin bovenaanzicht met perspectief. cam = welk stuk veld in het midden staat (70 meter breed in beeld)
export function proj(P, W, H, cam, x, y, z){
  const D = 60, s = D / (D + y), Yn = H * 1.25, Yf = H * .1, s68 = D / (D + 68), Yh = (Yf - Yn * s68) / (1 - s68);
  const kx = W / PITCH_ZICHT;
  return {x: W / 2 + (x - cam) * kx * s, y: Yh + (Yn - Yh) * s - (z || 0) * kx * 2.1 * s, s, k:kx * s};
}
export function tekenVeld(cv, toestand){
  const ctx = cv.getContext('2d'), W = cv.width / (cv._dpr || 1), H = cv.height / (cv._dpr || 1), cam = toestand.cam;
  ctx.save(); ctx.scale(cv._dpr || 1, cv._dpr || 1);
  const p = (x, y, z) => proj(null, W, H, cam, x, y, z);
  // tribune
  const g = ctx.createLinearGradient(0, 0, 0, H * .16); g.addColorStop(0, '#070b16'); g.addColorStop(1, '#141c33'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 140; i++){ const xx = (i * 97 % 1000) / 1000 * W, yy = ((i * 53) % 100) / 100 * H * .1 + 2; ctx.fillRect(xx, yy, 2, 2); }
  // gras met banen
  for (let i = 0; i < 14; i++){ const x0 = i * 7.5, x1 = x0 + 7.5, a = p(x0, 0), b = p(x1, 0), c = p(x1, 68), d = p(x0, 68);
    ctx.fillStyle = i % 2 ? '#2f7d3f' : '#358a46'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill(); }
  // lijnen
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.4;
  const lijn = pts => { ctx.beginPath(); pts.forEach(([x, y, z], i) => { const q = p(x, y, z || 0); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.stroke(); };
  lijn([[0, 0], [105, 0], [105, 68], [0, 68], [0, 0]]); lijn([[52.5, 0], [52.5, 68]]);
  lijn(Array.from({length:41}, (_, i) => [52.5 + 9.15 * Math.cos(i / 40 * Math.PI * 2), 34 + 9.15 * Math.sin(i / 40 * Math.PI * 2)]));
  for (const [x0, dx] of [[0, 1], [105, -1]]){
    lijn([[x0, 13.84], [x0 + dx * 16.5, 13.84], [x0 + dx * 16.5, 54.16], [x0, 54.16]]);
    lijn([[x0, 24.84], [x0 + dx * 5.5, 24.84], [x0 + dx * 5.5, 43.16], [x0, 43.16]]);
    const sp = p(x0 + dx * 11, 34); ctx.fillStyle = '#fff'; ctx.fillRect(sp.x - 1, sp.y - 1, 2, 2);
  }
  // doelen (met net dat bolt bij een goal)
  const bol = toestand.netBol || 0;
  for (const [x0, dx, kant] of [[0, -1, 'L'], [105, 1, 'R']]){
    const b = kant === toestand.netKant ? bol : 0;
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++){ const yy = 30.34 + i * 7.32 / 6; lijn([[x0, yy, 2.44], [x0 + dx * (1.6 + b), yy, 1.6], [x0 + dx * (1.6 + b), yy, 0]]); }
    for (let i = 0; i <= 4; i++){ const zz = i * 2.44 / 4; lijn([[x0 + dx * (1.6 + b), 30.34, zz], [x0 + dx * (1.6 + b), 37.66, zz]]); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2; lijn([[x0, 30.34, 0], [x0, 30.34, 2.44], [x0, 37.66, 2.44], [x0, 37.66, 0]]);
  }
  // spelers en bal, van achter naar voren
  const dingen = Object.values(toestand.ents).map(e => ({...e, soort:'speler'})).concat([{...toestand.bal, soort:'bal'}]).sort((a, b) => b.y - a.y);
  for (const d of dingen){
    const gnd = p(d.x, d.y, 0), k = gnd.k;
    if (gnd.x < -30 || gnd.x > W + 30) continue;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(gnd.x, gnd.y, (d.soort === 'bal' ? .45 : 1.1) * k * 1.6, (d.soort === 'bal' ? .18 : .4) * k * 1.6, 0, 0, Math.PI * 2); ctx.fill();
    if (d.soort === 'bal'){ const q = p(d.x, d.y, d.z || 0), rr = Math.max(2.2, .5 * k * 1.4); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q.x, q.y - rr, rr, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke(); continue; }
    const kl = PITCH_KLEUR[d.rol] || '#ccc', h = 1.85 * k * 2.1, q = p(d.x, d.y, d.z || 0), w = Math.max(5, .75 * k * 2.1);
    const voet = q.y, broek = voet - h * .38, shirt = voet - h * .8, hoofd = voet - h * .9;
    ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = Math.max(1.5, w * .22); ctx.beginPath(); ctx.moveTo(q.x - w * .22, broek); ctx.lineTo(q.x - w * .25, voet); ctx.moveTo(q.x + w * .22, broek); ctx.lineTo(q.x + w * .25, voet); ctx.stroke();
    ctx.fillStyle = d.rol === 'R' ? '#111' : '#222'; ctx.fillRect(q.x - w / 2, broek - h * .1, w, h * .12);
    ctx.fillStyle = kl; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(q.x - w / 2, shirt, w, broek - shirt, w * .25) : ctx.rect(q.x - w / 2, shirt, w, broek - shirt); ctx.fill();
    ctx.fillStyle = '#e8c39e'; ctx.beginPath(); ctx.arc(q.x, hoofd, Math.max(2.4, w * .32), 0, Math.PI * 2); ctx.fill();
    if (d.id === 'J'){ ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(gnd.x, gnd.y, 1.5 * k * 1.6, .55 * k * 1.6, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#111'; ctx.font = `bold ${Math.max(8, w * .55)}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.fillText(String(toestand.nr || ''), q.x, shirt + (broek - shirt) * .72); }
    if (toestand.kaart && d.id === (toestand.kaartOp || 'J')){ ctx.fillStyle = toestand.kaart === 'rood' ? '#e23b3b' : '#ffd400'; ctx.fillRect(q.x + w * .6, hoofd - h * .35, w * .5, w * .7); }
  }
  // onderschrift (wat er gebeurt)
  if (toestand.onder){ ctx.font = `600 ${Math.max(11, Math.round(W / 42))}px system-ui,sans-serif`; let t = toestand.onder; while (ctx.measureText(t).width > W - 24 && t.length > 8) t = t.slice(0, -4) + '...';
    const bh = Math.max(18, Math.round(W / 26)); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, H - bh, W, bh); ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(t, 10, H - bh * .3); }
  // tekst-effect
  if (toestand.tekst){ const t = toestand.tekst, f = toestand.tekstT || 1; ctx.globalAlpha = Math.min(1, f * 2); ctx.textAlign = 'center'; ctx.font = `900 ${Math.round(W / (t.length > 8 ? 11 : 7))}px system-ui,sans-serif`;
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t, W / 2, H * .45); ctx.fillStyle = toestand.tekstKleur || '#fff'; ctx.fillText(t, W / 2, H * .45); ctx.globalAlpha = 1; }
  ctx.restore();
}
export const FX = {paal:['Paal!', '#fff'], lijn:['Van de lijn!', '#fff'], onzeRedding:['Redding!', '#b9ff9c'], goal:['GOAL!', '#ffd84a'], tegen:['Tegengoal', '#ff7b7b'], redding:['Redding!', '#fff'], naast:['Naast!', '#fff'], over:['Over!', '#fff'], onderschept:['Onderschept', '#ff9b9b'], afgepakt:['Afgepakt', '#ff9b9b'],
  gewonnen:['Bal veroverd!', '#b9ff9c'], langs:['Hij is erlangs', '#ff9b9b'], weg:['Weggewerkt!', '#b9ff9c'], geel:['Gele kaart', '#ffd400'], rood:['Rode kaart!', '#ff5a5a'], rustig:['Rustig gebleven', '#b9ff9c']};
export let PITCH = null; // lopende animatie
export function pitchCanvas(el){
  const cv = el.querySelector('canvas'), b = Math.round(Math.min(el.clientWidth || 600, Math.max(320, window.innerHeight * .48 / .52))), dpr = Math.min(2, window.devicePixelRatio || 1), h = Math.round(b * .52);
  cv.style.width = b + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(b * dpr); cv.height = Math.round(h * dpr); cv._dpr = dpr; return cv;
}
export function pitchStatisch(el, type){
  const cv = pitchCanvas(el), sc = pitchScene(type);
  tekenVeld(cv, {ents:sc.ents, bal:sc.bal, cam:sc.cam, nr:rugnummerVeilig()});
}
export const rugnummerVeilig = () => { try { return S.M && (S.M.inter || S.M.o23) ? '' : rugnummer(); } catch (e){ return ''; } };
export function pitchSpeel(el, a, klaar){
  const cv = pitchCanvas(el), {sc, st} = animScript(a), snel = instel().anim === 'snel' ? .5 : 1;
  const T = {ents:sc.ents, bal:{...sc.bal}, cam:sc.cam, nr:rugnummerVeilig(), onder:a.onder || (a.soort === 'shootout' ? 'Strafschoppen' : null)};
  let i = -1, t0 = 0, van = null, fx = null, fxT = 0, eind = 0;
  const id = (PITCH = {stop:false, klaar});
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const begin = (nu) => {
    i++; t0 = nu;
    if (i >= st.length){ eind = nu; return; }
    const s = st[i]; van = {ents:{}, bal:{...T.bal}};
    for (const k in s.moves){ if (s.moves[k] && T.ents[k]){ if (s.moves[k].rol) T.ents[k].rol = s.moves[k].rol; van.ents[k] = {...T.ents[k]}; } }
    if (s.d <= 1){ T.tekst = null; T.netBol = 0; T.netKant = null; fx = null; }
    if (s.bal && s.bal.van){ T.bal = {x:s.bal.van.x, y:s.bal.van.y, z:0}; van.bal = {...T.bal}; }
  };
  const frame = (nu) => {
    if (id.stop || !cv.isConnected){ return; }
    if (i === -1) begin(nu);
    if (i < st.length){
      const s = st[i], d = s.d * snel, t = Math.min(1, (nu - t0) / d), e = ease(t);
      for (const k in s.moves){ const m = s.moves[k], a0 = van.ents[k]; if (!m || !a0) continue; const p = T.ents[k];
        p.x = a0.x + ((m.x ?? a0.x) - a0.x) * e; p.y = a0.y + ((m.y ?? a0.y) - a0.y) * e; p.z = (a0.z || 0) + ((m.z ?? (a0.z || 0)) - (a0.z || 0)) * e; }
      if (s.bal){ if (s.bal.volg){ const p = T.ents[s.bal.volg]; T.bal = {x:p.x + .8, y:p.y, z:0}; }
        else if (s.bal.to){ const b0 = van.bal, b1 = s.bal.to; T.bal = {x:b0.x + (b1.x - b0.x) * t, y:b0.y + (b1.y - b0.y) * t, z:(b0.z || 0) + ((b1.z || 0) - (b0.z || 0)) * t + (s.bal.boog || 0) * 4 * t * (1 - t)}; } }
      // camera volgt de bal rustig
      T.cam += (Math.max(18, Math.min(87, T.bal.x)) - T.cam) * .06;
      if (t >= 1){ if (s.fx){ fx = s.fx; fxT = nu; if (s.fx === 'goal' || s.fx === 'tegen' || s.fx.net){ T.netKant = s.fx === 'tegen' ? 'L' : 'R'; } if (s.fx === 'geel' || s.fx === 'rood'){ T.kaart = s.fx; } } begin(nu); }
    }
    if (fx){ const [txt, kl] = typeof fx === 'object' ? [fx.t, fx.kl] : FX[fx] || [fx, '#fff']; if (fx.score) T.onder = `Strafschoppen · ${fx.score} (${S.M && S.M.wij || 'wij'} - ${S.M && S.M.zij || 'zij'})`; T.tekst = txt; T.tekstKleur = kl; T.tekstT = Math.min(1, (nu - fxT) / 400); T.netBol = T.netKant ? Math.max(0, .9 - (nu - fxT) / 900) : 0; }
    tekenVeld(cv, T);
    if (i >= st.length && nu - eind > (fx ? (a.soort === 'shootout' ? 1400 : 900) : 300) * snel){ PITCH = null; klaar(); return; }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
export function vPitch(){
  const M = S.M; if (!M) return '';
  const open = openAnims(M), nieuwAnim = open.length && instel().anim !== 'uit';
  if (!nieuwAnim && (!M.pending || ['toespraak', 'juichen'].includes(M.pending.type))) return '';
  if (instel().anim === 'uit' && !M.pending) return '';
  const zet = v => knop(v === 'normaal' ? 'Normaal' : v === 'snel' ? 'Snel' : 'Uit', () => { instel().anim = v; if (v === 'uit') openAnims(M).forEach(a => a.gezien = true); }, instel().anim === v ? 'klein aan' : 'klein', 'data-blijf');
  return `<div id="pitch25" class="pitch25"><canvas aria-label="Het veld van bovenaf, schuin gezien"></canvas>
    <div class="rij pitchknop" style="gap:6px;align-items:center;flex-wrap:wrap"><span class="muted klein-tekst">Animatie:</span>${zet('normaal')}${zet('snel')}${zet('uit')}${nieuwAnim ? knop(open.length > 1 ? `Overslaan (${open.length}) ⏭` : 'Overslaan ⏭', () => { openAnims(M).forEach(a => a.gezien = true); }, 'klein', 'data-blijf id="pitchSkip"') : ''}</div></div>`;
}
// Na elke weergave: het veld tekenen of de wachtrij met animaties afspelen
export function pitchNaRender(){
  if (PITCH){ PITCH.stop = true; PITCH = null; }
  const el = document.getElementById('pitch25'); if (!el || !S || !S.M) return;
  const M = S.M, keuzes = document.querySelector('#veld .keuzes'), knoppen = document.querySelector('#veld > .hoofd:last-of-type');
  const toon = t => t && !['toespraak', 'juichen'].includes(t);
  if (instel().anim === 'uit'){ openAnims(M).forEach(a => a.gezien = true); if (M.pending && toon(M.pending.type)) pitchStatisch(el, M.pending.type); return; }
  const open = openAnims(M);
  if (open.length){
    if (keuzes) keuzes.style.visibility = 'hidden';
    const speel = i => pitchSpeel(el, open[i], () => {
      open[i].gezien = true; try { bewaar(); } catch (e){}
      const sk = document.getElementById('pitchSkip'); if (sk) sk.textContent = open.length - i - 1 > 1 ? `Overslaan (${open.length - i - 1}) ⏭` : 'Overslaan ⏭';
      if (i + 1 < open.length && el.isConnected) return speel(i + 1);
      if (keuzes) keuzes.style.visibility = ''; if (sk) sk.remove();
      if (S.M && S.M.pending && el.isConnected && toon(S.M.pending.type)) pitchStatisch(el, S.M.pending.type);
    });
    speel(0);
  } else if (M.pending && toon(M.pending.type)) pitchStatisch(el, M.pending.type);
}
