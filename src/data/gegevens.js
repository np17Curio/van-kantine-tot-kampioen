/* ===================== Gegevens ===================== */
// Niveaus van hoog (0) naar laag (2)
// Per land twee leagues met het echte aantal clubs; elke club heeft daarnaast een O23 (sp.o23)
export const DIVS   = ['Europese Elite', 'Topdivisie', 'Eerste Divisie'];
export const NIVEAU = ['Wereldtop', 'Prof', 'Prof'];
export const LAAGSTE = 2; // de laagste league
export const MIN  = [78, 67, 58];       // klasse die nodig is om interesse te wekken
export const REF  = [82, 70, 60];       // referentie-klasse voor salaris
export const BASE = [3000000, 450000, 70000]; // jaarbedrag bij referentie
// Hoeveel clubs per league (zoals in het echt, seizoen 2026/27) en wie er promoveert en degradeert.
// omlaag/omhoog: zoveel clubs wisselen direct. po: de nacompetitie, vereenvoudigd:
//   barrage: één wedstrijd tussen nr. `boven` van de hoogste league en nr. `onder` van de 2e league (wint de lagere club, dan wisselen ze)
//   playoff: nr. `van` tot `tot` van de 2e league spelen halve finales en een finale; de winnaar promoveert
export const LIGA = {
  Nederland:{n:[18, 20], omlaag:2, omhoog:2, po:{soort:'barrage', boven:16, onder:3}},
  'België': {n:[18, 16], omlaag:1, omhoog:1, po:{soort:'barrage', boven:17, onder:2}},
  Engeland: {n:[20, 24], omlaag:3, omhoog:2, po:{soort:'playoff', van:3, tot:6}},
  Duitsland:{n:[18, 18], omlaag:2, omhoog:2, po:{soort:'barrage', boven:16, onder:3}},
  Frankrijk:{n:[18, 18], omlaag:2, omhoog:2, po:{soort:'barrage', boven:16, onder:3}},
  Spanje:   {n:[20, 22], omlaag:3, omhoog:2, po:{soort:'playoff', van:3, tot:6}},
  'Italië': {n:[20, 20], omlaag:3, omhoog:2, po:{soort:'playoff', van:3, tot:6}},
  Portugal: {n:[18, 18], omlaag:2, omhoog:2, po:{soort:'barrage', boven:16, onder:3}},
  Turkije:  {n:[18, 20], omlaag:3, omhoog:2, po:{soort:'playoff', van:3, tot:6}},
  'Tsjechië':{n:[16, 16], omlaag:1, omhoog:1, po:{soort:'barrage', boven:15, onder:2}},
  Griekenland:{n:[14, 16], omlaag:2, omhoog:2, po:{soort:'barrage', boven:12, onder:3}},
  Polen:    {n:[18, 18], omlaag:3, omhoog:2, po:{soort:'playoff', van:3, tot:6}},
  Denemarken:{n:[12, 12], omlaag:1, omhoog:1, po:{soort:'barrage', boven:11, onder:2}},
  Noorwegen:{n:[16, 16], omlaag:2, omhoog:2, po:{soort:'barrage', boven:14, onder:3}},
  Zwitserland:{n:[12, 10], omlaag:1, omhoog:1, po:{soort:'barrage', boven:11, onder:2}},
  // Noord-Amerika: gesloten competities, zoals in het echt (geen promotie en degradatie). 18 clubs: 34 wedstrijden, net als de echte MLS en Liga MX
  Mexico:   {n:[18, 16], omlaag:0, omhoog:0, po:{soort:'geen'}},
  'Verenigde Staten':{n:[18, 18], omlaag:0, omhoog:0, po:{soort:'geen'}},
};
// Het vrouwenvoetbal: dezelfde clubs (met " Vrouwen" achter de naam), met het echte aantal clubs per league (vereenvoudigd, 2026/27)
export const LIGA_V = {
  Nederland:{n:[12, 12], omlaag:1, omhoog:1, po:{soort:'barrage', boven:11, onder:2}},
  'België': {n:[10, 12], omlaag:1, omhoog:1, po:{soort:'barrage', boven:9, onder:2}},
  Engeland: {n:[14, 12], omlaag:1, omhoog:1, po:{soort:'barrage', boven:13, onder:2}},
  Duitsland:{n:[14, 14], omlaag:2, omhoog:2, po:{soort:'barrage', boven:12, onder:3}},
  Frankrijk:{n:[12, 12], omlaag:2, omhoog:2, po:{soort:'barrage', boven:10, onder:3}},
  Spanje:   {n:[16, 16], omlaag:2, omhoog:2, po:{soort:'playoff', van:3, tot:6}},
  'Italië': {n:[12, 14], omlaag:1, omhoog:1, po:{soort:'barrage', boven:11, onder:2}},
  Portugal: {n:[12, 12], omlaag:2, omhoog:2, po:{soort:'barrage', boven:10, onder:3}},
  Turkije:  {n:[14, 12], omlaag:2, omhoog:2, po:{soort:'barrage', boven:12, onder:3}},
  'Tsjechië':{n:[10, 10], omlaag:1, omhoog:1, po:{soort:'barrage', boven:9, onder:2}},
  Griekenland:{n:[10, 10], omlaag:1, omhoog:1, po:{soort:'barrage', boven:9, onder:2}},
  Polen:    {n:[12, 12], omlaag:2, omhoog:2, po:{soort:'barrage', boven:10, onder:3}},
  Denemarken:{n:[10, 10], omlaag:1, omhoog:1, po:{soort:'barrage', boven:9, onder:2}},
  Noorwegen:{n:[10, 12], omlaag:1, omhoog:1, po:{soort:'barrage', boven:9, onder:2}},
  Zwitserland:{n:[10, 10], omlaag:1, omhoog:1, po:{soort:'barrage', boven:9, onder:2}},
  Mexico:   {n:[18, 12], omlaag:0, omhoog:0, po:{soort:'geen'}},
  'Verenigde Staten':{n:[16, 10], omlaag:0, omhoog:0, po:{soort:'geen'}},
};
// De wereld van deze carrière ('m' of 'v'). Live: zetWereld (bij een nieuw spel en bij het laden, vóór zetClubs)
export let WERELD = 'm';
export function zetWereld(g){ WERELD = g === 'v' ? 'v' : 'm'; zetLandSterkteWereld(); }
export const isVrouwenWereld = () => WERELD === 'v';
// Geld in het vrouwenvoetbal: salarissen, transfersommen en budgetten zijn een stuk lager
export const geldF = () => WERELD === 'v' ? .1 : 1;
// De naam van een club in deze wereld: in het vrouwenvoetbal het vrouwenteam van die club
export const clubNaam = n => WERELD === 'v' && n && n !== 'Lege plaats' && !/ Vrouwen$/.test(n) ? n + ' Vrouwen' : n;
export const zonderVrouwen = n => String(n || '').replace(/ Vrouwen$/, '');
export const ligaVan = land => (WERELD === 'v' ? LIGA_V[land] || LIGA_V.Nederland : LIGA[land] || LIGA.Nederland);
export const MAX_LAND = Math.max(...Object.values(LIGA).map(l => l.n[0] + l.n[1])); // zoveel plaatsen voor de clubs van een land (Engeland: 44)
export const clubsLand = land => 8 + ligaVan(land).n[0] + ligaVan(land).n[1]; // de clubs 8 tot hier spelen in de leagues van dat land
// Nederlandse clubs, van sterk naar zwak (de andere landen staan in landen.js)
export const NL_CLUBS = ['FC Lagewaard', 'Sparta Dijkstad', 'FC Polderstad', 'SC Heideveld', 'Quick Duinwijk', 'Fortuna Molenburg', 'Achilles Veenhoven', 'Victoria Zoutkamp',
  'RKSV Dijkzicht', 'FC Turfhaven', 'VV De Brug', 'SC Wadden', 'Union Kreekrak', 'FC Grasdorp', 'Hercules Zandvoorde', 'Rapid Ruigoord', 'SV Lindenoord', 'FC Molenkade',
  'SC Dijkwerker', 'VV Zeewind', 'Rood-Wit Hoeve', 'SV Grenswacht', 'FC Vlietland', 'ASV Klaproos', 'FC Eemvallei', 'SV Haringvliet', 'VV Peelrand', 'SC Kempenhorst',
  'FC Waterland', 'RKVV Maasbracht', 'VV Koeienwei', 'SV De Klomp', 'VV Modderveld', 'FC Bierbuik', 'SV Zaterdagmiddag', 'SC Polderwind', 'VV Bitterbal', 'SC Regenjas'];
