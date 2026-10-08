/* ===================== Gegevens ===================== */
// Niveaus van hoog (0) naar laag (5)
export const DIVS   = ['Europese Elite', 'Topdivisie', 'Eerste Divisie', 'Tweede Divisie', 'Amateurklasse', 'Jeugdcompetitie O19'];
export const NIVEAU = ['Wereldtop', 'Prof', 'Prof', 'Semi-prof', 'Amateur', 'Jeugd'];
export const JEUGD = 5, AMATEUR = 4;
export const MIN  = [78, 67, 58, 50, 43, 0];       // klasse die nodig is om interesse te wekken
export const REF  = [82, 70, 60, 51, 43, 33];      // referentie-klasse voor salaris
export const BASE = [3000000, 450000, 70000, 22000, 3000, 400]; // jaarbedrag bij referentie
export const CLUBS = [
  {n:'Real Montclaro',t:0,s:90},{n:'AC Vellano',t:0,s:88},{n:'FC Nordhavn',t:0,s:86},{n:'Olympique Lumière',t:0,s:85},
  {n:'Sporting Alvor',t:0,s:83},{n:'Dynamo Kravets',t:0,s:82},{n:'Rapid Steinau',t:0,s:80},{n:'Celtic Harbour',t:0,s:79},
  {n:'FC Lagewaard',t:1,s:78},{n:'Sparta Dijkstad',t:1,s:76},{n:'FC Polderstad',t:1,s:75},{n:'SC Heideveld',t:1,s:74},
  {n:'Quick Duinwijk',t:1,s:72},{n:'Fortuna Molenburg',t:1,s:71},{n:'Achilles Veenhoven',t:1,s:69},{n:'Victoria Zoutkamp',t:1,s:68},
  {n:'RKSV Dijkzicht',t:2,s:66},{n:'FC Turfhaven',t:2,s:64},{n:'VV De Brug',t:2,s:63},{n:'SC Wadden',t:2,s:62},
  {n:'Union Kreekrak',t:2,s:60},{n:'FC Grasdorp',t:2,s:59},{n:'Hercules Zandvoorde',t:2,s:58},{n:'Rapid Ruigoord',t:2,s:56},
  {n:'SV Lindenoord',t:3,s:55},{n:'FC Molenkade',t:3,s:54},{n:'SC Dijkwerker',t:3,s:53},{n:'VV Zeewind',t:3,s:52},
  {n:'Rood-Wit Hoeve',t:3,s:51},{n:'SV Grenswacht',t:3,s:50},{n:'FC Vlietland',t:3,s:49},{n:'ASV Klaproos',t:3,s:48},
  {n:'VV Koeienwei',t:4,s:47},{n:'SV De Klomp',t:4,s:46},{n:'VV Modderveld',t:4,s:45},{n:'FC Bierbuik',t:4,s:44},
  {n:'SV Zaterdagmiddag',t:4,s:43},{n:'FC Kantine',t:4,s:42},{n:'VV Bitterbal',t:4,s:41},{n:'SC Regenjas',t:4,s:40}
];
// Jeugdteams (O19) van de amateurclubs
CLUBS.filter(c => c.t === AMATEUR).map(c => CLUBS.indexOf(c)).forEach((id, i) => CLUBS.push({n:CLUBS[id].n + ' O19', t:JEUGD, s:37 - i, ouder:id}));
// Startniveau en -sterkte van elke club. Door promotie en degradatie verandert dat; de stand van zaken staat in S.clubs
export const CLUBS_BASIS = CLUBS.map(c => [c.t, c.s]);
export function zetClubs(lijst){ (lijst || CLUBS_BASIS).forEach(([t, s], i) => { if (CLUBS[i]){ CLUBS[i].t = t; CLUBS[i].s = s; } }); }

