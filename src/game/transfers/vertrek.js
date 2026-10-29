import { S, club, mod, tmp } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { clamp, esc, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, AANV, WINTER } from '../../data/gegevens.js';
import { krantMelding } from '../media/roddel.js';
import { onrust } from '../speler/kalmte.js';
import { statusNiveau, statusPunten } from '../speler/status.js';
import { iedereen } from '../team/kleedkamer.js';
import { modFans } from '../wedstrijd/fans-pers.js';
import { kans } from '../wedstrijd/momenten.js';
import { ik } from '../../core/geslacht.js';

/* ===================== Vertrekverzoek midden in het seizoen ===================== */
// Na 2 wedstrijden bij je club mag je zeggen dat je weg wilt. Gaat de club akkoord, dan sta je op de transferlijst
// en vertrek je bij de eerstvolgende transferperiode (winterstop of zomer)
export const VERTREK_NA = 2;
// Je eerste seizoen bij een nieuwe club: de club laat je nog niet gaan (geen biedingen, geen vertrekverzoek).
// Wel: een club die je afkoopclausule betaalt, verhuur, en weggestuurd worden. Na een huurperiode telt je club als bekend terrein
export const eersteSeizoen = () => { const sp = S.sp; return !!sp && !sp.clubloos && !sp.huur && !sp.huurTerug && (sp.clubSz || 0) < 1; };
export function vertrekKans(){
  const sp = S.sp, n = statusNiveau();
  return clamp([.85, .75, .55, .35, .2, .1][n] + (sp.contract <= 1 ? .15 : 0) + (sp.vert < 30 ? .15 : 0) - (sp.contract >= 3 ? .1 : 0), .05, .95);
}
export const kanVertrekVragen = () => { const sp = S.sp; return !sp.huur && !sp.o23 && !eersteSeizoen() && (sp.clubWed || 0) >= VERTREK_NA && !sp.transferlijst && (S.ss.vertrekWacht ?? -99) <= S.ronde; };
export const tijdTotVenster = () => S.ronde < WINTER ? `de winterstop (nog ${WINTER - S.ronde} ${WINTER - S.ronde === 1 ? 'week' : 'weken'})` : `de zomer (nog ${AANTAL_RONDES - S.ronde} ${AANTAL_RONDES - S.ronde === 1 ? 'week' : 'weken'})`;
export function vraagVertrek(){
  const sp = S.sp, w = S.week, c = club(); if (!kanVertrekVragen() || !w) return;
  if (rnd() < vertrekKans()){
    sp.transferlijst = true; sp.transferWens = true; mod('vert', -5); statusPunten(-3); modFans(-5);
    w.tekst.push(`Je loopt het kantoor van de technisch directeur binnen: "Ik wil weg." Hij zucht, maar gaat akkoord. Je staat op de transferlijst. Bij ${tijdTotVenster()} mag je vertrekken. Tot die tijd speel je gewoon voor ${c.n}.`);
    if (c.t <= 3) krantMelding(`${sp.naam} op de transferlijst bij ${c.n}`, `De ${ik.speler} heeft aangegeven dat ${ik.hij} wil vertrekken. De club werkt mee. Clubs kunnen zich melden bij ${tijdTotVenster().replace(/ \(.*/, '')}.`);
    return;
  }
  S.ss.vertrekWacht = S.ronde + 3;
  S.ev = {soort:'transfer', tekst:`"Weg? Geen sprake van," zegt de technisch directeur. "Je hebt een contract${sp.contract > 0 ? ` van nog ${sp.contract} jaar` : ''} en we rekenen op je." Wat doe je?`, opts:[
    {l:'Het accepteren en je best blijven doen', f(){ mod('vert', 2); mod('moraal', -3); return 'Je slikt het. Over een paar weken kun je het eventueel nog een keer vragen.'; }},
    {l:'Blijven aandringen', f(){
      if (rnd() < .4){ sp.transferlijst = true; sp.transferWens = true; sp.vertrekRuzie = true; mod('vert', -12); statusPunten(-6); modFans(-10); onrust(5, 'Gedoe over je vertrek');
        if (c.t <= 3) krantMelding(`${sp.naam} dwingt vertrek af bij ${c.n}`, `Na dagen van onrust geeft de club toe: de speler mag vertrekken.`);
        return `Je blijft zeuren, elke dag weer. Uiteindelijk geeft de club toe: bij ${tijdTotVenster()} mag je weg. Maar de sfeer is verpest.`; }
      mod('vert', -20); statusPunten(-10); modFans(-12); onrust(10, 'Ruzie over je vertrek'); iedereen(-3);
      if (c.t <= 3) krantMelding(`Ruzie tussen ${sp.naam} en ${c.n}`, `De speler wil weg, maar de club houdt voet bij stuk. Supporters reageren woedend.`);
      return 'De club geeft niet toe. De trainer zet je voorlopig uit de basis en de fans fluiten je uit. Dit wordt een lastige periode.'; }}]};
  S.fase = 'event';
}
/* ===================== Zelf vragen om een huurperiode ===================== */
// Wil je speeltijd (of een seizoen in het buitenland)? Vraag de club of je verhuurd mag worden. Gaat de club akkoord,
// dan krijg je bij de eerstvolgende transferperiode huurclubs aangeboden (vanaf je 18e altijd ook een uit het buitenland)
export function huurKans(){ const sp = S.sp; return sp.o23 ? .95 : [.85, .7, .3, .1, .05, .02][statusNiveau()] ?? .02; }
export const kanHuurVragen = () => { const sp = S.sp; return !sp.huur && !sp.huurWens && !sp.transferlijst && !sp.clubloos && (sp.o23 || (sp.clubWed || 0) >= VERTREK_NA) && (S.ss.huurWacht ?? -99) <= S.ronde; };
export function vraagHuur(){
  const sp = S.sp, w = S.week, c = club(); if (!kanHuurVragen() || !w) return;
  if (rnd() < huurKans()){
    sp.huurWens = true;
    w.tekst.push(`Je vraagt de technisch directeur of je verhuurd mag worden. Hij knikt: "Goed idee. Bij ${tijdTotVenster()} zoeken we een club waar je elke week speelt."${sp.leeftijd >= 18 ? ' Misschien zelfs in het buitenland.' : ''}`);
    return;
  }
  S.ss.huurWacht = S.ronde + 3; mod('moraal', -3);
  w.tekst.push(`"Verhuren? Nee," zegt de technisch directeur. "${statusNiveau() >= 2 ? 'We hebben je hier nodig.' : 'We rekenen op je bij ' + c.n + '.'}" Over een paar weken kun je het nog een keer vragen.`);
}
export function trekHuurIn(){ const sp = S.sp; if (!sp.huurWens) return; sp.huurWens = false; S.week.tekst.push(`Je trekt je huurverzoek in. Je blijft bij ${club().n} en vecht voor je plek.`); }
export function vHuur(){
  const sp = S.sp; if (sp.huur || sp.clubloos || sp.transferlijst) return '';
  if (sp.huurWens) return `<div class="paneel"><span class="label">Huurkandidaat</span><p>De club werkt mee aan een huurperiode. Bij ${esc(tijdTotVenster())} krijg je huurclubs aangeboden${sp.leeftijd >= 18 ? ', ook een uit het buitenland' : ''}.</p><div class="rij">${knop('Verzoek intrekken, ik blijf', trekHuurIn, 'klein', 'data-blijf')}</div></div>`;
  const nog = VERTREK_NA - (sp.clubWed || 0), wacht = (S.ss.huurWacht ?? -99) - S.ronde, kans = huurKans(), lab = kans >= .6 ? ['waarschijnlijk wel', 'r-veilig'] : kans >= .3 ? ['misschien', 'r-gem'] : ['waarschijnlijk niet', 'r-riskant'];
  return `<section id="huurPanel" class="paneel sectie"><h3 class="sectiekop">Op huur?</h3>
    <p class="muted klein-tekst" style="margin-top:8px">Speel je te weinig, of wil je een seizoen ervaring opdoen${sp.leeftijd >= 18 ? ' (ook in het buitenland)' : ''}? Vraag de club of je verhuurd mag worden. Je blijft speler van ${esc(club().n)} en gaat in de zomer terug.</p>
    ${!sp.o23 && nog > 0 ? `<p class="muted">Speel eerst nog ${nog} ${nog === 1 ? 'wedstrijd' : 'wedstrijden'} voor ${esc(club().n)}.</p>` : wacht > 0 ? `<p class="muted">De club zei net nee. Over ${wacht} ${wacht === 1 ? 'week' : 'weken'} kun je het opnieuw vragen.</p>`
      : `<p>Gaat de club akkoord? <span class="risico ${lab[1]}" style="white-space:nowrap">${lab[0]}</span> <span class="muted klein-tekst">${statusNiveau() >= 2 && !sp.o23 ? 'Een speler uit de basis laten ze niet graag gaan.' : ''}</span></p><div class="rij">${knop('Vragen om een huurperiode', vraagHuur, 'klein')}</div>`}</section>`;
}
export function trekVertrekIn(){ const sp = S.sp; if (!sp.transferlijst) return; sp.transferlijst = false; sp.transferWens = false; mod('vert', 3); modFans(3); S.week.tekst.push(`Je trekt je vertrekverzoek in. "Ik blijf bij ${club().n}." De trainer en de fans zijn er blij mee.`); }
export function vVertrek(){
  const sp = S.sp; if (sp.huur || sp.o23) return '';
  if (sp.transferlijst) return `<div class="paneel"><span class="label">Op de transferlijst</span><p>Je hebt gezegd dat je weg wilt en de club werkt mee. Bij ${esc(tijdTotVenster())} kunnen clubs een bod op je doen.</p><div class="rij">${knop('Verzoek intrekken, ik blijf', trekVertrekIn, 'klein', 'data-blijf')}</div></div>`;
  if (eersteSeizoen()) return `<section id="vertrekPanel" class="paneel sectie"><h3 class="sectiekop">Wil je weg bij ${esc(club().n)}?</h3><p class="muted" style="margin-top:8px">In je eerste seizoen bij ${esc(club().n)} laat de club je nog niet gaan. Vanaf de zomer kun je vragen om te vertrekken.</p></section>`;
  const nog = VERTREK_NA - (sp.clubWed || 0), wacht = (S.ss.vertrekWacht ?? -99) - S.ronde, kans = vertrekKans(), lab = kans >= .6 ? ['waarschijnlijk wel', 'r-veilig'] : kans >= .3 ? ['misschien', 'r-gem'] : ['waarschijnlijk niet', 'r-riskant'];
  return `<section id="vertrekPanel" class="paneel sectie"><h3 class="sectiekop">Wil je weg bij ${esc(club().n)}?</h3>
    <p class="muted klein-tekst" style="margin-top:8px">Je kunt de club vragen of je mag vertrekken. Gaan ze akkoord, dan kom je op de transferlijst en ga je bij de eerstvolgende transferperiode (winterstop of zomer) naar een nieuwe club. Pas op: het kost je vertrouwen bij de trainer en de fans vinden het niet leuk.</p>
    ${nog > 0 ? `<p class="muted">Speel eerst nog ${nog} ${nog === 1 ? 'wedstrijd' : 'wedstrijden'} voor ${esc(club().n)}.</p>` : wacht > 0 ? `<p class="muted">De club zei net nee. Over ${wacht} ${wacht === 1 ? 'week' : 'weken'} kun je het opnieuw vragen.</p>`
      : `<p>Gaat de club akkoord? <span class="risico ${lab[1]}" style="white-space:nowrap">${lab[0]}</span> <span class="muted klein-tekst">${statusNiveau() >= AANV ? 'Een belangrijke speler laten ze niet graag gaan.' : sp.contract <= 1 ? 'Je contract loopt bijna af, dat helpt.' : ''}</span></p><div class="rij">${knop('Zeggen dat je weg wilt', vraagVertrek, 'klein', 'data-bevestig="Je vraagt de club of je mag vertrekken. Dat kost je vertrouwen bij de trainer, en de fans vinden het niet leuk." data-ja="Ja, ik wil weg"')}</div>`}</section>`;
}
