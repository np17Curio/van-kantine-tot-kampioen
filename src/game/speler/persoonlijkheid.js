import { S } from '../../core/state.js';

/* ===================== Persoonlijkheid ===================== */
// Bij het aanmaken kies je er maximaal 3. Ze bepalen hoe je bent in het veld (acties, momenten, kaarten, stamina)
// en erbuiten (training, uitgaan, de trainer, teamgenoten, volgers en eigen gebeurtenissen).
export const MAX_PERS = 3;
export const PERS = {
  voetbalgek:{n:'Voetbalgek', i:'⚽', veld:'Begint elke wedstrijd scherper (focus +5).', buiten:'Training lukt vaker en je kunt extra trainen na de training. Sociale media interesseren je minder.',
    fx:{focusStart:5, train:.08, volgers:.8}},
  rebel:{n:'Rebel', i:'🤘', veld:'Dribbelt brutaal (+), maar is snel op de kast te krijgen: vaker provocaties, opstootjes en kaarten.', buiten:'De fans houden van je en de media schrijven graag over je, maar de trainer vertrouwt je minder snel.',
    fx:{kans:{drib:.04}, kalm:-8, moment:{provocatie:1.8, opstootje:1.8}, vert:.8, kroeg:1.3, rep:4, fans:1}},
  prof:{n:'Prof', i:'🧠', veld:'Gaat zuinig om met zijn krachten: stamina 12% langer.', buiten:'Minder blessures, de trainer vertrouwt je sneller en je laat je niet verleiden in de kroeg. Uitgaan geeft je weinig.',
    fx:{stamina:.88, blessure:.6, vert:1.2, kroeg:.5, uitMoraal:-3}},
  feestbeest:{n:'Feestbeest', i:'🎉', veld:'Geen bijzonder effect in het veld.', buiten:'Uitgaan geeft veel extra plezier (maar kost focus) en je wordt snel vrienden met teamgenoten. Wel vaker gedoe in de kroeg.',
    fx:{uitMoraal:5, uitFocus:-3, kroeg:1.6, band:1.3}},
  leider:{n:'Leider', i:'📣', veld:'Kalm onder druk (+5) en sterk bij penalty\'s.', buiten:'Je status stijgt sneller (je wordt eerder aanvoerder) en de sfeer in het team is beter.',
    fx:{kalm:5, kans:{penalty:.04}, status:1.15, teamBonus:.5}},
  showman:{n:'Showman', i:'🌟', veld:'Zoekt de actie: dribbelen en afwerken +, passen −. Vaker een één-op-één of een volley.', buiten:'Veel meer volgers en eerder sponsors, maar teamgenoten vinden je soms een beetje veel.',
    fx:{kans:{drib:.03, afw:.03, pas:-.02}, moment:{eenOpEen:1.3, volley:1.3}, volgers:1.5, band:.8}},
  teamspeler:{n:'Teamspeler', i:'🤝', veld:'Ziet de vrije man: passen +, zelf afwerken iets minder. Vaker de steekpass.', buiten:'Je wordt snel vrienden met teamgenoten en de chemie in het team is beter.',
    fx:{kans:{pas:.05, afw:-.02}, moment:{diepteBal:1.4}, band:1.3, teamBonus:.3}},
  ijskoud:{n:'IJskoud', i:'🧊', veld:'Niets brengt je van je stuk: kalmte +12, en een mislukte actie kost geen focus.', buiten:'Rustig in de media en ruzies laten je koud.',
    fx:{kalm:12, focusMis:0, ruzie:.3, focusNaSlecht:.6}},
  doorzetter:{n:'Doorzetter', i:'💪', veld:'Laat het hoofd niet hangen: een mislukte actie kost geen focus, een slechte wedstrijd maar de helft, en vermoeidheid hindert je minder.', buiten:'Sneller terug van blessures, en een nederlaag of een bankplek doet minder pijn.',
    fx:{focusMis:0, staminaStraf:.5, herstel:1, nederlaagMoraal:.5, focusNaSlecht:.5}},
  familiemens:{n:'Familiemens', i:'🏠', veld:'Geen bijzonder effect in het veld.', buiten:'De band met je ouders en je relatie groeit vanzelf, en je moraal is stabiel. Verhuizen naar het buitenland valt je zwaar.',
    fx:{familie:1, heimwee:10}},
};
// Deze combinaties kunnen niet samen
export const NIET_SAMEN = [['prof', 'feestbeest'], ['rebel', 'ijskoud'], ['showman', 'teamspeler']];
export const botsing = (a, b) => NIET_SAMEN.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
// Waarom kan deze persoonlijkheid er (nu) niet bij? null = kan wel
export function kanErBij(lijst, id){
  if (lijst.includes(id)) return null;
  if (lijst.length >= MAX_PERS) return `Je hebt er al ${MAX_PERS}.`;
  const b = lijst.find(x => botsing(x, id)); return b ? `${PERS[id].n} en ${PERS[b].n} gaan niet samen.` : null;
}
export function wisselPers(lijst, id){ return lijst.includes(id) ? lijst.filter(x => x !== id) : kanErBij(lijst, id) ? lijst : lijst.concat(id); }
export function willekeurigePers(n = 2){
  const ids = Object.keys(PERS).sort(() => Math.random() - .5), uit = [];
  for (const id of ids){ if (uit.length >= n) break; if (!kanErBij(uit, id)) uit.push(id); }
  return uit;
}
export const mijnPers = () => (S && S.sp && Array.isArray(S.sp.pers) ? S.sp.pers.filter(id => PERS[id]) : []);
export const heeft = id => mijnPers().includes(id);
// Velden die vermenigvuldigen (neutraal 1); de rest telt op (neutraal 0). focusMis: de laagste telt
const MAAL = new Set(['stamina', 'blessure', 'vert', 'kroeg', 'band', 'volgers', 'status', 'staminaStraf', 'nederlaagMoraal', 'ruzie', 'focusNaSlecht']);
// ---------- Je karakter (rustig ↔ heethoofd, uit je toonkeuzes: sp.toon) ----------
// Werkt als een extra persoonlijkheid die meegroeit: hoe verder je naar een kant gaat, hoe sterker het effect
export const KARAKTER = [
  {id:'rustig', n:'Rustig', i:'🧊', max:-40, veld:'Kalmte +8, penalty +4%, kalme keuzes +3%, minder provocaties en opstootjes.', buiten:'De trainer vertrouwt je sneller (+20%), je wordt sneller aanvoerder en ruzies doen minder. Wel minder volgers.',
    fx:{kalm:8, kans:{penalty:.04}, toonKans:{kalm:.03}, moment:{provocatie:.7, opstootje:.7}, vert:1.2, status:1.15, ruzie:.6, focusNaSlecht:.8, volgers:.9}},
  {id:'beheerst', n:'Beheerst', i:'🙂', max:-12, veld:'Kalmte +4, penalty +2%, kalme keuzes +1,5%.', buiten:'De trainer vertrouwt je wat sneller (+10%) en je status groeit iets sneller.',
    fx:{kalm:4, kans:{penalty:.02}, toonKans:{kalm:.015}, vert:1.1, status:1.07}},
  {id:'evenwichtig', n:'Evenwichtig', i:'⚖️', max:11, veld:'Geen extra effect in het veld.', buiten:'Teamgenoten mogen je (vriendschap +10%) en een nederlaag doet minder pijn.',
    fx:{band:1.1, nederlaagMoraal:.85}},
  {id:'vurig', n:'Vurig', i:'😤', max:39, veld:'Afwerken en duels +1,5%, felle keuzes +1,5%, je begint scherper (focus +2), kalmte −3.', buiten:'De fans houden van je vuur, je krijgt meer volgers (+20%), maar de trainer vertrouwt je iets minder snel.',
    fx:{kalm:-3, focusStart:2, kans:{afw:.015, verd:.015}, toonKans:{fel:.015}, fans:.5, volgers:1.2, vert:.95}},
  {id:'heethoofd', n:'Heethoofd', i:'🔥', max:100, veld:'Afwerken, duels en sprint +3%, felle keuzes +3%, je begint scherper (focus +4). Kalmte −8 en vaker provocaties en opstootjes.', buiten:'De fans aanbidden je en je krijgt veel meer volgers (+40%), maar de trainer vertrouwt je minder snel en ruzies wegen zwaarder.',
    fx:{kalm:-8, focusStart:4, kans:{afw:.03, verd:.03, cond:.03}, toonKans:{fel:.03}, moment:{provocatie:1.5, opstootje:1.5}, fans:1, volgers:1.4, vert:.9, ruzie:1.3}},
];
export const karakter = (t = (S && S.sp && S.sp.toon) || 0) => KARAKTER.find(k => t <= k.max) || KARAKTER[KARAKTER.length - 1];
// Al je effecten: je persoonlijkheden plus je karakter
const alleFx = () => [...mijnPers().map(id => PERS[id].fx), ...(S && S.sp ? [karakter().fx] : [])];
// Een keuze met een toon (kalm/fel) in de wedstrijd past bij je karakter: dan lukt hij wat vaker
export const karakterKans = opt => (opt && opt.toon && S && S.sp && (karakter().fx.toonKans || {})[opt.toon]) || 0;
export function pers(veld){
  const l = alleFx().map(fx => fx[veld]).filter(x => x !== undefined);
  if (veld === 'focusMis') return l.length ? Math.min(...l) : 1;
  return MAAL.has(veld) ? l.reduce((a, b) => a * b, 1) : l.reduce((a, b) => a + b, 0);
}
export const persKans = (st, type) => alleFx().reduce((a, fx) => a + ((fx.kans || {})[st] || 0) + (type === 'penalty' ? (fx.kans || {}).penalty || 0 : 0), 0);
export const persMomentFactor = type => alleFx().reduce((a, fx) => a * ((fx.moment || {})[type] || 1), 1);
export const persNamen = (lijst = mijnPers()) => lijst.map(id => `${PERS[id].i} ${PERS[id].n}`);
// Eén zin over je karakter (voor de krant bij de start)
const ZIN = {voetbalgek:'leeft voor voetbal', rebel:'is een echte rebel', prof:'is een prof tot in de puntjes', feestbeest:'is altijd in voor een feestje', leider:'is een geboren leider', showman:'is een showman', teamspeler:'zet het team altijd voorop', ijskoud:'is ijskoud', doorzetter:'geeft nooit op', familiemens:'is een echte familiemens'};
export function karakterZin(){ const l = mijnPers().map(id => ZIN[id]); if (!l.length) return ''; const z = l.length > 1 ? l.slice(0, -1).join(', ') + ' en ' + l[l.length - 1] : l[0]; return ` Wie hem kent, zegt: hij ${z}.`; }
