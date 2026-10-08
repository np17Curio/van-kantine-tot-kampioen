import { S, club, mod, seizoenLabel } from '../../core/state.js';
import { clamp, geldTxt, rnd } from '../../core/utils.js';
import { JEUGD } from '../../data/gegevens.js';
import { KRANTEN } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { uitgaanBronnen } from '../media/uitgaan-krant.js';
import { isProf } from '../prive/sponsors.js';
import { kalmte, onrust } from '../speler/kalmte.js';
import { statusPunten } from '../speler/status.js';
import { ck } from '../transfers/buitenland.js';
import { modFans } from '../wedstrijd/fans-pers.js';

/* ===================== De trainer en je gedrag buiten het veld ===================== */
// Uitgaan, feesten en gokken ergeren de trainer. Eerst een gesprek, dan een laatste waarschuwing, en daarna wordt je contract ontbonden
export const tucht = () => { const sp = S.sp; if (!sp.tucht || sp.tucht.club !== ck(sp.club)) sp.tucht = {club:ck(sp.club), p:0, fase:0}; return sp.tucht; };
export function ergernis(n){ const t = tucht(); t.p = clamp(t.p + n, 0, 120); }
export const TUCHT_LABEL = ['De trainer heeft geen klachten', 'De trainer heeft je al eens aangesproken', 'Laatste waarschuwing van de trainer!'];
export function tuchtWeek(eerste){
  if (eerste) return;
  const sp = S.sp, t = tucht(), w = S.week;
  if (sp.verl && sp.verl.meter >= 70) t.p += 4;
  t.p = Math.max(0, t.p - 3);
  if (sp.imago > 0){ sp.imago--; if (!sp.imago) w.tekst.push('Je slechte naam is langzaam verdwenen. Clubs kijken weer gewoon naar je voetbal.'); }
  if (t.p < 10 && t.fase > 0 && rnd() < .15){ t.fase--; w.tekst.push('De trainer ziet dat je je netjes gedraagt. "Zo wil ik het zien," zegt hij.'); }
  if (S.wachtEv) return;
  if (t.fase === 0 && t.p >= 35){ t.fase = 1; S.wachtEv = trainerGesprek(); }
  else if (t.fase === 1 && t.p >= 65){ t.fase = 2; S.wachtEv = laatsteWaarschuwing(); }
  else if (t.fase === 2 && t.p >= 90) S.wachtEv = ontbinding();
}
export function trainerGesprek(){
  const sp = S.sp, v = sp.verl || {meter:0};
  const opts = [
    {l:'Sorry zeggen en beloven dat het niet meer gebeurt', f(){ tucht().p -= 15; mod('vert', -2); return '"Goed. Ik hou je in de gaten," zegt de trainer. Je hebt nog een kans.'; }},
    {l:'"Wat ik in mijn vrije tijd doe, is mijn zaak"', f(){ ergernis(10); mod('vert', -10); statusPunten(-3); onrust(8, 'Ruzie met de trainer'); return 'De trainer wordt rood. "Zolang je bij deze club speelt, is het ook mijn zaak!" Hij smijt de deur dicht. Jullie verhouding is flink bekoeld.'; }}];
  if (v.meter >= 30 || kalmte() < 50) opts.push({l:'Eerlijk vertellen dat het niet goed met je gaat', f(){ tucht().p -= 12; mod('vert', 2); return 'De trainer luistert. "Ik ben blij dat je het zegt. Zoek hulp, wij staan achter je." Je voelt je opgelucht.'; }});
  return {soort:'prive', tekst:`De trainer roept je bij zich op kantoor. "Ik hoor verhalen. Stappen, feesten${v.keer ? ', gokken' : ''}... Je bent prof${isProf() ? '' : ' (of je wilt het worden)'}. Dit moet stoppen."`, opts};
}
export function laatsteWaarschuwing(){
  const sp = S.sp, boete = Math.max(100, Math.round(sp.salaris * .1 / 100) * 100);
  return {soort:'prive', tekst:`Het is weer raak. De trainer en de technisch directeur zitten samen tegenover je. "Dit is je laatste waarschuwing. Nog één keer en we ontbinden je contract." Je krijgt een boete van ${geldTxt(boete)}.`, opts:[
    {l:'De boete accepteren en je leven beteren', f(){ sp.geld = Math.max(0, sp.geld - boete); mod('vert', -12); tucht().p -= 10; S.car.hist.push(`${seizoenLabel()}: laatste waarschuwing van ${club().n}`); if (club().t <= 3) krantMelding(`Laatste waarschuwing voor ${sp.naam}`, `${club().n} is klaar met het gedrag van de speler buiten het veld. "Nog één misstap en hij kan vertrekken."`, uitgaanBronnen()); return 'Je betaalt de boete. Vanaf nu moet je echt oppassen.'; }},
    {l:'Boos weglopen', f(){ sp.geld = Math.max(0, sp.geld - boete); mod('vert', -20); statusPunten(-6); ergernis(10); onrust(10, 'Ruzie met de trainer'); S.car.hist.push(`${seizoenLabel()}: laatste waarschuwing van ${club().n}`); if (club().t <= 3) krantMelding(`Ruzie tussen ${sp.naam} en ${club().n}`, `De speler liep woedend weg uit een gesprek met de clubleiding. Zijn toekomst bij de club is onzeker.`, uitgaanBronnen()); return 'Je smijt de deur achter je dicht. De boete moet je toch betalen. Bij de club zijn ze klaar met je.'; }}]};
}
export function ontbinding(){
  const sp = S.sp, oud = club();
  // Bij huur of in de jeugd kan de club je niet zomaar wegsturen: dan een zware straf
  if (sp.huur || oud.t === JEUGD || sp.o23) return {soort:'prive', tekst:'De club is woedend over je gedrag. Je wordt voor straf een paar weken uit de selectie gezet.', opts:[{l:'Balen...', f(){ sp.geschorst = (sp.geschorst || 0) + 2; mod('vert', -15); tucht().p = 50; return 'Twee wedstrijden op de tribune. Je hebt het aan jezelf te danken.'; }}]};
  return {soort:'prive', tekst:`Het is genoeg geweest. ${oud.n} ontbindt je contract, met directe ingang. "Zijn gedrag buiten het veld past niet bij onze club." Je moet je kluisje leegruimen.`, opts:[
    {l:'Je spullen pakken', f(){
      S.car.hist.push(`${seizoenLabel()}: contract ontbonden door ${oud.n} wegens gedrag buiten het veld`);
      krantMelding(`${oud.n} zet ${sp.naam} op straat`, `Na een laatste waarschuwing is de maat vol: het contract van ${sp.naam} is ontbonden. Clubs zullen wel twee keer nadenken voordat ze hem halen.`, KRANTEN[Math.min(oud.t, 3)]);
      sp.ontbonden = true; sp.imago = 40; sp.contract = 0; sp.salaris = Math.round(sp.salaris * .1); mod('moraal', -15); mod('rep', -12); modFans(-25);
      S.naVenster = true;
      return `Je loopt voor het laatst door de spelersingang van ${oud.n}. Je zaakwaarnemer belt rond, maar veel clubs willen je niet meer hebben.`; }}]};
}
