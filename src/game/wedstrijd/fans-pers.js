import { S, club, mod, ovr, tmp } from '../../core/state.js';
import { keuzeKnop } from '../../core/ui.js';
import { clamp, esc, geldTxt, pick, rnd } from '../../core/utils.js';
import { CLUBS, divClubs } from '../../data/gegevens.js';
import { KRANTEN } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { social, volgersTxt } from '../prive/social.js';
import { onrust } from '../speler/kalmte.js';
import { fmt1 } from '../speler/o23.js';
import { recenteGoudenBal, statusNiveau, statusPunten } from '../speler/status.js';
import { isAanvoerder } from '../team/aanvoerder.js';
import { iedereen } from '../team/kleedkamer.js';
import { ck } from '../transfers/buitenland.js';
import { focusBoost } from './momenten.js';
import { balk } from '../../render/views/zijbalk.js';
import { pers } from '../speler/persoonlijkheid.js';
import { rivaal as rivaalObj, rivaalNaam, zetBand } from '../speler/rivaal.js';
import { extraHoofdvragen, extraVervolgvragen } from './persvragen.js';
import { toonMeter, vriendBijTegenstander, vriendNaam, zetBand as zetVriendBand } from '../speler/journey.js';
import { ik, team } from '../../core/geslacht.js';

