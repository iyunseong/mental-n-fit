# Mental-N-Fit

**개인 맞춤형 건강 관리 플랫폼** - MetaType 16 진단과 종합적인 건강 데이터 추적을 통해 개인화된 건강 관리를 제공하는 Next.js 기반 웹 애플리케이션입니다.

## 🚀 주요 기능

### 🔐 인증 시스템
- ✅ **사용자 회원가입/로그인** - 이메일/비밀번호 기반 안전한 인증
- ✅ **보호된 라우트** - 인증된 사용자만 접근 가능한 대시보드
- ✅ **미들웨어 보안** - 자동 인증 확인 및 리다이렉트
- ✅ **반응형 UI** - 모바일 친화적 인터페이스

### 🧬 MetaType 16 진단 시스템
- **16가지 개인 맞춤형 건강 프로필** - 4가지 핵심 축 기반 분석
- **상세한 진단 결과** - 운동, 식단, 정신건강 맞춤 전략 제공
- **설문 기반 진단** - E/O(에너지), C/I(스트레스), B/F(장내미생물), A/P(운동) 축

### 📊 종합 건강 대시보드
- **체성분 관리** - 인바디 측정값 추적 및 트렌드 분석
- **운동 로그** - 근력/유산소 운동 기록 및 볼륨 분석
- **식사 관리** - 영양소 분석 및 식사 패턴 추적
- **일일 컨디션** - 수면, 기분, 에너지, 스트레스 수준 기록
- **건강 캘린더** - 일별 건강 상태 시각화
- **빠른 추가** - 최근 프리셋을 활용한 원클릭 기록

### 📈 데이터 분석 및 인사이트
- **트렌드 차트** - 체성분, 운동 볼륨, 식사 패턴 변화 추이
- **KPI 헤더** - 핵심 건강 지표 요약
- **일일 요약** - 선택한 날짜의 종합 건강 상태

