import { cosmeticTheme } from './cosmetic';
import { oilTheme } from './oil';
import { ShopTheme } from './types';

export * from './types';

export const themes: Record<string, ShopTheme> = {
  cosmetic: cosmeticTheme,
  oil: oilTheme,
  // add a 3rd theme file here, register it, done.
};

// The one line each deployment needs to change: process.env.SHOP_THEME
export function getActiveTheme(): ShopTheme {
  const id = process.env.NEXT_PUBLIC_SHOP_THEME || process.env.SHOP_THEME || 'cosmetic';
  const theme = themes[id];
  if (!theme) throw new Error(`Unknown theme id: ${id}`);
  return theme;
}
