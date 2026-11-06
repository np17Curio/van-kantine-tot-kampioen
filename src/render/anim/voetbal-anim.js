// voetbal-anim.js – leest de animatie-JSON en geeft per tijdstip de pose van een personage.
// Geen afhankelijkheden. Werkt in de browser en in Node (ES-module).
//
//   import { laadAnimatie } from './voetbal-anim.js';
//   const anim = await laadAnimatie('../json/contract_tekenen.json');
//   const pose = anim.pose('Speler', 10.5);      // { Hips: {t:[x,y,z], r:[x,y,z,w]}, Spine: {...}, ... }
//   const pen  = anim.object('Prop_Pen', 10.5);  // { t, r, visible?, scale? }
//
// Conventies: Y omhoog, meters, quaternions als [x, y, z, w], botten lokaal t.o.v. hun ouder.

export async function laadAnimatie(bron) {
  if (typeof bron !== 'string') return new VoetbalAnimatie(bron);   // al ingelezen JSON-object
  if (typeof window === 'undefined' && !/^https?:/.test(bron)) {      // Node: bestand van schijf
    const { readFile } = await import('node:fs/promises');
    return new VoetbalAnimatie(JSON.parse(await readFile(bron, 'utf8')));
  }
  const res = await fetch(bron);
  if (!res.ok) throw new Error(`Kan ${bron} niet laden (${res.status})`);
  return new VoetbalAnimatie(await res.json());
}

export class VoetbalAnimatie {
  constructor(data) {
    this.data = data;
    this.fps = data.fps;
    this.frames = data.frames;
    this.duur = data.duration_s;
    this.skelet = data.skeleton;                 // [{ name, parent, t, r }] in volgorde ouder-voor-kind
    this.personages = Object.keys(data.characters);
    this.objecten = Object.keys(data.objects);
    this.events = data.events;
  }

  /** Frame-index i, volgende frame j en mengfactor a voor een tijd in seconden. */
  #frame(tijd, loop) {
    let t = loop ? ((tijd % this.duur) + this.duur) % this.duur : Math.min(Math.max(tijd, 0), this.duur);
    const f = t * this.fps;
    const i = Math.min(Math.floor(f), this.frames - 1);
    return { i, j: Math.min(i + 1, this.frames - 1), a: f - i };
  }

  /** Lokale pose van alle botten van één personage. */
  pose(personage, tijd, { loop = false } = {}) {
    const sporen = this.data.characters[personage];
    if (!sporen) throw new Error(`Onbekend personage: ${personage}. Kies uit: ${this.personages.join(', ')}`);
    const { i, j, a } = this.#frame(tijd, loop);
    const uit = {};
    for (const bot of this.skelet) {
      const s = sporen[bot.name];
      uit[bot.name] = {
        t: s?.t ? lerp3(s.t[i], s.t[j], a) : bot.t,
        r: s?.r ? nlerp(s.r[i], s.r[j], a) : bot.r,
      };
    }
    return uit;
  }

  /** Camera of prop in wereldruimte. Statische props hebben één waarde. */
  object(naam, tijd, { loop = false } = {}) {
    const o = this.data.objects[naam];
    if (!o) throw new Error(`Onbekend object: ${naam}. Kies uit: ${this.objecten.join(', ')}`);
    if (!Array.isArray(o.t[0])) return { t: o.t, r: o.r };
    const { i, j, a } = this.#frame(tijd, loop);
    const uit = { t: lerp3(o.t[i], o.t[j], a), r: nlerp(o.r[i], o.r[j], a) };
    if (o.visible) uit.visible = !!o.visible[a < 0.5 ? i : j];
    if (o.scale) uit.scale = o.scale[i] + (o.scale[j] - o.scale[i]) * a;
    if (o.yfov_graden) uit.yfov_graden = o.yfov_graden;
    return uit;
  }

  /** Wereldrotaties van het skelet in rust (T-pose). */
  wereldRust() {
    if (this._rust) return this._rust;
    const w = {};
    for (const bot of this.skelet) w[bot.name] = bot.parent ? qmul(w[bot.parent], bot.r) : bot.r;
    return (this._rust = w);
  }

  /**
   * Retargeting naar een ANDER skelet (ook met andere botassen), zolang dat ook in T-pose staat:
   *   delta[bot] = wereldRotatie(nu) * inverse(wereldRotatie(T-pose))
   * Toepassen op jouw model:   jouwWereldRot = delta * jouwWereldRotInTPose
   *                             jouwLokaleRot = inverse(jouwOuderWereldRot) * jouwWereldRot
   * heupPositie is geschaald naar jouw heuphoogte (meters) als je die meegeeft.
   */
  retargetDeltas(personage, tijd, { loop = false, heuphoogte = null } = {}) {
    const w = this.wereldPose(personage, tijd, { loop }), rust = this.wereldRust(), delta = {};
    for (const bot of this.skelet) delta[bot.name] = qmul(w[bot.name].r, qinv(rust[bot.name]));
    const s = heuphoogte ? heuphoogte / this.skelet[0].t[1] : 1;
    return { delta, heupPositie: w.Hips.t.map(v => v * s) };
  }

  /** Wereldposities van alle gewrichten (handig voor debuggen of IK-doelen). */
  wereldPose(personage, tijd, opties) {
    const lokaal = this.pose(personage, tijd, opties), wereld = {};
    for (const bot of this.skelet) {
      const l = lokaal[bot.name];
      if (!bot.parent) { wereld[bot.name] = { t: l.t, r: l.r }; continue; }
      const p = wereld[bot.parent];
      wereld[bot.name] = { t: add3(p.t, qrot(p.r, l.t)), r: qmul(p.r, l.r) };
    }
    return wereld;
  }
}

// ---------- kleine wiskunde-helpers ----------
const lerp3 = (p, q, a) => [p[0] + (q[0] - p[0]) * a, p[1] + (q[1] - p[1]) * a, p[2] + (q[2] - p[2]) * a];
const add3 = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
function nlerp(p, q, a) {                       // genormaliseerde lerp, kortste weg (prima bij 30 fps)
  const s = p[0] * q[0] + p[1] * q[1] + p[2] * q[2] + p[3] * q[3] < 0 ? -1 : 1;
  const r = [0, 1, 2, 3].map(k => p[k] + (s * q[k] - p[k]) * a);
  const n = Math.hypot(...r) || 1;
  return r.map(v => v / n);
}
export function qmul(a, b) {
  const [ax, ay, az, aw] = a, [bx, by, bz, bw] = b;
  return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
          aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz];
}
export const qinv = q => [-q[0], -q[1], -q[2], q[3]];   // inverse van een eenheidsquaternion
export function qrot(q, v) {
  const [x, y, z, w] = q;
  const cx = y * v[2] - z * v[1] + w * v[0], cy = z * v[0] - x * v[2] + w * v[1], cz = x * v[1] - y * v[0] + w * v[2];
  return [v[0] + 2 * (y * cz - z * cy), v[1] + 2 * (z * cx - x * cz), v[2] + 2 * (x * cy - y * cx)];
}
