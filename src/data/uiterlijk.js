/* ===================== Uiterlijk van de spelers ===================== */
// Los van three.js, zodat het startscherm en de getekende krantenfoto ze kunnen gebruiken zonder de 3D-bibliotheek te laden
export const HUID = ['#f2d1b3', '#e5b893', '#c99366', '#a46a43', '#7b4a2c', '#5a3420'];
export const HAAR = ['#1a1410', '#3b2516', '#6b4527', '#c9a15a', '#9a4a22', '#9b9b9b'];
export const HAAR_NAAM = ['Zwart', 'Donkerbruin', 'Bruin', 'Blond', 'Rood', 'Grijs'];
export const SCHOENEN = ['#111111', '#f2f2f2', '#d8ff3a', '#ff5a2a', '#2f6bff', '#ff4fa3', '#d4af37']; // (roze en goud: van de schoenenmerken)
// 'model' staat er twee keer in: het haar van het 3D-model zelf komt bij de andere spelers vaker voor
export const KAPSELS = ['model', 'model', 'kort', 'kuif', 'krul', 'staart', 'lang', 'kaal', 'afro', 'kroes', 'cornrows', 'vlechten'];
// Kapsels voor kroeshaar (de andere spelers met een donkere huid krijgen ze vaker)
export const KROES_KAPSELS = ['afro', 'kroes', 'cornrows', 'vlechten'];
// Wat je zelf kunt kiezen bij het aanmaken van je speler
export const KAPSEL_KEUZE = [['model', 'Halflang'], ['kort', 'Kort'], ['kuif', 'Kuif'], ['krul', 'Krullen'], ['staart', 'Staartje'], ['lang', 'Lang'], ['kaal', 'Kaal'], ['afro', 'Afro'], ['kroes', 'Kort kroeshaar'], ['cornrows', 'Cornrows'], ['vlechten', 'Lange vlechten']];
export const willekeurigUiterlijk = () => ({huid:Math.floor(Math.random() * HUID.length), haar:Math.floor(Math.random() * HAAR.length), kapsel:KAPSEL_KEUZE[Math.floor(Math.random() * KAPSEL_KEUZE.length)][0]});
