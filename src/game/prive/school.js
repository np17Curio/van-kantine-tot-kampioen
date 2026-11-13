import { S, mod } from '../../core/state.js';
import { clamp, pick, randInt, rnd, shuffle } from '../../core/utils.js';
import { NL_VRAAG, nietNL } from '../../data/landen.js';
import { fmt1, gemiddelde } from '../speler/o23.js';
import { taal } from '../../core/taal.js';

/* ===================== School (tot je 18e) ===================== */
export const VAKKEN = ['Wiskunde', 'Nederlands', 'Engels', 'Aardrijkskunde', 'Geschiedenis', 'Biologie'];
// [vraag, goed antwoord, fout, fout]. Wiskunde wordt berekend (zie wiskundeVraag)
export const SCHOOLVRAGEN = {
  Nederlands: [
    ['Welke zin is goed geschreven?', 'Hij wordt morgen zestien.', 'Hij word morgen zestien.', 'Hij wort morgen zestien.'],
    ['Welke zin is goed geschreven?', 'Word jij morgen opgehaald?', 'Wordt jij morgen opgehaald?', 'Wort jij morgen opgehaald?'],
    ['Vul in: "Gisteren ___ ik naar de training."', 'fietste', 'fietsde', 'fietstte'],
    ['Vul in: "De keeper heeft de bal ___."', 'gestopt', 'gestopd', 'gestoptt'],
    ['Vul in (beantwoorden, verleden tijd): "Hij ___ de vraag van de verslaggever."', 'beantwoordde', 'beantwoorde', 'beantwoordte'],
    ['Wat is het onderwerp in: "Na de wedstrijd douchen de spelers."?', 'de spelers', 'na de wedstrijd', 'douchen'],
    ['Wat is het verkleinwoord van "bal"?', 'balletje', 'baltje', 'baaltje'],
    ['Welk woord betekent hetzelfde als "snel"?', 'vlug', 'traag', 'zwaar'],
    ['Wat betekent "de kat uit de boom kijken"?', 'Eerst afwachten hoe iets loopt', 'Iemand voor de gek houden', 'Heel snel een besluit nemen'],
    ['Welk woord is een bijvoeglijk naamwoord in: "De snelle spits scoort."?', 'snelle', 'spits', 'scoort'],
    ['Wat is de persoonsvorm in: "De trainer roept de spelers bij elkaar."?', 'roept', 'trainer', 'spelers']
  ],
  Engels: [
    ['What is the past simple of "to run"?', 'ran', 'runned', 'run'],
    ['Kies: "She ___ football every Saturday."', 'plays', 'play', 'playing'],
    ['Wat is "scheidsrechter" in het Engels?', 'referee', 'coach', 'captain'],
    ['Kies: "I have ___ to Spain twice."', 'been', 'be', 'was'],
    ['Which sentence is correct?', "He doesn't like spinach.", "He don't like spinach.", 'He not likes spinach.'],
    ['Hoe zeg je "gisteren" in het Engels?', 'yesterday', 'tomorrow', 'today'],
    ['What is the plural of "child"?', 'children', 'childs', 'childrens'],
    ['Kies: "If it rains, we ___ inside."', 'will play', 'would play', 'played'],
    ['What is the opposite of "win"?', 'lose', 'loose', 'draw'],
    ['Kies: "There are ___ apples on the table."', 'some', 'much', 'a'],
    ['Wat betekent "to score"?', 'een doelpunt maken', 'op de paal schieten', 'verdedigen']
  ],
  Aardrijkskunde: [
    ['Wat is de hoofdstad van Nederland?', 'Amsterdam', 'Den Haag', 'Rotterdam'],
    ['Hoeveel provincies heeft Nederland?', '12', '10', '14'],
    ['In welke provincie ligt Eindhoven?', 'Noord-Brabant', 'Limburg', 'Gelderland'],
    ['Hoe heet het hoogste punt van Nederland op het Europese vasteland?', 'De Vaalserberg', 'De Veluwezoom', 'De Brunssummerheide'],
    ['Wat is het grootste werelddeel?', 'Azië', 'Afrika', 'Noord-Amerika'],
    ['Wat is de hoofdstad van Spanje?', 'Madrid', 'Barcelona', 'Sevilla'],
    ['Welke oceaan ligt tussen Europa en Noord-Amerika?', 'De Atlantische Oceaan', 'De Stille Oceaan', 'De Indische Oceaan'],
    ['Welke zee ligt ten noorden van de Waddeneilanden?', 'De Noordzee', 'De Oostzee', 'De Middellandse Zee'],
    ['Wat is de langste rivier van Europa?', 'De Wolga', 'De Rijn', 'De Donau'],
    ['Aan welke rivier ligt Rotterdam?', 'De Nieuwe Maas', 'De IJssel', 'De Schelde'],
    ['Wat is de hoofdstad van België?', 'Brussel', 'Antwerpen', 'Gent']
  ],
  Geschiedenis: [
    ['In welk jaar werd Nederland bevrijd aan het einde van de Tweede Wereldoorlog?', '1945', '1940', '1918'],
    ['Wie wordt de "Vader des Vaderlands" genoemd?', 'Willem van Oranje', 'Karel de Grote', 'Napoleon'],
    ['In welk jaar viel de Berlijnse Muur?', '1989', '1961', '1991'],
    ['Waar staan de letters VOC voor?', 'Verenigde Oost-Indische Compagnie', 'Vereniging van Oude Collectioneurs', 'Vrije Overzeese Compagnie'],
    ['In welk jaar zette de eerste mens voet op de maan?', '1969', '1959', '1979'],
    ['Wie schilderde De Nachtwacht?', 'Rembrandt', 'Vincent van Gogh', 'Johannes Vermeer'],
    ['In welk jaar begon de Eerste Wereldoorlog?', '1914', '1918', '1939'],
    ['Wat vieren we in Nederland op 5 mei?', 'Bevrijdingsdag', 'Koningsdag', 'Dodenherdenking'],
    ['Wie bouwden de piramides van Gizeh?', 'De oude Egyptenaren', 'De Romeinen', 'De Grieken'],
    ['Wie maakte rond 1450 de boekdrukkunst met losse letters bekend in Europa?', 'Johannes Gutenberg', 'Leonardo da Vinci', 'Christoffel Columbus'],
    ['Op welke dag is Koningsdag (als die niet op een zondag valt)?', '27 april', '30 april', '5 mei']
  ],
  Biologie: [
    ['Welk orgaan pompt het bloed door je lichaam?', 'Het hart', 'De longen', 'De lever'],
    ['Wat heeft een plant nodig voor fotosynthese?', 'Licht, water en koolstofdioxide', 'Zuurstof en suiker', 'Alleen water'],
    ['Hoeveel botten heeft een volwassen mens ongeveer?', '206', '106', '306'],
    ['Welke bloedcellen bestrijden ziekteverwekkers?', 'Witte bloedcellen', 'Rode bloedcellen', 'Bloedplaatjes'],
    ['Welke stof in rode bloedcellen vervoert zuurstof?', 'Hemoglobine', 'Insuline', 'Adrenaline'],
    ['Welk gas adem je meer uit dan je inademt?', 'Koolstofdioxide', 'Zuurstof', 'Stikstof'],
    ['Welke spier strekt je knie als je tegen een bal trapt?', 'De quadriceps (voorkant bovenbeen)', 'De biceps (bovenarm)', 'De kuitspier'],
    ['Waar worden de meeste voedingsstoffen in je bloed opgenomen?', 'In de dunne darm', 'In de maag', 'In de dikke darm'],
    ['Wat is de kleinste levende bouwsteen van een organisme?', 'De cel', 'Het orgaan', 'Het weefsel'],
    ['Welke vitamine maakt je huid aan onder invloed van zonlicht?', 'Vitamine D', 'Vitamine C', 'Vitamine B12'],
    ['Wat is het grootste orgaan van het menselijk lichaam?', 'De huid', 'De lever', 'De hersenen']
  ]
};
export const nl = x => String(x).replace('.', ',');
// Talen schrijf je met een hoofdletter, de andere vakken niet
export const vakKlein = v => v === 'Nederlands' || v === 'Engels' ? v : v.toLowerCase();
export const SUP = {2:'²', 3:'³', 4:'⁴', 5:'⁵'};
// Twee foute antwoorden die anders zijn dan het goede antwoord (en positief)
export function vulAan(goed, kand, n = 2){
  const uit = [];
  for (const k of kand) if (k !== goed && k > 0 && !uit.includes(k) && uit.length < n) uit.push(k);
  for (let d = 1; uit.length < n; d++) for (const k of [goed + d, goed - d]) if (k !== goed && k > 0 && !uit.includes(k) && uit.length < n) uit.push(k);
  return uit;
}
// Wiskunde wordt uitgerekend, zodat het antwoord altijd klopt
export function wiskundeVraag(){
  const t = randInt(0, 7);
  if (t === 0){
    const prijs = pick([40, 60, 80, 100, 120, 160, 200]), pct = pick([10, 20, 25, 30, 50]), goed = prijs * (100 - pct) / 100;
    return [`Voetbalschoenen kosten €${prijs}. In de uitverkoop krijg je ${pct}% korting. Wat betaal je?`, ...[goed, ...vulAan(goed, [prijs * pct / 100, prijs - pct, goed + 10])].map(x => `€${nl(x)}`)];
  }
  if (t === 1){
    const a = randInt(2, 6), x = randInt(2, 9), b = randInt(1, 15), c = a * x + b;
    return [`Los op: ${a}x + ${b} = ${c}. Wat is x?`, ...[x, ...vulAan(x, [x + 1, c - b, x - 1])].map(String)];
  }
  if (t === 2){
    const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]);
    return [`Een rechthoekige driehoek heeft rechthoekszijden van ${a} cm en ${b} cm. Hoe lang is de schuine zijde?`, ...[c, ...vulAan(c, [a + b, c + 1, c - 2])].map(n => `${n} cm`)];
  }
  if (t === 3){
    let m, l;
    do { m = randInt(5, 8); l = [0, 1, 2].map(() => clamp(m + randInt(-3, 3), 1, 10)); l.push(4 * m - l[0] - l[1] - l[2]); } while (l[3] < 1 || l[3] > 10);
    return [`Je krijgt de cijfers ${l.slice(0, 3).join(', ')} en ${l[3]}. Wat is je gemiddelde?`, ...[m, ...vulAan(m, [m + 1, m - 1, Math.max(...l)])].map(String)];
  }
  if (t === 4){
    const [km, uur, v] = pick([[6, 1.5, 4], [9, 1.5, 6], [12, 1.5, 8], [15, 1.5, 10], [18, 1.5, 12], [6, 2, 3], [12, 2, 6], [18, 2, 9], [9, 3, 3], [12, 3, 4], [15, 3, 5], [18, 3, 6]]);
    return [`Je loopt ${km} km in ${nl(uur)} uur. Wat is je gemiddelde snelheid?`, ...[v, ...vulAan(v, [v + 2, km * uur, v - 1])].map(n => `${nl(n)} km/u`)];
  }
  if (t === 5){
    const b = randInt(2, 6) * 2, h = randInt(3, 9), goed = b * h / 2;
    return [`Een driehoek heeft een basis van ${b} cm en een hoogte van ${h} cm. Wat is de oppervlakte?`, ...[goed, ...vulAan(goed, [b * h, b + h, goed + 2])].map(n => `${n} cm²`)];
  }
  if (t === 6){
    const g = randInt(2, 5), e = g === 2 ? randInt(3, 5) : randInt(2, 3), goed = g ** e;
    return [`Hoeveel is ${g}${SUP[e]}?`, ...[goed, ...vulAan(goed, [g * e, goed + g, goed - g])].map(String)];
  }
  const pct = pick([10, 15, 20, 25, 50]), n = pick([40, 60, 80, 120, 200]), goed = n * pct / 100;
  return [`Hoeveel is ${pct}% van ${n}?`, ...[goed, ...vulAan(goed, [goed * 10, goed + 5, n - pct])].map(nl)];
}
export function maakSchoolvraag(sp){
  const sch = sp.school = sp.school || {cijfers:[]};
  const gehad = sch.gehad = sch.gehad || [];
  const vak = pick(VAKKEN.filter(v => !((v === 'Nederlands' || v === 'Engels') && taal() === 'en'))); // (in het Engels: geen taalvragen over Nederlandse spelling of Engelse woordjes)
  let rij;
  if (vak === 'Wiskunde') rij = wiskundeVraag();
  else {
    const lijst = SCHOOLVRAGEN[vak], mag = i => !(nietNL() && NL_VRAAG.test(lijst[i].join(' '))), alle = lijst.map((_, i) => i).filter(mag), vrij = alle.filter(i => !gehad.includes(vak + i));
    const i = pick(vrij.length ? vrij : alle.length ? alle : lijst.map((_, i) => i));
    gehad.push(vak + i); if (gehad.length > 30) gehad.shift();
    rij = lijst[i];
  }
  const opts = shuffle(rij.slice(1));
  return {vak, q:rij[0], opts, goed:opts.indexOf(rij[1]), klaar:false};
}
// Een cijfer op je rapport. Geeft een bericht terug als je ouders boos of trots worden
export function schoolCijfer(vak, c){ S.sp.school.cijfers.push({vak, c}); return checkOuders(); }
export function checkOuders(){
  const sp = S.sp, o = sp.ouders, l = sp.school.cijfers.slice(-4).map(x => x.c);
  if (l.length < 3) return null;
  const g = gemiddelde(l);
  if (!o.boos && g < 5.5){ o.boos = true; o.trots = false; mod('focus', -10); mod('moraal', -8); return 'Je ouders zien je cijfers en zijn woest. "Eerst je school, dan pas voetbal!" Zolang je cijfers slecht zijn, mag je niet uit. En de onderwijscoach van de club houdt je rapport in de gaten.'; }
  if (o.boos && gemiddelde(l.slice(-2)) >= 6.5){ o.boos = false; mod('moraal', 6); mod('focus', 5); return 'Je ouders zien dat je cijfers weer beter worden. De ruzie is voorbij.'; }
  if (!o.boos && !o.trots && l.length >= 4 && g >= 7.5){ o.trots = true; mod('moraal', 6); return 'Je ouders zijn trots op je cijfers. Je vader hangt je rapport op de koelkast.'; }
  if (g < 7) o.trots = false;
  return null;
}
export function beantwoord(i){
  const v = S.week.school; if (!v || v.klaar) return;
  const goed = i === v.goed;
  v.klaar = true; v.gekozen = i;
  v.cijfer = goed ? Math.min(10, Math.round((randInt(65, 92) / 10 + (S.week.huiswerk ? .5 : 0)) * 10) / 10) : randInt(25, 54) / 10;
  if (goed) mod('focus', 2);
  v.uitleg = goed ? `Goed! Je haalt een ${fmt1(v.cijfer)} voor ${vakKlein(v.vak)}.` : `Fout. Het goede antwoord was: ${v.opts[v.goed]}. Je haalt een ${fmt1(v.cijfer)} voor ${vakKlein(v.vak)}.`;
  const t = schoolCijfer(v.vak, v.cijfer); if (t) S.week.tekst.push(t);
}
export function spijbelen(){
  const sp = S.sp, v = S.week.school; if (!v || v.klaar) return;
  v.klaar = true; v.gekozen = -1; v.cijfer = 1;
  mod('moraal', 3);
  v.uitleg = `Je spijbelt. Voor ${vakKlein(v.vak)} krijg je een 1,0.`;
  const t = schoolCijfer(v.vak, 1);
  if (t) S.week.tekst.push(t);
  else if (!sp.ouders.boos && rnd() < .5){ sp.ouders.boos = true; mod('focus', -8); mod('moraal', -6); S.week.tekst.push('School belt je ouders dat je spijbelde. Thuis krijg je flinke ruzie: voorlopig mag je niet meer uit.'); }
}
export function haalFoutWeg(v){
  const fout = v.opts.map((_, i) => i).filter(i => i !== v.goed);
  if (fout.length < 2) return;
  const weg = pick(fout), goedTxt = v.opts[v.goed];
  v.opts.splice(weg, 1); v.goed = v.opts.indexOf(goedTxt);
}
