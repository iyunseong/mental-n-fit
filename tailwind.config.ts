// tailwind.config.ts
import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate' // shadcn/ui 쓰면 애니메이션 플러그인 권장

const config: Config = {
  darkMode: 'class', // next-themes와 궁합
  content: [
    './src/app/**/*.{ts,tsx,js,jsx,mdx}',
    './src/pages/**/*.{ts,tsx,js,jsx,mdx}',
    './src/components/**/*.{ts,tsx,js,jsx,mdx}',
    './src/**/*.{ts,tsx,js,jsx,mdx}',
  ],
  theme: { extend: {} },
  plugins: [animate],
}
export default config
