/* ===================== Het 3×5-pixelfont van pxl ===================== */
// Overgenomen uit pxl (github.com/uilianks/pxl, MIT: src/core/font.ts), zodat teksten in de pixelscènes precies zo uitkomen
// als in de stijlbron (art/chibi_anims.px.js). "#" = inkt, rijen gescheiden door "/". Kleine letters worden hoofdletters.
const FONT = {
  A:'###/#.#/###/#.#/#.#', B:'##./#.#/##./#.#/##.', C:'###/#../#../#../###', D:'##./#.#/#.#/#.#/##.', E:'###/#../##./#../###', F:'###/#../##./#../#..',
  G:'###/#../#.#/#.#/###', H:'#.#/#.#/###/#.#/#.#', I:'###/.#./.#./.#./###', J:'..#/..#/..#/#.#/###', K:'#.#/#.#/##./#.#/#.#', L:'#../#../#../#../###',
  M:'#.#/###/###/#.#/#.#', N:'##./#.#/#.#/#.#/#.#', O:'###/#.#/#.#/#.#/###', P:'###/#.#/###/#../#..', Q:'###/#.#/#.#/###/..#', R:'##./#.#/##./#.#/#.#',
  S:'###/#../###/..#/###', T:'###/.#./.#./.#./.#.', U:'#.#/#.#/#.#/#.#/###', V:'#.#/#.#/#.#/#.#/.#.', W:'#.#/#.#/###/###/#.#', X:'#.#/#.#/.#./#.#/#.#',
  Y:'#.#/#.#/###/.#./.#.', Z:'###/..#/.#./#../###',
  0:'###/#.#/#.#/#.#/###', 1:'##./.#./.#./.#./###', 2:'###/..#/###/#../###', 3:'###/..#/.##/..#/###', 4:'#.#/#.#/###/..#/..#',
  5:'###/#../###/..#/###', 6:'###/#../###/#.#/###', 7:'###/..#/..#/.#./.#.', 8:'###/#.#/###/#.#/###', 9:'###/#.#/###/..#/###',
  ' ':'.../.../.../.../...', '.':'././././#', ',':'../../../.#/#.', '!':'#/#/#/./#', '?':'###/..#/.##/.../.#.', ':':'./#/./#/.', ';':'../.#/../.#/#.',
  "'":'#/#/././.', '"':'#.#/#.#/.../.../...', '-':'.../.../###/.../...', '+':'.../.#./###/.#./...', '/':'..#/..#/.#./#../#..', '(':'.#/#./#./#./.#',
  ')':'#./.#/.#/.#/#.', '=':'.../###/.../###/...', '%':'#.#/..#/.#./#../#.#', '#':'#.#/###/#.#/###/#.#', '*':'.../#.#/.#./#.#/...', _:'.../.../.../.../###',
  '<':'..#/.#./#../.#./..#', '>':'#../.#./..#/.#./#..', '&':'.#./#.#/.#./#.#/.##', $:'.##/##./.#./.##/##.', '@':'###/#.#/#.#/#../###',
};
const CACHE = new Map();
export function glyph(ch){
  const k = FONT[ch] ? ch : FONT[ch.toUpperCase()] ? ch.toUpperCase() : '?';
  let g = CACHE.get(k); if (!g){ g = FONT[k].split('/'); CACHE.set(k, g); } return g;
}
export function regelBreedte(regel, {scale = 1, gap = 1} = {}){ let w = 0; for (const ch of regel) w += (glyph(ch)[0].length + gap) * scale; return regel.length ? w - gap * scale : 0; }
// Een tekst op een Doek (rig.js), zoals pxl's text(x, y, s, c, {scale, gap, align})
export function tekst(c, x, y, s, k, {scale = 1, gap = 1, align} = {}){
  s = String(s);
  const lw = regelBreedte(s, {scale, gap});
  let cx = align === 'c' ? x - Math.floor(lw / 2) : align === 'r' ? x - lw + 1 : x;
  for (const ch of s){
    const rows = glyph(ch);
    rows.forEach((rij, r) => { for (let b = 0; b < rij.length; b++) if (rij[b] === '#') for (let yy = 0; yy < scale; yy++) for (let xx = 0; xx < scale; xx++) c.px(cx + b * scale + xx, y + r * scale + yy, k); });
    cx += (rows[0].length + gap) * scale;
  }
}
// Een naam zonder accenten (het font kent alleen A-Z), in hoofdletters
export const zonderAccent = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/ß/g, 'SS').replace(/[øØ]/g, 'O').toUpperCase();
