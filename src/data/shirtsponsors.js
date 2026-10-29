/* ===================== Shirtsponsors van de clubs ===================== */
// Verzonnen merken (geen echte bedrijven). Elke club houdt altijd dezelfde sponsor (gekozen uit een hash van de clubnaam).
// Clubs uit de hoogste league hebben grote merken, lagere leagues lokale bedrijven.
const GROOT = ['Polderbank', 'Kroonbier', 'Turbo Telecom', 'Velox Energie', 'Noordster Reizen', 'Duinzicht Verzekeringen', 'Zuivelhoeve', 'Atlas Airlines', 'Meridian Auto', 'Orion Mobile',
  'Kustlijn Bank', 'Brandaris Tech', 'Lumina Energie', 'Havenstad Logistiek', 'Solara', 'Vortex Games', 'Delta Zorg', 'Nexus Pay', 'Molenaar Bier', 'Horizon Hotels'];
const LOKAAL = ['Bakkerij De Molen', 'Garage Van Dijk', 'Snackbar De Hoek', 'Bouwbedrijf Jansen', 'Fietsen Smit', 'Kapsalon Knip', 'Slagerij Bakker', 'Installatie Visser',
  'Café De Kantine', 'Autobedrijf Mulder', 'Bloemen Bosman', 'Tegelhandel De Wit', 'Hoveniers Groen', 'Drukkerij Kramer', 'Schilders Dekker', 'Taxi Peters'];
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// club: {n, t} (t = 1 de hoogste league); geeft {naam} of null (geen club)
export function shirtSponsor(club){
  if (!club || !club.n) return null;
  const l = club.t === 1 || club.t === -1 ? GROOT : LOKAAL;
  return {naam:l[hash(String(club.n).replace(/ Vrouwen$/, '')) % l.length]};
}
