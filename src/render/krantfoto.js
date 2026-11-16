import { shirtSponsor } from '../data/shirtsponsors.js';
import { S, club } from '../core/state.js';
import { CLUBS } from '../data/gegevens.js';
import { ploegen } from './pitch.js';
import { STANDAARD, clubTenue } from '../data/tenues.js';
import { maakPixelFoto } from './pixel/krantfoto.js';
import { krantItem, krantPagina, rubriekVan, draaiBeeld, DRAAI_FRAMES, DRAAI_FPS } from './pixel/krant.js';
import { maakContract } from './pixel/contract.js';
import { jijTattoo, uiterlijkVoor } from './pixel/uiterlijk.js';
import { laadLogoBron, logoBron, logoGeladen } from './pixel/clublogo.js';
import { shirtNummer } from '../game/team/rugnummers.js';
import { ik, partnerVrouw, vrouwenWereld } from '../core/geslacht.js';
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
  aanvoerder:{alt:'met de aanvoerdersband, naast de trainer en de vice-aanvoerders', prijs:null},
  goudenbal:{alt:'met de Gouden Bal', prijs:'de Gouden Bal'},
  get ererondje(){ return {alt:`tijdens ${ik.zijn} ererondje`, prijs:null}; },
  huis:{alt:'voor het nieuwe huis', prijs:null},
  bruiloft:{alt:'op de bruiloft', prijs:null},
  strand:{alt:'op het strand', prijs:null},
  stad:{alt:"'s avonds in de stad", prijs:null},
  blessure:{alt:'op krukken', prijs:null},
  juich:{alt:'juichend na een doelpunt', prijs:null},
  straat:{alt:'op straat', prijs:null},
  veld:{alt:'op het veld', prijs:null},
};
const KLAAR = new Map();

