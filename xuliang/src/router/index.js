import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        meta: { title: '首页' },
        component: HomeView,
      },
      {
        path: 'music',
        name: 'music',
        meta: { title: '音乐' },
        component: () => import('../views/MusicView.vue'),
      },
      {
        path: 'photos',
        name: 'photos',
        meta: { title: '照片集' },
        component: () => import('../views/PhotosView.vue'),
      },
      {
        path: 'about',
        name: 'about',
        meta: { title: '关于' },
        component: () => import('../views/AboutView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
