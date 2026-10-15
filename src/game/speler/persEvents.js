import { S, mod } from '../../core/state.js';
import { clamp, pick, rnd } from '../../core/utils.js';
import { selectie } from '../competitie/spelers.js';
import { krantMelding, roddel } from '../media/roddel.js';
import { social } from '../prive/social.js';
import { ouders } from '../prive/familie.js';
import { iedereen, zetBand } from '../team/kleedkamer.js';
import { modFans } from '../wedstrijd/fans-pers.js';
import { onrust } from './kalmte.js';
import { mijnPers } from './persoonlijkheid.js';
import { statusPunten } from './status.js';

/* ===================== Gebeurtenissen die bij je persoonlijkheid horen ===================== */
// Twee per persoonlijkheid. Een gebeurtenis komt niet terug zolang hij bij de laatste 8 hoort die je zag.
const maat = () => pick(selectie(S.sp.club)).n;
const EV = {
  voetbalgek:[
    {id:'vg-nacht', tekst:'Het is 23:00 en er zijn nog twee wedstrijden uit de Champions League te kijken. Morgen is er om 9 uur training.', opts:[
      {l:'Alles kijken en aantekeningen maken', f(){ mod('fit', -6); mod('focus', 5); return 'Om 1 uur lig je in bed, je hoofd vol loopacties en patronen. Moe, maar je hebt veel geleerd.'; }},
      {l:'Toch maar slapen', f(){ mod('fit', 4); return 'Met pijn in je hart doe je de tv uit. Je kijkt de samenvatting bij het ontbijt.'; }}]},
    {id:'vg-pleintje', tekst:'Op je vrije middag zie je kinderen voetballen op een pleintje. Ze herkennen je.', opts:[
      {l:'Meedoen tot het donker is', f(){ mod('moraal', 6); mod('fit', -4); modFans(3); return 'Je speelt drie uur mee. Een vader filmt het en de clip gaat rond. "Hij leeft voor voetbal."'; }},
      {l:'Een paar handtekeningen en door', f(){ mod('moraal', 2); return 'De kinderen zijn er blij mee. Thuis kijk je nog een uur voetbal.'; }}]},
  ],
  rebel:[
    {id:'rb-kapsel', tekst:'Je komt met een opvallend nieuw kapsel naar de training. De trainer zegt dat het "niet bij de club past".', opts:[
      {l:'Het kapsel blijft', f(){ mod('vert', -5); modFans(4); mod('rep', 2); roddel(`${S.sp.naam} weigert kapsel aan te passen`, 'De trainer is er niet blij mee, de fans vinden het geweldig.'); return 'De trainer zucht. Op de tribune zie je bij de volgende wedstrijd jongens met hetzelfde kapsel.'; }},
      {l:'Laat hem maar praten, je past het aan', f(){ mod('vert', 3); mod('moraal', -3); return 'Je gaat naar de kapper. Het voelt een beetje als verliezen.'; }}]},
    {id:'rb-scheids', tekst:'Na de wedstrijd vraagt een journalist wat je van de scheidsrechter vond.', opts:[
      {l:'Zeggen wat je echt denkt', f(){ mod('rep', 3); mod('vert', -3); onrust(4, 'Ophef in de media'); krantMelding(`${S.sp.naam} haalt uit naar de scheidsrechter`, '"Die man had geen idee waar hij mee bezig was." De bond kijkt ernaar.'); return 'Je woorden staan de volgende dag op de voorpagina. De fans zijn het met je eens, de club minder.'; }},
      {l:'"Geen commentaar."', f(){ mod('vert', 2); return 'De journalist is teleurgesteld. De perschef van de club knikt je goedkeurend toe.'; }}]},
  ],
  prof:[
    {id:'pf-voeding', tekst:'De clubdiëtist biedt een persoonlijk voedingsschema aan. Het kost je wel je favoriete patat.', opts:[
      {l:'Doen: alles voor de topsport', f(){ mod('fit', 6); mod('moraal', -2); mod('vert', 3); return 'Geen patat meer, wel meer energie. De trainer ziet het verschil.'; }},
      {l:'Nee, je eet al gezond genoeg', f(){ return 'De diëtist knikt. "De deur staat open."'; }}]},
    {id:'pf-feestje', tekst:'Een teamgenoot vraagt of je mee gaat naar een feestje, twee dagen voor de wedstrijd.', opts:[
      {l:'Vriendelijk bedanken: je gaat vroeg slapen', f(){ mod('fit', 4); zetBand(maat(), -3); return 'Je slaapt negen uur. Op de training ben je de scherpste van iedereen.'; }},
      {l:'Toch even mee, één drankje', f(){ mod('moraal', 4); mod('fit', -3); return 'Je houdt het bij water en gaat om 23 uur naar huis. Netjes.'; }}]},
  ],
  feestbeest:[
    {id:'fb-verjaardag', tekst:'Een teamgenoot geeft een groot verjaardagsfeest, de avond voor de wedstrijd.', opts:[
      {l:'Natuurlijk ga je, en je blijft tot het einde', f(){ mod('moraal', 8); mod('fit', -10); mod('focus', -6); iedereen(3); if (rnd() < .3){ mod('vert', -6); return 'Het wordt 4 uur. De trainer ziet je wallen en zet je op de bank.'; } return 'Wat een feest. Je zingt met de hele selectie het clublied. Je bent wel moe.'; }},
      {l:'Even langs voor een cadeautje en op tijd naar huis', f(){ mod('moraal', 3); iedereen(1); return 'Je bent er even, maakt iedereen aan het lachen en gaat om 22 uur naar huis.'; }}]},
    {id:'fb-kampioensfeest', tekst:'Je bent gevraagd om de clubavond in de kantine te organiseren.', opts:[
      {l:'Groots aanpakken: dj, lichten, alles', f(){ mod('moraal', 6); iedereen(4); S.sp.geld = Math.max(0, S.sp.geld - 300); modFans(3); return 'Er wordt nog maanden over gepraat. De kantine heeft nog nooit zoveel omgezet. Het kostte je wel €300.'; }},
      {l:'Een simpele avond met een playlist', f(){ mod('moraal', 2); iedereen(1); return 'Gezellig, niet meer en niet minder.'; }}]},
  ],
  leider:[
    {id:'ld-ruzie', tekst:`In de kleedkamer krijgen twee teamgenoten ruzie. De rest kijkt naar jou.`, opts:[
      {l:'Ingrijpen en het uitpraten', f(){ statusPunten(3); mod('vert', 3); iedereen(2); return 'Je zet ze tegenover elkaar en laat ze het uitpraten. Na tien minuten geven ze elkaar een hand. De trainer heeft het gezien.'; }},
      {l:'Je erbuiten houden', f(){ iedereen(-2); return 'Het gedoe sleept nog een week door. Niemand pakt de leiding.'; }}]},
    {id:'ld-jong', tekst:'Een jonge speler zit er na een slechte wedstrijd helemaal doorheen.', opts:[
      {l:'Na de training met hem praten', f(){ const n = maat(); zetBand(n, 12); statusPunten(2); mod('moraal', 2); return `Je praat een uur met ${n}. "Iedereen heeft zulke wedstrijden. Volgende keer laat je het zien." Hij knikt.`; }},
      {l:'Hij moet het zelf leren', f(){ return 'Hij zit nog een week stil in de hoek van de kleedkamer.'; }}]},
  ],
  showman:[
    {id:'sm-juich', tekst:'Een sportmerk wil dat je bij je volgende goal een gekke, nieuwe juich doet.', opts:[
      {l:'Doen: €500 en een viral moment', f(){ S.sp.geld += 500; social().volgers += 800; mod('rep', 2); iedereen(-1); return 'Je oefent hem voor de spiegel. Je teamgenoten rollen met hun ogen, je volgers zijn dol op je.'; }},
      {l:'Nee, je juich is van jou', f(){ return 'Het merk vraagt een andere speler. Je juich blijft zoals hij was.'; }}]},
    {id:'sm-hakje', tekst:'Op de training probeer je steeds hakjes en panna\'s. De trainer roept je bij zich.', opts:[
      {l:'"Zo speel ik nou eenmaal"', f(){ mod('vert', -4); modFans(2); return 'De trainer schudt zijn hoofd. "In de wedstrijd moet het wel werken." Je publiek vindt het prachtig.'; }},
      {l:'Belooft het simpeler te houden', f(){ mod('vert', 3); mod('moraal', -2); return 'Je speelt een week lang simpel. Het voelt saai, maar de trainer is blij.'; }}]},
  ],
  teamspeler:[
    {id:'ts-assist', tekst:'Een teamgenoot staat al weken droog. Hij vraagt of je hem de volgende keer de bal wilt geven.', opts:[
      {l:'Afgesproken: hij krijgt de volgende kans', f(){ const n = maat(); zetBand(n, 12); iedereen(1); return `"Je bent een topper." ${n} traint de hele week met een glimlach.`; }},
      {l:'"In het veld kies ik wat het beste is"', f(){ return 'Hij knikt. Eerlijk is eerlijk.'; }}]},
    {id:'ts-uitje', tekst:'Je wilt een teamuitje organiseren: lasergamen met de hele selectie.', opts:[
      {l:'Regelen en betalen (€200)', f(){ S.sp.geld = Math.max(0, S.sp.geld - 200); iedereen(5); mod('moraal', 4); return 'Een avond lang ben je elkaars tegenstander. Daarna zijn jullie meer een team dan ooit.'; }},
      {l:'Toch maar niet', f(){ return 'Misschien later in het seizoen.'; }}]},
  ],
  ijskoud:[
    {id:'ik-pers', tekst:'Een journalist probeert je uit de tent te lokken met een vraag over je laatste slechte wedstrijd.', opts:[
      {l:'Rustig en kort antwoorden', f(){ mod('vert', 2); mod('rep', 1); return '"We kijken naar de volgende wedstrijd." Niets om over te schrijven. Precies goed.'; }},
      {l:'Glimlachen en doorlopen', f(){ return 'De journalist blijft met lege handen achter.'; }}]},
    {id:'ik-provocatie', tekst:'Een tegenstander scheldt je via sociale media uit voor de wedstrijd van zondag.', opts:[
      {l:'Negeren', f(){ mod('focus', 4); return 'Je leest het, legt je telefoon weg en gaat slapen. Hij krijgt geen reactie.'; }},
      {l:'Eén droog berichtje terug', f(){ social().volgers += 300; mod('rep', 1); return '"Tot zondag." Meer niet. Je volgers vinden het geweldig.'; }}]},
  ],
  doorzetter:[
    {id:'dz-extra', tekst:'Na een slechte wedstrijd ben je baal van jezelf.', opts:[
      {l:'Maandag als eerste op het trainingsveld', f(){ mod('focus', 6); mod('vert', 3); mod('fit', -4); return 'Om 8 uur sta je er al. De trainer ziet het en zegt niets, maar hij onthoudt het.'; }},
      {l:'Een dag afstand nemen', f(){ mod('moraal', 3); return 'Een dag zonder voetbal doet je goed.'; }}]},
    {id:'dz-revalidatie', tekst:'De fysio zegt dat je een kleine blessure het beste een week rust kunt geven. Jij wilt trainen.', opts:[
      {l:'Toch voorzichtig meetrainen', f(){ mod('fit', -4); mod('vert', 2); return 'Je doet aangepast mee. Het gaat net goed.'; }},
      {l:'Luisteren naar de fysio', f(){ mod('fit', 8); return 'Een week rust. Je komt er sterker uit.'; }}]},
  ],
  familiemens:[
    {id:'fm-zusje', tekst:'Je zusje heeft haar diploma-uitreiking, precies tijdens een training.', opts:[
      {l:'Vrij vragen en erbij zijn', f(){ const o = ouders(); o.band = clamp(o.band + 10, 0, 100); mod('moraal', 6); mod('vert', -3); return 'Je zusje straalt als ze je in de zaal ziet zitten. De trainer vindt het minder leuk.'; }},
      {l:'Trainen en haar een filmpje sturen', f(){ const o = ouders(); o.band = clamp(o.band - 4, 0, 100); mod('vert', 2); return 'Ze stuurt een hartje terug, maar je weet dat ze je had willen zien.'; }}]},
    {id:'fm-zondag', tekst:'Je moeder vraagt of je zondag na de wedstrijd komt eten. Je teamgenoten gaan samen uit.', opts:[
      {l:'Naar je moeder', f(){ const o = ouders(); o.band = clamp(o.band + 6, 0, 100); mod('moraal', 4); mod('fit', 2); return 'Stamppot, verhalen van vroeger en je vader die de wedstrijd nog eens bespreekt. Heerlijk.'; }},
      {l:'Met het team mee', f(){ iedereen(2); mod('moraal', 2); return 'Gezellig met de selectie. Je moeder bewaart een bord voor je.'; }}]},
  ],
};
export function persEvents(){
  const sp = S.sp, gezien = sp.persGezien || [];
  return mijnPers().flatMap(id => (EV[id] || []).filter(e => !gezien.includes(e.id)).map(e => ({soort:'prive', ...e, opts:e.opts.map(o => ({...o, f(){ (sp.persGezien = (sp.persGezien || []).concat(e.id).slice(-8)); return o.f(); }}))})));
}
export const PERS_EVENTS = EV;
