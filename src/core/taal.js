/* ===================== Taal: Nederlands of Engels ===================== */
// Het spel is in het Nederlands geschreven. Kies je Engels, dan vertaalt deze laag de tekst op het scherm terwijl die
// getekend wordt: een woordenboek (data/taal-en.js) met hele zinnen en patronen. Een patroon heeft # voor een getal en
// * voor een naam (club, speler). Teksten met " · " ertussen worden ook per stukje vertaald. Wat (nog) niet in het
// woordenboek staat, blijft Nederlands. Een MutationObserver vertaalt alles wat later verschijnt, ook in de filmpjes.
import { EN as EN1 } from '../data/taal-en.js';
import { EN_WEDSTRIJD } from '../data/taal-en-wedstrijd.js';
import { EN_VERHAAL } from '../data/taal-en-verhaal.js';
import { EN_EXTRA } from '../data/taal-en-extra.js';
const EN = {...EN_VERHAAL, ...EN1, ...EN_WEDSTRIJD, ...EN_EXTRA};

let TAAL = 'nl';
try { TAAL = localStorage.getItem('taal') === 'en' ? 'en' : 'nl'; } catch (e){}
export const taal = () => TAAL;
// De naam van het spel in het tabblad (en het venster van de app)
const NAAM = {nl:'Het Grote Doorbreken', en:'The Big Breakthrough'};
function zetTitel(){ if (typeof document !== 'undefined') document.title = NAAM[TAAL]; }
export function zetTaal(t){
  TAAL = t === 'en' ? 'en' : 'nl';
  try { localStorage.setItem('taal', TAAL); } catch (e){}
  zetTitel();
  if (typeof document !== 'undefined'){ document.documentElement.lang = TAAL; if (TAAL === 'en') vertaalDom(document.body); else herstelDom(document.body); }
}
// Wat we vertaald hebben, onthouden we (de Nederlandse tekst en de Engelse): terug naar Nederlands zet dat zonder herladen
// terug, ook in een venster dat nog open staat. Tekst die intussen door het spel is veranderd, laten we staan
const ORIG = new WeakMap(); // tekstknoop → [nl, en]; element → {attribuut: [nl, en]} en '#tekst' voor data-en
function herstelDom(root){
  if (!root) return;
  const zet = n => {
    const o = ORIG.get(n); if (!o) return; ORIG.delete(n);
    if (n.nodeType === 3){ if (n.nodeValue === o[1]) n.nodeValue = o[0]; return; }
    for (const [a, [nl, en]] of Object.entries(o)){ if (a === '#tekst'){ if (n.textContent === en) n.textContent = nl; } else if (n.getAttribute(a) === en) n.setAttribute(a, nl); }
  };
  zet(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), lijst = [];
  let n; while ((n = w.nextNode())) lijst.push(n); // (eerst verzamelen: '#tekst' vervangt de kinderen van een element)
  lijst.forEach(zet);
}
const onthoud = (el, a, nl, en) => { const o = ORIG.get(el) || {}; o[a] = o[a] && o[a][1] === nl ? o[a] : [nl, en]; ORIG.set(el, o); };

