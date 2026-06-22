import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "../layouts/MainLayout.vue";
import HomeView from "../views/home/index.vue";

const routes = [
  {
    path: "/",
    component: MainLayout,
    children: [
      {
        path: "",
        name: "home",
        meta: { title: "首页" },
        component: HomeView,
      },
      {
        path: "music",
        component: () => import("../views/music/index.vue"),
        children: [
          {
            path: "",
            name: "music",
            redirect: "/music/songs",
          },
          {
            path: "songs",
            name: "music-songs",
            meta: { title: "音乐" },
            component: () => import("../views/music/songs.vue"),
          },
          {
            path: "albums",
            name: "music-albums",
            meta: { title: "专辑" },
            component: () => import("../views/music/albums.vue"),
          },
        ],
      },
      {
        path: "albums",
        name: "albums",
        redirect: "/music/albums",
      },
      {
        path: "photos",
        name: "photos",
        meta: { title: "照片集" },
        component: () => import("../views/photos/index.vue"),
      },
      {
        path: "community",
        name: "community",
        meta: { title: "社区" },
        component: () => import("../views/community/index.vue"),
      },
      {
        path: "community/post/:id",
        name: "community-detail",
        meta: { title: "帖子详情" },
        component: () => import("../views/community/detail.vue"),
      },
      {
        path: "about",
        name: "about",
        meta: { title: "关于" },
        component: () => import("../views/about/index.vue"),
      },
      {
        path: "user-center",
        component: () => import("../views/user/index.vue"),
        children: [
          {
            path: "",
            name: "user-center",
            meta: { title: "个人中心 - 我的主页" },
            component: () => import("../views/user/home.vue"),
          },
          {
            path: "posts",
            name: "user-center-posts",
            meta: { title: "个人中心 - 我的帖子" },
            component: () => import("../views/user/posts.vue"),
          },
          {
            path: "replies",
            name: "user-center-replies",
            meta: { title: "个人中心 - 我的回复" },
            component: () => import("../views/user/replies.vue"),
          },
          {
            path: "collects",
            name: "user-center-collects",
            meta: { title: "个人中心 - 我的收藏" },
            component: () => import("../views/user/collects.vue"),
          },
          {
            path: "messages",
            name: "user-center-messages",
            meta: { title: "个人中心 - 消息中心" },
            component: () => import("../views/user/messages.vue"),
          },
          {
            path: "settings",
            name: "user-center-settings",
            meta: { title: "个人中心 - 系统设置" },
            component: () => import("../views/user/settings.vue"),
          },
        ]
      },
    ],
  },
  {
    path: "/login",
    name: "login",
    meta: { title: "登录" },
    component: () => import("../views/login/index.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
