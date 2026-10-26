import { S, club, mod, ovr, salarisVoor, seizoenLabel, waarde } from '../../core/state.js';
import { krantMelding } from '../media/roddel.js';
import { clamp, geldTxt, pick, randInt, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, AANV, CLUBS, DIVS, WINTER } from '../../data/gegevens.js';
import { rolBijClub, statusNiveau, statusPunten } from '../speler/status.js';
import { kandidaatClubs, wissel } from './transfers.js';
import { eersteSeizoen } from './vertrek.js';

/* ===================== Transferbod tijdens het seizoen ===================== */
export function maakBodEvent(){
  const sp = S.sp, eigen = club();
  if (sp.o23 || sp.huur || sp.clubloos) return null;
  if (eigen.t > 3 || (S.ss.bods || 0) >= 2 || (sp.sindsTransfer || 0) < 3 || S.ronde === WINTER - 1 || S.ronde >= AANTAL_RONDES - 1) return null;
  const kand = kandidaatClubs(); if (!kand.length) return null;
  const cl = sp.clausule && sp.clausule.club === sp.club ? sp.clausule : null;
  if (rnd() > (cl ? .25 : .18)) return null;
  const betaalt = cl && rnd() < .5;
  if (eersteSeizoen() && !betaalt) return null; // (je eerste seizoen: alleen als een club je afkoopclausule betaalt)
  S.ss.bods = (S.ss.bods || 0) + 1;
  const id = pick(kand), c = CLUBS[id], oud = eigen.n, lvl = statusNiveau();
  const w = Math.max(waarde(sp), 50000);
  const som = betaalt ? cl.bedrag : Math.round(w * (.85 + rnd() * .6) / 10000) * 10000;
  const bod = {club:id, som, salaris:Math.round(salarisVoor(c.t, ovr(sp), c.s) * (1 + rnd() * .3) / 1000) * 1000, jaren: sp.leeftijd >= 31 ? randInt(1, 2) : randInt(2, 4)};
  // Kans dat je club het bod accepteert: hoger bod = makkelijker, aanvoerder/legende = moeilijker
  const akkoord = betaalt ? 1 : clamp(.4 + (som / w - 1) * 1.2 + (eigen.t - c.t) * .15 - Math.max(0, lvl - 1) * .08, .05, .95);
  const rol = rolBijClub(id);
  return {soort:'transfer', tekst:`${betaalt ? `${c.n} (${DIVS[c.t]}) betaalt je afkoopclausule van ${geldTxt(som)}! ${oud} kan niks doen: als jij wilt, mag je gaan.` : `${c.n} (${DIVS[c.t]}) biedt ${geldTxt(som)} voor jou.`} Jij zou daar ${geldTxt(bod.salaris)} per jaar verdienen, met een contract van ${bod.jaren} jaar. Daar ben je eerst ${rol.status.toLowerCase()}: ${rol.plek[0].toLowerCase()}. Wat wil je?`, opts:[
    {l:`Ik wil naar ${c.n}`, f(){
      if (betaalt) return `De afkoopclausule is betaald. ${oud} moet je laten gaan. ` + wissel(bod, 'gekocht');
      if (rnd() < akkoord) return `${oud} gaat akkoord met het bod. ` + wissel(bod, 'gekocht');
      S.volgEv = {soort:'transfer', tekst:`${oud} wijst het bod af: "${lvl >= AANV ? 'Onze aanvoerder is niet te koop.' : 'Dat is veel te weinig.'}" Maar jij wil eigenlijk naar ${c.n}. Wat doe je?`, opts:[
        {l:'Accepteren en blijven', f(){ mod('vert', 2); statusPunten(-2); return 'Je slikt het en gaat gewoon door.'; }},
        {l:'De transfer forceren', f(){
          if (rnd() < .5){ mod('rep', -3); return `Je komt een week niet op de training. Uiteindelijk geeft ${oud} toe. De fans van ${oud} zijn woedend. ` + wissel(bod, 'geforceerd'); }
          mod('vert', -25); statusPunten(-25); mod('moraal', -10);
          return `${oud} geeft niet toe. Je zit op de tribune en de fans fluiten je uit.`; }}]};
      return `${oud} wijst het bod van ${c.n} af.`;
    }},
    {l:`Nee, ik blijf bij ${oud}`, f(){ statusPunten(5); mod('vert', 5); mod('moraal', 3); return `Je kiest voor ${oud}. De fans hangen een spandoek op: "${sp.naam} is van ons!"`; }},
    {l:'Het bod gebruiken om meer salaris te vragen', f(){
      if (rnd() < .45 + lvl * .07){
        // De club wil je houden: jij kiest of je een langer contract tekent (de jaren staan erbij)
        const nu = Math.max(sp.contract, 0), nieuw = Math.round(Math.max(sp.salaris * 1.25, bod.salaris * .9) / 1000) * 1000, klein = Math.round(sp.salaris * 1.1 / 1000) * 1000;
        const N = sp.leeftijd >= 31 ? nu + 1 : Math.max(nu + 1, 3);
        S.volgEv = {soort:'transfer', tekst:`${oud} wil je niet kwijt en biedt een nieuw contract: ${geldTxt(nieuw)} per jaar voor ${N} jaar (tot ${S.jaar + N}). Je huidige contract loopt nog ${nu} ${nu === 1 ? 'jaar' : 'jaar'}. Wat doe je?`, opts:[
          {l:`Tekenen: ${N} jaar voor ${geldTxt(nieuw)} per jaar`, f(){ sp.salaris = nieuw; sp.contract = N; S.ss.contractRond = true; S.car.hist.push(`${seizoenLabel()}: nieuw contract bij ${oud} tot ${S.jaar + N} (${geldTxt(nieuw)} per jaar)`);
            if (club().t <= 3) krantMelding(`${sp.naam} verlengt bij ${oud} tot ${S.jaar + N}`, `Na de interesse van ${c.n} houdt ${oud} hem graag binnen.`);
            return `Je tekent bij! Je contract loopt nu nog ${N} jaar (tot ${S.jaar + N}), voor ${geldTxt(nieuw)} per jaar.`; }},
          {l:`Alleen meer salaris, mijn contract blijft ${nu} jaar`, f(){ sp.salaris = Math.max(sp.salaris, klein); return `Je salaris gaat omhoog naar ${geldTxt(sp.salaris)} per jaar. Je contract loopt gewoon nog ${nu} jaar.`; }},
          {l:'Laat maar, alles blijft zoals het is', f(){ return 'Je bedankt de club. Je salaris en je contract blijven zoals ze zijn.'; }}]};
        return `${oud} wil je niet kwijt.`;
      }
      mod('vert', -6); statusPunten(-4); return `${oud} vindt het hebberig. Je salaris blijft gelijk en de trainer kijkt je anders aan.`; }}
  ]};
}
