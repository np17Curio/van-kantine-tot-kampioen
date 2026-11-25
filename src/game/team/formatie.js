import { clubTactiek } from './tactiek.js';
import { ck } from '../transfers/buitenland.js';

/* ===================== Formaties: welke plekken een club heeft ===================== */
// Elke club speelt in een vaste formatie die past bij zijn speelstijl (tactiek.js). Een formatie bepaalt welke plekken er zijn:
// in een 4-4-2 is er geen aanvallende middenvelder (CAM), in een 4-2-3-1 wel. Per linie van links naar rechts (zo staan ze ook
// op het opstellingsscherm), K = keeper, V = verdediging, M = middenveld, A = aanval.
export const CLUB_FORMATIES = {
  '4-4-2':    {V:['LB', 'CB', 'CB', 'RB'], M:['LM', 'CM', 'CM', 'RM'], A:['ST', 'ST']},
  '4-3-3':    {V:['LB', 'CB', 'CB', 'RB'], M:['CM', 'CDM', 'CM'], A:['LW', 'ST', 'RW']},
  '4-2-3-1':  {V:['LB', 'CB', 'CB', 'RB'], M:['LM', 'CDM', 'CAM', 'CDM', 'RM'], A:['ST']},
  '4-1-2-1-2':{V:['LB', 'CB', 'CB', 'RB'], M:['CM', 'CDM', 'CAM', 'CM'], A:['ST', 'ST']},
  '5-3-2':    {V:['LB', 'CB', 'CB', 'CB', 'RB'], M:['CM', 'CDM', 'CM'], A:['ST', 'ST']},
  '4-5-1':    {V:['LB', 'CB', 'CB', 'RB'], M:['LM', 'CM', 'CDM', 'CM', 'RM'], A:['ST']},
};
// Welke formaties bij welke speelstijl horen (een club kiest er vast een uit)
const PER_TACTIEK = {tikitaka:['4-3-3', '4-1-2-1-2', '4-2-3-1'], lang:['4-4-2'], vleugels:['4-4-2', '4-3-3'], bus:['5-3-2', '4-5-1'], counter:['4-2-3-1', '4-4-2', '4-1-2-1-2']};
export const LIJN_VAN = {SPITS:'A', MID:'M', VERD:'V', KEEPER:'K'};

export function clubFormatie(id){
  if (id == null) return '4-4-2';
  const lijst = PER_TACTIEK[clubTactiek(id)] || ['4-4-2'], key = String(ck(id)) + '|formatie';
  let h = 2166136261; for (let i = 0; i < key.length; i++){ h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return lijst[(h >>> 0) % lijst.length];
}
export const formatieVan = id => CLUB_FORMATIES[clubFormatie(id)];
// Hoeveel spelers per linie (met de keeper)
export const linieTelling = id => { const f = formatieVan(id); return {K:1, V:f.V.length, M:f.M.length, A:f.A.length}; };
// De plekken die deze club heeft voor jouw positie (zonder dubbele)
export const plekkenBijClub = (id, pos) => { const l = LIJN_VAN[pos]; return l === 'K' ? ['GK'] : [...new Set(formatieVan(id)[l])]; };
