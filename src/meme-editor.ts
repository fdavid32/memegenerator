export type TextLayer = {
  id: string;
  name: string;
  text: string;
  x: number;
  y: number;
};

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `layer_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const TEMPLATES = [
  'assets/cointreau-p.jpg',
  'assets/cointreau.png',
  'assets/image.png',
  'assets/Instinct Beef Pet Food.jpg',
  'assets/Instinct Logo.png',
  'assets/Instinct Pet Food.jpg',
  'assets/Instinct-primary-logo-RGB_060525_NEBRASKA_BLUE_NEBRASKA_BLUE.png',
  'assets/IPF_CAT_RAWBOOST_KIBBLE_GRAIN_FREE_14-5x8_061225_GF_FRONT_IPF_BAG_TALL-45339.png',
  'assets/Nike Shoe.jpg',
  'assets/Nike.png',
  'assets/Nike1.png',
  'assets/product-cooler.png',
  'assets/Spalding Logo.png',
  'assets/Spalding.jpg',
  'assets/yeti 1.png',
];
