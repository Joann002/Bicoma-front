import { createRouter, createWebHistory } from 'vue-router'
import { getStoredToken } from '@/lib/api'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/share/:token',
      name: 'public-list',
      component: () => import('@/views/PublicListView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { auth: true },
      children: [
        { path: '', name: 'shelf', component: () => import('@/views/ShelfView.vue') },
        { path: 'items/new', name: 'item-new', component: () => import('@/views/ItemFormView.vue') },
        {
          path: 'items/:id',
          name: 'item-detail',
          component: () => import('@/views/ItemDetailView.vue'),
        },
        {
          path: 'items/:id/edit',
          name: 'item-edit',
          component: () => import('@/views/ItemFormView.vue'),
        },
        { path: 'import', name: 'import', component: () => import('@/views/ImportView.vue') },
        { path: 'loans', name: 'loans', component: () => import('@/views/LoansView.vue') },
        { path: 'stats', name: 'stats', component: () => import('@/views/StatsView.vue') },
        {
          path: 'recommendations',
          name: 'recommendations',
          component: () => import('@/views/RecommendationsView.vue'),
        },
        { path: 'shared', name: 'shared', component: () => import('@/views/SharedListsView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const authed = !!getStoredToken()
  if (to.meta.auth && !authed) return { name: 'login' }
  if (to.meta.guest && authed) return { name: 'shelf' }
  return true
})

export default router
