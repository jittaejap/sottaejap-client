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
    path: '/transactions',
    name: 'transactions',
    component: () => import('@/views/TransactionsView.vue'),
  }, // 3-4
  { path: '/me', name: 'me', component: () => import('@/views/MyPageView.vue') }, // 4MP
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
