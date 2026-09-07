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
  bg: '#0f0f0f', card: '#1a1a1a', cardBg: '#222222', text: '#ffffff', sub: '#c7c7c7',
  line: '#333333', primary: '#6fb1ff', danger: '#ff6b6b', success: '#66bb6a', textOnPrimary: '#ffffff',
};

export function useTheme(): ThemeColors {
  const mode = useAppStore((s) => s.setting.themeMode);
  return mode === 'dark' ? dark : light;
}