export const CLUBS = [
  // (0-7: de plaatsen van de oude Europese Elite; die bestaat niet meer, de clubs spelen nu in de competitie van hun eigen land)
  {n:'Real Montclaro',t:-1,s:90},{n:'AC Vellano',t:-1,s:88},{n:'FC Nordhavn',t:-1,s:86},{n:'Olympique Lumière',t:-1,s:85},
  {n:'Sporting Alvor',t:-1,s:83},{n:'Dynamo Kravets',t:-1,s:82},{n:'Rapid Steinau',t:-1,s:80},{n:'Celtic Harbour',t:-1,s:79},
];
// De plaatsen voor de clubs van je land. Niveau en sterkte komen uit landBasis; een land met minder clubs laat de rest leeg (t = -2)
for (let i = 0; i < MAX_LAND; i++) CLUBS.push({n:NL_CLUBS[i] || 'Lege plaats', t:-2, s:40});
export const CLUBS_LAND = 8 + MAX_LAND; // alle plaatsen (ook de lege): gebruik clubsLand(land) voor een land
// Gastplaatsen voor de Champions League en de Europa Cup: elk seizoen de topclubs uit de andere landen (geen competitie)
export const GAST_START = CLUBS.length, GASTEN = 20;
for (let i = 0; i < GASTEN; i++) CLUBS.push({n:'Europese gast', t:-1, s:75, gast:null});
export const isGast = id => id >= GAST_START && id < GAST_START + GASTEN;
// De topclubs van de oude Elite spelen in de hoogste competitie van hun eigen land (op plaats ELITE_ID)
export const ELITE_THUIS = {Spanje:{n:'Real Montclaro', s:91}, 'Italië':{n:'AC Vellano', s:89}, Frankrijk:{n:'Olympique Lumière', s:88}, Portugal:{n:'Sporting Alvor', s:83}, Duitsland:{n:'Rapid Steinau', s:89}, Engeland:{n:'Celtic Harbour', s:91}};
export const ELITE_ID = 15;
// Het niveau van elk land, naar de UEFA-landenranking (vijf jaar clubcoëfficiënt, 2025/26: Engeland ±117, Italië ±100,
// Spanje ±96, Duitsland ±92, Frankrijk ±83, Portugal ±73, Nederland ±68, België ±62, Turkije ±52, Tsjechië ±48, Griekenland ±46,
// Polen ±44, Denemarken ±40, Noorwegen ±40, Zwitserland ±36): sterkte van de beste en de slechtste club per league
export const LAND_NIVEAU = {
  Engeland:{t1:[88, 74], t2:[73, 60]}, 'Italië':{t1:[86, 70], t2:[67, 54]}, Spanje:{t1:[86, 68], t2:[66, 53]}, Duitsland:{t1:[85, 69], t2:[67, 55]},
  Frankrijk:{t1:[83, 66], t2:[64, 52]}, Portugal:{t1:[79, 62], t2:[60, 49]}, Nederland:{t1:[80, 64], t2:[63, 51]}, 'België':{t1:[77, 62], t2:[60, 49]},
  // (Turkije: grote topclubs en veel verschil; Polen: een vlakke league; Noorwegen: één uitschieter)
  Turkije:{t1:[78, 60], t2:[58, 47]}, 'Tsjechië':{t1:[75, 58], t2:[56, 45]}, Griekenland:{t1:[75, 57], t2:[54, 44]}, Polen:{t1:[72, 58], t2:[56, 45]},
  Denemarken:{t1:[73, 57], t2:[55, 45]}, Noorwegen:{t1:[73, 55], t2:[53, 43]}, Zwitserland:{t1:[72, 56], t2:[53, 43]},
  // Noord-Amerika: de Liga MX en de MLS zitten ongeveer op het niveau van de subtop van Europa (Portugal, België)
  Mexico:{t1:[76, 60], t2:[57, 46]}, 'Verenigde Staten':{t1:[75, 60], t2:[57, 46]},
};
// Het vrouwenvoetbal, naar de UEFA-ranking voor vrouwen (Spanje, Engeland, Frankrijk en Duitsland bovenaan)
export const LAND_NIVEAU_V = {
  Spanje:{t1:[88, 62], t2:[60, 48]}, Engeland:{t1:[86, 64], t2:[62, 50]}, Frankrijk:{t1:[85, 60], t2:[58, 47]}, Duitsland:{t1:[84, 62], t2:[60, 48]},
  Nederland:{t1:[76, 58], t2:[56, 46]}, 'Italië':{t1:[76, 58], t2:[56, 46]}, Noorwegen:{t1:[72, 55], t2:[54, 44]}, Portugal:{t1:[70, 55], t2:[53, 44]},
  Denemarken:{t1:[70, 54], t2:[52, 43]}, 'België':{t1:[70, 54], t2:[52, 43]}, Zwitserland:{t1:[68, 53], t2:[51, 42]}, 'Tsjechië':{t1:[68, 52], t2:[50, 42]},
  Polen:{t1:[64, 51], t2:[50, 41]}, Turkije:{t1:[62, 50], t2:[49, 40]}, Griekenland:{t1:[58, 48], t2:[47, 39]},
  // de NWSL is een van de sterkste vrouwencompetities ter wereld
  'Verenigde Staten':{t1:[87, 66], t2:[60, 48]}, Mexico:{t1:[68, 52], t2:[50, 41]},
};
export const niveauVan = land => (WERELD === 'v' ? LAND_NIVEAU_V[land] || LAND_NIVEAU_V.Nederland : LAND_NIVEAU[land] || LAND_NIVEAU.Nederland);
// Startniveau en -sterkte van elke club in een land (LAND_NIVEAU). Door promotie en degradatie verandert dat; de stand van zaken staat in S.clubs
export function landBasis(land){
  const [n1, n2] = ligaVan(land).n, e = ELITE_THUIS[land], N = niveauVan(land);
  const b = CLUBS.map((c, i) => i < 8 ? [-1, [90, 88, 86, 85, 83, 82, 80, 79][i]] : i >= GAST_START ? [-1, 75] : [-2, 40]);
  for (let k = 0; k < n1; k++) b[8 + k] = [1, Math.round(N.t1[0] - k * (N.t1[0] - N.t1[1]) / (n1 - 1))];
  for (let k = 0; k < n2; k++) b[8 + n1 + k] = [2, Math.round(N.t2[0] - k * (N.t2[0] - N.t2[1]) / (n2 - 1))];
  if (e && WERELD !== 'v') b[ELITE_ID] = [1, e.s]; // (de oude Elite-club: alleen bij de mannen)
  return b;
}
export const CLUBS_BASIS = landBasis('Nederland');
// Oude opslag (iedereen 80-66 en 65-52): de sterktes omrekenen naar het niveau van het land; elke club houdt zijn plek in de league
export function herschaalLand(lijst, land){
  if (!lijst) return lijst; const N = niveauVan(land), e = ELITE_THUIS[land];
  const om = (s, [oh, ol], [nh, nl]) => Math.round(nl + (s - ol) * (nh - nl) / (oh - ol));
  return lijst.map((x, i) => { if (!x || i < 8 || i >= GAST_START || !(x[0] >= 1)) return x;
    const s = x[0] === 1 ? om(x[1], [80, 66], N.t1) : om(x[1], [65, 52], N.t2);
    return [x[0], Math.max(30, Math.min(95, i === ELITE_ID && e ? Math.max(s, e.s) : s))]; });
}
CLUBS_BASIS.forEach(([t, s], i) => { CLUBS[i].t = t; CLUBS[i].s = s; }); // de startstand (Nederland), tot zetClubs een land zet
// Thuisland van de vaste clubs uit de Europese Elite (0-7): één competitie met topclubs uit heel Europa
export const ELITE_NAAM = CLUBS.slice(0, 8).map(c => c.n); // de oorspronkelijke namen (een plaats kan van club wisselen)
export const ELITE_LAND = ['Spanje', 'Italië', 'Denemarken', 'Frankrijk', 'Portugal', 'Oekraïne', 'Duitsland', 'Engeland'];
export function zetClubs(lijst){ (lijst || CLUBS_BASIS).forEach(([t, s], i) => { if (CLUBS[i]){ CLUBS[i].t = t; CLUBS[i].s = s; } }); zetKalender(); }