// ---------- het woordenboek: exacte zinnen en patronen ----------
const EXACT = new Map(), PATRONEN = [];
const KORT_OK = new Set(['* tegen *.', '* haalt * (*)', '* haalt * (*).', '(jij # G · # A)', 'tegen *', 'door *', 'voor *', 'Hoeveel is *?', '=# punten', '↑# punten', '↓# punten', '=# punt', '↑# punt', '↓# punt', '=# punten.', '↑# punten.', '↓# punten.', '=# punt.', '↑# punt.', '↓# punt.']); // (kort, maar ze komen los in een opsomming voor: "FC Bierbuik, tegen SV Grenswacht")
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const [nl0, en] of Object.entries(EN)){
  const nl = nl0.replace(/^@/, ''); // (@ = een tooltip; in het woordenboek alleen als geheugensteuntje)
  if (/[#*]/.test(nl)){
    // (een te algemeen patroon, zoals "* tegen *", zou van alles verkeerd vertalen: dat slaan we over)
    // (een te algemeen patroon, zoals "* tegen *", zou van alles verkeerd vertalen. Eén gat met een paar vaste letters mag wel: "nog # ▾", "€#/jaar")
    const gaten = (nl.match(/[#*]/g) || []).length, letters = nl.replace(/[^A-Za-zÀ-ÿ]/g, '').length;
    if (!KORT_OK.has(nl) && (letters < 3 || (gaten >= 2 && nl.replace(/[#*\s.,:!?'"·()+−-]/g, '').length < 6))) continue;
    const re = new RegExp('^' + esc(nl).replace(/#/g, '(−?[\\d.,]+)').replace(/\\\*/g, '(.*?)') + '$');
    // (het langste vaste stuk: staat dat niet in de tekst, dan hoeft de regex niet eens te proberen)
    const vast = nl.split(/[#*]/).sort((a, b) => b.length - a.length)[0];
    PATRONEN.push([re, en, nl.replace(/[#*]/g, '').length, vast, nl, /^[#*]/.test(nl) && /[#*]$/.test(nl)]); // (open: begint en eindigt met * of #, zoals "* kiest voor *". Die mag niet over een zin heen gaan)
  } else EXACT.set(nl, en);
}
PATRONEN.sort((a, b) => b[2] - a[2]); // (de meest specifieke patronen eerst)
// Snel zoeken: patronen die met vaste tekst beginnen staan in een bakje per eerste twee tekens; de rest (begint met * of #) altijd proberen
const BAKJE = new Map(), VRIJ = [];
for (const p of PATRONEN){ const begin = p[4].slice(0, 2); if (!/[#*]/.test(begin)){ if (!BAKJE.has(begin)) BAKJE.set(begin, []); BAKJE.get(begin).push(p); } else VRIJ.push(p); }
// Vul de gevangen getallen en namen in, in volgorde (# en * in de Engelse tekst; *2 = het tweede gevangen stuk, voor een andere zinsvolgorde)
let VOL = true; // (zet vul op false als een lang ingevuld stuk Nederlands bleef)
const NAAMWOORD = new Set(['van', 'der', 'den', 'ten', 'ter', 'von', 'del', 'dos', 'las', 'les', 'and', 'the']);
const nogNl = x => { const w = x.trim().split(/\s+/); return w.length >= 2 && w.some(y => /^[a-zà-ÿ]{3,}$/.test(y.replace(/[.,!?:;"')(]/g, '')) && !NAAMWOORD.has(y)); }; // (een stuk zin, geen naam)
const vul = (en, m) => { let i = 1; return en.replace(/([#*])(\d)?/g, (_, k, d) => { const x = m[d ? +d : i++] ?? ''; if (!(x.length > 1 && /[A-Za-zÀ-ÿ]/.test(x))) return x; const w = x.match(/^(\s*)([\s\S]*?)(\s*)$/), z0 = zoek(x, true); if (z0 !== null) return z0; const z = zoekMeer(w[2]); if (z === null){ if (nogNl(w[2])) VOL = false; return x; } return w[1] + z + w[3]; }); }; // (een naam die zelf in het woordenboek staat, zoals een competitie, ook vertalen)
// streng: alleen een vertaling zonder lange stukken Nederlands erin. Anders de beste die er is
function zoek(t, streng = false){
  if (EXACT.has(t)) return EXACT.get(t);
  let reserve = null;
  for (const lijst of [BAKJE.get(t.slice(0, 2)), VRIJ]) if (lijst) for (const [re, en, n, vast, , open] of lijst){
    if (t.length < n || !t.includes(vast)) continue; const m = t.match(re);
    // (een gat dat over een opsomming heen gaat, "A (keeper, van X), B", niet: die wordt per item vertaald, zoekMeer)
    if (!m || (vast.length > 3 && m.slice(1).some(x => x && x.includes(vast))) || (vast.startsWith(' (') && m.slice(1).some(x => x && x.includes('), '))) ||(open && m.slice(1).some(x => x && /(?<!\b[A-Z])[.!?] \S/.test(x)))) continue;
    const vorig = VOL; VOL = true; const r = vul(en, m), ok = VOL; VOL = vorig;
    if (ok) return r; if (reserve === null) reserve = r;
  }
  return streng ? null : reserve;
}
// Een opsomming splitsen op ", ", maar niet binnen haakjes: "J. Moreno (middenvelder, van SC Regenjas), H. Samaras (keeper)"
function splitKomma(t){ const uit = []; let d = 0, b = 0; for (let i = 0; i < t.length; i++){ const c = t[i]; if (c === '(') d++; else if (c === ')') d = Math.max(0, d - 1); else if (d === 0 && c === ',' && t[i + 1] === ' '){ uit.push(t.slice(b, i)); b = i + 2; i++; } } uit.push(t.slice(b)); return uit; }
// Een tekst in losse zinnen (niet na een voorletter, "O. Dubois", en niet na een rangnummer, "in de 1. Lig")
const zinnen = t => t.split(/(?<=(?<!\b[A-Z]|\bde \d)[.!?]["')]?)\s+(?=[A-Z"'(])/);
// Heeft elke zin op zich een volledige vertaling? Dan die (een los patroon over meerdere zinnen laat vaak een stuk Nederlands staan)
function perZin(t){ const z = zinnen(t); if (z.length < 2 || z.length > 40) return null; const los = z.map(x => zoek(x, true) ?? (nogNl(x) ? null : x)); return los.every(x => x !== null) && los.some((x, i) => x !== z[i]) ? los.join(' ') : null; } // (een zin met alleen een naam, "SC Wadden?", blijft gewoon staan)
// Ook met een kopje ervoor ("Vanaf de bank: ...") of "(jij)" erachter
function zoekMeer(t){
  const z = zoek(t, true); if (z !== null) return z;
  const pz = perZin(t); if (pz !== null) return pz;
  // een opsomming met " · " (ook binnen een gat van een patroon: "samen met Zoë · Luna · 4k volgers"): per stukje
  if (t.includes(' · ')){ const d = t.split(' · '), v = d.map(x => zoekMeer(x) ?? x); if (v.some((x, i) => x !== d[i])) return v.join(' · '); }
  // tussen aanhalingstekens (een persvraag): de zin zonder de tekens vertalen
  const q = t.match(/^"([\s\S]+)"$/); if (q){ const v = zoekMeer(q[1]); if (v !== null) return `"${v}"`; }
  else if (!t.includes('"') && t.length > 12){ const v = zoek('"' + t + '"', true); if (v !== null && /^".*"$/.test(v)) return v.slice(1, -1); } // (en andersom: een persantwoord zonder de tekens)
  // midden in een zin met een kleine letter: "je stond maar 5 keer in de basis"
  if (/^[a-zà-ÿ]/.test(t)){ const v = zoek(t[0].toUpperCase() + t.slice(1), true); if (v !== null) return v[0].toLowerCase() + v.slice(1); }
  const k = t.match(/^([^:·]{3,30}): ([\s\S]+)$/); if (k){ const a = zoek(k[1]), b = zoekMeer(k[2]); if (a !== null || b !== null) return `${a ?? k[1]}: ${b ?? k[2]}`; }
  if (/ \(jij\)$/.test(t)) return (zoek(t.slice(0, -6)) ?? t.slice(0, -6)) + ' (you)';
  // een emoji ervoor ("💃 Heupen los!")
  const e = t.match(/^(\p{Extended_Pictographic}\uFE0F?\s+)([\s\S]+)$/u); if (e){ const z = zoek(e[2]); if (z !== null) return e[1] + z; }
  // een paar losse zinnen achter elkaar: per zin (of per groepje zinnen) vertalen
  const zin = zinnen(t);
  if (zin.length > 1 && zin.length <= 40){
    const uit = []; let raak = false;
    for (let i = 0; i < zin.length; ){
      let j = zin.length, v = null;
      for (; j > i; j--){ v = zoek(zin.slice(i, j).join(' '), j - i > 1); if (v !== null) break; }
      if (v !== null){ uit.push(v); raak = true; i = j; } else { uit.push(zin[i]); if (nogNl(zin[i])) VOL = false; i++; } // (een zin bleef Nederlands: niet "helemaal vertaald")
    }
    if (raak) return uit.join(' ');
  }
  // een opsomming met komma's ("klasse 64 (jij 50), reputatie 20 nodig (jij 8)" of "FC Bierbuik, tegen SV Grenswacht")
  if (t.includes(', ')){ const delen = splitKomma(t), v = delen.map(d => zoek(d, true) ?? d); if (v.some((x, i) => x !== delen[i])){ if (v.some((x, i) => x === delen[i] && nogNl(x))) VOL = false; return v.join(', '); } }
  return zoek(t); // (dan maar een vertaling met een stukje Nederlands erin)
}
// Eén stuk tekst vertalen (de witruimte eromheen blijft staan). Lukt het niet in één keer, dan per stukje tussen de " · "
// Vaste woorden in het pixelfont (bordjes, rubrieken, krantennamen). Dat zijn hoofdletters zonder zinsbouw, dus een eigen lijstje
const PIXEL = {'PERSCONFERENTIE':'PRESS CONFERENCE', 'OPSTELLING':'LINE-UPS', 'DIT IS ONS HUIS':'THIS IS OUR HOME', 'VELD':'PITCH', 'VERKOCHT':'SOLD', 'KAMPIOENEN':'CHAMPIONS', 'WINNAARS':'WINNERS', 'GOUDEN BAL':'GOLDEN BALL', 'EN DE WINNAAR IS':'AND THE WINNER IS', 'DE WINNAAR':'THE WINNER', 'IN DE BASIS':'IN THE STARTING XI',
  'TRANSFERNIEUWS':'TRANSFER NEWS', 'RODDEL':'GOSSIP', 'INTERLAND':'INTERNATIONAL', 'DEBUUT':'DEBUT', 'DE DEAL':'THE DEAL', 'DE PIXEL KRANT':'THE PIXEL TIMES',
  'DE SPORTKRANT':'THE SPORTS PAPER', 'VOETBAL VANDAAG':'FOOTBALL TODAY', 'STUDIO VOETBAL':'FOOTBALL STUDIO', 'EUROPEES VOETBALNIEUWS':'EUROPEAN FOOTBALL NEWS',
  '1E GOAL':'1ST GOAL', 'HERHALING':'REPLAY', 'De Sportkrant':'The Sports Paper', 'Voetbal Vandaag':'Football Today', 'Studio Voetbal':'Football Studio', 'Europees Voetbalnieuws':'European Football News',
  'BEDANKT':'THANK YOU', 'LEGENDE':'LEGEND', // (de spandoeken bij je afscheid: render/pixel/afscheid.js)
  'PROMOTIE!':'PROMOTED!', 'TOPDIVISIE':'TOP DIVISION', 'EERSTE DIVISIE':'FIRST DIVISION'}; // (het spandoek in de promotieparade: render/pixel/parade.js)
export const vertaalPixel = s => TAAL === 'en' ? (PIXEL[s] ?? PIXEL[String(s).toUpperCase()] ?? s) : s;
const rangtelwoord = n => n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
const CACHE = new Map(); // (dezelfde tekst komt bij elke weergave terug)
export function vertaal(tekst){
  if (TAAL !== 'en' || !tekst) return tekst;
  const c = CACHE.get(tekst); if (c !== undefined) return c;
  let v = vertaal1(tekst);
  if (v !== tekst) v = v.replace(/\b(\d+)th\b/g, (_, n) => n + rangtelwoord(+n)); // (de woordenboeken maken van "2e" altijd "2th": hier het juiste achtervoegsel)
  if (CACHE.size > 20000) CACHE.clear(); CACHE.set(tekst, v); return v;
}
function vertaal1(tekst){
  const m = tekst.match(/^(\s*)([\s\S]*?)(\s*)$/), kern = m[2]; if (!kern || !/[A-Za-zÀ-ÿ]/.test(kern)) return tekst;
  // eerst de hele tekst precies; lukt dat niet en staan er " · " in, dan per stukje (vóór de losse komma's en zinnen)
  // een regel uit het wedstrijdverslag: "[Schieten] Je schot gaat ruim over." (eerst: anders neemt een patroon het [label] onvertaald mee)
  let uit = null;
  { const h = kern.match(/^\[([^\]]+)\] ([\s\S]+)$/); if (h){ const a = zoek(h[1]) ?? h[1], b = zoekMeer(h[2]) ?? h[2]; if (a !== h[1] || b !== h[2]) uit = `[${a}] ${b}`; } }
  if (uit === null) uit = perZin(kern) ?? zoek(kern, true);
  // een stukje dat met ". " of ", " begint (na een vetgedrukte naam): de rest vertalen
  if (uit === null){ const p = kern.match(/^([.,:;] )([\s\S]+)$/); if (p){ const z = vertaal(p[2]); if (z !== p[2]) uit = p[1] + z; } }
  if (uit === null && kern.includes(' · ')){ const delen = kern.split(' · '), v = delen.map(d => zoekMeer(d) ?? d); if (v.every((x, i) => x !== delen[i] || !nogNl(x))) uit = v.join(' · '); }
  // een stukje met een "·" ervoor of erachter (losse effecten op een tegel: " · fitheid "). Eerst dit proberen: anders wint een halve vertaling van het geheel
  if (uit === null && /^· /.test(kern)){ const z = vertaal(kern.slice(2)); if (z !== kern.slice(2)) uit = '· ' + z; }
  if (uit === null && / ·$/.test(kern)){ const z = vertaal(kern.slice(0, -2)); if (z !== kern.slice(0, -2)) uit = z + ' ·'; }
  if (uit === null) uit = zoekMeer(kern);
  if (uit === null && kern.includes(' · ')){ const delen = kern.split(' · '), v = delen.map(d => zoekMeer(d) ?? d); if (v.some((x, i) => x !== delen[i])) uit = v.join(' · '); }
  if (uit === null && /:$/.test(kern)){ const z = zoek(kern.slice(0, -1)); if (z !== null) uit = z + ':'; }
  return uit === null ? tekst : m[1] + uit + m[3];
}
const ATTR = ['title', 'aria-label', 'placeholder', 'data-bevestig', 'data-ja'];
function vertaalEl(el){
  if (el.dataset && el.dataset.en != null && el.textContent !== el.dataset.en){ onthoud(el, '#tekst', el.textContent, el.dataset.en); el.textContent = el.dataset.en; return; } // (een eigen Engelse tekst, voor woorden met twee betekenissen: 'Uit' = Off of Away)
  for (const a of ATTR){ const v = el.getAttribute && el.getAttribute(a); if (v){ const n = vertaal(v); if (n !== v){ onthoud(el, a, v, n); el.setAttribute(a, n); } } }
}
// Alle tekst in een stuk van de pagina
export function vertaalDom(root){
  if (TAAL !== 'en' || !root) return;
  if (root.nodeType === 3){ const n = vertaal(root.nodeValue); if (n !== root.nodeValue){ ORIG.set(root, [root.nodeValue, n]); root.nodeValue = n; } return; }
  if (root.nodeType !== 1) return;
  if (/^(SCRIPT|STYLE|TEXTAREA)$/.test(root.nodeName)) return;
  vertaalEl(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n; while ((n = w.nextNode())){
    if (n.nodeType === 3){ if (n.parentNode && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName)) continue; const v = vertaal(n.nodeValue); if (v !== n.nodeValue){ ORIG.set(n, [n.nodeValue, v]); n.nodeValue = v; } }
    else vertaalEl(n);
  }
}
// Alles wat later op de pagina komt (een nieuwe weergave, een filmpje, een melding) meteen vertalen
export function startVertaler(){
  if (typeof MutationObserver === 'undefined') return;
  // Tekst die op een canvas wordt getekend (bordjes op het veld, de letters in de krant) ziet de observer niet: die vertalen we bij het tekenen
  // (altijd inhaken: vertaal() doet in het Nederlands niets, en zo werkt ook een wissel naar Engels zonder herladen)
  if (typeof CanvasRenderingContext2D !== 'undefined'){
    const P = CanvasRenderingContext2D.prototype;
    for (const f of ['fillText', 'strokeText']){ const oud = P[f]; P[f] = function(t, ...r){ return oud.call(this, typeof t === 'string' ? vertaal(t) : t, ...r); }; }
  }
  document.documentElement.lang = TAAL;
  zetTitel();
  if (TAAL === 'en') vertaalDom(document.body);
  new MutationObserver(lijst => {
    if (TAAL !== 'en') return;
    for (const r of lijst){
      if (r.type === 'characterData') vertaalDom(r.target);
      else if (r.type === 'attributes') vertaalEl(r.target);
      else r.addedNodes.forEach(vertaalDom);
    }
  }).observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTR});
}
