/* ===================== Shirtsponsors van de clubs ===================== */
// Verzonnen merken (geen echte bedrijven). Elke club houdt altijd dezelfde sponsor (gekozen uit een hash van de clubnaam).
// Clubs uit de hoogste league hebben grote merken, lagere leagues lokale bedrijven. Elk land heeft zijn eigen merken;
// grote clubs buiten Nederland kunnen ook een internationaal merk hebben.
const INTERNATIONAAL = ['Atlas Airlines', 'Meridian Auto', 'Orion Mobile', 'Solara', 'Vortex Games', 'Nexus Pay', 'Horizon Hotels'];
const MERKEN = {
  Nederland:{groot:['Polderbank', 'Kroonbier', 'Turbo Telecom', 'Velox Energie', 'Noordster Reizen', 'Duinzicht Verzekeringen', 'Zuivelhoeve', 'Atlas Airlines', 'Meridian Auto', 'Orion Mobile',
    'Kustlijn Bank', 'Brandaris Tech', 'Lumina Energie', 'Havenstad Logistiek', 'Solara', 'Vortex Games', 'Delta Zorg', 'Nexus Pay', 'Molenaar Bier', 'Horizon Hotels'],
  lokaal:['Bakkerij De Molen', 'Garage Van Dijk', 'Snackbar De Hoek', 'Bouwbedrijf Jansen', 'Fietsen Smit', 'Kapsalon Knip', 'Slagerij Bakker', 'Installatie Visser',
    'Café De Kantine', 'Autobedrijf Mulder', 'Bloemen Bosman', 'Tegelhandel De Wit', 'Hoveniers Groen', 'Drukkerij Kramer', 'Schilders Dekker', 'Taxi Peters']},
  'België':{groot:['Ardenna Bank', 'Brouwerij Leieland', 'Telenova', 'Schelde Energie', 'Pralinor', 'Vlaamse Verzekeraar', 'Frituurland', 'Brabo Logistiek', 'Belgica Reizen', 'Maasland Zuivel'],
    lokaal:['Frituur ’t Hoekske', 'Bakkerij Peeters', 'Garage Claes', 'Café De Kroon', 'Beenhouwerij Maes', 'Bouwwerken Wouters', 'Fietsen Janssens', 'Drukkerij Goossens']},
  Engeland:{groot:['Albion Bank', 'Crownfield Ales', 'Britecom', 'Thames Energy', 'Lionheart Insurance', 'Moorland Dairies', 'Kingsway Travel', 'Union Freight', 'Redbrick Homes', 'Sterling Bet'],
    lokaal:['Smith & Sons Butchers', 'The Red Lion Pub', 'Baker’s Corner', 'Taylor Motors', 'Green Lane Builders', 'Harbour Fish & Chips', 'Brown’s Plumbing', 'Wilson Taxis']},
  Duitsland:{groot:['Rheinbank', 'Nordbräu', 'Teleka', 'Hansa Energie', 'Rheinland Versicherung', 'Alpenmilch', 'Autowerk Süd', 'Elbe Logistik', 'Bavaria Reisen', 'Stahlwerk Ruhr'],
    lokaal:['Bäckerei Müller', 'Autohaus Schmidt', 'Metzgerei Wagner', 'Gasthaus Zur Linde', 'Bau Becker', 'Elektro Fischer', 'Getränke Hoffmann', 'Fahrschule Weber']},
  Frankrijk:{groot:['Banque Lumière', 'Brasserie du Nord', 'Télécom Azur', 'Énergie Bleue', 'Assurances Gaulois', 'Fromagerie Alpine', 'Voyages Riviera', 'Auto Lyonnaise', 'Vins de Garonne', 'Transports Hexagone'],
    lokaal:['Boulangerie Martin', 'Garage Dubois', 'Bar des Sports', 'Boucherie Bernard', 'Bâtiment Moreau', 'Pharmacie Laurent', 'Fleurs Lefèvre', 'Taxi Girard']},
  Spanje:{groot:['Banco Ibérico', 'Cerveza Sol Alto', 'Telesur', 'Energía Brava', 'Seguros Castilla', 'Aceites Olivar', 'Viajes Mediterráneo', 'Motores Hispania', 'Jamones Sierra', 'Naranjas del Sur'],
    lokaal:['Panadería García', 'Taller Fernández', 'Bar El Rincón', 'Carnicería López', 'Construcciones Martínez', 'Farmacia Sánchez', 'Muebles Romero', 'Taxi Navarro']},
  'Italië':{groot:['Banca Laguna', 'Birra Dolomiti', 'TeleVesuvio', 'Energia Toscana', 'Assicurazioni Roma', 'Latteria Alpina', 'Pasta Bellavita', 'Moto Ferretti', 'Caffè Aurora', 'Viaggi Adriatico'],
    lokaal:['Panificio Rossi', 'Autofficina Bianchi', 'Bar Sport', 'Macelleria Ricci', 'Edilizia Colombo', 'Pizzeria Da Mario', 'Ferramenta Greco', 'Gelateria Conti']},
  Portugal:{groot:['Banco Atlântico', 'Cerveja Douro', 'Telelusa', 'Energia Lusa', 'Seguros Tejo', 'Vinhos Alvorada', 'Conservas Mareira', 'Viagens Algarve', 'Cortiça Nacional', 'Leite Serra'],
    lokaal:['Padaria Silva', 'Oficina Santos', 'Café Central', 'Talho Ferreira', 'Construções Pereira', 'Farmácia Costa', 'Pastelaria Rodrigues', 'Táxis Oliveira']},
  Turkije:{groot:['Anadolu Bankası', 'Boğaz Bira', 'Turkon Telekom', 'Ege Enerji', 'Hilal Sigorta', 'Toros Süt', 'Kapadokya Turizm', 'Marmara Otomotiv', 'Lale Çay', 'Yıldız Lojistik'],
    lokaal:['Fırın Yılmaz', 'Oto Kaya', 'Kebapçı Demir', 'Kasap Şahin', 'Yapı Çelik', 'Eczane Aydın', 'Berber Öztürk', 'Taksi Arslan']},
  'Tsjechië':{groot:['Vltava Banka', 'Pivovar Krkonoše', 'Telečeská', 'Energie Morava', 'Pojišťovna Praha', 'Mlékárna Šumava', 'Autoslavia', 'Bohemia Cestovní', 'Sklárna Jizera', 'Kovo Ostrava'],
    lokaal:['Pekárna Novák', 'Autoservis Svoboda', 'Hospoda U Lípy', 'Řeznictví Dvořák', 'Stavby Černý', 'Lékárna Procházka', 'Květiny Veselá', 'Taxi Horák']},
  Griekenland:{groot:['Aigaio Bank', 'Ammos Zythos', 'Olympus Telecom', 'Helios Energeia', 'Akropolis Asfaleies', 'Feta Thessalia', 'Kyma Ploia', 'Elia Kriti', 'Ionio Travel', 'Parthenon Logistics'],
    lokaal:['Fournos Papadopoulos', 'Garage Georgiou', 'Taverna O Kostas', 'Kreopoleio Nikolaou', 'Ktiria Dimitriou', 'Farmakeio Ioannou', 'Kafeneio Plateia', 'Taxi Vlachos']},
  Polen:{groot:['Bank Wisła', 'Browar Tatry', 'Wisłatel', 'Energia Bałtyk', 'Ubezpieczenia Orzeł', 'Mleczarnia Mazury', 'Auto Pomorze', 'Podróże Karpaty', 'Stal Śląsk', 'Bursztyn Logistyka'],
    lokaal:['Piekarnia Nowak', 'Warsztat Kowalski', 'Bar Pod Lipą', 'Mięsny Wiśniewski', 'Budowa Wójcik', 'Apteka Kamińska', 'Kwiaty Lewandowska', 'Taxi Zieliński']},
  Denemarken:{groot:['Øresund Bank', 'Bryggeriet Nord', 'Dantel', 'Vindkraft Jylland', 'Fjordsikring', 'Mejeriet Fyn', 'Nordhavn Rederi', 'Nordkassen', 'Danrejser', 'Bornholm Røgeri'],
    lokaal:['Bageriet Hansen', 'Autoværksted Jensen', 'Kroen Nielsen', 'Slagter Pedersen', 'Tømrer Andersen', 'Apoteket Larsen', 'Blomster Christensen', 'Taxa Sørensen']},
  Noorwegen:{groot:['Fjordbanken', 'Nordlys Bryggeri', 'Telenord', 'Vannkraft Vest', 'Viking Forsikring', 'Fjellmeieriet', 'Lofoten Sjømat', 'Polar Reiser', 'Nordkapp Shipping', 'Trollheim Olje'],
    lokaal:['Bakeriet Hansen', 'Bilverksted Olsen', 'Kafé Bryggen', 'Slakter Johansen', 'Snekker Larsen', 'Apotek Berg', 'Blomster Nilsen', 'Taxi Haugen']},
  Zwitserland:{groot:['Alpenbank', 'Gletscher Bräu', 'Swisstel', 'Energie Rhône', 'Bergwacht Versicherung', 'Bergkäserei', 'Uhrenhaus Jura', 'Schokolade Säntis', 'Lac Léman Voyages', 'Gotthard Transport'],
    lokaal:['Bäckerei Meier', 'Garage Keller', 'Restaurant Rössli', 'Metzgerei Brunner', 'Holzbau Huber', 'Apotheke Frei', 'Blumen Gerber', 'Taxi Schneider']},
  Mexico:{groot:['Banco Azteca Sol', 'Cerveza Montaña', 'Telcel Norte', 'Energía del Golfo', 'Cemento Sierra', 'Tortillería Real', 'Aerolíneas Pacífico', 'Seguros Maya', 'Tequila Agave Azul', 'Autobuses Estrella'],
    lokaal:['Taquería El Güero', 'Panadería La Estrella', 'Taller Hernández', 'Abarrotes Doña Lupe', 'Carnicería Ramírez', 'Farmacia del Barrio', 'Ferretería Lozano', 'Lavandería Vega']},
  'Verenigde Staten':{groot:['Liberty Bank', 'Eagle Airlines', 'Pioneer Wireless', 'Summit Energy', 'Redwood Insurance', 'Starline Motors', 'Coastline Coffee', 'Prairie Foods', 'Skyline Tech', 'Big Sky Burgers'],
    lokaal:["Joe's Diner", 'Main Street Hardware', "Rosie's Bakery", 'Lakeside Auto Repair', 'Corner Pharmacy', 'Hometown Plumbing', "Mike's Pizza", 'Sunset Car Wash']},
};
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// club: {n, t} (t = 1 de hoogste league), land: het land van de club; geeft {naam} of null (geen club)
export function shirtSponsor(club, land = 'Nederland'){
  if (!club || !club.n) return null;
  const m = MERKEN[land] || MERKEN.Nederland, top = club.t === 1 || club.t === -1;
  const l = !top ? m.lokaal : m === MERKEN.Nederland ? m.groot : m.groot.concat(INTERNATIONAAL);
  return {naam:l[hash(String(club.n).replace(/ Vrouwen$/, '')) % l.length]};
}
