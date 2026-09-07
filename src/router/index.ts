import { createRouter, createWebHistory } from 'vue-router'

// 경로와 화면은 03 IA 번호 체계와 1:1이다 (07 §2). 화면을 추가하면 03 문서를 먼저 고친다.
export const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') }, // 1L
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('@/views/OnboardingView.vue'),
  }, // 2-1
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') }, // 3-1
  { path: '/chat', name: 'chat', component: () => import('@/views/ChatView.vue') }, // 3-2
  { path: '/map', name: 'map', component: () => import('@/views/MapView.vue') }, // 3-3
  {
    path: '/map/behavior',
    name: 'behavior-detail',
    component: () => import('@/views/BehaviorDetailView.vue'),
  }, // Screen 08 — IA 문서 반영 대기
  {
    path: '/map/behavior/reviews',
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

export default router
