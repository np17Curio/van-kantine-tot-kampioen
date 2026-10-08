/* ===================== Hulpjes ===================== */
export const rnd = () => Math.random();
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export function poisson(l){ const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }
export const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function geldTxt(v){
  const n = Math.round(v);
  if (Math.abs(n) >= 1e6) return '€' + (n / 1e6).toFixed(1).replace('.', ',') + ' mln';
  if (Math.abs(n) >= 1e4) return '€' + Math.round(n / 1e3) + 'k';
  return '€' + n.toLocaleString('nl-NL');
}
export function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
