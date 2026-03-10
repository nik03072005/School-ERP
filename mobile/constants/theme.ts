import { Platform } from 'react-native';

// ─── Brand Palette ────────────────────────────────────────────────────────────
export const Brand = {
  blue: '#69D7F3',
  blueDark: '#35B8DC',
  blueLight: '#EAF9FF',
  yellow: '#DEDF1B',
  yellowDark: '#C6C712',
  yellowLight: '#F7F8A5',
};

// ─── UI Tokens ────────────────────────────────────────────────────────────────
export const Colors = {
  background: '#F8FCFF',
  card: '#FFFFFF',
  border: '#E6EEF3',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  placeholder: '#9CA3AF',
  success: '#16A34A',
  successBg: '#DCFCE7',
  error: '#DC2626',
  errorBg: '#FEE2E2',
  warning: '#EA580C',
  warningBg: '#FFEDD5',
  overlay: 'rgba(0,0,0,0.4)',
  // aliases kept for themed components
  light: {
    text: '#1F2937',
    background: '#F8FCFF',
    tint: '#35B8DC',
    icon: '#6B7280',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#35B8DC',
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',
    tint: '#69D7F3',
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#69D7F3',
  },
};

// ─── Spacing & Shape ──────────────────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
};

// ─── Chart Colors ─────────────────────────────────────────────────────────────
export const ChartColors = {
  students: '#69D7F3',
  attendance: '#DEDF1B',
  fees: '#35B8DC',
  performance: '#F7F8A5',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
