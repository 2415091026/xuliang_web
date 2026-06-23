<script setup>
import { useRoute } from "vue-router";
import AppNav from "../components/AppNav.vue";

const route = useRoute();
</script>

<template>
  <div
    class="min-h-svh overflow-x-hidden bg-[#08090d] text-[#fff8ea] [background:radial-gradient(circle_at_12%_8%,rgba(255,79,63,0.24),transparent_34vw),radial-gradient(circle_at_78%_12%,rgba(99,215,231,0.18),transparent_30vw),linear-gradient(180deg,#08090d_0%,#101018_42%,#08090d_100%)] [font-family:'Avenir_Next','PingFang_SC','Microsoft_YaHei',sans-serif]"
  >
    <header class="relative z-[70]">
      <AppNav />
    </header>

    <main :class="route.name === 'home' ? 'min-h-svh' : 'min-h-svh pt-20'">
      <RouterView />
    </main>

  </div>
</template>