## 🛠 기술 스택

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend & Database**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: Tailwind CSS 4, Tailwind Animate
- **UI Components**: Radix UI, Lucide React
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Data Fetching**: SWR
- **Testing**: Playwright

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
├── app/                           # Next.js App Router 페이지
│   ├── page.tsx                  # 홈 페이지 (랜딩)
│   ├── login/                    # 로그인 페이지
│   ├── register/                 # 회원가입 페이지
│   ├── dashboard/                # 보호된 대시보드 페이지
│   ├── survey/                   # MetaType 16 설문 페이지
│   ├── api/                      # API 라우트
│   │   └── meals/               # 식사 관련 API
│   ├── globals.css              # 전역 스타일
│   ├── layout.tsx               # 루트 레이아웃
│   └── providers.tsx            # 전역 프로바이더
├── components/                   # 재사용 가능한 컴포넌트
│   ├── ui/                      # 기본 UI 컴포넌트
│   │   ├── Button.tsx           # 버튼 컴포넌트
│   │   ├── Card.tsx             # 카드 컴포넌트
│   │   ├── Container.tsx        # 컨테이너 컴포넌트
│   │   └── dialog.tsx           # 다이얼로그 컴포넌트
│   ├── forms/                   # 폼 컴포넌트
│   │   ├── InbodyForm.tsx       # 인바디 측정 폼
│   │   ├── WorkoutLogForm.tsx   # 운동 기록 폼
│   │   ├── MealLogForm.tsx      # 식사 기록 폼
│   │   ├── DailyConditionForm.tsx # 일일 컨디션 폼
│   │   └── _FormShell.tsx       # 폼 공통 셸
│   ├── dashboard/               # 대시보드 컴포넌트
│   │   ├── KPIHeader.tsx        # KPI 헤더
│   │   ├── HealthCalendar.tsx   # 건강 캘린더
│   │   ├── DailyLogView.tsx     # 일일 로그 뷰
│   │   ├── DailySummarySidebar.tsx # 일일 요약 사이드바
│   │   ├── InbodyTrendChart.tsx # 인바디 트렌드 차트
│   │   ├── VolumeTrendChart.tsx # 운동 볼륨 차트
│   │   ├── MealTrendChart.tsx   # 식사 트렌드 차트
│   │   ├── QuickAddRail.tsx     # 빠른 추가 레일
│   │   └── NudgeRow.tsx         # 알림 행
│   ├── internal/                # 내부 컴포넌트
│   │   ├── InbodyFormInner.tsx  # 인바디 폼 내부
│   │   └── WorkoutLogFormInner.tsx # 운동 폼 내부
│   └── NavBar.tsx               # 네비게이션 바
├── lib/                         # 유틸리티 및 설정
│   ├── supabase/                # Supabase 관련
│   │   └── server.ts            # 서버 사이드 클라이언트
│   ├── date/                    # 날짜 유틸리티
│   ├── food/                    # 음식 검색 유틸리티
│   ├── ui/                      # UI 유틸리티
│   ├── supabase.ts              # Supabase 클라이언트 설정
│   ├── authTypes.ts             # 인증 관련 타입 정의
│   ├── utils.ts                 # 공통 유틸리티
│   └── datas/                   # MetaType 데이터
│       ├── Metatype.json        # 통합된 메타타입 데이터
│       └── *.json               # 개별 메타타입 파일들
├── actions/                     # 서버 액션
│   ├── body.ts                  # 체성분 관련 액션
│   ├── conditions.ts            # 컨디션 관련 액션
│   ├── meals.ts                 # 식사 관련 액션
│   ├── workouts.ts              # 운동 관련 액션
│   └── common/                  # 공통 액션
├── types/                       # 타입 정의
│   ├── meal.ts                  # 식사 관련 타입
│   ├── condition.ts             # 컨디션 관련 타입
│   └── workout.ts               # 운동 관련 타입
└── middleware.ts                # Next.js 미들웨어 (라우트 보호)
```

## 🔗 파일 간 연관성 및 의존성

### 📊 아키텍처 다이어그램
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Pages (app/)                                               │
│  ├── page.tsx ──────────────┐                              │
│  ├── dashboard/page.tsx ────┼───┐                          │
│  ├── survey/page.tsx ───────┼───┼───┐                      │
│  └── layout.tsx ────────────┘   │   │                      │
│                                 │   │                      │
│  Components                      │   │                      │
│  ├── NavBar.tsx ────────────────┘   │                      │
│  ├── forms/ ────────────────────────┼───┐                  │
│  │   ├── InbodyForm.tsx             │   │                  │
│  │   ├── WorkoutLogForm.tsx         │   │                  │
│  │   ├── MealLogForm.tsx            │   │                  │
│  │   └── DailyConditionForm.tsx     │   │                  │
│  └── dashboard/ ────────────────────┘   │                  │
│      ├── KPIHeader.tsx                 │                  │
│      ├── HealthCalendar.tsx            │                  │
│      └── DailyLogView.tsx ─────────────┘                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Actions (Server Actions)                                   │
│  ├── body.ts ──────────────┐                               │
│  ├── conditions.ts ────────┼───┐                           │
│  ├── meals.ts ─────────────┼───┼───┐                       │
│  ├── workouts.ts ──────────┼───┼───┼───┐                   │
│  └── common/hooks.ts ──────┘   │   │   │                   │
│                                │   │   │                   │
│  Types                         │   │   │                   │
│  ├── condition.ts ─────────────┘   │   │                   │
│  ├── meal.ts ─────────────────────┘   │                   │
│  └── workout.ts ─────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  Lib                                                         │
│  ├── supabase.ts ──────────┐                                │
│  ├── supabase/server.ts ───┼───┐                            │
│  ├── authTypes.ts ─────────┼───┼───┐                        │
│  ├── utils.ts ─────────────┼───┼───┼───┐                    │
│  └── datas/Metatype.json ──┘   │   │   │                    │
│                                 │   │   │                    │
│  Database (Supabase)            │   │   │                    │
│  ├── daily_conditions ─────────┘   │   │                    │
│  ├── inbody_logs ──────────────────┘   │                    │
│  ├── workout_sessions ─────────────────┘                    │
│  └── meal_events ──────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

### 🔄 주요 Import 의존성

#### **1. 페이지 레벨 의존성**
```typescript
// src/app/dashboard/page.tsx
import { auth } from '@/lib/supabase'                    // 인증
import { UserProfile } from '@/lib/authTypes'            // 타입
import KPIHeaderClient from '@/components/dashboard/...' // 대시보드 컴포넌트들
import InbodyForm from '@/components/forms/...'          // 폼 컴포넌트들
import Container from '@/components/ui/Container'        // UI 컴포넌트
```

#### **2. 컴포넌트 간 의존성**
```typescript
// src/components/dashboard/DailyLogView.tsx
import { supabase, auth } from '@/lib/supabase'          // 데이터베이스
import DailyConditionForm from '@/components/forms/...'  // 폼 컴포넌트들
import WorkoutLogForm from '@/components/forms/...'      // 폼 컴포넌트들
```

#### **3. 서버 액션 의존성**
```typescript
// src/actions/body.ts
import { createClient } from '@/lib/supabase/server'     // 서버 클라이언트
import { afterLogSave } from '@/actions/common/hooks'    // 공통 훅

