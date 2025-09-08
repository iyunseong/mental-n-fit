// src/app/providers.tsx
'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

export default function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"           // <html class="dark"> 제어
      defaultTheme="light"        // 기본 라이트
      forcedTheme="light"         // 시스템/사용자 설정과 무관하게 라이트 강제
      enableSystem={false}
      disableTransitionOnChange   // 전환 깜빡임 최소화
    >
      {children}
    </ThemeProvider>
  );
}
