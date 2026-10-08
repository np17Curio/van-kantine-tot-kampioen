import { S, mod, statWaarde } from '../../core/state.js';
import { clamp, pick, rnd, shuffle } from '../../core/utils.js';
import { CLUBS, MOMENT_POOL, TEAMGENOTEN } from '../../data/gegevens.js';
import { gewogen, ploeg, telt } from '../competitie/spelers.js';
import { chemie } from '../team/kleedkamer.js';

/* ===================== Wedstrijdmomenten ===================== */
export const goal = (t, d) => ({t, d, goal:true});
export function assistKans(p, intro){
  const P = ploeg(S.M), sx = P ? gewogen(P, 'g') : null, n = P ? sx.n : pick(TEAMGENOTEN);
  if (rnd() < p) return {t:`${intro} ${n}, die hem binnenschuift!`, d:1.0, assist:true, scorer:sx};
  return {t:`${intro} ${n}, maar hij mist.`, d:.2};
}
export function tegenKans(p, tGoal, tRed, d1, d2){ return rnd() < p ? {t:tGoal, d:d1, tegen:true} : {t:tRed, d:d2}; }

export const MOMENTS = {
  juichen:{teksten:['GOAL tegen je oude club! Je ziet het oude vak voor je. Hoe juich je?'], opts:[
    {l:'Niet juichen, uit respect', st:'kalm', b:-60, ok:()=>({t:'Je steekt je handen verontschuldigend omhoog. Het oude publiek applaudisseert voor je.', d:.1, juich:'respect', oudFans:8, nieuwFans:-2}), mis:()=>({t:'Je steekt je handen omhoog. Het oude publiek applaudisseert.', d:.1, juich:'respect', oudFans:8, nieuwFans:-2})},
    {l:'Uitbundig juichen voor het oude vak', st:'kalm', b:15, kaart:'geel', ok:()=>({t:'Je rent juichend naar het vak van je oude club. Je nieuwe fans gaan helemaal los!', d:.1, juich:'wild', oudFans:-8, nieuwFans:6}), mis:()=>({t:'Je rent juichend naar het oude vak en maakt een gebaar. De scheids geeft je geel.', d:-.1, juich:'wild', geel:true, oudFans:-10, nieuwFans:6})},
    {l:'"Ssst"-gebaar naar het oude vak', st:'kalm', b:30, kaart:'geel', ok:()=>({t:'Je houdt je vinger voor je mond, recht voor het oude vak. Je nieuwe fans zingen je naam!', d:.1, juich:'ssst', oudFans:-15, nieuwFans:10}), mis:()=>({t:'Je "ssst"-gebaar lokt bijna een rel uit. De scheids geeft je geel.', d:-.2, juich:'ssst', geel:true, oudFans:-15, nieuwFans:10})}]},
  rand:{teksten:['Je krijgt de bal net buiten de zestien. Eén verdediger staat tussen jou en het doel.','Je draait weg bij je man en staat ineens voor de zestien met de bal aan je voet.','Een teamgenoot legt de bal breed. Je staat op 20 meter van het doel.'], opts:[
    {l:'Schieten', st:'afw', b:68, ok:()=>goal(pick(['Je haalt uit... en hij zit! Strak in de kruising.','Een droge knal in de verre hoek. De keeper kijkt hem na.']), 1.3),
      mis:()=>({t:pick(['Je schot gaat ruim over.','De keeper plukt je schot uit de lucht.','Je schot wordt geblokt.']), d:-.2})},
    {l:'Steekpass', st:'pas', b:52, ok:()=>assistKans(.55, 'Een steekpass door de verdediging op'), mis:()=>({t:'Je pass wordt onderschept.', d:-.3})},
    {l:'Dribbelen', st:'drib', b:58, ok:()=> rnd() < .2 ? {t:'Je gaat langs je man en wordt in de zestien onderuit gehaald. Penalty!', d:.3, next:'penalty'} : {t:'Je zet je man met een schijnbeweging te kijk!', d:.3, next:'eenOpEen'},
      mis:()=>({t:'Je blijft hangen in je dribbel en verliest de bal.', d:-.3})},
    {l:'Eén-twee spelen', st:'pas', b:58, ok:()=>({t:'Een perfecte één-twee. Je krijgt de bal terug in de loop!', d:.3, next:'eenOpEen'}), mis:()=>({t:'Je teamgenoot snapt niet wat je wil. Bal kwijt.', d:-.2})},
    {l:'Breed op de opkomende back', st:'pas', b:46, ok:()=>assistKans(.3, 'Je legt de bal breed op'), mis:()=>({t:'Je pass is te zacht en wordt onderschept.', d:-.3})},
    {l:'Schijnbeweging en krullen', st:'drib', b:64, ok:()=>goal('Schijnbeweging naar links, krullen met rechts. In de verre hoek!', 1.5), mis:()=>({t:'De krul draait net naast. Het publiek zucht.', d:-.2})},
    {l:'Hakje', st:'drib', b:70, ok:()=>assistKans(.65, 'Een brutaal hakje voor'), mis:()=>({t:'Je hakje gaat recht in de voeten van de tegenstander. Het publiek fluit.', d:-.5})}]},
  eenOpEen:{teksten:['Je bent alleen door! Alleen de keeper staat nog tussen jou en de goal.','Je loopt weg bij de laatste man. De keeper komt uit z\'n doel.'], opts:[
    {l:'Hard schieten', st:'afw', b:56, ok:()=>goal('Je jaagt hem keihard tegen de touwen!', 1.3), mis:()=>({t:'De keeper redt met een voet.', d:-.3})},
    {l:'Keeper omspelen', st:'drib', b:62, ok:()=>goal('Je speelt de keeper uit en schuift hem in het lege doel. Wat een rust!', 1.5), mis:()=>({t:'De keeper duikt op de bal. Kans verkeken.', d:-.3})},
    {l:'Stiften', st:'afw', b:68, ok:()=>goal('Een heerlijke stift over de keeper heen. Het stadion ontploft!', 1.8), mis:()=>({t:'Je stift is te zacht. De keeper vangt hem rustig.', d:-.5})},
    {l:'Breed leggen voor open doel', st:'pas', b:50, ok:()=>assistKans(.85, 'Onbaatzuchtig! Je legt hem breed op'), mis:()=>({t:'Je breedtepass wordt nog net onderschept.', d:-.3})},
    {l:'Panna door de benen', st:'drib', b:70, ok:()=>goal('Panna door de benen van de keeper en binnen! Dit gaat de hele wereld rond.', 1.9), mis:()=>({t:'De keeper sluit zijn benen. Je bent de bal kwijt.', d:-.5})},
    {l:'Wachten tot hij gaat liggen', st:'kalm', b:58, ok:()=>goal('IJskoud. Je wacht tot de keeper gaat liggen en tikt hem erover.', 1.4), mis:()=>({t:'Je wacht te lang. Een verdediger haalt je nog in.', d:-.4})}]},
  counter:{teksten:['Je verovert de bal op eigen helft. De tegenstander staat helemaal open: er ligt een counter klaar.','Hun corner wordt weggekopt en de bal komt bij jou. Drie tegen twee!'], opts:[
    {l:'Lange bal op de spits', st:'pas', b:62, ok:()=>assistKans(.6, 'Je lange bal valt precies voor de voeten van'), mis:()=>({t:'Je lange bal rolt over de achterlijn.', d:-.3})},
    {l:'Zelf oprukken', st:'cond', b:55, ok:()=>({t:'Je sprint met de bal over het hele veld!', d:.3, next:'rand'}), mis:()=>({t:'Je wordt ingehaald en de bal is weg.', d:-.2})},
    {l:'Veilig breed', st:'pas', b:40, ok:()=>({t:'Rustig balbezit. De trainer klapt in zijn handen.', d:.1}), mis:()=>({t:'Zelfs je veilige pass gaat mis. Oei.', d:-.4})},
    {l:'Diepe bal in de loop', st:'pas', b:58, ok:()=>assistKans(.5, 'Een diepe bal in de loop van'), mis:()=>({t:'Je bal is te hard. Doelpuntje voor de keeper.', d:-.2})},
    {l:'Bal doorlaten met hakje', st:'drib', b:66, ok:()=>({t:'Je laat de bal slim door en bent je man voorbij!', d:.4, next:'eenOpEen'}), mis:()=>({t:'Je hakje mislukt. Weg counter.', d:-.4})},
    {l:'Wisselen naar de andere kant', st:'pas', b:50, ok:()=>({t:'Je legt het spel om en de vleugelspeler geeft hem meteen terug!', d:.2, next:'rand'}), mis:()=>({t:'Je crossbal belandt op de tribune.', d:-.3})}]},
  vrijeTrap:{teksten:['Vrije trap op 22 meter, net naast het midden. Jij mag hem nemen.','Vrije trap vlak buiten de zestien. De muur staat. Jij staat achter de bal.'], opts:[
    {l:'Direct op doel', st:'afw', b:74, ok:()=>goal('Over de muur, in de bovenhoek. Prachtig!', 1.6), mis:()=>({t:pick(['Recht in de muur.','Net over de lat.']), d:-.1})},
    {l:'Voorzet', st:'pas', b:55, ok:()=>assistKans(.45, 'Je voorzet draait precies op het hoofd van'), mis:()=>({t:'Je voorzet is te lang en gaat zo uit.', d:-.2})},
    {l:'Kort nemen', st:'pas', b:60, ok:()=>({t:'Het ingestudeerde trucje werkt! De muur staat te slapen.', d:.3, next:'rand'}), mis:()=>({t:'Het trucje mislukt totaal. Ongemakkelijk.', d:-.4})},
    {l:'Onder de muur door', st:'afw', b:70, ok:()=>goal('De muur springt, jij schiet eronderdoor. Binnen!', 1.6), mis:()=>({t:'De muur blijft staan. Geblokt.', d:-.2})},
    {l:'Teamgenoot laten nemen', st:'kalm', b:20, ok:()=> rnd() < .25 ? {t:'Je teamgenoot schiet hem er prachtig in. Jij juicht mee.', d:.1, teamGoal:true} : {t:'Je teamgenoot schiet in de muur.', d:0}, mis:()=>({t:'Je teamgenoot schiet ver over.', d:0})}]},
  corner:{teksten:['Hoekschop voor jullie. Je staat in de zestien tussen een paar grote verdedigers.','Corner! Jullie beste voorzetter legt de bal klaar.'], opts:[
    {l:'Koppen op doel', st:'afw', b:66, ok:()=>goal('Je stijgt boven iedereen uit en kopt hem binnen!', 1.3), mis:()=>({t:'Je kopbal gaat naast.', d:-.1})},
    {l:'Terugkoppen', st:'pas', b:52, ok:()=>assistKans(.5, 'Je kopt de bal slim terug naar'), mis:()=>({t:'Je kopt hem zo in de handen van de keeper.', d:-.2})},
    {l:'Keeper blokken', st:'cond', b:45, ok:()=> rnd() < .35 ? {t:'Jij blokt de keeper, je teamgenoot kopt binnen!', d:.3, teamGoal:true} : {t:'Je blokt de keeper, maar de bal gaat net naast.', d:.1}, mis:()=>({t:'De scheids fluit: overtreding op de keeper.', d:-.2})},
    {l:'Omhaal', st:'afw', b:78, ok:()=>goal('OMHAAL! In de kruising! Dit is de goal van het seizoen!', 2.2), mis:()=>({t:'Je omhaal raakt alleen lucht. Je landt op je rug.', d:-.3})},
    {l:'Eerste paal doorkoppen', st:'pas', b:60, ok:()=>assistKans(.45, 'Je verlengt de corner bij de eerste paal naar'), mis:()=>({t:'De keeper is je net voor.', d:-.1})}]},
  penalty:{teksten:['Penalty! Jij legt de bal op de stip. Het hele stadion houdt de adem in.'], opts:[
    {l:'Strak in de hoek', st:'afw', b:44, ok:()=>goal('Keeper de verkeerde kant op. Gescoord!', 1.0), mis:()=>({t:'De keeper zit in de goede hoek en stopt hem.', d:-.6})},
    {l:'Hard door het midden', st:'afw', b:48, ok:()=>goal('Keihard door het midden. De keeper lag al.', 1.0), mis:()=>({t:'De keeper blijft staan en vangt hem.', d:-.7})},
    {l:'Panenka', st:'afw', b:60, ok:()=>goal('Een panenka! Brutaal en perfect. Dit wordt een meme.', 1.8), mis:()=>({t:'Je panenka is te zacht en de keeper vangt hem lachend. Dit wordt ook een meme...', d:-1.0})},
    {l:'Hoog in de kruising', st:'afw', b:56, ok:()=>goal('Onhoudbaar in de kruising!', 1.2), mis:()=>({t:'Te hoog. De bal vliegt over de lat.', d:-.7})},
    {l:'Aanloop met stopje', st:'kalm', b:55, ok:()=>goal('Je stopt even in je aanloop, de keeper valt al. Binnen!', 1.2), mis:()=>({t:'De keeper trapt er niet in en pakt hem.', d:-.8})}]},
  verdedigen:{teksten:['Hun snelle buitenspeler komt met snelheid op je af.','Hun spits krijgt de bal in de rug en draait richting jullie doel.'], opts:[
    {l:'Sliding', st:'verd', b:58, kaart:'geel', ok:()=>({t:'Een schone sliding. Bal gewonnen!', d:.6}),
      mis:()=>{ const r = tegenKans(.5, 'Je glijdt eroverheen. Hij is voorbij en scoort.', 'Je glijdt eroverheen, maar de keeper redt.', -.8, -.3); r.geel = rnd() < .45; return r; }},
    {l:'Afstand houden', st:'verd', b:48, ok:()=>({t:'Je blijft rustig staan en dwingt hem naar buiten. Bal uit.', d:.3}),
      mis:()=>tegenKans(.35, 'Hij draait om je heen en schiet raak.', 'Hij komt langs je, maar schiet naast.', -.7, -.2)},
    {l:'Vroeg doorstappen', st:'cond', b:55, ok:()=>({t:'Je onderschept de bal voordat hij aanneemt!', d:.5, next:'counter'}),
      mis:()=>tegenKans(.45, 'Te vroeg. Hij tikt de bal langs je en scoort.', 'Te vroeg, maar je teamgenoot redt de situatie.', -.8, -.3)},
    {l:'Naar de zijlijn dwingen', st:'cond', b:50, ok:()=>({t:'Je loopt hem helemaal vast bij de zijlijn. Inworp voor jullie.', d:.4}),
      mis:()=>tegenKans(.3, 'Hij is sneller en geeft een voorzet. Tegengoal.', 'Hij is sneller, maar zijn voorzet is slecht.', -.6, -.2)},
    {l:'Schouderduel', st:'cond', b:58, ok:()=>({t:'Schouder tegen schouder. Hij vliegt eraf, jij hebt de bal.', d:.5}),
      mis:()=>tegenKans(.4, 'Hij is sterker en loopt door. Hij scoort.', 'Hij is sterker, maar schiet naast.', -.7, -.2)},
    {l:'Tactische overtreding', st:'verd', b:40, kaart:'rood', ok:()=>({t:'Je trekt hem slim aan zijn shirt. Gevaar weg, wel een gele kaart.', d:.1, geel:true}),
      mis:()=>({t:'De scheids vindt het een doelkans ontnemen. ROOD!', d:-1, rood:true})}]},
  verdCorner:{teksten:['Hoekschop tegen. Hun grote spits staat precies bij jou.','Vrije trap tegen vanaf de zijkant. Iedereen staat in de zestien.'], opts:[
    {l:'Wegkoppen', st:'verd', b:52, ok:()=>({t:'Je kopt de bal ver weg. Gevaar geweken.', d:.4}),
      mis:()=>tegenKans(.5, 'Hij springt hoger dan jij en kopt raak.', 'Hij kopt over, gelukkig.', -.8, -.2)},
    {l:'Mandekking vasthouden', st:'cond', b:50, kaart:'geel', ok:()=>({t:'Je laat hem geen centimeter ruimte. Hij komt niet aan de bal.', d:.3}),
      mis:()=>{ const r = tegenKans(.4, 'Hij rukt zich los en scoort.', 'Hij rukt zich los, maar de keeper pakt de bal.', -.7, -.2); r.geel = rnd() < .2; return r; }},
    {l:'Buitenspelval zetten', st:'verd', b:62, ok:()=>({t:'Iedereen stapt tegelijk uit. Vlag omhoog: buitenspel!', d:.6}),
      mis:()=>tegenKans(.6, 'De val mislukt. Hij staat helemaal vrij en scoort.', 'De val mislukt, maar hij schiet in de handen van de keeper.', -1.0, -.3)},
    {l:'Zone verdedigen', st:'verd', b:50, ok:()=>({t:'Je bewaakt je zone perfect en wint het kopduel.', d:.3}),
      mis:()=>tegenKans(.4, 'Iemand duikt in jouw zone op en kopt raak.', 'Een kopbal uit jouw zone gaat net naast.', -.7, -.2)},
    {l:'Keeper laten komen', st:'kalm', b:50, ok:()=>({t:'Je roept "KEEPER!" en laat hem de bal plukken.', d:.2}),
      mis:()=>tegenKans(.5, 'Jij en de keeper botsen. De bal valt voor hun voeten: tegengoal.', 'Jij en de keeper botsen, maar de bal rolt uit.', -.8, -.3)}]},
  kopduel:{teksten:['Een hoge bal komt recht op je af. Een tegenstander springt mee.','De keeper trapt de bal ver uit. Hij komt jouw kant op.'], opts:[
    {l:'Doorkoppen naar teamgenoot', st:'pas', b:52, ok:()=>({t:'Je kopt de bal precies door. Jullie gaan in de aanval.', d:.3, next:'counter'}), mis:()=>({t:'Je kopbal komt bij de tegenstander.', d:-.2})},
    {l:'Op de borst aannemen', st:'drib', b:55, ok:()=>({t:'Prachtig op de borst aangenomen. Je draait weg!', d:.3, next:'rand'}), mis:()=>({t:'De bal stuitert van je borst weg.', d:-.2})},
    {l:'Wegkoppen', st:'verd', b:45, ok:()=>({t:'Je wint het kopduel. Simpel en goed.', d:.2}), mis:()=>({t:'Je verliest het kopduel.', d:-.2})},
    {l:'Volley in één keer', st:'afw', b:76, ok:()=>goal('Je raakt hem vol op de volley. Van ver... BINNEN!', 2.0), mis:()=>({t:'Je volley gaat richting de parkeerplaats.', d:-.3})},
    {l:'Laten stuiteren', st:'kalm', b:42, ok:()=>({t:'Je laat hem stuiteren en neemt hem rustig mee.', d:.1}), mis:()=>({t:'Je laat hem stuiteren, maar de tegenstander is er eerder.', d:-.3})}]},
  volley:{teksten:['Een weggekopte bal stuitert vlak voor je voeten op 18 meter.','De bal valt uit de lucht, recht voor je, net buiten de zestien.'], opts:[
    {l:'Volley op doel', st:'afw', b:70, ok:()=>goal('Je raakt hem perfect op de volley. Onhoudbaar!', 1.8), mis:()=>({t:'Je raakt hem helemaal verkeerd.', d:-.2})},
    {l:'Aannemen en draaien', st:'drib', b:56, ok:()=>({t:'Je neemt aan, draait en gaat ervandoor!', d:.3, next:'rand'}), mis:()=>({t:'Je aanname springt te ver weg.', d:-.2})},
    {l:'Terug naar achteren', st:'pas', b:40, ok:()=>({t:'Rustig terug. Jullie houden de bal.', d:.1}), mis:()=>({t:'Je terugspeelbal wordt onderschept.', d:-.4})},
    {l:'Hard in de zestien schieten', st:'afw', b:58, ok:()=> rnd() < .45 ? {t:'Je schot wordt van richting veranderd en gaat erin!', d:.8, goal:true} : {t:'Je schot ketst tegen een verdediger. Corner.', d:.1}, mis:()=>({t:'Recht in de handen van de keeper.', d:-.1})},
    {l:'Omhaal', st:'afw', b:80, ok:()=>goal('Een OMHAAL van 18 meter! Ongelooflijk!', 2.2), mis:()=>({t:'Je omhaal raakt alleen lucht.', d:-.4})}]},
  diepteBal:{teksten:['Jullie spits maakt een diepe loopactie achter de verdediging.','Je kijkt op en ziet de vleugelspeler wegsprinten.'], opts:[
    {l:'Steekbal over de grond', st:'pas', b:58, ok:()=>assistKans(.6, 'Je steekbal snijdt de verdediging open voor'), mis:()=>({t:'Je steekbal is te hard.', d:-.2})},
    {l:'Chip over de verdediging', st:'pas', b:64, ok:()=>assistKans(.65, 'Een zalige chip over de verdediging voor'), mis:()=>({t:'Je chip blijft in de verdediging hangen.', d:-.3})},
    {l:'Zelf de ruimte in', st:'drib', b:60, ok:()=>({t:'Je kiest zelf de ruimte en bent erdoor!', d:.3, next:'eenOpEen'}), mis:()=>({t:'Je loopt vast tussen twee verdedigers.', d:-.3})},
    {l:'Wachten op een beter moment', st:'kalm', b:40, ok:()=>({t:'Je houdt de bal en laat de ploeg aansluiten.', d:.1}), mis:()=>({t:'Je wacht te lang en wordt van de bal gezet.', d:-.3})}]},
  opbouw:{teksten:['Je krijgt de bal van de keeper. Hun spits zet meteen druk.','Je staat met de bal achterin. Twee tegenstanders komen op je af.'], opts:[
    {l:'Rustig uitverdedigen', st:'pas', b:45, ok:()=>({t:'Rustig ingespeeld op de middenvelder. Netjes.', d:.2}), mis:()=>tegenKans(.4, 'Je pass wordt onderschept en ze scoren.', 'Je pass wordt onderschept, maar het loopt goed af.', -.9, -.3)},
    {l:'Lange bal naar voren', st:'pas', b:58, ok:()=>assistKans(.3, 'Je lange bal komt precies bij'), mis:()=>({t:'Je lange bal is voor de tegenstander.', d:-.2})},
    {l:'Uitkappen en dribbelen', st:'drib', b:60, ok:()=>({t:'Je kapt de spits uit. Het publiek klapt!', d:.4, next:'counter'}), mis:()=>tegenKans(.5, 'Je verliest de bal op de rand van je eigen zestien. Tegengoal.', 'Je verliest de bal, maar je herstelt nog net.', -1.0, -.4)},
    {l:'Terug naar de keeper', st:'kalm', b:35, ok:()=>({t:'Veilig terug naar de keeper.', d:0}), mis:()=>tegenKans(.4, 'Je terugspeelbal is te zacht. Hun spits is er eerder en scoort.', 'Je terugspeelbal is te zacht, maar de keeper redt het.', -1.0, -.3)},
    {l:'Zelf oprukken', st:'cond', b:55, ok:()=>({t:'Je stoomt op over het middenveld!', d:.3, next:'counter'}), mis:()=>({t:'Je wordt van de bal gezet op de middenlijn.', d:-.3})}]},
  provocatie:{teksten:['Je tegenstander duwt je en zegt iets lelijks.','Je tegenstander trapt op je voet en grijnst erbij.'], opts:[
    {l:'Rustig blijven', st:'kalm', b:45, kaart:'geel', ok:()=>({t:'Je laat je niet gek maken. Hij wordt er zelf gek van.', d:.2}), mis:()=>({t:'Je zegt toch iets terug. De scheids geeft je geel.', d:-.3, geel:true})},
    {l:'Terugduwen', st:'kalm', b:72, kaart:'rood', ok:()=>({t:'Je duwt terug, maar de scheids ziet het niet.', d:0}), mis:()=> rnd() < .3 ? {t:'De scheids ziet het. Direct ROOD!', d:-1.5, rood:true} : {t:'Gele kaart voor jou. Stom.', d:-.4, geel:true}},
    {l:'Lachen en weglopen', st:'kalm', b:50, ok:()=>({t:'Je lacht hem uit en loopt weg. Hij wordt woest en krijgt zelf geel.', d:.3}), mis:()=>({t:'Hij blijft je de hele wedstrijd achtervolgen. Je raakt uit je ritme.', d:-.3})},
    {l:'Melden bij de scheids', st:'kalm', b:40, ok:()=>({t:'De scheids geeft hem een gele kaart.', d:.2}), mis:()=>({t:'De scheids zegt dat je niet moet zeuren.', d:-.1})}]},
  tackle:{teksten:['Een tegenstander komt met de bal aan zijn voet op je af. Jij moet ingrijpen.','Je teamgenoot verliest de bal. Hun middenvelder wil wegsprinten en jij staat het dichtst bij.','Hun spits schermt de bal af met zijn rug naar je toe. Jij staat vlak achter hem.'], opts:[
    {l:'Schone tackle', st:'verd', b:50, kaart:'geel', ok:()=>({t:'Je zet je voet er precies goed tussen. Bal gewonnen!', d:.5, next: rnd() < .3 ? 'counter' : undefined}),
      mis:()=> rnd() < .4 ? {t:'Je mist de bal en raakt zijn enkel.', d:-.3, geel:true} : {t:'Je mist de bal. Vrije trap voor de tegenstander.', d:-.2}},
    {l:'Sliding', st:'verd', b:58, kaart:'rood', ok:()=>({t:'Een perfecte sliding: bal en niks anders. Het publiek applaudisseert.', d:.6}),
      mis:()=>{ const r = rnd(); return r < .07 ? {t:'Met gestrekt been op zijn scheen. De scheids aarzelt niet: direct ROOD!', d:-1.2, rood:true} : r < .6 ? {t:'Te laat. Je raakt hem vol op de enkel.', d:-.4, geel:true} : {t:'Je glijdt eroverheen. Hij is weg.', d:-.3}; }},
    {l:'Keihard erin', st:'cond', b:48, kaart:'rood', ok:()=> rnd() < .25 ? {t:'Een keiharde maar eerlijke tackle. Hij ligt te kermen en zijn teamgenoten stormen op je af!', d:.4, next:'opstootje'} : {t:'Keihard maar eerlijk. De bal is van jou en het publiek brult.', d:.5},
      mis:()=> rnd() < .18 ? {t:'Veel te hard en veel te laat. Direct ROOD!', d:-1.3, rood:true} : {t:'Een wilde tackle. De scheids fluit en pakt zijn kaart.', d:-.4, geel:true}},
    {l:'Bal wegtikken', st:'drib', b:55, kaart:'geel', ok:()=>({t:'Je tikt de bal slim van zijn voet. Hij weet niet wat er gebeurt.', d:.4, next: rnd() < .35 ? 'counter' : undefined}),
      mis:()=> rnd() < .35 ? {t:'Je tikt tegen zijn hielen in plaats van tegen de bal.', d:-.3, geel:true} : {t:'Hij ziet je komen en draait weg.', d:-.2}},
    {l:'Blijven staan', st:'kalm', b:35, ok:()=>({t:'Je blijft rustig staan en zet de ruimte dicht. Hij moet terugspelen.', d:.2}),
      mis:()=>tegenKans(.3, 'Je blijft te lang staan. Hij loopt langs je en scoort.', 'Je blijft te lang staan, maar zijn schot gaat naast.', -.6, -.2)},
    {l:'Aan zijn shirt trekken', st:'verd', b:38, kaart:'geel', ok:()=> rnd() < .5 ? {t:'Je houdt hem even vast. De scheids ziet het niet. Gevaar weg.', d:.2} : {t:'Je trekt hem aan zijn shirt. Gevaar weg, maar de scheids zag het.', d:0, geel:true},
      mis:()=>({t:'Hij laat zich theatraal vallen. De scheids fluit en pakt zijn kaart.', d:-.3, geel:true})}]},
  opstootje:{teksten:['Na een harde overtreding ontstaat er een opstootje. Spelers van beide ploegen duwen elkaar.','Een tegenstander zet zijn hoofd tegen het jouwe. Iedereen kijkt naar jou.','Er ligt een speler op de grond en iedereen schreeuwt. Jij staat er middenin.'], opts:[
    {l:'Rustig weglopen', st:'kalm', b:40, ok:()=>({t:'Je draait je om en loopt weg. De scheids knikt goedkeurend.', d:.2}),
      mis:()=>({t:'Je loopt weg, maar hij blijft je de hele tijd uitdagen. Je raakt je concentratie kwijt.', d:-.2})},
    {l:'Teamgenoot wegtrekken', st:'kalm', b:45, kaart:'geel', ok:()=>({t:'Je trekt je teamgenoot weg voordat hij iets doms doet. De trainer steekt zijn duim op.', d:.3}),
      mis:()=> rnd() < .5 ? {t:'De scheids ziet jou midden in het opstootje staan en geeft jou ook een kaart.', d:-.3, geel:true} : {t:'Je wordt zelf ook geduwd, maar je houdt je in.', d:-.1}},
    {l:'Terugduwen', st:'kalm', b:68, kaart:'rood', ok:()=>({t:'Je duwt terug. De scheids kijkt net de andere kant op.', d:0}),
      mis:()=> rnd() < .25 ? {t:'Je duwt hem omver. De scheids ziet alles: direct ROOD!', d:-1.5, rood:true} : {t:'Je duwt terug en de scheids ziet het.', d:-.4, geel:true}},
    {l:'Neus tegen neus gaan staan', st:'kalm', b:78, kaart:'rood', ok:()=>({t:'Jullie staan neus tegen neus, maar niemand doet iets. De scheids stuurt jullie uit elkaar.', d:0}),
      mis:()=> rnd() < .4 ? {t:'Je geeft hem een kopstootje. Direct ROOD! Dit komt in alle samenvattingen.', d:-2, rood:true} : {t:'Jullie duwen met jullie hoofden tegen elkaar. Allebei geel.', d:-.5, geel:true}},
    {l:'Protesteren bij de scheids', st:'kalm', b:55, kaart:'geel', ok:()=> rnd() < .6 ? {t:'De scheids luistert naar je en geeft hun speler geel.', d:.2} : {t:'De scheids gebaart dat je moet doorlopen.', d:0},
      mis:()=>({t:'Je blijft zeuren en zwaaien met je armen. De scheids trekt een kaart voor commentaar.', d:-.3, geel:true})}]},
  toespraak:{teksten:['Rust, en jullie staan achter. Iedereen kijkt naar jou: jij bent de aanvoerder. Wat zeg je in de kleedkamer?'], opts:[
    {l:'Iedereen motiveren', st:'kalm', b:42, ok:()=>({t:'"We kunnen dit! Samen!" De jongens gaan met vuur het veld op.', d:.3, extraUs:true}), mis:()=>({t:'Je praatje komt niet echt aan. Iedereen kijkt naar zijn schoenen.', d:-.1})},
    {l:'Fel zijn en iedereen wakker schudden', st:'kalm', b:58, ok:()=>({t:'Je slaat met je vuist op tafel. Het werkt: iedereen is wakker.', d:.4, extraUs:true, minderThem:true}), mis:()=>({t:'Je bent te fel. Een paar spelers voelen zich aangevallen.', d:-.3, ruzie:true})},
    {l:'Rustig blijven, het plan volgen', st:'kalm', b:35, ok:()=>({t:'"Rustig blijven, we krijgen onze kansen." De ploeg staat weer goed.', d:.2, minderThem:true}), mis:()=>({t:'Rust is mooi, maar er verandert niks.', d:0})}]},
  keeperFout:{teksten:['Hun keeper laat een makkelijke bal los. Hij ligt voor je voeten!'], opts:[
    {l:'Intikken', st:'afw', b:40, ok:()=>goal('Je tikt hem simpel binnen. Dankjewel, keeper!', 1.0), mis:()=>({t:'Je tikt hem... naast. Hoe dan?!', d:-.8})},
    {l:'Hard erop', st:'afw', b:48, ok:()=>goal('Je knalt hem in het dak van het doel!', 1.0), mis:()=>({t:'Recht op de keeper, die hem alsnog pakt.', d:-.6})},
    {l:'Breed op een teamgenoot', st:'pas', b:44, ok:()=>assistKans(.8, 'Je legt hem breed op'), mis:()=>({t:'Je pass wordt nog net weggewerkt.', d:-.4})}]},
  laatsteMinuut:{teksten:['Laatste minuut! Jullie moeten nog scoren. De bal komt bij jou.'], opts:[
    {l:'Afstandsschot', st:'afw', b:72, ok:()=>goal('Van 30 meter... IN DE KRUISING! Het stadion ontploft!', 2.0), mis:()=>({t:'Hoog over. Het publiek zucht.', d:-.1})},
    {l:'Lange bal de zestien in', st:'pas', b:56, ok:()=>assistKans(.45, 'Je lange bal valt op het hoofd van'), mis:()=>({t:'De keeper plukt je bal uit de lucht.', d:-.1})},
    {l:'Dribbelen de zestien in', st:'drib', b:62, ok:()=> rnd() < .4 ? {t:'Je wordt neergehaald. PENALTY in de laatste minuut!', d:.3, next:'penalty'} : {t:'Je dribbelt de zestien in!', d:.3, next:'eenOpEen'}, mis:()=>({t:'Je verliest de bal. Daar gaat de laatste kans.', d:-.2})},
    {l:'Voorzet op de keeper die mee is', st:'pas', b:60, ok:()=> rnd() < .35 ? {t:'Jullie keeper is mee naar voren en kopt hem binnen! ONGELOOFLIJK!', d:1.0, assist:true, gekkeGoal:true} : {t:'Jullie keeper kopt net naast.', d:.2}, mis:()=>({t:'Je voorzet is te lang.', d:-.1})}]}
};

