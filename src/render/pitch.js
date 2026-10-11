import { S, bewaar } from '../core/state.js';
import { knop } from '../core/ui.js';
import { rnd } from '../core/utils.js';
import { rugnummer } from '../game/team/rugnummers.js';
import { clubTenue, landTenue, wedstrijdTenues } from '../data/tenues.js';

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
    verdedigen:[e('J',24,32,'wij'), e('A',20,42,'wij'), e('X',31,31,'zij'), e('Y',33,45,'zij'), e('k',1,34,'k'), e('R',30,21,'R')],
    verdCorner:[e('J',6,33,'wij'), e('A',8,41,'wij'), e('X',5.5,34.5,'zij'), e('Y',10,28,'zij'), e('Z',0.8,67,'zij'), e('k',1,34,'k'), e('R',15,22,'R')],
    tackle:   [e('J',46,36,'wij'), e('A',42,27,'wij'), e('X',51,34,'zij'), e('Y',58,42,'zij'), e('k',1,34,'k'), e('R',41,23,'R')],
    // rust: het team in een kring in de middencirkel, jij in het midden
    toespraak:[e('J',52.5,34,'wij'), ...['A','B','C','D','F','G'].map((k, i) => e(k, 52.5 + Math.cos(i / 6 * Math.PI * 2) * 2.4, 34 + Math.sin(i / 6 * Math.PI * 2) * 2.4, 'wij'))],
    // net gescoord tegen je oude club: jij voor hun doel, je oude fans op de tribune
    juichen:  [e('J',97,38,'wij'), e('A',92,34,'wij'), e('B',93,45,'wij'), e('C',89,40,'wij'), e('X',95,30,'zij'), e('R',85,47,'R')],
    opbouw:   [e('J',20,34,'wij'), e('A',31,19,'wij'), e('B',32,49,'wij'), e('X',30,33,'zij'), e('Y',38,40,'zij'), e('k',1.5,34,'k')],
    provocatie:[e('J',60,34,'wij'), e('A',56,39,'wij'), e('X',61.6,34.8,'zij'), e('Y',65,29,'zij'), e('R',57,27,'R')],
    opstootje:[e('J',58,34,'wij'), e('A',61,37,'wij'), e('X',62,35,'zij'), e('Y',60,31,'zij'), e('R',55,27,'R')]
  };
  L.teamGoal = L.teamKans = [e('A',93,37,'wij'), e('B',88,58,'wij'), e('C',84,30,'wij'), e('J',78,45,'wij'), e('X',95,34.5,'zij'), e('Y',91,41,'zij'), e('K',104,34,'K')];
  L.tegenGoal = L.tegenKans = [e('X',12,31,'zij'), e('Y',17,58,'zij'), e('Z',21,38,'zij'), e('A',10,33.5,'wij'), e('B',14,41,'wij'), e('J',27,29,'wij'), e('k',1,34,'k')];
  L.shootout = [e('S',92.5,34,'wij'), e('J',84,44,'wij'), e('A',84,40,'wij'), e('X',84,28,'zij'), e('Y',84,24,'zij'), e('K',104.6,34,'K')];
  const lijst = (L[type] || L.rand).map(p => ({...p}));
  const ents = {}; lijst.forEach(p => ents[p.id] = p);
  // Beide keepers staan altijd in hun doel: ook bij een tegengoal na balverlies of een schot vanaf eigen helft
  if (!ents.K) ents.K = e('K', 104, 34, 'K');
  if (!ents.k) ents.k = e('k', 1, 34, 'k');
  // Waar ligt de bal aan het begin
  const bal = type === 'corner' ? {x:104.3, y:67, z:0} : type === 'verdCorner' ? {x:0.8, y:67, z:0} : type === 'kopduel' || type === 'volley' ? {x:ents.A.x, y:ents.A.y, z:0}
    : type === 'penalty' ? {x:94, y:34, z:0} : type === 'keeperFout' ? {x:97.5, y:35, z:0} : ['verdedigen', 'tackle'].includes(type) ? {x:ents.X.x, y:ents.X.y, z:0}
    : type === 'provocatie' || type === 'opstootje' ? {x:64, y:40, z:0} : type === 'toespraak' ? {x:56, y:30, z:0} : type === 'juichen' ? {x:105.4, y:34, z:.2} : type === 'shootout' ? {x:94, y:34, z:0} : /^tegen/.test(type) ? {x:ents.X.x + .8, y:ents.X.y, z:0} : /^team/.test(type) ? {x:ents.C.x + .8, y:ents.C.y, z:0} : {x:ents.J.x + .8, y:ents.J.y, z:0};
  const cam = /^tegen/.test(type) ? 18 : ['verdedigen', 'verdCorner'].includes(type) ? 18 : type === 'opbouw' ? 24 : type === 'tackle' ? 44 : ['counter', 'diepteBal'].includes(type) ? 68 : ['provocatie', 'opstootje'].includes(type) ? 60 : type === 'toespraak' ? 52.5 : 87;
  // Duels, tackles, juichen en de toespraak gebeuren op een paar meter: daar zoomt de camera verder in, op de plek van de actie
  const dichtbij = ['provocatie', 'opstootje', 'tackle', 'verdedigen', 'juichen', 'toespraak'].includes(type);
  return {ents, bal, cam, zoom:dichtbij ? .6 : type === 'penalty' || type === 'shootout' ? .8 : 1, camY:dichtbij && ents.J ? ents.J.y : 34};
}

// Wachtrij: jouw acties en wat anderen doen, in volgorde afgespeeld
export function animPush(M, a){
  // Minuut en stand van dit moment: het scorebord laat die zien zolang de actie wordt afgespeeld
  a.id = Date.now() + '-' + (M.animN = (M.animN || 0) + 1); a.min = M.min; a.stand = M.thuis ? `${M.us}-${M.them}` : `${M.them}-${M.us}`;
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
  // Als invaller zie je op het veld pas wat er gebeurt nadat je erin bent gekomen
  if (!(M.rol === 'basis' || (M.rol === 'invaller' && M.ev.slice(0, M.idx).some(x => x.type === 'inval')))) return;
  const t = v.t, kort = t.length > 70 ? t.slice(0, 67) + '...' : t;
  let soort = null, variant = 'combi', einde = null;
  if (e.type === 'us'){ soort = 'teamGoal'; variant = /kopt/.test(t) ? 'kop' : /strafschop/.test(t) ? 'pen' : /afstand/.test(t) ? 'afstand' : 'combi'; }
  else if (e.type === 'them'){ soort = 'tegenGoal'; variant = /kopt/.test(t) ? 'kop' : /fstandsschot|vrije trap/.test(t) ? 'afstand' : 'combi'; }
  else if (e.type === 'kansUs' && /paal|lijn|redt fantastisch|over de lat/.test(t)){ soort = 'teamKans'; variant = /Kopbal/.test(t) ? 'kop' : /afstand|krult/.test(t) ? 'afstand' : 'combi'; einde = /paal/.test(t) ? 'paal' : /lijn/.test(t) ? 'lijn' : /lat/.test(t) ? 'over' : 'redding'; }
  else if (e.type === 'kansThem' && /paal|lijn|vingertoppen|redt knap/.test(t)){ soort = 'tegenKans'; variant = /Kopbal/.test(t) ? 'kop' : 'combi'; einde = /paal/.test(t) ? 'paal' : /lijn/.test(t) ? 'lijn' : 'redding'; }
  if (soort) animPush(M, {soort, type:soort, variant, einde, onder:`${e.min}' · ${kort}`, anderen:true});
}

