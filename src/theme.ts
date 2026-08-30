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
  bg: '#101418', card: '#1c2128', cardBg: '#242a31', text: '#e8eaed', sub: '#9aa0a6',
  line: '#2a2f36', primary: '#5aa9ff', danger: '#ff6b6b', success: '#66bb6a', textOnPrimary: '#ffffff',
};

export function useTheme(): ThemeColors {
  const mode = useAppStore((s) => s.setting.themeMode);
  return mode === 'dark' ? dark : light;
}
