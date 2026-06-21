import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import HomeView from '../views/home/index.vue'

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
        component: () => import('../views/music/index.vue'),
        children: [
          {
            path: '',
            name: 'music',
            redirect: '/music/songs',
          },
          {
            path: 'songs',
            name: 'music-songs',
            meta: { title: '音乐' },
            component: () => import('../views/music/songs.vue'),
          },
          {
            path: 'albums',
            name: 'music-albums',
            meta: { title: '专辑' },
            component: () => import('../views/music/albums.vue'),
          },
        ],
      },
      {
        path: 'albums',
        name: 'albums',
        redirect: '/music/albums',
      },
      {
        path: 'photos',
        name: 'photos',
        meta: { title: '照片集' },
        component: () => import('../views/photos/index.vue'),
      },
      {
        path: 'about',
        name: 'about',
        meta: { title: '关于' },
        component: () => import('../views/about/index.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    meta: { title: '登录' },
    component: () => import('../views/login/index.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
