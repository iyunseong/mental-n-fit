# Mental-N-Fit

Next.js와 Supabase를 사용한 완전한 사용자 인증 시스템이 포함된 웹 애플리케이션입니다.

## 🚀 주요 기능

### 인증 시스템
- ✅ **사용자 회원가입** - 이메일/비밀번호로 새 계정 생성
- ✅ **사용자 로그인** - 안전한 로그인 시스템
- ✅ **사용자 로그아웃** - 세션 관리
- ✅ **보호된 라우트** - 인증된 사용자만 접근 가능한 페이지
- ✅ **미들웨어 보안** - 자동 인증 확인 및 리다이렉트
- ✅ **반응형 UI** - 모바일 친화적 인터페이스

### MetaType 16 진단 시스템
- 개인 맞춤형 성격 및 건강 프로필 분석
- 4가지 핵심 축 기반 16가지 타입 분류
- 설문 기반 결과 제공

## 🛠 기술 스택

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend & Database**: Supabase (PostgreSQL, Auth)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📋 설치 및 설정

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/mental-n-fit.git
cd mental-n-fit
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 대시보드에서 **Settings > API**로 이동
3. `Project URL`과 `anon public key` 복사

### 4. 환경 변수 설정

1. `.env.local.example` 파일을 `.env.local`로 복사:
```bash
cp .env.local.example .env.local
```

2. `.env.local` 파일을 열고 Supabase 정보로 업데이트:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 5. 개발 서버 실행
```bash
npm run dev
```

애플리케이션이 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx           # 홈 페이지
│   ├── login/             # 로그인 페이지
│   ├── register/          # 회원가입 페이지
│   ├── dashboard/         # 보호된 대시보드 페이지
│   └── survey/            # MetaType 16 설문 페이지
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # UI 컴포넌트
│   └── survey/           # 설문 관련 컴포넌트
├── lib/                  # 유틸리티 및 설정
│   ├── supabase.ts       # Supabase 클라이언트 설정
│   ├── authTypes.ts      # 인증 관련 타입 정의
│   └── datas/            # MetaType 데이터
└── middleware.ts         # Next.js 미들웨어 (라우트 보호)
```

## 🔐 인증 시스템 사용법

### 회원가입
1. 홈페이지에서 "회원가입" 버튼 클릭
2. 이메일과 비밀번호 입력
3. 이메일 확인 링크 클릭 (Supabase에서 자동 발송)

### 로그인
1. "로그인" 버튼 클릭
2. 등록된 이메일과 비밀번호로 로그인
3. 성공 시 자동으로 대시보드로 이동

### 보호된 라우트
- `/dashboard` - 로그인된 사용자만 접근 가능
- 미들웨어가 자동으로 인증 상태 확인
- 인증되지 않은 사용자는 로그인 페이지로 리다이렉트

## 🧪 MetaType 16 진단

1. "무료 진단 시작" 버튼 클릭
2. 4가지 축 관련 설문 완료:
   - **E/O**: Energetic vs Organic (에너지 타입)
   - **C/I**: Calm vs Intense (스트레스 반응)
   - **B/F**: Balanced vs Focused (장내 미생물)
   - **A/P**: Active vs Peaceful (운동 특성)
3. 개인 맞춤 결과 확인

## 🚀 배포

### Vercel 배포
1. Vercel에 프로젝트 연결
2. 환경 변수를 Vercel 대시보드에 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 배포 완료!

## 📝 주요 코드 구조

### Supabase 클라이언트 (`src/lib/supabase.ts`)
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const auth = {
  signUp: async (email: string, password: string) => { ... },
  signIn: async (email: string, password: string) => { ... },
  signOut: async () => { ... },
  getCurrentUser: async () => { ... }
}
```

### 미들웨어 보호 (`middleware.ts`)
```typescript
export async function middleware(req: NextRequest) {
  // 세션 확인 및 라우트 보호 로직
  // 보호된 라우트: /dashboard
  // 인증 라우트: /login, /register
}
```

## 🤝 기여하기

1. 이 저장소를 포크하세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 🐛 문제 해결

### 환경 변수 오류
- `.env.local` 파일이 올바르게 설정되었는지 확인
- Supabase URL과 키가 정확한지 확인
- 개발 서버를 재시작

### 인증 오류
- Supabase 프로젝트가 활성화되어 있는지 확인
- 이메일 확인이 필요한 경우 받은편지함 확인
- 브라우저 콘솔에서 오류 메시지 확인

### 빌드 오류
- `npm install`로 의존성 재설치
- `npm run build`로 빌드 테스트
- TypeScript 오류가 있는지 확인

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해주세요!