export const ATTR = {afw:'Afwerking', pas:'Passen', drib:'Dribbelen', verd:'Verdedigen', cond:'Conditie', kalm:'Kalmte'};
export const TRAINBAAR = ['afw', 'pas', 'drib', 'verd', 'cond'];
export const POS = {
  SPITS:{n:'Spits',        w:{afw:.40, drib:.25, pas:.15, cond:.15, verd:.05}, start:{afw:44,drib:40,pas:33,verd:22,cond:38}},
  MID:  {n:'Middenvelder', w:{pas:.40, drib:.20, afw:.15, verd:.10, cond:.15}, start:{afw:33,drib:39,pas:44,verd:31,cond:39}},
  VERD: {n:'Verdediger',   w:{verd:.45, pas:.20, cond:.20, drib:.10, afw:.05}, start:{afw:24,drib:29,pas:35,verd:44,cond:41}}
};
export const MOMENT_POOL = {
  SPITS:{rand:3, eenOpEen:1.5, corner:1.5, vrijeTrap:1, counter:1.5, penalty:.4, kopduel:1, volley:1, provocatie:.5, keeperFout:.3, tackle:1, opstootje:.4},
  MID:  {rand:2, counter:2.5, vrijeTrap:1.5, corner:1, verdedigen:1, eenOpEen:.7, kopduel:1, volley:1, diepteBal:1.5, provocatie:.5, tackle:1.6, opstootje:.5},
  VERD: {verdedigen:3, verdCorner:1.5, counter:1.5, corner:1, kopduel:1.5, provocatie:.6, opbouw:1.5, tackle:2, opstootje:.5}
};
export const TEAMGENOTEN = ['De Vries','Bakker','El Amrani','Jansen','Mulder','Bosman','Kaya','Visser','Smit','Mendes','Van Dijkhuizen','Okafor','Hendriks','Yilmaz'];
export const TEGENSTANDERS = ['Van Leeuwen','Hoekstra','Dekker','Brouwer','Peters','Willems','Koster','Postma','Lindqvist','Moreno','Rossi','Kowalski','Haddad','Fischer','Nkosi','Carvalho'];
export const MEIDEN = ['Sanne','Lotte','Noa','Yara','Fleur','Mila','Lina','Emma','Sara','Imane','Julia','Zoë'];
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
export const AANV = 4, LEGENDE = 5; // index van aanvoerder en clublegende
// Startwaarde voor de opstelling per statusniveau (basisplaats vanaf 50)
export const OPST_BASIS = [22, 36, 60, 68, 76, 72];
// Nationale teams met sterkte (hoe hoger, hoe moeilijker om opgeroepen te worden)
export const LANDEN = [
  {n:'Nederland',s:84},{n:'België',s:83},{n:'Duitsland',s:85},{n:'Frankrijk',s:88},{n:'Spanje',s:87},{n:'Engeland',s:86},
  {n:'Portugal',s:85},{n:'Italië',s:84},{n:'Brazilië',s:87},{n:'Argentinië',s:88},{n:'Kroatië',s:80},{n:'Marokko',s:80},
  {n:'Turkije',s:77},{n:'Senegal',s:77},{n:'Japan',s:78},{n:'Polen',s:75},{n:'Nigeria',s:75},{n:'Ghana',s:72},
  {n:'Kaapverdië',s:67},{n:'Curaçao',s:63},{n:'Suriname',s:61},{n:'Indonesië',s:59}
];
export const LANDEN_LIJST = ['Nederland', ...LANDEN.map(l => l.n).filter(n => n !== 'Nederland').sort((a, b) => a.localeCompare(b, 'nl'))];
export const landInfo = n => LANDEN.find(l => l.n === n) || {n, s:70};
export const AGENT = 'Rik Verbeek';
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

export function genRounds(){
  const n = 8; let l = [0,1,2,3,4,5,6,7]; const eerste = [];
  for (let r = 0; r < n - 1; r++){
    const pr = [];
    for (let i = 0; i < n / 2; i++){ const a = l[i], b = l[n - 1 - i]; pr.push((r + i) % 2 ? [b, a] : [a, b]); }
    eerste.push(pr);
    l = [l[0], l[n - 1], ...l.slice(1, n - 1)];
  }
  return eerste.concat(eerste.map(pr => pr.map(([a, b]) => [b, a])));
}
export const ROUNDS = genRounds(); // 14 speelrondes
export const AANTAL_RONDES = ROUNDS.length;
export const divClubs = t => CLUBS.map((c, i) => i).filter(i => CLUBS[i].t === t);