// Extra moeilijkheid per eigenschap tegen ploegen van Europees topniveau
export const TOP_EXTRA = {afw:1.5, pas:.35, drib:.35, verd:0, cond:0, kalm:0};
// Focus: hoe hoger, hoe meer er lukt. Vanaf 80 zit je in de flow (extra bonus), onder de 35 gaat het snel mis
export const FLOW = 80, SLECHTE_FOCUS = 35;
export const focusEffect = f => (f - 60) / 400 + (f >= FLOW ? .04 : 0) - (f < SLECHTE_FOCUS ? .05 : 0);
// Hoe hoger je focus al is, hoe minder een boost nog oplevert (en nooit boven de 100)
export const focusWinst = n => { const f = S.sp.focus ?? 65; return Math.min(Math.round(n * (f >= FLOW ? .25 : f >= 65 ? .6 : 1)), Math.max(0, 100 - Math.round(f))); };
export function focusBoost(n){ const echt = focusWinst(n); mod('focus', echt); return echt; }
export function focusStaat(f){ return f >= FLOW ? {k:'In de flow', cls:'r-veilig', t:'je acties lukken vaker'} : f < SLECHTE_FOCUS ? {k:'Slechte focus', cls:'r-riskant', t:'je maakt sneller fouten'} : null; }
export function kans(opt){
  const sp = S.sp, M = S.M;
  const oppS = M.oppS ?? CLUBS[M.opp].s;
  // Topteams zijn extra lastig: vooral hun keepers (schieten), maar ook in de rest van het spel
  // Alleen tegen ploegen van Europese-topniveau (sterkte 79+), dus niet in de Topdivisie
  const top = oppS >= 79 ? oppS - 72 : 0;
  const moeilijk = opt.b + (oppS - 48) + top * (TOP_EXTRA[opt.st] || 0);
  return clamp(.5 + (statWaarde(opt.st) - moeilijk) / 45 + sp.vorm * .03 + (sp.fit - 60) / 400 + (sp.moraal - 50) / 500 + focusEffect(sp.focus ?? 65) + (opt.st === 'pas' && telt(M) ? (chemie() - 50) / 600 : 0) + (sp.items.analist ? .02 : 0), .05, .95);
}
export function risico(p){ return p > .7 ? ['Veilig','r-veilig'] : p >= .45 ? ['Gemiddeld','r-gem'] : ['Riskant','r-riskant']; }
export const KAART_MOMENTEN = ['tackle', 'opstootje', 'provocatie', 'verdedigen'];
export function bouwMoment(type){
  const d = MOMENTS[type];
  const waarschuwing = S.M && S.M.geel && KAART_MOMENTEN.includes(type) ? ' Let op: je hebt al een gele kaart. Nog een kaart is rood!' : '';
  return {type, tekst:pick(d.teksten) + waarschuwing, idx:shuffle(d.opts.map((o, i) => i)).slice(0, Math.min(4, d.opts.length))};
}
export const pOpts = p => p.idx.map(i => MOMENTS[p.type].opts[i]);
export function kiesMomentType(){
  const pool = MOMENT_POOL[S.sp.pos]; let tot = 0; for (const k in pool) tot += pool[k];
  let r = rnd() * tot; for (const k in pool){ r -= pool[k]; if (r <= 0) return k; }
  return Object.keys(pool)[0];
}
