import { S } from '../../core/state.js';

/* ===================== Carrièrestatistieken ===================== */
export function carCijfer(c){ S.car.cs = (S.car.cs || 0) + c; S.car.cn = (S.car.cn || 0) + 1; if (c >= 8.5) S.car.motm = (S.car.motm || 0) + 1; }
