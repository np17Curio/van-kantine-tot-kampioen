import { S } from './state.js';

/* ===================== Jongen of meisje ===================== */
// De speler (sp.vrouw), je jeugdvriend(in) (sp.vriend.vrouw) en je partner (sp.valtOp: 'v' = een vriendin, 'm' = een vriend).
// Gebruik in teksten: `${ik.Hij} scoort` → "Hij scoort" of "Zij scoort". Alleen voor de bezittelijke "zijn" (niet het werkwoord!)
const M = {hij:'hij', Hij:'Hij', ze:'hij', Ze:'Hij', zijn:'zijn', Zijn:'Zijn', hem:'hem', Hem:'Hem', jongen:'jongen', Jongen:'Jongen', jongens:'jongens', Jongens:'Jongens',
  zoon:'zoon', vader:'vader', Vader:'Vader', man:'man', broer:'broer', speler:'speler', Speler:'Speler', spelers:'spelers', vriend:'vriend', Vriend:'Vriend', knul:'knul',
  kerel:'kerel', meneer:'meneer', koning:'koning', prins:'prins', held:'held', mannen:'mannen', heren:'heren', jeugdvriend:'jeugdvriend', Jeugdvriend:'Jeugdvriend', vriendje:'vriendje', vriendinnen:'vrienden', zus:'broer', Jongen:'Jongen'};
const V = {hij:'zij', Hij:'Zij', ze:'ze', Ze:'Ze', zijn:'haar', Zijn:'Haar', hem:'haar', Hem:'Haar', jongen:'meid', Jongen:'Meid', jongens:'meiden', Jongens:'Meiden',
  zoon:'dochter', vader:'moeder', Vader:'Moeder', man:'vrouw', broer:'zus', speler:'speelster', Speler:'Speelster', spelers:'speelsters', vriend:'vriendin', Vriend:'Vriendin', knul:'meid',
  kerel:'meid', meneer:'mevrouw', koning:'koningin', prins:'prinses', held:'heldin', mannen:'vrouwen', heren:'dames', jeugdvriend:'jeugdvriendin', Jeugdvriend:'Jeugdvriendin', vriendje:'vriendinnetje', vriendinnen:'vriendinnen', zus:'zus', Jongen:'Meid'};
// Een object met getters: ik.hij, ik.zijn, … (afhankelijk van wie het is, op het moment dat de tekst wordt gemaakt)
function woorden(isV){ const o = {}; for (const k in M) Object.defineProperty(o, k, {get:() => (isV() ? V : M)[k], enumerable:true}); return o; }
export const isVrouw = () => !!(S && S.sp && S.sp.vrouw);
// De wereld waarin je speelt: het mannen- of het vrouwenvoetbal (ook als trainer of clubeigenaar)
export const vrouwenWereld = () => !!(S && S.wereld === 'v');
export const ik = woorden(isVrouw);
// Je ploeggenoten, tegenstanders en de rivaal: dezelfde wereld als jij
export const team = woorden(vrouwenWereld);
export const vriendVrouw = () => !!(S && S.sp && S.sp.vriend && S.sp.vriend.vrouw);
export const vr = woorden(vriendVrouw);
// De partner van je jeugdvriend(in): van het andere geslacht dan je vriend(in)
export const vp = woorden(() => !vriendVrouw());
// Je partner: standaard (en in oude opslag) een vriendin
export const partnerVrouw = () => !(S && S.sp && S.sp.valtOp === 'm');
export const pa = woorden(partnerVrouw);
// Voor iemand anders (een kind: k.jongen)
export const voor = vrouw => vrouw ? V : M;
