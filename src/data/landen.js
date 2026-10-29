import { S } from '../core/state.js';
import { CLUBS, CLUBS_LAND, DIVS, ELITE_ID, ELITE_THUIS, LAAGSTE, NL_CLUBS, WERELD, clubNaam } from './gegevens.js';
import { BEKERS } from '../game/competitie/beker.js';
import { KRANTEN } from '../game/media/nieuws.js';
import { RODDELBLADEN } from '../game/media/roddel.js';

/* ===================== Landen: waar je opgroeit en je carrière begint ===================== */
// Elk land heeft twee leagues met het echte aantal clubs (LIGA in gegevens.js), met eigen namen voor de divisies, clubs, beker en kranten.
// De clubs staan van sterk naar zwak: de eerste n1 spelen in de hoogste league, de volgende n2 in de 2e league.
// De Europese Elite (clubs 0-7) is voor iedereen hetzelfde. Clubnamen zijn verzonnen.
export const SPEEL_LANDEN = ['Nederland', 'België', 'Engeland', 'Duitsland', 'Frankrijk', 'Spanje', 'Italië', 'Portugal', 'Turkije', 'Tsjechië', 'Griekenland', 'Polen', 'Denemarken', 'Noorwegen', 'Zwitserland'];
export const LAND_DATA = {
  'België':{divs:['Eerste Klasse', 'Tweede Klasse'], beker:'Belgische Beker',
    clubs:['Royal Scheldestad', 'Club Kempenland', 'Standaard Maasvallei', 'KAA Leiestad', 'Racing Dijlestad', 'Sporting Sambre', 'KV Kustlijn', 'OH Hageland',
      'KSV Vlasland', 'RFC Ardennen', 'KV Westflank', 'Lierse Netestad', 'Patro Haspengouw', 'FC Denderstreek', 'SK Kempenheide', 'Waasland Groen',
      'KFC Hamme-Zuid', 'SK Ronsevelde', 'RC Tienenberg', 'VC Zwalmdal', 'KSK Ninoveld', 'FC Herenthout', 'SV Zultebeek', 'KVC Westhoek',
      'KSC Zennedal', 'RC Brabantia', 'FC Frietkot', 'VK Wafelijzer', 'SK Pintje', 'FC Mosselpot', 'KFC Regenbui', 'VV Stoofvlees',
      'SC Kermis', 'FC Bakfiets'],
    kranten:{2:['Sportwereld', 'Het Voetbalnieuws', 'Voetbalavond TV'], 1:['Sportwereld', 'Het Voetbalnieuws', 'Voetbalavond TV']},
    roddel:['Roddelweekblad Klap', 'Sterren & Schandalen', 'Sportwereld']},
  'Engeland':{divs:['Premier Division', 'Championship Division'], beker:'National Cup',
    clubs:['Riverside United', 'Kingsbridge City', 'Northgate Rovers', 'Ashford Athletic', 'Millbrook Albion', 'Harbour Town', 'Crowley Wanderers', 'Eastfield Forest',
      'Stonehill United', 'Bramford City', 'Westcliff Rangers', 'Oakham Town', 'Redmoor Athletic', 'Hollow Park', 'Thornbury County', 'Saltmarsh FC',
      'Little Didsworth', 'Fenwick Borough', 'Kettleby Town', 'Grimsdale United', 'Puddleton Rovers', 'Marshgate FC', 'Copperfield Town', 'Ravenmoor FC',
      'Ironbridge Town', 'Blackmoor City', 'Hartwell Rovers', 'Lowfield United', 'Kesterton Athletic', 'Ambleside Wanderers', 'Pembury Town', 'Castleford Vale',
      'Whitcombe Albion', 'Norbury FC', 'Brackley Heath', 'Elmsworth United', 'Red Lion FC', 'Sunday Hangover XI', 'The Muddy Boots', 'Pub Royal FC',
      'Rainy Lane United', 'Fish & Chips FC', 'Old Kettle Athletic', 'Teacup Rovers'],
    kranten:{2:['The Daily Ball', 'Football Today', 'Match Night TV'], 1:['The Daily Ball', 'Football Today', 'Match Night TV']},
    roddel:['The Sunday Scandal', 'Celebrity Weekly', 'The Daily Ball']},
  'Duitsland':{divs:['Bundesklasse', 'Zweite Klasse'], beker:'Pokal',
    clubs:['FC Westerhausen', 'Borussia Lindenfeld', 'SV Rheinauen', 'Eintracht Waldberg', 'VfB Steinbrück', '1. FC Ostmark', 'TSV Bergfelden', 'Fortuna Elbstadt',
      'SC Moorbach', 'VfL Tannenau', 'Arminia Kessel', 'SpVgg Hügelland', 'Union Rotfeld', 'FC Mühlhagen', 'Kickers Altdorf', 'SV Sandkuhle',
      'TuS Kleinwalde', 'SV Bachhausen', 'FC Wiesental', 'VfR Dornbach', 'SG Heuberg', 'TSG Lindach', 'SC Brunnen', 'FV Feldmark',
      'SV Auenwald', 'FC Grünberg', 'VfB Mühltal', 'TuS Rabenstein', 'FC Bratwurst', 'SV Bierzelt', 'TSV Lederhose', 'Kreisliga Kickers',
      'FC Brezel', 'SpVgg Sauerkraut', 'SV Gemütlich', 'FC Feierabend'],
    kranten:{2:['Fußball Heute', 'Sportecho', 'Torjäger TV'], 1:['Fußball Heute', 'Sportecho', 'Torjäger TV']},
    roddel:['Klatsch & Tratsch', 'Promi Woche', 'Fußball Heute']},
  'Frankrijk':{divs:['Ligue Élite', 'Ligue Deux'], beker:'Coupe Nationale',
    clubs:['Olympique Marinière', 'AS Montclair', 'Stade Rivelle', 'FC Lavandière', 'Racing Beaumont', 'Girondins de Sable', 'OGC Côte Bleue', 'AJ Valmont',
      'US Pierrefeu', 'SC Bocage', 'FC Vignoble', 'Stade Bretonnant', 'AS Châtelet', 'EA Montagnac', 'Olympique Lagune', 'US Falaise',
      'FC Petit-Bourg', 'AS Saint-Fromage', 'US Clocher', 'SC Moulinville', 'FC Boulangerie', 'AS Rivière', 'Stade Colombier', 'JS Prairie',
      'FC Valombre', 'AS Port-Clair', 'Stade Sorgues', 'US Belcastel', 'FC Baguette', 'AS Croissant', 'US Pétanque', 'FC Camembert',
      'Les Escargots FC', 'AS Apéro', 'FC Béret', 'US Pastis'],
    kranten:{2:['Le Sport Quotidien', 'Foot Matin', 'Canal Foot'], 1:['Le Sport Quotidien', 'Foot Matin', 'Canal Foot']},
    roddel:['Potins & Paillettes', 'Star Hebdo', 'Le Sport Quotidien']},
  'Spanje':{divs:['Primera', 'Segunda'], beker:'Copa Nacional',
    clubs:['Real Montaña', 'Atlético Solmar', 'Deportivo Costa Azul', 'Sevilla del Río', 'CD Olivares', 'Racing Cantábrico', 'Valle CF', 'Unión Mediterránea',
      'CD Sierra Alta', 'Real Puertollano', 'UD Naranjal', 'SD Viñedo', 'CF Torremolar', 'Atlético Pinar', 'Recreativo Salinas', 'UD Faro',
      'CD Pueblo Chico', 'UD Molino', 'CF Castillejo', 'SD Rambla', 'CD Almendro', 'UD Fuentecilla', 'CF Ermita', 'Atlético Barrio',
      'CD Alcorón', 'UD Peñasco', 'Real Vega Baja', 'CF Navalmar', 'SD Robledal', 'Atlético Vallejo', 'CD Brezal', 'UD Arenales',
      'Racing Tolmo', 'CF Encinar', 'CD Tapas', 'UD Siesta', 'Paella CF', 'CD Churros', 'Atlético Fiesta', 'Real Sangría',
      'CF Flamenco', 'UD Mañana'],
    kranten:{2:['Diario Gol', 'Marcador', 'Gol TV Noche'], 1:['Diario Gol', 'Marcador', 'Gol TV Noche']},
    roddel:['Corazón Semanal', 'Famosos Hoy', 'Diario Gol']},
  'Italië':{divs:['Serie Prima', 'Serie Seconda'], beker:'Coppa Nazionale',
    clubs:['AC Montebello', 'Sporting Lagomare', 'Virtus Collina', 'AS Tiberina', 'SSC Vulcano', 'ACF Arnovalle', 'US Valseriana', 'SS Pineta',
      'US Campagna', 'AC Cipressi', 'FC Vigneto', 'Calcio Riviera', 'SS Torrevecchia', 'US Oliveto', 'AC Fontana', 'Pro Borgo',
      'ASD Paesello', 'US Campanile', 'AC Mulino', 'FC Piazzetta', 'SS Ponte', 'ASD Collinetta', 'US Castelletto', 'AC Prato Verde',
      'US Pietrasanta', 'AC Valdarno', 'FC Borgonero', 'SS Lucentina', 'Virtus Montecalvo', 'AS Rocca Alta', 'US Ferrovia', 'AC Torrebruna',
      'FC Spaghetti', 'AS Margherita', 'US Espresso', 'Gelato FC', 'AC Nonna', 'SS Tiramisù', 'US Dolce Vita', 'FC Mamma Mia'],
    kranten:{2:['Corriere del Gol', 'Tutto Calcio', 'Notte di Calcio TV'], 1:['Corriere del Gol', 'Tutto Calcio', 'Notte di Calcio TV']},
    roddel:['Pettegolezzi Settimanali', 'Diva & Divo', 'Corriere del Gol']},
  'Portugal':{divs:['Primeira Liga', 'Segunda Liga'], beker:'Taça Nacional',
    clubs:['Sporting Atlântico', 'FC Douro', 'Estrela do Mar', 'SC Minho', 'Vitória Ribeira', 'CD Algarve', 'Académica Serra', 'Náutico Sul',
      'GD Oliveiral', 'SC Vinhedo', 'CD Cortiça', 'FC Azulejo', 'UD Serrana', 'AD Fontainhas', 'Leões da Vila', 'SC Moinho',
      'GD Aldeia', 'FC Pequeno Porto', 'CD Capela', 'SC Ribeirinho', 'AD Pinhal', 'UD Quinta', 'CF Charneca', 'GD Rossio',
      'CD Ribafria', 'SC Penedo', 'FC Alverca Nova', 'GD Lagoa', 'FC Pastel de Nata', 'Bacalhau FC', 'SC Sardinha', 'CD Fado',
      'UD Saudade', 'GD Bifana', 'FC Galo', 'SC Vinho Verde'],
    kranten:{2:['Golo Diário', 'A Bancada', 'Noite de Futebol TV'], 1:['Golo Diário', 'A Bancada', 'Noite de Futebol TV']},
    roddel:['Mexericos Semanais', 'Revista Famosos', 'Golo Diário']},
  Turkije:{divs:['Süper Lig', '1. Lig'], beker:'Türkiye Kupası',
    clubs:['Galata Spor', 'Boğaz SK', 'Kartal Spor', 'Anadolu Yıldızı', 'Karadeniz FK', 'Ege Gücü', 'Başkent SK', 'Bursa Yeşil',
      'Kapadokya SK', 'Akdeniz Spor', 'Toros FK', 'Marmara Gençlik', 'Konak SK', 'Fırat Spor', 'Pamukkale FK', 'Kızılırmak SK',
      'Sakarya Dalga', 'Çamlıca SK', 'Uludağ Spor', 'Erciyes FK', 'Kırklar Spor', 'Meram FK', 'Yeşilköy SK', 'Bozdağ Spor',
      'Altınova FK', 'Göksu SK', 'Kaçkar Spor', 'Datça FK', 'Kuşadası Gücü', 'Nemrut SK', 'Akçay Spor', 'Ağrı Dağı FK',
      'Çınaraltı SK', 'Dolmuş FK', 'Simit Spor', 'Çay Bahçesi SK', 'Lokum FK', 'Baklava Spor'],
    kranten:{2:['Spor Postası', 'Gol Gazetesi', 'Maç Gecesi TV'], 1:['Spor Postası', 'Gol Gazetesi', 'Maç Gecesi TV']},
    roddel:['Magazin Haber', 'Ünlüler Haftası', 'Spor Postası']},
  'Tsjechië':{divs:['První Liga', 'Národní Liga'], beker:'Pohár Národa',
    clubs:['Slavia Vltava', 'Sparta Hradčany', 'Viktoria Plzeňská', 'Baník Ostravice', 'Slovan Ještěd', 'Sigma Morava', 'Bohemka Zlatá', 'Dukla Petřín',
      'FK Jablonecká', 'Zbrojovka Svratka', 'SK Krkonoše', 'FC Šumava', 'Hradec Labe', 'FK Teplická', 'Slovácko Vinice', 'MFK Beskydy',
      'FK Vysočina', 'SK Brdy', 'FC Orlice', 'Tatran Lužnice', 'FK Jizera', 'SK Sázava', 'FC Křivoklát', 'Spartak Ohře',
      'FK Kamenice', 'SK Podyjí', 'FC Knedlík', 'SK Pivovar', 'FK Trdelník', 'Hospoda United', 'SK Houbička', 'FC Hokejka'],
    kranten:{2:['Sportovní Den', 'Gól Noviny', 'Fotbal Večer TV'], 1:['Sportovní Den', 'Gól Noviny', 'Fotbal Večer TV']},
    roddel:['Bulvár Týden', 'Hvězdy & Skandály', 'Sportovní Den']},
  Griekenland:{divs:['Souper Liga', 'Souper Liga 2'], beker:'Kypello Elladas',
    clubs:['Olympia Pireaki', 'Panelliniki Akropolis', 'Athlitiki Attiki', 'Thermaikos FC', 'Aris Olymbou', 'Parnitha AO', 'Knossos FC', 'Asteras Arkadias',
      'Delta Aitolias', 'Argo Volou', 'Elikonas AO', 'Fthiotida FC', 'Strymonas AO', 'Platanos Kifisias', 'Ionikos Kerkyras', 'Lykavittos FC',
      'Doxa Pindou', 'Iraklis Chalkidikis', 'Elies Kalamatas', 'Ymittos AO', 'Ethnikos Kykladon', 'Proodeftiki Santorinis', 'Apollon Delfon', 'Niki Thessalias',
      'AO Feta', 'Souvlaki FC', 'Tzatziki Athletic', 'AO Ouzo', 'Gyros United', 'Moussaka FC'],
    kranten:{2:['Athlitiki Imera', 'Goal News', 'Podosfairo TV'], 1:['Athlitiki Imera', 'Goal News', 'Podosfairo TV']},
    roddel:['Koutsombolio', 'Lampsi Weekly', 'Athlitiki Imera']},
  Polen:{divs:['Ekstraklasa', 'Pierwsza Liga'], beker:'Puchar Polski',
    clubs:['Legia Wisła', 'Lech Warta', 'Raków Jura', 'Jagiellonia Podlasie', 'Pogoń Odra', 'Górnik Śląsk', 'Wisła Wawel', 'Śląsk Odrzański',
      'Cracovia Kazimierz', 'Lechia Motława', 'Zagłębie Miedź', 'Piast Gliwicki', 'Widzew Łódzki', 'Korona Świętokrzyska', 'Radomiak Kozienice', 'Stal Sandomierz',
      'Motor Lubelski', 'Puszcza Niepołomicka', 'Arka Bałtyk', 'Ruch Hutnik', 'Odra Opolska', 'Znicz Mazowsze', 'Polonia Starówka', 'Chrobry Głogowski',
      'Miedź Legnicka', 'Stomil Mazury', 'Warta Poznańska', 'Resovia Podkarpacie', 'Sandecja Tatry', 'Pieniny Nieciecza', 'KS Pierogi', 'Kiełbasa Kickers',
      'Bigos FC', 'Żubr United', 'KS Pączek', 'Oscypek FC'],
    kranten:{2:['Przegląd Bramek', 'Sport Dziś', 'Wieczór Piłkarski TV'], 1:['Przegląd Bramek', 'Sport Dziś', 'Wieczór Piłkarski TV']},
    roddel:['Plotki Tygodnia', 'Gwiazdy i Skandale', 'Przegląd Bramek']},
  Denemarken:{divs:['Superligaen', '1. Division'], beker:'Landspokalen',
    clubs:['FC Kongehavn', 'Brøndvig IF', 'Hedeby FC', 'Aarhusbugt GF', 'Skovsø FC', 'Fyn BK', 'Gudenå FC', 'Domkirke FF',
      'Søhøjlandet IF', 'Grænseland FK', 'Fjordby BK', 'Lyngvig BK', 'Vesterhav FC', 'Mariager IK', 'Havnestad FC', 'Limfjord BK',
      'Slotsby FC', 'Strandby IF', 'Voldby FC', 'Susåen BK', 'BK Smørrebrød', 'FC Hygge', 'Frikadelle IF', 'Rød Pølse BK'],
    kranten:{2:['Sportsbladet', 'Bold Nyt', 'Fodboldaften TV'], 1:['Sportsbladet', 'Bold Nyt', 'Fodboldaften TV']},
    roddel:['Sladder Ugen', 'Kendte & Skandaler', 'Sportsbladet']},
  Noorwegen:{divs:['Eliteserien', '1. divisjon'], beker:'NM-cupen',
    clubs:['Glimt Nordlys', 'Nidelv BK', 'Romsdal FK', 'Bergenhus SK', 'Fjordby IL', 'Oslo Øst FK', 'Romerike IF', 'Glomma FK',
      'Ishavet IL', 'Gamlebyen FK', 'Drammenselv IF', 'Karmsund FK', 'Hvalfangst IL', 'Ekeberg FK', 'Mjøsa IL', 'Nordmøre BK',
      'Skienselva FK', 'Sunnmøre IL', 'Frognerseter FK', 'Sørlandet IK', 'Jæren FK', 'Bærum IF', 'Elvebredd FK', 'Trondheimsfjord IL',
      'Ekko FK', 'Toten IL', 'IL Brunost', 'Lutefisk FK', 'Fjellvandrer IL', 'Vaffel BK', 'Midnattsol FK', 'Elg United'],
    kranten:{2:['Sportsavisen', 'Ballnytt', 'Fotballkveld TV'], 1:['Sportsavisen', 'Ballnytt', 'Fotballkveld TV']},
    roddel:['Sladder & Stjerner', 'Kjendisuka', 'Sportsavisen']},
  Zwitserland:{divs:['Super League', 'Challenge League'], beker:'Schweizer Cup',
    clubs:['FC Rheinknie', 'Young Fellows Aare', 'Grasshopper Limmat', 'Servette Léman', 'FC Säntis', 'Lugano Ceresio', 'FC Pilatus', 'Lausanne Lavaux',
      'FC Rhonetal', 'Winterthur Töss', 'Thun Oberland', 'FC Jura Neuchâtel', 'FC Emmental', 'Bellinzona Ticino', 'FC Engadin', 'Aarau Rebstock',
      'FC Alpenrhein', 'FC Zugersee', 'FC Fondue', 'Schoggi Kickers', 'FC Rösti', 'Kuhglocke United'],
    kranten:{2:['Sportbote', 'Le Matin Foot', 'Fussballabend TV'], 1:['Sportbote', 'Le Matin Foot', 'Fussballabend TV']},
    roddel:['Klatsch Woche', 'Promi Schweiz', 'Sportbote']}
};
// De leagues in het vrouwenvoetbal (de beker heet hetzelfde, met "Vrouwen" erachter)
export const DIVS_V = {Nederland:['Topdivisie Vrouwen', 'Eerste Divisie Vrouwen'], 'België':['Super League Vrouwen', 'Eerste Nationale Vrouwen'], Engeland:["Women's Super League", "Women's Championship"],
  Duitsland:['Frauen-Bundesklasse', '2. Frauen-Klasse'], Frankrijk:['Première Ligue', 'Seconde Ligue'], Spanje:['Liga F', 'Primera Federación'], 'Italië':['Serie Prima Femminile', 'Serie Seconda Femminile'],
  Portugal:['Liga Feminina', 'Segunda Divisão Feminina'], Turkije:['Kadınlar Süper Ligi', 'Kadınlar 1. Ligi'], 'Tsjechië':['První Liga Žen', 'Druhá Liga Žen'], Griekenland:['A Ethniki Gynaikon', 'B Ethniki Gynaikon'],
  Polen:['Ekstraliga Kobiet', 'I Liga Kobiet'], Denemarken:['Kvindeligaen', 'Kvinde 1. Division'], Noorwegen:['Toppserien', '1. divisjon kvinner'], Zwitserland:['Super League Frauen', 'Nationalliga B Frauen']};
