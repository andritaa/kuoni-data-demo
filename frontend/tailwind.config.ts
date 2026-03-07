import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kuoni: {
          teal:   '#1B4F6B',
          gold:   '#C9A96E',
          light:  '#F8F6F3',
          dark:   '#1A1A1A',
          tealDark:  '#13384E',
          tealLight: '#2A6A8F',
          goldLight: '#DFC08A',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