export const ATTR = {afw:'Afwerking', pas:'Passen', drib:'Dribbelen', verd:'Verdedigen', cond:'Conditie', kalm:'Kalmte'};
export const TRAINBAAR = ['afw', 'pas', 'drib', 'verd', 'cond'];
// Een keeper heeft dezelfde eigenschappen, met andere namen: afwerking = positiespel, verdedigen = reflexen, enzovoort
export const KEEPER_ATTR = {afw:'Positiespel', pas:'Uittrappen', drib:'Voetenwerk', verd:'Reflexen', cond:'Sprongkracht', kalm:'Kalmte'};
export const attrNaam = (k, pos) => (pos === 'KEEPER' ? KEEPER_ATTR : ATTR)[k] || ATTR[k] || k;
// Op welke linie speelt een positie (K, V, M, A in de selecties)
export const LINIE_VAN = {SPITS:'A', MID:'M', VERD:'V', KEEPER:'K'};
export const POS = {
  SPITS:{n:'Spits',        w:{afw:.40, drib:.25, pas:.15, cond:.15, verd:.05}, start:{afw:44,drib:40,pas:33,verd:22,cond:38}},
  MID:  {n:'Middenvelder', w:{pas:.40, drib:.20, afw:.15, verd:.10, cond:.15}, start:{afw:33,drib:39,pas:44,verd:31,cond:39}},
  VERD: {n:'Verdediger',   w:{verd:.45, pas:.20, cond:.20, drib:.10, afw:.05}, start:{afw:24,drib:29,pas:35,verd:44,cond:41}},
  KEEPER:{n:'Keeper',      w:{verd:.35, afw:.25, pas:.15, cond:.15, drib:.10}, start:{afw:40,drib:28,pas:35,verd:44,cond:38}}
};
export const MOMENT_POOL = {
  SPITS:{rand:3, eenOpEen:1.5, corner:1.5, vrijeTrap:1, counter:1.5, penalty:.4, kopduel:1, volley:1, provocatie:.5, keeperFout:.3, tackle:1, opstootje:.4},
  MID:  {rand:2, counter:2.5, vrijeTrap:1.5, corner:1, verdedigen:1, eenOpEen:.7, kopduel:1, volley:1, diepteBal:1.5, provocatie:.5, tackle:1.6, opstootje:.5},
  VERD: {verdedigen:3, verdCorner:1.5, counter:1.5, corner:1, kopduel:1.5, provocatie:.6, opbouw:1.5, tackle:2, opstootje:.5},
  KEEPER:{redding:3, eenOpEenKeeper:1.4, hogeBal:2, penaltyKeeper:.35, uittrap:1.5, terugspeel:1, provocatie:.3, opstootje:.2}
};
export const TEAMGENOTEN = ['De Vries','Bakker','El Amrani','Jansen','Mulder','Bosman','Kaya','Visser','Smit','Mendes','Van Dijkhuizen','Okafor','Hendriks','Yilmaz'];
export const TEGENSTANDERS = ['Van Leeuwen','Hoekstra','Dekker','Brouwer','Peters','Willems','Koster','Postma','Lindqvist','Moreno','Rossi','Kowalski','Haddad','Fischer','Nkosi','Carvalho'];
export const MEIDEN = ['Sanne','Lotte','Noa','Yara','Fleur','Mila','Lina','Emma','Sara','Imane','Julia','Zoë'];
export const JONGENS_LIEF = ['Thomas','Jesse','Lars','Tim','Joris','Bas','Rick','Stijn','Koen','Youssef','Niels','Mats'];
export const liefNamen = vrouw => vrouw ? MEIDEN : JONGENS_LIEF; // (namen voor een vriendin of een vriend)
// Status bij je club: punten (0-100) uit prestaties, plus tijd bij de club
export const STATUS = [
  {min:0,  n:'Nieuwkomer'},
  {min:15, n:'Bankspeler'},
  {min:35, n:'Vaste waarde'},
  {min:55, n:'Fanfavoriet'},
  {min:75, n:'Aanvoerder'},
  {min:90, n:'Clublegende'}
];
export const STATUS_KORT = ['Jonkie', 'Bank&shy;speler', 'Vaste waarde', 'Fan&shy;favoriet', 'Aan&shy;voerder', 'Club&shy;legende'];
// Wat betekent elke status? (elke stap is een stap omhoog)
export const STATUS_UITLEG = ['Je zit meestal op de tribune of op de bank en valt hooguit eens in.', 'Je bent een vaste wissel: je valt regelmatig in en maakt kans op een basisplaats.', 'Je staat in de basis.', 'Je staat in de basis en de fans zingen je naam.', 'Jij draagt de aanvoerdersband.', 'Je naam staat voor altijd in de clubboeken.'];
export const STATUS_ROL = ['nieuw in de groep', 'vaste wissel', 'basisspeler', 'publiekslieveling', 'de leider van het team', 'een legende'];
export const AANV = 4, LEGENDE = 5; // index van aanvoerder en clublegende
// Startwaarde voor de opstelling per statusniveau (basisplaats vanaf 50)
export const OPST_BASIS = [22, 36, 60, 68, 76, 72];
// Nationale teams met sterkte (hoe hoger, hoe moeilijker om opgeroepen te worden)
export const LANDEN = [
  {n:'Nederland',s:84},{n:'België',s:83},{n:'Duitsland',s:85},{n:'Frankrijk',s:88},{n:'Spanje',s:87},{n:'Engeland',s:86},
  {n:'Portugal',s:85},{n:'Italië',s:84},{n:'Brazilië',s:87},{n:'Argentinië',s:88},{n:'Kroatië',s:80},{n:'Marokko',s:80},
  {n:'Turkije',s:77},{n:'Senegal',s:77},{n:'Japan',s:78},{n:'Polen',s:75},{n:'Nigeria',s:75},{n:'Ghana',s:72},
  {n:'Zwitserland',s:80},{n:'Denemarken',s:79},{n:'Noorwegen',s:77},{n:'Tsjechië',s:75},{n:'Griekenland',s:74},
  {n:'Kaapverdië',s:67},{n:'Curaçao',s:63},{n:'Suriname',s:61},{n:'Indonesië',s:59}
];
export const LANDEN_LIJST = ['Nederland', ...LANDEN.map(l => l.n).filter(n => n !== 'Nederland').sort((a, b) => a.localeCompare(b, 'nl'))];
// De nationale teams bij de vrouwen (de sterkte; landen die er niet in staan houden hun sterkte)
export const LAND_S_V = {Nederland:84, 'België':77, Duitsland:88, Frankrijk:86, Spanje:90, Engeland:89, Portugal:76, 'Italië':80, 'Brazilië':84, 'Argentinië':72, 'Kroatië':66, Marokko:70,
  Turkije:64, Senegal:60, Japan:85, Polen:72, Nigeria:74, Ghana:66, 'Kaapverdië':55, 'Curaçao':52, Suriname:50, 'Indonesië':50, Zwitserland:76, Denemarken:80, Noorwegen:80, 'Tsjechië':72, Griekenland:62,
  Oostenrijk:76, Schotland:75, 'Servië':70, 'Oekraïne':70, Zweden:87, Wales:73, Hongarije:66, Uruguay:64, Colombia:76, Ecuador:62, Chili:70, Paraguay:66, Peru:58, Venezuela:66, Bolivia:54,
  Egypte:58, Algerije:62, Ivoorkust:62, Kameroen:68, 'Tunesië':60, Mali:58, 'Zuid-Afrika':72, 'DR Congo':58, 'Zuid-Korea':76, Iran:62, 'Australië':82, 'Saoedi-Arabië':50, Qatar:50, Irak:50,
  Oezbekistan:62, China:79, Vietnam:68, 'Verenigde Staten':90, Mexico:74, Canada:83, Panama:64, 'Costa Rica':68, Jamaica:70, Honduras:55, 'Haïti':64};
