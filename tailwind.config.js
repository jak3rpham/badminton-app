/** @type {import('tailwindcss').Config} */

// Mọi màu đều đi qua biến CSS (src/index.css) để tự đổi theo chế độ sáng/tối của máy.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

const names = [
  'canvas', 'surface', 'sunken', 'muted', 'muted-hover', 'field', 'scrim',
  'line', 'line-strong',
  'ink', 'ink-2', 'ink-3',
  'accent', 'accent-strong', 'accent-soft', 'accent-line', 'on-accent',
  'danger', 'danger-soft', 'danger-line',
  'warn', 'warn-soft', 'warn-line',
  'info', 'info-strong', 'info-soft',
  'momo', 'momo-strong',
  'chart-2', 'chart-4',
];

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: Object.fromEntries(names.map((n) => [n, token(n)])),
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      // Bóng nhuốm màu nền thay vì đen thuần; trước đây shadow-xs/2xs được dùng nhưng chưa tồn tại.
      boxShadow: {
        '2xs': '0 1px 0 rgb(var(--c-shadow) / 0.04)',
        xs: '0 1px 2px rgb(var(--c-shadow) / 0.06), 0 1px 1px rgb(var(--c-shadow) / 0.03)',
        sm: '0 2px 6px -2px rgb(var(--c-shadow) / 0.10), 0 1px 2px rgb(var(--c-shadow) / 0.05)',
        md: '0 6px 16px -6px rgb(var(--c-shadow) / 0.14)',
        lg: '0 12px 28px -10px rgb(var(--c-shadow) / 0.20)',
        xl: '0 18px 40px -14px rgb(var(--c-shadow) / 0.24)',
        '2xl': '0 24px 60px -20px rgb(var(--c-shadow) / 0.32)',
      },
    },
  },
  plugins: [],
};
