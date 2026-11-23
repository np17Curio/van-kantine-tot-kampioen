/* ===================== Kledingmerken (verzonnen) ===================== */
// Elke club speelt in shirts van een (verzonnen) kledingmerk. Hoe sterker de club, hoe groter het merk: een amateurclub
// in shirts van de sportwinkel om de hoek, een topclub bij een wereldmerk. Wordt een club sterker of zwakker, dan kan hij
// van merk wisselen. Elk merk heeft een eigen pixel-logo op de borst (1 = pixel), en hoe groter het merk, hoe groter het logo.
// niveau: 1 = lokaal, 2 = regionaal, 3 = landelijk, 4 = internationaal, 5 = wereldmerk
export const MERKEN = {
  hoeksport: {n:'Hoeksport', niveau:1, logo:['11', '10']},
  budgo:     {n:'Budgo',     niveau:1, logo:['01', '11']},
  tenzo:     {n:'Tenzo',     niveau:2, logo:['111', '010']},
  brixa:     {n:'Brixa',     niveau:2, logo:['101', '111']},
  falkon:    {n:'Falkon',    niveau:3, logo:['101', '111', '010']},
  novasport: {n:'Novasport', niveau:3, logo:['010', '111', '010']},
  strydex:   {n:'Strydex',   niveau:4, logo:['1001', '0110', '1001']},
  kairo:     {n:'Kairo',     niveau:4, logo:['1110', '0011', '1110']},
  vortiq:    {n:'Vortiq',    niveau:5, logo:['10001', '01010', '00100'], goud:true},
  aeron:     {n:'Aeron',     niveau:5, logo:['00100', '01110', '11011'], goud:true},
};
// Vanaf welke clubsterkte een merk van dat niveau interesse heeft
const DREMPEL = [[79, 5], [72, 4], [64, 3], [55, 2], [0, 1]];
export const merkNiveau = s => DREMPEL.find(([d]) => (s || 0) >= d)[1];
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// Het merk van een club (op naam en sterkte: dezelfde club houdt zijn merk zolang hij op hetzelfde niveau blijft)
export function merkVoor(naam, s){
  const niv = merkNiveau(s), opties = Object.keys(MERKEN).filter(k => MERKEN[k].niveau === niv);
  return opties[hash('merk|' + String(naam || '').replace(/ O19$| Vrouwen$/, '')) % opties.length]; // (het jeugd- en vrouwenteam: hetzelfde merk)
}
export const merkNaam = id => (MERKEN[id] || {}).n || '';
// Voor in de kaarten: "Vortiq ★★★★★"
export const merkTekst = id => { const m = MERKEN[id]; return m ? `${m.n} ${'★'.repeat(m.niveau)}` : ''; };