export const nationS = (n, s) => WERELD === 'v' && LAND_S_V[n] != null ? LAND_S_V[n] : s;
const LANDEN_M = LANDEN.map(l => l.s);
function zetLandSterkteWereld(){ LANDEN.forEach((l, i) => { l.s = nationS(l.n, LANDEN_M[i]); }); }
export const landInfo = n => LANDEN.find(l => l.n === n) || {n, s:70};
export const AGENT = 'Rik Verbeek'; // je eerste zaakwaarnemer (bij de laatbloeier: je oude vriend)
// De zaakwaarnemers waar je later naartoe kunt (game/transfers/zaakwaarnemer.js). Een betere neemt je pas als je goed genoeg
// bent (klasse en reputatie) en vraagt meer provisie (een deel van je salaris), maar onderhandelt beter (onderh: kans bij het
// onderhandelen), haalt clubs van verder weg (bereik: zoveel niveaus boven je eigen club) en krijgt lagere eisen los (korting).
export const AGENTEN = [
  {id:'rik', n:AGENT, v:false, klasse:0, rep:0, provisie:.03, onderh:.05, bereik:2, korting:0,
    d:'Je oude vriend. Net begonnen als zaakwaarnemer, maar hij gelooft in je.', ja:'"Ik wist dat je terug zou komen. Welkom thuis."'},
  {id:'esther', n:'Esther de Groot', v:true, klasse:64, rep:20, provisie:.05, onderh:.10, bereik:2, korting:.05,
    d:'Kent elke trainer in de eigen competitie. Zakelijk, maar eerlijk.', ja:'"Ik heb je zien spelen. Jij gaat nog een paar stappen maken, en ik help je daarbij."',
    nee:'"Je bent goed, maar nog niet goed genoeg voor mij. Kom terug als je echt indruk maakt."'},
  {id:'bellini', n:'Marco Bellini', v:false, klasse:74, rep:40, provisie:.08, onderh:.15, bereik:3, korting:.10,
    d:'Een internationaal netwerk: van Lissabon tot Londen. Haalt clubs binnen die eigenlijk nog te hoog lijken.', ja:'"Benvenuto! Met jou ga ik Europa veroveren."',
    nee:'"Ik werk alleen met spelers die Europa kunnen halen. Nog niet, amico."'},
  {id:'ferraro', n:'Lucas Ferraro', v:false, klasse:83, rep:65, provisie:.10, onderh:.20, bereik:3, korting:.15,
    d:'De bekendste zaakwaarnemer van de wereld. Werkt alleen met de absolute top.', ja:'"Welkom bij de wereldtop. Vanaf nu gaan we voor de grootste clubs."',
    nee:'"Ik heb je naam gehoord. Maar ik werk alleen met de beste spelers van de wereld."'},
];
export const WINKEL_GROEPEN = ['Training en gezondheid', 'Lifestyle', 'Groot geld'];
export const WINKEL = [
  {id:'schoenen',   g:'Training en gezondheid', n:'Nieuwe kicksen',              prijs:250,      d:'+2 afwerking, +1 dribbelen'},
  {id:'fysio',      g:'Training en gezondheid', n:'Eigen fysiotherapeut',        prijs:30000,    d:'+8 extra fitheid per week'},
  {id:'fitness',    g:'Training en gezondheid', n:'Eigen fitnessruimte',         prijs:40000,    d:'Trainen kost 3 fitheid minder'},
  {id:'meditatie',  g:'Training en gezondheid', n:'Meditatie-app',               prijs:60,       d:'Elke week +1 focus (tot focus 75)'},
  {id:'matras',     g:'Training en gezondheid', n:'Goed matras',                 prijs:1200,     d:'Beter slapen: elke week +2 fitheid en +1 focus (tot focus 75)'},
  {id:'mentaal',    g:'Training en gezondheid', n:'Mentale coach',               prijs:45000,    d:'+6 kalmte in wedstrijden en gratis sessies bij de sportpsycholoog'},
  {id:'trainer',    g:'Training en gezondheid', n:'Personal trainer',            prijs:80000,    d:'Trainingen leveren vaker iets op'},
  {id:'hoogtekamer',g:'Training en gezondheid', n:'Hoogtekamer om in te slapen', prijs:120000,   d:'+4 fitheid per week'},
  {id:'kok',        g:'Training en gezondheid', n:'Privékok',                    prijs:150000,   d:'+3 conditie, trager verval na je 30e'},
  {id:'analist',    g:'Training en gezondheid', n:'Eigen video-analist',         prijs:250000,   d:'Je acties in wedstrijden lukken iets vaker'},
  {id:'console',    g:'Lifestyle',              n:'Gameconsole',                 prijs:600,      d:'+4 moraal, maar soms game je te lang door'},
  {id:'telefoon',   g:'Lifestyle',              n:'Nieuwste telefoon',           prijs:1200,     d:'+3 moraal'},
  {id:'kleding',    g:'Lifestyle',              n:'Designerkleding',             prijs:15000,    d:'+2 reputatie'},
  {id:'horloge',    g:'Lifestyle',              n:'Luxe horloge',                prijs:25000,    d:'+3 reputatie'},
  {id:'ouders',     g:'Lifestyle',              n:'Huis voor je ouders',         prijs:800000,   d:'+15 moraal. Je ouders zijn apetrots'},
  {id:'school',     g:'Groot geld',             n:'Eigen voetbalschool voor kinderen', prijs:1000000, d:'+8 reputatie en elke week +1 moraal'},
  {id:'jacht',      g:'Groot geld',             n:'Jacht',                       prijs:6000000,  d:'+5 reputatie en +10 moraal'},
  {id:'jet',        g:'Groot geld',             n:'Privéjet',                    prijs:25000000, d:'+8 reputatie, elke week +2 fitheid (minder reisstress)'}
];
// Sponsors: verzonnen merken, net als de clubs
export const SPONSOR_CAT = {
  schoenen:  {n:'Voetbalschoenen', merken:['Strikr', 'Volta Boots', 'Kapstone'],          f:1.2, perk:'+1 afwerking en +1 dribbelen'},
  kleding:   {n:'Sportkleding',    merken:['Northline', 'Kraal Sport', 'Avanti'],         f:1.0, perk:'+2 reputatie'},
  horloge:   {n:'Horloges',        merken:['Valmont Genève', 'Tijdloos', 'Heuvel & Zonen'], f:.9, perk:'+3 moraal'},
  auto:      {n:'Auto’s',          merken:['Moretti Automobili', 'Nordwagen'],            f:1.1, perk:'+3 reputatie', rijbewijs:true},
  drank:     {n:'Energiedrank',    merken:['BlitzWater', 'Zap!'],                         f:.6,  perk:'+2 fitheid per week'},
  audio:     {n:'Koptelefoons',    merken:['Bassline', 'PixelPro Audio'],                 f:.5,  perk:'+2 moraal'},
  verzorging:{n:'Haarproducten',   merken:['Kuif', 'Glans & Co'],                         f:.4,  perk:'+1 reputatie'}
};

