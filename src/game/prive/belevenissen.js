import { S, mod, seizoenLabel } from '../../core/state.js';
import { clamp, geldTxt, pick, randInt, rnd } from '../../core/utils.js';
import { roddel } from '../media/roddel.js';
import { onrust } from '../speler/kalmte.js';
import { iedereen, zetBand } from '../team/kleedkamer.js';
import { ouders } from './familie.js';
import { social, volgersTxt } from './social.js';

/* ===================== Belevenissen buiten het voetbal ===================== */
// Extra gebeurtenissen voor tussen de weken door. Zelfde vorm als in gebeurtenissen.js:
// {soort, als (mag hij nu voorkomen), tekst, opts:[{l, f(){ ...; return wat er gebeurde }}]}
// Sommige gebeuren maar één keer (sp.beleefd), sommige hebben een week later een vervolg (S.wachtEv).
export function belevenissen({sp, n, jong, bekend, meid}){
  const gehad = id => (sp.beleefd || []).includes(id);
  const beleef = id => { (sp.beleefd = sp.beleefd || []).push(id); };
  // betalen kan nooit meer dan je hebt
  const betaal = x => { const b = Math.max(0, Math.min(sp.geld, Math.round(x))); sp.geld -= b; return b; };
  const o = ouders(), band = d => { o.band = clamp(o.band + d, 0, 100); };
  const eigenHuis = sp.woning && sp.woning !== 'ouders', vervoer = sp.rijbewijs && sp.auto ? 'auto' : 'fiets';
  const vervolg = ev => { if (!S.wachtEv) S.wachtEv = ev; };

  return [
    // 1
    {soort:'prive', tekst:'Je beste vriend gaat verhuizen en vraagt of je zaterdag, op je vrije dag, komt helpen sjouwen.', opts:[
      {l:'Natuurlijk, ik til wel', f(){ mod('moraal', 6); mod('fit', -8); return rnd() < .25 ? 'Je sjouwt de hele dag en draagt in je eentje de bank naar de derde verdieping. Je rug voelt het, maar je vriend vergeet het nooit.' : 'Na tien uur dozen tillen eten jullie patat op de grond van zijn nieuwe huis. Gezellig.'; }},
      {l:'Pizza voor iedereen betalen, maar niet komen', f(){ const b = betaal(60); mod('moraal', 1); return `Je laat ${b ? geldTxt(b) + ' aan ' : ''}pizza bezorgen. "Lekker, maar we hadden liever jouw armen gehad," appt hij.`; }},
      {l:'Sorry, ik moet rusten', f(){ mod('moraal', -4); mod('fit', 4); return 'Hij snapt het wel. Maar op de foto\'s van de verhuizing sta jij er niet bij.'; }}]},
    // 2
    {soort:'prive', als: sp.rep > 10, tekst:'Je oude basisschool vraagt of je een gastles komt geven. De kinderen hebben het nergens anders meer over.', opts:[
      {l:'Gaan en een balletje trappen op het schoolplein', f(){ mod('rep', 2); mod('moraal', 7); mod('fit', -2); return 'Dertig kinderen willen een handtekening op hun arm. Je oude juf vertelt dat je vroeger al nooit stil kon zitten.'; }},
      {l:'Een gesigneerde bal opsturen', f(){ mod('rep', 1); return 'De bal krijgt een ereplaats in een vitrinekast bij de ingang.'; }},
      {l:'Geen tijd', f(){ mod('rep', -1); return 'De school hangt in plaats daarvan een poster van je op. Een beetje jammer.'; }}]},
    // 3
    {soort:'prive', tekst:'Je krijgt een sms: "Hoi, ik ben het, mijn telefoon is kapot. Dit is mijn nieuwe nummer. Kun je me even 450 euro overmaken? Leg het later uit."', opts:[
      {l:'Snel overmaken, het zal wel kloppen', f(){ const b = betaal(450); mod('moraal', -8); onrust(4, 'Opgelicht'); return `Een uur later belt je moeder met haar eigen telefoon. Ze weet van niks. ${b ? geldTxt(b) + ' is weg.' : 'Gelukkig stond er niks op je rekening.'} Opgelicht.`; }},
      {l:'Eerst bellen op het oude nummer', f(){ mod('focus', 1); return 'Je moeder neemt gewoon op. "Een nieuw nummer? Ik? Nee hoor." Je hebt een oplichter ontmaskerd.'; }},
      {l:'Het nummer meteen blokkeren', f(){ return 'Weg ermee. Je stuurt nog een waarschuwing in de familiegroepsapp.'; }}]},
    // 4 · eenmalig
    {soort:'prive', als: sp.leeftijd >= 18 && !gehad('tattoo'), tekst:'Een paar teamgenoten hebben net een nieuwe tattoo. Jij zit ook al een tijdje te twijfelen.', opts:[
      {l:'Een kleine op je onderarm', f(){ beleef('tattoo'); mod('moraal', 4); return 'Een klein voetballetje met de datum van je debuut. Je bent er blij mee.'; }},
      {l:'Een grote op je hele rug', f(){ beleef('tattoo'); const b = betaal(900); mod('moraal', 6); band(-6); if (bekend) roddel(`${sp.naam} laat enorme tattoo zetten`, 'Op zijn hele rug prijkt nu een leeuw met een voetbal. Fans zijn verdeeld.');
        return `${b ? geldTxt(b) + ' en ' : ''}zes uur pijn later heb je een leeuw met een voetbal op je rug. Je moeder schrikt zich rot als ze hem ziet.`; }},
      {l:'Toch maar niet', f(){ beleef('tattoo'); return 'Je bedenkt je in de wachtkamer. Misschien later.'; }}]},
    // 5 · eenmalig
    {soort:'prive', als: sp.leeftijd >= 18 && !gehad('getuige'), tekst:'Je beste vriend gaat trouwen en vraagt jou als getuige. Je moet een speech houden voor honderd gasten.', opts:[
      {l:'Een week lang de speech oefenen', f(){ beleef('getuige'); mod('focus', -4); if (rnd() < .75){ mod('moraal', 12); return 'Je speech is grappig en ontroerend tegelijk. De bruid huilt, je vriend omhelst je. Een avond om nooit te vergeten.'; } mod('moraal', 4); return 'Je zenuwen spelen op, maar met je spiekbriefje kom je er goed doorheen.'; }},
      {l:'Improviseren, dat gaat wel goed', f(){ beleef('getuige'); if (rnd() < .4){ mod('moraal', 10); return 'Je praat recht uit je hart. De hele zaal lacht en klapt.'; } mod('moraal', -6); return 'Je vertelt per ongeluk het verhaal van zijn vorige vriendin. Het wordt heel stil. Je vriend lacht er later wel om. Bijna.'; }}]},
    // 6
    {soort:'prive', tekst:`${n} heeft een escape room geregeld met een paar jongens uit de selectie.`, opts:[
      {l:'De leiding nemen', f(){ if (rnd() < .6){ iedereen(2); mod('moraal', 5); return 'Jullie ontsnappen met nog twee minuten op de klok. Jij kraakte de laatste code. Op de training wordt er nog dagen over gepraat.'; } zetBand(n, -4); mod('moraal', -2); return `Je commandeert iedereen rond en jullie komen er niet uit. ${n} vindt dat je wel wat minder bazig mag zijn.`; }},
      {l:'Rustig meedenken', f(){ iedereen(1); mod('moraal', 3); return 'Het is een gezellige avond. De code vinden jullie net niet, maar het bier erna is lekker.'; }}]},
    // 7 · met vervolg
    {soort:'prive', als: eigenHuis, tekst:'Je buren hangen een briefje op je deur: je feestje van vrijdag was veel te hard. Om drie uur \'s nachts.', opts:[
      {l:'Aanbellen met taart en sorry zeggen', f(){ betaal(25); mod('moraal', 1); return 'De buurvrouw blijkt een groot fan. Ze wil een handtekening voor haar kleinzoon. Alles is weer goed.'; }},
      {l:'Negeren', f(){
        vervolg({soort:'prive', tekst:'Het is weer laat en luid bij jou thuis. Er staat ineens politie voor de deur: de buren hebben gebeld.', opts:[
          {l:'Muziek uit en excuses aanbieden', f(){ mod('rep', -1); return 'De agenten zijn vriendelijk. Ze willen wel nog een selfie.'; }},
          {l:'In discussie gaan', f(){ mod('rep', -4); mod('vert', -3); onrust(4, 'Gedoe met de politie'); if (bekend) roddel(`Politie bij feest van ${sp.naam}`, 'Buren klagen over geluidsoverlast. De club zegt "het gesprek aan te gaan".'); return 'Je krijgt een boete en de club leest er de volgende dag over in de krant.'; }}]});
        return 'Je gooit het briefje weg. Het zal wel loslopen.'; }}]},
    // 8
    {soort:'prive', tekst:'Je vrienden willen dat je gaat streamen terwijl jullie gamen. "Mensen willen zien hoe slecht jij bent met een controller."', opts:[
      {l:'Een avondje live', f(){ const s = social(), erbij = Math.round(30 + s.volgers * .04 + sp.rep * 5); s.volgers += erbij; mod('moraal', 5); mod('fit', -4); return `Je verliest elk potje, maar de chat gaat los. Je krijgt ${volgersTxt(erbij)} nieuwe volgers.`; }},
      {l:'Nee, gewoon gamen zonder camera', f(){ mod('moraal', 3); return 'Een rustige avond met de jongens. Geen camera, wel chips.'; }}]},
    // 9 · eenmaal per seizoen
    {soort:'prive', als: sp.leeftijd >= 16 && !gehad('marathon-' + seizoenLabel()), tekst:'In je stad wordt een marathon gelopen voor het goede doel. Ze vragen of jij meedoet.', opts:[
      {l:'Meelopen, de hele 42 kilometer', f(){ beleef('marathon-' + seizoenLabel()); mod('fit', -25); mod('rep', 4); mod('moraal', 8); S.ss.goed = (S.ss.goed || 0) + 1; if (rnd() < .15){ sp.blessure = Math.max(sp.blessure || 0, 1); return 'Je haalt de finish, maar je kuit doet zeer. Een week rust. Het was het waard: de kas zit vol.'; } return 'Bij kilometer 35 wil je stoppen, maar het publiek scandeert je naam. Je haalt de finish!'; }},
      {l:'Niet lopen, wel sponsoren', f(){ beleef('marathon-' + seizoenLabel()); const b = betaal(Math.max(50, sp.geld * .03)); mod('rep', 1); if (b) S.ss.goed = (S.ss.goed || 0) + 1; return b ? `Je doneert ${geldTxt(b)}. De organisatie bedankt je op hun website.` : 'Je hebt helaas niks om te geven. Volgend jaar beter.'; }},
      {l:'Daar heb ik geen tijd voor', f(){ beleef('marathon-' + seizoenLabel()); return 'Je kijkt de marathon op tv. Je buurman loopt mee en zwaait naar de camera.'; }}]},
    // 10 · met vervolg
    {soort:'prive', als: sp.leeftijd >= 18 && sp.geld > 3000 && !sp.lening, tekst:'Je neef wil een eigen foodtruck beginnen en vraagt of hij 2000 euro van je kan lenen.', opts:[
      {l:'Lenen, familie is familie', f(){ const b = betaal(2000); sp.lening = b; band(3);
        vervolg({soort:'prive', tekst:'Je neef belt over het geld dat je hem leende.', opts:[
          {l:'Opnemen', f(){ const b2 = sp.lening || 0; sp.lening = null; if (rnd() < .6){ sp.geld += Math.round(b2 * 1.15); mod('moraal', 5); return `De foodtruck loopt goed! Hij betaalt je ${geldTxt(Math.round(b2 * 1.15))} terug, met rente. En je mag altijd gratis eten.`; } mod('moraal', -6); return 'De foodtruck is failliet. Hij zegt dat hij je "echt ooit" terugbetaalt. Je gelooft er niks van.'; }}]});
        return `Je maakt ${geldTxt(b)} over. Hij is je eeuwig dankbaar, zegt hij.`; }},
      {l:'Nee, geld en familie gaan niet samen', f(){ band(-4); return 'Op de volgende verjaardag is het een beetje ongemakkelijk tussen jullie.'; }}]},
    // 11
    {soort:'prive', als: bekend, tekst:'Een tv-zender vraagt of je meedoet aan een kookwedstrijd met bekende sporters. De winnaar krijgt geld voor een goed doel.', opts:[
      {l:'Meedoen en je beste gerecht maken', f(){ mod('fit', -3); if (rnd() < .4){ mod('rep', 5); mod('moraal', 8); S.ss.goed = (S.ss.goed || 0) + 1; roddel(`${sp.naam} wint kookwedstrijd`, 'Met zijn pasta van oma verslaat hij een schaatser en een tennisster.'); return 'Je pasta van oma wint! Het geld gaat naar een voetbalclub voor kinderen in de buurt.'; }
        mod('rep', -1); return 'Je laat de saus aanbranden en het brandalarm gaat af. Het fragment gaat viraal. Je kunt er zelf om lachen.'; }},
      {l:'Afzeggen, ik kan alleen tosti\'s maken', f(){ return 'De zender vraagt in plaats van jou een keeper. Hij wint.'; }}]},
    // 12
    {soort:'prive', tekst:`Je ${vervoer} is gestolen, gewoon voor je deur.`, opts:[
      {l:'Aangifte doen bij de politie', f(){ mod('moraal', -3); return rnd() < .25 ? `Twee weken later wordt je ${vervoer} teruggevonden. Een beetje beschadigd, maar wel heel.` : 'De agent schrijft alles op. "We houden u op de hoogte." Je hoort er nooit meer iets van.'; }},
      {l:'Een oproep op social media', f(){ if (social().volgers > 2000 && rnd() < .55){ mod('moraal', 6); mod('rep', 1); return `Je volgers gaan op zoek. Een dag later staat je ${vervoer} weer voor de deur, met een briefje: "Sorry, wist niet van wie hij was."`; } mod('moraal', -2); return 'Veel mensen delen je bericht, maar je vindt hem niet terug.'; }},
      {l:'Gewoon een nieuwe kopen', f(){ const b = betaal(vervoer === 'auto' ? 1500 : 400); mod('moraal', -2); return b ? `Je koopt een nieuwe voor ${geldTxt(b)}. Deze keer met een dubbel slot.` : 'Je hebt het geld niet. De komende tijd ga je met de bus.'; }}]},
    // 13
    {soort:'prive', als: sp.leeftijd >= 18, tekst:'In het dorpscafé is een pubquiz. Je vrienden willen dat je in hun team komt.', opts:[
      {l:'Meedoen', f(){ mod('moraal', 6); mod('fit', -2); if (rnd() < .3){ sp.geld += 100; return 'Jullie winnen! Dankzij jou: de vraag over welke club in 1988 de Europa Cup won. Een prijzenpot van 100 euro.'; } return 'Jullie eindigen als zevende. De ronde over muziek uit de jaren 80 was een ramp.'; }},
      {l:'Thuisblijven', f(){ mod('fit', 3); return 'Je kijkt een film op de bank. Ook prima.'; }}]},
    // 14
    {soort:'prive', als: sp.leeftijd >= 16, tekst:'Het is carnaval. Je vrienden willen dat je meegaat, en je moet verkleed.', opts:[
      {l:'Verkleed als jezelf', f(){ mod('moraal', 9); mod('fit', -6); if (bekend) roddel(`${sp.naam} verkleed als... ${sp.naam}`, 'Op carnaval liep hij rond in zijn eigen shirt met een nep-snor. Niemand herkende hem.'); return 'Je loopt rond in je eigen shirt met een nep-snor. Drie mensen zeggen dat je goed op die voetballer lijkt.'; }},
      {l:'Het hele weekend feesten', f(){ mod('moraal', 14); mod('fit', -22); mod('focus', -8); if (rnd() < .3) mod('vert', -5); return 'Drie dagen hossen, polonaise en veel te weinig slaap. Maandag op de training ben je een zombie.'; }},
      {l:'Eén avondje, dan naar huis', f(){ mod('moraal', 6); mod('fit', -4); return 'Een avond gek doen en om twaalf uur thuis. Verstandig én gezellig.'; }}]},
    // 15
    {soort:'prive', tekst:'Bij de supermarkt vraagt een dakloze man of je wat kleingeld voor hem hebt. Het is koud.', opts:[
      {l:'Eten en warme koffie voor hem kopen', f(){ betaal(15); mod('moraal', 7); return 'Jullie praten een kwartier. Hij voetbalde vroeger ook. Hij wenst je veel succes zaterdag.'; }},
      {l:'Een tientje geven', f(){ betaal(10); mod('moraal', 3); return 'Hij bedankt je hartelijk.'; }},
      {l:'Doorlopen', f(){ mod('moraal', -2); return 'Je loopt door, maar je denkt er de hele avond nog aan.'; }}]},
    // 16 · eenmalig
    {soort:'prive', als: !gehad('huwelijk-ouders'), tekst:'Je ouders zijn binnenkort 25 jaar getrouwd. Je broers en zussen kijken naar jou.', opts:[
      {l:'Een verrassingsfeest organiseren', f(){ beleef('huwelijk-ouders'); const b = betaal(Math.max(200, sp.geld * .04)); band(15); mod('moraal', 8); mod('fit', -4); return `${b ? `Je zet ${geldTxt(b)} in voor ` : 'Je regelt '}een feest met de hele familie. Je moeder huilt van geluk en je vader houdt een speech over jou.`; }},
      {l:'Een mooi cadeau', f(){ beleef('huwelijk-ouders'); betaal(150); band(7); return 'Een weekendje weg naar de plek waar ze elkaar ontmoetten. Ze zijn er heel blij mee.'; }},
      {l:'Vergeten...', f(){ beleef('huwelijk-ouders'); band(-15); mod('moraal', -5); return 'Je bent het vergeten. Je moeder zegt dat het niet erg is. Het is wel erg.'; }}]},
    // 17
    {soort:'prive', als: sp.leeftijd >= 18 && !sp.relatie, tekst:`Je vrienden hebben een blind date voor je geregeld met ${meid}. Vanavond, in een restaurant in de stad.`, opts:[
      {l:'Gaan en gewoon jezelf zijn', f(){ mod('moraal', 4); if (rnd() < .45 + (sp.moraal - 50) / 250){ sp.relatie = {naam:meid, band:50, weken:0}; mod('moraal', 6); return `Jullie lachen de hele avond. ${meid} wil je graag terugzien. Het begin van iets moois?`; } return `Een leuke avond, maar er zit geen vonk. ${meid} en jij blijven vrienden.`; }},
      {l:'Opscheppen over je carrière', f(){ if (rnd() < .15 + sp.rep / 400){ sp.relatie = {naam:meid, band:40, weken:0}; return `Tegen alle verwachting werkt het. ${meid} vindt het wel stoer.`; } mod('moraal', -4); return `${meid} gaapt drie keer en gaat vroeg naar huis. "Je had het alleen maar over jezelf."`; }},
      {l:'Afzeggen', f(){ mod('moraal', -1); return 'Je vrienden vinden je een slapjanus.'; }}]},
    // 18
    {soort:'prive', als: jong, tekst:'Je vrienden hangen rond in het skatepark. Ze dagen je uit om een nieuwe truc te doen op een skateboard.', opts:[
      {l:'De truc proberen', f(){ if (rnd() < .5){ mod('moraal', 8); return 'Het lukt in één keer! Je vrienden filmen het en de video gaat de hele school rond.'; } if (rnd() < .4){ sp.blessure = Math.max(sp.blessure || 0, randInt(1, 2)); mod('vert', -3); return `Je valt hard op je pols. ${sp.blessure} ${sp.blessure === 1 ? 'week' : 'weken'} niet trainen. De trainer is niet blij.`; } mod('moraal', -2); return 'Je valt op je billen. Iedereen lacht, jij ook maar.'; }},
      {l:'Voorzichtig wat rondrijden', f(){ mod('moraal', 4); return 'Je rijdt rustig wat rondjes. Een gezellige middag.'; }},
      {l:'Thuisblijven, je benen zijn je kapitaal', f(){ mod('fit', 3); return 'Je vrienden noemen je een opa. Je trainer zou trots zijn.'; }}]},
  ];
}
