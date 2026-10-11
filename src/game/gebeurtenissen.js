import { S, club, mod, seizoenLabel } from '../core/state.js';
import { clamp, geldTxt, pick, randInt, rnd } from '../core/utils.js';
import { MEIDEN } from '../data/gegevens.js';
import { selectie } from './competitie/spelers.js';
import { roddel } from './media/roddel.js';
import { belevenissen } from './prive/belevenissen.js';
import { dieren } from './prive/dieren.js';
import { ouders } from './prive/familie.js';
import { kindLeeftijd, scheidingKosten } from './prive/gezin.js';
import { VAKKEN, schoolCijfer } from './prive/school.js';
import { checkStatus, statusPunten } from './speler/status.js';
import { openVenster } from './transfers/transfers.js';
import { verhaalEvents } from './speler/verhaal.js';

/* ===================== Gebeurtenissen ===================== */
export function eindRelatie(tekst){
  const sp = S.sp, r = sp.relatie, naam = r.naam, extra = [];
  (sp.exen = sp.exen || []).includes(naam) || sp.exen.push(naam);
  if (r.getrouwd){ const k = scheidingKosten(); sp.geld -= k; extra.push(`Jullie scheiden. ${naam} krijgt de helft van je spaargeld (${geldTxt(k)}).`); S.car.hist.push(`${seizoenLabel()}: gescheiden van ${naam}`); }
  if (r.samen && sp.woning === 'huurhuis'){ sp.woning = 'ouders'; extra.push('Jullie zeggen het huurhuis op. Je trekt tijdelijk weer bij je ouders in.'); }
  else if (r.samen) extra.push(`${naam} verhuist.`);
  if (sp.kinderen && sp.kinderen.length) extra.push(`Je ziet ${sp.kinderen.length === 1 ? sp.kinderen[0].naam : 'de kinderen'} voortaan om het weekend.`);
  if (r.zwanger > 0){ sp.exZw = {weken:r.zwanger, naam}; extra.push(`${naam} is nog wel zwanger van jullie kindje. Jullie gaan er samen goed voor zorgen.`); }
  tekst = [tekst, ...extra].join(' ');
  sp.relatie = null; mod('moraal', -15 - (r.getrouwd ? 10 : 0)); mod('focus', -10);
  if (club().t <= 2){ mod('rep', -3); return `${tekst} De roddelbladen smullen ervan: "Het is uit tussen ${sp.naam} en ${naam}".`; }
  return tekst;
}
export function maakEvent(){
  // Eerst je eigen verhaal (wonderkind, gewone start of laatbloeier): zolang er nog iets te beleven is, vaak voorrang
  { const v = verhaalEvents(); if (v.length && rnd() < .3) return pick(v); }
  const sp = S.sp, n = pick(selectie(S.sp.club)).n, t = club().t, jong = sp.leeftijd < 18, bekend = t <= 2, meid = pick(MEIDEN);
  const lief = sp.relatie ? sp.relatie.naam : '';

  // Je ouders
  if (rnd() < .07){ const o = ouders();
    const og = [
      {soort:'prive', tekst:'Je vader is jarig. Wat doe je?', opts:[
        {l:'Langsgaan met taart', f(){ o.band = clamp(o.band + 8, 0, 100); mod('fit', -2); return 'Je vader blaast de kaarsjes uit en vertelt voor de honderdste keer hoe hij je eerste goal zag.'; }},
        {l:'Een berichtje sturen', f(){ o.band = clamp(o.band - 3, 0, 100); return 'Hij stuurt een duimpje terug. Je moeder belt later: "Hij had je graag gezien."'; }}]},
      {soort:'prive', tekst:'Je moeder heeft griep en ligt in bed.', opts:[
        {l:'Soep brengen en boodschappen doen', f(){ o.band = clamp(o.band + 9, 0, 100); mod('fit', -4); return 'Je moeder is je heel dankbaar. "Je bent een goede jongen."'; }},
        {l:'Beterschap wensen via de app', f(){ o.band = clamp(o.band - 2, 0, 100); return 'Ze stuurt een hartje terug.'; }}]},
      {soort:'prive', tekst:'Je ouders hebben ruzie gehad en willen allebei met jou praten.', opts:[
        {l:'Rustig met allebei praten', f(){ o.band = clamp(o.band + 6, 0, 100); mod('focus', -4); return 'Het kost je een avond, maar het is weer goed tussen ze.'; }},
        {l:'Je erbuiten houden', f(){ o.band = clamp(o.band - 5, 0, 100); return 'Ze lossen het zelf op, maar ze vinden het jammer dat je er niet was.'; }}]}];
    return pick(og);
  }

  // Gezin: gebeurtenissen met je kinderen
  const kids = sp.kinderen || [];
  if (kids.length && rnd() < .15){
    const k = pick(kids), hij = k.jongen ? 'hij' : 'zij', zijn = k.jongen ? 'zijn' : 'haar', lft = kindLeeftijd(k);
    const kg = lft < 2 ? [
      {soort:'prive', tekst:`${k.naam} zet ${zijn} eerste stapjes! Precies op het moment dat je naar de training moet.`, opts:[
        {l:'Filmen en te laat komen', f(){ mod('moraal', 10); mod('vert', -3); return `Je hebt het op film. De trainer snapt het, half.`; }},
        {l:'Snel naar de training', f(){ mod('moraal', -3); return 'Je mist het. Gelukkig heeft iemand anders het gefilmd.'; }}]},
      {soort:'prive', tekst:`${k.naam} is ziek en heeft de hele nacht gehuild. Morgen is er een zware training.`, opts:[
        {l:'Opblijven en troosten', f(){ mod('fit', -12); mod('moraal', 3); return `Om 5 uur valt ${hij} eindelijk in slaap. Op je schouder.`; }},
        {l:'Goed slapen voor de training', f(){ mod('moraal', -4); return 'Je slaapt in de logeerkamer. Je voelt je wel een beetje schuldig.'; }}]}] : [
      {soort:'prive', tekst:`${k.naam} (${lft}) wil dat je komt kijken naar ${zijn} voetbalwedstrijd op zaterdagochtend.`, opts:[
        {l:'Natuurlijk, langs de lijn staan', f(){ mod('moraal', 8); mod('fit', -3); return `${k.naam} scoort en rent meteen naar jou toe. Mooier wordt het niet.`; }},
        {l:'Uitrusten voor je eigen wedstrijd', f(){ mod('moraal', -4); mod('fit', 5); return `${k.naam} is teleurgesteld. "Volgende keer, papa?"`; }}]},
      {soort:'prive', tekst:`${k.naam} (${lft}) heeft een tekening van jou gemaakt in je clubshirt. Op school vertelt ${hij} aan iedereen dat jij de beste bent.`, opts:[
        {l:'Ophangen in de kleedkamer', f(){ mod('moraal', 8); return 'Je teamgenoten vinden het prachtig. De tekening hangt naast je kluisje.'; }}]}];
    return pick(kg);
  }

  // Relatie-gebeurtenissen (alleen volwassen spelers)
  if (sp.relatie && sp.leeftijd >= 18 && rnd() < .35){
    const r = sp.relatie;
    const rel = [
      {soort:'prive', tekst:`${lief} wil dat je zaterdagavond meegaat naar de bruiloft van haar zus. Zondag moet je spelen.`, opts:[
        {l:'Meegaan, op tijd naar huis', f(){ r.band = clamp(r.band + 10, 0, 100); mod('fit', -5); return `${lief} is blij dat je er was. Om 23 uur lig je in bed.`; }},
        {l:'Dansen tot 3 uur', f(){ r.band = clamp(r.band + 15, 0, 100); mod('moraal', 10); mod('fit', -15); return 'Je bent de ster van de dansvloer. Je benen zijn morgen wel van lood.'; }},
        {l:'Afzeggen voor de wedstrijd', f(){ r.band = clamp(r.band - 15, 0, 100); mod('vert', 3); return `${lief} begrijpt het, maar is wel teleurgesteld.`; }}]},
      {soort:'prive', tekst:`${lief} staat bij je wedstrijd langs de lijn met een zelfgemaakt bord met jouw naam.`, opts:[
        {l:'Naar haar zwaaien', f(){ mod('moraal', 8); sp.vorm = clamp(sp.vorm + .5, -3, 3); r.band = clamp(r.band + 5, 0, 100); return 'Je voelt je onoverwinnelijk.'; }},
        {l:'Gefocust blijven', f(){ mod('vert', 2); return 'Je knikt even en focust op de warming-up.'; }}]},
      {soort:'prive', tekst:`Jullie krijgen ruzie. ${lief} vindt dat je alleen nog maar met voetbal bezig bent.`, opts:[
        {l:'Een weekend vrij voor haar', f(){ r.band = clamp(r.band + 15, 0, 100); mod('fit', 10); mod('vert', -3); return 'Jullie gaan een weekend naar de kust. De ruzie is vergeten.'; }},
        {l:'"Voetbal gaat voor"', f(){ r.band -= 30; if (r.band <= 0) return eindRelatie(`${lief} maakt het uit.`); mod('moraal', -5); mod('focus', -8); return 'Het blijft een tijdje ijzig stil thuis. Je kunt je slecht concentreren.'; }},
        {l:'Bloemen en sorry zeggen', f(){ r.band = clamp(r.band + 8, 0, 100); sp.geld = Math.max(0, sp.geld - 40); return 'Rozen werken altijd. Bijna altijd.'; }}]}
    ];
    rel.push(
      {soort:'prive', tekst:`${lief} wil het liefst elke avond met je afspreken.`, opts:[
        {l:'Ja, elke avond samen', f(){ r.band = clamp(r.band + 12, 0, 100); mod('moraal', 6); mod('focus', -12); return 'Jullie zijn onafscheidelijk. Maar op de training zit je met je hoofd ergens anders.'; }},
        {l:'Een paar keer per week', f(){ r.band = clamp(r.band + 5, 0, 100); mod('focus', -2); return 'Een goede balans. Iedereen tevreden.'; }},
        {l:'Nee, ik moet me op voetbal richten', f(){ r.band = clamp(r.band - 10, 0, 100); mod('focus', 4); return `${lief} vindt het jammer, maar laat je met rust.`; }}]},
      {soort:'prive', tekst:`Op een feest flirt iemand anders met je. ${lief} is er niet bij.`, opts:[
        {l:'Netjes afstand houden', f(){ r.band = clamp(r.band + 3, 0, 100); return `Je gaat op tijd naar huis en stuurt ${lief} een berichtje.`; }},
        {l:'Terugflirten en zoenen', f(){
          if (rnd() < .55){
            mod('focus', -20); mod('moraal', -15); sp.vorm = clamp(sp.vorm - 1, -3, 3); if (bekend) mod('rep', -4);
            roddel(`${sp.naam} betrapt met een ander`, `Een foto van een zoen op een feest gaat rond. Wat vindt ${lief} ervan?`);
            r.band -= 50;
            if (r.band <= 0 || rnd() < .5) return eindRelatie(`${lief} komt erachter en maakt het meteen uit.`) + ' Je kunt je de komende tijd slecht concentreren.';
            return `${lief} komt erachter. Jullie krijgen een enorme ruzie. Je hoofd zit vol en dat merk je op het veld.`;
          }
          mod('focus', -8); return 'Niemand heeft het gezien. Maar je voelt je schuldig en kunt je slecht concentreren.'; }}]},
      {soort:'prive', tekst:`${lief} is jaloers op een fan die je steeds berichtjes stuurt.`, opts:[
        {l:'De fan blokkeren', f(){ r.band = clamp(r.band + 6, 0, 100); return `${lief} is gerustgesteld.`; }},
        {l:'Zeggen dat ze overdrijft', f(){ r.band = clamp(r.band - 12, 0, 100); mod('focus', -6); mod('moraal', -4); return 'Dat valt verkeerd. Jullie hebben de hele avond ruzie.'; }}]});
    if (bekend) rel.push({soort:'prive', tekst:`Een roddelblad heeft een foto van jou en ${lief} op een terras gemaakt.`, opts:[
      {l:'Lachen en zwaaien', f(){ mod('rep', 3); return 'Jullie staan op de cover als "het leukste stel van het voetbal".'; }},
      {l:'Boos op de fotograaf', f(){ mod('rep', -4); r.band = clamp(r.band - 5, 0, 100); roddel(`${sp.naam} valt uit tegen fotograaf`, `Op een terras met ${lief} verloor hij zijn geduld. Het filmpje gaat viraal.`); return 'Iemand filmt hoe je uitvalt. Het filmpje gaat viraal.'; }}]});
    // Ruzie: hoe slechter het gaat, hoe vaker
    if (r.band < 70) rel.push({soort:'prive', tekst:`${lief} vindt dat je veel te weinig tijd voor haar hebt. "Het is altijd maar voetbal!"`, opts:[
      {l:'Sorry zeggen en een avond vrij nemen', f(){ r.band = clamp(r.band + 8, 0, 100); mod('vert', -2); return 'Jullie praten het uit. Je slaat een extra training over, maar thuis is het weer goed.'; }},
      {l:'Bloemen kopen', f(){ sp.geld = Math.max(0, sp.geld - 50); if (rnd() < .6){ r.band = clamp(r.band + 6, 0, 100); return 'Ze glimlacht weer. Voor nu is het goed.'; } r.band = clamp(r.band - 3, 0, 100); return '"Denk je dat bloemen alles oplossen?" Blijkbaar niet.'; }},
      {l:'Zeggen dat voetbal nu even voorgaat', f(){ r.band = clamp(r.band - 12, 0, 100); mod('focus', 3); return 'Ze slaat de deur dicht. Je hebt wel rust om je op voetbal te richten.'; }},
      {l:'Boos weglopen', f(){ r.band = clamp(r.band - 18, 0, 100); mod('moraal', -5); mod('focus', -5); return 'Je slaapt die nacht op de bank. Of bij een teamgenoot.'; }}]});
    if (r.samen && r.band < 65) rel.push({soort:'prive', tekst:`${lief} vindt dat je te veel geld uitgeeft aan onzin.`, opts:[
      {l:'Beloven dat je zuiniger wordt', f(){ r.band = clamp(r.band + 5, 0, 100); return 'Ze is gerustgesteld. Die nieuwe gameconsole moet maar even wachten.'; }},
      {l:'"Het is mijn geld"', f(){ r.band = clamp(r.band - 15, 0, 100); mod('moraal', -4); return 'Dat was niet slim. Het blijft dagen ijzig stil in huis.'; }}]});
    // Zij gaat vreemd: alleen als het al slecht gaat
    if (r.band < 45 && r.weken > 8) rel.push({soort:'prive', tekst:`Je ziet een berichtje op de telefoon van ${lief}. Van een andere man, met een hartje erbij.`, opts:[
      {l:'Haar ermee confronteren', f(){
        if (rnd() < .6){ mod('moraal', -12); mod('focus', -12);
          roddel(`${lief} gaat vreemd achter de rug van ${sp.naam}`, 'Een roddelblad heeft foto\'s. Het stel zou in een crisis zitten.');
          S.volgEv = {soort:'prive', tekst:`${lief} geeft het toe. Ze huilt en zegt dat het een vergissing was. Wat doe je?`, opts:[
            {l:'Haar nog één kans geven', f(){ r.band = 30; mod('moraal', -5); return 'Je vergeeft het haar. Het vertrouwen moet langzaam terugkomen.'; }},
            {l:r.getrouwd ? 'Scheiden' : 'Het uitmaken', f(){ return eindRelatie(`Je pakt je spullen. Met ${lief} ben je klaar.`); }}]};
          return `${lief} wordt eerst boos, maar dan wordt het stil.`; }
        r.band = clamp(r.band - 6, 0, 100); return 'Het blijkt een collega met een rare humor te zijn. Je voelt je een beetje dom.'; }},
      {l:'Doen alsof je niks zag', f(){ mod('focus', -10); r.band = clamp(r.band - 8, 0, 100); return 'Je zegt niks, maar het blijft door je hoofd spoken. Ook op het veld.'; }},
      {l:'Meteen uitmaken', f(){ return eindRelatie(`Je wil niks meer horen. Het is over met ${lief}.`); }}]});
    if (r.zwanger > 0) rel.push({soort:'prive', tekst:`${lief} is zwanger en wil dat je meegaat naar de echo. Het is op de ochtend van een belangrijke training.`, opts:[
      {l:'Natuurlijk ga je mee', f(){ r.band = clamp(r.band + 10, 0, 100); mod('vert', -3); mod('moraal', 8); return 'Je ziet een klein hartje kloppen op het scherm. De training kan je even niks schelen.'; }},
      {l:'Toch naar de training', f(){ r.band = clamp(r.band - 12, 0, 100); mod('vert', 2); return `${lief} gaat alleen. Ze stuurt je een foto van de echo, zonder tekst.`; }}]});
    return pick(rel);
  }

  const lijst = [
    // Bij de club
    {soort:'club', tekst:'Een journalist vraagt na de training of je tevreden bent met je speeltijd.', opts:[
      {l:'"Ik verdien meer minuten"', f(){ if (rnd() < .5){ mod('vert', -8); return 'De trainer leest het in de krant en is er niet blij mee.'; } mod('vert', 4); mod('rep', 2); return 'De trainer waardeert je honger. Fans ook.'; }},
      {l:'"Ik doe wat de trainer vraagt"', f(){ mod('vert', 4); return 'Braaf antwoord. De trainer knikt tevreden.'; }}]},
    {soort:'club', tekst:`${n} daagt je uit voor een vrije-trappenwedstrijd na de training. Verliezer haalt een week lang koffie.`, opts:[
      {l:'Uitdaging aannemen', f(){ if (rnd() < clamp(.3 + (sp.a.afw - 40) / 60, .15, .85)){ mod('moraal', 6); return `Je schiet ${n} helemaal weg. Hij haalt een week lang je koffie.`; } mod('moraal', -3); return `${n} wint. Jij loopt een week lang met koffiebekertjes.`; }},
      {l:'Laat maar', f(){ return 'Je gaat douchen. Saai, maar veilig.'; }}]},
    {soort:'club', tekst:'Je zaakwaarnemer belt: "Zal ik andere clubs laten weten dat je openstaat voor een transfer?"', als: !jong, opts:[
      {l:'Ja, maak me bekend', f(){ sp.transferWens = true; mod('vert', -5); statusPunten(-5); return 'Je naam gaat rond bij scouts. Je trainer hoort het ook...'; }},
      {l:'Nee, ik blijf hier', f(){ sp.transferWens = false; mod('vert', 5); return 'De club waardeert je trouw.'; }}]},
    {soort:'club', tekst:'Een scout van een grotere club staat bij jullie training. Iedereen doet ineens extra z\'n best.', opts:[
      {l:'Laten zien wat je kan', f(){ if (rnd() < .5){ sp.transferWens = true; mod('rep', 3); return 'De scout schrijft iets op en kijkt naar jou. Je naam staat op een lijstje.'; } mod('fit', -6); return 'Je doet zo je best dat je over de bal struikelt. De scout grinnikt.'; }},
      {l:'Gewoon je eigen spel', f(){ mod('vert', 3); return 'Je speelt rustig je eigen spelletje. De trainer vindt het volwassen.'; }}]},
    {soort:'club', tekst:'Een jonge speler uit de jeugd vraagt of je hem wat tips wilt geven.', als: sp.leeftijd >= 27, opts:[
      {l:'Neem hem onder je hoede', f(){ mod('vert', 5); mod('moraal', 4); return 'Je bent nu officieel de "grote broer" van de kleedkamer.'; }},
      {l:'Geen tijd', f(){ return 'Hij druipt teleurgesteld af.'; }}]},
    {soort:'club', tekst:'Tijdens de training voel je iets trekken in je hamstring.', als: sp.fit < 40, opts:[
      {l:'Doortrainen', f(){ if (rnd() < .5){ sp.blessure = randInt(2, 3); return `Au. Hamstring verrekt. Je ligt ${sp.blessure} weken uit de roulatie.`; } return 'Het trekt bij. Pfoe, geluk gehad.'; }},
      {l:'Meteen stoppen', f(){ mod('fit', 5); if (rnd() < .2){ sp.blessure = 1; return 'Verstandig. De fysio houdt je wel een week aan de kant.'; } return 'Verstandig. Morgen ben je er weer.'; }}]},

    // Buiten het veld: jong
    {soort:'prive', als: jong, tekst:'Morgen heb je een proefwerk wiskunde, maar de trainer heeft een extra training ingepland.', opts:[
      {l:'Thuisblijven en leren', f(){ mod('vert', -3); mod('moraal', 4); const x = schoolCijfer('Wiskunde', 8.2); return 'Je haalt een 8,2 voor wiskunde! Je moeder hangt hem op de koelkast.' + (x ? ' ' + x : ''); }},
      {l:'Naar de training', f(){ mod('vert', 5); mod('moraal', -4); const x = schoolCijfer('Wiskunde', 3.4); return 'Je haalt een 3,4 voor wiskunde. Je moeder is niet blij, de trainer wel.' + (x ? ' ' + x : ''); }},
      {l:'Spiekbriefje maken', f(){ if (rnd() < .5){ mod('vert', 3); const x = schoolCijfer('Wiskunde', 7); return 'Je komt ermee weg, haalt een 7,0 en gaat ook naar de training. Spannend.' + (x ? ' ' + x : ''); } mod('moraal', -8); mod('rep', -2); const x = schoolCijfer('Wiskunde', 1); return 'Betrapt. Je krijgt een 1,0, moet nablijven en mist de training. Het hele dorp weet het.' + (x ? ' ' + x : ''); }}]},
    {soort:'prive', als: jong, tekst:`${n} houdt een gamenacht bij hem thuis. Iedereen blijft slapen.`, opts:[
      {l:'Gamen tot het licht wordt', f(){ mod('moraal', 8); mod('fit', -12); mod('focus', -6); return 'Om half vijf win je eindelijk het toernooi. Op de training ben je een zombie.'; }},
      {l:'Om 12 uur gaan slapen', f(){ mod('moraal', 4); return 'Gezellig, en je bent nog redelijk fris.'; }},
      {l:'Niet gaan', f(){ mod('focus', 3); mod('moraal', -2); return 'Je mist de grappen, maar je slaapt goed.'; }}]},
    {soort:'prive', als: jong, tekst:'Het is kermis in het dorp. Je vrienden willen in de botsauto\'s en de zweefmolen.', opts:[
      {l:'Mee, de hele avond', f(){ mod('moraal', 7); mod('fit', -4); sp.geld = Math.max(0, sp.geld - 20); return 'Je wint een enorme knuffel bij het schieten. Je vrienden lachen je uit, jij bent trots.'; }},
      {l:'Eventjes, dan naar huis', f(){ mod('moraal', 3); return 'Een suikerspin en dan naar bed.'; }}]},
    {soort:'prive', als: jong, tekst:'Je vrienden willen het laatste uur spijbelen om naar het strand te gaan. Dat uur is er een toets.', opts:[
      {l:'Meegaan', f(){ mod('moraal', 6); const x = schoolCijfer(pick(VAKKEN.slice(1)), 2); let tekst = 'Heerlijke middag op het strand. Maar je mist de toets en krijgt een 2,0.';
        if (!sp.ouders.boos && rnd() < .5){ sp.ouders.boos = true; mod('focus', -8); tekst += ' School belt je ouders. Thuis krijg je flinke ruzie: voorlopig mag je niet meer uit.'; }
        else if (x) tekst += ' ' + x;
        return tekst; }},
      {l:'Naar de les', f(){ mod('focus', 3); return 'Je vrienden noemen je een braverik. Jij maakt gewoon je toets.'; }}]},
    {soort:'prive', als: jong, tekst:'Je moeder vindt dat je veel te veel op je telefoon zit, ook als je huiswerk moet maken.', opts:[
      {l:'Telefoon \'s avonds inleveren', f(){ mod('focus', 6); mod('moraal', -3); return 'Saai, maar je slaapt beter en kunt je beter concentreren.'; }},
      {l:'Afspraak maken: na 22 uur weg', f(){ mod('focus', 3); return 'Je moeder is tevreden met de afspraak.'; }},
      {l:'Boos de deur dichtgooien', f(){ mod('moraal', -6); mod('focus', -6); return 'Het is de hele avond ijzig stil aan tafel.'; }}]},
    {soort:'prive', als: jong, tekst:'Je vader staat bij elke wedstrijd langs de lijn en schreeuwt tegen de scheidsrechter.', opts:[
      {l:'Vragen of hij rustiger doet', f(){ mod('focus', 4); return 'Hij moppert, maar staat de volgende wedstrijd een stuk rustiger.'; }},
      {l:'Laat maar', f(){ mod('rep', -1); mod('focus', -2); return 'De scheidsrechter kent jullie achternaam inmiddels uit zijn hoofd.'; }}]},
    {soort:'prive', tekst:'Je beste vriend zit in de put: hij is uit zijn eigen team gezet.', opts:[
      {l:'Een avond voor hem vrijmaken', f(){ mod('moraal', 4); mod('fit', -3); return 'Jullie praten tot laat. Hij is je dankbaar.'; }},
      {l:'Een berichtje sturen', f(){ mod('moraal', 1); return 'Hij stuurt een duimpje terug.'; }},
      {l:'Geen tijd', f(){ mod('moraal', -4); return 'Hij voelt zich in de steek gelaten.'; }}]},
    {soort:'prive', tekst:'Je vrienden zeggen dat ze je bijna nooit meer zien sinds je zo veel voetbalt.', opts:[
      {l:'Een avond met ze afspreken', f(){ mod('moraal', 7); mod('fit', -4); mod('focus', -2); return 'Net als vroeger. Je had het gemist.'; }},
      {l:'Uitleggen dat voetbal nu voorgaat', f(){ mod('focus', 4); mod('moraal', -4); return 'Ze snappen het. Een beetje.'; }}]},
    {soort:'prive', tekst:'Je oma wordt 80 en geeft een groot feest. Het is de avond voor de wedstrijd.', opts:[
      {l:'Gaan, maar op tijd weg', f(){ mod('moraal', 6); return 'Oma vertelt aan iedereen dat jij de beste voetballer van de wereld bent.'; }},
      {l:'Blijven tot het einde', f(){ mod('moraal', 9); mod('fit', -8); mod('focus', -3); return 'Je danst met je oma op een oud liedje. Laat, maar onvergetelijk.'; }},
      {l:'Afzeggen voor de wedstrijd', f(){ mod('moraal', -4); mod('focus', 3); return 'Oma begrijpt het. Je moeder iets minder.'; }}]},
    {soort:'prive', als: sp.leeftijd >= 18, tekst:'Je vrienden hebben kaarten voor een festival dit weekend. Ze willen dat je meegaat.', opts:[
      {l:'Mee, het hele weekend', f(){ mod('moraal', 14); mod('fit', -20); mod('focus', -8); if (bekend && rnd() < .4){ mod('rep', -3); roddel(`${sp.naam} crowdsurft op festival`, 'Een paar dagen voor de wedstrijd ging hij helemaal los. De trainer zou "niet blij" zijn.'); return 'Fantastisch weekend! Maar een filmpje van jou op de schouders van een vriend gaat rond. De trainer zucht.'; } return 'Fantastisch weekend. Maandag ben je gesloopt.'; }},
      {l:'Alleen op zaterdag', f(){ mod('moraal', 6); mod('fit', -8); return 'Een mooie dag, en zondag rust je uit.'; }},
      {l:'Niet gaan', f(){ mod('focus', 3); mod('moraal', -2); return 'Je bekijkt de foto\'s op je telefoon.'; }}]},
    {soort:'prive', als: sp.leeftijd >= 18, tekst:'Na de wedstrijd wil de hele selectie nog de kroeg in.', opts:[
      {l:'Tot sluitingstijd', f(){ mod('moraal', 8); mod('fit', -10); mod('focus', -4); if (rnd() < .3){ mod('vert', -5); return 'Het wordt heel laat. Je verslaapt je voor de hersteltraining en de trainer is woest.'; } return 'Wat een avond. De band in de selectie is sterker dan ooit.'; }},
      {l:'Eén drankje, dan naar huis', f(){ mod('moraal', 4); return 'Gezellig en verstandig.'; }},
      {l:'Direct naar huis', f(){ mod('focus', 2); return 'Je ligt om tien uur in bed.'; }}]},
    {soort:'prive', als: sp.leeftijd >= 18 && !sp.relatie, tekst:`Je hebt een paar keer afgesproken met ${meid}. Na een etentje vraagt ze: "Wil je mijn vriend zijn?"`, opts:[
      {l:'Ja!', f(){ sp.relatie = {naam:meid, band:55, weken:0}; mod('moraal', 12); return `Je hebt een vriendin! ${meid} en jij zijn officieel samen.`; }},
      {l:'Ja, maar voetbal gaat wel voor', f(){ sp.relatie = {naam:meid, band:40, weken:0}; mod('moraal', 8); return `${meid} zegt ja, al vindt ze die laatste zin niet zo romantisch.`; }},
      {l:'Nee, ik wil me op voetbal richten', f(){ mod('focus', 5); mod('moraal', -3); return `${meid} is teleurgesteld, maar snapt het.`; }}]},
    {soort:'prive', als: jong, tekst:'Er is een schoolfeest. Je vrienden willen dat je meegaat, maar morgen is er een wedstrijd.', opts:[
      {l:'Gaan, om 23 uur naar huis', f(){ mod('moraal', 6); return 'Gezellig en toch op tijd in bed. Perfect.'; }},
      {l:'Gaan tot het einde', f(){ mod('moraal', 10); mod('fit', -15); if (rnd() < .5){ mod('vert', -5); return 'Het was geweldig, maar de trainer hoort ervan. Hij is niet blij.'; } return 'Het was geweldig. Je bent wel kapot.'; }},
      {l:'Thuisblijven', f(){ mod('fit', 5); return 'Je kijkt een wedstrijd op tv en gaat vroeg slapen.'; }}]},
    {soort:'prive', als: jong, tekst:'De supermarkt in het dorp zoekt vakkenvullers op zaterdagochtend.', opts:[
      {l:'Ja, extra geld', f(){ sp.geld += 300; mod('fit', -5); return 'Je verdient €300 bij. De kassajuffrouw vraagt of je die voetballer bent.'; }},
      {l:'Nee, focus op voetbal', f(){ mod('vert', 2); return 'Je houdt je zaterdagen vrij voor voetbal.'; }}]},
    {soort:'prive', als: jong, tekst:'Op weg naar de training glijd je met je fiets uit op een nat fietspad. Je knie ligt open.', opts:[
      {l:'Toch doorfietsen', f(){ if (rnd() < .4){ sp.blessure = randInt(1, 2); return `Op de training gaat het mis. De knie zwelt op: ${sp.blessure} ${sp.blessure === 1 ? 'week' : 'weken'} rust.`; } mod('vert', 3); return 'Met een pleister erop train je gewoon mee. De trainer vindt je een bikkel.'; }},
      {l:'Naar huis en ijs erop', f(){ mod('fit', 5); if (rnd() < .15){ sp.blessure = 1; return 'Je moet een weekje rustig aan doen.'; } return 'Na een dag is het alweer beter.'; }}]},
    {soort:'prive', als: sp.leeftijd <= 16, tekst:'Je opa komt voor het eerst naar je wedstrijd kijken.', opts:[
      {l:'Extra je best doen voor opa', f(){ mod('moraal', 6); sp.vorm = clamp(sp.vorm + .5, -3, 3); return 'Opa zit al een uur van tevoren langs de lijn, met thermoskan.'; }},
      {l:'Gewoon normaal spelen', f(){ mod('moraal', 3); return 'Opa is sowieso trots.'; }}]},

    // Buiten het veld: volwassen
    {soort:'prive', als: sp.leeftijd >= 18 && !sp.relatie && rnd() < .45, tekst:`Op het verjaardagsfeest van ${n} raak je aan de praat met ${meid}. Ze heeft geen idee wie je bent.`, opts:[
      {l:'Vragen of ze koffie wil drinken', f(){ const naam = this._naam; if (rnd() < .5 + (sp.moraal - 50) / 200 + sp.rep / 400){ sp.relatie = {naam, band:50, weken:0}; mod('moraal', 10); return `${naam} zegt ja! Een week later zijn jullie samen.`; } mod('moraal', -2); return `${naam} heeft al een vriend. Jammer!`; }},
      {l:'Opscheppen over je carrière', f(){ const naam = this._naam; if (rnd() < .2 + sp.rep / 300){ sp.relatie = {naam, band:40, weken:0}; mod('moraal', 8); return `Het werkt tegen alle verwachtingen in. Jij en ${naam} zijn samen.`; } mod('rep', -1); return `${naam} vindt je een opschepper en loopt weg. ${n} heeft het gezien en lacht je uit.`; }},
      {l:'Gewoon dansen met je vrienden', f(){ mod('moraal', 5); return 'Je hebt een topavond met je vrienden.'; }}]},
    {soort:'prive', als: sp.auto === 'oud', tekst:'Je oude auto wil niet starten. Over een half uur begint de training.', opts:[
      {l:'Fietsen, heel hard', f(){ mod('fit', -6); mod('vert', 1); return 'Je komt bezweet maar net op tijd binnen. De trainer grinnikt.'; }},
      {l:'Een teamgenoot bellen', f(){ return `${n} haalt je op. In de auto zingt hij de hele weg vals mee met de radio.`; }},
      {l:'Thuisblijven en de garage bellen', f(){ mod('vert', -5); sp.geld = Math.max(0, sp.geld - 250); return 'De garage rekent €250. De trainer rekent je afwezigheid.'; }}]},
    {soort:'prive', als: sp.rijbewijs && !!sp.auto, tekst:'Op de snelweg rijdt iemand achterop je auto. Niemand is gewond, maar je nek is stijf.', opts:[
      {l:'Rustig gegevens uitwisselen', f(){ mod('fit', -10); mod('rep', 1); return 'Netjes afgehandeld. De andere bestuurder vraagt nog om een handtekening.'; }},
      {l:'Boos uitstappen en schreeuwen', f(){ mod('rep', -5); roddel(`Woedende ${sp.naam} scheldt automobilist uit`, 'Een filmpje van de ruzie langs de snelweg gaat rond. De club wil niet reageren.'); return 'Iemand filmt je woedeaanval. Het filmpje heeft binnen een dag 200.000 views.'; }},
      {l:'Laten nakijken bij de dokter', f(){ sp.blessure = 1; mod('fit', 10); return 'Whiplash light. Een week rust, voor de zekerheid.'; }}]},
    {soort:'prive', als: sp.leeftijd >= 18, tekst:'Terwijl je naar de bakker loopt, word je aangereden door een scooter die door rood rijdt.', opts:[
      {l:'Rustig revalideren', f(){ sp.blessure = randInt(2, 4); return `Gekneusde enkel. Je ligt ${sp.blessure} weken uit, maar je herstelt goed.`; }},
      {l:'Zo snel mogelijk terug', f(){ if (rnd() < .5){ sp.blessure = 1; mod('vert', 4); return 'Na een week sta je alweer op het veld. De trainer is onder de indruk.'; } sp.blessure = randInt(4, 6); return `Te vroeg begonnen. De enkel schiet weer uit: ${sp.blessure} weken aan de kant.`; }}]},
    {soort:'prive', als: sp.leeftijd >= 18, tekst:'Je teamgenoten geven een feest op een boot. Er is muziek, en er zijn ook journalisten.', opts:[
      {l:'Feesten tot de zon opkomt', f(){ mod('moraal', 12); mod('fit', -15); if (rnd() < .35 + (bekend ? .2 : 0)){ mod('rep', -5); mod('vert', -6); roddel(`${sp.naam} feest tot zonsopgang op boot`, 'Met zonnebril en feesthoed, en dat in het seizoen. "Hij moet zich afvragen of hij prof wil zijn," zegt een oud-speler.'); return 'Een foto van jou met een zonnebril op je hoofd en een feesthoed staat de volgende dag in de krant. Oeps.'; } return 'Wat een feest. Niemand heeft foto\'s gemaakt. Denk je.'; }},
      {l:'Even gezellig, dan naar huis', f(){ mod('moraal', 5); return 'Je laat je gezicht zien en gaat op tijd.'; }},
      {l:'Niet gaan', f(){ mod('fit', 5); mod('vert', 2); return 'Je ligt op tijd in bed.'; }}]},
    {soort:'prive', als: sp.geld > 20000, tekst:'Een oude klasgenoot wil dat je investeert in zijn shoarmazaak.', opts:[
      {l:`Investeer ${geldTxt(Math.round(sp.geld * .25))}`, f(){ const inz = Math.round(sp.geld * .25); sp.geld -= inz; if (rnd() < .45){ sp.geld += inz * 2.2; return `De zaak loopt als een trein! Je krijgt ${geldTxt(inz * 2.2)} terug.`; } return 'De zaak gaat na drie maanden failliet. Je geld is weg.'; }},
      {l:'Nee bedankt', f(){ return 'Je eet er wel een keer, maar investeren doe je niet.'; }}]},
    {soort:'prive', tekst:'Iemand zet een gemeen filmpje online van een misser van jou.', opts:[
      {l:'Fel reageren', f(){ mod('rep', -3); mod('moraal', -3); roddel(`${sp.naam} haalt uit naar critici`, 'Zijn boze berichten op social media zorgen voor nog meer ophef.'); return 'Je reactie maakt het alleen maar groter. Nu praat iedereen erover.'; }},
      {l:'Er zelf grappig op reageren', f(){ if (rnd() < .6){ mod('rep', 4); return 'Je reactie gaat viraal. Iedereen vindt je ineens heel sympathiek.'; } mod('rep', -1); return 'Je grap komt niet goed over. Ach.'; }},
      {l:'Negeren', f(){ return 'Na twee dagen is iedereen het vergeten.'; }}]},
    {soort:'prive', tekst:'Je moet naar de kapper. De kapper stelt iets nieuws voor.', opts:[
      {l:'Platinablond', f(){ if (rnd() < .5){ mod('rep', 3); mod('moraal', 4); return 'Een hit! Kinderen in het hele land willen hetzelfde kapsel.'; } mod('moraal', -3); return 'Je teamgenoten noemen je nu "Wattenstaafje".'; }},
      {l:'Gewoon bijknippen', f(){ return 'Strak en netjes, zoals altijd.'; }}]},
    {soort:'prive', als: !dieren().length && sp.woning !== 'studio', tekst:'Je komt langs het asiel. Een klein hondje kijkt je met grote ogen aan.', opts:[
      {l:'Adopteren', f(){ dieren().push({soort:'hond', naam:'Penalty', trucs:0, weken:0}); mod('moraal', 8); return 'Je noemt hem "Penalty". Elke week geeft hij je een beetje extra moraal.'; }},
      {l:'Niet nu', f(){ return 'Je loopt met een klein hartje door.'; }}]},
    {soort:'prive', als: sp.rep > 15, tekst:'De club vraagt of je mee wilt naar het kinderziekenhuis om cadeautjes uit te delen.', opts:[
      {l:'Natuurlijk', f(){ mod('rep', 3); mod('moraal', 6); return 'De kinderen zijn door het dolle heen. Jij eigenlijk ook.'; }},
      {l:'Liever niet', f(){ mod('rep', -1); return 'Je teamgenoten gaan zonder jou.'; }}]},
    {soort:'prive', als: sp.rep > 20, tekst:'Een snackmerk wil je in een reclame voor de "Kroket Knaller". Je moet erin dansen.', opts:[
      {l:'Doen, geld is geld', f(){ const g = Math.max(500, Math.round(sp.salaris * .08)); sp.geld += g; mod('moraal', 5); mod('rep', -1); roddel(`${sp.naam} danst als kroket in reclame`, 'De "Kroket Knaller" is nu al het meest besproken filmpje van de week.'); return `Je danst als een kroket door een frituur. Je verdient ${geldTxt(g)}, maar je teamgenoten zingen het deuntje nu elke dag.`; }},
      {l:'Beleefd weigeren', f(){ mod('rep', 1); return 'Je houdt je imago netjes.'; }}]},
    {soort:'prive', als: sp.rep > 25, tekst:'Je mag aanschuiven bij een populaire talkshow op tv.', opts:[
      {l:'Gaan en grappig zijn', f(){ if (rnd() < .6){ mod('rep', 5); roddel(`${sp.naam} de grappigste gast van de week`, 'In de talkshow lag de hele studio dubbel.'); return 'Je grappen vallen goed. Heel Nederland kent nu je naam.'; } mod('rep', -4); roddel(`Ophef om grap van ${sp.naam} over scheidsrechter`, 'De scheidsrechtersbond vindt het "niet grappig".'); return 'Je grap over de scheidsrechter valt helemaal verkeerd. Ongemakkelijke stilte in de studio.'; }},
      {l:'Afzeggen en uitrusten', f(){ mod('fit', 6); return 'Je kijkt de uitzending gewoon thuis op de bank.'; }}]},
    {soort:'prive', als: bekend, tekst:'In de supermarkt herkent iemand je. Binnen een minuut staat er een rij mensen voor een selfie.', opts:[
      {l:'Iedereen een selfie geven', f(){ mod('rep', 2); mod('fit', -3); return 'Je staat er een uur. Je ijs is gesmolten.'; }},
      {l:'Snel afrekenen en weg', f(){ mod('rep', -1); return 'Iemand roept "arrogant!" Ach.'; }}]},
    // nog meer belevenissen buiten het voetbal (eigen bestand)
    ...belevenissen({sp, n, jong, bekend, meid})
  ].filter(e => e.als !== false);

  const ev = pick(lijst);
  ev.opts.forEach(o => o._naam = meid);
  return ev;
}
export function kiesEvent(i){
  const o = S.ev.opts[i], sp = S.sp, oudeLiefde = sp.relatie ? sp.relatie.naam : null;
  S.volgEv = null;
  const t = o.f.call(o);
  if (!oudeLiefde && sp.relatie) roddel(`${sp.naam} heeft een nieuwe liefde`, `${sp.naam} is gespot met ${sp.relatie.naam}. Volgens vrienden is het "echt iets serieus".`);
  if (oudeLiefde && !sp.relatie) roddel(`Het is uit tussen ${sp.naam} en ${oudeLiefde}`, 'Vrienden zeggen dat het al een tijdje niet goed ging.');
  S.week.tekst.push(t);
  const st = checkStatus(); if (st) S.week.tekst.push(st);
  if (S.volgEv){ S.ev = S.volgEv; S.volgEv = null; S.fase = 'event'; }
  else if (S.naVenster){ S.naVenster = false; S.ev = null; openVenster('winter'); }
  else { S.ev = null; S.fase = 'week'; }
}
