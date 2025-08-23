import { test, expect } from '@playwright/test'

test.use({ baseURL: 'http://localhost:3000' })

test.describe('Dashboard smoke', () => {
  test.beforeEach(async ({ context }) => {
    // E2E 모드
    process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH = '1'
    // 헤더 기반 우회도 추가 (미들웨어가 서버 런타임에서 env를 못 읽는 경우 대비)
    await context.setExtraHTTPHeaders({ 'x-e2e': '1' })
  })

  test('loads dashboard and renders KPI, calendar, sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible({ timeout: 15000 })

    // KPI 섹션(ConfidenceMeter placeholder 포함)
    await expect(page.getByText('오늘 단백질', { exact: true })).toBeVisible()
    await expect(page.getByText('권장 범위 대비', { exact: true })).toBeVisible()
    await expect(page.getByText('주간 운동 세션', { exact: true })).toBeVisible()
    await expect(page.getByText('최근 7일 평균 수면', { exact: true })).toBeVisible()

    // 캘린더
    await expect(page.getByRole('heading', { name: /건강 캘린더/ })).toBeVisible()

    // 사이드바 placeholder 혹은 내용
    // 날짜 선택 전
    await expect(page.getByText('날짜를 선택하세요')).toBeVisible()

    // 날짜 하나 클릭(달력 타일 첫 번째)
    const tiles = page.locator('.react-calendar__tile')
    await tiles.first().click()

    // 선택한 날짜 요약 카드 표시
    await expect(page.getByText('선택한 날짜 요약')).toBeVisible()

    // 빠른 추가 레일
    await expect(page.getByText('빠른 추가')).toBeVisible()
  })

  test('opens workout form from calendar sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    // 달력에서 첫 타일 클릭
    const tiles = page.locator('.react-calendar__tile')
    await expect(tiles.first()).toBeVisible({ timeout: 15000 })
    await tiles.first().click()

    // 사이드바의 "선택한 날짜 요약" 카드 범위 내에서 "운동" 클릭
    const summaryHeading = page.getByRole('heading', { name: /선택한 날짜 요약/ })
    await expect(summaryHeading).toBeVisible({ timeout: 15000 })
    await page.getByTestId('summary-workout').click()

    // 아래 확장 영역에서 운동 폼 입력이 보이는지 확인
    await expect(page.getByPlaceholder('운동명 (예: 벤치프레스)')).toBeVisible({ timeout: 15000 })
  })

  test('opens forms via tabs', async ({ page }) => {
    await page.goto('/dashboard?tab=meal')
    await page.waitForLoadState('domcontentloaded')
    // 초기 로딩을 식단 탭으로 강제하여 안정성 확보
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="tabbar"]') as HTMLElement | null
      return !!el && el.getAttribute('data-active') === 'meal'
    }, null, { timeout: 15000 })
    await expect(page.getByTestId('panel-meal')).toBeVisible({ timeout: 15000 })

    // 운동 탭 → 운동 폼
    await page.getByTestId('tab-workout').click()
    await expect(page.getByTestId('panel-workout')).toBeVisible({ timeout: 15000 })
    await expect(page.getByPlaceholder('운동명 (예: 벤치프레스)')).toBeVisible({ timeout: 15000 })
  })
})


