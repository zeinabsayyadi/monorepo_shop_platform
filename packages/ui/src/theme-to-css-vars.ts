import { ShopTheme } from "@shop/theme-configs";

export function themeToCssVars(theme: ShopTheme): Record<string, string> {
  return {
    "--primary": theme.colors.primary,
    "--secondary": theme.colors.secondary,
    "--accent": theme.colors.accent,
    "--background": theme.colors.background,
    "--foreground": theme.colors.foreground,
    "--radius-sm": theme.radius.sm,
    "--radius-md": theme.radius.md,
    "--radius-lg": theme.radius.lg,
    "--font-heading": theme.font.heading,
    "--font-body": theme.font.body,
  };
}