// Speelschema voor een league van n clubs (n even): iedereen twee keer tegen iedereen, 2(n-1) rondes.
// Wie er thuis speelt, wisselt per club af: wie vorige ronde uit speelde, speelt nu thuis (anders wie de minste thuiswedstrijden heeft).
// De tweede seizoenshelft is de eerste omgekeerd, dus elk paar speelt één keer thuis en één keer uit
// Een kleine league speelt vaker tegen elkaar, zoals in het echt: 3 keer bij 12 clubs (Denemarken), 4 keer bij 10 clubs (Zwitserland)
export const keerVan = n => n <= 10 ? 4 : n <= 12 ? 3 : 2;
const SCHEMA = {}, SCHEMA_OUD = {};
export function genRounds(n = 8){
  if (SCHEMA[n]) return SCHEMA[n];
  let l = [...Array(n).keys()]; const eerste = [], thuis = Array(n).fill(0), vorig = Array(n).fill(null);
  for (let r = 0; r < n - 1; r++){
    const pr = [];
    for (let i = 0; i < n / 2; i++){
      const a = l[i], b = l[n - 1 - i];
      const h = vorig[a] !== vorig[b] ? (vorig[a] === 'U' || vorig[b] === 'T' ? a : b) : (thuis[a] <= thuis[b] ? a : b), u = h === a ? b : a;
      pr.push([h, u]); thuis[h]++; vorig[h] = 'T'; vorig[u] = 'U';
    }
    eerste.push(pr);
    l = [l[0], l[n - 1], ...l.slice(1, n - 1)];
  }
  const terug = eerste.map(pr => pr.map(([a, b]) => [b, a])), uit = [];
  for (let k = 0; k < keerVan(n); k++) uit.push(...(k % 2 ? terug : eerste));
  return SCHEMA[n] = uit;
}
// Het oude schema (thuis/uit per plaats in plaats van per club), voor een seizoen dat daar al mee begonnen is
export function genRoundsOud(n = 8){
  if (SCHEMA_OUD[n]) return SCHEMA_OUD[n];
  let l = [...Array(n).keys()]; const eerste = [];
  for (let r = 0; r < n - 1; r++){
    const pr = [];
    for (let i = 0; i < n / 2; i++){ const a = l[i], b = l[n - 1 - i]; pr.push((r + i) % 2 ? [b, a] : [a, b]); }
    eerste.push(pr);
    l = [l[0], l[n - 1], ...l.slice(1, n - 1)];
  }
  return SCHEMA_OUD[n] = eerste.concat(eerste.map(pr => pr.map(([a, b]) => [b, a])));
}
// De kalender: een seizoen heeft zoveel weken als de langste league van je land rondes heeft (Nederland 38, Engeland 46).
// Een kortere league speelt op evenredig verdeelde weken; in de andere weken heeft die league een speelvrije week.
// Live exports: ze veranderen mee met het land (zetKalender, vanuit zetClubs)
export let AANTAL_RONDES = 38;     // weken per seizoen (beginwaarde: Nederland)
export let WINTER = 19;            // na deze week: de winterstop (het transfervenster)
export let INTER_WEKEN = [11, 30]; // na deze weken: interlandperiodes
export const rondesVan = t => { const n = divClubs(t).length; return Math.max(0, keerVan(n) * (n - 1)); }; // wedstrijden per seizoen in league t
export function zetKalender(){
  AANTAL_RONDES = Math.max(rondesVan(1), rondesVan(2), 2);
  WINTER = Math.floor(AANTAL_RONDES / 2);
  INTER_WEKEN = [Math.round(AANTAL_RONDES * .3), Math.round(AANTAL_RONDES * .8)];
}
// In welke week speelt league t zijn ronde k?
const weekVan = (t, k) => { const R = rondesVan(t); return R >= AANTAL_RONDES ? k : Math.floor((k + .5) * AANTAL_RONDES / R); };
// Welke ronde speelt league t in week w (null: speelvrije week)
export function rondeInWeek(t, w){
  const R = rondesVan(t); if (!R || w < 0 || w >= AANTAL_RONDES) return null;
  if (R >= AANTAL_RONDES) return w;
  const k = Math.floor(w * R / AANTAL_RONDES); for (const x of [k, k + 1]) if (x < R && weekVan(t, x) === w) return x;
  return null;
}
// Hoeveel wedstrijden heeft league t gespeeld vóór week w?
export function rondesVoor(t, w){ const R = rondesVan(t); if (R >= AANTAL_RONDES) return Math.min(w, R); let n = 0; for (let k = 0; k < R; k++) if (weekVan(t, k) < w) n++; return n; }
// Iets dat per week groeit of zakt, ging uit van 14 weken per seizoen: zo blijft het per seizoen even snel
export const weekFactor = () => 14 / AANTAL_RONDES;
export const divClubs = t => CLUBS.map((c, i) => i).filter(i => CLUBS[i].t === t);
