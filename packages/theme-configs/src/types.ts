export interface ShopTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  font: {
    heading: string; // Google Font name, loaded via next/font
    body: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  supportsDarkMode: boolean;
}
