/* ===================== Tattoos: inkt op de armen van jouw pixelspeler ===================== */
// Net als de leeftijd (pixel/leeftijd.js) zit het in de look: lookVan (atlas.js) plakt een code achter het kapsel,
// 'kort@01200~40' (zonder leeftijdscode: 'kort@00000~40'). Zo gaan je tattoos vanzelf mee naar elke scène (het veld,
// de krantenfoto's, de persconferentie, de contractscène, de opkomst), zonder dat een scène iets extra's doorgeeft.
// rig.js tekent de armen zoals altijd en kleurt daarna alleen de HUID-pixels van de arm in (tattooArm): onder een
// lange mouw (een pak, een jas, een trainingspak) zie je dus niets, in een voetbalshirt zie je je onderarmen.
// De code: twee cijfers, [rechterarm (de voorste), linkerarm]. 0 = niets, 1 = een kleine tattoo, 2 = een tekst
// (een naam), 3 = allebei, 4 = een full sleeve (de hele arm vol).
// Nieuwe kleursleutels: '$' de inkt, '`' een kleur in de inkt (rood).

// De lijst op S.sp.tattoos ([{soort, arm}]) als code ('' = geen tattoo op je armen)
export function tattooCode(lijst){
  if (!Array.isArray(lijst) || !lijst.length) return '';
  const arm = a => { const t = lijst.filter(x => x && x.arm === a); if (t.some(x => x.soort === 'mouw')) return 4;
    return (t.some(x => x.soort === 'klein') ? 1 : 0) + (t.some(x => x.soort === 'tekst') ? 2 : 0); };
  const c = '' + arm('r') + arm('l');
  return c === '00' ? '' : c;
}
// Uit het kapsel ('kort@00000~40'): {r, l} of null
export function leesTattoo(kapsel){
  const s = String(kapsel || '').split('~')[1]; if (!s) return null;
  const r = +s[0] || 0, l = +s[1] || 0;
  return r || l ? {r, l} : null;
}
// De kleuren in het palet (inkt die een beetje met de huid mengt, zoals een echte tattoo)
const mengHex = (a, b, t) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  return '#' + [16, 8, 0].map(s => Math.round(((x >> s) & 255) + (((y >> s) & 255) - ((x >> s) & 255)) * t).toString(16).padStart(2, '0')).join(''); };
export function tattooKleuren(k){ const s = k.s || '#f7c9a8'; k.$ = mengHex('#1c2236', s, .18); k['`'] = mengHex('#b3282f', s, .22); return k; }

// Ontwerpjes per arm, als een raster van 5 rijen (van de elleboog naar de pols, alleen het stuk dat niet onder de vuist zit)
// bij 4 kolommen (dwars op de arm). '$' = inkt, '`' = rood, ' ' = huid. Zo is elk ontwerp in elke pose hetzelfde en leesbaar.
const ONTWERP = {
  // full sleeve: een rode roos met een donkere rand, met erboven en eronder ranken en een band bij de pols
  mouw:  ['$  $', '$``$', '````', '$``$', '$$$$'],
  mouwB: ['$  $', ' $$ ', '$``$', ' $$ ', '$  $'],   // de bovenarm (het stuk onder de korte mouw)
  // een naam: schuine schrijfletters, als een lopende lijn in de lengte van de onderarm
  tekst: [' $  ', '$ $ ', ' $ $', '  $ ', ' $  '],
  // een kleintje: een rood hartje met een donker puntje
  klein: ['    ', '`` `', '````', ' `` ', '  $ '],
  // naam en een kleintje samen: de naam in het midden, een rood hartje ernaast
  beide: [' $  ', '$ ``', ' $``', '  $ ', ' $  '],
};
// Eén stuk arm (van (x0,y0) naar (x1,y1), zoals rig.js het met een ronde kwast tekende). n = het cijfer van deze arm,
// deel = 'onder' (onderarm) of 'boven' (bovenarm: alleen een sleeve komt daar). Alleen huid ('s'/'S') wordt inkt.
export function tattooArm(c, x0, y0, x1, y1, n, deel = 'onder'){
  if (!n || (deel === 'boven' && n !== 4)) return;
  const grid = n === 4 ? ONTWERP[deel === 'boven' ? 'mouwB' : 'mouw'] : n === 3 ? ONTWERP.beide : n === 2 ? ONTWERP.tekst : ONTWERP.klein;
  const dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy || 1, len = Math.sqrt(len2);
  const zicht = deel === 'boven' ? 1 : Math.max(.3, 1 - 3.5 / len); // (de vuist valt over de pols: alleen het stuk ervoor telt)
  const bx = Math.floor(Math.min(x0, x1)) - 2, by = Math.floor(Math.min(y0, y1)) - 2, ex = Math.ceil(Math.max(x0, x1)) + 2, ey = Math.ceil(Math.max(y0, y1)) + 2;
  for (let y = by; y <= ey; y++) for (let x = bx; x <= ex; x++){
    if (!c.is(x, y, 'sS')) continue;
    const px = x - x0, py = y - y0, t = (px * dx + py * dy) / len2, zij = (px * dy - py * dx) / len; // t: 0 = elleboog/schouder, 1 = pols; zij: dwars op de arm
    if (t < -.2 || Math.abs(zij) > 1.55) continue; // (alleen wat de kwast van deze arm net tekende)
    const u = t / zicht; if (u > 1.05) continue;
    const rij = Math.max(0, Math.min(4, Math.round(u * 4))), kol = Math.max(0, Math.min(3, Math.round(zij + 1.5)));
    const k = grid[rij][kol]; if (k !== ' ') c.px(x, y, k);
  }
}