// Elke keuze in een wedstrijd heeft een eigen animatie: [soort, variant]. 'type|label' gaat voor als hetzelfde label bij een ander moment iets anders betekent
export const ANIM_KEUZE = {
  'Niet juichen, uit respect':['juich', 'respect'], 'Uitbundig juichen voor het oude vak':['juich', 'wild'], '"Ssst"-gebaar naar het oude vak':['juich', 'ssst'],
  'Schieten':['schot', 'normaal'], 'Steekpass':['pass', 'steek'], 'Dribbelen':['dribbel', 'normaal'], 'Eén-twee spelen':['pass', 'eentwee'], 'Breed op de opkomende back':['pass', 'breed'], 'Schijnbeweging en krullen':['schot', 'krul'], 'Hakje':['pass', 'hak'],
  'Hard schieten':['schot', 'normaal'], 'Keeper omspelen':['dribbel', 'omspelen'], 'Stiften':['chip', 'normaal'], 'Breed leggen voor open doel':['pass', 'breed'], 'Panna door de benen':['dribbel', 'panna'], 'Wachten tot hij gaat liggen':['chip', 'wachten'],
  'Lange bal op de spits':['lang', 'normaal'], 'Zelf oprukken':['dribbel', 'oprukken'], 'Veilig breed':['kort', 'normaal'], 'Diepe bal in de loop':['pass', 'steek'], 'Bal doorlaten met hakje':['dribbel', 'doorlaten'], 'Wisselen naar de andere kant':['lang', 'wissel'],
  'Direct op doel':['vrij', 'direct'], 'Voorzet':['vrij', 'voorzet'], 'Kort nemen':['vrij', 'kort'], 'Onder de muur door':['vrij', 'onder'], 'Teamgenoot laten nemen':['vrij', 'teamgenoot'],
  'Koppen op doel':['kop', 'doel'], 'Terugkoppen':['kop', 'terug'], 'Keeper blokken':['verdedig', 'blok'], 'Omhaal':['volley', 'omhaal'], 'Eerste paal doorkoppen':['kop', 'door'],
  'Strak in de hoek':['penalty', 'hoek'], 'Hard door het midden':['penalty', 'midden'], 'Panenka':['penalty', 'panenka'], 'Hoog in de kruising':['penalty', 'kruising'], 'Aanloop met stopje':['penalty', 'stopje'],
  'Sliding':['tackle', 'sliding'], 'Afstand houden':['verdedig', 'afstand'], 'Vroeg doorstappen':['tackle', 'steek'], 'Naar de zijlijn dwingen':['verdedig', 'zijlijn'], 'Schouderduel':['tackle', 'schouder'], 'Tactische overtreding':['tackle', 'tactisch'],
  'Wegkoppen':['wegkop', 'normaal'], 'Mandekking vasthouden':['verdedig', 'mandekking'], 'Buitenspelval zetten':['verdedig', 'buitenspel'], 'Zone verdedigen':['verdedig', 'zone'], 'Keeper laten komen':['verdedig', 'keeper'],
  'Doorkoppen naar teamgenoot':['kop', 'door'], 'Op de borst aannemen':['dribbel', 'borst'], 'kopduel|Wegkoppen':['kop', 'weg'], 'Volley in één keer':['volley', 'normaal'], 'Laten stuiteren':['dribbel', 'stuiter'],
  'Volley op doel':['volley', 'normaal'], 'Aannemen en draaien':['dribbel', 'draai'], 'Terug naar achteren':['pass', 'terug'], 'Hard in de zestien schieten':['schot', 'normaal'],
  'Steekbal over de grond':['pass', 'steek'], 'Chip over de verdediging':['pass', 'chip'], 'Zelf de ruimte in':['dribbel', 'oprukken'], 'Wachten op een beter moment':['pass', 'wachten'],
  'Rustig uitverdedigen':['kort', 'normaal'], 'Lange bal naar voren':['lang', 'normaal'], 'Uitkappen en dribbelen':['dribbel', 'uitkappen'], 'Terug naar de keeper':['pass', 'keeper'],
  'Rustig blijven':['duel', 'kalm'], 'Terugduwen':['duel', 'duw'], 'Lachen en weglopen':['duel', 'lach'], 'Melden bij de scheids':['duel', 'scheids'],
  'Schone tackle':['tackle', 'steek'], 'Keihard erin':['tackle', 'hard'], 'Bal wegtikken':['tackle', 'tik'], 'Blijven staan':['verdedig', 'afstand'], 'Aan zijn shirt trekken':['tackle', 'shirt'],
  'Rustig weglopen':['duel', 'weg'], 'Teamgenoot wegtrekken':['duel', 'wegtrekken'], 'Neus tegen neus gaan staan':['duel', 'neus'], 'Protesteren bij de scheids':['duel', 'protest'],
  'Iedereen motiveren':['toespraak', 'klap'], 'Fel zijn en iedereen wakker schudden':['toespraak', 'fel'], 'Rustig blijven, het plan volgen':['toespraak', 'rustig'],
  'Intikken':['schot', 'normaal'], 'Hard erop':['schot', 'normaal'], 'Breed op een teamgenoot':['pass', 'breed'],
  'Afstandsschot':['schot', 'afstand'], 'Lange bal de zestien in':['pass', 'zestien'], 'Dribbelen de zestien in':['dribbel', 'normaal'], 'Voorzet op de keeper die mee is':['pass', 'keeperkop']
};
const keuze = (type, l) => ANIM_KEUZE[type + '|' + l] || ANIM_KEUZE[l] || null;
// Welke soort beweging hoort bij een keuze (vangnet voor nieuwe keuzes die nog niet in de tabel staan)
export function animSoort(type, l){
  const k = keuze(type, l); if (k) return k[0];
  if (type === 'toespraak') return 'toespraak';
  if (type === 'juichen') return 'juich';
  if (type === 'provocatie' || type === 'opstootje') return 'duel';
  if (type === 'penalty') return 'penalty';
  if (type === 'verdCorner') return /Wegkoppen/.test(l) ? 'wegkop' : 'verdedig';
  if (/Omhaal|Volley|volley/.test(l)) return 'volley';
  if (/kop|Kop/.test(l)) return 'kop';
  if (/Sliding|tackle|Keihard erin|wegtikken|doorstappen|Schouderduel|overtreding|shirt/.test(l)) return 'tackle';
  if (/Afstand houden|zijlijn|Blijven staan|Mandekking|Buitenspelval|Zone|Keeper laten komen|Keeper blokken/.test(l)) return 'verdedig';
  if (/Stiften|Chip|Panenka/.test(l)) return 'chip';
  if (/Schieten|schieten|Afstandsschot|Direct op doel|Onder de muur|Intikken|Hard erop|krullen|Strak|Hard door/.test(l)) return 'schot';
  if (/Dribbel|dribbel|omspelen|Panna|Uitkappen|oprukken|ruimte|Aannemen|borst|stuiteren|Wachten/.test(l)) return 'dribbel';
  if (/Lange bal|Voorzet|voorzet|Wisselen naar/.test(l)) return 'lang';
  if (/Terug naar|Rustig uitverdedigen|Veilig breed|Kort nemen|Teamgenoot laten nemen/.test(l)) return 'kort';
  return 'pass';
}
export const animVariant = (type, l) => { const k = keuze(type, l); return k ? k[1] : 'normaal'; };
// Houdingen die een speler in een stap kan aannemen (veld3d tekent ze; 2D negeert ze)
export const POSES = ['duw', 'struikel', 'val', 'sliding', 'steek', 'schouder', 'trek', 'borst', 'kopstoot', 'lach', 'roep', 'kalm', 'wijs', 'protest', 'wuif', 'kaart', 'sorry', 'kniel', 'ssst', 'juich', 'klap', 'praat', 'vang', 'blok', 'omhaal', 'volley', 'spreid', 'jockey'];
// Het script: een lijst stappen. Elke stap verplaatst spelers en/of de bal in d milliseconden.
// moves: {id:{x, y, z, pose, rol}}  ·  bal: {to, boog, krul, trap, van} of {volg}  ·  fx: tekst-effect aan het eind van de stap
export function animScript(a){
  const sc = pitchScene(a.type), E = sc.ents, st = [], r = () => Math.random();
  const J = E.J, maat = E.A || E.B, tegen = E.X, K = E.K || E.k, v = a.variant || 'normaal';
  // waar staat iedereen na de vorige stap (zodat een volgende stap daarop kan voortbouwen)
  const cur = {}; for (const k in E) cur[k] = {x:E[k].x, y:E[k].y};
  const stap = (d, moves, bal, fx) => { moves = moves || {}; for (const k in moves){ const m = moves[k]; if (m && cur[k]){ if (m.x !== undefined) cur[k].x = m.x; if (m.y !== undefined) cur[k].y = m.y; } } st.push({d, moves, bal, fx}); };
  const doelR = () => ({x:105.8, y:31 + r() * 6, z:.3 + r() * 1.7}), doelL = () => ({x:-.8, y:31 + r() * 6, z:.3 + r() * 1.5});
  const naast = () => r() < .5 ? {x:107, y:r() < .5 ? 28 : 40, z:.4 + r()} : {x:107, y:31 + r() * 6, z:3.3};
  const scoort = () => { const d = doelR(); stap(650, {K:{y: d.y > 34 ? 31 : 37, z:.4}}, {to:d, boog:.6}, 'goal'); };
  const tegengoal = () => { stap(700, {X:{x:20, y:33, pose:null}}, {to:{x:20.5, y:33, z:0}, boog:0}); const d = doelL(); stap(600, {k:{y:d.y > 34 ? 31 : 37, z:.4}}, {to:d, boog:.5}, 'tegen'); };
  const naastL = () => stap(600, {}, {to:{x:-2, y:r() < .5 ? 28 : 40, z:.6}, boog:.6}, 'naast');
  const kaart = () => a.rood ? 'rood' : a.geel ? 'geel' : null;
  // De scheids komt erbij en geeft de kaart aan wie de overtreding maakte
  const kaartStap = (wie = 'J') => { const k = kaart(); if (!k) return false; const p = cur[wie] || cur.J; stap(800, {R: E.R ? {x:p.x - 1.3, y:p.y - 1.7, pose:'kaart'} : undefined, [wie]:{pose:'sorry'}}, null, k); return true; };
  const c = a.soort;
  const juich = (wie, links) => { if (!E[wie]) return; const hoek = links ? {x:3, y:62} : {x:102, y:62}; const mv = {[wie]:{...hoek, pose:'juich'}}; ['A', 'B', 'C', 'J', 'Y', 'Z'].forEach(k => { if (k !== wie && E[k] && E[k].rol === E[wie].rol) mv[k] = {x:hoek.x + (links ? 3 : -3) + r() * 2, y:hoek.y - 2 - r() * 4, pose:'juich'}; }); stap(900, mv, null); };
  if (c === 'shootout'){
    let w = 0, z = 0;
    a.kicks.forEach(k => {
      const schutter = k.jij ? 'J' : 'S', hoek = r() < .5 ? 31.4 : 36.6;
      const reset = {S:{x:k.jij ? 86 : 92.5, y:k.jij ? 38 : 34, rol:k.w ? 'wij' : 'zij', pose:null}, K:{x:104.6, y:34, rol:k.w ? 'K' : 'k'}};
      if (k.jij) reset.J = {x:92.5, y:34, pose:null}; else reset.J = {x:84, y:44, pose:null};
      stap(1, reset, {to:{x:94, y:34, z:0}, boog:0});
      stap(320, {[schutter]:{x:93.4, y:34}}, null);
      if (k.r){ k.w ? w++ : z++; stap(480, {K:{y:hoek > 34 ? 31.5 : 36.5, z:.5}}, {to:{x:105.6, y:hoek, z:.3 + r() * 1.5}, boog:.3}, {t:`Raak! ${w}-${z}`, kl: k.w ? '#ffd84a' : '#ff9b9b', net:true, score:`${w}-${z}`}); }
      else stap(480, {K:{y:hoek, z:.5}}, {to:{x:104.4, y:hoek, z:.8}, boog:.3}, {t:`Gestopt! ${w}-${z}`, kl: k.w ? '#ff9b9b' : '#b9ff9c', score:`${w}-${z}`});
      stap(600, {[schutter]:{x:k.jij ? 96 : 95, y:k.r ? 30 : 37, pose: k.r === !!k.w ? 'juich' : 'sorry'}}, null); // even kijken: juichen of balen
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
    if (c === 'teamGoal' || c === 'tegenGoal'){ const d = doel(); stap(600, dive(d), {to:d, boog:a.variant === 'afstand' ? 1.2 : .4, krul:a.variant === 'afstand' ? (r() < .5 ? 2 : -2) : 0}, wij ? 'goal' : 'tegen'); juich(S1, !wij); }
    else if (a.einde === 'paal'){ stap(600, {[S1]:{z:0}}, {to:{x:wij ? 105 : 0, y:paalY, z:1.1}, boog:.5}, 'paal'); stap(450, {}, {to:{x:wij ? 98 : 7, y:paalY < 34 ? 27 : 41, z:0}, boog:1}); }
    else if (a.einde === 'lijn'){ const ly = 33 + r() * 2; stap(1, {[wij ? 'X' : 'A']:{x:lijnX, y:ly + 1.5}}, null); stap(600, {[wij ? 'X' : 'A']:{y:ly}, [S1]:{z:0}}, {to:{x:lijnX, y:ly, z:.4}, boog:.3}, 'lijn'); stap(400, {}, {to:{x:wij ? 96 : 9, y:ly + 8, z:0}, boog:1.5}); }
    else if (a.einde === 'over'){ stap(600, {[S1]:{z:0}}, {to:{x:wij ? 107 : -2, y:33 + r() * 2, z:3.3}, boog:.8}, 'over'); }
    else { const d = {x:wij ? 103.6 : 1.4, y:32 + r() * 4, z:.9}; stap(600, {[KP]:{x:d.x, y:d.y, z:.5}, [S1]:{z:0}}, {to:d, boog:.4}, wij ? 'redding' : 'onzeRedding'); }
    return {sc, st};
  }
  // ===== Juichen na een goal tegen je oude club =====
  if (c === 'juich'){
    if (v === 'respect'){ stap(450, {J:{pose:'sorry'}}, null); stap(1100, {J:{x:J.x - 5, y:J.y - 1}, A:{x:J.x - 4.3, y:J.y - 2, pose:'kalm'}, B:{x:J.x - 4.6, y:J.y + .5}}, null, 'respect'); stap(500, {J:{pose:'kalm'}}, null); }
    else if (v === 'wild'){
      stap(1000, {J:{x:100.5, y:62.5, pose:'juich'}}, null);
      stap(500, {J:{x:102, y:64.5, pose:'kniel'}}, null, 'feest');
      stap(800, {A:{x:101, y:63.2, pose:'juich'}, B:{x:103.2, y:63.6, pose:'juich'}, C:{x:101.8, y:62.4, pose:'juich'}}, null);
      if (a.geel) stap(800, {R:{x:99.6, y:61.4, pose:'kaart'}, J:{pose:'sorry'}}, null, 'geel');
    } else {
      stap(1000, {J:{x:J.x - 2, y:62.5, pose:null}}, null);
      stap(1000, {J:{pose:'ssst'}}, null, 'ssst');
      if (a.geel) stap(800, {R:{x:cur.J.x - 1.4, y:cur.J.y - 1.6, pose:'kaart'}, J:{pose:'sorry'}}, null, 'geel');
    }
    return {sc, st};
  }
  // ===== Toespraak in de rust: het team in een kring =====
  if (c === 'toespraak'){
    const kring = ['A', 'B', 'C', 'D', 'F', 'G'].filter(k => E[k]);
    const alle = (pose, extra) => Object.fromEntries(kring.map((k, i) => [k, {pose, ...(extra ? extra(k, i) : {})}]));
    stap(1300, {J:{pose: v === 'klap' ? 'klap' : v === 'fel' ? 'wijs' : 'praat'}}, null);
    if (a.ok){
      stap(900, {...alle(v === 'rustig' ? 'kalm' : 'klap'), J:{pose:'klap'}}, null, 'klaar');
      stap(1000, {...alle(null, (k, i) => ({x:52.5 + Math.cos(i * 1.05) * 11, y:34 + Math.sin(i * 1.05) * 9})), J:{x:57, y:30, pose:null}}, null);
    } else if (v === 'fel'){ stap(900, {A:{x:E.A.x - 3, y:E.A.y + 2, pose:'roep'}, B:{pose:'kalm'}, J:{pose:'protest'}}, null); }
    else stap(1000, {...alle('kalm'), J:{pose:'kalm'}}, null);
    return {sc, st};
  }
  // ===== Duels: duwen, weglopen, naar de scheids =====
  if (c === 'duel'){
    const X = E.X, Rf = E.R || {x:J.x - 3, y:J.y - 6};
    if (v === 'duw'){
      stap(380, {J:{x:X.x - 1.1, y:X.y - .2}}, null);
      stap(320, {J:{x:X.x - .7, pose:'duw'}, X:{x:X.x + 1.6, y:X.y + .4, pose: a.rood ? 'val' : 'struikel'}}, null, 'geduwd');
      if (!kaartStap('J')) stap(700, {J:{x:X.x - 2.5, pose:null}, X:{pose:'roep'}}, null);
    } else if (v === 'neus'){
      stap(500, {J:{x:X.x - .6, y:X.y, pose:'borst'}, X:{pose:'borst'}}, null);
      if (a.rood){ stap(280, {J:{x:X.x - .35, pose:'kopstoot'}, X:{x:X.x + 1.3, pose:'val'}}, null); kaartStap('J'); }
      else if (a.geel){ stap(450, {J:{pose:'kopstoot'}, X:{pose:'kopstoot'}}, null); kaartStap('J'); }
      else stap(900, {R:E.R ? {x:X.x - .3, y:X.y - 1.3, pose:'wuif'} : undefined, J:{x:X.x - 2.6, pose:null}, X:{x:X.x + 2, pose:null}}, null, 'rustig');
    } else if (v === 'lach' || v === 'weg'){
      stap(450, {X:{x:J.x + .9, pose:'roep'}, J:{pose: v === 'lach' ? 'lach' : 'kalm'}}, null);
      stap(1000, {J:{x:J.x - 6, y:J.y + 2.5}, X:{x:J.x - 1, y:J.y + .6, pose:'roep'}}, null, a.ok ? 'weggelopen' : null);
      if (a.ok && v === 'lach' && E.R) stap(800, {R:{x:cur.X.x - 1.3, y:cur.X.y - 1.6, pose:'kaart'}, X:{pose:'sorry'}}, null, 'geel');
    } else if (v === 'scheids' || v === 'protest'){
      stap(800, {J:{x:Rf.x + 1.3, y:Rf.y + .9, pose:null}}, null);
      stap(800, {J:{pose: v === 'scheids' ? 'wijs' : 'protest'}}, null);
      if (a.geel) kaartStap('J');
      else if (a.ok && (v === 'scheids' || r() < .6)) stap(800, {R:E.R ? {pose:'kaart'} : undefined, J:{pose:'kalm'}}, null, 'geel');
      else stap(800, {R:E.R ? {pose:'wuif'} : undefined, J:{pose:'protest'}}, null);
    } else if (v === 'wegtrekken'){
      stap(420, {A:{x:X.x - .7, y:X.y + .5, pose:'duw'}, X:{pose:'duw'}}, null);
      stap(450, {J:{x:X.x - 1.4, y:X.y + 1.1, pose:'trek'}}, null);
      stap(900, {J:{x:X.x - 5, y:X.y + 4}, A:{x:X.x - 4.4, y:X.y + 4.5, pose:null}, X:{pose:'roep'}}, null, a.ok ? 'rustig' : null);
      kaartStap('J');
    } else { // rustig blijven
      stap(400, {X:{x:J.x + .8, pose:'duw'}}, null);
      stap(450, {J:{x:J.x - .5, pose:'kalm'}, X:{pose:'roep'}}, null);
      if (!kaartStap('J')) stap(800, {X:{x:X.x + 3, y:X.y + 2, pose:null}}, null, a.ok ? 'rustig' : null);
    }
    return {sc, st};
  }
  // ===== Tackles: sliding, staand, schouder, shirt, overtreding =====
  if (c === 'tackle'){
    stap(420, {X:{x:tegen.x - 2.2, y:tegen.y + .3}, J:{x:J.x + 1.5, y:J.y - .5, pose:'jockey'}}, {volg:'X'});
    const xx = cur.X.x, xy = cur.X.y, langs = () => { stap(500, {X:{x:xx - 8, y:xy, pose:null}, J:{pose:null}}, {volg:'X'}, 'langs'); if (a.tegen) tegengoal(); };
    if (v === 'sliding' || v === 'hard'){
      stap(260, {J:{x:xx - 2.6, y:xy + 1, pose:'sliding'}}, {volg:'X'});
      if (a.ok){ stap(400, {J:{x:xx - 1, y:xy + .4}, X:{x:xx - 1.6, pose: v === 'hard' ? 'val' : 'struikel'}}, {to:{x:xx - 4, y:xy + 7, z:0}, boog:.6, trap:'geen'}, 'gewonnen'); stap(600, {J:{pose:null}}, null); }
      else { stap(400, {J:{x:xx - 1.2, y:xy + .5}, X:{x:xx - 3.6, y:xy - .4, pose: kaart() ? 'val' : null}}, {volg:'X'}); if (!kaartStap('J')) langs(); }
    } else if (v === 'steek' || v === 'tik'){
      stap(300, {J:{x:xx - 1.6, y:xy + .6, pose:null}}, {volg:'X'});
      if (a.ok){ stap(280, {J:{pose:'steek'}}, {to:{x:xx - 3, y:xy + 4.5, z:0}, boog:.2, trap:'geen'}, 'gewonnen'); stap(500, {J:{x:xx - 3.4, y:xy + 4}, X:{pose:'struikel'}}, {volg:'J'}); }
      else { stap(320, {J:{pose:'steek'}, X:{x:xx - 2.8, y:xy - .6, pose: kaart() ? 'val' : null}}, {volg:'X'}); if (!kaartStap('J')) langs(); }
    } else if (v === 'schouder'){
      stap(380, {J:{x:xx - 1, y:xy + .85, pose:null}, X:{x:xx - 1.3}}, {volg:'X'});
      stap(320, {J:{x:xx - 2, y:xy + .55, pose:'schouder'}, X:{x:xx - 2.3, y:xy - .05, pose:'schouder'}}, {volg:'X'});
      if (a.ok) stap(500, {J:{x:xx - 4.2, y:xy + .4, pose:null}, X:{x:xx - 2.8, y:xy - 1.7, pose:'struikel'}}, {volg:'J'}, 'gewonnen');
      else { stap(500, {J:{x:xx - 2.6, y:xy + 2, pose:'struikel'}, X:{x:xx - 7, y:xy, pose:null}}, {volg:'X'}, 'langs'); if (a.tegen) tegengoal(); }
    } else { // shirt of tactische overtreding
      stap(380, {X:{x:xx - 3}, J:{x:xx - 2.2, y:xy + .7, pose:null}}, {volg:'X'});
      if (v === 'tactisch'){ stap(380, {J:{x:xx - 3.1, pose:'steek'}, X:{x:xx - 4.4, pose:'val'}}, {to:{x:xx - 6.5, y:xy, z:0}, boog:0, trap:'geen'}, 'overtreding'); kaartStap('J'); }
      else {
        stap(480, {J:{x:xx - 3.3, pose:'trek'}, X:{x:xx - 4, pose:'struikel'}}, {volg:'X'});
        if (a.geel){ stap(350, {X:{pose:'val'}, J:{pose:null}}, null, a.ok ? null : 'overtreding'); kaartStap('J'); }
        else stap(450, {X:{pose:null}, J:{pose:null}}, {to:{x:xx - 6, y:xy + 3, z:0}, boog:.3, trap:'geen'}, 'gewonnen');
      }
    }
    return {sc, st};
  }
  // ===== Verdedigen zonder tackle =====
  if (c === 'verdedig'){
    const X = E.X;
    if (v === 'afstand'){
      stap(700, {X:{x:X.x - 4, y:X.y + .5}, J:{x:J.x - 1.8, y:X.y + .4, pose:'jockey'}}, {volg:'X'});
      if (a.ok){ const zy = cur.X.y < 34 ? -1.5 : 69.5; stap(700, {X:{x:cur.X.x - 2, y:cur.X.y + (zy < 0 ? -6 : 6)}, J:{x:cur.J.x - 1.5, y:cur.J.y + (zy < 0 ? -5.5 : 5.5)}}, {volg:'X'}); stap(700, {J:{pose:'steek'}}, {to:{x:cur.X.x - 1, y:zy, z:0}, boog:.3, trap:'geen'}, 'uit'); stap(400, {J:{pose:null}}, null); }
      else { stap(550, {X:{x:cur.J.x - 2, y:cur.J.y + 2.8}, J:{pose:'struikel'}}, {volg:'X'}, 'langs'); stap(300, {J:{pose:null}}, null); if (a.tegen) tegengoal(); else naastL(); }
    } else if (v === 'zijlijn'){
      const zy = X.y < 34 ? 3 : 65, kant = zy < 34 ? 1 : -1;
      stap(900, {X:{x:X.x - 7, y:zy + kant * 1.5}, J:{x:X.x - 6.2, y:zy + kant * 3, pose:'jockey'}}, {volg:'X'});
      if (a.ok){ stap(500, {J:{pose:'steek'}}, {to:{x:cur.X.x - 2, y:zy < 34 ? -1.5 : 69.5, z:0}, boog:.2, trap:'geen'}, 'uit'); stap(400, {J:{pose:null}}, null); }
      else { stap(600, {X:{x:cur.X.x - 5}, J:{pose:null}}, {volg:'X'}); stap(850, {}, {to:{x:6, y:34, z:1.6}, boog:4, trap:'binnenkant'});
        if (a.tegen){ const d = doelL(); stap(500, {Y:{x:6.6, y:34, z:.4}, k:{y:d.y > 34 ? 31 : 37, z:.4}}, {to:d, boog:.3}, 'tegen'); }
        else stap(500, {k:{x:4, y:34, z:.45, pose:'vang'}}, {to:{x:4, y:34, z:1.8}, boog:.4}, 'gevangen'); }
    } else if (v === 'mandekking' || v === 'zone'){
      const dw = v === 'zone' ? {x:J.x + .3, y:J.y} : {x:X.x + .3, y:X.y};
      const sprong = v === 'zone' ? {J:{z:a.ok ? .45 : .2}, Y:{x:J.x + .9, y:J.y - .6, z:a.ok ? .25 : .5}} : {J:{x:X.x + .5, y:X.y - .4, z:a.ok ? .45 : .2, pose:'trek'}, X:{z:a.ok ? .2 : .5}};
      stap(950, sprong, {to:{...dw, z:2.3}, boog:6, van:E.Z});
      const terug = {J:{z:0, pose:null}, X:{z:0}, Y:{z:0}};
      if (a.ok) stap(550, terug, {to:{x:24, y:44, z:0}, boog:4}, 'weg');
      else if (a.tegen){ const d = doelL(); stap(500, {...terug, k:{y:d.y > 34 ? 31 : 37, z:.4}}, {to:d, boog:.3}, 'tegen'); }
      else stap(550, {...terug, k:{x:1.6, y:34, z:.45, pose:'vang'}}, {to:{x:1.6, y:34, z:1.5}, boog:.3}, 'gevangen');
      kaartStap('J');
    } else if (v === 'buitenspel'){
      stap(650, {J:{x:J.x + 5}, A:{x:E.A.x + 5}, Y:{x:E.Y.x + 4}}, null);
      stap(900, {X:{x:X.x + 1}}, {to:{x:X.x + 1, y:X.y, z:0}, boog:5, van:E.Z}, a.ok ? 'buitenspel' : null);
      if (!a.ok){ if (a.tegen){ const d = doelL(); stap(500, {k:{y:d.y > 34 ? 31 : 37, z:.4}}, {to:d, boog:.3}, 'tegen'); } else stap(500, {k:{x:2, y:X.y, z:.35, pose:'vang'}}, {to:{x:2, y:X.y, z:.6}, boog:.2}, 'gevangen'); }
    } else if (v === 'keeper'){
      stap(950, {k:{x:5, y:34.5, z:a.ok ? .55 : .3, pose:'vang'}, J:{x:J.x + .6, pose:'wijs'}}, {to:{x:5, y:34.5, z:a.ok ? 2.4 : 2}, boog:6, van:E.Z}, a.ok ? 'gevangen' : null);
      if (a.ok) stap(500, {k:{z:0}, J:{pose:null}}, null);
      else { stap(320, {k:{x:5.6, z:0, pose:'val'}, J:{x:5.8, pose:'val'}}, {to:{x:6.5, y:36, z:0}, boog:.5});
        if (a.tegen) stap(500, {X:{x:6.8, y:36.2}}, {to:{x:-.8, y:34, z:.3}, boog:.1}, 'tegen'); else stap(500, {}, {to:{x:-1.5, y:44, z:0}, boog:.2}, 'uit'); }
    } else if (v === 'blok'){
      stap(700, {J:{x:103, y:34.6, pose:'blok'}}, null);
      stap(900, {B:{x:100, y:33, z:.45}}, {to:{x:100.3, y:33, z:2.3}, boog:6, van:E.A});
      if (a.team){ const d = doelR(); stap(550, {B:{z:0}, K:{y:d.y > 34 ? 31 : 37, z:.3}}, {to:d, boog:.3}, 'goal'); }
      else if (a.ok) stap(550, {B:{z:0}}, {to:naast(), boog:.6}, 'naast');
      else stap(600, {J:{pose:'val'}, B:{z:0}}, {to:{x:103, y:30, z:0}, boog:.8}, 'overtreding');
    } else { // algemeen verdedigen
      stap(600, {X:{x:X.x - 3}, J:{x:X.x - 4, pose:'jockey'}}, {volg:'X'});
      if (a.ok) stap(500, {J:{pose:'steek'}}, {to:{x:cur.X.x - 5, y:cur.X.y + 5, z:0}, boog:.5, trap:'geen'}, 'gewonnen'); else { stap(500, {X:{x:cur.X.x - 7}, J:{pose:null}}, {volg:'X'}, 'langs'); if (a.tegen) tegengoal(); }
    }
    return {sc, st};
  }
  // ===== Vrije trap =====
  if (c === 'vrij'){
    const muur = z => ({X:{z}, Y:{z}, Z:{z}});
    if (v === 'teamgenoot'){
      stap(650, {A:{x:J.x - .4, y:J.y + 1.2}, J:{x:J.x - 1.5, y:J.y - 2}}, null);
      stap(300, {A:{x:J.x + .1, y:J.y + .3}}, null);
      if (a.team){ stap(220, muur(.35), null); const d = {x:105.8, y:r() < .5 ? 30.9 : 37.1, z:1.9}; stap(800, {...muur(0), K:{y:d.y > 34 ? 36.5 : 31.5, z:.55}}, {to:d, boog:2, krul:d.y > 34 ? 2.5 : -2.5, trap:'binnenkant'}, 'goal'); juich('A'); }
      else stap(650, muur(0), a.ok ? {to:{x:87.3, y:33.5, z:1}, boog:.4} : {to:{x:107, y:30, z:4}, boog:2}, a.ok ? 'geblokt' : 'over');
      return {sc, st};
    }
    stap(350, {J:{x:J.x + .4}}, null);
    if (v === 'direct'){
      stap(200, muur(.35), null);
      if (a.goal){ const d = {x:105.8, y:r() < .5 ? 30.9 : 37.1, z:2}; stap(800, {...muur(0), K:{y:d.y > 34 ? 36.5 : 31.5, z:.6}}, {to:d, boog:2.2, krul:d.y > 34 ? 3 : -3, trap:'binnenkant'}, 'goal'); }
      else if (r() < .5) stap(650, muur(0), {to:{x:87.2, y:33.5, z:1.4}, boog:.4, trap:'binnenkant'}, 'geblokt');
      else stap(800, muur(0), {to:{x:107, y:33, z:3.4}, boog:2, krul:2, trap:'binnenkant'}, 'over');
    } else if (v === 'onder'){
      stap(220, muur(.45), null);
      if (a.goal){ const d = {x:105.8, y:31 + r() * 6, z:.25}; stap(650, {...muur(0), K:{y:d.y > 34 ? 31 : 37, z:.3}}, {to:d, boog:0}, 'goal'); }
      else stap(500, muur(0), {to:{x:87.3, y:33.5, z:.1}, boog:0}, 'geblokt');
    } else if (v === 'voorzet'){
      stap(900, {B:{x:97, y:36, z:.45}}, {to:{x:97, y:36, z:2.3}, boog:5, trap:'binnenkant'});
      if (a.assist){ const d = doelR(); stap(500, {B:{z:0}, K:{y:d.y > 34 ? 31 : 37, z:.45}}, {to:d, boog:.3}, 'goal'); juich('B'); }
      else if (a.ok) stap(500, {B:{z:0}, K:{x:102.5, y:36, z:.5, pose:'vang'}}, {to:{x:102.5, y:36, z:1.8}, boog:.4}, 'gevangen');
      else stap(500, {B:{z:0}}, {to:{x:107, y:45, z:0}, boog:.6});
    } else { // kort nemen
      stap(450, {A:{x:J.x + 3, y:J.y - 3}}, {to:{x:J.x + 3, y:J.y - 3, z:0}, boog:.1, trap:'binnenkant'});
      if (a.ok) stap(550, {A:{x:J.x + 3.5, y:J.y - 2.5}, J:{x:J.x + 5, y:J.y + 1}}, {to:{x:J.x + 5.6, y:J.y + 1, z:0}, boog:.1, trap:'binnenkant'});
      else stap(500, {X:{x:J.x + 3.4, y:J.y - 3, pose:'steek'}}, {to:{x:J.x + 1, y:J.y - 6, z:0}, boog:.4, trap:'geen'}, 'onderschept');
    }
    return {sc, st};
  }
  // ===== Omhaal =====
  if (c === 'volley' && v === 'omhaal'){
    const van = E.A || maat;
    stap(650, {J:{x:J.x + .3}}, {to:{x:J.x + .2, y:J.y, z:1.9}, boog:4, van});
    stap(280, {J:{z:.85, pose:'omhaal'}}, {to:{x:J.x + .2, y:J.y, z:2}, boog:0, trap:'geen'});
    const d = a.goal ? doelR() : naast();
    stap(600, {J:{z:.15, pose:'val'}, K:a.goal ? {y:d.y > 34 ? 31 : 37, z:.4} : undefined}, {to:d, boog:.3}, a.goal ? 'goal' : d.z > 3 ? 'over' : 'naast');
    stap(500, {J:{z:0}}, null);
    if (a.goal) juich('J');
    else stap(400, {J:{pose:null}}, null);
    return {sc, st};
  }
  // ===== Schoten met een krul of van afstand =====
  if (c === 'schot' && (v === 'krul' || v === 'afstand')){
    if (v === 'krul'){ stap(280, {J:{x:J.x + .6, y:J.y + 1.3}}, {volg:'J'}); stap(260, {J:{x:J.x + 1.4, y:J.y + .4}}, {volg:'J'}); }
    else stap(380, {J:{x:J.x + 1.4}}, {volg:'J'});
    const krul = cur.J.y > 34 ? -3.5 : 3.5, hoek = cur.J.y > 34 ? 30.9 : 37.1;
    if (a.goal) stap(850, {K:{y:hoek > 34 ? 36.5 : 31.5, z:.55}}, {to:{x:105.8, y:hoek, z:1.6 + r() * .6}, boog:1.2, krul, trap:'binnenkant'}, 'goal');
    else if (a.ok) stap(850, {K:{x:103.6, y:hoek > 34 ? 36.4 : 31.6, z:.6}}, {to:{x:103.6, y:hoek > 34 ? 36.4 : 31.6, z:1.6}, boog:1, krul, trap:'binnenkant'}, 'redding');
    else stap(850, {}, {to:{x:107, y:hoek > 34 ? 40 : 28, z:1.5}, boog:1.4, krul, trap:'binnenkant'}, 'naast');
    if (a.goal) juich('J');
    return {sc, st};
  }
  // ===== Wachten tot de keeper gaat liggen =====
  if (c === 'chip' && v === 'wachten'){
    stap(500, {J:{x:J.x + 4, y:J.y + .5}, K:{x:K.x - 2.5}}, {volg:'J'});
    stap(600, {J:{x:cur.J.x + .8}, K:{x:cur.K.x - .5, pose:a.goal ? 'val' : null}}, {volg:'J'});
    if (a.goal){ stap(600, {}, {to:{x:105.6, y:cur.J.y + (34 - cur.J.y) * .5, z:.8}, boog:1.6, trap:'chip'}, 'goal'); juich('J'); }
    else stap(450, {X:{x:cur.J.x + .2, y:cur.J.y + .6, pose:'steek'}}, {to:{x:cur.J.x - 2, y:cur.J.y + 4, z:0}, boog:.3, trap:'geen'}, 'afgepakt');
    return {sc, st};
  }
  // ===== Dribbels met een eigen kunstje =====
  if (c === 'dribbel' && v !== 'normaal'){
    if (v === 'omspelen'){
      stap(450, {J:{x:J.x + 5, y:J.y + .5}, K:{x:K.x - 3}}, {volg:'J'});
      const kx = cur.K.x;
      if (a.goal){ stap(450, {K:{x:kx - .5, y:cur.J.y - 1.5, z:.45}, J:{x:kx + .5, y:cur.J.y + 2.6}}, {volg:'J'}); stap(500, {K:{z:0, pose:'val'}}, {to:{x:105.6, y:34 + r(), z:0}, boog:0, trap:'binnenkant'}, 'goal'); juich('J'); }
      else stap(450, {K:{x:cur.J.x + 1, y:cur.J.y, z:.4}}, {to:{x:cur.J.x + 1, y:cur.J.y, z:.2}, boog:.1, trap:'geen'}, 'redding');
    } else if (v === 'panna'){
      stap(450, {J:{x:J.x + 5}, K:{x:K.x - 3.5}}, {volg:'J'});
      const kp = {x:cur.K.x, y:cur.K.y};
      stap(280, {K:{pose:'spreid'}, J:{x:kp.x - 2}}, {volg:'J'});
      if (a.goal){ stap(380, {J:{x:kp.x - .6, y:kp.y + 1.3}}, {to:{x:kp.x + 1.4, y:kp.y, z:0}, boog:0, trap:'binnenkant'}); stap(450, {J:{x:kp.x + 1, y:kp.y + .6}, K:{pose:'val'}}, {to:{x:105.6, y:kp.y + .5, z:0}, boog:0}, 'goal'); juich('J'); }
      else stap(400, {K:{pose:null}}, {to:{x:kp.x, y:kp.y, z:0}, boog:0, trap:'binnenkant'}, 'redding');
    } else if (v === 'borst' || v === 'stuiter'){
      const van = E.A || E.B;
      if (v === 'borst') stap(850, {J:{pose:'borst', x:J.x + .3}}, {to:{x:J.x + .5, y:J.y, z:1.25}, boog:5, van});
      else { stap(800, {}, {to:{x:J.x + 2, y:J.y, z:0}, boog:5, van}); stap(380, {J:{x:J.x + .6}}, {to:{x:J.x + 1.1, y:J.y, z:0}, boog:1.1}); }
      if (a.ok){ stap(300, {J:{pose:null}}, {to:{x:cur.J.x + 1, y:cur.J.y, z:0}, boog:0, trap:'geen'}); stap(500, {J:{x:cur.J.x + 4, y:cur.J.y + 1.5}}, {volg:'J'}); }
      else { stap(450, {J:{pose:null}, X:{x:cur.J.x + 1.6, y:cur.J.y + .3}}, {to:{x:cur.J.x + 1.8, y:cur.J.y + .5, z:0}, boog:.6, trap:'geen'}, 'afgepakt'); stap(450, {X:{x:cur.J.x - 4}}, {volg:'X'}); }
    } else if (v === 'draai' || v === 'doorlaten'){
      const van = E.A || E.B;
      stap(700, {J:{x:J.x - .4}}, {to:{x:J.x + .5, y:J.y, z:v === 'draai' ? .3 : 0}, boog:2, van});
      if (a.ok){ stap(300, {J:{x:J.x + .2, y:J.y + 1}}, {to:{x:J.x + 1.2, y:J.y + 1.2, z:0}, boog:0, trap:v === 'doorlaten' ? 'hak' : 'geen'}); stap(600, {J:{x:J.x + 5, y:J.y + 2}}, {volg:'J'}); }
      else stap(450, {X:{x:J.x + 1.6, y:J.y + .5, pose:'steek'}}, {to:{x:J.x + 2.2, y:J.y + .8, z:0}, boog:.3, trap:'geen'}, 'afgepakt');
    } else if (v === 'uitkappen'){
      stap(450, {X:{x:J.x + 1.6, y:J.y + .3}}, null);
      if (a.ok){ stap(350, {J:{x:J.x + .4, y:J.y + 2.6}}, {volg:'J'}); stap(500, {J:{x:J.x + 4, y:J.y + 3.5}, X:{x:J.x + 1, pose:'struikel'}}, {volg:'J'}, 'uitgekapt'); }
      else { stap(400, {X:{x:J.x + .6, pose:'steek'}}, {to:{x:J.x - .5, y:J.y + .8, z:0}, boog:.1, trap:'geen'}, 'afgepakt'); stap(450, {X:{x:J.x - 4, pose:null}}, {volg:'X'}); if (a.tegen) tegengoal(); }
    } else { // oprukken
      stap(1100, {J:{x:J.x + 13, y:J.y + 1}}, {volg:'J'});
      if (!a.ok) stap(450, {X:{x:cur.J.x + 1, y:cur.J.y + .4, pose:'steek'}}, {to:{x:cur.J.x + 2, y:cur.J.y + 3, z:0}, boog:.2, trap:'geen'}, 'afgepakt');
      else stap(400, {X:{pose:'struikel'}}, {volg:'J'});
    }
    return {sc, st};
  }
  // ===== Passes met een eigen soort =====
  if ((c === 'pass' || c === 'kort' || c === 'lang') && ['breed', 'hak', 'chip', 'eentwee', 'keeper', 'wissel', 'zestien', 'keeperkop', 'wachten', 'terug'].includes(v)){
    let o = v === 'hak' || v === 'wissel' ? 'B' : v === 'keeper' || v === 'keeperkop' ? 'k' : 'A';
    if (!cur[o]) o = 'A';
    const p0 = cur[o]; let plek;
    if (v === 'breed') plek = {x:J.x + 1.5, y:J.y + (p0.y >= J.y ? 8 : -8)};
    else if (v === 'hak' || v === 'terug') plek = {x:J.x - 6, y:J.y + 2.5};
    else if (v === 'chip') plek = {x:Math.min(97, p0.x + 9), y:p0.y + (34 - p0.y) * .3};
    else if (v === 'eentwee') plek = {x:p0.x + 1, y:p0.y};
    else if (v === 'keeper') plek = {x:cur.k.x + 2, y:34};
    else if (v === 'wissel') plek = {x:Math.min(95, J.x + 10), y:J.y < 34 ? 60 : 8};
    else if (v === 'zestien') plek = {x:97, y:34 + (r() - .5) * 4};
    else if (v === 'keeperkop'){ stap(2, {k:{x:91, y:39}}, null); plek = {x:97, y:35.5}; }
    else plek = {x:p0.x - 2, y:p0.y}; // wachten
    if (v === 'wachten') stap(900, {J:{x:J.x + .5, pose:'jockey'}, X:{x:J.x + 2.4, y:J.y + .4}}, {volg:'J'});
    const lang = ['chip', 'wissel', 'zestien', 'keeperkop'].includes(v), trap = v === 'hak' ? 'hak' : v === 'chip' ? 'chip' : 'binnenkant';
    if (a.ok){
      stap(lang ? 900 : 650, {[o]:plek, J:{x:J.x + (v === 'eentwee' ? 6 : 1.5), y:J.y + (v === 'eentwee' ? (34 - J.y) * .3 : 0), pose:null}}, {to:{...plek, z:lang ? .4 : 0}, boog:lang ? 5 : .2, trap});
      if (v === 'eentwee'){ stap(500, {}, {to:{x:cur.J.x + .8, y:cur.J.y, z:0}, boog:.2, trap:'binnenkant'});
        if (a.goal){ const d = doelR(); stap(600, {K:{y:d.y > 34 ? 31 : 37, z:.4}}, {to:d, boog:.4}, 'goal'); juich('J'); } else stap(450, {J:{x:cur.J.x + 3}}, {volg:'J'}); }
      else if (a.assist || a.team || a.goal){
        if (lang){ const d = doelR(); stap(550, {[o]:{z:.45}, K:o === 'k' ? undefined : {y:d.y > 34 ? 31 : 37, z:.45}}, {to:d, boog:.3}, 'goal'); stap(300, {[o]:{z:0}}, null); }
        else scoort();
      } else stap(500, {[o]:{x:plek.x + (o === 'k' ? 0 : 3), y:plek.y + (34 - plek.y) * .1}}, o === 'k' ? null : {volg:o});
    } else {
      const mid = {x:(J.x + plek.x) / 2, y:(J.y + plek.y) / 2};
      stap(600, {X:mid, [o]:plek}, {to:{...mid, z:0}, boog:lang ? 4 : .2, trap}, 'onderschept');
      stap(500, {X:{x:mid.x - 8, y:mid.y}}, {volg:'X'});
      if (a.tegen) tegengoal();
    }
    if (st.some(x => x.fx === 'goal') && !st.some(x => x.moves && Object.values(x.moves).some(m => m && m.pose === 'juich'))) juich(o === 'k' ? 'J' : E[o] && E[o].rol === 'wij' ? o : 'J');
    return {sc, st};
  }
  // ===== Koppen: terug, door of weg =====
  if (c === 'kop' && (v === 'terug' || v === 'door' || v === 'weg')){
    const van = E.A && (a.type === 'corner' || a.type === 'kopduel') ? E.A : E.Z || E.A;
    stap(800, {J:{x:J.x + .5, y:J.y, z:.5}, X:{x:J.x + .8, y:J.y + .6, z:.3}}, {to:{x:J.x + .5, y:J.y, z:2.3}, boog:6, van});
    if (v === 'weg'){ stap(600, {J:{z:0}, X:{z:0}}, {to:{x:J.x - (a.ok ? 25 : 6), y:J.y + (a.ok ? 12 : 3), z:0}, boog:a.ok ? 6 : 1}, a.ok ? 'weg' : null); if (!a.ok) stap(450, {X:{x:cur.J.x - 6, y:cur.J.y + 3}}, {volg:'X'}); }
    else if (a.ok || a.assist){
      const plek = v === 'door' ? {x:Math.min(98, J.x + 9), y:J.y + (34 - J.y) * .4} : {x:J.x - 3, y:J.y + 3};
      stap(600, {J:{z:0}, X:{z:0}, B:{...plek}}, {to:{...plek, z:0}, boog:1.2});
      if (a.assist || a.team){ scoort(); juich('B'); } else stap(500, {B:{x:plek.x + 3}}, {volg:'B'});
    } else { stap(550, {J:{z:0}, X:{z:0}}, {to:{x:J.x + 3, y:J.y + 4, z:0}, boog:1}, 'onderschept'); stap(450, {X:{x:cur.J.x - 5}}, {volg:'X'}); }
    return {sc, st};
  }
  if (c === 'schot' || c === 'chip' || c === 'volley'){
    if (c === 'volley'){ const van = E.A || maat; stap(700, {J:{x:J.x + 1, y:J.y, pose:'volley'}}, {to:{x:J.x + .5, y:J.y, z:1.2}, boog:4, van}); }
    else stap(350, {J:{x:J.x + 1.2, y:J.y}}, {to:{x:J.x + 2, y:J.y, z:0}, boog:0, trap:'geen'});
    const trap = c === 'chip' ? 'chip' : c === 'volley' ? 'volley' : 'normaal';
    if (a.goal) { const d = doelR(); stap(650, {K:{y: d.y > 34 ? 31 : 37, z:.4}}, {to:d, boog: c === 'chip' ? 3 : .6, trap}, 'goal'); }
    else if (a.ok){ const d = {x:103.5, y:K.y + (r() - .5) * 3, z:.8}; stap(600, {K:{x:103.6, y:d.y, z:.5}}, {to:d, boog: c === 'chip' ? 3 : .5, trap}, 'redding'); }
    else { const d = naast(); stap(650, {K:{y:K.y + (r() - .5) * 2}}, {to:d, boog: c === 'chip' ? 3.5 : .8, trap}, d.z > 3 ? 'over' : 'naast'); }
  } else if (c === 'penalty'){
    const hoek = r() < .5 ? 31.4 : 36.6, kHoek = hoek > 34 ? 36.5 : 31.5, verkeerd = hoek > 34 ? 31.5 : 36.5;
    if (v === 'stopje'){ stap(300, {J:{x:93}}, null); stap(450, {J:{x:93.05}, K:{y:a.goal ? verkeerd : kHoek, z:.55}}, null); }
    else stap(450, {J:{x:93.4, y:34}}, null);
    let doel, boog = .3, duur = 600, km;
    if (v === 'midden'){ doel = {x:105.6, y:34 + (r() - .5), z:.5 + r()}; km = a.goal ? {y:verkeerd, z:.6} : {y:34, z:.2, pose:'vang'}; }
    else if (v === 'panenka'){ doel = {x:105.6, y:34, z:1.4}; boog = 1.8; duur = 1000; km = a.goal ? {y:verkeerd, z:.6} : {y:34, z:.3, pose:'vang'}; }
    else if (v === 'kruising'){ doel = {x:105.6, y:hoek > 34 ? 37.1 : 30.9, z:2.2}; km = {y:a.goal ? kHoek : hoek, z:.75}; }
    else { doel = {x:105.6, y:hoek, z:.4 + r() * 1.6}; km = {y:a.goal ? verkeerd : hoek, z:.6}; }
    const trap = v === 'panenka' ? 'chip' : 'normaal';
    if (a.goal) stap(duur, {K:km}, {to:doel, boog, trap}, 'goal');
    else if (a.ok || v === 'panenka' || v === 'midden' || r() < .6) stap(duur, {K:{...km, x:104.4, y:doel.y}}, {to:{x:104.4, y:doel.y, z:Math.min(doel.z, 1.6)}, boog, trap}, 'redding');
    else stap(600, {K:km}, {to:{x:107, y:hoek, z:3.2}, boog:.6, trap}, 'over');
  } else if (c === 'pass' || c === 'kort' || c === 'lang'){
    const doelpos = c === 'kort' ? {x:maat.x - 3, y:maat.y} : {x:Math.min(98, maat.x + (c === 'lang' ? 7 : 5)), y:maat.y + (34 - maat.y) * .25};
    if (a.ok){
      stap(c === 'lang' ? 850 : 650, {A:doelpos, B:E.B ? {x:E.B.x + 3, y:E.B.y} : undefined, J:{x:J.x + 2, y:J.y}}, {to:{...doelpos, z: c === 'lang' ? .3 : 0}, boog: c === 'lang' ? 6 : .2, trap:c === 'lang' ? 'normaal' : 'binnenkant'});
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
      stap(450, {J:{x:J.x + 7, y:J.y}, X:{x:J.x + 1.5, y:J.y - 1.5, pose:'struikel'}}, {volg:'J'});
      if (a.goal || a.assist || a.team){ if (a.goal){ const d = doelR(); stap(600, {K:{y:d.y > 34 ? 31 : 37, z:.4}, X:{pose:null}}, {to:d, boog:.4}, 'goal'); } else scoort(); }
    } else {
      stap(450, {J:{x:J.x + 2.5, y:J.y + 1.5}, X:{x:J.x + 2.6, y:J.y + 1.2}}, {volg:'J'});
      stap(450, {X:{x:J.x - 5, y:J.y + 1, pose:'steek'}}, {volg:'X'}, 'afgepakt');
      if (a.tegen) tegengoal();
    }
  } else if (c === 'kop' || c === 'wegkop'){
    const van = E.A && (a.type === 'corner' || a.type === 'kopduel') ? E.A : E.Z || E.A;
    stap(800, {J:{x:J.x + .5, y:J.y, z:.5}, X:{x:J.x + .8, y:J.y + .6, z:.3}}, {to:{x:J.x + .5, y:J.y, z:2.3}, boog:6, van});
    if (c === 'wegkop'){ stap(600, {J:{z:0}, X:{z:0}}, {to:{x:a.ok ? 30 : 9, y:a.ok ? 50 : 36, z:0}, boog:a.ok ? 5 : 1}, a.ok ? 'weg' : null); if (a.tegen) { stap(400, {X:{x:8, y:35}}, {to:{x:8, y:35, z:0}, boog:0}); const d = doelL(); stap(500, {k:{y:d.y > 34 ? 31 : 37}}, {to:d, boog:.4}, 'tegen'); } }
    else if (a.goal || a.team || a.assist) { const d = doelR(); stap(550, {J:{z:0}, X:{z:0}, K:{y:d.y > 34 ? 31 : 37, z:.5}}, {to:d, boog:.3}, 'goal'); }
    else if (a.ok) stap(550, {J:{z:0}, X:{z:0}, B:E.B ? {x:E.B.x + 2, y:E.B.y} : undefined}, {to:E.B ? {x:E.B.x + 2, y:E.B.y, z:0} : {x:103.5, y:34, z:1}, boog:1.2}, E.B ? null : 'redding');
    else { const d = naast(); stap(550, {J:{z:0}, X:{z:0}}, {to:d, boog:.8}, d.z > 3 ? 'over' : 'naast'); }
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
  if (!ctx) return; // dit canvas is van WebGL (kan alleen tijdens het wisselen gebeuren); de volgende weergave tekent weer goed
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
    const kl = kleurenVan(toestand)[d.rol] || '#ccc', h = 1.85 * k * 2.1, q = p(d.x, d.y, d.z || 0), w = Math.max(5, .75 * k * 2.1);
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
  gewonnen:['Bal veroverd!', '#b9ff9c'], langs:['Hij is erlangs', '#ff9b9b'], weg:['Weggewerkt!', '#b9ff9c'], geel:['Gele kaart', '#ffd400'], rood:['Rode kaart!', '#ff5a5a'], rustig:['Rustig gebleven', '#b9ff9c'],
  geduwd:['Geduwd!', '#ff9b9b'], overtreding:['Overtreding!', '#ffd400'], buitenspel:['Buitenspel!', '#b9ff9c'], weggelopen:['Weggelopen', '#b9ff9c'], klaar:['Klaar voor de 2e helft!', '#c6f432'], respect:['Respect', '#b9ff9c'], ssst:['Ssst…', '#ffd84a'], feest:['Feest!', '#ffd84a'], uit:['Bal uit', '#b9ff9c'], gevangen:['Gevangen!', '#b9ff9c'], geblokt:['Geblokt', '#ff9b9b'], uitgekapt:['Uitgekapt!', '#b9ff9c']};
export let PITCH = null; // lopende animatie
// Het 3D-veld wordt op de achtergrond geladen; tot het klaar is (of als WebGL niet werkt) tekenen we 2D
let V3 = null, GEN = 0;
if (typeof window !== 'undefined') import('./veld3d.js').then(m => { V3 = m; }).catch(e => console.warn('3D-veld kon niet laden', e));
export const is3D = () => !!(V3 && instel().veld !== '2d' && V3.beschikbaar());
// instel().kwaliteit = 'vast': de automatische kwaliteit nooit terugschakelen (altijd de echte spelers)
export const spelerModus = () => instel().spelers || (instel().kwaliteit === 'vast' ? 'echt' : 'auto');
function teken(cv, T, nu){ if (cv._3d && V3){ T.spelers = spelerModus(); V3.teken3D(T, nu, kleurenVan(T)); } else tekenVeld(cv, T); }
export function pitchCanvas(el){
  const b = Math.round(Math.min(el.clientWidth || 600, Math.max(320, window.innerHeight * .48 / .52))), dpr = Math.min(2, window.devicePixelRatio || 1), h = Math.round(b * .52);
  if (is3D()){ const c3 = V3.koppel3D(el, b, h, dpr); if (c3) return c3; }
  // 2D: een canvas met WebGL kan niet ook 2D tekenen. Hing hier nog het 3D-canvas (overgeschakeld naar 2D, of WebGL viel weg), dan een nieuw canvas
  let cv = el.querySelector('canvas');
  if (!cv || cv._3d){ const nw = document.createElement('canvas'); nw.setAttribute('aria-label', 'Het veld van bovenaf, schuin gezien'); if (cv) cv.replaceWith(nw); else (el.querySelector('.pitchvak') || el).prepend(nw); cv = nw;
    el.querySelectorAll('.pitchfx, .pitchonder').forEach(d => d.remove()); }
  cv._3d = false;
  cv.style.width = b + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(b * dpr); cv.height = Math.round(h * dpr); cv._dpr = dpr; return cv;
}
// Jouw keuzemoment: in 2D één plaatje, in 3D staan de spelers rustig te ademen tot je kiest
export function pitchStatisch(el, type){
  const cv = pitchCanvas(el), sc = pitchScene(type), T = {ents:sc.ents, bal:sc.bal, cam:sc.cam, zoom:sc.zoom, camY:sc.camY, nr:rugnummerVeilig(), ploegen:ploegen()};
  if (!cv._3d) return tekenVeld(cv, T);
  const id = (PITCH = {stop:false, klaar:() => {}}), gen = GEN; let vorige = 0;
  const frame = nu => {
    if (id.stop || gen !== GEN || !cv.isConnected) return;
    if (nu - vorige >= 33){ vorige = nu; teken(cv, T, nu); } // 30 beelden per seconde is genoeg voor stilstaan
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
// Welke clubs staan er op het veld, en wie ben jij (voor een vast uiterlijk in 3D; jouw uiterlijk wordt één keer gekozen en bewaard)
export function ploegen(){ const sp = S && S.sp; if (!sp) return {}; if (!sp.uitSleutel) sp.uitSleutel = Math.random().toString(36).slice(2, 10); return {wij:sp.club, zij:S.M ? S.M.opp : null, jij:sp.uitSleutel, jijUit:sp.uiterlijk || null, tenues:tenuesVanWedstrijd()}; }
// De tenues van deze wedstrijd: landen bij een interland, anders de clubs (bij een kleurconflict speelt de uitploeg in het uittenue)
export function tenuesVanWedstrijd(){
  const M = S && S.M, sp = S && S.sp; if (!M || !sp) return null;
  if (M.inter) return wedstrijdTenues(landTenue(M.inter.land), landTenue(M.zij), M.thuis !== false);
  const opp = M.opp ?? (M.eerste && M.eerste.opp);
  return wedstrijdTenues(clubTenue(sp.club), opp != null ? clubTenue(opp) : landTenue(''), M.thuis !== false);
}
// Shirtkleur per rol, voor het 2D-veld en de eenvoudige poppen
export const kleurenVan = T => { const t = T && T.ploegen && T.ploegen.tenues; if (!t) return PITCH_KLEUR; const k = {R:'#222'}; for (const r in t) k[r] = t[r].shirt; return k; };
export const rugnummerVeilig = () => { try { return S.M && (S.M.inter || S.M.o23) ? '' : rugnummer(); } catch (e){ return ''; } };
export function pitchSpeel(el, a, klaar){
  const cv = pitchCanvas(el), {sc, st} = animScript(a), snel = instel().anim === 'snel' ? .5 : 1;
  const T = {ents:sc.ents, bal:{...sc.bal}, cam:sc.cam, zoom:sc.zoom, camY:sc.camY, nr:rugnummerVeilig(), ploegen:ploegen(), onder:a.onder || (a.soort === 'shootout' ? 'Strafschoppen' : null)};
  let i = -1, t0 = 0, van = null, fx = null, fxT = 0, eind = 0, aanzet = 0;
  const id = (PITCH = {stop:false, klaar}), gen = GEN;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const begin = (nu) => {
    i++; t0 = nu;
    if (i >= st.length){ eind = nu; return; }
    const s = st[i]; van = {ents:{}, bal:{...T.bal}};
    for (const k in s.moves){ const m = s.moves[k]; if (m && T.ents[k]){ if (m.rol) T.ents[k].rol = m.rol; if ('pose' in m){ T.ents[k].pose = m.pose; T.ents[k].poseT0 = nu; } van.ents[k] = {...T.ents[k]}; } }
    if (s.d <= 1){ T.tekst = null; T.netBol = 0; T.netKant = null; fx = null; }
    if (s.bal && s.bal.van){ T.bal = {x:s.bal.van.x, y:s.bal.van.y, z:0}; van.bal = {...T.bal}; }
    // Vertrekt de bal bij een speler, dan trapt die speler hem weg (schot of pass)
    aanzet = 0;
    if (s.bal && s.bal.to && s.bal.trap !== 'geen'){ let best = null, bd = 2.6;
      for (const k in T.ents){ const p = T.ents[k], d = Math.hypot(p.x - T.bal.x, p.y - T.bal.y); if (d < bd && (p.z || 0) < .3){ bd = d; best = k; } }
      aanzet = best ? Math.min(220 * snel, s.d * snel * .45) : 0;
      if (best) T.trap = {id:best, soort:s.bal.trap || null, t0:nu, dur:aanzet / .4, kc:.4, hard:(s.bal.boog || 0) > 2 || Math.hypot(s.bal.to.x - T.bal.x, s.bal.to.y - T.bal.y) > 14 || s.bal.to.x > 103 || s.bal.to.x < 2}; }
  };
  const frame = (nu) => {
    if (id.stop || gen !== GEN || !cv.isConnected){ return; }
    if (i === -1) begin(nu);
    if (i < st.length){
      const s = st[i], d = s.d * snel, t = Math.min(1, (nu - t0) / d), e = ease(t);
      for (const k in s.moves){ const m = s.moves[k], a0 = van.ents[k]; if (!m || !a0) continue; const p = T.ents[k];
        p.x = a0.x + ((m.x ?? a0.x) - a0.x) * e; p.y = a0.y + ((m.y ?? a0.y) - a0.y) * e; p.z = (a0.z || 0) + ((m.z ?? (a0.z || 0)) - (a0.z || 0)) * e; }
      if (s.bal){ if (s.bal.volg){ const p = T.ents[s.bal.volg], m = s.moves[s.bal.volg], p0 = van.ents[s.bal.volg];
          // bal aan de voet, vóór de speler in zijn looprichting (staat hij stil: de richting waarin hij het laatst liep)
          const dx = m && p0 ? (m.x ?? p0.x) - p0.x : 0, dy = m && p0 ? (m.y ?? p0.y) - p0.y : 0, l = Math.hypot(dx, dy);
          if (l > .2) p.balRicht = {x:dx / l, y:dy / l};
          const r = p.balRicht || {x:p.rol === 'zij' || p.rol === 'k' ? -1 : 1, y:0}; T.bal = {x:p.x + .8 * r.x, y:p.y + .8 * r.y, z:0}; }
        else if (s.bal.to){ const b0 = van.bal, b1 = s.bal.to, tb = aanzet ? Math.max(0, Math.min(1, (nu - t0 - aanzet) / Math.max(1, d - aanzet))) : t; T.bal = {x:b0.x + (b1.x - b0.x) * tb, y:b0.y + (b1.y - b0.y) * tb + (s.bal.krul || 0) * 4 * tb * (1 - tb), z:(b0.z || 0) + ((b1.z || 0) - (b0.z || 0)) * tb + (s.bal.boog || 0) * 4 * tb * (1 - tb)}; } }
      // camera volgt de bal rustig
      T.cam += (Math.max(18, Math.min(87, T.bal.x)) - T.cam) * .06;
      if (t >= 1){ if (s.fx){ fx = s.fx; fxT = nu; if (s.fx === 'goal' || s.fx === 'tegen' || s.fx.net){ T.netKant = s.fx === 'tegen' ? 'L' : 'R'; } if (s.fx === 'geel' || s.fx === 'rood'){ T.kaart = s.fx; } } begin(nu); }
    }
    if (fx){ const [txt, kl] = typeof fx === 'object' ? [fx.t, fx.kl] : FX[fx] || [fx, '#fff']; if (fx.score) T.onder = `Strafschoppen · ${fx.score} (${S.M && S.M.wij || 'wij'} - ${S.M && S.M.zij || 'zij'})`; T.tekst = txt; T.tekstKleur = kl; T.tekstT = Math.min(1, (nu - fxT) / 400); T.netBol = T.netKant ? Math.max(0, .9 - (nu - fxT) / 900) : 0; }
    teken(cv, T, nu);
    if (i >= st.length && nu - eind > (fx ? (a.soort === 'shootout' ? 1400 : 900) : 300) * snel){ PITCH = null; klaar(); return; }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
// overlay: de keuzes van jouw actie, onderin over het veld
export function vPitch(overlay = ''){
  const M = S.M; if (!M) return '';
  const open = openAnims(M), nieuwAnim = open.length && instel().anim !== 'uit';
  if (!nieuwAnim && !M.pending) return '';
  if (instel().anim === 'uit' && !M.pending) return '';
  const zet = v => knop(v === 'normaal' ? 'Normaal' : v === 'snel' ? 'Snel' : 'Uit', () => { instel().anim = v; if (v === 'uit') openAnims(M).forEach(a => a.gezien = true); }, instel().anim === v ? 'klein aan' : 'klein', 'data-blijf');
  const veld = v => knop(v.toUpperCase(), () => { instel().veld = v; }, (instel().veld || '3d') === v ? 'klein aan' : 'klein', 'data-blijf');
  const spelers = (v, l) => knop(l, () => { instel().spelers = v; delete instel().kwaliteit; }, spelerModus() === v ? 'klein aan' : 'klein', `data-blijf title="${v === 'echt' ? 'Altijd de 3D-spelers' : v === 'auto' ? 'Eenvoudiger als het beeld te traag wordt' : 'Altijd de eenvoudige spelers (snelst)'}"`);
  return `<div id="pitch25" class="pitch25"><div class="pitchvak"><canvas aria-label="Het veld van bovenaf, schuin gezien"></canvas>${overlay ? `<div class="pitchkeuze">${overlay}</div>` : ''}</div>
    <div class="rij pitchknop" style="gap:6px;align-items:center;flex-wrap:wrap"><span class="muted klein-tekst">Animatie:</span>${zet('normaal')}${zet('snel')}${zet('uit')}<span class="muted klein-tekst" style="margin-left:8px">Veld:</span>${veld('3d')}${veld('2d')}${(instel().veld || '3d') === '3d' ? `<span class="muted klein-tekst" style="margin-left:8px">Spelers:</span>${spelers('echt', 'Echt')}${spelers('auto', 'Auto')}${spelers('simpel', 'Simpel')}` : ''}${nieuwAnim ? knop(open.length > 1 ? `Overslaan (${open.length}) ⏭` : 'Overslaan ⏭', () => { openAnims(M).forEach(a => a.gezien = true); }, 'klein', 'data-blijf id="pitchSkip"') : ''}</div></div>`;
}
// Na elke weergave: het veld tekenen of de wachtrij met animaties afspelen
export function pitchNaRender(){
  if (PITCH){ PITCH.stop = true; PITCH = null; }
  GEN++; // lussen van een vorige weergave stoppen (het 3D-canvas blijft hetzelfde element)
  const el = document.getElementById('pitch25'); if (!el || !S || !S.M) return;
  const M = S.M, keuzes = document.querySelector('#veld .pitchkeuze') || document.querySelector('#veld .keuzes'), knoppen = document.querySelector('#veld > .hoofd:last-of-type');
  const toon = t => !!t;
  if (instel().anim === 'uit'){ openAnims(M).forEach(a => a.gezien = true); if (M.pending && toon(M.pending.type)) pitchStatisch(el, M.pending.type); return; }
  const open = openAnims(M);
  if (open.length){
    if (keuzes) keuzes.style.visibility = 'hidden';
    // Scorebord tijdelijk op de minuut en stand van de actie die nu wordt afgespeeld
    const bord = document.querySelector('#veld .score .stand'), bordNu = bord && bord.innerHTML;
    const zetBord = a => { if (!bord || !bord.isConnected || a.min === undefined) return; bord.firstChild.nodeValue = a.stand ?? bord.firstChild.nodeValue; const m = bord.querySelector('.min'); if (m) m.textContent = a.min + "'"; };
    const herstelBord = () => { if (bord && bord.isConnected) bord.innerHTML = bordNu; };
    const speel = i => { zetBord(open[i]); pitchSpeel(el, open[i], () => {
      open[i].gezien = true; try { bewaar(); } catch (e){}
      const sk = document.getElementById('pitchSkip'); if (sk) sk.textContent = open.length - i - 1 > 1 ? `Overslaan (${open.length - i - 1}) ⏭` : 'Overslaan ⏭';
      if (i + 1 < open.length && el.isConnected) return speel(i + 1);
      if (keuzes) keuzes.style.visibility = ''; if (sk) sk.remove();
      herstelBord();
      if (S.M && S.M.pending && el.isConnected && toon(S.M.pending.type)) pitchStatisch(el, S.M.pending.type);
    }); };
    speel(0);
  } else if (M.pending && toon(M.pending.type)) pitchStatisch(el, M.pending.type);
}
