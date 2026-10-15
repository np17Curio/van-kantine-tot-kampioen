import { S, club, mod, ovr, salarisVoor, waarde } from '../../core/state.js';
import { clamp, geldTxt, pick, randInt, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, AANV, CLUBS, DIVS } from '../../data/gegevens.js';
import { rolBijClub, statusNiveau, statusPunten } from '../speler/status.js';
import { kandidaatClubs, wissel } from './transfers.js';

/* ===================== Transferbod tijdens het seizoen ===================== */
export function maakBodEvent(){
  const sp = S.sp, eigen = club();
  if (sp.o23 || sp.huur) return null;
  if (eigen.t > 3 || (S.ss.bods || 0) >= 2 || (sp.sindsTransfer || 0) < 3 || S.ronde === 6 || S.ronde >= AANTAL_RONDES - 1) return null;
  const kand = kandidaatClubs(); if (!kand.length) return null;
  const cl = sp.clausule && sp.clausule.club === sp.club ? sp.clausule : null;
  if (rnd() > (cl ? .25 : .18)) return null;
  S.ss.bods = (S.ss.bods || 0) + 1;
  const id = pick(kand), c = CLUBS[id], oud = eigen.n, lvl = statusNiveau();
  const w = Math.max(waarde(sp), 50000);
  const betaalt = cl && rnd() < .5;
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
    {l:'Het bod gebruiken voor meer salaris', f(){
      if (rnd() < .45 + lvl * .07){ sp.salaris = Math.round(Math.max(sp.salaris * 1.25, bod.salaris * .9) / 1000) * 1000; sp.contract = Math.max(sp.contract, 3); return `${oud} wil je niet kwijt en geeft je een nieuw contract: ${geldTxt(sp.salaris)} per jaar.`; }
      mod('vert', -6); statusPunten(-4); return `${oud} vindt het hebberig. Je salaris blijft gelijk en de trainer kijkt je anders aan.`; }}
  ]};
}