// src/actions/conditions.ts
import { ConditionPayload } from '@/types/condition'     // 타입 정의
```

#### **4. 타입 시스템 의존성**
```typescript
// src/types/meal.ts
export type MealForm = { ... }                          // 폼 데이터 타입

// src/components/forms/MealLogForm.tsx
import { MealForm } from '@/types/meal'                  // 타입 사용

// src/actions/meals.ts
import { MealForm } from '@/types/meal'                  // 서버 액션에서 타입 사용
```

### 🏗️ 아키텍처 패턴

#### **1. 계층화된 구조**
- **Presentation Layer**: `app/`, `components/`
- **Business Logic Layer**: `actions/`, `types/`
- **Data Layer**: `lib/`, Supabase

#### **2. 의존성 방향**
```
Pages → Components → Actions → Lib → Database
  ↓        ↓         ↓       ↓
Types ←─── Types ←── Types ← Types
```

#### **3. 주요 데이터 플로우**
```
1. 사용자 입력 → Form Component
2. Form Component → Server Action
3. Server Action → Supabase Database
4. Database → SWR/useEffect → Component State
5. Component State → UI 렌더링
```

### 🔧 핵심 의존성 매트릭스

| 파일 | 주요 의존성 | 역할 |
|------|-------------|------|
| `dashboard/page.tsx` | 모든 폼/차트 컴포넌트 | 메인 대시보드 |
| `NavBar.tsx` | `@/lib/supabase`, `@/lib/authTypes` | 전역 네비게이션 |
| `MealLogForm.tsx` | `@/types/meal`, `@/actions/meals` | 식사 기록 |
| `KPIHeader.tsx` | `@/lib/supabase/server` | KPI 데이터 조회 |
| `actions/body.ts` | `@/lib/supabase/server` | 체성분 데이터 처리 |
| `lib/supabase.ts` | 환경변수 | 데이터베이스 클라이언트 |

### 📋 상세 컴포넌트 의존성

#### **폼 컴포넌트들**
```typescript
// InbodyForm.tsx
import { saveInbodyLog } from '@/actions/body'           // 체성분 저장 액션
import { InbodyFormInner } from '@/components/internal/...' // 내부 컴포넌트

// WorkoutLogForm.tsx  
import { saveWorkout } from '@/actions/workouts'         // 운동 저장 액션
import { WorkoutPayload } from '@/types/workout'         // 운동 타입

// MealLogForm.tsx
import { saveMeal } from '@/actions/meals'               // 식사 저장 액션
import { MealForm } from '@/types/meal'                  // 식사 타입
import { searchFood } from '@/lib/food/searchFood'       // 음식 검색

