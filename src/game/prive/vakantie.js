import { S, mod, seizoenLabel } from '../../core/state.js';
import { clamp } from '../../core/utils.js';
import { thuisLand } from '../../data/landen.js';
import { roddel } from '../media/roddel.js';
import { band } from '../team/kleedkamer.js';
import { focusBoost } from '../wedstrijd/momenten.js';
import { verhoog } from '../week.js';

/* ===================== Vakantie in de zomerstop ===================== */
export function vakantieOpties(){
  const sp = S.sp, h = sp.herkomst || {}, land = [h.vader, h.moeder, h.geboren].find(l => l && l !== thuisLand());
  const met = sp.relatie ? ` met ${sp.relatie.naam}${(sp.kinderen || []).length ? ' en de kinderen' : ''}` : (sp.kinderen || []).length ? ' met de kinderen' : sp.leeftijd < 18 ? ' met je ouders' : ' met vrienden';
  const band = n => { if (sp.relatie) sp.relatie.band = clamp(sp.relatie.band + n, 0, 100); };
  const l = [
    {l:'Thuisblijven en uitrusten', prijs:0, d:'fitheid +3 · focus omhoog', f(){ mod('fit', 3); focusBoost(4); return 'Je blijft lekker thuis. Uitslapen, barbecueën en niks moeten.'; }},
    {l:`Kamperen in Frankrijk${met}`, prijs:500, d:'moraal +6', f(){ mod('moraal', 6); band(5); return 'Een tent, een meer en elke ochtend verse croissants. Heerlijk simpel.'; }},
    {l:'Feestvakantie op Ibiza', prijs:1500, d:'moraal +12, maar focus −10 en fitheid −10', f(){ mod('moraal', 12); mod('focus', -10); mod('fit', -10); band(-8); roddel(`${sp.naam} gaat los op Ibiza`, 'Foto\'s van het strandfeest gaan rond. De club hoopt dat hij fit terugkomt.'); return 'Twee weken feesten. Fantastisch, maar je komt gesloopt terug.'; }},
    {l:'Trainingskamp in de bergen', prijs:3000, d:'conditie +2 · fitheid +5', f(){ verhoog('cond', 2); mod('fit', 5); mod('moraal', 2); return 'Lopen op hoogte, vroeg naar bed. Je komt fitter terug dan ooit. Conditie +2.'; }},
    {l:`Luxe resort op de Malediven${met}`, prijs:20000, d:'moraal +10 · focus omhoog', f(){ mod('moraal', 10); focusBoost(10); band(12); roddel(`${sp.naam} geniet op de Malediven`, 'Wit zand, blauwe zee en een privévilla op het water.'); return 'Een villa op het water, snorkelen tussen de schildpadden. Je bent helemaal opgeladen.'; }}
  ];
  if (land) l.splice(2, 0, {l:`Familie bezoeken in ${land}`, prijs:800, d:`moraal +8 · de bondscoach van ${land} hoort ervan`, f(){ mod('moraal', 8); sp.bonds = sp.bonds || {}; sp.bonds[land] = clamp((sp.bonds[land] ?? 40) + 5, 0, 100); return `Je bezoekt je familie in ${land}. Iedereen wil een foto met je, en de bondscoach van ${land} hoort ervan.`; }});
  return l;
}
export function kiesVakantie(i){ const sp = S.sp, E = S.eind; if (!E || E.vakantie) return; const o = vakantieOpties()[i]; if (!o || sp.geld < o.prijs) return; sp.geld -= o.prijs; E.vakantie = o.f(); S.car.hist.push(`${seizoenLabel()}: vakantie · ${o.l.replace(/ met .*/, '').toLowerCase()}`); }
