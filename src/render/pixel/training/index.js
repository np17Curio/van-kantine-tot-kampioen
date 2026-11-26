/* ===================== Trainingsanimaties: welke animatie bij welke activiteit ===================== */
// De animaties staan in veld.js, club.js en prive.js (zie basis.js). id: de activiteit uit game/week.js doeActiviteit;
// bij een training op het veld 'train-afw', 'train-pas', 'train-drib', 'train-verd' of 'train-cond'
import { reserve } from './basis.js';
import { ANIMATIES as VELD } from './veld.js';
import { ANIMATIES as CLUB } from './club.js';
import { ANIMATIES as PRIVE } from './prive.js';
export { TW, TH, T_FPS, T_FRAMES } from './basis.js';
const ALLE = {...VELD, ...CLUB, ...PRIVE};
export const heeftAnimatie = id => !!ALLE[id];
export function maakTraining(id, info){ const maak = ALLE[id] || reserve; return maak({...info, id}); }
