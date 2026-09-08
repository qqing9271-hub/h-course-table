import { useAppStore } from './store/appStore';

export interface ThemeColors {
  bg: string; card: string; cardBg: string; text: string; sub: string; line: string;
  primary: string; danger: string; success: string; textOnPrimary: string;
}

export const light: ThemeColors = {
  bg: '#f5f5f5', card: '#ffffff', cardBg: '#fafafa', text: '#333333', sub: '#666666',
  line: '#dddddd', primary: '#4a90e2', danger: '#c00', success: '#2e7d32', textOnPrimary: '#ffffff',
};

export const dark: ThemeColors = {
  bg: '#0a0a0a', card: '#161616', cardBg: '#1e1e1e', text: '#ffffff', sub: '#d9d9d9',
  line: '#3a3a3a', primary: '#7fb8ff', danger: '#ff6b6b', success: '#6fce7e', textOnPrimary: '#ffffff',
};

export function useTheme(): ThemeColors {
  const mode = useAppStore((s) => s.setting.themeMode);
  return mode === 'dark' ? dark : light;
}