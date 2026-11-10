import { shirtSponsor } from '../data/shirtsponsors.js';
import { S, club } from '../core/state.js';
import { ploegen } from './pitch.js';
import { STANDAARD, clubTenue } from '../data/tenues.js';
import { maakPixelFoto } from './pixel/krantfoto.js';
import { ik, vrouwenWereld } from '../core/geslacht.js';
import { thuisLand } from '../data/landen.js';

/* ===================== Foto's in de krant ===================== */
// Een artikel met foto heeft <img data-foto="soort">. Na elke weergave wordt de foto gemaakt (in pixels, met jouw pixelspeler:
// render/pixel/krantfoto.js) of uit het geheugen gehaald.
export const FOTO_SOORTEN = {
  hattrick:{alt:'met de wedstrijdbal na zijn hattrick', prijs:'de wedstrijdbal'},
  get motm(){ const t = vrouwenWereld() ? 'de Speelster van de Wedstrijd-trofee' : 'de Man of the Match-trofee'; return {alt:'met ' + t, prijs:t}; },
  svs:{alt:'met de bokaal voor Speler van het Seizoen', prijs:'de bokaal'},
  topscorer:{alt:'met de Gouden Schoen voor de topscorer', prijs:'de Gouden Schoen'},
  portret:{alt:'op de persfoto', prijs:null},
  get ererondje(){ return {alt:`tijdens ${ik.zijn} ererondje`, prijs:null}; },
};
const KLAAR = new Map();

const MUREN = [['#0f1a33', '#c6f432'], ['#1a1030', '#f3c44f'], ['#0d2a22', '#ffffff'], ['#2a0f14', '#f3c44f']];
// Wie staat er op de foto? img.dataset.uit = 'huid,haar,kapsel' (op het startscherm, nog zonder carrière), anders jouw speler
function fotoCtx(img){
  if (img && img.dataset.uit){ const [huid, haar, kapsel, lengte, bmi, vrouw] = img.dataset.uit.split(','); return {sleutel:img.dataset.sleutel || 'nieuw', uiterlijk:{huid:+huid, haar:+haar, kapsel, ...(lengte ? {lengte:+lengte, bmi:+bmi} : {}), ...(vrouw !== undefined ? {vrouw:vrouw === '1'} : {})}, club:'', muur:'#0f1a33', accent:'#c6f432', tenue:STANDAARD, ...(img.dataset.draai !== undefined ? {draai:+img.dataset.draai} : {})}; }
  const c = club(), [muur, accent] = MUREN[(S.sp.club || 0) % MUREN.length];
  const pl = ploegen(); return {sleutel:pl.jij, naam:S.sp.naam, uiterlijk:S.sp.uiterlijk || null, club:c ? c.n : '', muur, accent, tenue:clubTenue(S.sp.club), clubId:S.sp.club, band:!!pl.band, sponsor:S.sp.clubloos || S.sp.o23 ? null : shirtSponsor(c, thuisLand())}; // (de shirtsponsor van je club)
}
// (het uiterlijk als losse velden: huid en haar zijn getallen, opgeteld zouden huid 1 + haar 2 en huid 2 + haar 1 dezelfde foto geven)
const uitSleutel = u => u ? [u.huid, u.haar, u.kapsel, u.lengte ?? '', u.bmi ?? '', u.schoen ?? '', u.vrouw ? 'v' : ''].join(',') : '';
const sleutelVan = (soort, ctx) => [soort, ctx.sleutel, ctx.club, ctx.draai ?? '', ctx.band ? 'C' : '', uitSleutel(ctx.uiterlijk)].join('|');
export function foto(soort, img){
  const ctx = fotoCtx(img), key = sleutelVan(soort, ctx);
  if (!KLAAR.has(key)){
    KLAAR.set(key, Promise.resolve().then(() => maakPixelFoto(soort, ctx)));
  }
  return KLAAR.get(key);
}
export function fotoNaRender(){
  document.querySelectorAll('img[data-foto]:not([src])').forEach(img => {
    if (!img.dataset.uit && !(S && S.sp)) return;
    foto(img.dataset.foto, img).then(url => { if (!img.isConnected) return; img.src = url; img.closest('.krantfoto')?.classList.add('klaar'); });
  });
}
// Voor tests: een portret in een opgegeven tenue (bijvoorbeeld om de designs te bekijken)
if (typeof window !== 'undefined') window.__fotoTenue = (tenue) => Promise.resolve(maakPixelFoto('portret', {sleutel:'t', uiterlijk:{huid:1, haar:1, kapsel:'kort'}, club:'Test', muur:'#0f1a33', accent:'#c6f432', tenue}));
if (typeof window !== 'undefined') window.__foto = (soort, uit, draai) => foto(soort, uit ? {dataset:{uit, sleutel:'test', draai}} : undefined);
