import { createRouter, createWebHistory, type RouteRecordNameGeneric } from 'vue-router'

import { useUserStore } from '@/stores/user'

// 경로와 화면은 03 IA 번호 체계와 1:1이다 (07 §2). 화면을 추가하면 03 문서를 먼저 고친다.
export const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') }, // 1L
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@/views/LoginView.vue'),
  }, // 카카오 OAuth 콜백 — 화면 없음
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('@/views/OnboardingView.vue'),
  }, // 2-1
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') }, // 3-1
  { path: '/chat', name: 'chat', component: () => import('@/views/ChatView.vue') }, // 3-2
  { path: '/map', name: 'map', component: () => import('@/views/MapView.vue') }, // 3-3
  {
    path: '/map/behaviors/:behaviorId',
    name: 'behavior-detail',
    component: () => import('@/views/BehaviorDetailView.vue'),
  }, // Screen 08 — IA 문서 반영 대기
  {
    path: '/map/behaviors/:behaviorId/reviews',
    name: 'behavior-reviews',
    component: () => import('@/views/BehaviorReviewDetailView.vue'),
  }, // Screen 08-02 — IA 문서 반영 대기
  {
    path: '/transactions',
    name: 'transactions',
    component: () => import('@/views/TransactionsView.vue'),
  }, // 3-4
  { path: '/me', name: 'me', component: () => import('@/views/MyPageView.vue') }, // 4MP
  {
    path: '/me/budget',
    name: 'budget-settings',
    component: () => import('@/views/BudgetSettingsView.vue'),
  }, // Screen 24 — IA 문서 반영 대기
  {
    path: '/me/goals',
    name: 'goal-settings',
    component: () => import('@/views/GoalSettingsView.vue'),
  }, // Screen 25 — IA 문서 반영 대기
  {
    path: '/me/analysis-settings',
    name: 'analysis-settings',
    component: () => import('@/views/AnalysisSettingsView.vue'),
  }, // Screen 26 — IA 문서 반영 대기
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('@/views/NotificationView.vue'),
  }, // 4A
] as const

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...routes],
})

/** 진입 분기가 보는 상태. 라우터 밖에서도 검증할 수 있도록 이 두 값만 받는다. */
type EntryState = { signedIn: boolean; onboardingCompleted: boolean }

/**
 * 이름으로 판단하고, 로그인으로 보낼 때 돌아올 곳으로 `fullPath`를 쓴다.
 * `to` 전체를 받으면 테스트에서 라우트를 통째로 만들어야 한다.
 */
type EntryTarget = { name?: RouteRecordNameGeneric; fullPath: string }

/** 로그인 전에도 열려야 하는 화면. 여기까지 막으면 로그인할 방법이 없어진다. */
const publicRouteNames = new Set(['login', 'auth-callback'])

/**
 * FR-09-03 진입 분기. 보내야 하면 목적지를, 그대로 열어도 되면 null을 준다.
 *
 * - 로그인 전 → 어느 경로든 1L 로그인. 가려던 경로는 `redirect` 쿼리에 남겨 로그인 뒤 그대로 연다
 *   (홈은 로그인 뒤 기본 목적지라 남기지 않는다)
 * - 로그인했지만 온보딩 전 → 2-1 온보딩
 * - 둘 다 끝 → 원래 가려던 화면 (로그인 화면으로 되돌아오면 홈)
 */
export function entryRedirect(to: EntryTarget, state: EntryState) {
  const isPublic = typeof to.name === 'string' && publicRouteNames.has(to.name)

  if (!state.signedIn) {
    if (isPublic) return null
    return to.fullPath === '/'
      ? { name: 'login' }
      : { name: 'login', query: { redirect: to.fullPath } }
  }
  if (!state.onboardingCompleted) return to.name === 'onboarding' ? null : { name: 'onboarding' }
  return isPublic ? { name: 'home' } : null
}

// 분기 자체는 위 순수 함수가 갖는다. 여기서는 스토어에서 값을 꺼내 넘기기만 한다.
// 새로고침 직후에는 `sessionStorage`의 토큰으로 `GET /users/me`까지 되살린 뒤 분기해야
// 온보딩을 마친 사람이 온보딩으로 되튕기지 않는다. 복원은 한 번만 돌고 이후 호출은 바로 끝난다.
router.beforeEach(async (to) => {
  const userStore = useUserStore()
  await userStore.restore()
  const { signedIn, onboardingCompleted } = userStore
  return entryRedirect(to, { signedIn, onboardingCompleted }) ?? true
})

export default router
