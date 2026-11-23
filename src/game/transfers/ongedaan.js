import { S, setS, tmp } from '../../core/state.js';
import { herstel } from '../../core/migratie.js';
import { herstelSeizoenDelen } from '../seizoen/seizoen.js';

/* ===================== Een transfer ongedaan maken ===================== */
// Vlak vóór elke transfer (wissel in transfers.js) bewaart het spel een kopie van je hele spel, in een eigen plek in de opslag
// (per carrière-slot). Tot je je volgende wedstrijd speelt, kun je terug naar dat moment: alsof de transfer nooit gebeurde.
const sleutel = () => 'vtk_ongedaan_' + ((S && S.slot) || 1);
export function bewaarVoorTransfer(label){
  try { localStorage.setItem(sleutel(), JSON.stringify({label, jaar:S.jaar, wed:(S.car && S.car.wed) || 0, data:JSON.stringify(S)})); } catch (e){}
}
// Kan het nog? Zolang je sinds de transfer nog geen wedstrijd speelde
export function ongedaanInfo(){
  try {
    const x = JSON.parse(localStorage.getItem(sleutel()) || 'null');
    // (na een zomertransfer begint meteen het nieuwe seizoen, dus het jaar telt één verder: daarom alleen kijken of je al speelde)
    if (!x || !S || !S.car || S.jaar - x.jaar > 1 || x.wed !== (S.car.wed || 0)) return null;
    return x;
  } catch (e){ return null; }
}
export function maakOngedaan(){
  const x = ongedaanInfo(); if (!x) return;
  const slot = S.slot, st = herstel(JSON.parse(x.data)); st.slot = slot;
  setS(st); herstelSeizoenDelen();
  try { localStorage.removeItem(sleutel()); } catch (e){}
  tmp.ondertekening = null; // (geen contract-animatie meer)
  if (S.venster) S.venster.melding = `↶ Ongedaan gemaakt: ${x.label}. Je kunt opnieuw kiezen.`;
}
export function vOngedaan(){
  const x = ongedaanInfo(); if (!x) return null;
  return {label:x.label};
}
