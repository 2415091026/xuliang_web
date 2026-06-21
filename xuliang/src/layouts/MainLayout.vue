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

    <main :class="route.name === 'home' ? 'min-h-svh' : 'min-h-svh pt-24 max-[620px]:pt-[90px]'">
      <RouterView />
    </main>
<!-- 
    <footer class="bg-[#050609] px-[max(24px,calc((100vw_-_1180px)/2))] pb-8 pt-20 max-[620px]:px-[18px]">
      <div class="grid items-end gap-9 min-[921px]:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p class="mb-3 text-xs font-black uppercase text-[#f2b84b]">Keep Listening</p>
          <h2 class="m-0 font-serif text-[clamp(40px,6vw,84px)] font-black leading-[0.96] text-[#fff8ea]">继续听他的歌</h2>
          <p class="mt-[18px] max-w-[640px] text-base leading-8 text-[#fff8ea]/70">这里承接音乐平台、社交入口和版权信息。</p>
        </div>

        <div class="flex flex-wrap gap-2.5 min-[921px]:justify-end">
          <a
            class="rounded-full border border-white/15 px-3.5 py-2.5 text-[13px] font-black text-[#fff8ea]/70 transition hover:border-[#f2b84b]/50 hover:text-[#fff8ea] focus-visible:border-[#f2b84b]/50 focus-visible:text-[#fff8ea] focus-visible:outline-none"
            href="#"
            >微博</a
          >
          <a
            class="rounded-full border border-white/15 px-3.5 py-2.5 text-[13px] font-black text-[#fff8ea]/70 transition hover:border-[#f2b84b]/50 hover:text-[#fff8ea] focus-visible:border-[#f2b84b]/50 focus-visible:text-[#fff8ea] focus-visible:outline-none"
            href="#"
            >抖音</a
          >
          <a
            class="rounded-full border border-white/15 px-3.5 py-2.5 text-[13px] font-black text-[#fff8ea]/70 transition hover:border-[#f2b84b]/50 hover:text-[#fff8ea] focus-visible:border-[#f2b84b]/50 focus-visible:text-[#fff8ea] focus-visible:outline-none"
            href="#"
            >B站</a
          >
          <a
            class="rounded-full border border-white/15 px-3.5 py-2.5 text-[13px] font-black text-[#fff8ea]/70 transition hover:border-[#f2b84b]/50 hover:text-[#fff8ea] focus-visible:border-[#f2b84b]/50 focus-visible:text-[#fff8ea] focus-visible:outline-none"
            href="#"
            >网易云</a
          >
          <a
            class="rounded-full border border-white/15 px-3.5 py-2.5 text-[13px] font-black text-[#fff8ea]/70 transition hover:border-[#f2b84b]/50 hover:text-[#fff8ea] focus-visible:border-[#f2b84b]/50 focus-visible:text-[#fff8ea] focus-visible:outline-none"
            href="#"
            >QQ音乐</a
          >
        </div>
      </div>
    </footer> -->
  </div>
</template>