// DailyConditionForm.tsx
import { saveDailyCondition } from '@/actions/conditions' // 컨디션 저장 액션
import { ConditionPayload } from '@/types/condition'     // 컨디션 타입
```

#### **대시보드 컴포넌트들**
```typescript
// KPIHeader.tsx
import { createClient } from '@/lib/supabase/server'     // 서버 클라이언트
// → daily_conditions, inbody_logs, workout_sessions 테이블 조회

// HealthCalendar.tsx
import { supabase } from '@/lib/supabase'                // 클라이언트
// → 일별 건강 데이터 시각화

// DailyLogView.tsx
import { supabase, auth } from '@/lib/supabase'          // 데이터베이스 + 인증
import DailyConditionForm from '@/components/forms/...'  // 폼 컴포넌트들
// → 통합 로그 뷰

// InbodyTrendChart.tsx
import { LineChart, Line, XAxis, YAxis } from 'recharts' // 차트 라이브러리
// → 체성분 트렌드 시각화
```

#### **공통 컴포넌트들**
```typescript
// _FormShell.tsx
import { ProgressRing } from '@/components/ui/...'        // UI 컴포넌트
// → 폼 공통 레이아웃

// QuickAddRail.tsx
import { postLog } from '@/actions/common/...'            // 공통 액션
// → 빠른 추가 기능

// NavBar.tsx
import { auth } from '@/lib/supabase'                     // 인증
import { UserProfile } from '@/lib/authTypes'            // 사용자 타입
// → 전역 네비게이션
```

### 🔄 데이터 플로우 상세

#### **1. 체성분 데이터 플로우**
```
InbodyForm → saveInbodyLog() → Supabase → InbodyTrendChart
     ↓              ↓              ↓            ↓
사용자 입력 → 서버 액션 → 데이터베이스 → 차트 렌더링
```

#### **2. 운동 데이터 플로우**
```
WorkoutLogForm → saveWorkout() → workout_sessions + workout_sets
     ↓              ↓                    ↓
운동 입력 → 서버 액션 → 데이터베이스 저장 → VolumeTrendChart
```

#### **3. 식사 데이터 플로우**
```
MealLogForm → searchFood() → saveMeal() → meal_events + meal_items
     ↓            ↓            ↓              ↓
식사 입력 → 음식 검색 → 서버 액션 → 데이터베이스 → MealTrendChart
```

#### **4. 컨디션 데이터 플로우**
```
DailyConditionForm → saveDailyCondition() → daily_conditions
     ↓                    ↓                      ↓
