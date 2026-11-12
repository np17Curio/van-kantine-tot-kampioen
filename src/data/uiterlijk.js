/* ===================== Uiterlijk van de spelers ===================== */
// Los van three.js, zodat het startscherm en de getekende krantenfoto ze kunnen gebruiken zonder de 3D-bibliotheek te laden
export const HUID = ['#f2d1b3', '#e5b893', '#c99366', '#a46a43', '#7b4a2c', '#5a3420'];
export const HAAR = ['#1a1410', '#3b2516', '#6b4527', '#c9a15a', '#9a4a22', '#9b9b9b'];
export const HAAR_NAAM = ['Zwart', 'Donkerbruin', 'Bruin', 'Blond', 'Rood', 'Grijs'];
export const SCHOENEN = ['#111111', '#f2f2f2', '#d8ff3a', '#ff5a2a', '#2f6bff', '#ff4fa3', '#d4af37']; // (roze en goud: van de schoenenmerken)
// Gezichtshaar (alleen jongens, vanaf 18): 'geen' of een van deze; undefined = de baard groeit nog niet
export const BAARD_KEUZE = [['geen', 'Geen'], ['stoppels', 'Stoppels'], ['snor', 'Snor'], ['sikje', 'Sikje'], ['baard', 'Volle baard']];
export const SCHOEN_NAAM = ['Zwart', 'Wit', 'Geel', 'Oranje', 'Blauw', 'Roze', 'Goud'];
// 'model' staat er twee keer in: het haar van het 3D-model zelf komt bij de andere spelers vaker voor
export const KAPSELS = ['model', 'model', 'kort', 'kuif', 'krul', 'staart', 'lang', 'kaal', 'afro', 'kroes', 'cornrows', 'vlechten',
  'stekels', 'hanenkam', 'fade', 'millimeter', 'scheiding', 'midden', 'knot', 'surfer', 'bob', 'dreads'];
// Kapsels voor kroeshaar (de andere spelers met een donkere huid krijgen ze vaker)
export const KROES_KAPSELS = ['afro', 'kroes', 'cornrows', 'vlechten', 'dreads', 'millimeter', 'fade'];
// Wat je zelf kunt kiezen bij het aanmaken van je speler
export const KAPSEL_KEUZE = [['model', 'Halflang'], ['kort', 'Kort'], ['kuif', 'Kuif'], ['krul', 'Krullen'], ['staart', 'Staartje'], ['lang', 'Lang'], ['kaal', 'Kaal'], ['afro', 'Afro'], ['kroes', 'Kort kroeshaar'], ['cornrows', 'Cornrows'], ['vlechten', 'Lange vlechten'],
  ['stekels', 'Stekels'], ['hanenkam', 'Hanenkam'], ['fade', 'Fade'], ['millimeter', 'Millimeter'], ['scheiding', 'Zijscheiding'], ['midden', 'Middenscheiding'], ['knot', 'Knotje'],
  ['surfer', 'Surferhaar'], ['dreads', 'Dreadlocks'], ['bob', 'Bob'], ['vlecht', 'Eén vlecht'], ['knotjes', 'Twee knotjes']];
// (een meisje: meestal lang haar, een staart of vlechten)
export const KAPSELS_V = ['staart', 'staart', 'lang', 'lang', 'vlechten', 'model', 'krul', 'kort', 'afro', 'cornrows', 'bob', 'vlecht', 'knotjes', 'knot', 'surfer', 'fade', 'midden'];
export const willekeurigUiterlijk = vrouw => ({huid:Math.floor(Math.random() * HUID.length), haar:Math.floor(Math.random() * HAAR.length), kapsel:vrouw ? KAPSELS_V[Math.floor(Math.random() * KAPSELS_V.length)] : KAPSEL_KEUZE[Math.floor(Math.random() * KAPSEL_KEUZE.length)][0], schoen:Math.floor(Math.random() * SCHOENEN.length)});