// De naam van league t (1 of 2) in een land, in de wereld van deze carrière
export const divNaam = (land, t) => WERELD === 'v' ? (DIVS_V[land] || DIVS_V.Nederland)[t - 1] : land === 'Nederland' ? (NL.divs || DIVS)[t] : (LAND_DATA[land] || {divs:[]}).divs[t - 1];
export const bekerNaam = land => { const b = land === 'Nederland' || !LAND_DATA[land] ? 'Nationale Beker' : LAND_DATA[land].beker; return WERELD === 'v' ? b + ' Vrouwen' : b; };
export const BEKER_NAMEN = ['Nationale Beker', ...Object.values(LAND_DATA).map(l => l.beker)];
export const BEKER_ALT = BEKER_NAMEN.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
// Nederlandse namen bewaren zodat je kunt terugschakelen
export const NL = {divs:null, clubs:null, kranten:null, roddel:null};
export function zetLand(land){
  if (!NL.divs){ NL.divs = DIVS.slice(); NL.clubs = CLUBS.map(c => c.n); NL.kranten = JSON.parse(JSON.stringify(KRANTEN)); NL.roddel = RODDELBLADEN.slice(); }
  const L = LAND_DATA[land] || null;
  for (let i = 1; i <= LAAGSTE; i++) DIVS[i] = divNaam(L ? land : 'Nederland', i);
  for (let i = 8; i < CLUBS_LAND; i++) CLUBS[i].n = clubNaam((L ? L.clubs[i - 8] : NL_CLUBS[i - 8]) || 'Lege plaats');
  if (ELITE_THUIS[land] && WERELD !== 'v') CLUBS[ELITE_ID].n = ELITE_THUIS[land].n; // de oude Elite-club van dit land (alleen bij de mannen)
  for (let t = 1; t <= LAAGSTE; t++) KRANTEN[t] = (L ? L.kranten[t] : NL.kranten[t]).slice();
  // Internationale kranten, plus de grootste sportkrant van je eigen land
  KRANTEN[0] = NL.kranten[0].map(k => k === 'De Sportkrant' && L ? L.kranten[1][0] : k);
  RODDELBLADEN.splice(0, RODDELBLADEN.length, ...(L ? L.roddel : NL.roddel));
  BEKERS.nat.naam = bekerNaam(L ? land : 'Nederland');
}
export const thuisLand = () => (S && S.land) || 'Nederland';
export const NL_VRAAG = /Nederland|Nederlandse|5 mei/;
export const nietNL = () => S && S.land && S.land !== 'Nederland';

