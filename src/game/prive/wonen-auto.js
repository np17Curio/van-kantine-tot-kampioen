import { S, club, mod, seizoenLabel, statWaarde } from '../../core/state.js';
import { clamp, geldTxt, pick, rnd, shuffle } from '../../core/utils.js';
import { NL_VRAAG, nietNL } from '../../data/landen.js';
import { roddel } from '../media/roddel.js';

/* ===================== Buiten het voetbal: rijbewijs, auto en wonen ===================== */
export const WONINGEN = [
  {id:'ouders',      n:'Bij je ouders',             prijs:0,       moraal:0, d:'Gratis, en je moeder kookt.'},
  {id:'studio',      n:'Studio huren',              huur:80,       moraal:0, d:'€80 per week · je eigen plek'},
  {id:'huurhuis',    n:'Huurhuis',                  huur:120,      moraal:1, d:'€120 per week · samen met je vriendin', verborgen:true},
  {id:'appartement', n:'Appartement kopen',         prijs:120000,  moraal:1, d:'+1 moraal per week'},
  {id:'penthouse',   n:'Penthouse in de stad',      prijs:350000,  moraal:1, d:'+1 moraal per week · +2 reputatie'},
  {id:'huis',        n:'Vrijstaand huis met tuin',  prijs:900000,  moraal:2, d:'+2 moraal per week · grote tuin'},
  {id:'villa',       n:'Villa met eigen veldje',    prijs:2500000, moraal:2, d:'+2 moraal en +2 fitheid per week'}
];
export const AUTOS = [
  {id:'oud',   n:'Tweedehands auto',     prijs:3500,   d:'Rijdt nog. Meestal.'},
  {id:'nieuw', n:'Nieuwe auto',          prijs:30000,  d:'+3 moraal · start altijd'},
  {id:'sport', n:'Knalgele sportwagen',  prijs:400000, d:'+6 reputatie, maar −5 vertrouwen trainer'}
];
export const RIJLES = 50, THEORIE_PRIJS = 40, EXAMEN_PRIJS = 150;
// Verkeersvragen voor het theorie-examen: [vraag, goed, fout, fout]
export const THEORIE = [
  ['Hoe hard mag je overdag (6 tot 19 uur) maximaal op de Nederlandse snelweg?', '100 km/u', '130 km/u', '120 km/u'],
  ['Wat is de maximumsnelheid binnen de bebouwde kom, als er geen bord staat?', '50 km/u', '30 km/u', '60 km/u'],
  ['Wat is de maximumsnelheid buiten de bebouwde kom op een gewone weg (geen autoweg of snelweg)?', '80 km/u', '100 km/u', '60 km/u'],
  ['Hoeveel alcohol mag je als beginnende bestuurder (eerste 5 jaar) maximaal in je bloed hebben?', '0,2 promille', '0,5 promille', '0,8 promille'],
  ['Je komt bij een kruising zonder borden of strepen. Wie gaat er voor?', 'Verkeer van rechts', 'Verkeer van links', 'Wie er het eerst is'],
  ['Wat betekent een doorgetrokken streep in het midden van de weg?', 'Je mag er niet overheen rijden', 'Je mag hier inhalen', 'Je mag hier parkeren'],
  ['Mag je je telefoon vasthouden als je voor een rood stoplicht stilstaat?', 'Nee, ook dan niet', 'Ja, als je stilstaat mag het', 'Ja, maar alleen om te bellen'],
  ['Het verkeerslicht knippert oranje. Wat betekent dat?', 'Het licht regelt niets: let goed op en volg de gewone voorrangsregels', 'Je moet stoppen', 'Je hebt altijd voorrang'],
  ['Hoeveel tijd houd je minimaal afstand tot de auto voor je?', '2 seconden', 'Een halve seconde', '10 seconden'],
  ['Een voetganger wil bij een zebrapad oversteken. Wat doe je?', 'Je laat hem voorgaan', 'Je toetert zodat hij wacht', 'Je rijdt snel door voordat hij oversteekt'],
  ['Wat betekent een rond bord met een rode rand en een helemaal witte binnenkant?', 'Gesloten voor alle voertuigen', 'Eenrichtingsweg', 'Hier mag je parkeren']
];
export const woning = () => WONINGEN.find(w => w.id === (S.sp.woning || 'ouders')) || WONINGEN[0];
export const autoInfo = () => AUTOS.find(a => a.id === S.sp.auto) || null;
export const verkoopWaarde = () => Math.round((woning().prijs || 0) * .8);
export const autoWaarde = () => Math.round(((autoInfo() || {}).prijs || 0) * .5);
export const woningMoraal = () => woning().moraal || 0;
export function rijles(){
  const sp = S.sp, w = S.week; if (sp.leeftijd < 17 || w.rijles || sp.geld < RIJLES || sp.rijbewijs) return;
  sp.geld -= RIJLES; sp.rij.lessen++; w.rijles = true;
  w.tekst.push(pick([`Rijles ${sp.rij.lessen}: je instructeur grijpt maar één keer naar de rem.`, `Rijles ${sp.rij.lessen}: inparkeren blijft lastig, maar het gaat beter.`, `Rijles ${sp.rij.lessen}: je rijdt voor het eerst over de snelweg. Spannend!`, `Rijles ${sp.rij.lessen}: rotondes zijn geen probleem meer.`]));
}
export function startTheorie(){
  const sp = S.sp, w = S.week; if (sp.leeftijd < 17 || sp.rij.theorie || w.theorie || sp.geld < THEORIE_PRIJS) return;
  sp.geld -= THEORIE_PRIJS;
  w.theorie = {vragen:shuffle(THEORIE.filter(r => !(nietNL() && NL_VRAAG.test(r.join(' '))))).slice(0, 3).map(r => { const opts = shuffle(r.slice(1)); return {q:r[0], opts, goed:opts.indexOf(r[1])}; }), i:0, goed:0, laatste:null, klaar:false};
}
export function theorieAntwoord(j){
  const sp = S.sp, T = S.week.theorie; if (!T || T.klaar) return;
  const v = T.vragen[T.i], ok = j === v.goed; if (ok) T.goed++;
  T.laatste = ok ? 'Goed!' : `Fout. Het goede antwoord was: ${v.opts[v.goed]}.`;
  T.i++;
  if (T.i >= T.vragen.length){
    T.klaar = true;
    if (T.goed >= 2){ sp.rij.theorie = true; mod('moraal', 3); S.week.tekst.push(`Theorie-examen gehaald (${T.goed} van de 3 goed)! Nu nog het praktijkexamen.`); }
    else S.week.tekst.push(`Theorie-examen gezakt (${T.goed} van de 3 goed). Volgende week mag je het opnieuw proberen.`);
  }
}
export function examenKans(){ const sp = S.sp; return clamp(.15 + sp.rij.lessen * .035 + (statWaarde('kalm') - 55) / 150, .1, .92); }
export function praktijkExamen(){
  const sp = S.sp, w = S.week; if (sp.leeftijd < 18 || !sp.rij.theorie || sp.rijbewijs || w.examen || sp.rij.lessen < 5 || sp.geld < EXAMEN_PRIJS) return;
  sp.geld -= EXAMEN_PRIJS; w.examen = true;
  if (rnd() < examenKans()){
    sp.rijbewijs = true; mod('moraal', 10); S.car.hist.push(`${seizoenLabel()}: rijbewijs gehaald`);
    w.tekst.push('GESLAAGD! De examinator geeft je een hand. Nooit meer op de fiets naar de training in de regen.');
    roddel(`${S.sp.naam} haalt zijn rijbewijs`, `De ${sp.leeftijd}-jarige ${club().t <= 2 ? 'prof' : 'speler'} slaagde in één keer... of toch niet? Hij wil het niet zeggen.`);
  } else {
    mod('moraal', -6);
    w.tekst.push(pick(['Gezakt. Je vergat in je spiegel te kijken bij het afslaan.', 'Gezakt. Je reed bijna een eend aan.', 'Gezakt. Inparkeren ging helemaal mis.']) + ' Meer lessen helpen.');
    roddel(`${S.sp.naam} zakt voor rijexamen`, 'Op het veld is hij snel, maar achter het stuur liep het mis. Een fan zag hem huilend uit de lesauto stappen.');
  }
}
export function verhuis(id){
  const sp = S.sp, nw = WONINGEN.find(w => w.id === id), oud = woning();
  if (!nw || nw.id === oud.id || sp.leeftijd < 18) return;
  const opbrengst = verkoopWaarde(), kost = (nw.prijs || 0) - opbrengst; if (sp.geld < kost) return;
  sp.geld -= kost; sp.woning = id;
  if (id === 'ouders' && sp.relatie && sp.relatie.samen){ sp.relatie.samen = false; sp.relatie.band = clamp(sp.relatie.band - 15, 0, 100); S.week.tekst.push(`${sp.relatie.naam} gaat niet mee naar je ouders. Jullie wonen niet meer samen.`); }
  if (oud.id === 'ouders') mod('moraal', 6);
  if (id === 'penthouse') mod('rep', 2);
  if (id === 'villa') mod('moraal', 15);
  if (id === 'huis') mod('moraal', 8);
  S.car.hist.push(`${seizoenLabel()}: verhuisd naar ${nw.n.replace(/ (kopen|huren)$/, '').toLowerCase()}`);
  S.week.tekst.push(id === 'ouders' ? 'Je trekt weer in bij je ouders. Je moeder heeft je kamer nog precies zo gelaten.'
    : id === 'studio' ? 'Je hebt je eigen studio! Klein, maar van jou. Je moeder komt wel elke week met een pan soep langs.'
    : `Je woont nu in je nieuwe ${nw.n.replace(/ (kopen|huren)$/, '').toLowerCase()}.${opbrengst ? ` Je oude woning is verkocht voor ${geldTxt(opbrengst)}.` : ''}`);
  if ((nw.prijs || 0) >= 350000) roddel(`${sp.naam} koopt ${id === 'villa' ? 'villa' : id === 'huis' ? 'groot huis' : 'penthouse'} van ${geldTxt(nw.prijs)}`, id === 'villa' ? 'Met een eigen voetbalveldje in de tuin. De buren hopen dat hij niet te hard schiet.' : 'De kranten hebben foto\'s van de verhuiswagen. Volgens de buren is hij "heel aardig".');
}
export function koopAuto(id){
  const sp = S.sp, a = AUTOS.find(x => x.id === id); if (!a || !sp.rijbewijs || sp.auto === id) return;
  const kost = a.prijs - autoWaarde(); if (sp.geld < kost) return;
  const eerste = !sp.auto;
  sp.geld -= kost; sp.auto = id;
  if (eerste) mod('moraal', 6);
  if (id === 'nieuw') mod('moraal', 3);
  if (id === 'sport'){ mod('rep', 6); mod('vert', -5); }
  S.week.tekst.push(id === 'oud' ? 'Je koopt een tweedehands auto. Hij ruikt naar oude friet, maar hij is van jou.' : id === 'nieuw' ? 'Je rijdt je nieuwe auto de showroom uit. Hij ruikt nog naar nieuw.' : 'Je knalgele sportwagen staat voor de deur. Je trainer kijkt er met een frons naar.');
  if (id === 'sport') roddel(`${sp.naam} rijdt in knalgele sportwagen`, 'Bij de training valt hij in ieder geval op. De trainer zou er "niet blij" mee zijn.');
}
