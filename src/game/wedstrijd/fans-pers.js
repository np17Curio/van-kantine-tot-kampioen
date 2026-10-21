import { S, club, mod, tmp } from '../../core/state.js';
import { keuzeKnop } from '../../core/ui.js';
import { clamp, esc, geldTxt, pick, rnd } from '../../core/utils.js';
import { CLUBS, divClubs } from '../../data/gegevens.js';
import { KRANTEN } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { social, volgersTxt } from '../prive/social.js';
import { onrust } from '../speler/kalmte.js';
import { fmt1 } from '../speler/o23.js';
import { statusPunten } from '../speler/status.js';
import { iedereen } from '../team/kleedkamer.js';
import { ck } from '../transfers/buitenland.js';
import { focusBoost } from './momenten.js';
import { balk } from '../../render/views/zijbalk.js';
import { pers } from '../speler/persoonlijkheid.js';
import { rivaal as rivaalObj, rivaalNaam, zetBand } from '../speler/rivaal.js';
import { toonMeter } from '../speler/journey.js';

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
    if (M.cijfer >= 7.5){ modFans(4); mod('rep', 2); M.grootTekst = 'Je maakte je grote woorden waar. Respect van de fans!'; krantMelding(`${naam} maakt zijn woorden waar`, `Vorige week had hij een grote mond, nu liet hij het zien: een ${fmt1(M.cijfer)} tegen ${zij}.`); }
    else if (M.cijfer <= 6){ modFans(-4); mod('rep', -2); M.grootTekst = 'Na je grote woorden in de pers viel je tegen. De krant smult ervan.'; krantMelding(`Grote woorden, weinig daden van ${naam}`, `Vorige week was hij nog zo zeker van zichzelf. Tegen ${zij} kreeg hij een ${fmt1(M.cijfer)}.`); }
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
      {id:'sfeer', vraag:'Hoe is de sfeer in de kleedkamer na zo\'n overwinning?', b:'"Goed, maar we blijven met beide benen op de grond."', z:'"Geweldig. Dit is een hechte groep."', u:'"Prima, nu sommige jongens eindelijk ook hun best doen."', doel:'team'}]
    : verl ? [
      {id:'hoeKan', vraag:`Verloren van ${zij}. Hoe kan dat?`, b:'"Ze waren beter. We moeten kritisch naar onszelf kijken."', z:'"Een slechte dag. Dit gebeurt ons niet nog een keer."', u:'"Sommige jongens werkten gewoon niet hard genoeg. Ik noem geen namen."', doel:'team'},
      {id:'scheidsVerlies', vraag:'Waren er momenten waarop het anders had kunnen lopen?', b:'"Dat kan altijd. We moeten onze kansen beter benutten."', z:'"We hadden minstens een punt verdiend."', u:'"Die penalty was nooit. De scheids heeft het verpest."', doel:'scheids'},
      {id:'tactiek', vraag:'Klopte het plan van de trainer vandaag?', b:'"Het plan was goed, wij voerden het slecht uit."', z:'"We moeten dit samen oplossen. Volgende week beter."', u:'"Daar mag je de trainer naar vragen, niet mij."', doel:'trainer'}]
    : [
      {id:'gelijk', vraag:`Een gelijkspel tegen ${zij}. Tevreden?`, b:'"Een punt is beter dan niks. We gaan door."', z:'"Wij hadden moeten winnen, maar we pakken ze de volgende keer."', u:'"De scheidsrechter floot ons uit de wedstrijd."', doel:'scheids'},
      {id:'gelijkKansen', vraag:'Jullie kregen genoeg kansen. Waarom geen winst?', b:'"We moeten scherper zijn voor de goal, ik ook."', z:'"Volgende week gaan ze er wel in."', u:'"Sommigen schieten alsof ze nog nooit een bal gezien hebben."', doel:'team'},
      {id:'gelijkTegen', vraag:`Was ${zij} sterker dan gedacht?`, b:'"Ze speelden goed. Respect voor ze."', z:'"Nee, wij speelden gewoon niet ons beste spel."', u:`"${zij}? Die kwamen alleen om te parkeren voor hun goal."`, doel:'tegenstander'}];
    const recent = S.persRecent = S.persRecent || [], groot = (S.ss.persGroot || 0);
    const kand = L.filter(x => !recent.includes(x.id) && !(x.id === 'grootClubs' && groot)), keuze = pick(kand.length ? kand : L.filter(x => x.id !== 'grootClubs').length ? L.filter(x => x.id !== 'grootClubs') : L);
    if (keuze.id === 'grootClubs') S.ss.persGroot = 1;
    recent.push(keuze.id); if (recent.length > 6) recent.shift();
    v = keuze;
  }
  return {bron, vraag:v.vraag, opts:[{s:'b', l:'Bescheiden', t:v.b}, {s:'z', l:'Zelfverzekerd', t:v.z}, {s:'u', l:'Uitdagend', t:v.u}], doel:v.doel, zij, klaar:false};
}
export function persAntwoord(i){
  const sp = S.sp, M = S.M, P = M && M.pers; if (!P || P.klaar) return;
  const o = P.opts[i], so = social(), naam = sp.naam; P.klaar = true; P.keuze = i;
  toonMeter(o.s === 'b' ? 'kalm' : o.s === 'z' ? 'bal' : 'fel'); // je karakter: rustig of heethoofd
  const citaat = o.t.replace(/^"|"$/g, '');
  if (P.doel === 'rivaalSpeler' && o.s === 'b') zetBand(5);
  if (o.s === 'b'){ mod('rep', 1); mod('vert', 2); modFans(2); P.uit = 'Een netjes antwoord. De trainer knikt goedkeurend en de fans waarderen je bescheidenheid. Reputatie +1 · vertrouwen +2 · fans +2.'; }
  else if (o.s === 'z'){ const n = Math.round(30 + so.volgers * .02); so.volgers += n; mod('rep', 1); sp.grootSpraak = true;
    P.uit = `Stoere taal! +${volgersTxt(n)} volgers. Maar let op: speel je volgende week slecht, dan wordt dit tegen je gebruikt. Speel je goed, dan krijg je extra respect.`; }
  else {
    const n = Math.round(60 + so.volgers * .05); so.volgers += n;
    const kop = `${naam}: "${citaat.length > 70 ? citaat.slice(0, 67) + '...' : citaat}"`;
    let uit = `Boem. Dit gaat viral: +${volgersTxt(n)} volgers. `;
    if (P.doel === 'rivaalSpeler'){ zetBand(-10); const R = rivaalObj(); if (R) R.reactie = true; uit += `Je rivaal leest het ook. Hij gaat reageren, dat weet je zeker.`; krantMelding(kop, `Na het duel haalt ${naam} uit naar zijn rivaal ${rivaalNaam()}.`); }
    else if (P.doel === 'rivaal'){ modFans(4); S.ss.rivaalFel = true; uit += `De fans smullen ervan (fans +4), maar bij ${P.zij} zijn ze woedend. De volgende derby wordt extra fel: meer kans op kaarten en opstootjes.`; krantMelding(kop, `Na de derby gooide ${naam} olie op het vuur. Bij ${P.zij} hangen ze het artikel op in de kleedkamer.`); }
    else if (P.doel === 'trainer'){ onrust(3, 'Gedoe met de trainer'); mod('vert', -8); statusPunten(-2); uit += 'De trainer leest het de volgende ochtend in de krant. Hij is er niet blij mee. Vertrouwen −8.'; krantMelding(kop, `${naam} wijst na een slechte wedstrijd naar de trainer. "Dit lossen we intern op," zegt de club.`); }
    else if (P.doel === 'team'){ iedereen(-4); mod('vert', -3); uit += 'Je teamgenoten zijn er niet blij mee. Band met iedereen −4, vertrouwen −3.'; krantMelding(kop, `Onrust bij ${club().n}: ${naam} haalt uit naar zijn eigen teamgenoten.`); }
    else if (P.doel === 'club'){ modFans(-10); mod('rep', 2); uit += 'Grote clubs horen het wel, maar de fans van je eigen club zijn beledigd. Fans −10, reputatie +2.'; krantMelding(kop, `Opvallende woorden van ${naam}. De supporters van ${club().n} reageren boos op social media.`); }
    else if (P.doel === 'scheids'){ const boete = Math.max(100, Math.min(25000, Math.round(sp.salaris * .01 / 50) * 50)); sp.geld = Math.max(0, sp.geld - boete); modFans(2); uit += `De bond geeft je een boete van ${geldTxt(boete)}. De fans vinden het wel stoer (fans +2).`; krantMelding(kop, `${naam} krijgt een boete van ${geldTxt(boete)} voor zijn uitspraken over de scheidsrechter.`); }
    else { mod('rep', -1); modFans(2); uit += `Bij ${P.zij} vinden ze het respectloos. Reputatie −1, maar je eigen fans lachen erom (fans +2).`; krantMelding(kop, `${naam} steekt na afloop de draak met ${P.zij}.`); }
    P.uit = uit;
  }
}
export function vPers(){
  const M = S.M, P = M && M.pers; if (!P) return '';
  if (P.klaar) return `<div class="paneel"><span class="label">Persconferentie · ${esc(P.bron)}</span><p class="muted">"${esc(P.vraag)}"</p><p><b>Jij:</b> ${esc(P.opts[P.keuze].t)}</p><p class="melding">${esc(P.uit)}</p></div>`;
  return `<div class="paneel" id="persPanel"><span class="label">Persconferentie · ${esc(P.bron)}</span><p>Een verslaggever houdt een microfoon onder je neus: <b>"${esc(P.vraag)}"</b></p>
    <div class="keuzes">${P.opts.map((o, i) => keuzeKnop(`${o.s === 'b' ? '🧊' : o.s === 'z' ? '⚖️' : '🔥'} ${o.l}`, `${esc(o.t)} · ${o.s === 'b' ? 'veilig, kleine plus' : o.s === 'z' ? 'volgers, maar je moet het waarmaken' : 'gaat viral, komt in de krant, heeft gevolgen'}`, () => persAntwoord(i), 'data-blijf')).join('')}</div>
    <p class="muted klein-tekst">Je mag ook gewoon doorlopen zonder iets te zeggen.</p></div>`;
}