export const PRIJS_CLUB = new RegExp(`^(Kampioen|${BEKER_ALT}|Champions League|Europa Cup|Jeugdbeker|Promotie)`), PRIJS_IND = /^(Topscorer|Assistkoning|Speler van het Seizoen|Gouden Bal|Maatschappelijk|Clublegende|Beste speler|Clubtopscorer|Competitierecord|Standbeeld|Rugnummer)/, PRIJS_LAND = /^(WK|EK|Copa América|Afrika Cup|Azië Cup|Gold Cup) \d{4} met /;

// Clubnamen voor nieuwe clubs (een fusieclub in jouw land, of een nieuwe kampioen in de Europese Elite)
export const NIEUWE_CLUBS = {
  Nederland:['FC Zuiderwaard','SV Klinkerveen','Achilles Duinrand','VV Grachtenstad','SC Westerkwartier','FC Lingewaard','RKSV Maasoever','FC Eemland'],
  'België':['KV Leiedal','Royal Ardennenstad','SK Maasbos','FC Brabantia Zuid','RC Kempenstad','KSV Waaslandia','Union Zennevallei','SV Ourthe'],
  Engeland:['Riverside Athletic','Northgate United','Kingsbridge Rovers','Moorland City','Harbourside Albion','Westfield Town','Ironbridge FC','Highcliff Wanderers'],
  Duitsland:['SV Rheinwerder','FC Elbstadt','TSV Hohenkamm','Borussia Moorbach','SG Neckartal','VfR Ostseeburg','FC Waldsee','Eintracht Lindenhof'],
  Frankrijk:['AS Côte Bleue','Racing Vallée-Noire','FC Montrésor','Stade Bellerive','Olympique Lavande','US Rochefleur','SC Garonne','AC Mont-Clair'],
  Spanje:['CD Puerto Sol','Atlético Sierra Norte','Real Valdeoro','UD Costa Brava','SD Olivares Altos','CF Río Claro','Racing Mesana','Deportivo Alcalá Verde'],
  'Italië':['AC Lagonero','US Montevalle','FC Portoverde','SS Collina','Sporting Vallescura','AS Marittima','Calcio Torrebianca','Virtus Fiumara'],
  Portugal:['SC Ribamar','FC Serra Alta','Académica Douro','CD Mareira','Vitória Costa Verde','União Lusitana','SC Alvorada','Desportivo Tejo'],
  Denemarken:['FC Øresund','Aalvik BK','Silkeby IF','FC Jyllandshavn','Bornholt BK','Lyngby Fjord'],
  Turkije:['Yeni Anadolu SK', 'Boğaziçi FK', 'Ege Yıldızı', 'Kartal Gençlik', 'Toros Gücü', 'Akdeniz Birlik'],
  'Tsjechië':['FK Vltavín', 'SK Labská', 'FC Moravia Nova', 'Bohemia Unie', 'FK Sněžka', 'SK Polabí'],
  Griekenland:['Neos Olympos', 'Aigaio FC', 'Peloponnisos AO', 'Thessalia Enosi', 'Kriti Athlitiki', 'Ionio FC'],
  Polen:['KS Nowa Wisła', 'Unia Mazowiecka', 'Odra Zjednoczona', 'Pomorze Gdańskie', 'Tatry Zakopiańskie', 'KS Warmia'],
  Noorwegen:['Nordfjord FK', 'Lofoten IL', 'Fjellheim BK', 'Vestland FK', 'Nordkapp IL', 'Hardanger FK'],
  Zwitserland:['FC Gotthard', 'Union Léman', 'FC Bodensee', 'AC Leventina', 'FC Glarnerland', 'Servette Unie'],
  'Oekraïne':['FK Stepovyi','Dnipro-Zirka','Metalurh Azovsk','Karpaty Verkhovyna','Zorya Polissya','FK Chornomorets-Sud']
};