/* ===================== Derby's, fans en persconferenties ===================== */
// Elke club heeft een vaste aartsrivaal (de buurclub in de lijst). Spelen ze niet meer in dezelfde divisie, dan krijgt de club een rivaal uit de eigen divisie
export function rivaal(id){
  const c = CLUBS[id]; if (!c) return null;
  const p = id ^ 1; if (CLUBS[p] && CLUBS[p].t === c.t) return p;
  const los = divClubs(c.t).filter(i => !(CLUBS[i ^ 1] && CLUBS[i ^ 1].t === c.t)).sort((a, b) => a - b);
  const k = los.indexOf(id); if (los.length < 2 || k < 0) return null;
  return k % 2 === 0 ? (los[k + 1] ?? los[k - 1]) : los[k - 1];
}
export const isDerby = opp => opp === rivaal(S.sp.club);
// Fans: per club een balk van 0 tot 100 (start 50)
export function fans(id = S.sp.club){ const f = S.sp.fans = S.sp.fans || {}, k = ck(id); if (f[k] === undefined) f[k] = 50; return f[k]; }
export function zetFans(id, v){ fans(id); S.sp.fans[ck(id)] = clamp(v, 0, 100); }
export function modFans(n, id = S.sp.club){ const k = ck(id); fans(id); S.sp.fans[k] = clamp(S.sp.fans[k] + n, 0, 100); return S.sp.fans[k]; }
export function fansLabel(v){ return v >= 85 ? ['Ze zingen je naam', 'r-veilig'] : v >= 65 ? ['Geliefd', 'r-veilig'] : v >= 40 ? ['Neutraal', 'r-gem'] : v >= 20 ? ['Kritisch', 'r-riskant'] : ['Ze fluiten je uit', 'r-riskant']; }
// Voor de aftrap: de fans zingen je naam of fluiten je uit (thuis en in derby's)
export function fansVoorAftrap(M){
  if (!(M.thuis || M.derby)) return;
  const f = fans();
  if (f >= 75 && rnd() < .7){ const n = focusBoost(3); M.log.push({m:'', t:`De fans zingen je naam als de opstelling wordt omgeroepen. Kippenvel! Focus +${n}.`, k:'ok'}); }
  else if (f < 25 && rnd() < .7){ mod('focus', -4); onrust(4, 'Uitgefloten door je eigen fans'); M.log.push({m:'', t:'Als je naam wordt omgeroepen, klinkt er een fluitconcert van je eigen fans. Focus −4.', k:'mis'}); }
}
// Na een clubwedstrijd: fans, derby en grote woorden uit de vorige persconferentie
export function fansNaWedstrijd(M, speelde){
  const sp = S.sp, won = M.us > M.them, verl = M.us < M.them, zij = CLUBS[M.opp].n;
  const voor = Math.round(fans());
  if (speelde) modFans((M.cijfer - 6.5) * 2.5 + M.goals * 1.5 + M.assists * .5 - (M.rood ? 6 : 0) + (won ? 1 : verl ? -1 : 0) + pers('fans'));
  else modFans((50 - fans()) * .03);
  if (M.derby){
    const d = S.car.derby = S.car.derby || {w:0, g:0, v:0, goals:0};
    if (won) d.w++; else if (verl) d.v++; else d.g++;
    if (speelde) d.goals += M.goals;
    if (won){ mod('moraal', 6); iedereen(2); statusPunten(speelde ? 3 : 1); modFans(speelde ? 8 : 3);
      M.derbyTekst = speelde && M.rood ? `Derby gewonnen van ${zij}! Jouw rode kaart maakte het wel spannend, maar het team hield stand.` : speelde && M.goals ? `Derby gewonnen en jij scoorde! De hele stad praat over je. Je bent een clubheld.` : `Derby gewonnen van ${zij}! In de kantine gaat het feest door tot diep in de nacht.`; }
    else if (verl){ mod('moraal', -6); statusPunten(speelde ? -2 : 0); modFans(speelde ? -6 : -2);
      M.derbyTekst = `Verloren van aartsrivaal ${zij}. Dat doet extra pijn. De fans zijn chagrijnig.`; }
    else M.derbyTekst = `Geen winnaar in de derby tegen ${zij}. Niemand kan opscheppen, deze keer.`;
    S.ss.rivaalFel = false;
  }
  if (speelde && sp.grootSpraak){
    const naam = sp.naam;
    if (M.cijfer >= 7.5){ modFans(4); mod('rep', 2); M.grootTekst = 'Je maakte je grote woorden waar. Respect van de fans!'; krantMelding(`${naam} maakt ${ik.zijn} woorden waar`, `Vorige week had ${ik.hij} een grote mond, nu liet ${ik.hij} het zien: een ${fmt1(M.cijfer)} tegen ${zij}.`); }
    else if (M.cijfer <= 6){ modFans(-4); mod('rep', -2); M.grootTekst = 'Na je grote woorden in de pers viel je tegen. De krant smult ervan.'; krantMelding(`Grote woorden, weinig daden van ${naam}`, `Vorige week was ${ik.hij} nog zo zeker van zichzelf. Tegen ${zij} kreeg ${ik.hij} een ${fmt1(M.cijfer)}.`); }
    sp.grootSpraak = false;
  }
  const na = Math.round(fans());
  M.fansTekst = na !== voor ? `Fans ${voor} → ${na}.` : null;
}
// Supporters: twee acties per week
export const FAN_ACTIES = [
  {id:'handtekening', l:'Handtekeningen uitdelen na de training', d:'fans +3 · een paar nieuwe volgers · fitheid −2'},
  {id:'supporters',   l:'Langsgaan bij de supportersclub',      d:'fans +5 · moraal +2 · fitheid −3'}
];
export function fanActie(id){
  const sp = S.sp, w = S.week, c = club().n; if (!w || (w.fans || []).includes(id) || sp.o23) return;
  (w.fans = w.fans || []).push(id);
  if (id === 'handtekening'){ modFans(3); mod('fit', -2); const n = Math.round(10 + social().volgers * .005); social().volgers += n;
    w.tekst.push(pick([`Na de training staat er een rij kinderen bij het hek. Je zet handtekeningen op shirts, petjes en zelfs een arm. +${volgersTxt(n)} volgers.`, `Een jongetje in jouw shirt kijkt je met grote ogen aan als je zijn bal signeert. Zijn vader maakt een foto. +${volgersTxt(n)} volgers.`, `Je neemt de tijd voor iedere fan bij het hek. Een oud vrouwtje vertelt dat ze al 50 jaar naar ${c} komt. +${volgersTxt(n)} volgers.`])); }
  else { modFans(5); mod('moraal', 2); mod('fit', -3);
    w.tekst.push(pick([`Je schuift aan bij de supportersclub van ${c}. Je drinkt een colaatje, beantwoordt vragen en tapt zelfs een biertje voor de voorzitter.`, `In het clubhuis van de supporters hangen sjaals van 40 jaar oud. Ze vertellen verhalen over vroeger en je luistert. Ze vinden het prachtig dat je er bent.`, `De supportersclub houdt een quiz over ${c}. Jij weet de helft niet, maar je lacht mee. Iedereen vindt je een toffe gast.`])); }
}
export function vFans(){
  const sp = S.sp; if (sp.o23) return '';
  const f = Math.round(fans()), [lab, cls] = fansLabel(f), r = rivaal(sp.club), w = S.week || {}, gedaan = w.fans || [];
  const d = S.car.derby;
  return `<section id="fansPanel" class="paneel sectie"><h3 class="sectiekop">Supporters · fans ${f} · ${lab}</h3>
    <div style="display:grid;gap:8px;margin-top:8px">${balk('Fans', f, 'st')}
    <p class="muted klein-tekst">Hoe meer de fans van je houden, hoe vaker ze je naam zingen voor de aftrap (focus omhoog). Zijn ze kritisch, dan fluiten ze je uit. Goals, goede cijfers en gewonnen derby's maken ze blij. Rode kaarten en een overstap naar de rivaal niet.</p>
    ${r !== null ? `<p>Aartsrivaal: <b>${esc(CLUBS[r].n)}</b>${d ? ` <span class="muted">· jouw derby's: ${d.w} gewonnen, ${d.g} gelijk, ${d.v} verloren${d.goals ? `, ${d.goals} ${d.goals === 1 ? 'goal' : 'goals'}` : ''}</span>` : ''}</p>` : ''}
    <div class="keuzes">${FAN_ACTIES.map(a => keuzeKnop(esc(a.l), gedaan.includes(a.id) ? 'deze week al gedaan' : esc(a.d), () => fanActie(a.id), `data-blijf ${gedaan.includes(a.id) ? 'disabled' : ''}`)).join('')}</div></div></section>`;
}
// Persconferentie na de wedstrijd: een vraag en drie soorten antwoorden
// Wie mag naar de persconferentie? Alleen het gezicht van het team: de aanvoerder, een fanfavoriet of clublegende,
// of een grote speler (minstens vaste waarde en duidelijk beter dan het team, of een grote naam). Een jonkie of bankspeler niet
export function persWaardig(){
  const sp = S.sp; if (!sp || sp.o23) return false;
  const n = statusNiveau();
  if (isAanvoerder() || n >= 3) return true;
  return n >= 2 && (ovr(sp) >= club().s + 4 || sp.rep >= 70 || recenteGoudenBal());
}
export function maakPers(M, soort){
  const sp = S.sp, zij = CLUBS[M.opp].n, wij = club().n, won = M.us > M.them, verl = M.us < M.them, c = M.cijfer;
  const bron = pick(KRANTEN[Math.min(club().t, 2)]);
  let v;
  if (soort === 'finale') v = won
    ? {vraag:`Je hebt de finale gewonnen! Wat gaat er door je heen?`, b:'"Dit is voor de fans en voor mijn familie. Zonder hen was dit niet gelukt."', z:'"Dit is pas het begin. Ik wil nog veel meer prijzen."', u:`"${zij} dacht dat ze favoriet waren. Nou, mooi niet."`, doel:'tegenstander'}
    : {vraag:`Verloren in de finale. Hoe voel je je?`, b:'"Leeg. Maar we komen sterker terug, dat beloof ik."', z:'"Volgend jaar staan we hier weer, en dan winnen we."', u:'"De scheidsrechter heeft deze finale beslist, niet wij."', doel:'scheids'};
  else if (M.rivaal){ const n = rivaalNaam(); v = {vraag:`Je speelde tegen je rivaal ${n}. Wie was vandaag de beste?`, b:`"${n} is een goede speler. We maken elkaar beter."`, z:won ? '"Dat zag iedereen toch? Ik."' : '"Vandaag hij misschien. Maar de race is nog lang."', u:`"${n}? Ik heb hem de hele wedstrijd niet gezien."`, doel:'rivaalSpeler'}; }
  else if (M.derby) v = won
    ? {vraag:`Gewonnen van aartsrivaal ${zij}. Wat betekent dat?`, b:'"Heel veel, vooral voor de supporters. Maar het zijn ook maar drie punten."', z:'"Wij zijn de beste club van de regio. Dat weet nu iedereen."', u:`"${zij}? Die spelen al jaren in onze schaduw."`, doel:'rivaal'}
    : verl ? {vraag:`Verloren van ${zij}. Hoe hard komt dat aan?`, b:'"Heel hard. Sorry aan onze fans, die verdienen beter."', z:'"Dit was een ongelukje. De volgende derby is van ons."', u:`"Ze hadden puur geluk. Volgende keer pakken we ze, en goed ook."`, doel:'rivaal'}
    : {vraag:`Gelijk in de derby tegen ${zij}. Tevreden?`, b:'"We hebben er alles aan gedaan. Een punt is een punt."', z:'"We waren de betere ploeg, dat zag iedereen."', u:`"${zij} kwam alleen om te verdedigen. Zielig."`, doel:'rivaal'};
  else {
    // Per situatie een paar vragen; een vraag die je onlangs kreeg komt niet terug ("grote clubs" hooguit eens per seizoen)
    const L = c >= 8 ? [
      {id:'grootClubs', vraag:'Je was de beste man op het veld. Bellen er al grote clubs?', b:`"Ik denk alleen aan ${wij}. Hier ben ik gelukkig."`, z:'"Ik ben klaar voor de volgende stap, dat voel ik."', u:`"Eerlijk? Deze club is eigenlijk te klein voor mij."`, doel:'club'},
      {id:'geheim', vraag:'Wat was vandaag je geheim?', b:'"Mijn ploeggenoten zetten me in de juiste positie. Zonder hen lukt dit niet."', z:'"Hard trainen. Dit is het resultaat, en er komt meer."', u:'"Geen geheim. Ik ben gewoon beter dan de rest van het veld."', doel:'team'},
      {id:'topvorm', vraag:'Je zit in topvorm. Hoe houd je dit vast?', b:'"Rustig blijven, en luisteren naar de trainer."', z:'"Elke week zo. Dat is mijn standaard."', u:'"Als de trainer me elke week opstelt, gaat het vanzelf. Dat was niet altijd zo."', doel:'trainer'},
      {id:'tegenstanderTop', vraag:`Je maakte het ${zij} vandaag erg lastig. Wat zeg je tegen hun verdediging?`, b:'"Het zijn goede spelers. Vandaag zat het mee."', z:'"Ze wisten niet wat ze met me aan moesten."', u:'"Welke verdediging? Ik heb er niks van gemerkt."', doel:'tegenstander'}]
    : c <= 5.5 ? [
      {id:'misgegaan', vraag:'Dit was niet je beste wedstrijd. Wat ging er mis?', b:'"Ik moet beter, en dat ga ik ook doen. Mijn fout."', z:'"Iedereen heeft een mindere dag. Volgende week sta ik er weer."', u:'"De trainer zette me op de verkeerde plek. Vraag het hem maar."', doel:'trainer'},
      {id:'fluitconcert', vraag:'Er werd gefloten toen je werd gewisseld. Hoe voelde dat?', b:'"Terecht. De fans verdienen meer van mij."', z:'"Ik laat ze volgende week weer juichen."', u:'"Die fans moeten eens weten hoe het is om op dit niveau te spelen."', doel:'club'},
      {id:'ritme', vraag:'Je kwam niet in je spel. Mis je het vertrouwen?', b:'"Ik moet het vertrouwen terugverdienen. Daar werk ik aan."', z:'"Nee hoor. Eén slechte dag zegt niets."', u:'"Als ik nooit de bal krijg, kan ik ook niks laten zien."', doel:'team'}]
    : won ? [
      {id:'verschil', vraag:`Mooie overwinning op ${zij}. Wat was het verschil?`, b:'"Het hele team heeft hard gewerkt. Dit doen we samen."', z:'"Wij zijn gewoon beter. Zo simpel is het."', u:`"${zij} was echt slecht vandaag. Het was te makkelijk."`, doel:'tegenstander'},
      {id:'stand', vraag:'Wat betekent deze zege voor de stand?', b:'"We kijken van week tot week. Dit is mooi, meer niet."', z:'"We gaan hoog eindigen, dat weet ik zeker."', u:'"Iedereen boven ons mag zich zorgen maken."', doel:'tegenstander'},
      {id:'sfeer', vraag:'Hoe is de sfeer in de kleedkamer na zo\'n overwinning?', b:'"Goed, maar we blijven met beide benen op de grond."', z:'"Geweldig. Dit is een hechte groep."', u:'"Prima, nu sommige ' + team.jongens + ' eindelijk ook hun best doen."', doel:'team'}]
    : verl ? [
      {id:'hoeKan', vraag:`Verloren van ${zij}. Hoe kan dat?`, b:'"Ze waren beter. We moeten kritisch naar onszelf kijken."', z:'"Een slechte dag. Dit gebeurt ons niet nog een keer."', u:'"Sommige ' + team.jongens + ' werkten gewoon niet hard genoeg. Ik noem geen namen."', doel:'team'},
      {id:'scheidsVerlies', vraag:'Waren er momenten waarop het anders had kunnen lopen?', b:'"Dat kan altijd. We moeten onze kansen beter benutten."', z:'"We hadden minstens een punt verdiend."', u:'"Die penalty was nooit. De scheids heeft het verpest."', doel:'scheids'},
      {id:'tactiek', vraag:'Klopte het plan van de trainer vandaag?', b:'"Het plan was goed, wij voerden het slecht uit."', z:'"We moeten dit samen oplossen. Volgende week beter."', u:'"Daar mag je de trainer naar vragen, niet mij."', doel:'trainer'}]
    : [
      {id:'gelijk', vraag:`Een gelijkspel tegen ${zij}. Tevreden?`, b:'"Een punt is beter dan niks. We gaan door."', z:'"Wij hadden moeten winnen, maar we pakken ze de volgende keer."', u:'"De scheidsrechter floot ons uit de wedstrijd."', doel:'scheids'},
      {id:'gelijkKansen', vraag:'Jullie kregen genoeg kansen. Waarom geen winst?', b:'"We moeten scherper zijn voor de goal, ik ook."', z:'"Volgende week gaan ze er wel in."', u:'"Sommigen schieten alsof ze nog nooit een bal gezien hebben."', doel:'team'},
      {id:'gelijkTegen', vraag:`Was ${zij} sterker dan gedacht?`, b:'"Ze speelden goed. Respect voor ze."', z:'"Nee, wij speelden gewoon niet ons beste spel."', u:`"${zij}? Die kwamen alleen om te parkeren voor hun goal."`, doel:'tegenstander'}];
    L.push(...extraHoofdvragen(c >= 8 ? 'top' : c <= 5.5 ? 'slecht' : won ? 'winst' : verl ? 'verlies' : 'gelijk', wij, zij)); // (persvragen.js: meer variatie)
    const recent = S.persRecent = S.persRecent || [], groot = (S.ss.persGroot || 0);
    const kand = L.filter(x => !recent.includes(x.id) && !(x.id === 'grootClubs' && groot)), keuze = pick(kand.length ? kand : L.filter(x => x.id !== 'grootClubs').length ? L.filter(x => x.id !== 'grootClubs') : L);
    if (keuze.id === 'grootClubs') S.ss.persGroot = 1;
    recent.push(keuze.id); if (recent.length > 14) recent.shift();
    v = keuze;
  }
  // Daarna nog een of twee vragen van andere journalisten, over iets anders (bij een derby, je rivaal of een finale twee)
  const vragen = [vraagVan(v)], recent = S.persRecent = S.persRecent || [];
  // Wat er in deze wedstrijd opviel (rode kaart, hattrick, blessure, ruzie met je rivaal) of dat je aanvoerder bent: daar vraagt de pers altijd naar.
  // Een rode kaart is de eerste vraag; de rest komt na de openingsvraag (hooguit 2)
  const sit = situatieVragen(M).filter(x => x.altijd || !recent.includes(x.id)).slice(0, 2);
  for (const x of sit){ if (x.eerst) vragen.unshift(vraagVan(x)); else vragen.push(vraagVan(x)); if (!x.altijd){ recent.push(x.id); if (recent.length > 24) recent.shift(); } }
  let vrg = null; try { if (vriendBijTegenstander(M.opp)) vrg = vriendVraag(M); } catch (e){}
  if (vrg) vragen.push(vraagVan(vrg)); // (speelde je tegen de club van je jeugdvriend, dan vraagt de pers altijd naar hem)
  const extra = vervolgVragen(M).filter(x => x.doel !== v.doel && !recent.includes(x.id) && !sit.some(y => y.doel === x.doel));
  for (let n = (soort === 'finale' || M.derby || M.rivaal ? 2 : 1) - (vrg ? 1 : 0) - sit.length; n > 0 && extra.length; n--){
    const x = extra.splice(Math.floor(rnd() * extra.length), 1)[0]; vragen.push(vraagVan(x));
    recent.push(x.id); if (recent.length > 24) recent.shift();
    for (let i = extra.length - 1; i >= 0; i--) if (extra[i].doel === x.doel) extra.splice(i, 1);
  }
  return {bron, zij, vragen, klaar:false};
}
const vraagVan = v => ({vraag:v.vraag, opts:[{s:'b', l:'Bescheiden', t:v.b}, {s:'z', l:'Zelfverzekerd', t:v.z}, {s:'u', l:'Uitdagend', t:v.u}], doel:v.doel, keuze:null, uit:null});
// Vragen over wat er in deze wedstrijd gebeurde, en over je rol als aanvoerder. eerst: als eerste vraag; altijd: ook als je hem onlangs kreeg
function situatieVragen(M){
  const L = [], won = M.us > M.them, verl = M.us < M.them, aanv = isAanvoerder(), ploeg = team.jongens;
  if (M.rood){
    const tweede = M.roodSoort === 'tweedeGeel';
    L.push(aanv
      ? {id:'sRoodAanv', eerst:true, altijd:true, doel:'team', vraag:`Je bent de aanvoerder, en jij krijgt ${tweede ? 'twee keer geel' : 'een rode kaart'}. Wat voor voorbeeld geef je daarmee aan de groep?`, b:'"Een slecht voorbeeld. Ik heb mijn ploeggenoten in de steek gelaten en dat ga ik in de kleedkamer ook zeggen."', z:'"Ik ga altijd voorop in de duels. Soms gaat dat mis, maar daarom ben ik ook de aanvoerder."', u:'"Ik sta voor deze groep in het vuur. Als de rest net zo hard zou gaan, had ik dat niet hoeven doen."'}
      : {id:'sRood', eerst:true, altijd:true, doel:'scheids', vraag:`Je kreeg ${tweede ? 'een tweede gele kaart' : 'rood'} en liet je ploeg met tien man staan. Wat ging er door je heen?`, b:'"Dom van mij. Sorry aan mijn ploeggenoten en aan de fans. Dit mag niet gebeuren."', z:'"Een harde kaart, maar ik ga altijd vol voor de bal. Zo ben ik nou eenmaal."', u:'"Dat was nooit rood. De scheidsrechter zocht vanaf de eerste minuut een reden."'});
  }
  if (M.goals >= 3) L.push({id:'sHattrick', doel:'ambitie', vraag:`Een hattrick tegen ${CLUBS[M.opp].n}! Neem je de wedstrijdbal mee naar huis?`, b:'"Die bal gaat naar mijn familie. Zonder hen stond ik hier niet."', z:'"Natuurlijk. En ik hoop dat er nog veel ballen bij komen."', u:'"Eén bal? Ik had er vandaag vijf moeten maken."'});
  if (M.blessureVeld) L.push({id:'sBlessure', eerst:!M.rood, doel:'club', vraag:'Je moest geblesseerd van het veld. Hoe gaat het nu?', b:'"Het doet pijn, maar de medische staf zorgt goed voor me. Ik kom sterker terug."', z:'"Ik ben zo terug. Echt, over een paar weken sta ik er weer."', u:'"Als ze die man eerder een kaart hadden gegeven, stond ik er nog. Dit had voorkomen kunnen worden."'});
  if (M.ploegRivaal) L.push({id:'sPloegRivaal', doel:'team', vraag:`Het schuurde zichtbaar tussen jou en ${M.ploegRivaal.naam}. Wat is er aan de hand in de kleedkamer?`, b:'"We zijn het niet altijd eens, maar op het veld spelen we voor hetzelfde shirt. Dat lossen we samen op."', z:'"Concurrentie maakt ons scherp. De trainer kiest wie er speelt, en dat ben ik."', u:`"Vraag het ${team.hem} zelf maar. Ik speel tenminste de bal naar een vrije man."`});
  if (aanv && !M.rood){
    const AANV_VRAGEN = verl ? [
      {id:'sAanvVerlies', doel:'team', vraag:'Als aanvoerder: hoe krijg je de groep na deze nederlaag weer op de rit?', b:'"Ik praat met iedereen apart. Samen staan we hier ook weer uit op."', z:'"Ik ga voorop op de training. De rest volgt vanzelf."', u:`"Sommige ${ploeg} moeten zich eens afvragen of ze dit shirt wel verdienen."`},
      {id:'sAanvKleedkamer', doel:'team', vraag:'Wat heb je na het laatste fluitsignaal in de kleedkamer gezegd?', b:'"Dat blijft binnen. Maar het was eerlijk, en iedereen luisterde."', z:'"Dat we dit volgende week rechtzetten. Punt."', u:'"Ik heb een paar namen genoemd. Die weten zelf wel wie ik bedoel."'}]
    : won ? [
      {id:'sAanvWinst', doel:'team', vraag:"Hoe houd je als aanvoerder de groep scherp na zo'n overwinning?", b:'"Met beide benen op de grond. Ik herinner iedereen eraan hoe hard we ervoor werken."', z:'"Dat is makkelijk: deze groep wil steeds meer. Ik zorg dat het zo blijft."', u:'"Door te zorgen dat niemand denkt dat hij er al is. Ook de sterren niet."'},
      {id:'sAanvJong', doel:'team', vraag:'Je bent de aanvoerder. Wat doe je voor de jonge spelers in de groep?', b:'"Ik neem ze apart, leg dingen uit. Ik weet nog hoe het was toen ik jong was."', z:'"Ik laat ze zien hoe het moet: elke dag als eerste op de training."', u:'"Ze moeten eerst maar eens bewijzen dat ze erbij horen."'}]
    : [
      {id:'sAanvGelijk', doel:'team', vraag:'Wat zeg je als aanvoerder tegen de groep na dit gelijkspel?', b:'"Dat we trots mogen zijn op de inzet, en dat we de kansen beter moeten afmaken."', z:'"Dat dit te weinig is voor een ploeg met onze kwaliteit."', u:'"Dat sommigen zich harder moeten inzetten. Ik pik dit niet langer."'},
      {id:'sAanvBand', doel:'team', vraag:'Hoe is het om de aanvoerdersband van deze club te dragen?', b:'"Een eer. Ik probeer elke dag iets terug te geven aan de groep."', z:'"Het past me. Ik ben een leider, op en naast het veld."', u:'"Iemand moet het doen. Niet iedereen in deze groep durft verantwoordelijkheid te nemen."'}];
    L.push(pick(AANV_VRAGEN));
  }
  return L;
}
// Een vraag over je jeugdvriend, als je tegen zijn club speelde (doel 'vriend': je antwoord raakt jullie band)
function vriendVraag(M){
  const n = vriendNaam(), won = M.us > M.them, verl = M.us < M.them;
  return {id:'vVriend', doel:'vriend', vraag:`Je speelde tegen je jeugdvriend ${n}. ${won ? 'Jij won. Ga je hem vanavond nog bellen?' : verl ? `${n} won vandaag. Hoe voelt dat?` : 'Gelijkspel tussen twee vrienden. Wie had het beste van het duel?'}`,
    b:`"${n} is mijn beste ${won ? 'maat. Ik bel hem straks en dan lachen we erom.' : 'maat. Ik gun het hem, echt waar.'}"`,
    z:won ? '"Vandaag ging hij met de punten naar huis... nee, ik dus. Dat ga ik hem nog lang inwrijven."' : '"Volgende keer is de winst voor mij. Dat weet hij ook."',
    u:won ? `"${n}? Die kon me vandaag niet bijhouden. Zo simpel is het."` : `"${n} heeft geluk gehad. Meer was het niet."`};
}
// Vervolgvragen: over de trainer, de fans, je toekomst en je ploeggenoten
function vervolgVragen(M){
  const sp = S.sp, wij = club().n, L = [];
  if (M.rol !== 'basis') L.push({id:'vBank', doel:'trainer', vraag:'Je begon op de bank. Verdien je meer speeltijd?', b:'"De trainer kiest. Ik moet het gewoon laten zien op de training."', z:'"Ja. Als ik speel, maak ik het verschil. Dat weet de trainer ook."', u:'"Vraag maar aan de trainer waarom ik op de bank zit. Ik snap het niet."'});
  else L.push({id:'vTrainer', doel:'trainer', vraag:'Hoe is je band met de trainer?', b:'"Goed. Ik leer elke dag van de staf."', z:'"De trainer weet wat die aan me heeft. Ik lever elke week."', u:'"We zijn het lang niet altijd eens. Dat mag iedereen weten."'});
  L.push(fans() < 40
    ? {id:'vFansBoos', doel:'fans', vraag:'Er klinkt kritiek vanaf de tribune. Wat zeg je tegen de supporters?', b:'"Ik begrijp ze. Ik ga er alles aan doen om ze weer achter me te krijgen."', z:'"Over een paar weken zingen ze mijn naam weer, let maar op."', u:'"Als ze alleen komen om te fluiten, kunnen ze beter thuisblijven."'}
    : {id:'vFans', doel:'fans', vraag:'De supporters staan achter je. Wat wil je tegen ze zeggen?', b:'"Bedankt. Zij zijn onze twaalfde man, elke week weer."', z:'"Blijf komen. Er gaan hier mooie dingen gebeuren."', u:'"Fijn, maar ik speel voor mezelf. Niet voor de tribune."'});
  if ((sp.contract ?? 9) <= 1) L.push({id:'vContract', doel:'club', vraag:'Je contract loopt af. Blijf je?', b:`"Ik zou graag blijven. Ik voel me thuis bij ${wij}."`, z:'"Mijn zaakwaarnemer praat met de club. We zien wel wat er komt."', u:'"Ik ga voor de beste aanbieding. Zo werkt voetbal nou eenmaal."'});
  L.push({id:'vGroep', doel:'team', vraag:'Hoe staat de groep ervoor?', b:'"Het is een hechte groep. We doen het samen."', z:'"We zijn sterk. En ik wil daarin een leider zijn."', u:`"Sommige ${team.jongens} moeten wakker worden. Meer zeg ik niet."`});
  L.push({id:'vAmbitie', doel:'ambitie', vraag:'Wat is je doel voor de rest van het seizoen?', b:'"Elke week beter worden. De rest volgt vanzelf."', z:'"Zo veel mogelijk scoren en hoog eindigen. Daar ga ik voor."', u:'"Hier alles winnen, en dan door naar een topclub."'});
  L.push(...extraVervolgvragen(wij)); // (persvragen.js)
  return L;
}
// De vragen van een persconferentie (een oude opslag had er maar één, met de vraag in P zelf)
export function persVragen(P){
  if (!P) return [];
  if (!P.vragen) P.vragen = [{vraag:P.vraag, opts:P.opts, doel:P.doel, keuze:P.keuze ?? null, uit:P.uit ?? null}];
  return P.vragen;
}
export const persOpen = P => persVragen(P).findIndex(v => v.keuze == null);
// Een antwoord op vraag q (standaard de eerste open vraag). Latere vragen tellen iets minder zwaar. Geeft de uitkomst als tekst
export function persAntwoord(i, q){
  const sp = S.sp, M = S.M, P = M && M.pers; if (!P) return null;
  const V = persVragen(P); if (q == null) q = persOpen(P);
  const v = V[q]; if (!v || v.keuze != null || !v.opts[i]) return null;
  const o = v.opts[i], so = social(), naam = sp.naam, f = [1, .7, .5][q] ?? .5; v.keuze = i;
  const sc = x => x === 0 ? 0 : Math.sign(x) * Math.max(1, Math.round(Math.abs(x) * f)), pl = x => (x > 0 ? '+' : '−') + Math.abs(x);
  const krant = (kop, tekst) => { if (P.kop) return; P.kop = true; krantMelding(kop, tekst); }; // (één krantenkop per persconferentie)
  toonMeter(o.s === 'b' ? 'kalm' : o.s === 'z' ? 'bal' : 'fel'); // je karakter: rustig of heethoofd
  const citaat = o.t.replace(/^"|"$/g, '');
  if (v.doel === 'rivaalSpeler' && o.s === 'b') zetBand(5);
  if (v.doel === 'vriend'){ try { zetVriendBand(o.s === 'b' ? 5 : o.s === 'z' ? 1 : -8); } catch (e){} }
  let uit;
  if (o.s === 'b'){ const r = sc(1), vt = sc(2), fa = sc(2), mo = sc(1); mod('rep', r); mod('vert', vt); modFans(fa); mod('moraal', mo);
    uit = `Een netjes antwoord. De trainer knikt goedkeurend en de fans waarderen je bescheidenheid. Reputatie ${pl(r)} · vertrouwen ${pl(vt)} · fans ${pl(fa)} · moraal ${pl(mo)}.`; }
  else if (o.s === 'z'){ const n = Math.round((30 + so.volgers * .02) * f), mo = sc(2); so.volgers += n; mod('rep', sc(1)); mod('moraal', mo); sp.grootSpraak = true;
    uit = `Stoere taal! +${volgersTxt(n)} volgers, moraal ${pl(mo)}. Maar let op: speel je volgende week slecht, dan wordt dit tegen je gebruikt. Speel je goed, dan krijg je extra respect.`; }
  else {
    const n = Math.round((60 + so.volgers * .05) * f); so.volgers += n;
    const kop = `${naam}: "${citaat.length > 70 ? citaat.slice(0, 67) + '...' : citaat}"`;
    uit = `Boem. Dit gaat viral: +${volgersTxt(n)} volgers. `;
    if (v.doel === 'vriend'){ uit += `${vriendNaam()} leest het ook. Je telefoon blijft de hele avond stil.`; krant(kop, `Na het duel met jeugdvriend ${vriendNaam()} haalt ${naam} uit.`); }
    else if (v.doel === 'rivaalSpeler'){ zetBand(-10); const R = rivaalObj(); if (R) R.reactie = true; uit += `Je rivaal leest het ook. Hij gaat reageren, dat weet je zeker.`; krant(kop, `Na het duel haalt ${naam} uit naar ${ik.zijn} rivaal ${rivaalNaam()}.`); }
    else if (v.doel === 'rivaal'){ const fa = sc(4); modFans(fa); mod('moraal', sc(1)); S.ss.rivaalFel = true; uit += `De fans smullen ervan (fans ${pl(fa)}), maar bij ${P.zij} zijn ze woedend. De volgende derby wordt extra fel: meer kans op kaarten en opstootjes.`; krant(kop, `Na de derby gooide ${naam} olie op het vuur. Bij ${P.zij} hangen ze het artikel op in de kleedkamer.`); }
    else if (v.doel === 'trainer'){ const vt = sc(-8), mo = sc(-2); onrust(3, 'Gedoe met de trainer'); mod('vert', vt); mod('moraal', mo); statusPunten(-2); uit += `De trainer leest het de volgende ochtend in de krant en is er niet blij mee. Vertrouwen ${pl(vt)} · moraal ${pl(mo)}.`; krant(kop, `${naam} wijst naar de trainer. "Dit lossen we intern op," zegt de club.`); }
    else if (v.doel === 'team'){ const b = sc(-4), vt = sc(-3), mo = sc(-2); iedereen(b); mod('vert', vt); mod('moraal', mo); uit += `Je teamgenoten zijn er niet blij mee. Band met iedereen ${pl(b)} · vertrouwen ${pl(vt)} · moraal ${pl(mo)}.`; krant(kop, `Onrust bij ${club().n}: ${naam} haalt uit naar ${ik.zijn} eigen teamgenoten.`); }
    else if (v.doel === 'club'){ const fa = sc(-10), r = sc(2); modFans(fa); mod('rep', r); uit += `Grote clubs horen het wel, maar de fans van je eigen club zijn beledigd. Fans ${pl(fa)} · reputatie ${pl(r)}.`; krant(kop, `Opvallende woorden van ${naam}. De supporters van ${club().n} reageren boos op social media.`); }
    else if (v.doel === 'fans'){ const fa = sc(-8), mo = sc(1); modFans(fa); mod('moraal', mo); uit += `Op de tribunes valt dit slecht: fans ${pl(fa)}. Al voelt het voor jezelf wel lekker om het te zeggen (moraal ${pl(mo)}).`; krant(kop, `${naam} haalt uit naar ${ik.zijn} eigen supporters.`); }
    else if (v.doel === 'ambitie'){ const fa = sc(-3), r = sc(1), mo = sc(2); modFans(fa); mod('rep', r); mod('moraal', mo); uit += `Grote clubs lezen mee (reputatie ${pl(r)}), maar de eigen fans horen liever iets anders (fans ${pl(fa)}). Moraal ${pl(mo)}.`; krant(kop, `${naam} droomt hardop van een topclub.`); }
    else if (v.doel === 'scheids'){ const boete = Math.max(100, Math.min(25000, Math.round(sp.salaris * .01 / 50) * 50)), fa = sc(2); sp.geld = Math.max(0, sp.geld - boete); modFans(fa); uit += `De bond geeft je een boete van ${geldTxt(boete)}. De fans vinden het wel stoer (fans ${pl(fa)}).`; krant(kop, `${naam} krijgt een boete van ${geldTxt(boete)} voor ${ik.zijn} uitspraken over de scheidsrechter.`); }
    else { const r = sc(-1), fa = sc(2); mod('rep', r); modFans(fa); mod('moraal', sc(1)); uit += `Bij ${P.zij} vinden ze het respectloos. Reputatie ${pl(r)}, maar je eigen fans lachen erom (fans ${pl(fa)}).`; krant(kop, `${naam} steekt na afloop de draak met ${P.zij}.`); }
  }
  v.uit = uit;
  P.klaar = persOpen(P) < 0;
  return uit;
}
export const PERS_ICOON = {b:'🧊', z:'⚖️', u:'🔥'};
export const PERS_HINT = {b:'veilig, kleine plus', z:'volgers en moraal, maar je moet het waarmaken', u:'gaat viral, komt in de krant, heeft gevolgen'};
export function vPers(){
  const M = S.M, P = M && M.pers; if (!P) return '';
  const V = persVragen(P), open = persOpen(P);
  const gedaan = V.filter(v => v.keuze != null).map(v => `<p class="muted">"${esc(v.vraag)}"</p><p><b>Jij:</b> ${esc(v.opts[v.keuze].t)}</p><p class="melding">${esc(v.uit)}</p>`).join('');
  if (open < 0) return `<div class="paneel"><span class="label">Persconferentie · ${esc(P.bron)}</span>${gedaan}</div>`;
  const v = V[open];
  return `<div class="paneel" id="persPanel"><span class="label">Persconferentie · ${esc(P.bron)}${V.length > 1 ? ` · vraag ${open + 1} van ${V.length}` : ''}</span>${gedaan}<p>${open ? 'Een andere verslaggever steekt de hand op' : 'Een verslaggever houdt een microfoon onder je neus'}: <b>"${esc(v.vraag)}"</b></p>
    <div class="keuzes">${v.opts.map((o, i) => keuzeKnop(`${PERS_ICOON[o.s]} ${o.l}`, `${esc(o.t)} · ${PERS_HINT[o.s]}`, () => persAntwoord(i, open), 'data-blijf')).join('')}</div>
    <p class="muted klein-tekst">Je mag ook gewoon doorlopen zonder iets te zeggen.</p></div>`;
}