컨디션 입력 → 서버 액션 → 데이터베이스 → HealthCalendar
```

### 🎯 핵심 의존성 체인

#### **인증 체인**
```
middleware.ts → auth.getCurrentUser() → NavBar → Dashboard
```

#### **타입 체인**
```
types/*.ts → actions/*.ts → components/forms/*.tsx
```

#### **데이터 체인**
```
lib/supabase.ts → actions/*.ts → components/dashboard/*.tsx
```

#### **UI 체인**
```
components/ui/*.tsx → components/forms/*.tsx → app/dashboard/page.tsx
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

1. **진단 시작** - 홈페이지에서 "무료 진단 시작" 버튼 클릭
2. **4가지 축 설문 완료**:
   - **E/O**: Energetic vs Organic (에너지 타입) - 아침형/저녁형
   - **C/I**: Calm vs Intense (스트레스 반응) - 차분형/민감형
   - **B/F**: Bacteroides vs Fiber (장내 미생물) - 단백질형/섬유형
   - **A/P**: Aerobic vs Power (운동 특성) - 지구력형/파워형
3. **개인 맞춤 결과 확인** - 16가지 타입 중 하나로 분류되어 상세한 건강 전략 제공

## 📊 대시보드 사용법

### 체성분 관리
- **인바디 측정값 기록** - 체중, 근육량, 체지방률 등
- **트렌드 분석** - 시간에 따른 체성분 변화 추이 확인

### 운동 로그
- **근력 운동** - 운동명, 세트, 횟수, 무게 기록
- **유산소 운동** - 달리기, 자전거, 로잉, 걷기 등
- **볼륨 분석** - 운동량 변화 추이 시각화

### 식사 관리
- **음식 검색** - 데이터베이스에서 음식 정보 검색
- **영양소 분석** - 탄수화물, 단백질, 지방, 섬유질 자동 계산
- **식사 패턴** - 아침/점심/저녁/간식 구분 기록

### 일일 컨디션
- **수면 관리** - 수면 시간, 수면의 질 평가
- **에너지/스트레스** - 시간대별 에너지와 스트레스 수준 기록
- **기분 일기** - 하루 일기, 감사 일기, 피드백 작성

### 빠른 추가
- **최근 프리셋 활용** - 이전에 기록한 데이터를 빠르게 재사용
- **원클릭 기록** - 자주 사용하는 운동이나 식사를 빠르게 추가

## 🚀 배포

### Vercel 배포
1. Vercel에 프로젝트 연결
2. 환경 변수를 Vercel 대시보드에 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 배포 완료!

## 📝 주요 코드 구조

### 데이터베이스 스키마
```sql
-- 주요 테이블들
daily_conditions     # 일일 컨디션 (수면, 기분, 에너지, 스트레스)
inbody_logs         # 인바디 측정값 (체중, 근육량, 체지방률)
workout_sessions    # 운동 세션 (근력/유산소)
workout_sets        # 운동 세트 (운동명, 세트, 횟수, 무게)
meal_events         # 식사 이벤트
meal_items          # 식사 아이템 (음식, 영양소)
```

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

### 서버 액션 (`src/actions/`)
```typescript
// 예: 체성분 데이터 저장
export async function saveInbodyLog(data: InbodyLogData) {
  const { data: result, error } = await supabase
    .from('inbody_logs')
    .insert(data)
    .select()
  return { result, error }
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

### 데이터베이스 오류
- Supabase 테이블이 올바르게 생성되었는지 확인
- RLS(Row Level Security) 정책이 설정되었는지 확인
- 마이그레이션 파일이 실행되었는지 확인

### 빌드 오류
- `npm install`로 의존성 재설치
- `npm run build`로 빌드 테스트
- TypeScript 오류가 있는지 확인

### 폼 제출 오류
- React Hook Form의 validation 규칙 확인
- 서버 액션의 에러 핸들링 확인
- Supabase 클라이언트 연결 상태 확인

## 🎯 현재 개발 상태

### ✅ 완료된 기능
- **인증 시스템** - 회원가입, 로그인, 로그아웃, 보호된 라우트
- **MetaType 16 진단** - 16가지 개인 맞춤형 건강 프로필 시스템
- **대시보드 UI** - 종합적인 건강 관리 인터페이스
- **체성분 관리** - 인바디 측정값 기록 및 트렌드 분석
- **운동 로그** - 근력/유산소 운동 기록 시스템
- **식사 관리** - 영양소 분석 및 식사 패턴 추적
- **일일 컨디션** - 수면, 기분, 에너지, 스트레스 관리
- **데이터 시각화** - 차트를 통한 트렌드 분석
- **빠른 추가** - 프리셋 기반 원클릭 기록

### 🚧 개발 중인 기능
- **음식 데이터베이스** - 확장된 음식 정보 및 영양소 데이터
- **알림 시스템** - 건강 목표 달성 및 습관 형성 알림
- **데이터 내보내기** - 건강 데이터 CSV/PDF 내보내기

### 📋 향후 계획
- **모바일 앱** - React Native 기반 모바일 애플리케이션
- **소셜 기능** - 친구와의 건강 목표 공유 및 경쟁
- **AI 코칭** - 개인화된 건강 조언 및 추천 시스템
- **웨어러블 연동** - Apple Health, Google Fit 연동

## 📊 프로젝트 통계

- **총 컴포넌트**: 30+ 개
- **데이터베이스 테이블**: 6개
- **MetaType 프로필**: 16개
- **API 엔드포인트**: 10+ 개
- **테스트 커버리지**: Playwright 기반 E2E 테스트

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해주세요!
