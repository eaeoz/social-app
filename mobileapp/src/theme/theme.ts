import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { lightColors, darkColors } from './colors';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.primary,
    primaryContainer: lightColors.primaryLight,
    secondary: lightColors.secondary,
    background: lightColors.background,
    surface: lightColors.surface,
    surfaceVariant: lightColors.surfaceVariant,
    error: lightColors.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: lightColors.text,
    onSurface: lightColors.text,
    outline: lightColors.border,
    custom: lightColors,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    primaryContainer: darkColors.primaryDark,
    secondary: darkColors.secondary,
    background: darkColors.background,
    surface: darkColors.surface,
    surfaceVariant: darkColors.surfaceVariant,
    error: darkColors.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onBackground: darkColors.text,
    onSurface: darkColors.text,
    outline: darkColors.border,
    custom: darkColors,
  },
};

export type AppTheme = typeof lightTheme;