const MUREN = [['#0f1a33', '#c6f432'], ['#1a1030', '#f3c44f'], ['#0d2a22', '#ffffff'], ['#2a0f14', '#f3c44f']];
// Wie staat er op de foto? img.dataset.uit = 'huid,haar,kapsel' (op het startscherm, nog zonder carrière), anders jouw speler
function fotoCtx(img){
  if (img && img.dataset.uit){ const [huid, haar, kapsel, lengte, bmi, vrouw] = img.dataset.uit.split(','); return {sleutel:img.dataset.sleutel || 'nieuw', uiterlijk:{huid:+huid, haar:+haar, kapsel, ...(lengte ? {lengte:+lengte, bmi:+bmi} : {}), ...(vrouw !== undefined ? {vrouw:vrouw === '1'} : {})}, club:'', muur:'#0f1a33', accent:'#c6f432', tenue:STANDAARD, ...(img.dataset.draai !== undefined ? {draai:+img.dataset.draai} : {}), ...(img.dataset.leeftijd ? {leeftijd:+img.dataset.leeftijd} : {})}; }
  const c = club(), [muur, accent] = MUREN[(S.sp.club || 0) % MUREN.length];
  const pl = ploegen(); return {sleutel:pl.jij, naam:S.sp.naam, uiterlijk:S.sp.uiterlijk || null, club:c ? c.n : '', muur, accent, tenue:clubTenue(S.sp.club), clubId:S.sp.club, logo:logoBron(S.sp.club), band:!!pl.band, leeftijd:S.sp.leeftijd, sponsor:S.sp.clubloos || S.sp.o23 ? null : shirtSponsor(c, thuisLand())}; // (de shirtsponsor van je club)
}
// (het uiterlijk als losse velden: huid en haar zijn getallen, opgeteld zouden huid 1 + haar 2 en huid 2 + haar 1 dezelfde foto geven)
const uitSleutel = u => u ? [u.huid, u.haar, u.kapsel, u.lengte ?? '', u.bmi ?? '', u.schoen ?? '', u.baard || '', u.vrouw ? 'v' : ''].join(',') : '';
const sleutelVan = (soort, ctx) => [soort, ctx.sleutel, ctx.club, ctx.draai ?? '', ctx.band ? 'C' : '', uitSleutel(ctx.uiterlijk), ctx.leeftijd || '', jijTattoo()].join('|'); // (ouder worden of een nieuwe tattoo: een nieuwe foto)
export function foto(soort, img){
  const ctx = fotoCtx(img), key = sleutelVan(soort, ctx);
  if (!KLAAR.has(key)){
    // (eerst het clublogo laden: dat hangt op de persmuur achter je)
    KLAAR.set(key, laadLogoBron(ctx.clubId).then(() => maakPixelFoto(soort, {...ctx, logo:logoBron(ctx.clubId)})));
  }
  return KLAAR.get(key);
}
// ---------- de pixelkranten (game/media/nieuws.js: vKrant) ----------
const PAGINA = new Map(), GEZIEN = new Set();
// De foto bij een artikel: een foto met een prijs (item.foto), of bij een transfer van jou de persfoto uit de contractscène
function krantFoto(item){
  if (!(S && S.sp)) return null;
  const ctx = fotoCtx();
  if (item.foto && FOTO_SOORTEN[item.foto.soort]) return {cv:maakPixelFoto(item.foto.soort, {...ctx, ...clubVanFoto(item.foto), foto:item.foto}, {w:180, h:72, canvas:true}), onder:item.foto.onder, door:PAPARAZZO.includes(item.foto.soort) ? 'Paparazzo' : 'Studio Doorbraak'};
  if (rubriekVan(item) === 'TRANSFERNIEUWS' && String(item.kop).includes(S.sp.naam) && !S.sp.clubloos && S.sp.club != null){
    let nr = null; try { nr = shirtNummer(); } catch (e){}
    const delen = String(S.sp.naam).trim().split(/\s+/), naam = delen.length > 1 ? delen.slice(1).join(' ') : delen[0];
    const {uitsnede} = maakContract({uit:uiterlijkVoor('jij|' + ctx.sleutel, {...(S.sp.uiterlijk || {}), vrouw:!!S.sp.vrouw}), tenue:ctx.tenue, nr, naam, logoImg:ctx.logo, alleenUitsnede:true}); // (met het echte clublogo op de sponsorwand)
    return {cv:uitsnede(), onder:`${S.sp.naam} toont ${ik.zijn} nieuwe shirt${nr ? ` met rugnummer ${nr}` : ''}.`, door:'Pixel Pers'};
  }
  // Geen eigen foto? Dan beslist de krant zelf of er een foto bij hoort (alleen bij een artikel over jou) en welke
  const f = autoFoto(item);
  if (f && f.vriend) return {cv:maakPixelFoto(f.soort, {...ctx, ...vriendCtx(), foto:f}, {w:180, h:72, canvas:true}), onder:f.onder, door:'Studio Doorbraak'};
  if (f) return {cv:maakPixelFoto(f.soort, {...ctx, foto:f}, {w:180, h:72, canvas:true}), onder:f.onder, door:PAPARAZZO.includes(f.soort) ? 'Paparazzo' : 'Studio Doorbraak'};
  return null;
}
// Hoort de foto bij een andere club dan je huidige (het ererondje bij je oude club na een transfer)? Dan het tenue, de naam en het logo van die club
function clubVanFoto(f){
  if (f.clubId == null || f.clubId === S.sp.club) return {};
  const c = CLUBS[f.clubId]; if (!c) return {};
  return {club:c.n, tenue:clubTenue(f.clubId), clubId:f.clubId, logo:logoBron(f.clubId), band:!!f.band, sponsor:shirtSponsor(c, thuisLand())};
}
const PAPARAZZO = ['huis', 'bruiloft', 'strand', 'stad', 'straat'];
// Hoort er een foto bij dit artikel? Alleen als het over jou gaat (je naam staat erin); anders geen foto (nieuws over andere clubs, de stand …).
// Welke foto: wat er in het artikel staat beslist, niet de rubriek (een roddel kan ook in een sportkrant staan). Van boven naar beneden:
// geblesseerd → op krukken; vakantie → het strand; uitgaan, feesten, casino → 's avonds in de stad; ander privénieuws (de liefde,
// een tattoo, een auto, een selfie …) → overdag op straat, in gewone kleren; een goal of een overwinning → juichend in het stadion;
// verder voetbalnieuws (contract, basisplaats, interland …) → een persfoto in je tenue voor de persmuur. Je partner staat erbij als die in het artikel staat.
const BLESSURE = /blessure|geblesseerd|kruisband|hamstring|enkelband|revalid|krukken|uitgeschakeld|zorgen om/;
const VAKANTIE = /strand|ibiza|malediven|vakantie|\bboot\b|\bzee\b|\bzon\b|zonnetje/;
// (iets wat je op het veld deed: dat gebeurde in het stadion, ook al staat er "club" of "fans" in de tekst)
const VELD = /doelpunt|scoort|\bgoal|treffer|hattrick|juich|vinger voor|het vak van|tribune|scheidsrechter|\bscheids\b|rode kaart|gele kaart|\brood\b|penalty|strafschop|vrije trap|assist|redding|op het veld|gewisseld|invalbeurt|aanvoerdersband|ererondje/;
const NACHT = /nachtclub|nacht|portier|feest|stappen|uitgaan|disco|kroeg|café|\bbar\b|karaoke|dansvloer|danst|champagne|vip-tafel|zonsopgang|sluitingstijd|doorhalen|casino|roulette|gokt|festival|crowdsurf|politie|dronken/;
const PRIVE = /terras|selfie|liefde|verloofd|samenwonen|uit tussen|vreemd|betrapt|gespot|fotograaf|scheldt|ophef|tattoo|kapsel|rijbewijs|rijexamen|sportwagen|\bauto\b|villa|penthouse|kookwedstrijd|reclame|doneert|verrast|zieke kinderen|hond|\bkat\b|baby|vader|moeder|zwanger|bruiloft|getrouwd/;
const GOAL = /scoort|\bgoal|doelpunt|treffer|hattrick/, WINST = /beslist|matchwinnaar|\bwint\b|winnaar|kampioen|\bheld\b/;
// Je jeugdvriend op de foto: zijn eigen uiterlijk (dezelfde sleutel als op het veld, veld3d.js) in het tenue van zijn club
function vriendCtx(){
  const v = S.sp.vriend, hier = v && v.club != null && CLUBS[v.club] && (!v.land || v.land === thuisLand());
  return {wie:'vriend|' + v.voornaam, band:false, ...(hier ? {club:CLUBS[v.club].n, tenue:clubTenue(v.club), clubId:v.club, logo:logoBron(v.club), sponsor:shirtSponsor(CLUBS[v.club], thuisLand())} : {club:'', tenue:STANDAARD, clubId:null, logo:null, sponsor:null})};
}
export function autoFoto(item){
  const sp = S && S.sp; if (!sp || !sp.naam) return null;
  const t = `${item.kop || ''} ${item.tekst || ''}`, l = t.toLowerCase(), naam = sp.naam;
  // Gaat de kop over je jeugdvriend (zijn naam staat erin, de jouwe niet)? Dan een persfoto van hem, niet van jou
  const v = sp.vriend, kop = String(item.kop || '');
  if (v && v.voornaam && kop.includes(v.voornaam) && !kop.includes(naam)) return {soort:'portret', vriend:true, onder:`Persfoto: ${v.voornaam}${v.n ? ' ' + v.n : ''}.`};
  if (!t.includes(naam)) return null;
  const r = sp.relatie, p = r && r.naam && t.includes(r.naam) ? r.naam : null, paar = p ? {partner:p, partnerVrouw:partnerVrouw()} : {};
  if (BLESSURE.test(l)) return {soort:'blessure', onder:`${naam} op krukken.`};
  if (VELD.test(l)) return GOAL.test(l) ? {soort:'juich', onder:`Feest bij ${naam} na het doelpunt.`} : WINST.test(l) ? {soort:'juich', onder:`Feest bij ${naam}.`} : {soort:'veld', onder:`${naam} op het veld.`};
  if (VAKANTIE.test(l)) return {soort:'strand', ...paar, onder:p ? `${naam} en ${p} genieten van de zon.` : `${naam} geniet van de zon.`};
  if (NACHT.test(l)) return {soort:'stad', ...paar, onder:p ? `${naam} en ${p} 's avonds in de stad.` : `${naam} 's avonds in de stad.`};
  if (PRIVE.test(l) || p || rubriekVan(item) === 'RODDEL') return {soort:'straat', ...paar, onder:p ? `${naam} en ${p} in de stad.` : `${naam} in de stad.`};
  if (GOAL.test(l)) return {soort:'juich', onder:`Feest bij ${naam} na het doelpunt.`};
  if (WINST.test(l)) return {soort:'juich', onder:`Feest bij ${naam}.`};
  return {soort:'portret', onder:`Persfoto: ${naam}.`};
}
export function krantNaRender(){
  // het clublogo (op de persmuur en de sponsorwand van de foto's) moet eerst geladen zijn; daarna opnieuw
  if (S && S.sp && !logoGeladen(S.sp.club)){ laadLogoBron(S.sp.club).then(() => krantNaRender()); return; }
  const rustig = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('figure.pixelkrant[data-krant]:not([data-klaar])').forEach(fig => {
    if (fig.closest('details:not([open])')) return; // (ingeklapt: pas tekenen als hij opengaat, dan draait hij ook in)
    const item = krantItem(fig.dataset.krant); if (!item) return; fig.dataset.klaar = '1';
    const sl = [item.bron, item.kop, item.wanneer || '', item.foto ? item.foto.soort : ''].join('|');
    let pagina = PAGINA.get(sl);
    if (!pagina){ try { pagina = krantPagina(item, krantFoto(item)); } catch (e){ console.warn('pixelkrant', e); pagina = krantPagina(item, null); } PAGINA.set(sl, pagina); if (PAGINA.size > 80) PAGINA.delete(PAGINA.keys().next().value); }
    const cv = fig.querySelector('canvas'); cv.width = pagina.width; cv.height = pagina.height; cv.getContext('2d').drawImage(pagina, 0, 0);
    if (GEZIEN.has(sl) || rustig){ GEZIEN.add(sl); return; }
    GEZIEN.add(sl);
    // nieuw artikel: de krant draait het beeld in (stijlbron, anim 'krant'), over de stilstaande pagina heen
    const klein = pagina.klein || pagina, maat = Math.ceil(Math.hypot(klein.width, klein.height)) + 8, ov = document.createElement('canvas');
    ov.className = 'krantdraai'; ov.width = ov.height = maat; ov.setAttribute('aria-hidden', 'true');
    const f = cv.clientWidth / klein.width || 1; Object.assign(ov.style, {width:maat * f + 'px', height:maat * f + 'px', left:(cv.offsetLeft + cv.clientWidth / 2 - maat * f / 2) + 'px', top:(cv.offsetTop + cv.clientHeight / 2 - maat * f / 2) + 'px'});
    fig.appendChild(ov); cv.style.visibility = 'hidden';
    const g = ov.getContext('2d'); g.imageSmoothingEnabled = false; let n = 0;
    const tik = () => { if (!ov.isConnected){ return; } g.clearRect(0, 0, maat, maat); g.drawImage(draaiBeeld(klein, n, maat), 0, 0);
      if (++n < DRAAI_FRAMES && n < 16) setTimeout(tik, 1000 / DRAAI_FPS); else { ov.remove(); cv.style.visibility = ''; } };
    tik();
  });
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
