import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    bg: {
      primary: string;
      secondary: string;
      tertiary: string;
      accent: string;
    };
    text: {
      primary: string;
      secondary: string;
      accent: string;
    };
    gradient: {
      primary: string;
      success: string;
      warning: string;
      danger: string;
    };
  }
} 