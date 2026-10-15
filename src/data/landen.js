import { S } from '../core/state.js';
import { CLUBS, DIVS, ELITE_ID, ELITE_THUIS } from './gegevens.js';
import { BEKERS } from '../game/competitie/beker.js';
import { KRANTEN } from '../game/media/nieuws.js';
import { RODDELBLADEN } from '../game/media/roddel.js';

/* ===================== Landen: waar je opgroeit en je carrière begint ===================== */
// Elk land heeft dezelfde opbouw (4 niveaus + jeugd), met eigen namen voor de divisies, clubs, beker en kranten.
// De Europese Elite (clubs 0-7) is voor iedereen hetzelfde. Clubnamen zijn verzonnen.
export const SPEEL_LANDEN = ['Nederland', 'België', 'Engeland', 'Duitsland', 'Frankrijk', 'Spanje', 'Italië', 'Portugal'];
export const LAND_DATA = {
  'België':{divs:['Eerste Klasse', 'Tweede Klasse', 'Derde Klasse', 'Provinciale', 'Jeugdreeks O19'], beker:'Belgische Beker',
    clubs:['Royal Scheldestad', 'Club Kempenland', 'Standaard Maasvallei', 'KAA Leiestad', 'Racing Dijlestad', 'Sporting Sambre', 'KV Kustlijn', 'OH Hageland',
      'KSV Vlasland', 'RFC Ardennen', 'KV Westflank', 'Lierse Netestad', 'Patro Haspengouw', 'FC Denderstreek', 'SK Kempenheide', 'Waasland Groen',
      'KFC Hamme-Zuid', 'SK Ronsevelde', 'RC Tienenberg', 'VC Zwalmdal', 'KSK Ninoveld', 'FC Herenthout', 'SV Zultebeek', 'KVC Westhoek',
      'FC Frietkot', 'VK Wafelijzer', 'SK Pintje', 'FC Mosselpot', 'KFC Regenbui', 'VV Stoofvlees', 'SC Kermis', 'FC Bakfiets'],
    kranten:{5:['Het Clubblaadje', 'Gazet van het Dorp', 'Jeugdvoetbal Vlaanderen'], 4:['Gewestelijke Krant', 'Het Clubblaadje', 'Provinciaal Voetbal'], 3:['Gewestelijke Krant', 'Sportwereld', 'Het Voetbalnieuws'], 2:['Sportwereld', 'Het Voetbalnieuws', 'Voetbalavond TV'], 1:['Sportwereld', 'Het Voetbalnieuws', 'Voetbalavond TV']},
    roddel:['Roddelweekblad Klap', 'Sterren & Schandalen', 'Sportwereld']},
  'Engeland':{divs:['Premier Division', 'Championship Division', 'League South', 'County League', 'Youth League O19'], beker:'National Cup',
    clubs:['Riverside United', 'Kingsbridge City', 'Northgate Rovers', 'Ashford Athletic', 'Millbrook Albion', 'Harbour Town', 'Crowley Wanderers', 'Eastfield Forest',
      'Stonehill United', 'Bramford City', 'Westcliff Rangers', 'Oakham Town', 'Redmoor Athletic', 'Hollow Park', 'Thornbury County', 'Saltmarsh FC',
      'Little Didsworth', 'Fenwick Borough', 'Kettleby Town', 'Grimsdale United', 'Puddleton Rovers', 'Marshgate FC', 'Copperfield Town', 'Ravenmoor FC',
      'Red Lion FC', 'Sunday Hangover XI', 'The Muddy Boots', 'Pub Royal FC', 'Rainy Lane United', 'Fish & Chips FC', 'Old Kettle Athletic', 'Teacup Rovers'],
    kranten:{5:['The Club Gazette', 'Village Chronicle', 'Youth Football Weekly'], 4:['County Herald', 'The Club Gazette', 'Grassroots Weekly'], 3:['County Herald', 'Football Today', 'The Daily Ball'], 2:['The Daily Ball', 'Football Today', 'Match Night TV'], 1:['The Daily Ball', 'Football Today', 'Match Night TV']},
    roddel:['The Sunday Scandal', 'Celebrity Weekly', 'The Daily Ball']},
  'Duitsland':{divs:['Bundesklasse', 'Zweite Klasse', 'Regionalklasse', 'Kreisliga', 'Jugendliga U19'], beker:'Pokal',
    clubs:['FC Westerhausen', 'Borussia Lindenfeld', 'SV Rheinauen', 'Eintracht Waldberg', 'VfB Steinbrück', '1. FC Ostmark', 'TSV Bergfelden', 'Fortuna Elbstadt',
      'SC Moorbach', 'VfL Tannenau', 'Arminia Kessel', 'SpVgg Hügelland', 'Union Rotfeld', 'FC Mühlhagen', 'Kickers Altdorf', 'SV Sandkuhle',
      'TuS Kleinwalde', 'SV Bachhausen', 'FC Wiesental', 'VfR Dornbach', 'SG Heuberg', 'TSG Lindach', 'SC Brunnen', 'FV Feldmark',
      'FC Bratwurst', 'SV Bierzelt', 'TSV Lederhose', 'Kreisliga Kickers', 'FC Brezel', 'SpVgg Sauerkraut', 'SV Gemütlich', 'FC Feierabend'],
    kranten:{5:['Vereinsblatt', 'Dorfzeitung', 'Jugendfußball Regional'], 4:['Kreisanzeiger', 'Vereinsblatt', 'Amateurfußball Heute'], 3:['Kreisanzeiger', 'Fußball Heute', 'Sportecho'], 2:['Fußball Heute', 'Sportecho', 'Torjäger TV'], 1:['Fußball Heute', 'Sportecho', 'Torjäger TV']},
    roddel:['Klatsch & Tratsch', 'Promi Woche', 'Fußball Heute']},
  'Frankrijk':{divs:['Ligue Élite', 'Ligue Deux', 'National Régional', "Division d'Honneur", 'Championnat U19'], beker:'Coupe Nationale',
    clubs:['Olympique Marinière', 'AS Montclair', 'Stade Rivelle', 'FC Lavandière', 'Racing Beaumont', 'Girondins de Sable', 'OGC Côte Bleue', 'AJ Valmont',
      'US Pierrefeu', 'SC Bocage', 'FC Vignoble', 'Stade Bretonnant', 'AS Châtelet', 'EA Montagnac', 'Olympique Lagune', 'US Falaise',
      'FC Petit-Bourg', 'AS Saint-Fromage', 'US Clocher', 'SC Moulinville', 'FC Boulangerie', 'AS Rivière', 'Stade Colombier', 'JS Prairie',
      'FC Baguette', 'AS Croissant', 'US Pétanque', 'FC Camembert', 'Les Escargots FC', 'AS Apéro', 'FC Béret', 'US Pastis'],
    kranten:{5:['Le Petit Club', 'Écho du Village', 'Foot Jeunes'], 4:['La Gazette Régionale', 'Le Petit Club', 'Foot Amateur'], 3:['La Gazette Régionale', 'Foot Matin', 'Le Sport Quotidien'], 2:['Le Sport Quotidien', 'Foot Matin', 'Canal Foot'], 1:['Le Sport Quotidien', 'Foot Matin', 'Canal Foot']},
    roddel:['Potins & Paillettes', 'Star Hebdo', 'Le Sport Quotidien']},
  'Spanje':{divs:['Primera', 'Segunda', 'Tercera Regional', 'Liga Amateur', 'Juvenil Sub-19'], beker:'Copa Nacional',
    clubs:['Real Montaña', 'Atlético Solmar', 'Deportivo Costa Azul', 'Sevilla del Río', 'CD Olivares', 'Racing Cantábrico', 'Valle CF', 'Unión Mediterránea',
      'CD Sierra Alta', 'Real Puertollano', 'UD Naranjal', 'SD Viñedo', 'CF Torremolar', 'Atlético Pinar', 'Recreativo Salinas', 'UD Faro',
      'CD Pueblo Chico', 'UD Molino', 'CF Castillejo', 'SD Rambla', 'CD Almendro', 'UD Fuentecilla', 'CF Ermita', 'Atlético Barrio',
      'CD Tapas', 'UD Siesta', 'Paella CF', 'CD Churros', 'Atlético Fiesta', 'Real Sangría', 'CF Flamenco', 'UD Mañana'],
    kranten:{5:['Hoja del Club', 'Diario del Pueblo', 'Fútbol Juvenil'], 4:['Diario Regional', 'Hoja del Club', 'Fútbol Modesto'], 3:['Diario Regional', 'Diario Gol', 'Marcador'], 2:['Diario Gol', 'Marcador', 'Gol TV Noche'], 1:['Diario Gol', 'Marcador', 'Gol TV Noche']},
    roddel:['Corazón Semanal', 'Famosos Hoy', 'Diario Gol']},
  'Italië':{divs:['Serie Prima', 'Serie Seconda', 'Serie Regionale', 'Promozione', 'Primavera U19'], beker:'Coppa Nazionale',
    clubs:['AC Montebello', 'Sporting Lagomare', 'Virtus Collina', 'AS Tiberina', 'SSC Vulcano', 'ACF Arnovalle', 'US Valseriana', 'SS Pineta',
      'US Campagna', 'AC Cipressi', 'FC Vigneto', 'Calcio Riviera', 'SS Torrevecchia', 'US Oliveto', 'AC Fontana', 'Pro Borgo',
      'ASD Paesello', 'US Campanile', 'AC Mulino', 'FC Piazzetta', 'SS Ponte', 'ASD Collinetta', 'US Castelletto', 'AC Prato Verde',
      'FC Spaghetti', 'AS Margherita', 'US Espresso', 'Gelato FC', 'AC Nonna', 'SS Tiramisù', 'US Dolce Vita', 'FC Mamma Mia'],
    kranten:{5:['Il Giornalino del Club', 'Eco del Paese', 'Calcio Giovani'], 4:['Gazzetta Regionale', 'Il Giornalino del Club', 'Calcio Dilettanti'], 3:['Gazzetta Regionale', 'Corriere del Gol', 'Tutto Calcio'], 2:['Corriere del Gol', 'Tutto Calcio', 'Notte di Calcio TV'], 1:['Corriere del Gol', 'Tutto Calcio', 'Notte di Calcio TV']},
    roddel:['Pettegolezzi Settimanali', 'Diva & Divo', 'Corriere del Gol']},
  'Portugal':{divs:['Primeira Liga', 'Segunda Liga', 'Liga Regional', 'Distrital', 'Juniores Sub-19'], beker:'Taça Nacional',
    clubs:['Sporting Atlântico', 'FC Douro', 'Estrela do Mar', 'SC Minho', 'Vitória Ribeira', 'CD Algarve', 'Académica Serra', 'Náutico Sul',
      'GD Oliveiral', 'SC Vinhedo', 'CD Cortiça', 'FC Azulejo', 'UD Serrana', 'AD Fontainhas', 'Leões da Vila', 'SC Moinho',
      'GD Aldeia', 'FC Pequeno Porto', 'CD Capela', 'SC Ribeirinho', 'AD Pinhal', 'UD Quinta', 'CF Charneca', 'GD Rossio',
      'FC Pastel de Nata', 'Bacalhau FC', 'SC Sardinha', 'CD Fado', 'UD Saudade', 'GD Bifana', 'FC Galo', 'SC Vinho Verde'],
    kranten:{5:['Folha do Clube', 'Jornal da Aldeia', 'Futebol Jovem'], 4:['Diário Regional', 'Folha do Clube', 'Futebol Distrital'], 3:['Diário Regional', 'Golo Diário', 'A Bancada'], 2:['Golo Diário', 'A Bancada', 'Noite de Futebol TV'], 1:['Golo Diário', 'A Bancada', 'Noite de Futebol TV']},
    roddel:['Mexericos Semanais', 'Revista Famosos', 'Golo Diário']}
};
export const BEKER_NAMEN = ['Nationale Beker', ...Object.values(LAND_DATA).map(l => l.beker)];
export const BEKER_ALT = BEKER_NAMEN.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
// Nederlandse namen bewaren zodat je kunt terugschakelen
export const NL = {divs:null, clubs:null, kranten:null, roddel:null};
export function zetLand(land){
  if (!NL.divs){ NL.divs = DIVS.slice(); NL.clubs = CLUBS.map(c => c.n); NL.kranten = JSON.parse(JSON.stringify(KRANTEN)); NL.roddel = RODDELBLADEN.slice(); }
  const L = LAND_DATA[land] || null;
  for (let i = 1; i <= 5; i++) DIVS[i] = L ? L.divs[i - 1] : NL.divs[i];
  for (let i = 8; i < 40; i++) CLUBS[i].n = L ? L.clubs[i - 8] : NL.clubs[i];
  if (ELITE_THUIS[land]) CLUBS[ELITE_ID].n = ELITE_THUIS[land].n; // de oude Elite-club van dit land
  CLUBS.forEach(c => { if (c.ouder !== undefined) c.n = CLUBS[c.ouder].n + ' O19'; });
  for (let t = 1; t <= 5; t++) KRANTEN[t] = (L ? L.kranten[t] : NL.kranten[t]).slice();
  // Internationale kranten, plus de grootste sportkrant van je eigen land
  KRANTEN[0] = NL.kranten[0].map(k => k === 'De Sportkrant' && L ? L.kranten[1][0] : k);
  RODDELBLADEN.splice(0, RODDELBLADEN.length, ...(L ? L.roddel : NL.roddel));
  BEKERS.nat.naam = L ? L.beker : 'Nationale Beker';
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
  'Oekraïne':['FK Stepovyi','Dnipro-Zirka','Metalurh Azovsk','Karpaty Verkhovyna','Zorya Polissya','FK Chornomorets-Sud']
};
